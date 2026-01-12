import express from 'express';
import {
    getAllThemePacks,
    purchaseThemePack,
    getUserThemePacks,
    equipThemePack
} from '../controllers/themePackController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getAllThemePacks);
router.get('/my-packs', authenticateToken, getUserThemePacks);
router.post('/:packId/purchase', authenticateToken, purchaseThemePack);
router.post('/:packId/equip', authenticateToken, equipThemePack);

export default router;
