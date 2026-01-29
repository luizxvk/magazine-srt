import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendPushToUser } from './notificationController';
import { checkFriendshipBadges } from '../services/gamificationService';

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const requesterId = req.user?.userId;
        const { userId: addresseeId } = req.params;

        if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
        if (requesterId === addresseeId) return res.status(400).json({ error: 'Cannot add yourself' });

        // Check if request already exists
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'PENDING') return res.status(400).json({ error: 'Request already pending' });
            if (existing.status === 'ACCEPTED') return res.status(400).json({ error: 'Already friends' });
            // If REJECTED, maybe allow re-request? For now, no.
            return res.status(400).json({ error: 'Request already exists' });
        }

        const requester = await prisma.user.findUnique({
            where: { id: requesterId },
            select: { id: true, name: true, avatarUrl: true }
        });

        const notificationContent = JSON.stringify({
            text: 'enviou uma solicitação de amizade.',
            actor: {
                id: requester?.id,
                name: requester?.name || 'Alguém',
                avatarUrl: requester?.avatarUrl
            }
        });

        await prisma.$transaction([
            prisma.friendship.create({
                data: {
                    requesterId,
                    addresseeId,
                    status: 'PENDING'
                }
            }),
            prisma.notification.create({
                data: {
                    userId: addresseeId,
                    type: 'FRIEND_REQUEST',
                    content: notificationContent
                }
            })
        ]);

        // Send push notification
        sendPushToUser(
            addresseeId,
            '🤝 Nova solicitação de amizade',
            `${requester?.name || 'Alguém'} quer ser seu amigo!`,
            { url: '/friends?tab=requests', type: 'friend_request' }
        ).catch(err => console.error('[Push] Error sending friend request notification:', err));

        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { requestId } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const request = await prisma.friendship.findUnique({
            where: { id: requestId },
            include: { requester: true }
        });

        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.addresseeId !== userId) return res.status(403).json({ error: 'Forbidden' });
        if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request not pending' });

        const accepter = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        await prisma.$transaction([
            prisma.friendship.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED' }
            }),
            prisma.notification.create({
                data: {
                    userId: request.requesterId,
                    type: 'SYSTEM',
                    content: `${accepter?.name || 'Alguém'} aceitou sua solicitação de amizade.`
                }
            })
        ]);

        // Award "Primeira Conexão" badge to both users if this is their first friendship
        const checkAndAwardFirstConnection = async (targetUserId: string) => {
            const badge = await prisma.badge.findFirst({ where: { name: 'Primeira Conexão' } });
            if (!badge) return;

            const existingUserBadge = await prisma.userBadge.findUnique({
                where: { userId_badgeId: { userId: targetUserId, badgeId: badge.id } }
            });

            if (!existingUserBadge) {
                await prisma.userBadge.create({
                    data: { userId: targetUserId, badgeId: badge.id }
                });
                await prisma.user.update({
                    where: { id: targetUserId },
                    data: { trophies: { increment: badge.trophies } }
                });
                await prisma.notification.create({
                    data: {
                        userId: targetUserId,
                        type: 'ACHIEVEMENT',
                        content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)`
                    }
                });
            }
        };

        // Check for "Popular" badge (50 friends)
        const checkAndAwardPopular = async (targetUserId: string) => {
            const badge = await prisma.badge.findFirst({ where: { name: 'Popular' } });
            if (!badge) return;

            const existingUserBadge = await prisma.userBadge.findUnique({
                where: { userId_badgeId: { userId: targetUserId, badgeId: badge.id } }
            });

            if (existingUserBadge) return; // Already has badge

            // Count accepted friendships
            const friendCount = await prisma.friendship.count({
                where: {
                    OR: [
                        { requesterId: targetUserId, status: 'ACCEPTED' },
                        { addresseeId: targetUserId, status: 'ACCEPTED' }
                    ]
                }
            });

            if (friendCount >= 50) {
                await prisma.userBadge.create({
                    data: { userId: targetUserId, badgeId: badge.id }
                });
                await prisma.user.update({
                    where: { id: targetUserId },
                    data: { trophies: { increment: badge.trophies } }
                });
                await prisma.notification.create({
                    data: {
                        userId: targetUserId,
                        type: 'ACHIEVEMENT',
                        content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)`
                    }
                });
            }
        };

        // Check for both users involved in the friendship
        await checkAndAwardFirstConnection(userId);
        await checkAndAwardFirstConnection(request.requesterId);
        
        // Check for Popular badge
        await checkAndAwardPopular(userId);
        await checkAndAwardPopular(request.requesterId);
        
        // Check for additional friendship badges (Roda de Amigos, Celebridade)
        await checkFriendshipBadges(userId);
        await checkFriendshipBadges(request.requesterId);

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const rejectFriendRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { requestId } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const request = await prisma.friendship.findUnique({ where: { id: requestId } });

        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.addresseeId !== userId) return res.status(403).json({ error: 'Forbidden' });

        await prisma.friendship.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFriends = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            },
            include: {
                requester: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true, trophies: true, level: true, isOnline: true, lastSeenAt: true, membershipType: true, equippedProfileBorder: true }
                },
                addressee: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true, trophies: true, level: true, isOnline: true, lastSeenAt: true, membershipType: true, equippedProfileBorder: true }
                }
            }
        });

        const friends = friendships.map(f => {
            return f.requesterId === userId ? f.addressee : f.requester;
        });

        res.json(friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get only online friends
export const getOnlineFriends = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Consider a user online if they were active in the last 1 hour (reduced from 5 minutes for better UX)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            },
            include: {
                requester: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true, isOnline: true, lastSeenAt: true, membershipType: true, doNotDisturb: true, equippedProfileBorder: true }
                },
                addressee: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true, isOnline: true, lastSeenAt: true, membershipType: true, doNotDisturb: true, equippedProfileBorder: true }
                }
            }
        });

        const onlineFriends = friendships
            .map(f => f.requesterId === userId ? f.addressee : f.requester)
            .filter(friend => friend.isOnline && friend.lastSeenAt && new Date(friend.lastSeenAt) > oneHourAgo);

        res.json(onlineFriends);
    } catch (error) {
        console.error('Error fetching online friends:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user's online status (heartbeat)
export const updateOnlineStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.user.update({
            where: { id: userId },
            data: {
                isOnline: true,
                lastSeenAt: new Date()
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating online status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Set user offline (on logout or disconnect)
export const setUserOffline = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.user.update({
            where: { id: userId },
            data: {
                isOnline: false,
                lastSeenAt: new Date()
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error setting user offline:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const requests = await prisma.friendship.findMany({
            where: {
                addresseeId: userId,
                status: 'PENDING'
            },
            include: {
                requester: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true, trophies: true, equippedProfileBorder: true }
                }
            }
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFriendshipStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { targetId } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetId },
                    { requesterId: targetId, addresseeId: userId }
                ]
            }
        });

        if (!friendship) {
            return res.json({ status: 'NONE' });
        }

        res.json({
            status: friendship.status,
            isRequester: friendship.requesterId === userId
        });
    } catch (error) {
        console.error('Error fetching friendship status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ========== Integrações Sociais (Discord, Steam, Twitch) ==========

import axios from 'axios';
import { SocialPlatform } from '@prisma/client';

// OAuth URLs
const OAUTH_URLS = {
    discord: {
        authorize: 'https://discord.com/api/oauth2/authorize',
        token: 'https://discord.com/api/oauth2/token',
        userInfo: 'https://discord.com/api/users/@me',
        friends: 'https://discord.com/api/users/@me/relationships',
    },
    steam: {
        openid: 'https://steamcommunity.com/openid/login',
        playerSummaries: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
        friendsList: 'https://api.steampowered.com/ISteamUser/GetFriendList/v1/',
        recentlyPlayed: 'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/',
    },
    twitch: {
        authorize: 'https://id.twitch.tv/oauth2/authorize',
        token: 'https://id.twitch.tv/oauth2/token',
        userInfo: 'https://api.twitch.tv/helix/users',
        streams: 'https://api.twitch.tv/helix/streams',
    },
};

// Iniciar OAuth para Discord
export const initiateDiscordAuth = async (req: AuthRequest, res: Response) => {
    try {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/social/discord/callback';
        
        if (!clientId) {
            return res.status(500).json({ message: 'Discord client ID não configurado' });
        }

        // Escopos básicos que não requerem aprovação especial
        const scopes = 'identify guilds';
        const authUrl = `${OAUTH_URLS.discord.authorize}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
        
        console.log('Discord auth URL generated:', authUrl);
        console.log('Redirect URI being used:', redirectUri);
        
        res.json({ authUrl });
    } catch (error) {
        console.error('Error initiating Discord auth:', error);
        res.status(500).json({ message: 'Erro ao iniciar autenticação Discord' });
    }
};

// Callback OAuth Discord
export const discordCallback = async (req: AuthRequest, res: Response) => {
    try {
        // URL base do frontend
        const frontendUrl = process.env.FRONTEND_URL || 'https://magazine-frontend.vercel.app';
        
        // Log all query params for debugging
        console.log('Discord callback - Full query:', JSON.stringify(req.query));
        
        const { code, state, error, error_description } = req.query;
        
        // Check if Discord returned an error
        if (error) {
            console.error('Discord OAuth error:', error, error_description);
            return res.redirect(`${frontendUrl}/settings?social=discord&status=error&message=${error}`);
        }
        
        const userId = state as string; // Passado como state parameter

        console.log('Discord callback - code:', code ? 'present' : 'missing');
        console.log('Discord callback - state (userId):', userId);

        if (!userId) {
            console.error('Discord callback - Missing userId in state parameter');
            return res.redirect(`${frontendUrl}/settings?social=discord&status=error&message=missing_user_id`);
        }

        if (!code) {
            console.error('Discord callback - Missing authorization code');
            return res.redirect(`${frontendUrl}/settings?social=discord&status=error&message=missing_code`);
        }

        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/social/discord/callback';

        if (!clientId || !clientSecret) {
            console.error('Discord credentials not configured');
            return res.redirect(`${frontendUrl}/settings?social=discord&status=error&message=not_configured`);
        }

        // Trocar código por token
        const tokenResponse = await axios.post(
            OAUTH_URLS.discord.token,
            new URLSearchParams({
                client_id: clientId!,
                client_secret: clientSecret!,
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: redirectUri,
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Buscar informações do usuário Discord
        const userResponse = await axios.get(OAUTH_URLS.discord.userInfo, {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const discordUser = userResponse.data;

        // Salvar conexão no banco
        await prisma.socialConnection.upsert({
            where: {
                userId_platform: {
                    userId,
                    platform: SocialPlatform.DISCORD,
                },
            },
            update: {
                platformId: discordUser.id,
                platformUsername: `${discordUser.username}`,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: new Date(Date.now() + expires_in * 1000),
                isActive: true,
                lastSynced: new Date(),
                metadata: {
                    avatar: discordUser.avatar,
                    email: discordUser.email,
                },
            },
            create: {
                userId,
                platform: SocialPlatform.DISCORD,
                platformId: discordUser.id,
                platformUsername: `${discordUser.username}`,
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: new Date(Date.now() + expires_in * 1000),
                isActive: true,
                lastSynced: new Date(),
                metadata: {
                    avatar: discordUser.avatar,
                    email: discordUser.email,
                },
            },
        });

        res.redirect(`${frontendUrl}/settings?social=discord&status=connected`);
    } catch (error: any) {
        console.error('Error in Discord callback:', error);
        console.error('Error details:', error.response?.data || error.message);
        const frontendUrl = process.env.FRONTEND_URL || 'https://magazine-frontend.vercel.app';
        const errorMsg = error.response?.data?.error || 'unknown';
        res.redirect(`${frontendUrl}/settings?social=discord&status=error&message=${errorMsg}`);
    }
};

// Buscar amigos do Discord
export const getDiscordFriends = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const connection = await prisma.socialConnection.findUnique({
            where: {
                userId_platform: {
                    userId,
                    platform: SocialPlatform.DISCORD,
                },
            },
        });

        if (!connection || !connection.accessToken) {
            return res.status(404).json({ message: 'Discord não conectado' });
        }

        // Buscar relacionamentos (amigos)
        const friendsResponse = await axios.get(OAUTH_URLS.discord.friends, {
            headers: { Authorization: `Bearer ${connection.accessToken}` },
        });

        const friends = friendsResponse.data
            .filter((rel: any) => rel.type === 1) // type 1 = friends
            .map((friend: any) => ({
                id: friend.user.id,
                username: friend.user.username,
                avatar: friend.user.avatar,
                status: friend.user.status || 'offline',
            }));

        res.json({ friends });
    } catch (error: any) {
        console.error('Error fetching Discord friends:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return res.status(401).json({ message: 'Token expirado. Reconecte sua conta Discord.' });
        }
        
        res.status(500).json({ message: 'Erro ao buscar amigos do Discord' });
    }
};

// Buscar servidores (guilds) do Discord
export const getDiscordGuilds = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const connection = await prisma.socialConnection.findUnique({
            where: {
                userId_platform: {
                    userId,
                    platform: SocialPlatform.DISCORD,
                },
            },
        });

        if (!connection || !connection.accessToken) {
            return res.status(404).json({ message: 'Discord não conectado' });
        }

        // Buscar guilds do usuário
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${connection.accessToken}` },
        });

        const guilds = guildsResponse.data.map((guild: any) => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
        }));

        res.json({ guilds });
    } catch (error: any) {
        console.error('Error fetching Discord guilds:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return res.status(401).json({ message: 'Token expirado. Reconecte sua conta Discord.' });
        }
        
        res.status(500).json({ message: 'Erro ao buscar servidores do Discord' });
    }
};

