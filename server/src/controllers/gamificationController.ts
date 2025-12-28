import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRanking = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { trophies: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                points: true, // Keeping points for compatibility, but ordering by trophies
                trophies: true,
                avatarUrl: true,
            },
        });
        // Map points to trophies if frontend expects points but means trophies
        const formattedUsers = users.map(u => ({
            ...u,
            points: u.trophies // Override points with trophies for display consistency
        }));
        res.json(formattedUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ranking' });
    }
};

export const getBadges = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;

        // Auto-award "Primeiros Passos" if missing (self-healing)
        const firstStepsBadge = await prisma.badge.findFirst({ where: { name: 'Primeiros Passos' } });
        if (firstStepsBadge) {
            const hasBadge = await prisma.userBadge.findUnique({
                where: { userId_badgeId: { userId, badgeId: firstStepsBadge.id } }
            });
            if (!hasBadge) {
                await prisma.$transaction([
                    prisma.userBadge.create({
                        data: { userId, badgeId: firstStepsBadge.id }
                    }),
                    prisma.notification.create({
                        data: {
                            userId,
                            type: 'BADGE',
                            content: `Você desbloqueou a conquista: ${firstStepsBadge.name}! (+${firstStepsBadge.trophies} Troféus)`,
                        }
                    })
                ]);
            }
        }

        const allBadges = await prisma.badge.findMany();
        const userBadges = await prisma.userBadge.findMany({
            where: { userId },
        });

        const badgesWithStatus = allBadges.map((badge) => ({
            ...badge,
            isEarned: userBadges.some((ub) => ub.badgeId === badge.id),
        }));

        res.json(badgesWithStatus);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
};

export const getRewards = async (req: Request, res: Response) => {
    try {
        const rewards = await prisma.reward.findMany({
            where: { stock: { gt: 0 } },
            orderBy: { costZions: 'asc' }
        });
        res.json(rewards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rewards' });
    }
};

export const createReward = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, type, costZions, stock, metadata, backgroundColor } = req.body;
        const reward = await prisma.reward.create({
            data: {
                title,
                type,
                costZions,
                stock,
                metadata,
                backgroundColor
            }
        });
        res.status(201).json(reward);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create reward' });
    }
};

export const deleteReward = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Delete related redemptions first (cascading delete manually)
        await prisma.redemption.deleteMany({
            where: { rewardId: id }
        });

        await prisma.reward.delete({ where: { id } });
        res.json({ message: 'Reward deleted' });
    } catch (error) {
        console.error('Failed to delete reward:', error);
        res.status(500).json({ error: 'Failed to delete reward' });
    }
};

