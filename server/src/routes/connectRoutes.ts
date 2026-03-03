import express from 'express';
import {
  createVoiceChannel,
  getVoiceChannels,
  updateVoiceChannel,
  deleteVoiceChannel,
  joinVoiceChannel,
  leaveVoiceChannel,
  updateVoiceState,
  getCurrentVoiceChannel,
  getConnectGroups,
} from '../controllers/connectController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// ============================================
// CONNECT HUB
// ============================================

// Get all groups with voice channels for Connect hub
router.get('/groups', getConnectGroups);

// Get current voice channel user is in
router.get('/voice/current', getCurrentVoiceChannel);

// Leave any voice channel
router.post('/voice/leave', leaveVoiceChannel);

// Update voice state (mute, deafen, speaking)
router.patch('/voice/state', updateVoiceState);

// ============================================
// VOICE CHANNELS (Group-specific)
// ============================================

// Get voice channels for a group
router.get('/groups/:groupId/voice', getVoiceChannels);

// Create voice channel in a group
router.post('/groups/:groupId/voice', createVoiceChannel);

// Update voice channel
router.patch('/groups/:groupId/voice/:channelId', updateVoiceChannel);

// Delete voice channel
router.delete('/groups/:groupId/voice/:channelId', deleteVoiceChannel);

// Join voice channel
router.post('/groups/:groupId/voice/:channelId/join', joinVoiceChannel);

export default router;
