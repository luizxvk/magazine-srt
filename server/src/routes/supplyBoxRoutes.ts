import express from 'express';
import { openDailySupplyBox, getSupplyBoxStatus } from '../controllers/supplyBoxController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/open', authenticateToken, openDailySupplyBox);
router.get('/status', authenticateToken, getSupplyBoxStatus);

export default router;
