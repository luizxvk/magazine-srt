import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Total users
        const totalUsers = await prisma.user.count({
            where: { deletedAt: null }
        });

        // New users today
        const newUsersToday = await prisma.user.count({
            where: {
                createdAt: { gte: oneDayAgo },
                deletedAt: null
            }
        });

        // Active users (last 24h)
        const activeUsers = await prisma.user.count({
            where: {
                lastSeenAt: { gte: oneDayAgo },
                deletedAt: null
            }
        });

        // Online now
        const onlineNow = await prisma.user.count({
            where: {
                isOnline: true,
                deletedAt: null
            }
        });

        // Total posts
        const totalPosts = await prisma.post.count({
            where: { isRemoved: false }
        });

        // Total comments
        const totalComments = await prisma.comment.count();

        // Stories (last 24h)
        const totalStories = await prisma.story.count({
            where: {
                createdAt: { gte: oneDayAgo }
            }
        });

        // Total messages
        const totalMessages = await prisma.message.count();

        res.json({
            totalUsers,
            activeUsers,
            totalPosts,
            totalComments,
            totalStories,
            totalMessages,
            onlineNow,
            newUsersToday
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
