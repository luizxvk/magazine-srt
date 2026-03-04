import { useRef, useCallback, useState, useEffect } from 'react';
import { useSocket } from './useSocket';

interface PeerConnection {
  odiserId: string;
  connection: RTCPeerConnection;
  audioStream?: MediaStream;
  screenStream?: MediaStream;
}

interface UseWebRTCReturn {
  // Audio
  localAudioStream: MediaStream | null;
  isAudioEnabled: boolean;
  startAudio: () => Promise<boolean>;
  stopAudio: () => void;
  toggleMute: () => void;
  // Screen sharing
  localScreenStream: MediaStream | null;
  isScreenSharing: boolean;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => void;
  // Remote streams
  remoteAudioStreams: Map<string, MediaStream>;
  remoteScreenStreams: Map<string, MediaStream>;
  // Connection
  connectToPeer: (odiserId: string, channelId: string) => Promise<void>;
  disconnectFromPeer: (odiserId: string) => void;
  disconnectAll: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC(channelId: string | null): UseWebRTCReturn {
  const { 
    sendOffer, 
    sendAnswer, 
    sendIceCandidate,
    onWebRTCOffer,
    onWebRTCAnswer,
    onWebRTCIceCandidate,
    startScreenShare: socketStartScreenShare,
    stopScreenShare: socketStopScreenShare,
  } = useSocket();

  const peerConnections = useRef<Map<string, PeerConnection>>(new Map());
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);

  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Map<string, MediaStream>>(new Map());
  const [remoteScreenStreams, setRemoteScreenStreams] = useState<Map<string, MediaStream>>(new Map());

