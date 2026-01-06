import { Router } from 'express';
import { getMe, updateMe, getUserProfile, getUserPosts, getAllUsers, getRecentMembers, resetUserPassword, deleteUser, getMyRedemptions, getAllRedemptions, updateUserMembership, updateUserLevel } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Static routes first (before parameterized routes)
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.get('/me/redemptions', authenticateToken, getMyRedemptions);
router.get('/redemptions', authenticateToken, getAllRedemptions);
router.get('/recent', authenticateToken, getRecentMembers);
router.get('/', authenticateToken, getAllUsers);

// Parameterized routes last
router.get('/:id', authenticateToken, getUserProfile);
router.get('/:id/posts', authenticateToken, getUserPosts);
router.delete('/:id', authenticateToken, deleteUser);
router.post('/:id/reset-password', authenticateToken, resetUserPassword);
router.put('/:id/membership', authenticateToken, updateUserMembership);
router.put('/:id/level', authenticateToken, updateUserLevel);

export default router;
