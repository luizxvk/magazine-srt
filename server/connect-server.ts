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
const API_URL = process.env.API_URL || 'https://magazine-srt-react-server.vercel.app';

// Helper function to clean up user's voice state in main API
async function cleanupUserVoiceState(userId: string, token?: string) {
  try {
    // Call main API to leave voice channel and update online status
    await fetch(`${API_URL}/api/connect/voice/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ userId }),
    });
  } catch (error) {
    // Silently fail - user may have already left or API unavailable
    console.log(`[Connect] Could not cleanup voice state for ${userId}:`, error);
  }
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  token?: string; // Store JWT token for API calls
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
    socket.token = token; // Store token for API calls on disconnect
    
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
    io.to(`voice:${channelId}`).emit('voice-user-joined', { 
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
    socket.emit('voice-users', {
      channelId,
      users: Array.from(channelUsers.values()),
    });
    
    console.log(`[Connect] User ${userId} joined voice channel ${channelId}`);
  });

  socket.on('leave-voice', (data: { channelId: string; groupId: string }) => {
    const { channelId, groupId } = data;
    
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers) {
      channelUsers.delete(userId);
      
      io.to(`voice:${channelId}`).emit('voice-user-left', { userId, channelId });
      
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
  // SCREEN SHARING EVENTS
  // ============================================

  socket.on('start-screen-share', (data: { channelId: string }) => {
    const { channelId } = data;
    
    // Update user streaming state and get user info
    const channelUsers = voiceChannels.get(channelId);
    let username = 'Usuário';
    let avatarUrl: string | undefined;
    
    if (channelUsers && channelUsers.has(userId)) {
      const user = channelUsers.get(userId)!;
      user.isStreaming = true;
      username = user.name;
      avatarUrl = user.avatarUrl;
    }
    
    // Notify everyone in the channel with user info
    io.to(`voice:${channelId}`).emit('screen-share-started', { userId, channelId, username, avatarUrl });
    console.log(`[Connect] User ${userId} (${username}) started screen share in ${channelId}`);
  });

  socket.on('stop-screen-share', (data: { channelId: string }) => {
    const { channelId } = data;
    
    // Update user streaming state
    const channelUsers = voiceChannels.get(channelId);
    if (channelUsers && channelUsers.has(userId)) {
      const user = channelUsers.get(userId)!;
      user.isStreaming = false;
    }
    
    // Notify everyone in the channel
    io.to(`voice:${channelId}`).emit('screen-share-stopped', { userId, channelId });
    console.log(`[Connect] User ${userId} stopped screen share in ${channelId}`);
  });

  // ============================================
  // WEBRTC SIGNALING
  // ============================================

  socket.on('webrtc-offer', (data: { targetUserId: string; offer: RTCSessionDescriptionInit; channelId?: string }) => {
    const targetSocketId = connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', {
        fromUserId: userId,
        offer: data.offer,
        channelId: data.channelId,
      });
    }
  });

  socket.on('webrtc-answer', (data: { targetUserId: string; answer: RTCSessionDescriptionInit; channelId?: string }) => {
    const targetSocketId = connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', {
        fromUserId: userId,
        answer: data.answer,
        channelId: data.channelId,
      });
    }
  });

  socket.on('webrtc-ice-candidate', (data: { targetUserId: string; candidate: RTCIceCandidate; channelId?: string }) => {
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
  // DISCONNECT
  // ============================================

  socket.on('disconnect', () => {
    console.log(`[Connect] User disconnected: ${userId}`);
    
    // Check if user was in any voice channel
    let wasInVoice = false;
    
    // Remove from all voice channels
    Array.from(voiceChannels.entries()).forEach(([channelId, users]) => {
      if (users.has(userId)) {
        wasInVoice = true;
        users.delete(userId);
        io.to(`voice:${channelId}`).emit('voice-user-left', { userId, channelId });
        
        if (users.size === 0) {
          voiceChannels.delete(channelId);
        }
      }
    });
    
    // Clean up voice state in the main API database
    if (wasInVoice) {
      cleanupUserVoiceState(userId, socket.token);
    }
    
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
