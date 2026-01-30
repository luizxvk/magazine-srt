import { Router } from 'express';
import { getMe, updateMe, getUserProfile, getUserPosts, getAllUsers, getRecentMembers, resetUserPassword, deleteUser, getMyRedemptions, getAllRedemptions, updateUserMembership, updateUserLevel, getCustomizations, purchaseCustomization, equipCustomization, unequipCustomization, searchAll, updatePreferences, updateProfileBackground, claimBetaReward } from '../controllers/userController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Static routes first (before parameterized routes)
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.put('/me/preferences', authenticateToken, updatePreferences);
router.put('/me/profile-background', authenticateToken, updateProfileBackground);
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

// Beta reward route
router.post('/claim-beta-reward', authenticateToken, claimBetaReward);

// Parameterized routes last
router.get('/:id', authenticateToken, getUserProfile);
router.get('/:id/posts', authenticateToken, getUserPosts);
router.delete('/:id', authenticateToken, deleteUser); // Permite próprio usuário ou admin
router.post('/:id/reset-password', authenticateToken, isAdmin, resetUserPassword);
router.put('/:id/membership', authenticateToken, isAdmin, updateUserMembership);
router.put('/:id/level', authenticateToken, isAdmin, updateUserLevel);

export default router;
