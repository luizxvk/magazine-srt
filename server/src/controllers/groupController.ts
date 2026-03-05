import { Response } from 'express';
import { GroupRole, MessageType } from '@prisma/client';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendPushToUser } from './notificationController';
import { checkGroupCreatorBadge } from '../services/gamificationService';

// In-memory storage for typing indicators (expires after 3 seconds)
interface TypingUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  expiresAt: number;
}
const typingUsers: Map<string, Map<string, TypingUser>> = new Map(); // groupId -> userId -> TypingUser

// Clean up expired typing indicators
const cleanExpiredTyping = (groupId: string) => {
  const groupTyping = typingUsers.get(groupId);
  if (!groupTyping) return;

  const now = Date.now();
  for (const [userId, data] of groupTyping.entries()) {
    if (data.expiresAt < now) {
      groupTyping.delete(userId);
    }
  }
};

// Criar novo grupo
export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { name, description, avatarUrl, isPrivate, maxMembers } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        avatarUrl,
        creatorId: userId,
        membershipType: user.membershipType,
        isPrivate: isPrivate || false,
        maxMembers: maxMembers || 100,
        members: {
          create: {
            userId,
            role: GroupRole.ADMIN,
            canPost: true,
            canInvite: true,
            canModerate: true,
          },
        },
        settings: {
          create: {},
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        voiceChannels: true,
      },
    });

    // Auto-create default voice channel "Geral"
    await prisma.voiceChannel.create({
      data: {
        name: 'Geral',
        description: 'Canal de voz principal',
        groupId: group.id,
        maxUsers: maxMembers || 100,
        bitrate: 64000,
      },
    });

    // Award "Anfitrião" badge for creating a group
    await checkGroupCreatorBadge(userId);

    res.json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Erro ao criar grupo' });
  }
};

// Listar grupos do usuário
export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Get all groups where user is a member OR group is public
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          // Groups where user is a member
          {
            members: {
              some: {
                userId,
              },
            },
          },
          // Public groups (even if user is not a member)
          {
            isPrivate: false,
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
};

// Buscar grupo por ID
export const getGroupById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        settings: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    // Verificar se o usuário é membro
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember && group.isPrivate) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Erro ao buscar grupo' });
  }
};

// Entrar em um grupo
export const joinGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
        settings: true,
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    // Verificar se já é membro
    const isMember = group.members.some((m) => m.userId === userId);
    if (isMember) {
      return res.status(400).json({ error: 'Você já é membro deste grupo' });
    }

    // Verificar limite de membros
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Grupo está cheio' });
    }

    // Se requer aprovação, criar membro com status pendente
    const member = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId,
        role: GroupRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(member);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Erro ao entrar no grupo' });
  }
};

// Sair de um grupo
export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    // Não permitir que o criador saia
    if (group.creatorId === userId) {
      return res.status(400).json({ error: 'O criador não pode sair do grupo' });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
    });

    res.json({ message: 'Você saiu do grupo' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Erro ao sair do grupo' });
  }
};

