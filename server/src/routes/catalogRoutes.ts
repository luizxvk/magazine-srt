import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as catalogController from '../controllers/catalogController';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Public routes
router.get('/public', authenticateToken, catalogController.getPublicCatalogPhotos);
router.get('/filters', authenticateToken, catalogController.getFilterOptions);

// ...

// User's catalog (protected)
router.get('/', authenticateToken, catalogController.getCatalogPhotos);
router.post('/', (req, res, next) => { console.log('DEBUG: Router POST /catalog hit'); next(); }, authenticateToken, upload.single('image'), catalogController.addCatalogPhoto);
router.put('/:id', authenticateToken, catalogController.updateCatalogPhoto);
router.delete('/:id', authenticateToken, catalogController.deleteCatalogPhoto);
router.post('/:id/favorite', authenticateToken, catalogController.toggleFavorite);

export default router;
