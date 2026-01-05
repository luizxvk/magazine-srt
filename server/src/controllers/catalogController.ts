import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user's catalog photos
export const getCatalogPhotos = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { category, carValue, eventType, carBrand, isPublic, isFavorite } = req.query;

        const where: any = { userId };

        if (category) where.category = category;
        if (carValue) where.carValue = carValue;
        if (eventType) where.eventType = eventType;
        if (carBrand) where.carBrand = carBrand;
        if (isPublic !== undefined) where.isPublic = isPublic === 'true';
        if (isFavorite === 'true') where.isFavorite = true;

        const photos = await prisma.catalogPhoto.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true }
                }
            }
        });

        res.json(photos);
    } catch (error) {
        console.error('Error fetching catalog photos:', error);
        res.status(500).json({ error: 'Failed to fetch catalog photos' });
    }
};

// Get public catalog photos (for discovery)
export const getPublicCatalogPhotos = async (req: Request, res: Response) => {
    try {
        const { category, carValue, eventType, carBrand, limit = 20 } = req.query;

        const where: any = { isPublic: true };

        if (category) where.category = category;
        if (carValue) where.carValue = carValue;
        if (eventType) where.eventType = eventType;
        if (carBrand) where.carBrand = carBrand;

        const photos = await prisma.catalogPhoto.findMany({
            where,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true }
                }
            }
        });

        res.json(photos);
    } catch (error) {
        console.error('Error fetching public catalog photos:', error);
        res.status(500).json({ error: 'Failed to fetch public catalog photos' });
    }
};

// Add photo to catalog
export const addCatalogPhoto = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        console.log(`[DEBUG] Adding photo for user: ${userId}`);
        console.log(`[DEBUG] Raw Body:`, req.body);
        console.log(`[DEBUG] File:`, req.file);

        const { imageUrl, title, description, category, carValue, eventType, carBrand, isPublic } = req.body;

        let finalImageUrl = imageUrl;

        if (req.file) {
            // Construct full URL for the uploaded file
            const protocol = req.protocol;
            const host = req.get('host');
            finalImageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        if (!finalImageUrl) {
            console.error('[DEBUG] No image URL found');
            return res.status(400).json({ error: 'Image is required (URL or File)' });
        }

        // Helper to sanitize optional string fields from FormData
        const sanitize = (val: any) => {
            if (val === 'null' || val === 'undefined' || val === '' || val === null || val === undefined) {
                return null;
            }
            return String(val).trim();
        };

        const prismaData = {
            userId,
            imageUrl: finalImageUrl,
            title: sanitize(title),
            description: sanitize(description),
            category: sanitize(category),
            carValue: sanitize(carValue),
            eventType: sanitize(eventType),
            carBrand: sanitize(carBrand),
            isPublic: isPublic === 'true' || isPublic === true
        };

        console.log('[DEBUG] Prisma Create Data:', prismaData);

        const photo = await prisma.catalogPhoto.create({
            data: prismaData
        });

        console.log('[DEBUG] Photo created successfully:', photo.id);
        res.status(201).json(photo);
    } catch (error) {
        console.error('Error adding catalog photo:', error);
        res.status(500).json({ error: 'Failed to add catalog photo', details: String(error) });
    }
};

// Update catalog photo
export const updateCatalogPhoto = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { title, description, category, carValue, eventType, carBrand, isPublic, isFavorite } = req.body;

        // Verify ownership
        const existing = await prisma.catalogPhoto.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const updated = await prisma.catalogPhoto.update({
            where: { id },
            data: {
                title,
                description,
                category,
                carValue,
                eventType,
                carBrand,
                isPublic,
                isFavorite
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating catalog photo:', error);
        res.status(500).json({ error: 'Failed to update catalog photo' });
    }
};

// Delete catalog photo
export const deleteCatalogPhoto = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        // Verify ownership
        const existing = await prisma.catalogPhoto.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        await prisma.catalogPhoto.delete({ where: { id } });

        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Error deleting catalog photo:', error);
        res.status(500).json({ error: 'Failed to delete catalog photo' });
    }
};

// Toggle favorite
export const toggleFavorite = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const existing = await prisma.catalogPhoto.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const updated = await prisma.catalogPhoto.update({
            where: { id },
            data: { isFavorite: !existing.isFavorite }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
};

// Get filter options (unique values)
export const getFilterOptions = async (req: Request, res: Response) => {
    try {
        const [categories, carValues, eventTypes, carBrands] = await Promise.all([
            prisma.catalogPhoto.findMany({ where: { isPublic: true }, select: { category: true }, distinct: ['category'] }),
            prisma.catalogPhoto.findMany({ where: { isPublic: true }, select: { carValue: true }, distinct: ['carValue'] }),
            prisma.catalogPhoto.findMany({ where: { isPublic: true }, select: { eventType: true }, distinct: ['eventType'] }),
            prisma.catalogPhoto.findMany({ where: { isPublic: true }, select: { carBrand: true }, distinct: ['carBrand'] })
        ]);

        res.json({
            categories: categories.map(c => c.category).filter(Boolean),
            carValues: carValues.map(c => c.carValue).filter(Boolean),
            eventTypes: eventTypes.map(c => c.eventType).filter(Boolean),
            carBrands: carBrands.map(c => c.carBrand).filter(Boolean)
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ error: 'Failed to fetch filter options' });
    }
};
