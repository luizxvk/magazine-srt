
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

// Send a message
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { receiverId, content, storyImageUrl } = req.body;
        const senderId = req.user?.userId;

        if (!senderId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!receiverId || !content) {
            return res.status(400).json({ error: 'Receiver ID and content are required' });
        }

        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { deletedAt: true }
        });

        if (receiver?.deletedAt) {
            return res.status(400).json({ error: 'Usuário não encontrado ou removido' });
        }

        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content,
                storyImageUrl: storyImageUrl || null
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        deletedAt: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        deletedAt: true
                    }
                }
            }
        });

        // Create notification for receiver
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'SYSTEM', // Using SYSTEM for now, could add MESSAGE type later
                content: `Você recebeu uma nova mensagem de ${message.sender.name}`,
                read: false
            }
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Get conversation with a specific user
export const getConversation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { otherUserId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        deletedAt: true
                    }
                }
            }
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};

// Get recent conversations (list of users messaged with)
export const getRecentConversations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Find all messages involving the user
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        deletedAt: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        deletedAt: true
                    }
                }
            }
        });

        // Extract unique users from messages
        const uniqueUsers = new Map();

        messages.forEach((msg: any) => {
            const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
            if (!uniqueUsers.has(otherUser.id)) {
                uniqueUsers.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: msg
                });
            }
        });

        const conversations = Array.from(uniqueUsers.values());

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching recent conversations:', error);
        res.status(500).json({ error: 'Failed to fetch recent conversations' });
    }
};

// Mark messages as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { senderId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await prisma.message.updateMany({
            where: {
                receiverId: userId,
                senderId: senderId,
                read: false
            },
            data: {
                read: true
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};
