import { Router } from 'express';
import { getRanking, getBadges, getRewards, redeemReward, createReward, updateReward, deleteReward, dailyLogin, getMyRedemptions, getDailyLoginStatus, getZionsHistory } from '../controllers/gamificationController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/ranking', authenticateToken, getRanking);
router.get('/badges', authenticateToken, getBadges);
router.get('/rewards', authenticateToken, getRewards);
router.get('/rewards/my', authenticateToken, getMyRedemptions);
router.post('/rewards/redeem', authenticateToken, redeemReward);
router.post('/rewards', authenticateToken, isAdmin, createReward);
router.put('/rewards/:id', authenticateToken, isAdmin, updateReward);
router.delete('/rewards/:id', authenticateToken, isAdmin, deleteReward);
router.post('/daily-login', authenticateToken, dailyLogin);
router.get('/daily-login/status', authenticateToken, getDailyLoginStatus);
router.get('/zions-history', authenticateToken, getZionsHistory);

export default router;
