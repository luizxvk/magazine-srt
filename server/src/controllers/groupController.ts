import { Request, Response } from 'express';
import { PrismaClient, GroupRole, MessageType } from '@prisma/client';

const prisma = new PrismaClient();

// Criar novo grupo
export const createGroup = async (req: Request, res: Response) => {
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
      },
    });

    res.json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Erro ao criar grupo' });
  }
};

// Listar grupos do usuário
export const getMyGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
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
export const getGroupById = async (req: Request, res: Response) => {
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
export const joinGroup = async (req: Request, res: Response) => {
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
export const leaveGroup = async (req: Request, res: Response) => {
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
export const postMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { content, imageUrl, type } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se é membro e tem permissão
    const member = await prisma.groupMember.findUnique({
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

    if (!member) {
      return res.status(403).json({ error: 'Você não é membro deste grupo' });
    }

    if (!member.canPost && member.group.settings?.allowMemberPosts === false) {
      return res.status(403).json({ error: 'Você não tem permissão para postar' });
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId: id,
        senderId: userId,
        content,
        imageUrl,
        type: type || MessageType.TEXT,
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
      },
    });

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
export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se é membro
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

    const messages = await prisma.groupMessage.findMany({
      where: {
        groupId: id,
        deletedAt: null,
        ...(before && {
          createdAt: {
            lt: new Date(before as string),
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
export const deleteGroupMessage = async (req: Request, res: Response) => {
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
export const removeMember = async (req: Request, res: Response) => {
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
export const updateMemberRole = async (req: Request, res: Response) => {
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
export const deleteGroup = async (req: Request, res: Response) => {
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
export const updateGroup = async (req: Request, res: Response) => {
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
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { invitedUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
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

    if (existingInvite && existingInvite.status === 'PENDING') {
      return res.status(400).json({ error: 'Convite já enviado' });
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

    // Criar notificação
    await prisma.notification.create({
      data: {
        userId: invitedUserId,
        type: 'GROUP_INVITE',
        content: `${invite.inviter.name} convidou você para o grupo ${invite.group.name}`,
        relatedId: invite.id
      }
    });

    res.json(invite);
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Erro ao enviar convite' });
  }
};

// Responder convite
export const respondInvite = async (req: Request, res: Response) => {
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
export const updateNickname = async (req: Request, res: Response) => {
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
export const toggleMute = async (req: Request, res: Response) => {
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
export const updateGroupBackground = async (req: Request, res: Response) => {
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
export const postImageMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;
    const { imageUrl, content, isNSFW } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member || !member.canPost) {
      return res.status(403).json({ error: 'Sem permissão para postar' });
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
        type: 'SPEND',
        description: 'Imagem enviada no grupo'
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
        isNSFW: isNSFW || false
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
export const getMyInvites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const invites = await prisma.groupInvite.findMany({
      where: {
        invitedId: userId,
        status: 'PENDING'
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
