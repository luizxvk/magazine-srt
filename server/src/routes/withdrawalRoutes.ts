import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import {
    getConversionRate,
    requestWithdrawal,
    getUserWithdrawals,
    cancelWithdrawal,
    getAllWithdrawals,
    approveWithdrawal,
    processWithdrawal,
    completeWithdrawal,
    rejectWithdrawal
} from '../controllers/withdrawalController';

const router = Router();

// ===================== PUBLIC INFO =====================
// Get conversion rate info
router.get('/rate', getConversionRate);

// ===================== USER ROUTES =====================
// Request a withdrawal
router.post('/request', authenticateToken, requestWithdrawal);

// Get user's withdrawal history
router.get('/my', authenticateToken, getUserWithdrawals);

// Cancel a pending withdrawal
router.post('/:id/cancel', authenticateToken, cancelWithdrawal);

// ===================== ADMIN ROUTES =====================
// Get all withdrawals (admin)
router.get('/admin/all', authenticateToken, requireAdmin, getAllWithdrawals);

// Approve a withdrawal (admin)
router.post('/admin/:id/approve', authenticateToken, requireAdmin, approveWithdrawal);

// Mark as processing (admin)
router.post('/admin/:id/process', authenticateToken, requireAdmin, processWithdrawal);

// Complete a withdrawal (admin)
router.post('/admin/:id/complete', authenticateToken, requireAdmin, completeWithdrawal);

// Reject a withdrawal (admin)
router.post('/admin/:id/reject', authenticateToken, requireAdmin, rejectWithdrawal);

export default router;
