import { Router } from 'express';
import { getLogs, getStats } from '../controllers/moderationController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Admin-only moderation routes
router.get('/logs', authenticateToken, isAdmin, getLogs);
router.get('/stats', authenticateToken, isAdmin, getStats);

export default router;
