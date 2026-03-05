import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  uploadGroupImageR2,
  isR2Configured
} from '../services/r2Service';
import {
  uploadPostImage as uploadPostImageCloudinary
} from '../services/cloudinaryService';

const prisma = new PrismaClient();

// ============================================
// VOICE CHANNEL CRUD
// ============================================

const createVoiceChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  maxUsers: z.number().min(2).max(12).optional(), // Max 12 users per voice channel
  bitrate: z.number().min(8000).max(384000).optional(),
});

export const createVoiceChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId } = req.params;

    // Validate input
    const validation = createVoiceChannelSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    const { name, description, maxUsers, bitrate } = validation.data;

    // Check if user is admin of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || !['ADMIN', 'MODERATOR'].includes(member.role)) {
      return res.status(403).json({ error: 'Apenas admins e moderadores podem criar canais de voz' });
    }

    // Create voice channel
    const channel = await prisma.voiceChannel.create({
      data: {
        groupId,
        name,
        description,
        maxUsers: maxUsers || 10, // Default 10, max 12
        bitrate: bitrate || 64000,
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating voice channel:', error);
    res.status(500).json({ error: 'Erro ao criar canal de voz' });
  }
};

export const getVoiceChannels = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId } = req.params;

    // Check if user is member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    const channels = await prisma.voiceChannel.findMany({
      where: { groupId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching voice channels:', error);
    res.status(500).json({ error: 'Erro ao buscar canais de voz' });
  }
};

export const updateVoiceChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId, channelId } = req.params;

    const validation = createVoiceChannelSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    // Check if user is admin
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || !['ADMIN', 'MODERATOR'].includes(member.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const channel = await prisma.voiceChannel.update({
      where: { id: channelId },
      data: validation.data,
    });

    res.json(channel);
  } catch (error) {
    console.error('Error updating voice channel:', error);
    res.status(500).json({ error: 'Erro ao atualizar canal de voz' });
  }
};

