import { Router } from 'express';
import { 
    getNotifications, 
    markAsRead,
    getVapidKey,
    subscribeToPush,
    unsubscribeFromPush,
    getPushStatus,
    sendTestNotification
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Regular notifications
router.get('/', authenticateToken, getNotifications);
router.put('/:id/read', authenticateToken, markAsRead);

// Push notifications
router.get('/push/vapid-key', getVapidKey);
router.post('/push/subscribe', authenticateToken, subscribeToPush);
router.post('/push/unsubscribe', authenticateToken, unsubscribeFromPush);
router.get('/push/status', authenticateToken, getPushStatus);
router.post('/push/test', authenticateToken, sendTestNotification);

export default router;
