import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendRewardRedemptionEmail } from '../services/emailVerificationService';
import { sendPushToUser } from './notificationController';
import { z } from 'zod';

// Validation schemas
const createRewardSchema = z.object({
    title: z.string().min(1).max(200),
    type: z.enum(['PRODUCT', 'COUPON', 'DIGITAL']),
    costZions: z.number().int().min(0),
    zionsReward: z.number().int().min(0).optional(),
    stock: z.number().int().min(-1).optional(), // -1 = unlimited
    isUnlimited: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    backgroundColor: z.string().max(50).optional(),
});

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
        const loggedUserId = req.user.userId;
        
        // Support fetching badges for another user via query param
        const targetUserId = req.query.userId as string || loggedUserId;

        // Auto-award "Primeiros Passos" if missing AND checking own badges (self-healing)
        if (targetUserId === loggedUserId) {
            const firstStepsBadge = await prisma.badge.findFirst({ where: { name: 'Primeiros Passos' } });
            if (firstStepsBadge) {
                const hasBadge = await prisma.userBadge.findUnique({
                    where: { userId_badgeId: { userId: loggedUserId, badgeId: firstStepsBadge.id } }
                });
                if (!hasBadge) {
                    await prisma.$transaction([
                        prisma.userBadge.create({
                            data: { userId: loggedUserId, badgeId: firstStepsBadge.id }
                        }),
                        prisma.notification.create({
                            data: {
                                userId: loggedUserId,
                                type: 'BADGE',
                                content: `Você desbloqueou a conquista: ${firstStepsBadge.name}! (+${firstStepsBadge.trophies} Troféus)`,
                            }
                        })
                    ]);
                }
            }
        }

        const allBadges = await prisma.badge.findMany();
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: targetUserId },
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
            where: {
                OR: [
                    { stock: { gt: 0 } },
                    { isUnlimited: true }
                ]
            },
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

        const data = createRewardSchema.parse(req.body);
        const reward = await prisma.reward.create({
            data: data as any
        });

        // Send push notification to all users about new reward
        const allUsers = await prisma.user.findMany({
            where: { deletedAt: null },
            select: { id: true }
        });

        // Send push to all users (async, don't wait)
        Promise.all(
            allUsers.map(user =>
                sendPushToUser(
                    user.id,
                    '🎁 Nova Recompensa Exclusiva!',
                    `${reward.title} está disponível para resgate!`,
                    { url: '/rewards', rewardId: reward.id, type: 'new_reward' }
                ).catch(() => {}) // Ignore individual failures
            )
        ).catch(err => console.error('[Push] Error sending new reward notifications:', err));

        res.status(201).json(reward);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to create reward' });
    }
};

// Schema for updating rewards
const updateRewardSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(['PRODUCT', 'COUPON', 'DIGITAL']).optional(),
    costZions: z.number().int().min(0).optional(),
    zionsReward: z.number().int().min(0).optional(),
    stock: z.number().int().min(-1).optional(),
    isUnlimited: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    backgroundColor: z.string().max(50).optional(),
});

