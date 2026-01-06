import { Router } from 'express';
import { register, login, requestPasswordReset, resetPassword, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { loginRateLimit, resetPasswordRateLimit, rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Apply rate limiting to sensitive endpoints
router.post('/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Muitas tentativas de registro.' }), register);
router.post('/login', loginRateLimit, login);
router.post('/request-reset', resetPasswordRateLimit, requestPasswordReset);
router.post('/reset-password', resetPasswordRateLimit, resetPassword);
router.post('/change-password', authenticateToken, changePassword);

export default router;
