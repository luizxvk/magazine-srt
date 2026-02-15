import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ============================================
// SUPPORTED GAMES CATALOG
// ============================================
const SUPPORTED_GAMES = [
  // FPS/Tactical
  { id: 'r6siege', name: 'Rainbow Six Siege', icon: '🛡️', iconUrl: 'https://img.icons8.com/?size=100&id=59676&format=png&color=000000', platforms: ['pc', 'xbox', 'playstation'], category: 'FPS' },
  { id: 'cs2', name: 'Counter-Strike 2', icon: '🔫', iconUrl: 'https://img.icons8.com/?size=100&id=fKi1D913kbYA&format=png&color=000000', platforms: ['pc'], category: 'FPS' },
  { id: 'valorant', name: 'Valorant', icon: '⚡', iconUrl: 'https://img.icons8.com/?size=100&id=GSHWFnD9x56D&format=png&color=000000', platforms: ['pc'], category: 'FPS' },
  { id: 'apex', name: 'Apex Legends', icon: '🏆', iconUrl: null, platforms: ['pc', 'xbox', 'playstation'], category: 'Battle Royale' },
  { id: 'overwatch2', name: 'Overwatch 2', icon: '🦸', iconUrl: 'https://img.icons8.com/?size=100&id=63667&format=png&color=000000', platforms: ['pc', 'xbox', 'playstation'], category: 'FPS' },
  { id: 'cod', name: 'Call of Duty', icon: '💣', iconUrl: 'https://img.icons8.com/?size=100&id=BFTj9toBTo31&format=png&color=000000', platforms: ['pc', 'xbox', 'playstation'], category: 'FPS' },
  // Battle Royale
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', iconUrl: 'https://img.icons8.com/?size=100&id=84531&format=png&color=000000', platforms: ['pc', 'xbox', 'playstation'], category: 'Battle Royale' },
  { id: 'pubg', name: 'PUBG', icon: '🪖', iconUrl: 'https://img.icons8.com/?size=100&id=usqeMxUzF8Jz&format=png&color=000000', platforms: ['pc', 'xbox', 'playstation'], category: 'Battle Royale' },
  // MOBA
  { id: 'lol', name: 'League of Legends', icon: '⚔️', iconUrl: 'https://img.icons8.com/?size=100&id=IH9qqSdkPkox&format=png&color=000000', platforms: ['pc'], category: 'MOBA' },
  { id: 'dota2', name: 'Dota 2', icon: '🧙', iconUrl: null, platforms: ['pc'], category: 'MOBA' },
  { id: 'tft', name: 'Teamfight Tactics', icon: '♟️', iconUrl: 'https://img.icons8.com/?size=100&id=xvOD5btf9fjF&format=png&color=000000', platforms: ['pc'], category: 'Strategy' },
  // Platform-wide
  { id: 'steam', name: 'Steam', icon: '🎮', iconUrl: 'https://img.icons8.com/?size=100&id=zNqjI8XKkCv0&format=png&color=000000', platforms: ['pc'], category: 'Platform' },
  { id: 'xbox', name: 'Xbox', icon: '🟢', iconUrl: 'https://img.icons8.com/?size=100&id=84939&format=png&color=000000', platforms: ['xbox'], category: 'Platform' },
  { id: 'psn', name: 'PlayStation', icon: '🔵', iconUrl: 'https://img.icons8.com/?size=100&id=12519&format=png&color=000000', platforms: ['playstation'], category: 'Platform' },
  { id: 'nintendo', name: 'Nintendo', icon: '🔴', iconUrl: 'https://img.icons8.com/?size=100&id=19598&format=png&color=000000', platforms: ['nintendo'], category: 'Platform' },
  { id: 'epicgames', name: 'Epic Games', icon: '🟣', iconUrl: 'https://img.icons8.com/?size=100&id=R47Qp4SiyIGP&format=png&color=000000', platforms: ['pc'], category: 'Platform' },
  // Others
  { id: 'rocketleague', name: 'Rocket League', icon: '🚗', iconUrl: 'https://img.icons8.com/?size=100&id=Vg63URCXiYXv&format=png&color=000000', platforms: ['pc', 'xbox', 'playstation'], category: 'Sports' },
  { id: 'minecraft', name: 'Minecraft', icon: '⛏️', iconUrl: null, platforms: ['pc', 'xbox', 'playstation'], category: 'Sandbox' },
  { id: 'eafc', name: 'EA FC', icon: '⚽', iconUrl: 'https://img.icons8.com/?size=100&id=9793&format=png&color=000000', platforms: ['pc', 'xbox', 'playstation'], category: 'Sports' },
];

