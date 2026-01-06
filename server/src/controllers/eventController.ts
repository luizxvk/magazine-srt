import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEvents = async (_req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            where: { active: true },
            orderBy: { date: 'asc' }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, description, date, category, game, imageUrl } = req.body;

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                category,
                game,
                imageUrl
            }
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};