// Postar mensagem no grupo
export const postMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { content, imageUrl, type, replyToId, textChannelId: rawTextChannelId } = req.body;
    
    // Normalize textChannelId - treat empty strings, "null", and undefined as null
    const textChannelId = (rawTextChannelId && rawTextChannelId !== 'null' && rawTextChannelId.trim() !== '') 
      ? rawTextChannelId 
      : null;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se é membro e tem permissão
    let member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
      include: {
        group: {
          include: {
            settings: true,
          },
        },
      },
    });

    // If not a member, check if group is public and auto-join
    if (!member) {
      const group = await prisma.group.findUnique({
        where: { id },
        include: { settings: true, members: true },
      });

      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Auto-join public groups
      if (!group.isPrivate) {
        // Check if group is full
        if (group.members.length >= group.maxMembers) {
          return res.status(400).json({ error: 'Grupo está cheio' });
        }

        // Create membership
        member = await prisma.groupMember.create({
          data: {
            groupId: id,
            userId,
            role: 'MEMBER',
          },
          include: {
            group: {
              include: {
                settings: true,
              },
            },
          },
        });
      } else {
        return res.status(403).json({ error: 'Você não é membro deste grupo' });
      }
    }

    if (!member.canPost && member.group.settings?.allowMemberPosts === false) {
      return res.status(403).json({ error: 'Você não tem permissão para postar' });
    }

    // Verificar limite de 3 imagens por grupo
    if (imageUrl) {
      const imageCount = await prisma.groupMessage.count({
        where: {
          groupId: id,
          imageUrl: { not: null },
          deletedAt: null,
        },
      });

      if (imageCount >= 3) {
        return res.status(400).json({ 
          error: 'Limite de imagens atingido',
          message: 'Este grupo já atingiu o limite máximo de 3 imagens. Exclua uma imagem existente para enviar uma nova.'
        });
      }
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId: id,
        senderId: userId,
        content,
        imageUrl,
        type: type || MessageType.TEXT,
        replyToId: replyToId || null,
        textChannelId: textChannelId || null, // null = canal "geral" padrão
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Detectar menções (@username) e criar notificações
    if (content) {
      const mentionRegex = /@(\w+)/g;
      const mentions = content.match(mentionRegex);

      if (mentions && mentions.length > 0) {
        // Buscar membros do grupo para encontrar os mencionados
        const groupMembers = await prisma.groupMember.findMany({
          where: { groupId: id },
          include: {
            user: {
              select: { id: true, name: true, displayName: true }
            }
          }
        });

        // Para cada menção, verificar se corresponde a um membro
        for (const mention of mentions) {
          const username = mention.substring(1).toLowerCase(); // Remove @
          const mentionedMember = groupMembers.find(m =>
            m.user.name.toLowerCase() === username ||
            (m.user.displayName && m.user.displayName.toLowerCase() === username)
          );

          if (mentionedMember && mentionedMember.userId !== userId) {
            // Criar notificação para o usuário mencionado
            try {
              await prisma.notification.create({
                data: {
                  userId: mentionedMember.userId,
                  type: 'GROUP_MENTION',
                  content: `${message.sender.displayName || message.sender.name} mencionou você em ${member.group.name || 'um grupo'}`
                }
              });
              
              // Send push notification for mention
              sendPushToUser(
                mentionedMember.userId,
                `📢 ${member.group.name || 'Grupo'}`,
                `${message.sender.displayName || message.sender.name} mencionou você`,
                { url: `/groups/${id}`, groupId: id, type: 'group_mention' }
              ).catch(err => console.error('[Push] Error sending mention notification:', err));
            } catch (notifError) {
              console.error('Error creating mention notification:', notifError);
            }
          }
        }
      }
    }

    // Atualizar updatedAt do grupo
    await prisma.group.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.json(message);
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Erro ao postar mensagem' });
  }
};

// Buscar mensagens do grupo
export const getGroupMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { limit = 50, before, after, textChannelId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Check if group exists and if it's private
    const group = await prisma.group.findUnique({
      where: { id },
      select: { isPrivate: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    // For private groups, verify membership
    if (group.isPrivate) {
      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: id,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Você não é membro deste grupo privado' });
      }
    }

    const messages = await prisma.groupMessage.findMany({
      where: {
        groupId: id,
        deletedAt: null,
        // Filtro por canal de texto: null = canal padrão, string = canal específico
        textChannelId: textChannelId === 'null' || !textChannelId ? null : (textChannelId as string),
        ...(before && {
          createdAt: {
            lt: new Date(before as string),
          },
        }),
        ...(after && {
          createdAt: {
            gt: new Date(after as string),
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
};

// Delete group message (sender or admin)
export const deleteGroupMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id, messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se é membro do grupo
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    // Buscar a mensagem
    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Check if user is admin (global)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isGlobalAdmin = user?.role === 'ADMIN';

    // Permitir deletar se for: autor da mensagem, admin do grupo, ou admin global
    const canDelete =
      message.senderId === userId ||
      member.role === 'ADMIN' ||
      isGlobalAdmin;

    if (!canDelete) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar esta mensagem' });
    }

    await prisma.groupMessage.delete({
      where: { id: messageId },
    });

    res.json({ success: true, message: 'Mensagem deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting group message:', error);
    res.status(500).json({ error: 'Erro ao deletar mensagem' });
  }
};

// Remover membro (apenas admin/moderador)
export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id, memberId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const requester = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
    });

    if (!requester || (!requester.canModerate && requester.role !== GroupRole.ADMIN)) {
      return res.status(403).json({ error: 'Sem permissão para remover membros' });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: id,
          userId: memberId,
        },
      },
    });

    res.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Erro ao remover membro' });
  }
};

