import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as paymentController from '../controllers/paymentController';

const router = Router();

router.post('/create-zions-preference', authenticateToken, paymentController.createZionsPreference);
router.post('/webhook', paymentController.handleWebhook);

export default router;
