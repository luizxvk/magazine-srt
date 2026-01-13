import { Router } from 'express';
import { 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getFriends, 
    getPendingRequests, 
    getFriendshipStatus, 
    getOnlineFriends, 
    updateOnlineStatus, 
    setUserOffline,
    // Social integrations
    initiateDiscordAuth,
    discordCallback,
    getDiscordFriends,
    initiateSteamAuth,
    steamCallback,
    getSteamActivities,
    getTwitchStreams,
    disconnectSocial,
    getSocialConnections
} from '../controllers/socialController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Friend system routes
router.post('/request/:userId', authenticateToken, sendFriendRequest);
router.post('/request/:requestId/accept', authenticateToken, acceptFriendRequest);
router.post('/request/:requestId/reject', authenticateToken, rejectFriendRequest);
router.get('/friends', authenticateToken, getFriends);
router.get('/friends/online', authenticateToken, getOnlineFriends);
router.get('/requests', authenticateToken, getPendingRequests);
router.get('/status/:targetId', authenticateToken, getFriendshipStatus);
router.post('/heartbeat', authenticateToken, updateOnlineStatus);
router.post('/offline', authenticateToken, setUserOffline);

// Social integrations routes
router.get('/connections', authenticateToken, getSocialConnections);
router.delete('/disconnect/:platform', authenticateToken, disconnectSocial);

// Discord
router.get('/discord/auth', authenticateToken, initiateDiscordAuth);
router.get('/discord/callback', discordCallback);
router.get('/discord/friends', authenticateToken, getDiscordFriends);

// Steam
router.get('/steam/auth', authenticateToken, initiateSteamAuth);
router.get('/steam/callback', steamCallback);
router.get('/steam/activities', authenticateToken, getSteamActivities);

// Twitch
router.get('/twitch/streams', getTwitchStreams);

export default router;
