import { Router } from 'express';
import { reportPost, getReports, resolveReport } from '../controllers/reportController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/post/:postId', authenticateToken, reportPost);
router.get('/', authenticateToken, getReports);
router.put('/:reportId', authenticateToken, resolveReport);

export default router;