// ============================================
// GET SUPPORTED GAMES LIST
// ============================================
export async function getSupportedGames(req: Request, res: Response) {
  try {
    res.json(SUPPORTED_GAMES);
  } catch (error) {
    console.error('[StatForge] Error getting games:', error);
    res.status(500).json({ error: 'Failed to get supported games' });
  }
}

// ============================================
// GET USER PROFILES (all linked games)
// ============================================
export async function getUserProfiles(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId || req.params.userId;

    const profiles = await prisma.gameProfile.findMany({
      where: { userId, isActive: true },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = profiles.map((profile) => {
      const gameInfo = SUPPORTED_GAMES.find((g) => g.id === profile.game);
      const latestSnapshot = profile.snapshots[0] || null;
      return {
        ...profile,
        gameName: gameInfo?.name || profile.game,
        gameIcon: gameInfo?.icon || '🎮',
        gameIconUrl: gameInfo?.iconUrl || null,
        gameCategory: gameInfo?.category || 'Other',
        latestStats: latestSnapshot,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('[StatForge] Error getting profiles:', error);
    res.status(500).json({ error: 'Failed to get game profiles' });
  }
}

// ============================================
// LINK GAME PROFILE
// ============================================
export async function linkGameProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { game, platform, gamertag, platformId } = req.body;

    if (!game || !platform || !gamertag) {
      return res.status(400).json({ error: 'game, platform and gamertag are required' });
    }

    // Verify game is supported
    const gameInfo = SUPPORTED_GAMES.find((g) => g.id === game);
    if (!gameInfo) {
      return res.status(400).json({ error: 'Unsupported game' });
    }

    if (!gameInfo.platforms.includes(platform)) {
      return res.status(400).json({ error: 'Platform not supported for this game' });
    }

    // Check limit (GROWTH = 5 profiles max, ENTERPRISE = unlimited)
    const existingCount = await prisma.gameProfile.count({
      where: { userId, isActive: true },
    });

    // For now, hardcode; in production, check plan via feature gate middleware
    const MAX_PROFILES = 20; // Enterprise
    if (existingCount >= MAX_PROFILES) {
      return res.status(403).json({ error: 'Maximum game profiles reached for your plan' });
    }

    const profile = await prisma.gameProfile.upsert({
      where: {
        userId_game_platform: { userId, game, platform },
      },
      update: {
        gamertag,
        platformId: platformId || undefined,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        game,
        platform,
        gamertag,
        platformId: platformId || null,
      },
    });

    res.json(profile);
  } catch (error) {
    console.error('[StatForge] Error linking profile:', error);
    res.status(500).json({ error: 'Failed to link game profile' });
  }
}

// ============================================
// UNLINK GAME PROFILE
// ============================================
export async function unlinkGameProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { profileId } = req.params;

    const profile = await prisma.gameProfile.findFirst({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await prisma.gameProfile.update({
      where: { id: profileId },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[StatForge] Error unlinking profile:', error);
    res.status(500).json({ error: 'Failed to unlink game profile' });
  }
}

// ============================================
// GET PROFILE STATS HISTORY
// ============================================
export async function getProfileStats(req: Request, res: Response) {
  try {
    const { profileId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;

    const profile = await prisma.gameProfile.findUnique({
      where: { id: profileId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: limit,
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const gameInfo = SUPPORTED_GAMES.find((g) => g.id === profile.game);

    res.json({
      profile: {
        ...profile,
        gameName: gameInfo?.name || profile.game,
        gameIcon: gameInfo?.icon || '🎮',
        gameIconUrl: gameInfo?.iconUrl || null,
      },
      snapshots: profile.snapshots,
    });
  } catch (error) {
    console.error('[StatForge] Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get profile stats' });
  }
}

// ============================================
// MANUALLY ADD SNAPSHOT (admin / sync simulation)
// ============================================
export async function addSnapshot(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { profileId } = req.params;
    const { rank, rankTier, level, kd, winRate, totalMatches, totalWins, totalKills, totalDeaths, hoursPlayed, score, stats } = req.body;

    const profile = await prisma.gameProfile.findFirst({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get previous snapshot to detect changes
    const previousSnapshot = await getPreviousSnapshot(profileId);

    const snapshot = await prisma.gameSnapshot.create({
      data: {
        profileId,
        rank,
        rankTier,
        level,
        kd,
        winRate,
        totalMatches,
        totalWins,
        totalKills,
        totalDeaths,
        hoursPlayed,
        score,
        stats: stats || {},
      },
    });

    // Detect rank changes and create events
    if (previousSnapshot && rank && previousSnapshot.rank !== rank) {
      const isRankUp = (rankTier || 0) > (previousSnapshot.rankTier || 0);
      const gameInfo = SUPPORTED_GAMES.find((g) => g.id === profile.game);

      await prisma.gameEvent.create({
        data: {
          profileId,
          userId,
          game: profile.game,
          eventType: isRankUp ? 'rank_up' : 'rank_down',
          title: isRankUp
            ? `Subiu para ${rank} no ${gameInfo?.name || profile.game}!`
            : `Desceu para ${rank} no ${gameInfo?.name || profile.game}`,
          description: `${previousSnapshot.rank} → ${rank}`,
          oldValue: previousSnapshot.rank || undefined,
          newValue: rank,
          iconUrl: gameInfo?.icon,
        },
      });
    }

    // Update lastSyncedAt
    await prisma.gameProfile.update({
      where: { id: profileId },
      data: { lastSyncedAt: new Date() },
    });

    res.json(snapshot);
  } catch (error) {
    console.error('[StatForge] Error adding snapshot:', error);
    res.status(500).json({ error: 'Failed to add snapshot' });
  }
}

// Helper to get previous snapshot
async function getPreviousSnapshot(profileId: string) {
  return prisma.gameSnapshot.findFirst({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// GET GAME EVENTS FEED
// ============================================
export async function getEventsFeed(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const game = req.query.game as string | undefined;

    const where: any = {};

    // If no game filter, show events from friends + self
    if (!game) {
      // Get friend IDs
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, status: 'ACCEPTED' },
            { addresseeId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      const friendIds = friendships.map((f) =>
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );

      where.userId = { in: [userId, ...friendIds] };
    } else {
      where.game = game;
    }

    const events = await prisma.gameEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Enrich with user info
    const userIds = [...new Set(events.filter((e) => e.userId).map((e) => e.userId!))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, displayName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedEvents = events.map((event) => ({
      ...event,
      user: event.userId ? userMap.get(event.userId) : null,
      gameInfo: SUPPORTED_GAMES.find((g) => g.id === event.game),
    }));

    res.json(enrichedEvents);
  } catch (error) {
    console.error('[StatForge] Error getting events feed:', error);
    res.status(500).json({ error: 'Failed to get events feed' });
  }
}

// ============================================
// COMPARE PLAYERS
// ============================================
export async function comparePlayers(req: Request, res: Response) {
  try {
    const { profileId1, profileId2 } = req.params;

    const [profile1, profile2] = await Promise.all([
      prisma.gameProfile.findUnique({
        where: { id: profileId1 },
        include: {
          snapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
          user: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
        },
      }),
      prisma.gameProfile.findUnique({
        where: { id: profileId2 },
        include: {
          snapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
          user: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
        },
      }),
    ]);

    if (!profile1 || !profile2) {
      return res.status(404).json({ error: 'One or both profiles not found' });
    }

    if (profile1.game !== profile2.game) {
      return res.status(400).json({ error: 'Cannot compare profiles from different games' });
    }

    const gameInfo = SUPPORTED_GAMES.find((g) => g.id === profile1.game);

    res.json({
      game: { ...gameInfo },
      player1: {
        user: profile1.user,
        gamertag: profile1.gamertag,
        stats: profile1.snapshots[0] || null,
      },
      player2: {
        user: profile2.user,
        gamertag: profile2.gamertag,
        stats: profile2.snapshots[0] || null,
      },
    });
  } catch (error) {
    console.error('[StatForge] Error comparing players:', error);
    res.status(500).json({ error: 'Failed to compare players' });
  }
}

// ============================================
// GET MODERATION / SHIELD STATUS
// ============================================
export async function getShieldStatus(req: Request, res: Response) {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      blockedCount,
      flaggedCount,
      last24hCount,
      pendingReports,
      lastLog,
    ] = await Promise.all([
      prisma.moderationLog.count(),
      prisma.moderationLog.count({ where: { action: 'BLOCKED' } }),
      prisma.moderationLog.count({ where: { action: 'FLAGGED' } }),
      prisma.moderationLog.count({ where: { createdAt: { gte: last24h } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.moderationLog.findFirst({ orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({
      status: 'online',
      services: {
        autoModeration: { status: 'operational', label: 'Auto-moderação' },
        contentFilter: { status: 'operational', label: 'Filtro de conteúdo' },
        antiSpam: { status: 'operational', label: 'Anti-spam' },
        reports: {
          status: pendingReports > 10 ? 'warning' : 'operational',
          label: 'Denúncias',
          pending: pendingReports,
        },
      },
      stats: {
        totalLogs,
        blocked: blockedCount,
        flagged: flaggedCount,
        last24h: last24hCount,
        pendingReports,
      },
      lastCheck: lastLog?.createdAt || now,
      uptime: 99.8,
    });
  } catch (error) {
    console.error('[RovexShield] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get shield status' });
  }
}
