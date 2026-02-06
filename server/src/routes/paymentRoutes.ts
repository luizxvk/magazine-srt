import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as paymentController from '../controllers/paymentController';

const router = Router();

// Legacy preference route
router.post('/create-zions-preference', authenticateToken, paymentController.createZionsPreference);

// PIX routes
router.post('/zions/pix', authenticateToken, paymentController.createPixPayment);
router.post('/zions/cash/pix', authenticateToken, paymentController.createCashPixPayment);
router.get('/status/:paymentId', authenticateToken, paymentController.checkPaymentStatus);

// Simulação de pagamento (apenas em modo teste)
router.post('/simulate-confirm', authenticateToken, paymentController.simulatePaymentConfirmation);

// Webhook
router.post('/webhook', paymentController.handleWebhook);

// ============ PRODUTOS - PAGAMENTO BRL ============
router.post('/product/create-preference', authenticateToken, paymentController.createProductPayment);
router.post('/product/simulate', authenticateToken, paymentController.simulateProductPayment);
router.post('/webhook/product', paymentController.handleProductWebhook);

export default router;
