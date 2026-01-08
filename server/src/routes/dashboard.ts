import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Admin dashboard stats
router.get('/stats', authenticateToken, getDashboardStats);

export default router;
