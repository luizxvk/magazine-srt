import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

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
                    select: { id: true, name: true, displayName: true, avatarUrl: true, trophies: true, level: true, isOnline: true, lastSeenAt: true, membershipType: true }
                },
                addressee: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true, trophies: true, level: true, isOnline: true, lastSeenAt: true, membershipType: true }
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
                    select: { id: true, name: true, displayName: true, avatarUrl: true, isOnline: true, lastSeenAt: true, membershipType: true, doNotDisturb: true }
                },
                addressee: {
                    select: { id: true, name: true, displayName: true, avatarUrl: true, isOnline: true, lastSeenAt: true, membershipType: true, doNotDisturb: true }
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
                    select: { id: true, name: true, displayName: true, avatarUrl: true, trophies: true }
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
