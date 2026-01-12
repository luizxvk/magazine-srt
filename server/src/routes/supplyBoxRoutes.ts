import express from 'express';
import { openDailySupplyBox } from '../controllers/supplyBoxController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/open', authenticateToken, openDailySupplyBox);

export default router;
