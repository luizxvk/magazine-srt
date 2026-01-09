import { Router } from 'express';
import { createAnnouncement, getAnnouncements, getActiveAnnouncement, deleteAnnouncement, toggleActive } from '../controllers/announcementController';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public route - anyone can see active announcements
router.get('/active', getActiveAnnouncement);

// Protected routes - require authentication
router.get('/', authenticateToken, getAnnouncements);

// Admin only routes
router.post('/', authenticateToken, isAdmin, createAnnouncement);
router.delete('/:id', authenticateToken, isAdmin, deleteAnnouncement);
router.put('/:id/toggle', authenticateToken, isAdmin, toggleActive);

export default router;
