import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
    createBadge,
    getAllBadges,
    getUserBadges,
    deleteBadge,
    getBadgeTemplates,
} from '../controllers/adminBadgeController';

const router = express.Router();

router.post('/', authenticateToken, requireAdmin, createBadge);
router.get('/', authenticateToken, requireAdmin, getAllBadges);
router.get('/templates', authenticateToken, requireAdmin, getBadgeTemplates);
router.get('/user/:userId', authenticateToken, getUserBadges);
router.delete('/:id', authenticateToken, requireAdmin, deleteBadge);

export default router;
