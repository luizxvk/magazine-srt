import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============================================
// VOICE CHANNEL CRUD
// ============================================

const createVoiceChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  maxUsers: z.number().min(2).max(99).optional(),
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
        maxUsers: maxUsers || 25,
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

    // Get all groups user is member of, with voice channels
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, displayName: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, displayName: true, avatarUrl: true, isOnline: true },
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
        _count: {
          select: { messages: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching connect groups:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
};
