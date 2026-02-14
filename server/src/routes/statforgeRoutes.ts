import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import {
  getSupportedGames,
  getUserProfiles,
  linkGameProfile,
  unlinkGameProfile,
  getProfileStats,
  addSnapshot,
  getEventsFeed,
  comparePlayers,
  getShieldStatus,
} from '../controllers/statforgeController';

const router = Router();

// ===================== PUBLIC =====================
// Get supported games catalog
router.get('/games', authenticateToken, getSupportedGames);

// ===================== USER =====================
// Get user's linked game profiles
router.get('/profiles', authenticateToken, getUserProfiles);
router.get('/profiles/user/:userId', authenticateToken, getUserProfiles);

// Link a game profile
router.post('/profiles/link', authenticateToken, linkGameProfile);

// Unlink a game profile
router.delete('/profiles/:profileId', authenticateToken, unlinkGameProfile);

// Get profile stats history
router.get('/profiles/:profileId/stats', authenticateToken, getProfileStats);

// Manually add/update stats snapshot
router.post('/profiles/:profileId/snapshot', authenticateToken, addSnapshot);

// Get events feed (rank changes, achievements, etc.)
router.get('/events', authenticateToken, getEventsFeed);

// Compare two players
router.get('/compare/:profileId1/:profileId2', authenticateToken, comparePlayers);

// ===================== ADMIN =====================
// RovexShield - Moderation system status
router.get('/shield/status', authenticateToken, isAdmin, getShieldStatus);

export default router;
