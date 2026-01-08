import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Admin dashboard stats
router.get('/stats', authenticateToken, getDashboardStats);

export default router;
