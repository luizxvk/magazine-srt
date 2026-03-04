import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface VoiceUser {
  odiserId: string;
  name: string;
  avatarUrl?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isStreaming: boolean;
}

interface Message {
  id: string;
  content: string;
  groupId: string;
  sender: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  // Group chat
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendMessage: (groupId: string, message: Message) => void;
  setTyping: (groupId: string, userName: string) => void;
  stopTyping: (groupId: string) => void;
  onNewMessage: (callback: (message: Message) => void) => void;
  onUserTyping: (callback: (data: { userId: string; userName: string }) => void) => void;
  // Voice
  joinVoice: (channelId: string, user: VoiceUser) => void;
  leaveVoice: (channelId: string) => void;
  updateVoiceState: (channelId: string, state: Partial<VoiceUser>) => void;
  onVoiceUserJoined: (callback: (data: { user: VoiceUser; channelId: string }) => void) => void;
  onVoiceUserLeft: (callback: (data: { userId: string; channelId: string }) => void) => void;
  onVoiceUsers: (callback: (data: { channelId: string; users: VoiceUser[] }) => void) => void;
  onVoiceStateChanged: (callback: (data: any) => void) => void;
  // WebRTC
  sendOffer: (targetUserId: string, offer: RTCSessionDescriptionInit, channelId: string) => void;
  sendAnswer: (targetUserId: string, answer: RTCSessionDescriptionInit, channelId: string) => void;
  sendIceCandidate: (targetUserId: string, candidate: RTCIceCandidateInit, channelId: string) => void;
  onWebRTCOffer: (callback: (data: { fromUserId: string; offer: RTCSessionDescriptionInit; channelId: string }) => void) => void;
  onWebRTCAnswer: (callback: (data: { fromUserId: string; answer: RTCSessionDescriptionInit; channelId: string }) => void) => void;
  onWebRTCIceCandidate: (callback: (data: { fromUserId: string; candidate: RTCIceCandidateInit; channelId: string }) => void) => void;
  // Screen sharing
  startScreenShare: (channelId: string) => void;
  stopScreenShare: (channelId: string) => void;
  onScreenShareStarted: (callback: (data: { userId: string; channelId: string }) => void) => void;
  onScreenShareStopped: (callback: (data: { userId: string; channelId: string }) => void) => void;
  // Notifications
  subscribeNotifications: () => void;
  onNotification: (callback: (notification: any) => void) => void;
}

// Use dedicated Connect server if available (Render), otherwise fallback to API server
// VITE_CONNECT_URL should point to https://rovex-connect.onrender.com in production
const SOCKET_URL = import.meta.env.VITE_CONNECT_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

// Log socket URL for debugging - IMPORTANT: if this shows Vercel URL, voice will NOT work
console.log('[Socket] SOCKET_URL:', SOCKET_URL);
if (!import.meta.env.VITE_CONNECT_URL) {
  console.warn('[Socket] ⚠️ VITE_CONNECT_URL not set! Voice chat will NOT work properly. Set it to https://rovex-connect.onrender.com');
}
console.log('[Socket] VITE_CONNECT_URL:', import.meta.env.VITE_CONNECT_URL || '(not set - using fallback)');
console.log('[Socket] VITE_API_URL:', import.meta.env.VITE_API_URL);