export const redeemReward = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const { rewardId } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const reward = await prisma.reward.findUnique({ where: { id: rewardId } });

        if (!user || !reward) {
            return res.status(404).json({ error: 'User or Reward not found' });
        }

        if (reward.stock <= 0) {
            return res.status(400).json({ error: 'Reward out of stock' });
        }

        if (user.zions < reward.costZions) {
            return res.status(400).json({ error: 'Insufficient Zions' });
        }

        // Check 1h cooldown
        const lastRedemption = await prisma.redemption.findFirst({
            where: { userId },
            orderBy: { redeemedAt: 'desc' }
        });

        if (lastRedemption) {
            const now = new Date();
            const lastDate = new Date(lastRedemption.redeemedAt);
            const diff = now.getTime() - lastDate.getTime();
            const hours = diff / (1000 * 60 * 60);

            if (hours < 1) {
                const minutesLeft = Math.ceil((1 - hours) * 60);
                return res.status(400).json({ error: `Aguarde ${minutesLeft} minutos para resgatar outra recompensa.` });
            }
        }

        // Transaction to ensure atomicity
        const ticketCode = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${reward.id.slice(0, 4).toUpperCase()}-${reward.costZions}`;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { zions: { decrement: reward.costZions } }
            }),
            prisma.reward.update({
                where: { id: rewardId },
                data: { stock: { decrement: 1 } }
            }),
            prisma.redemption.create({
                data: {
                    userId,
                    rewardId,
                    cost: reward.costZions
                }
            }),
            prisma.zionHistory.create({
                data: {
                    userId,
                    amount: -reward.costZions,
                    reason: `Redeemed reward: ${reward.title}`
                }
            })
        ]);

        res.json({ success: true, message: 'Reward redeemed successfully', code: { code: ticketCode } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to redeem reward' });
    }
};

export const getDailyLoginStatus = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if claimed today
        const lastClaim = await prisma.zionHistory.findFirst({
            where: {
                userId,
                reason: { startsWith: 'Daily Login' },
            },
            orderBy: { createdAt: 'desc' }
        });

        let claimed = false;
        let streak = 0;

        if (lastClaim) {
            const lastClaimDate = new Date(lastClaim.createdAt);
            lastClaimDate.setHours(0, 0, 0, 0);

            if (lastClaimDate.getTime() === today.getTime()) {
                claimed = true;
            }

            // Calculate streak
            // This is a simplified streak calculation based on the last claim
            // If last claim was yesterday (or today), streak is valid.
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastClaimDate.getTime() === today.getTime() || lastClaimDate.getTime() === yesterday.getTime()) {
                // We need to fetch user's stored streak if we had one, but we don't.
                // For now, let's just infer from history? No, that's hard.
                // Let's assume a simple streak based on consecutive days in history is too hard to query efficiently without a field.
                // I'll add a temporary "mock" streak or try to query the last few days.

                // Let's try to find the streak by counting backwards from last claim
                // Actually, for this task, maybe I can just add `streak` to User model? 
                // The user didn't forbid schema changes.
                // But schema changes require migration.
                // I'll stick to a simpler approach: 
                // If last claim was yesterday, streak = last_streak + 1. 
                // But where is last_streak? 
                // Okay, I will add `streak` and `lastLoginDate` to User model. It's the right way.
            }
        }

        // Wait, I can't easily change schema and migrate in this environment without risk.
        // I will use a JSON field `metadata` in User if it exists? No.
        // I will use `bio`? No.
        // I will query the last 7 days of history to calculate streak.

        const recentClaims = await prisma.zionHistory.findMany({
            where: {
                userId,
                reason: { startsWith: 'Daily Login' },
                createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 10)) } // Last 10 days
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate streak from recentClaims
        streak = 0;
        let checkDate = new Date(today);
        // If not claimed today, start checking from yesterday
        if (!claimed) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Simple loop to count consecutive days
        for (let i = 0; i < 7; i++) {
            const found = recentClaims.find(c => {
                const cDate = new Date(c.createdAt);
                cDate.setHours(0, 0, 0, 0);
                return cDate.getTime() === checkDate.getTime();
            });
            if (found) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // If we are checking today and it's not claimed, we don't break yet, we already handled that by starting from yesterday.
                // If we are checking yesterday and it's missing, streak breaks.
                break;
            }
        }

        // Next reward
        const rewards = [5, 10, 15, 20, 25, 30, 50];
        const nextReward = rewards[streak % 7];

        res.json({ claimed, streak, nextReward, rewards });
    } catch (error) {
        console.error('Failed to fetch daily login status', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const dailyLogin = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingLogin = await prisma.zionHistory.findFirst({
            where: {
                userId,
                reason: { startsWith: 'Daily Login' },
                createdAt: { gte: today }
            }
        });

        if (existingLogin) {
            return res.json({ message: 'Daily login already claimed', claimed: true });
        }

        // Calculate streak again to determine reward
        const recentClaims = await prisma.zionHistory.findMany({
            where: {
                userId,
                reason: { startsWith: 'Daily Login' },
                createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 10)) }
            },
            orderBy: { createdAt: 'desc' }
        });

        let streak = 0;
        let checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

        for (let i = 0; i < 7; i++) {
            const found = recentClaims.find(c => {
                const cDate = new Date(c.createdAt);
                cDate.setHours(0, 0, 0, 0);
                return cDate.getTime() === checkDate.getTime();
            });
            if (found) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        const rewards = [5, 10, 15, 20, 25, 30, 50];
        const amount = rewards[streak % 7];

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { zions: { increment: amount } }
            }),
            prisma.zionHistory.create({
                data: {
                    userId,
                    amount: amount,
                    reason: `Daily Login (Day ${streak + 1})`
                }
            })
        ]);

        res.json({ message: 'Daily login claimed', claimed: false, awarded: amount, streak: streak + 1 });
    } catch (error) {
        console.error('Failed to process daily login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyRedemptions = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const redemptions = await prisma.redemption.findMany({
            where: { userId },
            include: { reward: true },
            orderBy: { redeemedAt: 'desc' }
        });
        res.json(redemptions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch redemptions' });
    }
};