// Iniciar OAuth para Steam (OpenID)
export const initiateSteamAuth = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const realm = process.env.STEAM_REALM || 'https://magazine-srt.vercel.app';
        // Adicionar userId como parâmetro para recuperar no callback
        const returnTo = `${realm}/api/social/steam/callback?state=${userId}`;
        
        const params = new URLSearchParams({
            'openid.ns': 'http://specs.openid.net/auth/2.0',
            'openid.mode': 'checkid_setup',
            'openid.return_to': returnTo,
            'openid.realm': realm,
            'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
            'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
        });

        const authUrl = `${OAUTH_URLS.steam.openid}?${params.toString()}`;
        
        console.log('Steam auth URL:', authUrl);
        console.log('Steam return_to:', returnTo);
        
        res.json({ authUrl });
    } catch (error) {
        console.error('Error initiating Steam auth:', error);
        res.status(500).json({ message: 'Erro ao iniciar autenticação Steam' });
    }
};

// Callback OAuth Steam
export const steamCallback = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.query.state as string;
        const frontendUrl = process.env.FRONTEND_URL || 'https://magazine-frontend.vercel.app';

        console.log('Steam callback - query:', JSON.stringify(req.query));
        console.log('Steam callback - userId:', userId);

        if (!userId) {
            console.error('Steam callback - Missing userId');
            return res.redirect(`${frontendUrl}/settings?social=steam&status=error&message=missing_user_id`);
        }

        const { 'openid.claimed_id': claimedId } = req.query;

        if (!claimedId) {
            console.error('Steam callback - Missing claimed_id');
            return res.redirect(`${frontendUrl}/settings?social=steam&status=error&message=missing_claimed_id`);
        }

        // Extrair Steam ID do claimed_id
        const steamId = (claimedId as string).split('/').pop();

        if (!steamId) {
            console.error('Steam callback - Could not extract Steam ID');
            return res.redirect(`${frontendUrl}/settings?social=steam&status=error&message=invalid_steam_id`);
        }

        console.log('Steam callback - Steam ID:', steamId);

        const apiKey = process.env.STEAM_API_KEY;
        
        if (!apiKey) {
            console.error('Steam callback - STEAM_API_KEY not configured');
            return res.redirect(`${frontendUrl}/settings?social=steam&status=error&message=not_configured`);
        }

        // Buscar informações do usuário Steam
        const userResponse = await axios.get(OAUTH_URLS.steam.playerSummaries, {
            params: {
                key: apiKey,
                steamids: steamId,
            },
        });

        const steamUser = userResponse.data.response.players[0];

        // Salvar conexão no banco
        await prisma.socialConnection.upsert({
            where: {
                userId_platform: {
                    userId,
                    platform: SocialPlatform.STEAM,
                },
            },
            update: {
                platformId: steamId,
                platformUsername: steamUser.personaname,
                isActive: true,
                lastSynced: new Date(),
                metadata: {
                    avatar: steamUser.avatarfull,
                    profileUrl: steamUser.profileurl,
                },
            },
            create: {
                userId,
                platform: SocialPlatform.STEAM,
                platformId: steamId,
                platformUsername: steamUser.personaname,
                isActive: true,
                lastSynced: new Date(),
                metadata: {
                    avatar: steamUser.avatarfull,
                    profileUrl: steamUser.profileurl,
                },
            },
        });

        res.redirect(`${frontendUrl}/settings?social=steam&status=connected`);
    } catch (error) {
        console.error('Error in Steam callback:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'https://magazine-frontend.vercel.app';
        res.redirect(`${frontendUrl}/settings?social=steam&status=error`);
    }
};

