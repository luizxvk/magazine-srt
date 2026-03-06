import { motion } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  UserPlus, PhoneOff, VolumeX, Headphones, HeadphoneOff 
} from 'lucide-react';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';

interface CallingCardParticipant {
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

interface CallingCardProps {
  channelName: string;
  groupName: string;
  participants: CallingCardParticipant[];
  currentUserId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isVideoOn?: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare: () => void;
  onInvite?: () => void;
  onDisconnect: () => void;
  speakingUsers?: Set<string>;
  isLocalSpeaking?: boolean;
}

export default function CallingCard({
  channelName,
  groupName,
  participants,
  currentUserId,
  isMuted,
  isDeafened,
  isScreenSharing,
  isVideoOn = false,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onInvite,
  onDisconnect,
  speakingUsers = new Set(),
  isLocalSpeaking = false
}: CallingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: '#101022',
        border: '1px solid #2525F4',
        boxShadow: '0 0 40px rgba(37, 37, 244, 0.6), 0 0 80px rgba(37, 37, 244, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Blue glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(37, 37, 244, 0.15) 0%, transparent 60%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm">{channelName}</h3>
            <p className="text-[#64748B] text-xs">{groupName}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500 text-xs font-medium">Em chamada</span>
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex flex-wrap gap-3 mb-4 justify-center">
          {participants.map(participant => {
            const isSpeaking = participant.user.id === currentUserId 
              ? isLocalSpeaking 
              : speakingUsers.has(participant.user.id);
            const isMGT = participant.user.membershipType === 'MGT';
            
            return (
              <motion.div
                key={participant.id}
                className="relative group"
                animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
              >
                {/* Profile border with gradient */}
                <div 
                  className="w-14 h-14 rounded-full p-[2px]"
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
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-green-500/50"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}

                {/* Badge */}
                {participant.user.equippedBadge && (
                  <div 
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#101022] p-0.5"
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
                <div className="absolute -top-1 -left-1 flex gap-0.5">
                  {participant.isMuted && (
                    <div className="w-4 h-4 rounded-full bg-red-500/90 flex items-center justify-center">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {participant.isDeafened && (
                    <div className="w-4 h-4 rounded-full bg-red-500/90 flex items-center justify-center">
                      <VolumeX className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Streaming indicator */}
                {participant.isStreaming && (
                  <div className="absolute -top-1 right-0 px-1.5 py-0.5 rounded-full bg-red-500 text-[8px] font-bold text-white">
                    LIVE
                  </div>
                )}

                {/* Name tooltip on hover */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-black/80 rounded text-[10px] text-white pointer-events-none">
                  {participant.user.displayName || participant.user.name}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Mute */}
          <button
            onClick={onToggleMute}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen */}
          <button
            onClick={onToggleDeafen}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isDeafened 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isDeafened ? 'Ouvir' : 'Ensurdecer'}
          >
            {isDeafened ? <HeadphoneOff className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </button>

          {/* Video (if available) */}
          {onToggleVideo && (
            <button
              onClick={onToggleVideo}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                !isVideoOn 
                  ? 'bg-white/10 text-white/60 hover:bg-white/20' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isVideoOn ? 'Desligar câmera' : 'Ligar câmera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
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
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              title="Convidar"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          )}

          {/* Leave Call - Red */}
          <button
            onClick={onDisconnect}
            className="w-12 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
            title="Sair da chamada"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
