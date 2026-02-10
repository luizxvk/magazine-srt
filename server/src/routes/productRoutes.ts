import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import {
    createProduct,
    updateProduct,
    deleteProduct,
    addProductKeys,
    getProducts,
    getProduct,
    purchaseWithZions,
    purchaseWithBRL,
    purchaseWithPixDirect,
    confirmPixPayment,
    checkProductPaymentStatus,
    getUserOrders,
    getAllOrders,
    getAdminProducts
} from '../controllers/productController';

const router = Router();

// ===================== PUBLIC ROUTES =====================
// Get all active products (requires auth to see prices)
router.get('/', authenticateToken, getProducts);

// Get single product details
router.get('/:id', authenticateToken, getProduct);

// ===================== USER ROUTES =====================
// Purchase a product with Zions Cash
router.post('/purchase/zions', authenticateToken, purchaseWithZions);

// Purchase a product with BRL (Mercado Pago PIX)
router.post('/purchase/brl', authenticateToken, purchaseWithBRL);

// Purchase a product with PIX Direct (seller's key)
router.post('/purchase/pix-direct', authenticateToken, purchaseWithPixDirect);

// Check product order payment status
router.get('/orders/:orderId/status', authenticateToken, checkProductPaymentStatus);

// Get user's purchase history
router.get('/orders/my', authenticateToken, getUserOrders);

// ===================== ADMIN ROUTES =====================
// Get all products with admin details
router.get('/admin/all', authenticateToken, requireAdmin, getAdminProducts);

// Get all orders (admin)
router.get('/admin/orders', authenticateToken, requireAdmin, getAllOrders);

// Create a new product (admin)
router.post('/admin/create', authenticateToken, requireAdmin, createProduct);

// Update a product (admin)
router.put('/admin/:id', authenticateToken, requireAdmin, updateProduct);

// Delete a product (admin)
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteProduct);

// Add keys to a product (admin)
router.post('/admin/:id/keys', authenticateToken, requireAdmin, addProductKeys);

// Confirm PIX direct payment and deliver keys (admin)
router.post('/admin/orders/:orderId/confirm-pix', authenticateToken, requireAdmin, confirmPixPayment);

export default router;
