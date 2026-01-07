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
