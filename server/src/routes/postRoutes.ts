import { Router } from 'express';
import { createPost, deletePost, getComments, votePoll, getPostById } from '../controllers/postController';
import { authenticateToken } from '../middleware/authMiddleware';
import { commentPost } from '../controllers/feedController';

const router = Router();

router.post('/', authenticateToken, createPost);
router.get('/:id', authenticateToken, getPostById); // Get single post
router.delete('/:id', authenticateToken, deletePost);

// Comments routes
router.post('/:id/comments', authenticateToken, commentPost); // commentPost expects :id param
router.get('/:postId/comments', authenticateToken, getComments); // getComments expects :postId param

// Poll routes
router.post('/poll/vote', authenticateToken, votePoll);

export default router;
