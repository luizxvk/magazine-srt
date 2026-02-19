import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createChallenge,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
  completeChallenge,
  getUserChallenges,
  getChallengeById,
  getChallengeLeaderboard,
  getWeeklyChallengeLeaderboard,
  getUserChallengeStats,
  processExpiredChallenges
} from '../services/challengeService';
import { ChallengeMetric, ChallengeStatus } from '@prisma/client';

// ============================================
// VALIDATION SCHEMAS
// ============================================
const createChallengeSchema = z.object({
  opponentId: z.string().uuid(),
  gameProfileId: z.string().uuid(),
  metric: z.enum(['KILLS', 'WINS', 'KD', 'WIN_RATE', 'SCORE', 'HOURS']),
  betAmount: z.number().int().min(100).max(10000),
  duration: z.number().int().min(1).max(7).optional().default(3)
});

// ============================================
// CREATE CHALLENGE
// ============================================
export async function createChallengeHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const validation = createChallengeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { opponentId, gameProfileId, metric, betAmount, duration } = validation.data;

    const challenge = await createChallenge(
      userId,
      opponentId,
      gameProfileId,
      metric as ChallengeMetric,
      betAmount,
      duration
    );

    res.status(201).json(challenge);
  } catch (error: any) {
    console.error('[Challenge] Error creating:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar desafio' });
  }
}

// ============================================
// ACCEPT CHALLENGE
// ============================================
export async function acceptChallengeHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { challengeId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const challenge = await acceptChallenge(challengeId, userId);
    res.json(challenge);
  } catch (error: any) {
    console.error('[Challenge] Error accepting:', error);
    res.status(400).json({ error: error.message || 'Erro ao aceitar desafio' });
  }
}

// ============================================
// DECLINE CHALLENGE
// ============================================
export async function declineChallengeHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { challengeId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const challenge = await declineChallenge(challengeId, userId);
    res.json(challenge);
  } catch (error: any) {
    console.error('[Challenge] Error declining:', error);
    res.status(400).json({ error: error.message || 'Erro ao recusar desafio' });
  }
}

// ============================================
// CANCEL CHALLENGE
// ============================================
export async function cancelChallengeHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { challengeId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const challenge = await cancelChallenge(challengeId, userId);
    res.json(challenge);
  } catch (error: any) {
    console.error('[Challenge] Error cancelling:', error);
    res.status(400).json({ error: error.message || 'Erro ao cancelar desafio' });
  }
}

// ============================================
// GET MY CHALLENGES
// ============================================
export async function getMyChallengesHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const status = req.query.status as ChallengeStatus | undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const challenges = await getUserChallenges(userId, status);
    res.json(challenges);
  } catch (error: any) {
    console.error('[Challenge] Error getting challenges:', error);
    res.status(500).json({ error: 'Erro ao buscar desafios' });
  }
}

// ============================================
// GET CHALLENGE DETAILS
// ============================================
export async function getChallengeHandler(req: Request, res: Response) {
  try {
    const { challengeId } = req.params;

    const challenge = await getChallengeById(challengeId);

    if (!challenge) {
      return res.status(404).json({ error: 'Desafio não encontrado' });
    }

    res.json(challenge);
  } catch (error: any) {
    console.error('[Challenge] Error getting challenge:', error);
    res.status(500).json({ error: 'Erro ao buscar desafio' });
  }
}

// ============================================
// GET LEADERBOARD
// ============================================
export async function getLeaderboardHandler(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await getChallengeLeaderboard(limit);
    res.json(leaderboard);
  } catch (error: any) {
    console.error('[Challenge] Error getting leaderboard:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
}

// ============================================
// FORCE COMPLETE CHALLENGE (admin/cron)
// ============================================
export async function forceCompleteHandler(req: Request, res: Response) {
  try {
    const { challengeId } = req.params;

    const challenge = await completeChallenge(challengeId);
    res.json(challenge);
  } catch (error: any) {
    console.error('[Challenge] Error completing:', error);
    res.status(400).json({ error: error.message || 'Erro ao finalizar desafio' });
  }
}

// ============================================
// PROCESS EXPIRED CHALLENGES (cron endpoint)
// ============================================
export async function processExpiredHandler(req: Request, res: Response) {
  try {
    const result = await processExpiredChallenges();
    res.json({ message: 'Processamento concluído', ...result });
  } catch (error: any) {
    console.error('[Challenge] Error processing expired:', error);
    res.status(500).json({ error: 'Erro ao processar desafios expirados' });
  }
}

// ============================================
// GET WEEKLY LEADERBOARD
// ============================================
export async function getWeeklyLeaderboardHandler(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await getWeeklyChallengeLeaderboard(limit);
    res.json(data);
  } catch (error: any) {
    console.error('[Challenge] Error getting weekly leaderboard:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking semanal' });
  }
}

// ============================================
// GET MY CHALLENGE STATS
// ============================================
export async function getMyChallengeStatsHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const stats = await getUserChallengeStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('[Challenge] Error getting stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
}
