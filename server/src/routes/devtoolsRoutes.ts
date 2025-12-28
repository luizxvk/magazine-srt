
import { Router } from 'express';
import { logger } from '../services/loggerService';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Get logs
router.get('/logs', authenticateToken, isAdmin, (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const level = req.query.level as string | undefined;
    const logs = logger.getLogs(limit, level);
    res.json(logs);
});

// Get system stats
router.get('/stats', authenticateToken, isAdmin, (req, res) => {
    const stats = logger.getSystemStats();
    res.json(stats);
});

export default router;
