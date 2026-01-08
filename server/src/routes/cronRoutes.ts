import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { runVerificationCron } from '../controllers/cronController';

const router = express.Router();

router.post('/verification', authenticateToken, requireAdmin, runVerificationCron);

export default router;