export const deleteVoiceChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId, channelId } = req.params;

    // Check if user is admin
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas admins podem deletar canais' });
    }

    await prisma.voiceChannel.delete({
      where: { id: channelId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice channel:', error);
    res.status(500).json({ error: 'Erro ao deletar canal de voz' });
  }
};

// ============================================
// VOICE PARTICIPANTS
// ============================================

export const joinVoiceChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId, channelId } = req.params;

    // Check if user is member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    // Check if channel exists and has space
    const channel = await prisma.voiceChannel.findUnique({
      where: { id: channelId },
      include: { _count: { select: { participants: true } } },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }

    if (channel.isLocked) {
      return res.status(403).json({ error: 'Canal está bloqueado' });
    }

    if (channel._count.participants >= channel.maxUsers) {
      return res.status(400).json({ error: 'Canal cheio' });
    }

    // Leave any other voice channels first
    await prisma.voiceParticipant.deleteMany({
      where: { userId },
    });

    // Join the channel
    const participant = await prisma.voiceParticipant.create({
      data: {
        channelId,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        channel: {
          include: {
            group: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Return in expected format for client
    res.json({
      channelId: participant.channelId,
      channel: participant.channel,
      isMuted: participant.isMuted,
      isDeafened: participant.isDeafened,
    });
  } catch (error) {
    console.error('Error joining voice channel:', error);
    res.status(500).json({ error: 'Erro ao entrar no canal' });
  }
};

export const leaveVoiceChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    await prisma.voiceParticipant.deleteMany({
      where: { userId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving voice channel:', error);
    res.status(500).json({ error: 'Erro ao sair do canal' });
  }
};

export const updateVoiceState = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { isMuted, isDeafened, isSpeaking, isStreaming } = req.body;

    const participant = await prisma.voiceParticipant.updateMany({
      where: { userId },
      data: {
        ...(isMuted !== undefined && { isMuted }),
        ...(isDeafened !== undefined && { isDeafened }),
        ...(isSpeaking !== undefined && { isSpeaking }),
        ...(isStreaming !== undefined && { isStreaming }),
      },
    });

    if (participant.count === 0) {
      return res.status(404).json({ error: 'Não está em nenhum canal' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating voice state:', error);
    res.status(500).json({ error: 'Erro ao atualizar estado' });
  }
};

export const getCurrentVoiceChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    const participant = await prisma.voiceParticipant.findFirst({
      where: { userId },
      include: {
        channel: {
          include: {
            group: {
              select: { id: true, name: true, avatarUrl: true },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, displayName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    res.json(participant);
  } catch (error) {
    console.error('Error fetching current voice channel:', error);
    res.status(500).json({ error: 'Erro ao buscar canal atual' });
  }
};

// ============================================
// CONNECT HUB - Lista de servidores/grupos com voice
// ============================================

export const getConnectGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    // Get all groups: either user is a member, OR group is public (not private)
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          // Groups where user is a member
          {
            members: {
              some: { userId },
            },
          },
          // Public groups (not private) - user can join
          {
            isPrivate: false,
          },
        ],
      },
      include: {
        creator: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                displayName: true, 
                avatarUrl: true, 
                isOnline: true,
                membershipType: true,
                equippedProfileBorder: true,
                isElite: true,
                eliteUntil: true,
                lastSeenAt: true
              },
            },
          },
        },
        voiceChannels: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, displayName: true, avatarUrl: true },
                },
              },
            },
          },
        },
        textChannels: {
          orderBy: [
            { isDefault: 'desc' },
            { position: 'asc' },
          ],
          include: {
            _count: { select: { messages: true } },
          },
        },
        _count: {
          select: { messages: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Add isMember flag to each group
    const groupsWithMemberStatus = groups.map(group => ({
      ...group,
      isMember: group.members.some(m => m.userId === userId),
    }));

    res.json(groupsWithMemberStatus);
  } catch (error) {
    console.error('Error fetching connect groups:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
};

// ============================================
// GROUP AVATAR UPDATE
// ============================================

export const updateGroupAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId } = req.params;

    // Check if file was uploaded
    if (!(req as any).file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Check if user is admin of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas admins podem alterar o avatar do grupo' });
    }

    // Upload image
    let avatarUrl: string | null = null;
    const file = (req as any).file;

    if (isR2Configured()) {
      avatarUrl = await uploadGroupImageR2(file.buffer, file.mimetype);
    } else {
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      avatarUrl = await uploadPostImageCloudinary(base64Data);
    }

    if (!avatarUrl) {
      throw new Error('Upload failed');
    }

    // Update group with new avatar
    const group = await prisma.group.update({
      where: { id: groupId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating group avatar:', error);
    res.status(500).json({ error: 'Erro ao atualizar avatar do grupo' });
  }
};

// ============================================
// UPDATE GROUP BANNER
// ============================================

export const updateGroupBanner = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId } = req.params;

    // Check if file was uploaded
    if (!(req as any).file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Check if user is admin of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas admins podem alterar o banner do grupo' });
    }

    // Upload image
    let bannerUrl: string | null = null;
    const file = (req as any).file;

    if (isR2Configured()) {
      bannerUrl = await uploadGroupImageR2(file.buffer, file.mimetype);
    } else {
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      bannerUrl = await uploadPostImageCloudinary(base64Data);
    }

    if (!bannerUrl) {
      throw new Error('Upload failed');
    }

    // Update group with new banner
    const group = await prisma.group.update({
      where: { id: groupId },
      data: { bannerUrl },
      select: {
        id: true,
        name: true,
        bannerUrl: true,
      },
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating group banner:', error);
    res.status(500).json({ error: 'Erro ao atualizar banner do grupo' });
  }
};

// ============================================
// UPDATE CONNECT GROUP (NAME/DESCRIPTION)
// ============================================

const updateConnectGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const updateConnectGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId } = req.params;

    const validation = updateConnectGroupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    // Check if user is admin of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas admins podem alterar as configurações do grupo' });
    }

    const { name, description } = validation.data;

    // Update group
    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        bannerUrl: true,
      },
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating connect group:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo' });
  }
};

