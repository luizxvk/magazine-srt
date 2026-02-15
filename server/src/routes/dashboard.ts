import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Admin dashboard stats
router.get('/stats', authenticateToken, isAdmin, getDashboardStats);

export default router;
