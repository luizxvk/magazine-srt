import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX,
  PictureInPicture2,
  Users,
  MonitorPlay,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StreamInfo {
  odiserId: string;
  username: string;
  avatarUrl?: string;
  stream: MediaStream;
}

interface StreamViewerProps {
  streams: Map<string, MediaStream>;
  streamerInfo: Map<string, { username: string; avatarUrl?: string }>;
  onClose: () => void;
  isOpen: boolean;
}

export function StreamViewer({ streams, streamerInfo, onClose, isOpen }: StreamViewerProps) {
  const { accentColor } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [isPiP, setIsPiP] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get list of streams
  const streamList: StreamInfo[] = Array.from(streams.entries()).map(([odiserId, stream]) => ({
    odiserId,
    stream,
    username: streamerInfo.get(odiserId)?.username || `Usuário ${odiserId.slice(0, 8)}`,
    avatarUrl: streamerInfo.get(odiserId)?.avatarUrl
  }));

  // Select first stream if none selected
  useEffect(() => {
    if (streamList.length > 0 && !activeStreamId) {
      setActiveStreamId(streamList[0].odiserId);
    }
  }, [streamList, activeStreamId]);

  // Get active stream
  const activeStream = streamList.find(s => s.odiserId === activeStreamId);

  // Set video source when stream changes
  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream.stream;
      videoRef.current.play().catch(console.error);
    }
  }, [activeStream]);

  // Update volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setShowControls(false);
      }
    }, 3000);
  }, [isFullscreen]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Fullscreen handlers
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Exit fullscreen error:', err);
      }
    }
  }, [isFullscreen]);

  // PiP handler
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Listen for PiP change
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiP(!!document.pictureInPictureElement);
    };
    
    videoRef.current?.addEventListener('enterpictureinpicture', handlePiPChange);
    videoRef.current?.addEventListener('leavepictureinpicture', handlePiPChange);
    
    return () => {
      videoRef.current?.removeEventListener('enterpictureinpicture', handlePiPChange);
      videoRef.current?.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  if (!isOpen || streamList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          ref={containerRef}
          className={`
            relative flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-2xl
            ${isFullscreen ? 'w-full h-full' : 'w-[90vw] max-w-5xl h-[80vh]'}
          `}
          onClick={(e) => e.stopPropagation()}
          onMouseMove={resetControlsTimeout}
        >
          {/* Live Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: accentColor }}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              AO VIVO
            </div>
            {activeStream && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm">
                {activeStream.avatarUrl ? (
                  <img 
                    src={activeStream.avatarUrl} 
                    alt={activeStream.username}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    {activeStream.username[0].toUpperCase()}
                  </div>
                )}
                <span className="text-white text-sm">{activeStream.username}</span>
              </div>
            )}
          </div>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: showControls ? 1 : 0 }}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Video Container */}
          <div className="flex-1 flex items-center justify-center bg-black relative">
            {activeStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <MonitorPlay className="w-16 h-16" />
                <p>Nenhum stream ativo</p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-24 h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${accentColor} ${volume}%, #4b5563 ${volume}%)`
                  }}
                />
              </div>

              {/* Stream Selector (if multiple streams) */}
              {streamList.length > 1 && (
                <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1">
                  <Users className="w-4 h-4 text-gray-400 ml-2" />
                  {streamList.map((stream) => (
                    <button
                      key={stream.odiserId}
                      onClick={() => setActiveStreamId(stream.odiserId)}
                      className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                        ${activeStreamId === stream.odiserId 
                          ? 'bg-white/20 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/10'}
                      `}
                    >
                      {stream.username}
                    </button>
                  ))}
                </div>
              )}

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Picture in Picture */}
                <button
                  onClick={togglePiP}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${isPiP 
                      ? 'bg-white/20 text-white' 
                      : 'hover:bg-white/10 text-white'}
                  `}
                  title="Picture-in-Picture"
                >
                  <PictureInPicture2 className="w-5 h-5" />
                </button>
                
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                  title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Mini stream preview component for sidebar/elsewhere
export function StreamPreview({ 
  stream, 
  username, 
  avatarUrl,
  onClick 
}: { 
  stream: MediaStream; 
  username: string; 
  avatarUrl?: string;
  onClick: () => void;
}) {
  const { accentColor } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full aspect-video rounded-lg overflow-hidden group cursor-pointer"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Live badge */}
      <div 
        className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white font-medium"
        style={{ backgroundColor: accentColor }}
      >
        <Radio className="w-2.5 h-2.5 animate-pulse" />
        LIVE
      </div>
      
      {/* User info */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={username}
            className="w-6 h-6 rounded-full border border-white/20"
          />
        ) : (
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs border border-white/20"
            style={{ backgroundColor: accentColor }}
          >
            {username[0].toUpperCase()}
          </div>
        )}
        <span className="text-white text-sm font-medium truncate">{username}</span>
      </div>
      
      {/* Play icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <MonitorPlay className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.button>
  );
}

export default StreamViewer;
