import { Router } from 'express';
import { getContent, updateContent } from '../controllers/contentController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/:key', getContent);
router.put('/:key', authenticateToken, isAdmin, updateContent);

export default router;
