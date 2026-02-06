import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import * as eventController from '../controllers/eventController';

const router = Router();

router.get('/', authenticateToken, eventController.getEvents);
router.get('/available-rewards', authenticateToken, isAdmin, eventController.getAvailableRewards);
router.get('/available-drops', authenticateToken, eventController.getAvailableDrops);
router.post('/', authenticateToken, isAdmin, eventController.createEvent);
router.put('/:id', authenticateToken, isAdmin, eventController.updateEvent);
router.post('/publish-rewards', authenticateToken, isAdmin, eventController.publishEventRewards);
router.get('/:id/drop', authenticateToken, eventController.getEventDrop);
router.post('/:id/claim-drop', authenticateToken, eventController.claimEventDrop);
router.delete('/:id', authenticateToken, isAdmin, eventController.deleteEvent);

export default router;
