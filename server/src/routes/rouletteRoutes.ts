import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

const SPIN_COST = 100; // Zions Points
const DAILY_SPIN_LIMIT = 3; // Max spins per day

// Prize pool with weighted probabilities
const prizePool = [
    { type: 'zions', value: 50, weight: 25 },      // 25% chance
    { type: 'zions', value: 100, weight: 20 },     // 20% chance
    { type: 'zions', value: 200, weight: 15 },     // 15% chance
    { type: 'xp', value: 50, weight: 15 },         // 15% chance
    { type: 'xp', value: 100, weight: 10 },        // 10% chance
    { type: 'empty', value: 0, weight: 8 },        // 8% chance (nothing)
    { type: 'zions', value: 500, weight: 4 },      // 4% chance
    { type: 'xp', value: 250, weight: 2 },         // 2% chance
    { type: 'zions', value: 1000, weight: 1 },     // 1% chance (jackpot!)
];

// Helper: Weighted random selection
function selectPrize() {
    const totalWeight = prizePool.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const prize of prizePool) {
        random -= prize.weight;
        if (random <= 0) {
            return prize;
        }
    }
    return prizePool[0]; // Fallback
}

// POST /roulette/spin - Spin the roulette
router.post('/spin', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.id;

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, zionsPoints: true, xp: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Check balance
        if (user.zionsPoints < SPIN_COST) {
            return res.status(400).json({ error: 'Zions insuficientes para girar' });
        }

        // Check daily limit (using cache or simple date check)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const spinsToday = await prisma.zionHistory.count({
            where: {
                userId: userId,
                reason: { startsWith: 'ROULETTE:' },
                createdAt: { gte: today }
            }
        });

        if (spinsToday >= DAILY_SPIN_LIMIT) {
            return res.status(400).json({ 
                error: `Limite diário atingido (${DAILY_SPIN_LIMIT} giros/dia)`,
                nextResetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            });
        }

        // Select prize
        const prize = selectPrize();
        
        // Calculate net zions change (cost - prize)
        let zionsChange = -SPIN_COST;
        let xpChange = 0;

        if (prize.type === 'zions') {
            zionsChange += prize.value;
        } else if (prize.type === 'xp') {
            xpChange = prize.value;
        }

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: {
                zionsPoints: { increment: zionsChange },
                xp: { increment: xpChange }
            }
        });

        // Log the spin
        await prisma.zionHistory.create({
            data: {
                userId: userId,
                amount: zionsChange,
                reason: `ROULETTE: ${prize.type === 'empty' ? 'Nada' : `+${prize.value} ${prize.type.toUpperCase()}`}`
            }
        });

        // Return result
        res.json({
            success: true,
            prize: {
                type: prize.type,
                value: prize.value,
                zionsWon: prize.type === 'zions' ? prize.value : 0,
                xpWon: prize.type === 'xp' ? prize.value : 0,
            },
            newBalance: user.zionsPoints + zionsChange,
            spinsRemaining: DAILY_SPIN_LIMIT - spinsToday - 1
        });

    } catch (error) {
        console.error('[Roulette] Spin error:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// GET /roulette/status - Get roulette status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const spinsToday = await prisma.zionHistory.count({
            where: {
                userId: userId,
                reason: { startsWith: 'ROULETTE:' },
                createdAt: { gte: today }
            }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { zionsPoints: true }
        });

        res.json({
            spinCost: SPIN_COST,
            spinsToday,
            spinsRemaining: DAILY_SPIN_LIMIT - spinsToday,
            dailyLimit: DAILY_SPIN_LIMIT,
            canSpin: spinsToday < DAILY_SPIN_LIMIT && (user?.zionsPoints || 0) >= SPIN_COST,
            balance: user?.zionsPoints || 0
        });

    } catch (error) {
        console.error('[Roulette] Status error:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

export default router;
