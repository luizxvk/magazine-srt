import { Request, Response } from 'express';
import { getModerationLogs, getModerationStats } from '../services/moderationService';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

/**
 * GET /api/moderation/logs
 * Admin: List moderation logs with pagination and filters
 */
export const getLogs = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const type = req.query.type as 'IMAGE' | 'TEXT' | undefined;
        const action = req.query.action as 'BLOCKED' | 'FLAGGED' | 'WARNED' | 'ALLOWED' | undefined;

        const result = await getModerationLogs({ page, limit, type, action });
        res.json(result);
    } catch (error) {
        console.error('Error fetching moderation logs:', error);
        res.status(500).json({ error: 'Failed to fetch moderation logs' });
    }
};

/**
 * GET /api/moderation/stats
 * Admin: Get moderation statistics overview
 */
export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await getModerationStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching moderation stats:', error);
        res.status(500).json({ error: 'Failed to fetch moderation stats' });
    }
};
