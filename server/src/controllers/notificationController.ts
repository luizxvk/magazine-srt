import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (id === 'all') {
            await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true },
            });
        } else {
            await prisma.notification.update({
                where: { id, userId },
                data: { read: true },
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
