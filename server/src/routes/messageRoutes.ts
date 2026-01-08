import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { moderateContent } from '../middleware/securityMiddleware';
import { messageRateLimit } from '../middleware/rateLimitMiddleware';
import {
    sendMessage,
    getConversation,
    getRecentConversations,
    markAsRead,
    deleteMessage
} from '../controllers/messageController';

const router = express.Router();

// Protected routes
router.use(authenticateToken);

router.post('/', messageRateLimit, moderateContent(['content']), sendMessage);
router.get('/recent', getRecentConversations);
router.get('/:otherUserId', getConversation);
router.put('/read', markAsRead);
router.delete('/:messageId', deleteMessage);

export default router;
