import { Request, Response } from 'express';
import { PrismaClient, ThemePackRarity } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// Drop Rates
const RATES = {
    [ThemePackRarity.COMMON]: 0.60,
    [ThemePackRarity.RARE]: 0.25,
    [ThemePackRarity.EPIC]: 0.12,
    [ThemePackRarity.LEGENDARY]: 0.03
};

// Zions compensation for duplicates
const DUPLICATE_COMPENSATION = {
    [ThemePackRarity.COMMON]: 300,
    [ThemePackRarity.RARE]: 500,
    [ThemePackRarity.EPIC]: 800,
    [ThemePackRarity.LEGENDARY]: 1500
};

// Progressive costs
const COSTS = [0, 500, 1000, 2500, 5000];

export const openDailySupplyBox = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        // Get user info including supply box usage
        // Note: For now we'll use a simple counter in memory or just check logs?
        // Ideally we need to store "supplyBoxOpenedCount" in User.
        // Let's assume we can add it or infer from logs. 
        // Inferring is safer without schema change: count UserThemePack createdToday?
        // But user might get duplicates which aren't stored in UserThemePack.
        // Let's check if User has a field for this or if we should just modify the User model.
        // The user prompt is "always free first, then...".
        // Let's use a "supplyBoxOpens" field if it exists, or create a count based on ZionHistory "Supply Box" entries.

        // Count today's opens via ZionHistory (assuming every cost-incurring open is logged)
        // But the first one is free (cost 0), so it might not be in ZionHistory if we only log spend.
        // We should start logging 0 cost entries too.

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const opensToday = await prisma.zionHistory.count({
            where: {
                userId,
                reason: { startsWith: 'Supply Box Open' },
                createdAt: { gte: today }
            }
        });

        const costIndex = Math.min(opensToday, COSTS.length - 1);
        const cost = COSTS[costIndex];

        // Check balance if cost > 0
        if (cost > 0) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { zionsCash: true } });
            if (!user || user.zionsCash < cost) {
                return res.status(400).json({
                    error: `Saldo insuficiente. Custo: ${cost} Zions Cash.`,
                    nextCost: cost
                });
            }

            // Deduct cost
            await prisma.user.update({
                where: { id: userId },
                data: { zionsCash: { decrement: cost } }
            });
        }

        // Log the attempt (even if free) to track count
        await prisma.zionHistory.create({
            data: {
                userId,
                amount: -cost,
                reason: `Supply Box Open #${opensToday + 1}`
            }
        });

        // 1. Determine Rarity
        const rand = Math.random();
        let selectedRarity: ThemePackRarity = ThemePackRarity.COMMON;

        // Accumulative probability
        if (rand > 0.97) selectedRarity = ThemePackRarity.LEGENDARY;
        else if (rand > 0.85) selectedRarity = ThemePackRarity.EPIC;
        else if (rand > 0.60) selectedRarity = ThemePackRarity.RARE;

        // 2. Select a random pack of that rarity
        const packs = await prisma.themePack.findMany({
            where: { rarity: selectedRarity, isActive: true }
        });

        if (packs.length === 0) {
            return res.status(500).json({ error: 'Erro ao gerar loot: Sem packs disponíveis' });
        }

        const selectedPack = packs[Math.floor(Math.random() * packs.length)];

        // 3. Check if user already owns it
        const existingOwnership = await prisma.userThemePack.findUnique({
            where: {
                userId_packId: {
                    userId,
                    packId: selectedPack.id
                }
            }
        });

        let result = {
            type: 'NEW_ITEM',
            rarity: selectedRarity,
            item: selectedPack,
            compensation: 0,
            message: `Você ganhou: ${selectedPack.name}!`,
            nextCost: COSTS[Math.min(opensToday + 1, COSTS.length - 1)]
        };

        if (existingOwnership) {
            // Duplicate! Give Zions
            const compensation = DUPLICATE_COMPENSATION[selectedRarity];
            // Update user balance (Points or Cash? Usually Points for dupes, Cash for purchases)
            // Let's stick to Points (zions) as per previous logic
            await prisma.user.update({
                where: { id: userId },
                data: { zionsPoints: { increment: compensation } } // Changed to zionsPoints as per "zions" usually refers to points
            });

            result.type = 'DUPLICATE';
            result.compensation = compensation;
            result.message = `Duplicata: ${selectedPack.name}! Você recebeu ${compensation} Pontos.`;
        } else {
            // New Item! Add to collection
            await prisma.userThemePack.create({
                data: {
                    userId,
                    packId: selectedPack.id,
                    price: cost
                }
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Error opening supply box:', error);
        res.status(500).json({ error: 'Erro ao abrir Supply Box' });
    }
};

export const getSupplyBoxStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const opensToday = await prisma.zionHistory.count({
            where: {
                userId,
                reason: { startsWith: 'Supply Box Open' },
                createdAt: { gte: today }
            }
        });

        const costIndex = Math.min(opensToday, COSTS.length - 1);
        const cost = COSTS[costIndex];
        const nextCost = COSTS[Math.min(opensToday + 1, COSTS.length - 1)];

        res.json({
            opensToday,
            cost,
            nextCost,
            isFree: cost === 0
        });
    } catch (error) {
        console.error('Error fetching supply box status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
