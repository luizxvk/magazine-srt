import { motion } from 'framer-motion';
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Signal, Monitor, MonitorOff, Radio } from 'lucide-react';

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
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare?: () => void;
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
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onWatchStream,
  onDisconnect,
  theme
}: VoiceChannelBarProps) {
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`border-t ${themeBorder} p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/5`}
    >
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Signal className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-green-500">Conectado</span>
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

        {/* Screen Share Button */}
        {onToggleScreenShare && (
          <button
            onClick={onToggleScreenShare}
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

        {/* Watch Stream Button (when someone is streaming) */}
        {hasActiveStreams && onWatchStream && (
          <button
            onClick={onWatchStream}
            className="p-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all animate-pulse"
            title="Assistir transmissão"
          >
            <Radio className="w-4 h-4" />
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
    </motion.div>
  );
}
