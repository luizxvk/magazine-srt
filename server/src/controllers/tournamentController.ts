import { Request, Response } from 'express';
import { z } from 'zod';
import {
    createTournament,
    getTournaments,
    getTournamentById,
    registerTeam,
    unregisterTeam,
    generateBrackets,
    reportMatchResult,
    getLeaderboard,
    updateTournament,
    cancelTournament,
} from '../services/tournamentService';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Validation schemas
const createTournamentSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(2000).optional(),
    game: z.string().max(100).optional(),
    imageUrl: z.string().url().optional(),
    format: z.enum(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'FREE_FOR_ALL']),
    teamSize: z.number().int().min(1).max(10).default(1),
    maxTeams: z.number().int().min(2).max(128).default(16),
    prizePool: z.number().int().min(0).default(0),
    rules: z.string().max(5000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    eventId: z.string().uuid().optional(),
});

const registerTeamSchema = z.object({
    teamName: z.string().min(2).max(50),
    memberUserIds: z.array(z.string().uuid()).default([]),
});

const reportScoreSchema = z.object({
    score1: z.number().int().min(0),
    score2: z.number().int().min(0),
});

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/tournaments
 * List all tournaments (optional ?status= filter)
 */
export const list = async (req: Request, res: Response) => {
    try {
        const status = req.query.status as string | undefined;
        const tournaments = await getTournaments(status);
        res.json(tournaments);
    } catch (error) {
        console.error('Error listing tournaments:', error);
        res.status(500).json({ error: 'Failed to list tournaments' });
    }
};

/**
 * GET /api/tournaments/:id
 * Get full tournament details with brackets
 */
export const getById = async (req: Request, res: Response) => {
    try {
        const tournament = await getTournamentById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Torneio não encontrado' });
        }
        res.json(tournament);
    } catch (error) {
        console.error('Error getting tournament:', error);
        res.status(500).json({ error: 'Failed to get tournament' });
    }
};

/**
 * GET /api/tournaments/:id/leaderboard
 * Get tournament standings
 */
export const leaderboard = async (req: Request, res: Response) => {
    try {
        const standings = await getLeaderboard(req.params.id);
        res.json(standings);
    } catch (error: any) {
        console.error('Error getting leaderboard:', error);
        res.status(error.message === 'Torneio não encontrado' ? 404 : 500)
            .json({ error: error.message || 'Failed to get leaderboard' });
    }
};

// ============================================
// AUTHENTICATED ENDPOINTS (Users)
// ============================================

/**
 * POST /api/tournaments/:id/register
 * Register a team (user becomes captain)
 */
export const register = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Não autorizado' });

        const parsed = registerTeamSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
        }

        const { teamName, memberUserIds } = parsed.data;
        const allMembers = [userId, ...memberUserIds.filter(id => id !== userId)];

        const team = await registerTeam(req.params.id, teamName, userId, allMembers);
        res.status(201).json(team);
    } catch (error: any) {
        console.error('Error registering team:', error);
        res.status(400).json({ error: error.message || 'Failed to register team' });
    }
};

/**
 * DELETE /api/tournaments/:id/unregister
 * Captain leaves/unregisters their team
 */
export const unregister = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Não autorizado' });

        await unregisterTeam(req.params.id, userId);
        res.json({ message: 'Time removido do torneio' });
    } catch (error: any) {
        console.error('Error unregistering:', error);
        res.status(400).json({ error: error.message || 'Failed to unregister' });
    }
};

/**
 * POST /api/tournaments/matches/:matchId/report
 * Report a match result (captain or admin)
 */
export const reportScore = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'ADMIN';
        if (!userId) return res.status(401).json({ error: 'Não autorizado' });

        const parsed = reportScoreSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
        }

        const result = await reportMatchResult(
            req.params.matchId,
            parsed.data.score1,
            parsed.data.score2,
            userId
        );
        res.json(result);
    } catch (error: any) {
        console.error('Error reporting score:', error);
        res.status(400).json({ error: error.message || 'Failed to report score' });
    }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * POST /api/tournaments
 * Admin: Create a new tournament
 */
export const create = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Não autorizado' });

        const parsed = createTournamentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
        }

        const tournament = await createTournament({
            ...parsed.data,
            createdBy: userId,
        });

        res.status(201).json(tournament);
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ error: 'Failed to create tournament' });
    }
};

/**
 * PUT /api/tournaments/:id
 * Admin: Update tournament details
 */
export const update = async (req: AuthRequest, res: Response) => {
    try {
        const parsed = createTournamentSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
        }

        const tournament = await updateTournament(req.params.id, parsed.data);
        res.json(tournament);
    } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({ error: 'Failed to update tournament' });
    }
};

/**
 * POST /api/tournaments/:id/start
 * Admin: Generate brackets and start tournament
 */
export const start = async (req: AuthRequest, res: Response) => {
    try {
        const tournament = await generateBrackets(req.params.id);
        res.json(tournament);
    } catch (error: any) {
        console.error('Error starting tournament:', error);
        res.status(400).json({ error: error.message || 'Failed to start tournament' });
    }
};

/**
 * POST /api/tournaments/:id/cancel
 * Admin: Cancel tournament
 */
export const cancel = async (req: AuthRequest, res: Response) => {
    try {
        const tournament = await cancelTournament(req.params.id);
        res.json(tournament);
    } catch (error) {
        console.error('Error cancelling tournament:', error);
        res.status(500).json({ error: 'Failed to cancel tournament' });
    }
};
