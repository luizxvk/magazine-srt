import { Router } from 'express';
import { getMe, updateMe, getUserProfile, getUserPosts, getAllUsers, getRecentMembers, resetUserPassword, deleteUser, getMyRedemptions, getAllRedemptions, updateUserMembership, updateUserLevel, getCustomizations, purchaseCustomization, equipCustomization, unequipCustomization, searchAll, updatePreferences } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Static routes first (before parameterized routes)
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.put('/me/preferences', authenticateToken, updatePreferences);
router.get('/me/redemptions', authenticateToken, getMyRedemptions);
router.get('/redemptions', authenticateToken, getAllRedemptions);
router.get('/recent', authenticateToken, getRecentMembers);
router.get('/', authenticateToken, getAllUsers);

// Search route
router.get('/search', authenticateToken, searchAll);

// Customization routes
router.get('/customizations', authenticateToken, getCustomizations);
router.post('/customizations/purchase', authenticateToken, purchaseCustomization);
router.post('/customizations/equip', authenticateToken, equipCustomization);
router.post('/customizations/unequip', authenticateToken, unequipCustomization);

// Parameterized routes last
router.get('/:id', authenticateToken, getUserProfile);
router.get('/:id/posts', authenticateToken, getUserPosts);
router.delete('/:id', authenticateToken, deleteUser);
router.post('/:id/reset-password', authenticateToken, resetUserPassword);
router.put('/:id/membership', authenticateToken, updateUserMembership);
router.put('/:id/level', authenticateToken, updateUserLevel);

export default router;
