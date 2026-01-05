import { Router } from 'express';
import { getMe, updateMe, getUserProfile, getUserPosts, getAllUsers, getRecentMembers, resetUserPassword, deleteUser, getMyRedemptions, getAllRedemptions, updateUserMembership, updateUserLevel } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.get('/me/redemptions', authenticateToken, getMyRedemptions);
router.get('/redemptions', authenticateToken, getAllRedemptions); // Admin only (checked in controller)
router.get('/:id', authenticateToken, getUserProfile);
router.get('/:id/posts', authenticateToken, getUserPosts);
router.delete('/:id', authenticateToken, deleteUser);

router.get('/', authenticateToken, getAllUsers);
router.get('/recent', authenticateToken, getRecentMembers);
router.post('/:id/reset-password', authenticateToken, resetUserPassword);
router.put('/:id/membership', authenticateToken, updateUserMembership);
router.put('/:id/level', authenticateToken, updateUserLevel);

export default router;
