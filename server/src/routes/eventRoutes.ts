import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import * as eventController from '../controllers/eventController';

const router = Router();

// Cron endpoint MUST be before parameterized routes to avoid /:id matching
router.post('/cron/reminders', eventController.sendEventReminders);
router.post('/cron/event-end', eventController.notifyEventEnd);

router.get('/', authenticateToken, eventController.getEvents);
router.get('/tags', authenticateToken, eventController.getEventTags);
router.get('/available-rewards', authenticateToken, isAdmin, eventController.getAvailableRewards);
router.get('/available-drops', authenticateToken, eventController.getAvailableDrops);
router.post('/', authenticateToken, isAdmin, eventController.createEvent);
router.put('/:id', authenticateToken, isAdmin, eventController.updateEvent);
router.post('/publish-rewards', authenticateToken, isAdmin, eventController.publishEventRewards);
router.get('/:id/attendees', authenticateToken, eventController.getEventAttendees);
router.post('/:id/attend', authenticateToken, eventController.attendEvent);
router.delete('/:id/attend', authenticateToken, eventController.unattendEvent);
router.get('/:id/drop', authenticateToken, eventController.getEventDrop);
router.post('/:id/claim-drop', authenticateToken, eventController.claimEventDrop);
router.delete('/:id', authenticateToken, isAdmin, eventController.deleteEvent);

export default router;
