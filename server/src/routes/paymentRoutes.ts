import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as paymentController from '../controllers/paymentController';

const router = Router();

// Legacy preference route
router.post('/create-zions-preference', authenticateToken, paymentController.createZionsPreference);

// PIX routes
router.post('/zions/pix', authenticateToken, paymentController.createPixPayment);
router.get('/status/:paymentId', authenticateToken, paymentController.checkPaymentStatus);

// Webhook
router.post('/webhook', paymentController.handleWebhook);

export default router;
