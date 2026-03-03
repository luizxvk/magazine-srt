import { Router } from 'express';
import { 
    getNotifications, 
    markAsRead,
    getVapidKey,
    subscribeToPush,
    unsubscribeFromPush,
    getPushStatus,
    sendTestNotification,
    subscribeToFcm,
    unsubscribeFromFcm,
    sendCallInvite
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Regular notifications
router.get('/', authenticateToken, getNotifications);
router.put('/:id/read', authenticateToken, markAsRead);

// Push notifications (Web Push)
router.get('/push/vapid-key', getVapidKey);
router.post('/push/subscribe', authenticateToken, subscribeToPush);
router.post('/push/unsubscribe', authenticateToken, unsubscribeFromPush);
router.get('/push/status', authenticateToken, getPushStatus);
router.post('/push/test', authenticateToken, sendTestNotification);

// Push notifications (FCM - Android/iOS native)
router.post('/push/subscribe-fcm', authenticateToken, subscribeToFcm);
router.post('/push/unsubscribe-fcm', authenticateToken, unsubscribeFromFcm);

// Call invite (high-priority push notification)
router.post('/call-invite', authenticateToken, sendCallInvite);

export default router;
