import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Create badge for a user
export const createBadge = async (req: AuthRequest, res: Response) => {
    try {
        const { text, color, userId } = req.body;
        const adminId = req.user?.userId;

        if (!text || !color || !userId) {
            return res.status(400).json({ error: 'Text, color, and userId are required' });
        }

        // Validate user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const badge = await prisma.adminBadge.create({
            data: {
                text,
                color,
                userId,
                createdBy: adminId!,
            },
        });

        res.status(201).json(badge);
    } catch (error) {
        console.error('Error creating badge:', error);
        res.status(500).json({ error: 'Failed to create badge' });
    }
};

// Get all badges
export const getAllBadges = async (req: AuthRequest, res: Response) => {
    try {
        const badges = await prisma.adminBadge.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(badges);
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
};

// Get badges for a specific user
export const getUserBadges = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const badges = await prisma.adminBadge.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(badges);
    } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({ error: 'Failed to fetch user badges' });
    }
};

// Delete badge
export const deleteBadge = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.adminBadge.delete({
            where: { id },
        });

        res.json({ message: 'Badge deleted successfully' });
    } catch (error) {
        console.error('Error deleting badge:', error);
        res.status(500).json({ error: 'Failed to delete badge' });
    }
};

// Get available badge templates (pre-defined suggestions)
export const getBadgeTemplates = async (req: AuthRequest, res: Response) => {
    const templates = [
        { text: 'BETA', color: '#3B82F6' },
        { text: 'DEV', color: '#10B981' },
        { text: 'MGT', color: '#8B5CF6' },
        { text: 'VIP', color: '#F59E0B' },
        { text: 'ADMIN', color: '#EF4444' },
        { text: 'MOD', color: '#14B8A6' },
        { text: 'STAFF', color: '#6366F1' },
        { text: 'PRO', color: '#EC4899' },
    ];

    res.json(templates);
};