export const updateReward = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const data = updateRewardSchema.parse(req.body);

        const existing = await prisma.reward.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Reward not found' });
        }

        const updated = await prisma.reward.update({
            where: { id },
            data: data as any
        });

        console.log(`[updateReward] Updated reward ${id}: costZions=${updated.costZions}, zionsReward=${updated.zionsReward}`);
        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        console.error('Failed to update reward:', error);
        res.status(500).json({ error: 'Failed to update reward' });
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

        if ((user.zionsPoints || 0) < reward.costZions) {
            return res.status(400).json({ error: 'Insufficient Zions Points' });
        }

        // Check if reward is unique and user has already redeemed it
        if (!reward.isUnlimited) {
            const alreadyRedeemed = await prisma.redemption.findFirst({
                where: { 
                    userId, 
                    rewardId 
                }
            });

            if (alreadyRedeemed) {
                return res.status(400).json({ error: 'Você já resgatou esta recompensa única.' });
            }
        }

        // Check 1h cooldown (only for unlimited rewards)
        if (reward.isUnlimited) {
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
        }

        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
        });

        // Transaction to ensure atomicity
        const ticketCode = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${reward.id.slice(0, 4).toUpperCase()}-${reward.costZions}`;

        // Calculate final zion change: cost minus reward
        const zionChange = reward.costZions - (reward.zionsReward || 0);
        
        console.log(`[redeemReward] User: ${user.name}, Reward: ${reward.title}`);
        console.log(`[redeemReward] costZions: ${reward.costZions}, zionsReward: ${reward.zionsReward}`);
        console.log(`[redeemReward] zionChange: ${zionChange} (positive = decrement, negative = increment)`);
        console.log(`[redeemReward] User current zionsPoints: ${user.zionsPoints}`);

        // Preparar operações de atualização de usuário
        const userUpdateData: any = {};
        if (zionChange > 0) {
            userUpdateData.zionsPoints = { decrement: zionChange };
        } else if (zionChange < 0) {
            userUpdateData.zionsPoints = { increment: Math.abs(zionChange) };
        }
        // Se zionChange é 0, não precisa atualizar zionsPoints

        const transactionOperations = [
            // Sempre incluir a atualização do usuário (mesmo que vazia para consistência)
            ...(Object.keys(userUpdateData).length > 0 ? [prisma.user.update({
                where: { id: userId },
                data: userUpdateData
            })] : []),
            prisma.reward.update({
                where: { id: rewardId },
                data: { stock: { decrement: 1 } }
            }),
            prisma.redemption.create({
                data: {
                    userId,
                    rewardId,
                    cost: reward.costZions,
                    status: 'PENDING',
                    metadata: { ticketCode }
                }
            }),
            prisma.zionHistory.create({
                data: {
                    userId,
                    amount: -reward.costZions,
                    reason: `Redeemed reward: ${reward.title}`
                }
            }),
        ];

        // Add zionsReward history if applicable
        if (reward.zionsReward && reward.zionsReward > 0) {
            transactionOperations.push(
                prisma.zionHistory.create({
                    data: {
                        userId,
                        amount: reward.zionsReward,
                        reason: `Recompensa: ${reward.title}`
                    }
                })
            );
        }

        // Notify User
        const userNotificationContent = reward.zionsReward && reward.zionsReward > 0
            ? `Parabéns por ter adquirido seus ${reward.zionsReward} Zions! Ticket: ${ticketCode}`
            : `Resgate confirmado! "${reward.title}" está sendo processado. Ticket: ${ticketCode}`;

        transactionOperations.push(
            prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM',
                    content: userNotificationContent
                }
            }) as any
        );
        
        // Notify Admins
        for (const admin of admins) {
            transactionOperations.push(
                prisma.notification.create({
                    data: {
                        userId: admin.id,
                        type: 'SYSTEM',
                        content: `NOVO RESGATE: ${user.name} resgatou "${reward.title}" (Ticket: ${ticketCode})`
                    }
                }) as any
            );
        }

        await prisma.$transaction(transactionOperations);

        // Fetch updated user to return in response
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { zionsPoints: true, zionsCash: true }
        });
        
        console.log(`[redeemReward] ✅ Success! User new zionsPoints: ${updatedUser?.zionsPoints}`);

        // Send confirmation email
        try {
            await sendRewardRedemptionEmail({
                to: user.email,
                name: user.name,
                rewardTitle: reward.title,
                ticketCode,
                costZions: reward.costZions
            });
            console.log(`✅ Email de resgate enviado para ${user.email}`);
        } catch (emailError) {
            console.error('⚠️ Falha ao enviar email de resgate:', emailError);
            // Email failure doesn't affect the redemption itself
        }

        res.json({ 
            success: true, 
            message: 'Reward redeemed successfully', 
            code: { code: ticketCode },
            updatedZionsPoints: updatedUser?.zionsPoints
        });
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
        
        // If already claimed today, include today in streak count
        if (claimed) {
            const found = recentClaims.find(c => {
                const cDate = new Date(c.createdAt);
                cDate.setHours(0, 0, 0, 0);
                return cDate.getTime() === today.getTime();
            });
            if (found) {
                streak = 1; // Today counts
                checkDate.setDate(checkDate.getDate() - 1); // Now check yesterday onwards
            }
        } else {
            // Not claimed today, start checking from yesterday
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Simple loop to count consecutive days backwards
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

        // Next reward - use modulo for cycling through week
        const rewards = [5, 10, 15, 20, 25, 30, 50];
        // If claimed, show reward for next day. If not, show today's potential reward
        const nextRewardIndex = claimed ? (streak % 7) : (streak % 7);
        const nextReward = rewards[nextRewardIndex];

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
                data: { zionsPoints: { increment: amount } }
            }),
            prisma.zionHistory.create({
                data: {
                    userId,
                    amount: amount,
                    reason: `Daily Login (Day ${streak + 1})`
                }
            })
        ]);

        // Check for Veterano badge (30 days since account creation)
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
        if (user) {
            const daysSinceCreation = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceCreation >= 30) {
                const badge = await prisma.badge.findFirst({ where: { name: 'Veterano' } });
                if (badge) {
                    const existing = await prisma.userBadge.findUnique({
                        where: { userId_badgeId: { userId, badgeId: badge.id } }
                    });
                    if (!existing) {
                        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
                        await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
                        await prisma.notification.create({
                            data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
                        });
                    }
                }
            }
        }

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

export const getZionsHistory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        
        const history = await prisma.zionHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to last 100 transactions
        });
        
        res.json(history);
    } catch (error) {
        console.error('Failed to fetch zion history:', error);
        res.status(500).json({ error: 'Failed to fetch zion history' });
    }
};