// ============================================
// UPLOAD GROUP IMAGE
// ============================================

export const uploadGroupImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    // Check if file was uploaded
    if (!(req as any).file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const file = (req as any).file;

    // Upload image
    let imageUrl: string | null = null;

    if (isR2Configured()) {
      imageUrl = await uploadGroupImageR2(file.buffer, file.mimetype);
    } else {
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      imageUrl = await uploadPostImageCloudinary(base64Data);
    }

    if (!imageUrl) {
      throw new Error('Upload failed');
    }

    res.json({ url: imageUrl, uploadedBy: userId });
  } catch (error) {
    console.error('Error uploading group image:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
};

// ============================================
// TEXT CHANNELS
// ============================================

const createTextChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  isNSFW: z.boolean().optional(),
});

export const createTextChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId } = req.params;

    // Validate input
    const validation = createTextChannelSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    const { name, description, isNSFW } = validation.data;

    // Check if user is admin of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || !['ADMIN', 'MODERATOR'].includes(member.role)) {
      return res.status(403).json({ error: 'Apenas admins e moderadores podem criar canais' });
    }

    // Get max position for ordering
    const maxPosition = await prisma.textChannel.aggregate({
      where: { groupId },
      _max: { position: true },
    });

    // Create text channel
    const channel = await prisma.textChannel.create({
      data: {
        groupId,
        name,
        description,
        isNSFW: isNSFW || false,
        position: (maxPosition._max.position || 0) + 1,
      },
      include: {
        _count: { select: { messages: true } },
      },
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating text channel:', error);
    res.status(500).json({ error: 'Erro ao criar canal de texto' });
  }
};

export const getTextChannels = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId } = req.params;

    // Check if user is member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    const channels = await prisma.textChannel.findMany({
      where: { groupId },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: [
        { isDefault: 'desc' },
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching text channels:', error);
    res.status(500).json({ error: 'Erro ao buscar canais de texto' });
  }
};

export const updateTextChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId, channelId } = req.params;

    const validation = createTextChannelSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    // Check if user is admin
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || !['ADMIN', 'MODERATOR'].includes(member.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    // Check if trying to edit default channel
    const existingChannel = await prisma.textChannel.findUnique({
      where: { id: channelId },
    });

    if (existingChannel?.isDefault) {
      return res.status(400).json({ error: 'Não é possível editar o canal padrão' });
    }

    const channel = await prisma.textChannel.update({
      where: { id: channelId },
      data: validation.data,
    });

    res.json(channel);
  } catch (error) {
    console.error('Error updating text channel:', error);
    res.status(500).json({ error: 'Erro ao atualizar canal de texto' });
  }
};

