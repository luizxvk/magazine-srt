import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack, 
  ILocalVideoTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

interface VoiceState {
  channelId: string;
  channelName: string;
  groupName: string;
  groupId: string;
  joinedAt: number;
}

interface VoiceContextType {
  // Connection state
  isJoined: boolean;
  isConnecting: boolean;
  error: string | null;
  currentVoiceInfo: VoiceState | null;
  
  // Audio
  localAudioTrack: IMicrophoneAudioTrack | null;
  isAudioEnabled: boolean;
  isMuted: boolean;
  
  // Output volume (0-400, 100 = normal)
  outputVolume: number;
  setOutputVolume: (volume: number) => void;
  
  // Network stats
  ping: number;
  
  // Speaking detection
  speakingUsers: Set<string>;
  isLocalSpeaking: boolean;
  getAgoraUid: (userId: string) => string;
  
  // Remote users
  remoteUsers: IAgoraRTCRemoteUser[];
  
  // Screen sharing
  localScreenTrack: ILocalVideoTrack | null;
  isScreenSharing: boolean;
  
  // Actions
  joinChannel: (channelId: string, userId: string, token?: string, voiceInfo?: Omit<VoiceState, 'joinedAt'>) => Promise<boolean>;
  leaveChannel: () => Promise<void>;
  toggleMute: () => Promise<void>;
  startScreenShare: (getToken: (channelId: string) => Promise<{ token: string; uid: number } | null>, quality: 'hd' | 'fullhd' | 'native', frameRate: 30 | 60, onStop?: () => void) => Promise<boolean>;
  stopScreenShare: () => Promise<void>;
  
