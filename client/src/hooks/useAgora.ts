import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';

// Agora App ID - get from https://console.agora.io
// Use .trim() to remove any whitespace/newlines from environment variable
const AGORA_APP_ID = (import.meta.env.VITE_AGORA_APP_ID || '').trim();

// Debug: log App ID (first/last 4 chars only for security)
if (AGORA_APP_ID) {
  console.log('[Agora] App ID configured:', AGORA_APP_ID.slice(0, 4) + '...' + AGORA_APP_ID.slice(-4), 'length:', AGORA_APP_ID.length);
} else {
  console.error('[Agora] No App ID configured! Set VITE_AGORA_APP_ID');
}

interface UseAgoraReturn {
  // Connection state
  isJoined: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Audio
  localAudioTrack: IMicrophoneAudioTrack | null;
  isAudioEnabled: boolean;
  isMuted: boolean;
  
  // Output volume (0-400, 100 = normal)
  outputVolume: number;
  setOutputVolume: (volume: number) => void;
  
  // Network stats
  ping: number; // RTT in ms
  
  // Speaking detection
  speakingUsers: Set<string>; // UIDs of users currently speaking (Agora UIDs)
  isLocalSpeaking: boolean;
  getAgoraUid: (userId: string) => string; // Convert system userId to Agora UID
  
  // Remote users
  remoteUsers: IAgoraRTCRemoteUser[];
  
  // Screen sharing
  localScreenTrack: ILocalVideoTrack | null;
  isScreenSharing: boolean;
  
  // Actions
  joinChannel: (channelId: string, userId: string, token?: string) => Promise<boolean>;
  leaveChannel: () => Promise<void>;
  toggleMute: () => Promise<void>;
  startScreenShare: (getToken: (channelId: string) => Promise<{ token: string; uid: number } | null>) => Promise<boolean>;
  stopScreenShare: () => Promise<void>;
  
  // Volume levels (for speaking indicators)
  getRemoteAudioLevel: (userId: string) => number;
}

// Configure Agora SDK
AgoraRTC.setLogLevel(1); // 0: DEBUG, 1: INFO, 2: WARNING, 3: ERROR, 4: NONE

