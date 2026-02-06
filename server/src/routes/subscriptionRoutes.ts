import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    getSubscriptionStatus,
    getPlans,
    createSubscription,
    cancelSubscription,
    useStreakProtection
} from '../controllers/subscriptionController';

const router = Router();

// Obter planos disponíveis (público)
router.get('/plans', getPlans);

// Obter status da assinatura do usuário
router.get('/status', authenticateToken, getSubscriptionStatus);

// Criar assinatura
router.post('/subscribe', authenticateToken, createSubscription);

// Cancelar assinatura
router.post('/cancel', authenticateToken, cancelSubscription);

// Usar proteção de streak
router.post('/streak-protection', authenticateToken, useStreakProtection);

export default router;