  // Volume levels
  getRemoteAudioLevel: (userId: string) => number;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

// Configure Agora SDK
AgoraRTC.setLogLevel(1);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const screenClientRef = useRef<IAgoraRTCClient | null>(null);
  const channelIdRef = useRef<string>('');
  const tokenRef = useRef<string | null>(null);
  
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVoiceInfo, setCurrentVoiceInfo] = useState<VoiceState | null>(null);
  
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [localScreenTrack, setLocalScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  const savedVolume = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem('rovex-connect-volume') || '100', 10) 
    : 100;
  const [outputVolume, setOutputVolumeState] = useState<number>(savedVolume);
  const outputVolumeRef = useRef<number>(savedVolume);
  const [ping, setPing] = useState<number>(0);
  
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // Restore voice state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('rovex-voice-state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.joinedAt < 24 * 60 * 60 * 1000) {
          setCurrentVoiceInfo(parsed);
        } else {
          localStorage.removeItem('rovex-voice-state');
        }
      } catch {
        localStorage.removeItem('rovex-voice-state');
      }
    }
  }, []);

  // Poll network stats
  useEffect(() => {
    if (!isJoined || !clientRef.current) {
      setPing(0);
      return;
    }

    const interval = setInterval(() => {
      if (clientRef.current) {
        const stats = clientRef.current.getRTCStats();
        setPing(stats.RTT || 0);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isJoined]);

  // Poll audio levels for speaking detection
  useEffect(() => {
    if (!isJoined || !clientRef.current) {
      setSpeakingUsers(new Set());
      setIsLocalSpeaking(false);
      return;
    }

    const SPEAKING_THRESHOLD = 0.01;
    
    const interval = setInterval(() => {
      const newSpeakingUsers = new Set<string>();
      
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
      
      if (localAudioTrack && !isMuted) {
        const localLevel = localAudioTrack.getVolumeLevel();
        setIsLocalSpeaking(localLevel > SPEAKING_THRESHOLD);
      } else {
        setIsLocalSpeaking(false);
      }
      
      setSpeakingUsers(newSpeakingUsers);
    }, 100);

    return () => clearInterval(interval);
  }, [isJoined, localAudioTrack, isMuted]);

  // Initialize client on mount
  useEffect(() => {
    if (!AGORA_APP_ID) {
      console.error('[VoiceContext] No App ID configured');
      setError('Agora App ID not configured');
      return;
    }

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    // Event handlers
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      console.log('[VoiceContext] Subscribed to user:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        user.audioTrack?.play();
        const volume = outputVolumeRef.current;
        user.audioTrack?.setVolume(volume);
      }
      
      setRemoteUsers(Array.from(client.remoteUsers));
    });

    client.on('user-unpublished', (user, mediaType) => {
      console.log('[VoiceContext] User unpublished:', user.uid, mediaType);
      if (mediaType === 'audio') {
        user.audioTrack?.stop();
      }
      setRemoteUsers(Array.from(client.remoteUsers));
    });

    client.on('user-joined', (user) => {
      console.log('[VoiceContext] User joined:', user.uid);
      setRemoteUsers(Array.from(client.remoteUsers));
    });

    client.on('user-left', (user) => {
      console.log('[VoiceContext] User left:', user.uid);
      setRemoteUsers(Array.from(client.remoteUsers));
    });

    client.on('connection-state-change', (curState, prevState) => {
      console.log('[VoiceContext] Connection state:', prevState, '->', curState);
      if (curState === 'DISCONNECTED') {
        setIsJoined(false);
      }
    });

    // NO cleanup here - we want to keep the connection alive!
    // Connection is only closed when user explicitly calls leaveChannel
  }, []);

  const getAgoraUid = useCallback((userId: string): string => {
    const numericUid = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000000);
    return String(numericUid);
  }, []);

  const setOutputVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(400, volume));
    setOutputVolumeState(clampedVolume);
    outputVolumeRef.current = clampedVolume;
    localStorage.setItem('rovex-connect-volume', String(clampedVolume));
    
    if (clientRef.current) {
      clientRef.current.remoteUsers.forEach(user => {
        user.audioTrack?.setVolume(clampedVolume);
      });
    }
  }, []);

  const joinChannel = useCallback(async (
    channelId: string, 
    userId: string, 
    token?: string,
    voiceInfo?: Omit<VoiceState, 'joinedAt'>
  ): Promise<boolean> => {
    if (!clientRef.current) {
      setError('Agora client not initialized');
      return false;
    }

    if (!AGORA_APP_ID) {
      setError('Agora App ID not configured');
      return false;
    }

    const connectionState = clientRef.current.connectionState;
    if (connectionState === 'CONNECTED' || connectionState === 'CONNECTING') {
      console.log('[VoiceContext] Already connected or connecting');
      return true;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const numericUid = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000000);
      
      channelIdRef.current = channelId;
      tokenRef.current = token || null;
      
      await clientRef.current.join(
        AGORA_APP_ID,
        channelId,
        token || null,
        numericUid
      );

      console.log('[VoiceContext] Joined channel with uid:', numericUid);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true,
        ANS: true,
        AGC: true,
      });

      setLocalAudioTrack(audioTrack);
      setIsAudioEnabled(true);

      await clientRef.current.publish([audioTrack]);
      console.log('[VoiceContext] Published local audio');

      setIsJoined(true);
      setIsConnecting(false);

      // Save voice state
      if (voiceInfo) {
        const state: VoiceState = {
          ...voiceInfo,
          joinedAt: Date.now(),
        };
        setCurrentVoiceInfo(state);
        localStorage.setItem('rovex-voice-state', JSON.stringify(state));
      }

      return true;
    } catch (err) {
      console.error('[VoiceContext] Join error:', err);
      setError(err instanceof Error ? err.message : 'Failed to join');
      setIsConnecting(false);
      return false;
    }
  }, []);

  const leaveChannel = useCallback(async () => {
    console.log('[VoiceContext] Leaving channel...');
    
    // Stop screen share first
    if (localScreenTrack) {
      localScreenTrack.close();
      setLocalScreenTrack(null);
      setIsScreenSharing(false);
    }

    if (screenClientRef.current) {
      try {
        await screenClientRef.current.leave();
      } catch (e) {
        console.error('[VoiceContext] Screen client leave error:', e);
      }
    }

    // Stop local audio
    if (localAudioTrack) {
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }

    // Leave main client
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
      } catch (e) {
        console.error('[VoiceContext] Client leave error:', e);
      }
    }

    setIsJoined(false);
    setIsAudioEnabled(false);
    setIsMuted(false);
    setRemoteUsers([]);
    setCurrentVoiceInfo(null);
    
    // Clear localStorage
    localStorage.removeItem('rovex-voice-state');
    
    console.log('[VoiceContext] Left channel');
  }, [localAudioTrack, localScreenTrack]);

  const toggleMute = useCallback(async () => {
    if (localAudioTrack) {
      const newMuted = !isMuted;
      await localAudioTrack.setEnabled(!newMuted);
      setIsMuted(newMuted);
      console.log('[VoiceContext] Muted:', newMuted);
    }
  }, [localAudioTrack, isMuted]);

  const startScreenShare = useCallback(async (
    getToken: (channelId: string) => Promise<{ token: string; uid: number } | null>,
    quality: 'hd' | 'fullhd' | 'native' = 'hd',
    frameRate: 30 | 60 = 30,
    onStop?: () => void
  ): Promise<boolean> => {
    if (!channelIdRef.current) {
      console.error('[VoiceContext] No channel to share screen to');
      return false;
    }

    // Define quality presets with dynamic frameRate
    const qualityPresets = {
      hd: { width: 1280, height: 720, frameRate, bitrateMax: frameRate === 60 ? 3500 : 2500 },
      fullhd: { width: 1920, height: 1080, frameRate, bitrateMax: frameRate === 60 ? 6000 : 4000 },
      native: { frameRate } // Native resolution
    };

    try {
      if (!screenClientRef.current) {
        screenClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      }

      const tokenData = await getToken(channelIdRef.current);
      if (!tokenData) {
        console.error('[VoiceContext] Failed to get screen share token');
        return false;
      }

      const encoderConfig = qualityPresets[quality];
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig },
        'auto' // Enable audio capture from screen share
      );

      // Handle both video-only and video+audio tracks
      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
      const audioTrack = Array.isArray(screenTrack) ? screenTrack[1] : null;

      await screenClientRef.current.join(
        AGORA_APP_ID,
        channelIdRef.current,
        tokenData.token,
        tokenData.uid
      );

      // Publish both video and audio tracks if available
      const tracksToPublish = audioTrack ? [videoTrack, audioTrack] : [videoTrack];
      await screenClientRef.current.publish(tracksToPublish);

      setLocalScreenTrack(videoTrack);
      setIsScreenSharing(true);

      videoTrack.on('track-ended', async () => {
        console.log('[VoiceContext] Screen share ended by user');
        await stopScreenShare();
        // Notify caller that screen share was stopped by browser
        if (onStop) {
          onStop();
        }
      });

      console.log('[VoiceContext] Screen sharing started');
      return true;
    } catch (err) {
      console.error('[VoiceContext] Screen share error:', err);
      return false;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (localScreenTrack) {
      localScreenTrack.close();
      setLocalScreenTrack(null);
    }

    if (screenClientRef.current) {
      try {
        await screenClientRef.current.leave();
      } catch (e) {
        console.error('[VoiceContext] Screen client leave error:', e);
      }
    }

    setIsScreenSharing(false);
    console.log('[VoiceContext] Screen sharing stopped');
  }, [localScreenTrack]);

  const getRemoteAudioLevel = useCallback((userId: string): number => {
    if (!clientRef.current) return 0;
    
    const numericUid = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100000000);
    const user = clientRef.current.remoteUsers.find(u => u.uid === numericUid);
    
    if (user?.audioTrack) {
      return user.audioTrack.getVolumeLevel();
    }
    return 0;
  }, []);

  const value: VoiceContextType = {
    isJoined,
    isConnecting,
    error,
    currentVoiceInfo,
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

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
