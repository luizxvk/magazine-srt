import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import {
  createChallengeHandler,
  acceptChallengeHandler,
  declineChallengeHandler,
  cancelChallengeHandler,
  getMyChallengesHandler,
  getChallengeHandler,
  getLeaderboardHandler,
  getWeeklyLeaderboardHandler,
  getMyChallengeStatsHandler,
  forceCompleteHandler,
  processExpiredHandler
} from '../controllers/challengeController';

const router = Router();

// ===================== USER ROUTES =====================
// Get my challenges (sent + received)
router.get('/', authenticateToken, getMyChallengesHandler);

// Get my challenge stats
router.get('/my-stats', authenticateToken, getMyChallengeStatsHandler);

// Get challenge leaderboard (all time)
router.get('/leaderboard/top', authenticateToken, getLeaderboardHandler);

// Get weekly challenge leaderboard
router.get('/leaderboard/weekly', authenticateToken, getWeeklyLeaderboardHandler);

// Get challenge details (must be after specific routes)
router.get('/:challengeId', authenticateToken, getChallengeHandler);

// Create a new challenge
router.post('/', authenticateToken, createChallengeHandler);

// Accept a challenge
router.post('/:challengeId/accept', authenticateToken, acceptChallengeHandler);

// Decline a challenge
router.post('/:challengeId/decline', authenticateToken, declineChallengeHandler);

// Cancel a challenge (only pending, by challenger)
router.post('/:challengeId/cancel', authenticateToken, cancelChallengeHandler);

// ===================== ADMIN/CRON ROUTES =====================
// Force complete a challenge (admin only)
router.post('/:challengeId/complete', authenticateToken, isAdmin, forceCompleteHandler);

// Process expired challenges (cron job endpoint)
router.post('/cron/process-expired', authenticateToken, isAdmin, processExpiredHandler);

export default router;