// Atualizar role do membro (apenas admin)
export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id, memberId } = req.params;
    const { role, canPost, canInvite, canModerate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const requester = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
      include: {
        group: true,
      },
    });

    if (!requester || requester.role !== GroupRole.ADMIN) {
      return res.status(403).json({ error: 'Apenas admins podem alterar permissões' });
    }

    // Não permitir alterar role do criador
    if (requester.group.creatorId === memberId) {
      return res.status(400).json({ error: 'Não é possível alterar o role do criador' });
    }

    const member = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId: id,
          userId: memberId,
        },
      },
      data: {
        ...(role && { role }),
        ...(typeof canPost === 'boolean' && { canPost }),
        ...(typeof canInvite === 'boolean' && { canInvite }),
        ...(typeof canModerate === 'boolean' && { canModerate }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(member);
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Erro ao atualizar permissões' });
  }
};

// Deletar grupo (apenas criador)
export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    if (group.creatorId !== userId) {
      return res.status(403).json({ error: 'Apenas o criador pode deletar o grupo' });
    }

    await prisma.group.delete({
      where: { id },
    });

    res.json({ message: 'Grupo deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Erro ao deletar grupo' });
  }
};

// Atualizar informações do grupo (nome, avatar)
export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, avatarUrl, description } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas admins podem editar o grupo' });
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(description !== undefined && { description })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo' });
  }
};

// Convidar membro para o grupo
export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { invitedUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!invitedUserId) {
      return res.status(400).json({ error: 'ID do usuário convidado é obrigatório' });
    }

    // Verificar se o inviter é membro do grupo
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member || !member.canInvite) {
      return res.status(403).json({ error: 'Sem permissão para convidar' });
    }

    // Verificar se o convidado já é membro
    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: invitedUserId } }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Usuário já é membro do grupo' });
    }

    // Verificar se já tem convite pendente
    const existingInvite = await prisma.groupInvite.findUnique({
      where: { groupId_invitedId: { groupId, invitedId: invitedUserId } }
    });

    if (existingInvite) {
      // Verificar se o convite expirou (3 minutos)
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
      const isExpired = existingInvite.createdAt < threeMinutesAgo;

      if (existingInvite.status === 'PENDING' && !isExpired) {
        return res.status(400).json({ error: 'Convite já enviado. Aguarde 3 minutos para enviar novamente.' });
      }
      // Se expirou ou não está pendente, deletar e criar novo
      await prisma.groupInvite.delete({
        where: { id: existingInvite.id }
      });
    }

    // Criar convite
    const invite = await prisma.groupInvite.create({
      data: {
        groupId,
        inviterId: userId,
        invitedId: invitedUserId,
        status: 'PENDING'
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // Criar notificação (não bloqueia se falhar)
    try {
      await prisma.notification.create({
        data: {
          userId: invitedUserId,
          type: 'GROUP_INVITE',
          content: `${invite.inviter.name} convidou você para o grupo ${invite.group.name}`
        }
      });
    } catch (notifError) {
      console.error('Error creating notification for invite:', notifError);
      // Continue - notification is not critical
    }

    res.json(invite);
  } catch (error: any) {
    console.error('Error inviting member:', error);
    res.status(500).json({
      error: 'Erro ao enviar convite',
      details: error?.message || 'Erro desconhecido'
    });
  }
};

// Generate invite link for sharing
export const generateInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Check if user is member of the group
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    // Generate a simple invite code based on group ID
    const inviteCode = groupId;

    res.json({ 
      inviteCode,
      inviteLink: `${process.env.FRONTEND_URL || 'https://magazine-frontend.vercel.app'}/connect/${inviteCode}`
    });
  } catch (error: any) {
    console.error('Error generating invite link:', error);
    res.status(500).json({
      error: 'Erro ao gerar link de convite',
      details: error?.message || 'Erro desconhecido'
    });
  }
};