// Buscar atividades da Steam (jogos dos amigos)
export const getSteamActivities = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const connection = await prisma.socialConnection.findUnique({
            where: {
                userId_platform: {
                    userId,
                    platform: SocialPlatform.STEAM,
                },
            },
        });

        if (!connection) {
            return res.status(404).json({ message: 'Steam não conectado' });
        }

        const apiKey = process.env.STEAM_API_KEY;
        const steamId = connection.platformId;

        // Buscar lista de amigos
        const friendsResponse = await axios.get(OAUTH_URLS.steam.friendsList, {
            params: {
                key: apiKey,
                steamid: steamId,
            },
        });

        const friendIds = friendsResponse.data.friendslist?.friends?.map((f: any) => f.steamid) || [];

        if (friendIds.length === 0) {
            return res.json({ activities: [] });
        }

        // Buscar informações dos amigos (incluindo jogo atual)
        const summariesResponse = await axios.get(OAUTH_URLS.steam.playerSummaries, {
            params: {
                key: apiKey,
                steamids: friendIds.slice(0, 100).join(','), // Steam API limita a 100
            },
        });

        const activities = summariesResponse.data.response.players
            .filter((player: any) => player.gameextrainfo) // Apenas jogando agora
            .map((player: any) => ({
                steamId: player.steamid,
                username: player.personaname,
                avatar: player.avatarfull,
                gameName: player.gameextrainfo,
                gameId: player.gameid,
                status: 'playing',
            }));

        res.json({ activities });
    } catch (error) {
        console.error('Error fetching Steam activities:', error);
        res.status(500).json({ message: 'Erro ao buscar atividades da Steam' });
    }
};

