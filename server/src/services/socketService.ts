import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

interface VoiceUser {
  odiserId: string;
  name: string;
  avatarUrl?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isStreaming: boolean;
}

// Track connected users and voice channels
const connectedUsers = new Map<string, string>(); // odiserId -> odiserId
const voiceChannels = new Map<string, Map<string, VoiceUser>>(); // channelId -> Map<odiserId, VoiceUser>
const userSockets = new Map<string, string>(); // odiserId -> odiserId
const peerConnections = new Map<string, Set<string>>(); // odiserId -> Set of peer odiiserIds

let io: SocketIOServer;

export function initializeSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://magazine-srt.vercel.app',
        'https://magazine-mgt.vercel.app',
        /\.vercel\.app$/,
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string; name?: string };
      socket.userId = decoded.userId;
      socket.userName = decoded.name;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`[Socket] User connected: ${userId}`);
    
    // Track connection
    connectedUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);

    // Update user online status
    updateUserOnlineStatus(userId, true);

    // ============================================
    // GROUP CHAT EVENTS
    // ============================================

    socket.on('join-group', (groupId: string) => {
      socket.join(`group:${groupId}`);
      console.log(`[Socket] User ${userId} joined group ${groupId}`);
    });

    socket.on('leave-group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('group-message', async (data: { groupId: string; message: any }) => {
      // Broadcast message to all users in the group
      socket.to(`group:${data.groupId}`).emit('new-message', {
        ...data.message,
        groupId: data.groupId,
      });
    });

    socket.on('typing', (data: { groupId: string; userName: string }) => {
      socket.to(`group:${data.groupId}`).emit('user-typing', {
        userId,
        userName: data.userName,
      });
    });

    socket.on('stop-typing', (data: { groupId: string }) => {
      socket.to(`group:${data.groupId}`).emit('user-stop-typing', { userId });
    });

    // ============================================
    // VOICE CHANNEL EVENTS
    // ============================================

    socket.on('join-voice', async (data: { channelId: string; user: VoiceUser }) => {
      const { channelId, user } = data;
      
      // Leave any existing voice channel
      for (const [chId, users] of voiceChannels.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          socket.leave(`voice:${chId}`);
          io.to(`voice:${chId}`).emit('voice-user-left', { odiserId: user, channelId: chId });
        }
      }

      // Join new channel
      if (!voiceChannels.has(channelId)) {
        voiceChannels.set(channelId, new Map());
      }
      voiceChannels.get(channelId)!.set(userId, user);
      socket.join(`voice:${channelId}`);

      // Get existing users in channel
      const existingUsers = Array.from(voiceChannels.get(channelId)!.values());
      
      // Notify others in channel
      socket.to(`voice:${channelId}`).emit('voice-user-joined', { user, channelId });
      
      // Send existing users to the new user
      socket.emit('voice-users', { channelId, users: existingUsers });
      
      console.log(`[Socket] User ${userId} joined voice channel ${channelId}`);
    });

    socket.on('leave-voice', (data: { channelId: string }) => {
      const { channelId } = data;
      
      if (voiceChannels.has(channelId)) {
        const user = voiceChannels.get(channelId)!.get(userId);
        voiceChannels.get(channelId)!.delete(userId);
        socket.leave(`voice:${channelId}`);
        io.to(`voice:${channelId}`).emit('voice-user-left', { userId, channelId });
        
        // Clean up peer connections
        cleanupPeerConnections(userId);
      }
    });

    socket.on('voice-state-update', (data: { channelId: string; isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean; isStreaming?: boolean }) => {
      const { channelId, ...state } = data;
      
      if (voiceChannels.has(channelId) && voiceChannels.get(channelId)!.has(userId)) {
        const user = voiceChannels.get(channelId)!.get(userId)!;
        Object.assign(user, state);
        
        io.to(`voice:${channelId}`).emit('voice-state-changed', {
          userId,
          channelId,
          ...state,
        });
      }
    });

    // ============================================
    // WEBRTC SIGNALING
    // ============================================

    socket.on('webrtc-offer', (data: { targetUserId: string; offer: RTCSessionDescriptionInit; channelId: string }) => {
      const targetSocketId = connectedUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-offer', {
          fromUserId: userId,
          offer: data.offer,
          channelId: data.channelId,
        });
        
        // Track peer connection
        if (!peerConnections.has(userId)) {
          peerConnections.set(userId, new Set());
        }
        peerConnections.get(userId)!.add(data.targetUserId);
      }
    });

    socket.on('webrtc-answer', (data: { targetUserId: string; answer: RTCSessionDescriptionInit; channelId: string }) => {
      const targetSocketId = connectedUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-answer', {
          fromUserId: userId,
          answer: data.answer,
          channelId: data.channelId,
        });
      }
    });

    socket.on('webrtc-ice-candidate', (data: { targetUserId: string; candidate: RTCIceCandidateInit; channelId: string }) => {
      const targetSocketId = connectedUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc-ice-candidate', {
          fromUserId: userId,
          candidate: data.candidate,
          channelId: data.channelId,
        });
      }
    });

    // ============================================
    // SCREEN SHARING
    // ============================================

    socket.on('start-screen-share', (data: { channelId: string }) => {
      io.to(`voice:${data.channelId}`).emit('screen-share-started', {
        userId,
        channelId: data.channelId,
      });
    });

    socket.on('stop-screen-share', (data: { channelId: string }) => {
      io.to(`voice:${data.channelId}`).emit('screen-share-stopped', {
        userId,
        channelId: data.channelId,
      });
    });

    // ============================================
    // NOTIFICATIONS
    // ============================================

    socket.on('subscribe-notifications', () => {
      socket.join(`notifications:${userId}`);
    });

    // ============================================
    // DISCONNECT
    // ============================================

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      
      // Remove from all voice channels
      for (const [channelId, users] of voiceChannels.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(`voice:${channelId}`).emit('voice-user-left', { userId, channelId });
        }
      }
      
      // Cleanup
      connectedUsers.delete(userId);
      userSockets.delete(socket.id);
      cleanupPeerConnections(userId);
      
      // Update online status
      updateUserOnlineStatus(userId, false);
    });
  });

  return io;
}

function cleanupPeerConnections(userId: string) {
  if (peerConnections.has(userId)) {
    peerConnections.delete(userId);
  }
  
  // Remove references from other users
  for (const [, peers] of peerConnections.entries()) {
    peers.delete(userId);
  }
}

async function updateUserOnlineStatus(userId: string, isOnline: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeenAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating user online status:', error);
  }
}

// Export functions to emit events from controllers
export function emitToGroup(groupId: string, event: string, data: any) {
  if (io) {
    io.to(`group:${groupId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  }
}

export function emitNotification(userId: string, notification: any) {
  if (io) {
    io.to(`notifications:${userId}`).emit('notification', notification);
  }
}

export function getOnlineUsers(): string[] {
  return Array.from(connectedUsers.keys());
}

export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}

export { io };