export const deleteTextChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { groupId, channelId } = req.params;

    // Check if user is admin
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas admins podem deletar canais' });
    }

    // Check if trying to delete default channel
    const channel = await prisma.textChannel.findUnique({
      where: { id: channelId },
    });

    if (channel?.isDefault) {
      return res.status(400).json({ error: 'Não é possível deletar o canal padrão' });
    }

    await prisma.textChannel.delete({
      where: { id: channelId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting text channel:', error);
    res.status(500).json({ error: 'Erro ao deletar canal de texto' });
  }
};

// ============================================
// RECENT ACTIVITIES FOR CONNECT HUB
// ============================================

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get user's groups to filter activities
    const userGroups = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map(g => g.groupId);
    
    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { addresseeId: userId, status: 'ACCEPTED' },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });
    const friendIds = friendships.map(f => 
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Combine relevant user IDs
    const relevantUserIds = [...new Set([...friendIds])];

    // Get recent activities from various sources
    const activities: any[] = [];

    // 1. Recent level ups from friends/group members
    const recentLevelUps = await prisma.user.findMany({
      where: {
        id: { in: relevantUserIds },
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        level: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    recentLevelUps.forEach(user => {
      activities.push({
        id: `levelup-${user.id}`,
        type: 'LEVEL_UP',
        user: {
          id: user.id,
          name: user.name,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        metadata: { level: user.level },
        createdAt: user.updatedAt,
      });
    });

    // 2. Recent badge acquisitions
    const recentBadges = await prisma.userBadge.findMany({
      where: {
        userId: { in: relevantUserIds },
        earnedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        user: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        badge: {
          select: { id: true, name: true, iconPath: true },
        },
      },
      orderBy: { earnedAt: 'desc' },
      take: 5,
    });

    recentBadges.forEach(userBadge => {
      activities.push({
        id: `badge-${userBadge.id}`,
        type: 'BADGE_EARNED',
        user: userBadge.user,
        metadata: {
          badgeName: userBadge.badge.name,
          badgeIcon: userBadge.badge.iconPath,
        },
        createdAt: userBadge.earnedAt,
      });
    });

    // 3. Recent posts in groups
    const recentPosts = await prisma.post.findMany({
      where: {
        authorId: { in: relevantUserIds },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        author: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    recentPosts.forEach(post => {
      activities.push({
        id: `post-${post.id}`,
        type: 'POST_CREATED',
        user: post.author,
        metadata: {
          preview: post.content?.substring(0, 100),
        },
        createdAt: post.createdAt,
      });
    });

    // 4. Recent achievements (if achievement system exists)
    try {
      const recentAchievements = await prisma.userAchievement.findMany({
        where: {
          userId: { in: relevantUserIds },
          unlockedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: {
          user: {
            select: { id: true, name: true, displayName: true, avatarUrl: true },
          },
          achievement: {
            select: { id: true, name: true, icon: true },
          },
        },
        orderBy: { unlockedAt: 'desc' },
        take: 5,
      });

      recentAchievements.forEach(ua => {
        activities.push({
          id: `achievement-${ua.id}`,
          type: 'ACHIEVEMENT',
          user: ua.user,
          metadata: {
            achievementName: ua.achievement.name,
            achievementIcon: ua.achievement.icon,
          },
          createdAt: ua.unlockedAt,
        });
      });
    } catch (e) {
      // Achievement table might not exist
    }

    // Sort all activities by date and limit
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({
      activities: activities.slice(0, limit),
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades recentes' });
  }
};

// ============================================
// ONLINE FRIENDS FOR CONNECT HUB
// ============================================

export const getOnlineFriends = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;

    // Get user's accepted friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { addresseeId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            isOnline: true,
            lastSeenAt: true,
            membershipType: true,
            equippedProfileBorder: true,
          },
        },
        addressee: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            isOnline: true,
            lastSeenAt: true,
            membershipType: true,
            equippedProfileBorder: true,
          },
        },
      },
    });

    // Extract friends (the other person in the friendship)
    const friends = friendships.map(f => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      // Consider online if lastSeenAt is within 5 minutes
      const isRecentlyOnline = friend.lastSeenAt 
        ? new Date(friend.lastSeenAt).getTime() > Date.now() - 5 * 60 * 1000
        : false;
      
      return {
        ...friend,
        isOnline: friend.isOnline || isRecentlyOnline,
      };
    });

    // Filter to only online friends and sort
    const onlineFriends = friends
      .filter(f => f.isOnline)
      .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));

    res.json({
      friends: onlineFriends,
      totalOnline: onlineFriends.length,
    });
  } catch (error) {
    console.error('Error fetching online friends:', error);
    res.status(500).json({ error: 'Erro ao buscar amigos online' });
  }
};