// Buscar streams da Twitch
export const getTwitchStreams = async (req: AuthRequest, res: Response) => {
    try {
        const { usernames } = req.query; // Lista de usernames separados por vírgula

        if (!usernames) {
            return res.status(400).json({ message: 'Forneça usernames da Twitch' });
        }

        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.warn('[Twitch] Credenciais não configuradas');
            return res.json({ streams: [], error: 'Twitch não configurada' });
        }

        // Get fresh access token using client credentials
        let accessToken = process.env.TWITCH_ACCESS_TOKEN;
        
        try {
            // Always get a fresh token for reliability
            const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'client_credentials'
                }
            });
            accessToken = tokenResponse.data.access_token;
        } catch (tokenError) {
            console.error('[Twitch] Failed to get access token:', tokenError);
            return res.json({ streams: [], error: 'Falha ao autenticar com Twitch' });
        }

        const usernameList = (usernames as string).split(',');

        // Buscar streams ao vivo
        const streamsResponse = await axios.get(OAUTH_URLS.twitch.streams, {
            params: {
                user_login: usernameList,
            },
            headers: {
                'Client-ID': clientId,
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const streams = streamsResponse.data.data.map((stream: any) => ({
            userId: stream.user_id,
            username: stream.user_login,
            displayName: stream.user_name,
            gameName: stream.game_name,
            title: stream.title,
            viewerCount: stream.viewer_count,
            thumbnailUrl: stream.thumbnail_url.replace('{width}', '400').replace('{height}', '225'),
            isLive: true,
            streamUrl: `https://twitch.tv/${stream.user_login}`,
        }));

        res.json({ streams });
    } catch (error: any) {
        console.error('Error fetching Twitch streams:', error?.response?.data || error?.message || error);
        // Return empty array instead of 500 to prevent frontend spam
        res.json({ streams: [], error: 'Falha ao carregar streams' });
    }
};

// Desconectar plataforma social
export const disconnectSocial = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { platform } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const platformEnum = platform.toUpperCase() as SocialPlatform;

        await prisma.socialConnection.deleteMany({
            where: {
                userId,
                platform: platformEnum,
            },
        });

        res.json({ message: `${platform} desconectado com sucesso` });
    } catch (error) {
        console.error('Error disconnecting social:', error);
        res.status(500).json({ message: 'Erro ao desconectar plataforma' });
    }
};

// Listar conexões sociais do usuário
export const getSocialConnections = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }

        const connections = await prisma.socialConnection.findMany({
            where: { userId, isActive: true },
            select: {
                platform: true,
                platformUsername: true,
                lastSynced: true,
                metadata: true,
            },
        });

        res.json({ connections });
    } catch (error) {
        console.error('Error fetching social connections:', error);
        res.status(500).json({ message: 'Erro ao buscar conexões sociais' });
    }
};
