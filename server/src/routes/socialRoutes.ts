import { Router } from 'express';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriends, getPendingRequests, getFriendshipStatus, getOnlineFriends, updateOnlineStatus, setUserOffline } from '../controllers/socialController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/request/:userId', authenticateToken, sendFriendRequest);
router.post('/request/:requestId/accept', authenticateToken, acceptFriendRequest);
router.post('/request/:requestId/reject', authenticateToken, rejectFriendRequest);
router.get('/friends', authenticateToken, getFriends);
router.get('/friends/online', authenticateToken, getOnlineFriends);
router.get('/requests', authenticateToken, getPendingRequests);
router.get('/status/:targetId', authenticateToken, getFriendshipStatus);
router.post('/heartbeat', authenticateToken, updateOnlineStatus);
router.post('/offline', authenticateToken, setUserOffline);

export default router;