// Responder convite
export const respondInvite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { inviteId } = req.params;
    const { accept } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const invite = await prisma.groupInvite.findUnique({
      where: { id: inviteId },
      include: { group: true }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (invite.invitedId !== userId) {
      return res.status(403).json({ error: 'Este convite não é para você' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Convite já respondido' });
    }

    // Atualizar convite
    await prisma.groupInvite.update({
      where: { id: inviteId },
      data: {
        status: accept ? 'ACCEPTED' : 'DECLINED',
        respondedAt: new Date()
      }
    });

    // Se aceito, adicionar ao grupo
    if (accept) {
      await prisma.groupMember.create({
        data: {
          groupId: invite.groupId,
          userId,
          role: GroupRole.MEMBER
        }
      });
    }

    res.json({ message: accept ? 'Convite aceito' : 'Convite recusado' });
  } catch (error) {
    console.error('Error responding to invite:', error);
    res.status(500).json({ error: 'Erro ao responder convite' });
  }
};

// Atualizar apelido no grupo
export const updateNickname = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { nickname } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const member = await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { nickname }
    });

    res.json(member);
  } catch (error) {
    console.error('Error updating nickname:', error);
    res.status(500).json({ error: 'Erro ao atualizar apelido' });
  }
};

// Mutar/desmutar grupo
export const toggleMute = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member) {
      return res.status(404).json({ error: 'Você não é membro deste grupo' });
    }

    const updated = await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { isMuted: !member.isMuted }
    });

    res.json({ isMuted: updated.isMuted });
  } catch (error) {
    console.error('Error toggling mute:', error);
    res.status(500).json({ error: 'Erro ao mutar/desmutar grupo' });
  }
};

// Atualizar background do grupo
export const updateGroupBackground = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { backgroundId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se é admin do grupo
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member || member.role !== GroupRole.ADMIN) {
      return res.status(403).json({ error: 'Apenas admins podem mudar o background' });
    }

    // Verificar se o usuário possui o background
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const ownedItems = JSON.parse(user.ownedCustomizations || '[]');
    if (!ownedItems.includes(backgroundId)) {
      return res.status(403).json({ error: 'Você não possui este background' });
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: { backgroundId }
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating group background:', error);
    res.status(500).json({ error: 'Erro ao atualizar background' });
  }
};

