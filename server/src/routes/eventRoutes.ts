import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as eventController from '../controllers/eventController';

const router = Router();

router.get('/', authenticateToken, eventController.getEvents);
router.post('/', authenticateToken, eventController.createEvent);

export default router;
