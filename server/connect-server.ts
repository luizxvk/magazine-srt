/**
 * Rovex Connect - Servidor de WebSockets
 * 
 * Este é um servidor dedicado para o Rovex Connect no Render.
 * Ele lida apenas com conexões WebSocket para:
 * - Chat em tempo real
 * - Canais de voz
 * - Presença de usuários
 * 
 * A API REST continua no Vercel.
 */

import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const PORT = process.env.PORT || 4000;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

interface VoiceUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isStreaming: boolean;
}

// Track connected users and voice channels
const connectedUsers = new Map<string, string>(); // userId -> socketId
const voiceChannels = new Map<string, Map<string, VoiceUser>>(); // channelId -> Map<userId, VoiceUser>
const userSockets = new Map<string, string>(); // socketId -> userId
const peerConnections = new Map<string, Set<string>>(); // userId -> Set of peer userIds

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'rovex-connect',
      users: connectedUsers.size,
      voiceChannels: voiceChannels.size
    }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Rovex Connect WebSocket Server');
});

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
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
  console.log(`[Connect] User connected: ${userId}`);
  
  // Track connection
  connectedUsers.set(userId, socket.id);
  userSockets.set(socket.id, userId);

  // ============================================
  // GROUP CHAT EVENTS
  // ============================================

  socket.on('join-group', (groupId: string) => {
    socket.join(`group:${groupId}`);
    console.log(`[Connect] User ${userId} joined group ${groupId}`);
  });

  socket.on('leave-group', (groupId: string) => {
    socket.leave(`group:${groupId}`);
  });

  socket.on('group-message', async (data: { groupId: string; message: any }) => {
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

  // ============================================
  // VOICE CHANNEL EVENTS
  // ============================================

  socket.on('join-voice', async (data: { channelId: string; groupId: string }) => {
    const { channelId, groupId } = data;
    
    // Leave any existing voice channel
    Array.from(voiceChannels.entries()).forEach(([existingChannelId, users]) => {
      if (users.has(userId)) {
        users.delete(userId);
        socket.leave(`voice:${existingChannelId}`);
        io.to(`voice:${existingChannelId}`).emit('user-left-voice', { userId, channelId: existingChannelId });
        
        if (users.size === 0) {
          voiceChannels.delete(existingChannelId);
        }
      }
    });
    
    // Join the new channel
    socket.join(`voice:${channelId}`);
    
    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Map());
    }
    
    const channelUsers = voiceChannels.get(channelId)!;
    const voiceUser: VoiceUser = {
      userId,
      name: socket.userName || 'Unknown',
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      isStreaming: false,
    };
    
    channelUsers.set(userId, voiceUser);
    
    // Notify everyone in the channel
    io.to(`voice:${channelId}`).emit('user-joined-voice', { 
      userId, 
      channelId,
      user: voiceUser 
    });
    
    // Also notify the group
    io.to(`group:${groupId}`).emit('voice-channel-updated', {
      channelId,
      participants: Array.from(channelUsers.values()),
    });
    
    // Send current participants to the new user
    socket.emit('voice-participants', {
      channelId,
      participants: Array.from(channelUsers.values()),
    });
    
    console.log(`[Connect] User ${userId} joined voice channel ${channelId}`);
  });

  socket.on('leave-voice', (data: { channelId: string; groupId: string }) => {
    const { channelId, groupId } = data;
    
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers) {
      channelUsers.delete(userId);
      
      io.to(`voice:${channelId}`).emit('user-left-voice', { userId, channelId });
      
      // Also notify the group
      io.to(`group:${groupId}`).emit('voice-channel-updated', {
        channelId,
        participants: Array.from(channelUsers.values()),
      });
      
      if (channelUsers.size === 0) {
        voiceChannels.delete(channelId);
      }
    }
    
    socket.leave(`voice:${channelId}`);
    console.log(`[Connect] User ${userId} left voice channel ${channelId}`);
  });

  socket.on('voice-state-update', (data: { channelId: string; isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean }) => {
    const { channelId, ...state } = data;
    
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers && channelUsers.has(userId)) {
      const user = channelUsers.get(userId)!;
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

  socket.on('rtc-offer', (data: { targetUserId: string; offer: RTCSessionDescriptionInit }) => {
    const targetSocketId = connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('rtc-offer', {
        fromUserId: userId,
        offer: data.offer,
      });
    }
  });

  socket.on('rtc-answer', (data: { targetUserId: string; answer: RTCSessionDescriptionInit }) => {
    const targetSocketId = connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('rtc-answer', {
        fromUserId: userId,
        answer: data.answer,
      });
    }
  });

  socket.on('rtc-ice-candidate', (data: { targetUserId: string; candidate: RTCIceCandidate }) => {
    const targetSocketId = connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('rtc-ice-candidate', {
        fromUserId: userId,
        candidate: data.candidate,
      });
    }
  });

  // ============================================
  // DISCONNECT
  // ============================================

  socket.on('disconnect', () => {
    console.log(`[Connect] User disconnected: ${userId}`);
    
    // Remove from all voice channels
    Array.from(voiceChannels.entries()).forEach(([channelId, users]) => {
      if (users.has(userId)) {
        users.delete(userId);
        io.to(`voice:${channelId}`).emit('user-left-voice', { userId, channelId });
        
        if (users.size === 0) {
          voiceChannels.delete(channelId);
        }
      }
    });
    
    // Clean up tracking
    connectedUsers.delete(userId);
    userSockets.delete(socket.id);
    peerConnections.delete(userId);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log('========================================');
  console.log(`🎧 Rovex Connect WebSocket Server`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Connect] SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('[Connect] Server closed');
    process.exit(0);
  });
});
