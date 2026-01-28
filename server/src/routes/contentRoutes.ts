import { Router } from 'express';
import { getContent, updateContent, checkEliteRankingWinner, claimEliteRankingReward } from '../controllers/contentController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/:key', getContent);
router.put('/:key', authenticateToken, isAdmin, updateContent);
router.post('/:key', authenticateToken, isAdmin, updateContent);

// Elite Ranking Reward routes
router.get('/elite-ranking/winner-status', authenticateToken, checkEliteRankingWinner);
router.post('/elite-ranking/claim-reward', authenticateToken, claimEliteRankingReward);

export default router;
