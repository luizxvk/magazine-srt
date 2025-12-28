
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    sendMessage,
    getConversation,
    getRecentConversations,
    markAsRead
} from '../controllers/messageController';

const router = express.Router();

// Protected routes
router.use(authenticateToken);

router.post('/', sendMessage);
router.get('/recent', getRecentConversations);
router.get('/:otherUserId', getConversation);
router.put('/read', markAsRead);

export default router;
