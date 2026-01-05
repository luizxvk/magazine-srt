import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// ... existing code ...

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        const isAdmin = requestUser?.role === 'ADMIN';

        const users = await prisma.user.findMany({
            orderBy: { trophies: 'desc' }, // Changed to trophies for ranking default
            select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                trophies: true,
                level: true,
                membershipType: true,
                // Admin only fields
                email: isAdmin,
                role: isAdmin,
                createdAt: isAdmin,
                zions: isAdmin,
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const requestingUserId = req.user?.userId;
        const targetUserId = req.params.id;

        const requestUser = await prisma.user.findUnique({
            where: { id: requestingUserId }
        });

        const isAdmin = requestUser?.role === 'ADMIN';
        const isSelf = requestingUserId === targetUserId;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;

        // Delete all related data (cascading manually if needed, but Prisma handles most if configured, 
        // here we rely on Prisma's onDelete: Cascade or manual cleanup if strictly required. 
        // For safety, we'll just delete the user and let Prisma error if constraints fail, 
        // or we can wrap in transaction to delete relations first)

        // Soft delete
        await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyRedemptions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const redemptions = await prisma.redemption.findMany({
            where: { userId },
            include: { reward: true },
            orderBy: { redeemedAt: 'desc' }
        });

        res.json(redemptions);
    } catch (error) {
        console.error('Error fetching redemptions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllRedemptions = async (req: AuthRequest, res: Response) => {
    try {
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const redemptions = await prisma.redemption.findMany({
            include: {
                reward: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { redeemedAt: 'desc' }
        });

        res.json(redemptions);
    } catch (error) {
        console.error('Error fetching all redemptions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;

        // Generate random password
        const generatedPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(generatedPassword, salt);

        await prisma.user.update({
            where: { id },
            data: { passwordHash }
        });

        res.json({ message: 'Password reset successfully', generatedPassword });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateProfileSchema = z.object({
    name: z.string().min(2).optional().or(z.literal('')),
    displayName: z.string().optional().or(z.literal('')),
    bio: z.string().max(500).optional().or(z.literal('')),
    avatarUrl: z.string().optional().or(z.literal('')),
    trophies: z.number().optional(),
    level: z.number().min(1).max(30).optional(),
    zions: z.number().min(0).optional(),
});

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                role: true,
                points: true,
                trophies: true,
                zions: true,
                level: true,
                createdAt: true,
                membershipType: true,
            },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const data = updateProfileSchema.parse(req.body);

        // Security Check: Only ADMIN can update level, trophies, zions
        if ((data.level !== undefined || data.zions !== undefined) && req.user?.role !== 'ADMIN') {
            // Strip them or throw error? Let's strip them to be safe or throw.
            // Given the context, throwing might be better to signal unauthorized attempt if someone tries.
            return res.status(403).json({ error: 'You are not authorized to update level or zions.' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                role: true,
                points: true,
                trophies: true,
                level: true,
                updatedAt: true,
            },
        });

        res.json(user);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                level: true,
                trophies: true,
                createdAt: true,
                membershipType: true,
            },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user posts
export const getUserPosts = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const posts = await prisma.post.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        avatarUrl: true,
                        trophies: true,
                    },
                },
                likes: true,
                tags: true,
            },
        });

        const formattedPosts = posts.map((post: any) => ({
            id: post.id,
            caption: post.caption,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            createdAt: post.createdAt,
            isHighlight: post.isHighlight,
            tags: post.tags,
            isLiked: post.likes.some((like: any) => like.userId === req.user?.userId),
        }));

        res.json(formattedPosts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUserMembership = async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;
        const { membershipType } = req.body;

        if (!['MAGAZINE', 'MGT'].includes(membershipType)) {
            return res.status(400).json({ error: 'Invalid membership type' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { membershipType },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                membershipType: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user membership:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUserLevel = async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;
        const { level } = req.body;

        if (typeof level !== 'number' || level < 1 || level > 30) {
            return res.status(400).json({ error: 'Level must be a number between 1 and 30' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { level },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                level: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user level:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRecentMembers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                role: true,
                membershipType: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching recent members:', error);
        res.status(500).json({ error: 'Failed to fetch recent members' });
    }
};
