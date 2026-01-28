import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// Get all active theme packs
export const getAllThemePacks = async (req: Request, res: Response) => {
    try {
        const packs = await prisma.themePack.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json(packs);
    } catch (error) {
        console.error('Error fetching theme packs:', error);
        res.status(500).json({ error: 'Failed to fetch theme packs' });
    }
};

// Get user's purchased theme packs
export const getUserThemePacks = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userPacks = await prisma.userThemePack.findMany({
            where: { userId },
            include: {
                pack: true
            }
        });

        res.json(userPacks);
    } catch (error) {
        console.error('Error fetching user theme packs:', error);
        res.status(500).json({ error: 'Failed to fetch user theme packs' });
    }
};

// Purchase a theme pack
export const purchaseThemePack = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { packId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if pack exists
        const pack = await prisma.themePack.findUnique({
            where: { id: packId }
        });

        if (!pack || !pack.isActive) {
            return res.status(404).json({ error: 'Theme pack not found' });
        }

        // Check if user already owns the pack
        const existingPurchase = await prisma.userThemePack.findFirst({
            where: {
                userId,
                packId: packId
            }
        });

        if (existingPurchase) {
            return res.status(400).json({ error: 'You already own this pack' });
        }

        // Check stock if limited
        if (pack.maxStock && pack.soldCount >= pack.maxStock) {
            return res.status(400).json({ error: 'This pack is out of stock' });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { zionsPoints: true }
        });

        if (!user || user.zionsPoints < pack.price) {
            return res.status(400).json({ error: 'Insufficient Zions Points' });
        }

        // Execute transaction
        const result = await prisma.$transaction(async (tx) => {
            // Deduct points
            await tx.user.update({
                where: { id: userId },
                data: { zionsPoints: { decrement: pack.price } }
            });

            // Create purchase record
            const purchase = await tx.userThemePack.create({
                data: {
                    userId,
                    packId: packId,
                    price: pack.price
                },
                include: {
                    pack: true
                }
            });

            // Update sold count
            await tx.themePack.update({
                where: { id: packId },
                data: { soldCount: { increment: 1 } }
            });

            // Create history record
            await tx.zionHistory.create({
                data: {
                    userId,
                    amount: -pack.price,
                    reason: `Theme Pack: ${pack.name}`
                }
            });

            return purchase;
        });

        res.json({
            success: true,
            message: 'Theme pack purchased successfully!',
            purchase: result
        });
    } catch (error) {
        console.error('Error purchasing theme pack:', error);
        res.status(500).json({ error: 'Failed to purchase theme pack' });
    }
};

// Equip a theme pack (apply background + color + badge)
export const equipThemePack = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { packId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if user owns the pack
        const userPack = await prisma.userThemePack.findFirst({
            where: {
                userId,
                packId: packId
            },
            include: {
                pack: true
            }
        });

        if (!userPack) {
            return res.status(404).json({ error: 'You do not own this pack' });
        }

        const pack = userPack.pack;

        // Update user's equipped items (including badge from pack)
        await prisma.user.update({
            where: { id: userId },
            data: {
                equippedBackground: pack.backgroundUrl,
                equippedColor: pack.accentColor,
                equippedBadge: pack.badgeUrl || undefined // Equip pack badge if exists
            }
        });

        res.json({
            success: true,
            message: 'Theme pack equipped successfully!',
            pack: {
                backgroundUrl: pack.backgroundUrl,
                accentColor: pack.accentColor,
                badgeUrl: pack.badgeUrl
            }
        });
    } catch (error) {
        console.error('Error equipping theme pack:', error);
        res.status(500).json({ error: 'Failed to equip theme pack' });
    }
};
