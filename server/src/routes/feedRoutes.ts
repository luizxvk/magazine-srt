import { Router } from 'express';
import * as feedController from '../controllers/feedController';
import { authenticateToken, authenticateTokenOptional } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateTokenOptional, feedController.getFeed);
router.get('/highlights', authenticateTokenOptional, feedController.getHighlights); // Added this
router.post('/', authenticateToken, feedController.createPost);
router.post('/:id/like', authenticateToken, feedController.likePost);
router.post('/:id/comment', authenticateToken, feedController.commentPost);
router.get('/stories', authenticateToken, feedController.getStories);
router.post('/stories', authenticateToken, feedController.createStory);
router.post('/stories/:storyUserId/like', authenticateToken, feedController.likeStory);

export default router;
