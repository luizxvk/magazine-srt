import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createAnnouncementSchema = z.object({
    title: z.string().min(1).max(200),
    logoUrl: z.string().url().optional().nullable(),
    tag: z.string().max(50).optional().nullable(),
    subscriptionType: z.enum(['MAGAZINE', 'MGT', 'ALL']).optional(),
    description: z.string().max(1000).optional().nullable(),
    backgroundImageUrl: z.string().url().optional().nullable(),
    buttonText: z.string().max(50).optional().nullable(),
    link: z.string().url().optional().nullable(),
});

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const data = createAnnouncementSchema.parse(req.body);

        const announcement = await prisma.announcement.create({
            data: {
                ...data,
                active: true
            } as any
        });

        res.status(201).json(announcement);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
};

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
};

export const getActiveAnnouncement = async (req: Request, res: Response) => {
    try {
        const announcement = await prisma.announcement.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch active announcement' });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.announcement.delete({
            where: { id }
        });
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
};

export const toggleActive = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const announcement = await prisma.announcement.findUnique({ where: { id } });

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        const updated = await prisma.announcement.update({
            where: { id },
            data: { active: !announcement.active }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle active status' });
    }
};
