import { Router } from 'express';
import { register, login, requestPasswordReset, resetPassword, changePassword, verifyEmail, resendVerificationCode } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { loginRateLimit, resetPasswordRateLimit, rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Apply rate limiting to sensitive endpoints
router.post('/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: 'Muitas tentativas de registro. Aguarde uma hora.' }), register);
router.post('/login', loginRateLimit, login);
router.post('/request-reset', resetPasswordRateLimit, requestPasswordReset);
router.post('/reset-password', resetPasswordRateLimit, resetPassword);
router.post('/change-password', authenticateToken, changePassword);
router.post('/verify-email', authenticateToken, verifyEmail);
router.post('/resend-verification', authenticateToken, resendVerificationCode);

export default router;
