import { Router } from 'express';
import { createPost, deletePost, getComments, votePoll, getPostById, replyToComment, likeComment } from '../controllers/postController';
import { authenticateToken } from '../middleware/authMiddleware';
import { commentPost } from '../controllers/feedController';
import { moderateTextContent } from '../middleware/moderationMiddleware';

const router = Router();

router.post('/', authenticateToken, moderateTextContent(['content', 'caption']), createPost);
router.get('/:id', authenticateToken, getPostById); // Get single post
router.delete('/:id', authenticateToken, deletePost);

// Comments routes
router.post('/:id/comments', authenticateToken, moderateTextContent(['text', 'content']), commentPost); // commentPost expects :id param
router.get('/:postId/comments', authenticateToken, getComments); // getComments expects :postId param

// Comment reply & like routes
router.post('/:postId/comments/:commentId/reply', authenticateToken, replyToComment);
router.post('/:postId/comments/:commentId/like', authenticateToken, likeComment);

// Poll routes
router.post('/poll/vote', authenticateToken, votePoll);

export default router;