export function useSocket(): UseSocketReturn {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<Map<string, Function>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || !user) {
      return;
    }

    // Connect to socket
    // Note: Use polling first as Vercel serverless doesn't support WebSocket
    // For full WebSocket support, deploy backend to Railway/Render/Fly.io
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'], // Polling first for Vercel compatibility
      upgrade: true, // Allow upgrade to websocket if available
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected via', socket.io.engine.transport.name);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      // Suppress common Vercel WebSocket errors - polling will work
      if (!error.message.includes('websocket error')) {
        console.warn('[Socket] Connection error:', error.message);
      }
    });

    // Set up event listeners
    socket.on('new-message', (message: Message) => {
      const callback = callbacksRef.current.get('new-message');
      if (callback) callback(message);
    });

    socket.on('user-typing', (data) => {
      const callback = callbacksRef.current.get('user-typing');
      if (callback) callback(data);
    });

    socket.on('user-stop-typing', (data) => {
      const callback = callbacksRef.current.get('user-stop-typing');
      if (callback) callback(data);
    });

    socket.on('voice-user-joined', (data) => {
      console.log('[Socket] voice-user-joined received:', data);
      const callback = callbacksRef.current.get('voice-user-joined');
      if (callback) callback(data);
    });

    socket.on('voice-user-left', (data) => {
      console.log('[Socket] voice-user-left received:', data);
      const callback = callbacksRef.current.get('voice-user-left');
      if (callback) callback(data);
    });

    socket.on('voice-users', (data) => {
      console.log('[Socket] voice-users received:', data);
      const callback = callbacksRef.current.get('voice-users');
      if (callback) callback(data);
    });

    socket.on('voice-state-changed', (data) => {
      console.log('[Socket] voice-state-changed received:', data);
      const callback = callbacksRef.current.get('voice-state-changed');
      if (callback) callback(data);
    });

    socket.on('webrtc-offer', (data) => {
      console.log('[Socket] webrtc-offer received:', data);
      const callback = callbacksRef.current.get('webrtc-offer');
      if (callback) callback(data);
    });

    socket.on('webrtc-answer', (data) => {
      console.log('[Socket] webrtc-answer received:', data);
      const callback = callbacksRef.current.get('webrtc-answer');
      if (callback) callback(data);
    });

    socket.on('webrtc-ice-candidate', (data) => {
      console.log('[Socket] webrtc-ice-candidate received:', data);
      const callback = callbacksRef.current.get('webrtc-ice-candidate');
      if (callback) callback(data);
    });

    socket.on('screen-share-started', (data) => {
      const callback = callbacksRef.current.get('screen-share-started');
      if (callback) callback(data);
    });

    socket.on('screen-share-stopped', (data) => {
      const callback = callbacksRef.current.get('screen-share-stopped');
      if (callback) callback(data);
    });

    socket.on('notification', (notification) => {
      const callback = callbacksRef.current.get('notification');
      if (callback) callback(notification);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  // Group chat methods
  const joinGroup = useCallback((groupId: string) => {
    socketRef.current?.emit('join-group', groupId);
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    socketRef.current?.emit('leave-group', groupId);
  }, []);

  const sendMessage = useCallback((groupId: string, message: Message) => {
    socketRef.current?.emit('group-message', { groupId, message });
  }, []);

  const setTyping = useCallback((groupId: string, userName: string) => {
    socketRef.current?.emit('typing', { groupId, userName });
  }, []);

  const stopTyping = useCallback((groupId: string) => {
    socketRef.current?.emit('stop-typing', { groupId });
  }, []);

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    callbacksRef.current.set('new-message', callback);
  }, []);

  const onUserTyping = useCallback((callback: (data: { userId: string; userName: string }) => void) => {
    callbacksRef.current.set('user-typing', callback);
  }, []);

  // Voice methods
  const joinVoice = useCallback((channelId: string, user: VoiceUser) => {
    console.log('[Socket] joinVoice emitting:', { channelId, user });
    console.log('[Socket] socketRef.current:', socketRef.current?.connected);
    socketRef.current?.emit('join-voice', { channelId, user });
  }, []);

  const leaveVoice = useCallback((channelId: string) => {
    socketRef.current?.emit('leave-voice', { channelId });
  }, []);

  const updateVoiceState = useCallback((channelId: string, state: Partial<VoiceUser>) => {
    socketRef.current?.emit('voice-state-update', { channelId, ...state });
  }, []);

  const onVoiceUserJoined = useCallback((callback: (data: { user: VoiceUser; channelId: string }) => void) => {
    callbacksRef.current.set('voice-user-joined', callback);
  }, []);

  const onVoiceUserLeft = useCallback((callback: (data: { userId: string; channelId: string }) => void) => {
    callbacksRef.current.set('voice-user-left', callback);
  }, []);

  const onVoiceUsers = useCallback((callback: (data: { channelId: string; users: VoiceUser[] }) => void) => {
    callbacksRef.current.set('voice-users', callback);
  }, []);

  const onVoiceStateChanged = useCallback((callback: (data: any) => void) => {
    callbacksRef.current.set('voice-state-changed', callback);
  }, []);

  // WebRTC methods
  const sendOffer = useCallback((targetUserId: string, offer: RTCSessionDescriptionInit, channelId: string) => {
    socketRef.current?.emit('webrtc-offer', { targetUserId, offer, channelId });
  }, []);

  const sendAnswer = useCallback((targetUserId: string, answer: RTCSessionDescriptionInit, channelId: string) => {
    socketRef.current?.emit('webrtc-answer', { targetUserId, answer, channelId });
  }, []);

  const sendIceCandidate = useCallback((targetUserId: string, candidate: RTCIceCandidateInit, channelId: string) => {
    socketRef.current?.emit('webrtc-ice-candidate', { targetUserId, candidate, channelId });
  }, []);

  const onWebRTCOffer = useCallback((callback: (data: { fromUserId: string; offer: RTCSessionDescriptionInit; channelId: string }) => void) => {
    callbacksRef.current.set('webrtc-offer', callback);
  }, []);

  const onWebRTCAnswer = useCallback((callback: (data: { fromUserId: string; answer: RTCSessionDescriptionInit; channelId: string }) => void) => {
    callbacksRef.current.set('webrtc-answer', callback);
  }, []);

  const onWebRTCIceCandidate = useCallback((callback: (data: { fromUserId: string; candidate: RTCIceCandidateInit; channelId: string }) => void) => {
    callbacksRef.current.set('webrtc-ice-candidate', callback);
  }, []);

  // Screen sharing methods
  const startScreenShare = useCallback((channelId: string) => {
    socketRef.current?.emit('start-screen-share', { channelId });
  }, []);

  const stopScreenShare = useCallback((channelId: string) => {
    socketRef.current?.emit('stop-screen-share', { channelId });
  }, []);

  const onScreenShareStarted = useCallback((callback: (data: { userId: string; channelId: string }) => void) => {
    callbacksRef.current.set('screen-share-started', callback);
  }, []);

  const onScreenShareStopped = useCallback((callback: (data: { userId: string; channelId: string }) => void) => {
    callbacksRef.current.set('screen-share-stopped', callback);
  }, []);

  // Notification methods
  const subscribeNotifications = useCallback(() => {
    socketRef.current?.emit('subscribe-notifications');
  }, []);

  const onNotification = useCallback((callback: (notification: any) => void) => {
    callbacksRef.current.set('notification', callback);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinGroup,
    leaveGroup,
    sendMessage,
    setTyping,
    stopTyping,
    onNewMessage,
    onUserTyping,
    joinVoice,
    leaveVoice,
    updateVoiceState,
    onVoiceUserJoined,
    onVoiceUserLeft,
    onVoiceUsers,
    onVoiceStateChanged,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    onWebRTCOffer,
    onWebRTCAnswer,
    onWebRTCIceCandidate,
    startScreenShare,
    stopScreenShare,
    onScreenShareStarted,
    onScreenShareStopped,
    subscribeNotifications,
    onNotification,
  };
}
