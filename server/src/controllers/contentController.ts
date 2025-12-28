import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
