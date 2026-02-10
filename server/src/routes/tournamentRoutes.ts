import { Router } from 'express';
import {
    list,
    getById,
    leaderboard,
    register,
    unregister,
    reportScore,
    create,
    update,
    start,
    cancel,
} from '../controllers/tournamentController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', list);
router.get('/:id', getById);
router.get('/:id/leaderboard', leaderboard);

// Authenticated routes (users)
router.post('/:id/register', authenticateToken, register);
router.delete('/:id/unregister', authenticateToken, unregister);
router.post('/matches/:matchId/report', authenticateToken, reportScore);

// Admin routes
router.post('/', authenticateToken, isAdmin, create);
router.put('/:id', authenticateToken, isAdmin, update);
router.post('/:id/start', authenticateToken, isAdmin, start);
router.post('/:id/cancel', authenticateToken, isAdmin, cancel);

export default router;