export function useAgora(): UseAgoraReturn {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const screenClientRef = useRef<IAgoraRTCClient | null>(null);
  const channelIdRef = useRef<string>('');
  const tokenRef = useRef<string | null>(null);
  
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [localScreenTrack, setLocalScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  // Load saved volume from localStorage
  const savedVolume = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem('rovex-connect-volume') || '100', 10) 
    : 100;
  const [outputVolume, setOutputVolumeState] = useState<number>(savedVolume);
  const outputVolumeRef = useRef<number>(savedVolume);
  const [ping, setPing] = useState<number>(0);
  
  // Speaking detection
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // Poll network stats for ping/RTT
  useEffect(() => {
    if (!isJoined || !clientRef.current) {
      setPing(0);
      return;
    }

    const interval = setInterval(() => {
      if (clientRef.current) {
        const stats = clientRef.current.getRTCStats();
        // RTT is in milliseconds
        setPing(stats.RTT || 0);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isJoined]);

  // Poll audio levels for speaking detection (like Discord green ring)
  useEffect(() => {
    if (!isJoined || !clientRef.current) {
      setSpeakingUsers(new Set());
      setIsLocalSpeaking(false);
      return;
    }

    const SPEAKING_THRESHOLD = 0.01; // Volume level threshold for speaking
    
    const interval = setInterval(() => {
      const newSpeakingUsers = new Set<string>();
      
      // Check remote users
      if (clientRef.current) {
        const users = clientRef.current.remoteUsers;
        for (const user of users) {
          if (user.audioTrack) {
            const level = user.audioTrack.getVolumeLevel();
            if (level > SPEAKING_THRESHOLD) {
              newSpeakingUsers.add(String(user.uid));
            }
          }
        }
      }
      
      // Check local audio
      if (localAudioTrack && !isMuted) {
        const localLevel = localAudioTrack.getVolumeLevel();
        setIsLocalSpeaking(localLevel > SPEAKING_THRESHOLD);
      } else {
        setIsLocalSpeaking(false);
      }
      
      setSpeakingUsers(newSpeakingUsers);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isJoined, localAudioTrack, isMuted]);

  // Initialize client on mount
  useEffect(() => {
    if (!AGORA_APP_ID) {
      console.error('[Agora] No App ID configured. Set VITE_AGORA_APP_ID environment variable.');
      setError('Agora App ID not configured');
      return;
    }

    // Create RTC client for voice
    const client = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8' 
    });
    clientRef.current = client;

    // Set up event handlers
    client.on('user-published', async (user, mediaType) => {
      console.log('[Agora] User published:', user.uid, mediaType);
      
      // Subscribe to the remote user
      await client.subscribe(user, mediaType);
      console.log('[Agora] Subscribed to:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        // Play the remote audio track
        user.audioTrack?.play();
        // Apply current volume setting
        user.audioTrack?.setVolume(outputVolumeRef.current);
        console.log('[Agora] Playing audio from:', user.uid, 'volume:', outputVolumeRef.current);
      }
      
      if (mediaType === 'video') {
        console.log('[Agora] Video track available from:', user.uid);
      }
      
      // Update remote users list
      setRemoteUsers(prev => {
        const exists = prev.find(u => u.uid === user.uid);
        if (exists) {
          return prev.map(u => u.uid === user.uid ? user : u);
        }
        return [...prev, user];
      });
    });

    client.on('user-unpublished', (user, mediaType) => {
      console.log('[Agora] User unpublished:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        user.audioTrack?.stop();
      }
      
      // Update remote users list
      setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? user : u));
    });

    client.on('user-joined', (user) => {
      console.log('[Agora] User joined:', user.uid);
      setRemoteUsers(prev => {
        const exists = prev.find(u => u.uid === user.uid);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
    });

    client.on('user-left', (user) => {
      console.log('[Agora] User left:', user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    client.on('connection-state-change', (curState, prevState) => {
      console.log('[Agora] Connection state:', prevState, '->', curState);
    });

    client.on('exception', (event) => {
      console.error('[Agora] Exception:', event);
    });

    return () => {
      // Cleanup on unmount - only if not keeping voice state for mini player
      const voiceState = localStorage.getItem('rovex-voice-state');
      if (!voiceState) {
        if (clientRef.current) {
          clientRef.current.leave().catch(console.error);
        }
        if (screenClientRef.current) {
          screenClientRef.current.leave().catch(console.error);
        }
      }
    };
  }, []);

  // Join a voice channel
  const joinChannel = useCallback(async (channelId: string, userId: string, token?: string): Promise<boolean> => {
    if (!clientRef.current) {
      setError('Agora client not initialized');
      return false;
    }

    if (!AGORA_APP_ID) {
      setError('Agora App ID not configured');
      return false;
    }

    // Check if already joined or joining
    const connectionState = clientRef.current.connectionState;
    if (connectionState === 'CONNECTED' || connectionState === 'CONNECTING') {
      console.log('[Agora] Already connected or connecting, skipping join');
      return true;
    }

    try {
      setIsConnecting(true);
      setError(null);

      console.log('[Agora] Joining channel:', channelId, 'as user:', userId);
      console.log('[Agora] Using App ID:', AGORA_APP_ID ? `${AGORA_APP_ID.slice(0, 4)}...${AGORA_APP_ID.slice(-4)} (len: ${AGORA_APP_ID.length})` : 'EMPTY!');
      console.log('[Agora] Token provided:', token ? `${token.slice(0, 20)}... (len: ${token.length})` : 'NO TOKEN');

      // Join the channel
      // For testing mode, token can be null
      // For production, generate token on server using App Certificate
      // Convert UUID to numeric hash for Agora (they recommend numeric IDs)
      const numericUid = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000000);
      
      // Store credentials for screen sharing
      channelIdRef.current = channelId;
      tokenRef.current = token || null;
      
      console.log('[Agora] Attempting join with:', { appId: AGORA_APP_ID.slice(0, 4), channelId, hasToken: !!token, uid: numericUid });
      
      await clientRef.current.join(
        AGORA_APP_ID,
        channelId,
        token || null,
        numericUid
      );

      console.log('[Agora] Joined channel successfully with uid:', numericUid);

      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression
        AGC: true, // Automatic Gain Control
      });

      setLocalAudioTrack(audioTrack);
      setIsAudioEnabled(true);

      // Publish local audio track
      await clientRef.current.publish([audioTrack]);
      console.log('[Agora] Published local audio track');

      setIsJoined(true);
      setIsConnecting(false);
      return true;
    } catch (err: any) {
      console.error('[Agora] Error joining channel:', err);
      setError(err.message || 'Failed to join channel');
      setIsConnecting(false);
      return false;
    }
  }, []);

  // Leave the channel
  const leaveChannel = useCallback(async (): Promise<void> => {
    try {
      // Stop and close local audio track
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      // Stop screen sharing
      if (localScreenTrack) {
        localScreenTrack.stop();
        localScreenTrack.close();
        setLocalScreenTrack(null);
        setIsScreenSharing(false);
      }

      // Leave screen share client
      if (screenClientRef.current) {
        await screenClientRef.current.leave();
      }

      // Leave main client
      if (clientRef.current) {
        await clientRef.current.leave();
      }

      setIsJoined(false);
      setIsAudioEnabled(false);
      setIsMuted(false);
      setRemoteUsers([]);
      console.log('[Agora] Left channel');
    } catch (err) {
      console.error('[Agora] Error leaving channel:', err);
    }
  }, [localAudioTrack, localScreenTrack]);

  // Toggle mute
  const toggleMute = useCallback(async (): Promise<void> => {
    if (!localAudioTrack) return;

    try {
      if (isMuted) {
        await localAudioTrack.setEnabled(true);
        setIsMuted(false);
        console.log('[Agora] Unmuted');
      } else {
        await localAudioTrack.setEnabled(false);
        setIsMuted(true);
        console.log('[Agora] Muted');
      }
    } catch (err) {
      console.error('[Agora] Error toggling mute:', err);
    }
  }, [localAudioTrack, isMuted]);

  // Start screen sharing
  const startScreenShare = useCallback(async (
    getToken: (channelId: string) => Promise<{ token: string; uid: number } | null>
  ): Promise<boolean> => {
    if (!clientRef.current || !isJoined || !channelIdRef.current) {
      console.warn('[Agora] Cannot start screen share - not joined');
      return false;
    }

    try {
      // Create screen share client if not exists
      if (!screenClientRef.current) {
        screenClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      }

      // Create screen video track first (this prompts for permission)
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: {
            width: 1920,
            height: 1080,
            frameRate: 30,
            bitrateMax: 3000,
            bitrateMin: 1500,
          },
        },
        'disable' // Don't capture audio from screen
      );

      // Handle array return (some browsers return [videoTrack, audioTrack])
      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

      // Get token for screen share (uses screen-specific UID on server)
      const tokenData = await getToken(channelIdRef.current);
      if (!tokenData) {
        console.error('[Agora] Failed to get token for screen share');
        videoTrack.close();
        return false;
      }

      // Join with screen client using the token and UID from server
      await screenClientRef.current.join(
        AGORA_APP_ID,
        channelIdRef.current,
        tokenData.token,
        tokenData.uid
      );

      await screenClientRef.current.publish([videoTrack]);

      setLocalScreenTrack(videoTrack);
      setIsScreenSharing(true);

      // Handle when user stops sharing via browser UI
      videoTrack.on('track-ended', () => {
        console.log('[Agora] Screen share ended by user');
        stopScreenShare();
      });

      console.log('[Agora] Screen share started with uid:', tokenData.uid);
      return true;
    } catch (err: any) {
      console.error('[Agora] Error starting screen share:', err);
      // User cancelled or permission denied
      if (err.code === 'PERMISSION_DENIED') {
        console.log('[Agora] Screen share permission denied');
      }
      return false;
    }
  }, [isJoined]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async (): Promise<void> => {
    try {
      if (localScreenTrack) {
        localScreenTrack.stop();
        localScreenTrack.close();
        setLocalScreenTrack(null);
      }

      if (screenClientRef.current) {
        await screenClientRef.current.leave();
      }

      setIsScreenSharing(false);
      console.log('[Agora] Screen share stopped');
    } catch (err) {
      console.error('[Agora] Error stopping screen share:', err);
    }
  }, [localScreenTrack]);

  // Get audio level for a remote user (for speaking indicator)
  const getRemoteAudioLevel = useCallback((userId: string): number => {
    const user = remoteUsers.find(u => String(u.uid) === userId);
    if (user?.audioTrack) {
      return user.audioTrack.getVolumeLevel();
    }
    return 0;
  }, [remoteUsers]);

  // Set output volume for all remote users (0-400, 100 = normal, 400 = 4x boost)
  const setOutputVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(400, volume));
    setOutputVolumeState(clampedVolume);
    outputVolumeRef.current = clampedVolume;
    
    // Save to localStorage for persistence
    localStorage.setItem('rovex-connect-volume', String(clampedVolume));
    
    // Apply volume to all remote audio tracks
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(clampedVolume);
        console.log('[Agora] Set volume for user', user.uid, 'to', clampedVolume);
      }
    });
  }, [remoteUsers]);

  // Convert system userId to Agora UID (must match the algorithm used in joinChannel)
  const getAgoraUid = useCallback((userId: string): string => {
    const numericUid = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000000);
    return String(numericUid);
  }, []);

  return {
    isJoined,
    isConnecting,
    error,
    localAudioTrack,
    isAudioEnabled,
    isMuted,
    outputVolume,
    setOutputVolume,
    ping,
    speakingUsers,
    isLocalSpeaking,
    getAgoraUid,
    remoteUsers,
    localScreenTrack,
    isScreenSharing,
    joinChannel,
    leaveChannel,
    toggleMute,
    startScreenShare,
    stopScreenShare,
    getRemoteAudioLevel,
  };
}
