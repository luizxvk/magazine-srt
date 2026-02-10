import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { moderateTextContent } from '../middleware/moderationMiddleware';
import * as catalogController from '../controllers/catalogController';

const router = Router();

// Public routes
router.get('/public', authenticateToken, catalogController.getPublicCatalogPhotos);
router.get('/filters', authenticateToken, catalogController.getFilterOptions);

// ...

// User's catalog (protected)
router.get('/', authenticateToken, catalogController.getCatalogPhotos);
router.post('/', authenticateToken, moderateTextContent(['title', 'description']), catalogController.addCatalogPhoto);
router.put('/:id', authenticateToken, moderateTextContent(['title', 'description']), catalogController.updateCatalogPhoto);
router.delete('/:id', authenticateToken, catalogController.deleteCatalogPhoto);
router.post('/:id/favorite', authenticateToken, catalogController.toggleFavorite);

export default router;
