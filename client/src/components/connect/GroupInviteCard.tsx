import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Check, 
  X, 
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';

interface GroupInvite {
  id: string;
  groupId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  group: {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    membershipType: 'MAGAZINE' | 'MGT';
  };
  inviter: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface GroupInviteCardProps {
  accentColor?: string;
  onInviteAccepted?: (groupId: string) => void;
}

export const GroupInviteCard: React.FC<GroupInviteCardProps> = ({
  accentColor = '#9333ea',
  onInviteAccepted,
}) => {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
    // Poll for new invites every 30 seconds
    const interval = setInterval(fetchInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await api.get('/connect/groups/invites/me');
      setInvites(response.data);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string, groupId: string) => {
    setProcessingId(inviteId);
    try {
      await api.post(`/connect/groups/invites/${inviteId}/respond`, { accept: true });
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      onInviteAccepted?.(groupId);
    } catch (error) {
      console.error('Error accepting invite:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      await api.post(`/connect/groups/invites/${inviteId}/respond`, { accept: false });
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (error) {
      console.error('Error declining invite:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 3 * 60 * 1000); // 3 minutes
    const now = new Date();
    const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading || invites.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {invites.map((invite, index) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(20, 20, 35, 0.95))',
              boxShadow: `0 0 30px ${accentColor}20, 0 10px 40px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${accentColor}40, transparent, ${accentColor}40)`,
                padding: '1px',
              }}
              animate={{
                background: [
                  `linear-gradient(135deg, ${accentColor}40, transparent, ${accentColor}40)`,
                  `linear-gradient(225deg, ${accentColor}40, transparent, ${accentColor}40)`,
                  `linear-gradient(315deg, ${accentColor}40, transparent, ${accentColor}40)`,
                  `linear-gradient(135deg, ${accentColor}40, transparent, ${accentColor}40)`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative p-4">
              {/* Header with sparkle */}
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={16} style={{ color: accentColor }} />
                </motion.div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accentColor }}>
                  Convite para Grupo
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{getTimeRemaining(invite.createdAt)}</span>
                </div>
              </div>

              {/* Group Info */}
              <div className="flex items-center gap-3 mb-4">
                {/* Group Avatar */}
                <div 
                  className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                  style={{
                    background: invite.group.avatarUrl 
                      ? undefined 
                      : `linear-gradient(135deg, ${accentColor}60, ${accentColor}30)`,
                  }}
                >
                  {invite.group.avatarUrl ? (
                    <img 
                      src={invite.group.avatarUrl} 
                      alt={invite.group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={24} className="text-white/70" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg truncate">
                    {invite.group.name}
                  </h3>
                  {invite.group.description && (
                    <p className="text-gray-400 text-sm truncate">
                      {invite.group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: invite.group.membershipType === 'MGT' 
                          ? `${accentColor}20` 
                          : 'rgba(212, 175, 55, 0.2)',
                        color: invite.group.membershipType === 'MGT' 
                          ? accentColor 
                          : '#d4af37',
                      }}
                    >
                      {invite.group.membershipType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inviter Info */}
              <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-white/5">
                <img
                  src={invite.inviter.avatarUrl || '/assets/default-avatar.png'}
                  className="w-6 h-6 rounded-full"
                  alt=""
                />
                <span className="text-sm text-gray-300">
                  <span className="text-white font-medium">{invite.inviter.name}</span>
                  {' '}convidou você
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAccept(invite.id, invite.group.id)}
                  disabled={processingId === invite.id}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: accentColor }}
                >
                  {processingId === invite.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Check size={18} />
                      Aceitar
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDecline(invite.id)}
                  disabled={processingId === invite.id}
                  className="px-4 py-3 rounded-xl font-semibold text-gray-300 bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Decorative elements */}
            <div 
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: accentColor }}
            />
            <div 
              className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full blur-2xl opacity-10"
              style={{ background: accentColor }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GroupInviteCard;
