import express from 'express';
import multer from 'multer';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
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
  updateGroupAvatar,
  updateGroupBanner,
  updateConnectGroup,
  uploadGroupImage,
  createTextChannel,
  getTextChannels,
  updateTextChannel,
  deleteTextChannel,
  getRecentActivities,
  getOnlineFriends,
} from '../controllers/connectController';
import { getMyInvites, respondInvite, inviteMember, generateInviteLink } from '../controllers/groupController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateImageContent } from '../middleware/fileValidationMiddleware';

const router = express.Router();

// Configure multer for memory storage (for avatar upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for avatars
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    },
});

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// ============================================
// CONNECT HUB
// ============================================

// Get all groups with voice channels for Connect hub
router.get('/groups', getConnectGroups);

// Get recent activities for Connect hub
router.get('/activities', getRecentActivities);

// Get online friends for Connect hub
router.get('/friends/online', getOnlineFriends);

// Get current voice channel user is in
router.get('/voice/current', getCurrentVoiceChannel);

// Leave any voice channel
router.post('/voice/leave', leaveVoiceChannel);

// Generate Agora RTC token for voice channel
router.post('/voice/token', (req, res) => {
  try {
    const { channelId } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }
    
    if (!userId) {
      console.error('[Agora] No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Trim to remove any whitespace/newlines from env vars
    const appId = (process.env.AGORA_APP_ID || '').trim();
    const appCertificate = (process.env.AGORA_APP_CERTIFICATE || '').trim();
    
    if (!appId || !appCertificate) {
      console.error('[Agora] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE');
      return res.status(500).json({ error: 'Agora not configured' });
    }
    
    console.log('[Agora] App ID length:', appId.length, 'Certificate length:', appCertificate.length);
    console.log('[Agora] Generating token for userId:', userId, 'channelId:', channelId);
    
    // Token expires in 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Generate numeric UID from user ID string (Agora recommends numeric UIDs)
    const numericUid = Math.abs(userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 100000000);
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelId,
      numericUid,
      RtcRole.PUBLISHER,
      expirationTimeInSeconds,
      privilegeExpiredTs
    );
    
    console.log('[Agora] Token generated for channel:', channelId, 'uid:', numericUid);
    
    return res.json({ token, uid: numericUid });
  } catch (error: any) {
    console.error('[Agora] Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Generate Agora RTC token for screen share (uses a different UID)
router.post('/voice/token/screen', (req, res) => {
  try {
    const { channelId } = req.body;
    const userId = (req as any).user?.userId;
    
    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }
    
    if (!userId) {
      console.error('[Agora] No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const appId = (process.env.AGORA_APP_ID || '').trim();
    const appCertificate = (process.env.AGORA_APP_CERTIFICATE || '').trim();
    
    if (!appId || !appCertificate) {
      console.error('[Agora] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE');
      return res.status(500).json({ error: 'Agora not configured' });
    }
    
    // Token expires in 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Generate a different numeric UID for screen share (add offset to avoid collision with voice UID)
    const baseUid = Math.abs(userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 100000000);
    const screenUid = (baseUid + 50000000) % 100000000; // Offset by 50M to differentiate
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelId,
      screenUid,
      RtcRole.PUBLISHER,
      expirationTimeInSeconds,
      privilegeExpiredTs
    );
    
    console.log('[Agora] Screen token generated for channel:', channelId, 'uid:', screenUid);
    
    return res.json({ token, uid: screenUid });
  } catch (error: any) {
    console.error('[Agora] Error generating screen token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

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

// ============================================
// GROUP SETTINGS
// ============================================

// Update group settings (name, description)
router.patch('/groups/:groupId', updateConnectGroup);

// Update group avatar
router.patch('/groups/:groupId/avatar', upload.single('avatar'), validateImageContent, updateGroupAvatar);

// Update group banner
router.patch('/groups/:groupId/banner', upload.single('banner'), validateImageContent, updateGroupBanner);

// Upload group image (for chat messages)
router.post('/upload/group', upload.single('image'), validateImageContent, uploadGroupImage);

// ============================================
// GROUP INVITES
// ============================================

// Get pending invites for current user
router.get('/groups/invites/me', getMyInvites);

// Respond to invite (accept/reject)
router.post('/groups/invites/:inviteId/respond', respondInvite);

// Send direct invite to a user
router.post('/groups/:groupId/invite/user', inviteMember);

// Generate invite link for a group
router.post('/groups/:groupId/invite', generateInviteLink);

// ============================================
// TEXT CHANNELS
// ============================================

// Get text channels for a group
router.get('/groups/:groupId/text', getTextChannels);

// Create text channel in a group
router.post('/groups/:groupId/text', createTextChannel);

// Update text channel
router.patch('/groups/:groupId/text/:channelId', updateTextChannel);

// Delete text channel
router.delete('/groups/:groupId/text/:channelId', deleteTextChannel);

export default router;
