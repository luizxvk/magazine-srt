import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import {
  createCoupon,
  listCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
  getPendingCouponApprovals,
  reviewCouponApproval,
  generateEliteCoupon,
} from '../controllers/couponController';

const router = Router();

// ===================== USER =====================
// Validate a coupon code at checkout
router.post('/validate', authenticateToken, validateCoupon);

// Generate monthly Elite coupon
router.post('/elite/claim', authenticateToken, generateEliteCoupon);

// ===================== ADMIN =====================
// Create a new coupon (requires Rovex approval)
router.post('/admin/create', authenticateToken, isAdmin, createCoupon);

// List all coupons
router.get('/admin/list', authenticateToken, isAdmin, listCoupons);

// Update a coupon
router.put('/admin/:id', authenticateToken, isAdmin, updateCoupon);

// Delete a coupon
router.delete('/admin/:id', authenticateToken, isAdmin, deleteCoupon);

// Rovex approval management
router.get('/admin/approvals', authenticateToken, isAdmin, getPendingCouponApprovals);
router.post('/admin/approvals/:id/review', authenticateToken, isAdmin, reviewCouponApproval);

export default router;
