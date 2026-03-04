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
  createTextChannel,
  getTextChannels,
  updateTextChannel,
  deleteTextChannel,
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

// Get current voice channel user is in
router.get('/voice/current', getCurrentVoiceChannel);

// Leave any voice channel
router.post('/voice/leave', leaveVoiceChannel);

// Generate Agora RTC token for voice channel
router.post('/voice/token', (req, res) => {
  try {
    const { channelId } = req.body;
    const userId = (req as any).user?.id;
    
    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }
    
    // Trim to remove any whitespace/newlines from env vars
    const appId = (process.env.AGORA_APP_ID || '').trim();
    const appCertificate = (process.env.AGORA_APP_CERTIFICATE || '').trim();
    
    if (!appId || !appCertificate) {
      console.error('[Agora] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE');
      return res.status(500).json({ error: 'Agora not configured' });
    }
    
    console.log('[Agora] App ID length:', appId.length, 'Certificate length:', appCertificate.length);
    
    if (!appId || !appCertificate) {
      console.error('[Agora] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE');
      return res.status(500).json({ error: 'Agora not configured' });
    }
    
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

// Update group avatar
router.patch('/groups/:groupId/avatar', upload.single('avatar'), validateImageContent, updateGroupAvatar);

// ============================================
// GROUP INVITES
// ============================================

// Get pending invites for current user
router.get('/groups/invites/me', getMyInvites);

// Respond to invite (accept/reject)
router.post('/groups/invites/:inviteId/respond', respondInvite);

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
