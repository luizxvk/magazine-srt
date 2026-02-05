import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import * as eventController from '../controllers/eventController';

const router = Router();

router.get('/', authenticateToken, eventController.getEvents);
router.get('/available-rewards', authenticateToken, isAdmin, eventController.getAvailableRewards);
router.post('/', authenticateToken, isAdmin, eventController.createEvent);
router.post('/publish-rewards', authenticateToken, isAdmin, eventController.publishEventRewards);

export default router;
