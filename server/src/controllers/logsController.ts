import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLogs = async (req: Request, res: Response) => {
    try {
        const { source, level, limit = 100 } = req.query;

        const where: any = {};
        if (source) where.source = String(source);
        if (level) where.level = String(level);

        const logs = await prisma.systemLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: Number(limit)
        });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

export const createLog = async (req: Request, res: Response) => {
    try {
        const { level, source, message, metadata } = req.body;

        const log = await prisma.systemLog.create({
            data: {
                level,
                source,
                message,
                metadata
            }
        });

        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create log' });
    }
};

export const clearLogs = async (req: Request, res: Response) => {
    try {
        await prisma.systemLog.deleteMany();
        res.json({ message: 'Logs cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear logs' });
    }
};
