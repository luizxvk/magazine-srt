import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Signal, Monitor, MonitorOff, Volume2, VolumeX } from 'lucide-react';
import StreamQualityModal from './StreamQualityModal';
import type { StreamSettings } from './StreamQualityModal';

interface VoiceChannel {
  id: string;
  name: string;
  group: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface VoiceChannelBarProps {
  channel: VoiceChannel;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing?: boolean;
  hasActiveStreams?: boolean;
  outputVolume: number;
  ping: number;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare?: (settings?: StreamSettings) => void;
  onWatchStream?: () => void;
  onDisconnect: () => void;
  theme: 'light' | 'dark';
}

export default function VoiceChannelBar({
  channel,
  isMuted,
  isDeafened,
  isScreenSharing = false,
  hasActiveStreams = false,
  outputVolume,
  ping,
  onVolumeChange,
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onWatchStream,
  onDisconnect,
  theme
}: VoiceChannelBarProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

  const handleScreenShareClick = () => {
    if (isScreenSharing) {
      // If already sharing, just stop
      onToggleScreenShare?.();
    } else {
      // Show quality selection modal
      setShowQualityModal(true);
    }
  };

  const handleQualitySelect = (settings: StreamSettings) => {
    onToggleScreenShare?.(settings);
  };

  // Determine ping quality and color
  const getPingColor = () => {
    if (ping === 0) return 'text-gray-400';
    if (ping < 100) return 'text-green-500';
    if (ping < 200) return 'text-yellow-500';
    if (ping < 300) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPingQuality = () => {
    if (ping === 0) return 'Conectando...';
    if (ping < 100) return 'Excelente';
    if (ping < 200) return 'Bom';
    if (ping < 300) return 'Regular';
    return 'Ruim';
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`border-t ${themeBorder} p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/5`}
    >
      {/* Connection Status with Ping */}
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="flex items-center gap-1.5 cursor-default group relative"
          title={`${ping}ms - ${getPingQuality()}`}
        >
          <Signal className={`w-4 h-4 ${getPingColor()}`} />
          <span className={`text-xs font-medium ${getPingColor()}`}>
            {ping > 0 ? `${ping}ms` : 'Conectado'}
          </span>
          
          {/* Tooltip on hover */}
          <div className={`absolute bottom-full left-0 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${
            theme === 'light' ? 'bg-gray-900 text-white' : 'bg-zinc-700 text-white'
          }`}>
            <div className="font-medium">{getPingQuality()}</div>
            <div className="text-gray-300">{ping > 0 ? `Latência: ${ping}ms` : 'Medindo latência...'}</div>
          </div>
        </div>
      </div>

      {/* Channel Info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          <Headphones className="w-4 h-4 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${themeText}`}>
            {channel.name}
          </p>
          <p className={`text-xs truncate ${themeSecondary}`}>
            {channel.group.name}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className={`p-2.5 rounded-full transition-all ${
            isMuted 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
          title={isMuted ? 'Desmutar' : 'Mutar'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Deafen Button */}
        <button
          onClick={onToggleDeafen}
          className={`p-2.5 rounded-full transition-all ${
            isDeafened 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
          title={isDeafened ? 'Desemudecer' : 'Emudecer'}
        >
          {isDeafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </button>

        {/* Volume Control */}
        <div className="relative">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className={`p-2.5 rounded-full transition-all ${
              outputVolume === 0
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : outputVolume > 100
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            title={`Volume: ${outputVolume}%`}
          >
            {outputVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          {/* Volume Slider Popup */}
          {showVolumeSlider && (
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-lg shadow-lg z-50 ${
              theme === 'light' ? 'bg-white border border-gray-200' : 'bg-zinc-800 border border-white/10'
            }`}>
              <div className="flex flex-col items-center gap-2 w-12">
                <span className={`text-xs font-medium ${themeText}`}>{outputVolume}%</span>
                <input
                  type="range"
                  min="0"
                  max="400"
                  value={outputVolume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="h-24 appearance-none cursor-pointer accent-green-500"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                  }}
                  title={`Volume: ${outputVolume}%`}
                />
                <span className={`text-[10px] ${themeSecondary}`}>0</span>
              </div>
            </div>
          )}
        </div>

        {/* Screen Share Button */}
        {onToggleScreenShare && (
          <button
            onClick={handleScreenShareClick}
            className={`p-2.5 rounded-full transition-all ${
              isScreenSharing 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>
        )}

        {/* Disconnect Button */}
        <button
          onClick={onDisconnect}
          className="p-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
          title="Desconectar"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {/* Watch Stream Button (separate row when someone is streaming) */}
      {hasActiveStreams && onWatchStream && (
        <button
          onClick={onWatchStream}
          className="mt-2 w-full py-2 px-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Assistir Transmissão
        </button>
      )}

      {/* Quality Selection Modal */}
      <StreamQualityModal
        isOpen={showQualityModal}
        onClose={() => setShowQualityModal(false)}
        onSelect={handleQualitySelect}
        theme={theme}
      />
    </motion.div>
  );
}