// Enviar imagem no chat (custa 10 Zions)
export const postImageMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { imageUrl, content, isNSFW, textChannelId: rawTextChannelId } = req.body;
    
    // Normalize textChannelId
    const textChannelId = (rawTextChannelId && rawTextChannelId !== 'null' && rawTextChannelId.trim() !== '') 
      ? rawTextChannelId 
      : null;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      include: {
        group: {
          include: {
            settings: true
          }
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    // Check posting permission - same logic as postMessage
    if (!member.canPost && member.group.settings?.allowMemberPosts === false) {
      return res.status(403).json({ error: 'Você não tem permissão para postar' });
    }

    // Verificar limite de 3 imagens por grupo
    const imageCount = await prisma.groupMessage.count({
      where: {
        groupId,
        imageUrl: { not: null },
        deletedAt: null,
      },
    });

    if (imageCount >= 3) {
      return res.status(400).json({ 
        error: 'Limite de imagens atingido',
        message: 'Este grupo já atingiu o limite máximo de 3 imagens. Exclua uma imagem existente para enviar uma nova.',
        code: 'IMAGE_LIMIT_REACHED'
      });
    }

    // Verificar saldo de Zions
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.zions < 10) {
      return res.status(400).json({ error: 'Saldo insuficiente (10 Zions necessários)' });
    }

    // Deduzir Zions
    await prisma.user.update({
      where: { id: userId },
      data: { zions: { decrement: 10 } }
    });

    // Registrar histórico
    await prisma.zionHistory.create({
      data: {
        userId,
        amount: -10,
        reason: 'Imagem enviada no grupo'
      }
    });

    // Criar mensagem
    const message = await prisma.groupMessage.create({
      data: {
        groupId,
        senderId: userId,
        content: content || '',
        type: MessageType.IMAGE,
        imageUrl,
        isNSFW: isNSFW || false,
        textChannelId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    res.json(message);
  } catch (error) {
    console.error('Error posting image message:', error);
    res.status(500).json({ error: 'Erro ao enviar imagem' });
  }
};

// Listar convites pendentes do usuário
export const getMyInvites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Convites expiram após 3 minutos
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const invites = await prisma.groupInvite.findMany({
      where: {
        invitedId: userId,
        status: 'PENDING',
        createdAt: {
          gte: threeMinutesAgo // Apenas convites não expirados
        }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            membershipType: true
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Erro ao buscar convites' });
  }
};

// Set typing indicator
export const setTyping = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Check if user is a member
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      include: {
        user: {
          select: { id: true, name: true, displayName: true, avatarUrl: true }
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    // Set typing with 3 second expiration
    if (!typingUsers.has(groupId)) {
      typingUsers.set(groupId, new Map());
    }

    typingUsers.get(groupId)!.set(userId, {
      id: userId,
      name: member.user.displayName || member.user.name,
      avatarUrl: member.user.avatarUrl,
      expiresAt: Date.now() + 3000
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting typing:', error);
    res.status(500).json({ error: 'Erro ao atualizar status de digitação' });
  }
};

// Get users currently typing
export const getTypingUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    cleanExpiredTyping(groupId);

    const groupTyping = typingUsers.get(groupId);
    if (!groupTyping) {
      return res.json([]);
    }

    // Return all typing users except the requesting user
    const typingList = Array.from(groupTyping.values())
      .filter(u => u.id !== userId)
      .map(u => ({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl
      }));

    res.json(typingList);
  } catch (error) {
    console.error('Error getting typing users:', error);
    res.status(500).json({ error: 'Erro ao buscar status de digitação' });
  }
};

// Mark messages as read
export const markMessagesRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { lastMessageId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Update member's last read message
    await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: {
        // Store the last read message ID in a JSON field or use a relation
        // For now, we'll use the updatedAt timestamp
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
  }
};

// Get readers of a specific message (users who have read up to this message)
export const getMessageReaders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId, messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Get the message
    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Get all members who joined before this message was sent
    // For a simple implementation, return members who are active
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { not: message.senderId } // Exclude sender
      },
      include: {
        user: {
          select: { id: true, name: true, displayName: true, avatarUrl: true }
        }
      },
      take: 5 // Limit to 5 for display
    });

    const readers = members.map(m => ({
      id: m.user.id,
      name: m.user.displayName || m.user.name,
      avatarUrl: m.user.avatarUrl
    }));

    res.json(readers);
  } catch (error) {
    console.error('Error getting message readers:', error);
    res.status(500).json({ error: 'Erro ao buscar leitores' });
  }
};

// Add reaction to a message
export const addReaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: groupId, messageId } = req.params;
    const { emoji } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji é obrigatório' });
    }

    // Verify user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    // Verify message exists
    const message = await prisma.groupMessage.findFirst({
      where: { id: messageId, groupId, deletedAt: null },
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Check if user already reacted to this message (with any emoji)
    const existingReaction = await prisma.groupMessageReaction.findFirst({
      where: { messageId, userId },
    });

    if (existingReaction) {
      // If same emoji, remove it (toggle off)
      if (existingReaction.emoji === emoji) {
        await prisma.groupMessageReaction.delete({
          where: { id: existingReaction.id },
        });
        return res.json({ removed: true, emoji, messageId });
      }
      
      // If different emoji, update to new emoji
      const updatedReaction = await prisma.groupMessageReaction.update({
        where: { id: existingReaction.id },
        data: { emoji },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
      return res.json({ updated: true, reaction: updatedReaction, messageId });
    }

    // Add new reaction (first time reacting to this message)
    const reaction = await prisma.groupMessageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({ added: true, reaction, messageId });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Erro ao adicionar reação' });
  }
};

// Get reactions for a message
export const getMessageReactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id: groupId, messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verify user is a member of the group
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    const reactions = await prisma.groupMessageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Group reactions by emoji
    const grouped: { [key: string]: { emoji: string; count: number; users: any[]; userReacted: boolean } } = {};
    
    reactions.forEach((r) => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], userReacted: false };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user);
      if (r.userId === userId) {
        grouped[r.emoji].userReacted = true;
      }
    });

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Error getting reactions:', error);
    res.status(500).json({ error: 'Erro ao buscar reações' });
  }
};
