import { Router } from 'express';
import { getLogs, createLog, clearLogs } from '../controllers/logsController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, isAdmin, getLogs);
router.post('/', createLog); // Allow creating logs without admin (for frontend error reporting)
router.delete('/', authenticateToken, isAdmin, clearLogs);

export default router;