  // Create peer connection
  const createPeerConnection = useCallback((odiserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelId) {
        console.log('[WebRTC] Sending ICE candidate to:', odiserId, event.candidate.candidate.substring(0, 50));
        sendIceCandidate(odiserId, event.candidate.toJSON(), channelId);
      } else if (!event.candidate) {
        console.log('[WebRTC] ICE gathering complete for:', odiserId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state with ${odiserId}:`, pc.iceConnectionState);
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received track from ${odiserId}:`, event.track.kind);
      const stream = event.streams[0];
      if (stream) {
        // Determine if it's audio or video (screen share)
        const hasVideo = stream.getVideoTracks().length > 0;
        
        if (hasVideo) {
          console.log(`[WebRTC] Adding remote video stream from ${odiserId}`);
          setRemoteScreenStreams(prev => new Map(prev).set(odiserId, stream));
        } else {
          console.log(`[WebRTC] Adding remote audio stream from ${odiserId}`);
          setRemoteAudioStreams(prev => new Map(prev).set(odiserId, stream));
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${odiserId}:`, pc.connectionState);
      console.log(`[WebRTC] ICE state with ${odiserId}:`, pc.iceConnectionState, 'gathering:', pc.iceGatheringState);
      
      if (pc.connectionState === 'connected') {
        console.log(`[WebRTC] ✅ Fully connected with ${odiserId}`);
        // Log remote tracks
        pc.getReceivers().forEach(receiver => {
          if (receiver.track) {
            console.log(`[WebRTC] Remote track:`, receiver.track.kind, 'enabled:', receiver.track.enabled, 'readyState:', receiver.track.readyState);
          }
        });
      }
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        disconnectFromPeer(odiserId);
      }
    };

    peerConnections.current.set(odiserId, { odiserId: odiserId, connection: pc });
    
    return pc;
  }, [channelId, sendIceCandidate]);

  // Start audio capture
  const startAudio = useCallback(async (): Promise<boolean> => {
    console.log('[WebRTC] startAudio called');
    try {
      console.log('[WebRTC] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      console.log('[WebRTC] Microphone access granted, tracks:', stream.getAudioTracks().length);
      localAudioStreamRef.current = stream;
      setLocalAudioStream(stream);
      setIsAudioEnabled(true);

      // Add tracks to existing peer connections
      console.log('[WebRTC] Adding tracks to existing peer connections:', peerConnections.current.size);
      peerConnections.current.forEach(({ connection }) => {
        stream.getAudioTracks().forEach(track => {
          connection.addTrack(track, stream);
        });
      });

      return true;
    } catch (error) {
      console.error('[WebRTC] Error starting audio:', error);
      return false;
    }
  }, []);

  // Stop audio
  const stopAudio = useCallback(() => {
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach(track => track.stop());
      localAudioStreamRef.current = null;
      setLocalAudioStream(null);
      setIsAudioEnabled(false);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localAudioStreamRef.current) {
      const audioTrack = localAudioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      localScreenStreamRef.current = stream;
      setLocalScreenStream(stream);
      setIsScreenSharing(true);

      // Add tracks to existing peer connections and renegotiate
      const renegotiationPromises: Promise<void>[] = [];
      
      peerConnections.current.forEach(({ connection, odiserId }) => {
        stream.getTracks().forEach(track => {
          connection.addTrack(track, stream);
        });
        
        // Create new offer to renegotiate with the added tracks
        const renegotiate = async () => {
          try {
            const offer = await connection.createOffer();
            await connection.setLocalDescription(offer);
            if (channelId) {
              sendOffer(odiserId, offer, channelId);
            }
          } catch (err) {
            console.error(`[WebRTC] Renegotiation failed for ${odiserId}:`, err);
          }
        };
        renegotiationPromises.push(renegotiate());
      });
      
      // Wait for all renegotiations
      await Promise.all(renegotiationPromises);

      // Notify via socket
      if (channelId) {
        socketStartScreenShare(channelId);
      }

      // Handle stream end (user clicks "Stop sharing")
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return true;
    } catch (error) {
      console.error('[WebRTC] Error starting screen share:', error);
      return false;
    }
  }, [channelId, socketStartScreenShare, sendOffer]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(track => track.stop());
      localScreenStreamRef.current = null;
      setLocalScreenStream(null);
      setIsScreenSharing(false);

      // Notify via socket
      if (channelId) {
        socketStopScreenShare(channelId);
      }
    }
  }, [channelId, socketStopScreenShare]);

  // Connect to a peer
  const connectToPeer = useCallback(async (odiserId: string, chId: string) => {
    if (peerConnections.current.has(odiserId)) {
      console.log(`[WebRTC] Already connected to ${odiserId}`);
      return;
    }

    console.log(`[WebRTC] Connecting to peer: ${odiserId} in channel: ${chId}`);
    const pc = createPeerConnection(odiserId);

    // Add local streams if available
    if (localAudioStreamRef.current) {
      console.log('[WebRTC] Adding local audio tracks to offer');
      localAudioStreamRef.current.getAudioTracks().forEach(track => {
        pc.addTrack(track, localAudioStreamRef.current!);
      });
    } else {
      console.warn('[WebRTC] No local audio stream available when connecting to peer');
    }

    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localScreenStreamRef.current!);
      });
    }

    // Create and send offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendOffer(odiserId, offer, chId);
      console.log(`[WebRTC] Sent offer to: ${odiserId}`);
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
    }
  }, [createPeerConnection, sendOffer]);

  // Disconnect from peer
  const disconnectFromPeer = useCallback((odiserId: string) => {
    const peer = peerConnections.current.get(odiserId);
    if (peer) {
      peer.connection.close();
      peerConnections.current.delete(odiserId);
      
      setRemoteAudioStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(odiserId);
        return newMap;
      });
      
      setRemoteScreenStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(odiserId);
        return newMap;
      });
    }
  }, []);

  // Disconnect all peers
  const disconnectAll = useCallback(() => {
    peerConnections.current.forEach(({ connection }) => {
      connection.close();
    });
    peerConnections.current.clear();
    setRemoteAudioStreams(new Map());
    setRemoteScreenStreams(new Map());
    stopAudio();
    stopScreenShare();
  }, [stopAudio, stopScreenShare]);

  // Handle incoming WebRTC events
  useEffect(() => {
    console.log('[WebRTC] Setting up handlers for channelId:', channelId);
    if (!channelId) {
      console.log('[WebRTC] No channelId, skipping handler setup');
      return;
    }

    // Handle incoming offer
    onWebRTCOffer(async (data) => {
      console.log('[WebRTC] onWebRTCOffer called, data.channelId:', data.channelId, 'my channelId:', channelId);
      if (data.channelId !== channelId) {
        console.log('[WebRTC] Ignoring offer - channelId mismatch');
        return;
      }
      
      console.log('[WebRTC] Received offer from:', data.fromUserId);

      let pc = peerConnections.current.get(data.fromUserId)?.connection;
      const isNewConnection = !pc;
      
      if (!pc) {
        pc = createPeerConnection(data.fromUserId);
      }

      try {
        // Set remote description first (the offer)
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Add local audio tracks if available and this is a new connection
        if (isNewConnection && localAudioStreamRef.current) {
          console.log('[WebRTC] Adding local audio tracks to answer');
          localAudioStreamRef.current.getAudioTracks().forEach(track => {
            pc!.addTrack(track, localAudioStreamRef.current!);
          });
        }

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendAnswer(data.fromUserId, answer, channelId);
        console.log('[WebRTC] Sent answer to:', data.fromUserId);
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
      }
    });

    // Handle incoming answer
    onWebRTCAnswer(async (data) => {
      console.log('[WebRTC] onWebRTCAnswer called, data.channelId:', data.channelId, 'my channelId:', channelId);
      if (data.channelId !== channelId) {
        console.log('[WebRTC] Ignoring answer - channelId mismatch');
        return;
      }
      
      console.log('[WebRTC] Received answer from:', data.fromUserId);

      const peer = peerConnections.current.get(data.fromUserId);
      if (peer) {
        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('[WebRTC] Connection established with:', data.fromUserId);
        } catch (error) {
          console.error('[WebRTC] Error handling answer:', error);
        }
      } else {
        console.warn('[WebRTC] No peer connection found for answer from:', data.fromUserId);
      }
    });

    // Handle incoming ICE candidate
    onWebRTCIceCandidate(async (data) => {
      console.log('[WebRTC] onWebRTCIceCandidate called, data.channelId:', data.channelId, 'my channelId:', channelId);
      if (data.channelId !== channelId) {
        console.log('[WebRTC] Ignoring ICE candidate - channelId mismatch');
        return;
      }

      console.log('[WebRTC] Received ICE candidate from:', data.fromUserId);
      const peer = peerConnections.current.get(data.fromUserId);
      if (peer) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('[WebRTC] Added ICE candidate from:', data.fromUserId);
        } catch (error) {
          console.error('[WebRTC] Error adding ICE candidate:', error);
        }
      } else {
        console.warn('[WebRTC] No peer connection found for ICE candidate from:', data.fromUserId);
      }
    });
  }, [channelId, createPeerConnection, onWebRTCOffer, onWebRTCAnswer, onWebRTCIceCandidate, sendAnswer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, []);

  return {
    localAudioStream,
    isAudioEnabled,
    startAudio,
    stopAudio,
    toggleMute,
    localScreenStream,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    remoteAudioStreams,
    remoteScreenStreams,
    connectToPeer,
    disconnectFromPeer,
    disconnectAll,
  };
}
