import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const getContent = async (req: Request, res: Response) => {
    const { key } = req.params;

    try {
        const content = await prisma.pageContent.findUnique({
            where: { key }
        });

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json(content.content);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
};

export const updateContent = async (req: Request, res: Response) => {
    const { key } = req.params;
    const data = req.body;

    try {
        const content = await prisma.pageContent.upsert({
            where: { key },
            update: { content: data },
            create: { key, content: data }
        });

        res.json(content.content);
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Failed to update content' });
    }
};

// Check if user is the Elite Ranking winner and can claim reward
export const checkEliteRankingWinner = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Get top 1 user by trophies
        const topUser = await prisma.user.findFirst({
            orderBy: { trophies: 'desc' },
            select: { id: true, name: true, trophies: true }
        });

        if (!topUser) {
            return res.json({ isWinner: false });
        }

        const isWinner = topUser.id === userId;

        // Get reward config
        const rewardContent = await prisma.pageContent.findUnique({
            where: { key: 'elite-ranking-reward' }
        });

        if (!rewardContent || !rewardContent.content) {
            return res.json({ isWinner, hasReward: false });
        }

        const rewardConfig = rewardContent.content as any;
        if (rewardConfig.rewardType === 'none') {
            return res.json({ isWinner, hasReward: false });
        }

        // Check if reward was already claimed this month
        const now = new Date();
        const monthKey = `elite-ranking-claim-${now.getFullYear()}-${now.getMonth() + 1}`;
        
        const claimRecord = await prisma.pageContent.findUnique({
            where: { key: monthKey }
        });

        const alreadyClaimed = claimRecord?.content ? (claimRecord.content as any).claimed : false;
        const claimedByUserId = claimRecord?.content ? (claimRecord.content as any).userId : null;

        // Check if it's the last day of the month
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const isLastDayOfMonth = currentDay === lastDayOfMonth; // Only last day of month

        res.json({
            isWinner,
            hasReward: true,
            canClaim: isWinner && !alreadyClaimed && isLastDayOfMonth,
            alreadyClaimed: alreadyClaimed && claimedByUserId === userId,
            daysUntilClaim: isLastDayOfMonth ? 0 : lastDayOfMonth - currentDay,
            reward: {
                type: rewardConfig.rewardType,
                amount: rewardConfig.rewardAmount,
                productName: rewardConfig.rewardProductName,
                description: rewardConfig.rewardDescription
            }
        });
    } catch (error) {
        console.error('Error checking elite ranking winner:', error);
        res.status(500).json({ error: 'Failed to check winner status' });
    }
};

// Claim the Elite Ranking reward
export const claimEliteRankingReward = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify user is the winner
        const topUser = await prisma.user.findFirst({
            orderBy: { trophies: 'desc' },
            select: { id: true }
        });

        if (!topUser || topUser.id !== userId) {
            return res.status(403).json({ error: 'Você não é o líder do ranking' });
        }

        // Get reward config
        const rewardContent = await prisma.pageContent.findUnique({
            where: { key: 'elite-ranking-reward' }
        });

        if (!rewardContent || !rewardContent.content) {
            return res.status(400).json({ error: 'Nenhum prêmio configurado' });
        }

        const rewardConfig = rewardContent.content as any;
        if (rewardConfig.rewardType === 'none') {
            return res.status(400).json({ error: 'Nenhum prêmio configurado' });
        }

        // Check if already claimed this month
        const now = new Date();
        const monthKey = `elite-ranking-claim-${now.getFullYear()}-${now.getMonth() + 1}`;
        
        const existingClaim = await prisma.pageContent.findUnique({
            where: { key: monthKey }
        });

        if (existingClaim?.content && (existingClaim.content as any).claimed) {
            return res.status(400).json({ error: 'Prêmio já foi resgatado este mês' });
        }

        // Award the reward
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        let rewardMessage = '';

        if (rewardConfig.rewardType === 'zions_points') {
            await prisma.user.update({
                where: { id: userId },
                data: { zions: { increment: rewardConfig.rewardAmount || 0 } }
            });
            
            await prisma.zionHistory.create({
                data: {
                    userId,
                    amount: rewardConfig.rewardAmount || 0,
                    reason: 'Elite Ranking - 1º Lugar do Mês'
                }
            });

            rewardMessage = `${rewardConfig.rewardAmount?.toLocaleString()} Zions Points`;
        } else if (rewardConfig.rewardType === 'zions_cash') {
            await prisma.user.update({
                where: { id: userId },
                data: { zionsCash: { increment: rewardConfig.rewardAmount || 0 } }
            });

            rewardMessage = `R$ ${rewardConfig.rewardAmount?.toFixed(2)} em Zions Cash`;
        } else if (rewardConfig.rewardType === 'product') {
            // Create notification for admin to send the product
            await prisma.notification.create({
                data: {
                    userId: userId,
                    type: 'SYSTEM',
                    content: JSON.stringify({
                        title: 'Prêmio Resgatado!',
                        message: `Você resgatou o prêmio: ${rewardConfig.rewardProductName}. Entre em contato com a administração para receber seu prêmio.`
                    }),
                    read: false
                }
            });

            rewardMessage = rewardConfig.rewardProductName || 'Produto Especial';
        }

        // Record the claim
        await prisma.pageContent.upsert({
            where: { key: monthKey },
            update: {
                content: {
                    claimed: true,
                    userId: userId,
                    userName: user.name,
                    rewardType: rewardConfig.rewardType,
                    rewardAmount: rewardConfig.rewardAmount,
                    rewardProductName: rewardConfig.rewardProductName,
                    claimedAt: new Date().toISOString()
                }
            },
            create: {
                key: monthKey,
                content: {
                    claimed: true,
                    userId: userId,
                    userName: user.name,
                    rewardType: rewardConfig.rewardType,
                    rewardAmount: rewardConfig.rewardAmount,
                    rewardProductName: rewardConfig.rewardProductName,
                    claimedAt: new Date().toISOString()
                }
            }
        });

        // Send notification
        await prisma.notification.create({
            data: {
                userId: userId,
                type: 'SYSTEM',
                content: JSON.stringify({
                    title: '🏆 Parabéns, Campeão!',
                    message: `Você resgatou seu prêmio do Elite Ranking: ${rewardMessage}`
                }),
                read: false
            }
        });

        res.json({
            success: true,
            message: `Prêmio resgatado com sucesso: ${rewardMessage}`,
            reward: rewardMessage
        });
    } catch (error) {
        console.error('Error claiming elite ranking reward:', error);
        res.status(500).json({ error: 'Failed to claim reward' });
    }
};
