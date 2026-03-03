import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageSquare, 
  UserPlus, 
  Crown, 
  Star, 
  Gamepad2,
  Headphones,
  Radio,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface UserDetails {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isOnline?: boolean;
  isElite?: boolean;
  eliteUntil?: string;
  level?: number;
  xp?: number;
  prestigeLevel?: number;
  prestigeStars?: number;
  equippedBadge?: string | null;
  profileBgUrl?: string | null;
  isVerified?: boolean;
  membershipType?: 'MAGAZINE' | 'MGT';
  // Rich presence
  currentActivity?: {
    type: 'PLAYING' | 'IN_CALL' | 'LISTENING' | 'WATCHING' | 'STREAMING' | 'CUSTOM';
    name: string;
    details?: string;
    startedAt?: string;
  } | null;
  // Statforge games
  statforgeGames?: Array<{
    id: string;
    name: string;
    iconUrl?: string;
    hoursPlayed: number;
  }>;
  // Badges
  badges?: Array<{
    id: string;
    name: string;
    iconUrl: string;
    description?: string;
    rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  }>;
}

interface UserPresenceCardProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
  accentColor?: string;
}

export const UserPresenceCard: React.FC<UserPresenceCardProps> = ({
  userId,
  isOpen,
  onClose,
  onStartChat,
  accentColor = '#9333ea',
}) => {
  const { user: currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/${userId}/profile`);
      setUserDetails(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'PLAYING':
        return <Gamepad2 size={14} />;
      case 'IN_CALL':
        return <Headphones size={14} />;
      case 'LISTENING':
        return <Radio size={14} />;
      case 'STREAMING':
        return <Radio size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const formatTimeSince = (dateString?: string) => {
    if (!dateString) return '';
    const start = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}min`;
    return `${diffMins}min`;
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return 'from-amber-400 to-yellow-600';
      case 'EPIC':
        return 'from-purple-500 to-pink-500';
      case 'RARE':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] z-50"
          >
            <div className="bg-[#0a0a0f] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X size={16} className="text-white/70" />
              </button>

              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 rounded-full"
                    style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
                  />
                </div>
              ) : error ? (
                <div className="h-[400px] flex items-center justify-center text-red-400">
                  {error}
                </div>
              ) : userDetails ? (
                <>
                  {/* Banner */}
                  <div 
                    className="h-24 relative overflow-hidden"
                    style={{
                      background: userDetails.profileBgUrl 
                        ? `url(${userDetails.profileBgUrl}) center/cover` 
                        : `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                    }}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                  </div>

                  {/* Avatar & Info */}
                  <div className="relative px-4 -mt-10">
                    {/* Avatar */}
                    <div className="relative inline-block">
                      <div 
                        className="w-20 h-20 rounded-full border-4 overflow-hidden"
                        style={{ borderColor: '#0a0a0f' }}
                      >
                        {userDetails.avatarUrl ? (
                          <img 
                            src={userDetails.avatarUrl} 
                            alt={userDetails.displayName || userDetails.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            {(userDetails.displayName || userDetails.name).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Online indicator */}
                      <div 
                        className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0f] ${
                          userDetails.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />

                      {/* Elite ring */}
                      {userDetails.isElite && (
                        <motion.div
                          className="absolute -inset-1 rounded-full"
                          style={{
                            background: `conic-gradient(from 0deg, ${accentColor}, #d4af37, #f472b6, ${accentColor})`,
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                    </div>

                    {/* Name & badges */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">
                          {userDetails.displayName || userDetails.name}
                        </h3>
                        {userDetails.isVerified && (
                          <ShieldCheck size={16} className="text-blue-400" />
                        )}
                        {userDetails.isElite && (
                          <div 
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${accentColor}20`,
                              color: accentColor,
                            }}
                          >
                            <Crown size={12} />
                            Elite
                          </div>
                        )}
                      </div>

                      {/* Level & Prestige */}
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <span>Nível {userDetails.level || 1}</span>
                        {userDetails.prestigeLevel && userDetails.prestigeLevel > 0 && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Sparkles size={12} />
                            <span>P{userDetails.prestigeLevel}</span>
                            {userDetails.prestigeStars && (
                              <div className="flex">
                                {Array.from({ length: userDetails.prestigeStars }).map((_, i) => (
                                  <Star key={i} size={10} className="fill-amber-400" />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      {userDetails.bio && (
                        <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                          {userDetails.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rich Presence / Activity */}
                  {userDetails.currentActivity && (
                    <div className="mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${accentColor}30` }}
                        >
                          {getActivityIcon(userDetails.currentActivity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {userDetails.currentActivity.name}
                          </p>
                          {userDetails.currentActivity.details && (
                            <p className="text-gray-400 text-xs truncate">
                              {userDetails.currentActivity.details}
                            </p>
                          )}
                        </div>
                        {userDetails.currentActivity.startedAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={10} />
                            {formatTimeSince(userDetails.currentActivity.startedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  {userDetails.badges && userDetails.badges.length > 0 && (
                    <div className="mx-4 mt-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Badges
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {userDetails.badges.slice(0, 8).map((badge) => (
                          <div 
                            key={badge.id}
                            className={`w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br ${getRarityColor(badge.rarity)} p-0.5`}
                            title={badge.name}
                          >
                            <div className="w-full h-full rounded-[6px] bg-[#0a0a0f] flex items-center justify-center">
                              {badge.iconUrl ? (
                                <img 
                                  src={badge.iconUrl} 
                                  alt={badge.name} 
                                  className="w-6 h-6 object-contain"
                                />
                              ) : (
                                <Star size={14} className="text-white/50" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statforge Games */}
                  {userDetails.statforgeGames && userDetails.statforgeGames.length > 0 && (
                    <div className="mx-4 mt-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Jogos Statforge
                      </h4>
                      <div className="space-y-2">
                        {userDetails.statforgeGames.slice(0, 3).map((game) => (
                          <div 
                            key={game.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                          >
                            {game.iconUrl ? (
                              <img 
                                src={game.iconUrl} 
                                alt={game.name} 
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                                <Gamepad2 size={16} className="text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{game.name}</p>
                              <p className="text-xs text-gray-500">{game.hoursPlayed}h jogadas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-4 mt-4 border-t border-white/10 flex gap-2">
                    {currentUser?.id !== userId && (
                      <>
                        <button
                          onClick={() => onStartChat?.(userId)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{ 
                            backgroundColor: accentColor,
                            color: 'white',
                          }}
                        >
                          <MessageSquare size={16} />
                          Mensagem
                        </button>
                        <button
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <UserPlus size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => window.open(`/profile/${userId}`, '_blank')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserPresenceCard;
