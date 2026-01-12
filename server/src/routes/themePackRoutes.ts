import express from 'express';
import { 
    getAllThemePacks, 
    purchaseThemePack, 
    getUserThemePacks,
    equipThemePack 
} from '../controllers/themePackController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', getAllThemePacks);
router.get('/my-packs', authenticate, getUserThemePacks);
router.post('/:packId/purchase', authenticate, purchaseThemePack);
router.post('/:packId/equip', authenticate, equipThemePack);

export default router;
