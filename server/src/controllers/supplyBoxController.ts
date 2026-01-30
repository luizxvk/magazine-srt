import { Request, Response } from 'express';
import { PrismaClient, ThemePackRarity } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// Zions compensation for duplicates
const DUPLICATE_COMPENSATION = {
    [ThemePackRarity.COMMON]: 300,
    [ThemePackRarity.RARE]: 500,
    [ThemePackRarity.EPIC]: 800,
    [ThemePackRarity.LEGENDARY]: 1500
};

// Reward type weights (total = 100)
// 70% chance for Pack, 30% chance for Zions
const REWARD_TYPE_WEIGHTS = {
    PACK: 70,
    ZIONS: 30
};

// Zions bonus amounts by rarity
const ZIONS_BONUS = {
    COMMON: { min: 10, max: 50 },
    RARE: { min: 50, max: 100 },
    EPIC: { min: 100, max: 200 },
    LEGENDARY: { min: 200, max: 500 }
};

// Progressive costs
const COSTS = [0, 500, 1000, 2500, 5000];

// Helper function to select reward type based on weights
function selectRewardType(): string {
    const total = Object.values(REWARD_TYPE_WEIGHTS).reduce((a, b) => a + b, 0);
    const rand = Math.random() * total;
    
    if (rand <= REWARD_TYPE_WEIGHTS.PACK) {
        return 'PACK';
    }
    return 'ZIONS';
}

// Helper function to select rarity
function selectRarity(): ThemePackRarity {
    const rand = Math.random();
    if (rand > 0.97) return ThemePackRarity.LEGENDARY;
    if (rand > 0.85) return ThemePackRarity.EPIC;
    if (rand > 0.60) return ThemePackRarity.RARE;
    return ThemePackRarity.COMMON;
}

export const openDailySupplyBox = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

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
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { zionsPoints: true } });
            if (!user || user.zionsPoints < cost) {
                return res.status(400).json({
                    error: `Saldo insuficiente. Custo: ${cost} Zions Points.`,
                    nextCost: cost
                });
            }

            // Deduct cost
            await prisma.user.update({
                where: { id: userId },
                data: { zionsPoints: { decrement: cost } }
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

        // 1. Select reward type
        const rewardType = selectRewardType();
        const selectedRarity = selectRarity();
        const nextCost = COSTS[Math.min(opensToday + 1, COSTS.length - 1)];

        let result: any = {
            type: 'NEW_ITEM',
            rewardType,
            rarity: selectedRarity,
            item: null,
            compensation: 0,
            message: '',
            nextCost
        };

        // 2. Handle based on reward type
        if (rewardType === 'PACK') {
            // Get packs from database - try to match rarity first
            let packs = await prisma.themePack.findMany({
                where: { rarity: selectedRarity, isActive: true }
            });

            // If no packs of that rarity, get any active pack
            if (packs.length === 0) {
                packs = await prisma.themePack.findMany({
                    where: { isActive: true }
                });
            }

            if (packs.length === 0) {
                // No packs available - give Zions instead
                const bonus = 100;
                await prisma.user.update({
                    where: { id: userId },
                    data: { zionsPoints: { increment: bonus } }
                });
                result.rewardType = 'ZIONS';
                result.item = { id: 'zions_bonus', name: `${bonus} Zions`, value: bonus };
                result.message = `Bônus de Zions! Você ganhou ${bonus} Pontos!`;
                return res.json(result);
            }

            const selectedPack = packs[Math.floor(Math.random() * packs.length)];
            result.item = selectedPack;
            result.rarity = selectedPack.rarity;

            // Check if user already owns it
            const existingOwnership = await prisma.userThemePack.findUnique({
                where: {
                    userId_packId: {
                        userId,
                        packId: selectedPack.id
                    }
                }
            });

            if (existingOwnership) {
                const compensation = DUPLICATE_COMPENSATION[selectedPack.rarity] || 300;
                await prisma.user.update({
                    where: { id: userId },
                    data: { zionsPoints: { increment: compensation } }
                });
                result.type = 'DUPLICATE';
                result.compensation = compensation;
                result.message = `Duplicata: ${selectedPack.name}! Você recebeu ${compensation} Pontos.`;
            } else {
                await prisma.userThemePack.create({
                    data: {
                        userId,
                        packId: selectedPack.id,
                        price: cost
                    }
                });
                result.message = `Você ganhou o Pack: ${selectedPack.name}!`;
            }

        } else {
            // Zions bonus
            const bonusRange = ZIONS_BONUS[selectedRarity as keyof typeof ZIONS_BONUS] || ZIONS_BONUS.COMMON;
            const bonus = Math.floor(Math.random() * (bonusRange.max - bonusRange.min + 1)) + bonusRange.min;
            
            await prisma.user.update({
                where: { id: userId },
                data: { zionsPoints: { increment: bonus } }
            });

            result.item = { id: 'zions_bonus', name: `${bonus} Zions`, value: bonus };
            result.message = `Bônus de Zions! Você ganhou ${bonus} Pontos!`;
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
