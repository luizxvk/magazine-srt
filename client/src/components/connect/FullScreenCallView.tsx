import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  UserPlus, PhoneOff, Headphones, HeadphoneOff,
  MoreVertical, Minimize2, Signal
} from 'lucide-react';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';

interface CallParticipant {
  id: string;
  user: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    equippedBadge?: {
      id: string;
      name: string;
      imageUrl: string;
    };
    equippedProfileBorder?: string;
    membershipType?: string;
  };
  isMuted: boolean;
  isDeafened: boolean;
  isStreaming: boolean;
  isSpeaking?: boolean;
}

interface FullScreenCallViewProps {
  channelName: string;
  groupName: string;
  participants: CallParticipant[];
  currentUserId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isVideoOn?: boolean;
  callDuration: string; // e.g., "12:45"
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare: () => void;
  onInvite?: () => void;
  onDisconnect: () => void;
  onMinimize?: () => void;
  speakingUsers?: Set<string>;
  isLocalSpeaking?: boolean;
  accentColor?: string;
  ping?: number;
}

/**
 * Full screen call view matching Figma design node 57-410 and 4:74 (calling card).
 * Replaces the main content area when user is in a call.
 * Features:
 * - Large participant grid
 * - Bottom control bar with glassmorphic design
 * - Speaking indicators
 * - Signal quality indicator
 */
export const FullScreenCallView: React.FC<FullScreenCallViewProps> = ({
  channelName,
  groupName,
  participants,
  currentUserId,
  isMuted,
  isDeafened,
  isScreenSharing,
  isVideoOn = false,
  callDuration,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onInvite,
  onDisconnect,
  onMinimize,
  speakingUsers = new Set(),
  isLocalSpeaking = false,
  accentColor = '#6A5EFE',
  ping = 0,
}) => {
  // Get signal quality indicator
  const getSignalQuality = () => {
    if (ping < 50) return { color: '#3CFF00', bars: 4 };
    if (ping < 100) return { color: '#FFD700', bars: 3 };
    if (ping < 200) return { color: '#FF9500', bars: 2 };
    return { color: '#FF3B30', bars: 1 };
  };

  const signalQuality = getSignalQuality();

  return (
    <div className="fixed inset-0 z-50 bg-[#101022] flex flex-col font-grotesk">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#101022] via-[#0A0A18] to-[#101022]" />
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${accentColor}20 0%, transparent 50%)`
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          {onMinimize && (
            <button 
              onClick={onMinimize}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Minimize2 className="w-5 h-5 text-white/60" />
            </button>
          )}
          <div>
            <h2 className="text-white font-bold text-lg">{channelName}</h2>
            <p className="text-white/40 text-sm">{groupName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-sm font-medium">Live • {callDuration}</span>
          </div>
          
          {/* Signal quality */}
          <div className="flex items-center gap-1 px-2 py-1">
            <Signal className="w-4 h-4" style={{ color: signalQuality.color }} />
            <span className="text-xs text-white/40">{ping}ms</span>
          </div>

          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="relative z-10 flex-1 p-6 overflow-auto">
        <div className={`grid gap-4 h-full ${
          participants.length === 1 ? 'grid-cols-1' :
          participants.length === 2 ? 'grid-cols-2' :
          participants.length <= 4 ? 'grid-cols-2' :
          participants.length <= 6 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}>
          {participants.map(participant => {
            const isSpeaking = participant.user.id === currentUserId 
              ? isLocalSpeaking 
              : speakingUsers.has(participant.user.id);
            const isCurrentUser = participant.user.id === currentUserId;
            const isMGT = participant.user.membershipType === 'MGT';

            return (
              <motion.div
                key={participant.id}
                className="relative bg-white/[0.03] border border-white/10 rounded-[22px] overflow-hidden min-h-[200px] flex flex-col items-center justify-center"
                animate={isSpeaking ? { scale: [1, 1.01, 1] } : {}}
                transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
                style={{
                  boxShadow: isSpeaking ? '0 0 30px rgba(60, 255, 0, 0.3), inset 0 0 0 2px rgba(60, 255, 0, 0.5)' : undefined
                }}
              >
                {/* Background gradient */}
                {isSpeaking && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                {/* Avatar */}
                <div className="relative mb-4">
                  <div 
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px]"
                    style={{ 
                      background: isSpeaking 
                        ? 'linear-gradient(135deg, #3CFF00, #00FF94)' 
                        : getProfileBorderGradient(participant.user.equippedProfileBorder, isMGT)
                    }}
                  >
                    <img
                      src={participant.user.avatarUrl || '/assets/logo-rovex.png'}
                      className="w-full h-full rounded-full object-cover bg-[#101022]"
                      alt={participant.user.displayName || participant.user.name}
                    />
                  </div>

                  {/* Speaking ring animation */}
                  {isSpeaking && (
                    <>
                      <motion.div
                        className="absolute -inset-2 rounded-full border-2 border-green-500/30"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute -inset-4 rounded-full border border-green-500/20"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      />
                    </>
                  )}

                  {/* Badge */}
                  {participant.user.equippedBadge && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#101022] p-1 border border-white/10"
                      title={participant.user.equippedBadge.name}
                    >
                      <img 
                        src={participant.user.equippedBadge.imageUrl} 
                        className="w-full h-full object-contain"
                        alt={participant.user.equippedBadge.name}
                      />
                    </div>
                  )}

                  {/* Status icons */}
                  {(participant.isMuted || participant.isDeafened) && (
                    <div className="absolute -top-1 -left-1 flex gap-1">
                      {participant.isMuted && (
                        <div className="w-5 h-5 rounded-full bg-red-500/90 flex items-center justify-center">
                          <MicOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {participant.isDeafened && (
                        <div className="w-5 h-5 rounded-full bg-red-500/90 flex items-center justify-center">
                          <HeadphoneOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Streaming indicator */}
                  {participant.isStreaming && (
                    <div className="absolute -top-1 right-0 px-2 py-0.5 rounded-full bg-red-500 text-xs font-bold text-white">
                      LIVE
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="text-white font-semibold text-sm md:text-base text-center px-4 truncate w-full">
                  {participant.user.displayName || participant.user.name}
                </p>
                {isCurrentUser && (
                  <p className="text-white/40 text-xs mt-0.5">Você</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-10 p-4 pb-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-xl mx-auto bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[48px] p-3 flex items-center justify-center gap-2 md:gap-4"
          style={{
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
          }}
        >
          {/* Mute */}
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <span className="text-xs text-white/40 -mt-0 hidden md:block">Mute</span>

          {/* Deafen */}
          <button
            onClick={onToggleDeafen}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isDeafened 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isDeafened ? 'Ouvir' : 'Ensurdecer'}
          >
            {isDeafened ? <HeadphoneOff className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </button>

          {/* Video */}
          {onToggleVideo && (
            <button
              onClick={onToggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isVideoOn 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-white/10 text-white/50 hover:bg-white/15'
              }`}
              title={isVideoOn ? 'Desligar câmera' : 'Ligar câmera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
          >
            {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
          </button>

          {/* Invite */}
          {onInvite && (
            <button
              onClick={onInvite}
              className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              title="Convidar"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          )}

          {/* Separator */}
          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Leave Call */}
          <button
            onClick={onDisconnect}
            className="px-6 h-12 rounded-full bg-red-500 text-white flex items-center gap-2 justify-center hover:bg-red-600 transition-all font-medium"
            title="Sair da chamada"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default FullScreenCallView;
