import { Router } from 'express';
import * as feedController from '../controllers/feedController';
import { authenticateToken, authenticateTokenOptional } from '../middleware/authMiddleware';
import { moderateContent } from '../middleware/securityMiddleware';
import { postRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

router.get('/', authenticateTokenOptional, feedController.getFeed);
router.get('/highlights', authenticateTokenOptional, feedController.getHighlights);
router.post('/', authenticateToken, postRateLimit, moderateContent(['caption']), feedController.createPost);
router.post('/:id/like', authenticateToken, feedController.likePost);
router.post('/:id/comment', authenticateToken, moderateContent(['text']), feedController.commentPost);
router.get('/stories', authenticateToken, feedController.getStories);
router.post('/stories', authenticateToken, postRateLimit, moderateContent(['caption']), feedController.createStory);
router.delete('/stories/:storyId', authenticateToken, feedController.deleteStory);
router.post('/stories/:storyId/view', authenticateToken, feedController.markStoryAsViewed);
router.get('/stories/:storyId/viewers', authenticateToken, feedController.getStoryViewers);
router.post('/stories/:id/like', authenticateToken, feedController.likeStory);
router.get('/stories/:storyId/like-status', authenticateToken, feedController.getStoryLikeStatus);

export default router;
