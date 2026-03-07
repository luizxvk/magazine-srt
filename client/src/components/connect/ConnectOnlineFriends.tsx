import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Circle, Moon, MinusCircle, Wifi } from 'lucide-react';
import api from '../../services/api';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';
import { useAuth } from '../../context/AuthContext';

interface EquippedBadge {
  id: string;
  name: string;
  imageUrl: string;
}

interface Friend {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  membershipType?: string;
  equippedProfileBorder?: string | null;
  equippedBadge?: EquippedBadge | null;
  customTag?: string | null;
  isElite?: boolean;
  isBeta?: boolean;
  isQA?: boolean;
  currentActivity?: {
    type: 'PLAYING' | 'IN_CALL' | 'LISTENING' | 'WATCHING' | 'STREAMING' | 'IDLE';
    name: string;
  } | null;
}

type UserStatus = 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'INVISIBLE';

interface ConnectOnlineFriendsProps {
  accentColor: string;
  onFriendClick?: (friendId: string) => void;
}

// Helper to get user tag
const getUserTag = (friend: Friend): { text: string; color: string } | null => {
  if (friend.isElite) return { text: 'ELITE', color: '#FFD700' };
  if (friend.isBeta) return { text: 'BETA', color: '#8B5CF6' };
  if (friend.isQA) return { text: 'QA', color: '#10B981' };
  if (friend.membershipType === 'MAGAZINE') return { text: 'MGZN', color: '#EC4899' };
  if (friend.customTag && friend.customTag !== 'ROVEX') return { text: friend.customTag, color: '#60A5FA' };
  return null;
};

const STATUS_CONFIG: Record<UserStatus, { color: string; label: string; icon: React.ElementType }> = {
  ONLINE: { color: '#3CFF00', label: 'Online', icon: Circle },
  IDLE: { color: '#FBBF24', label: 'Ausente', icon: Moon },
  DO_NOT_DISTURB: { color: '#EF4444', label: 'Não Perturbe', icon: MinusCircle },
  INVISIBLE: { color: '#6B7280', label: 'Invisível', icon: Wifi },
};

export const ConnectOnlineFriends: React.FC<ConnectOnlineFriendsProps> = ({
  accentColor,
  onFriendClick,
}) => {
  const { user } = useAuth();
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);
  const [offlineFriends, setOfflineFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>('ONLINE');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const statusPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFriends();
    // Refresh friends list every 30 seconds
    const interval = setInterval(fetchFriends, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close status picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusPickerRef.current && !statusPickerRef.current.contains(event.target as Node)) {
        setShowStatusPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: UserStatus) => {
    setUserStatus(newStatus);
    setShowStatusPicker(false);
    // TODO: Save status to backend
    try {
      await api.post('/users/me/status', { status: newStatus });
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const fetchFriends = async () => {
    try {
      // Use the same endpoint as OnlineFriendsCard for consistency
      const response = await api.get('/social/friends/online');
      const onlineData = response.data || [];
      setOnlineFriends(onlineData);
      // Fetch all friends to get offline ones
      try {
        const allResponse = await api.get('/social/friends');
        const allFriends = allResponse.data || [];
        const onlineIds = new Set(onlineData.map((f: Friend) => f.id));
        setOfflineFriends(allFriends.filter((f: Friend) => !onlineIds.has(f.id)));
      } catch {
        setOfflineFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setOnlineFriends([]);
      setOfflineFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = STATUS_CONFIG[userStatus];

  return (
    <div className="flex flex-col h-full font-grotesk">
      {/* Glassmorphic Card Container */}
      <div className="flex-1 flex flex-col mt-3 mx-3 mb-3 bg-white/[0.03] border border-white/10 backdrop-blur-[12px] rounded-[22px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[#F1F5F9] font-bold text-sm whitespace-nowrap">Amigos Online</h3>
            <span 
              className="px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ backgroundColor: `${accentColor}33`, color: accentColor }}
            >
              {onlineFriends.length}
            </span>
          </div>
        </div>

        {/* Friends List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-white/10 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {/* Online Friends Section */}
              {onlineFriends.length > 0 && (
                <div>
                  <AnimatePresence>
                    {onlineFriends.map((friend, index) => {
                      const isMGT = friend.membershipType === 'MGT';
                      const tag = getUserTag(friend);
                      return (
                        <motion.button
                          key={friend.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => onFriendClick?.(friend.id)}
                          className="w-full flex items-center gap-2.5 py-2 px-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                        >
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-10 h-10 rounded-full p-[2px]"
                              style={{ background: getProfileBorderGradient(friend.equippedProfileBorder, isMGT) }}
                            >
                              <div className="w-full h-full rounded-full overflow-hidden bg-black/50">
                                {friend.avatarUrl ? (
                                  <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: accentColor }}>
                                    {(friend.displayName || friend.name).charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Online indicator */}
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#131022]" style={{ backgroundColor: '#3CFF00' }} />
                            {/* Badge */}
                            {friend.equippedBadge?.imageUrl && (
                              <div 
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md bg-[#0F0F23] border border-white/10 flex items-center justify-center"
                                title={friend.equippedBadge.name}
                              >
                                <img 
                                  src={friend.equippedBadge.imageUrl} 
                                  alt={friend.equippedBadge.name} 
                                  className="w-full h-full object-contain"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-[#F1F5F9] truncate">{friend.displayName || friend.name}</p>
                              {tag && (
                                <span 
                                  className="px-1 py-0.5 text-[8px] font-bold rounded"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                  {tag.text}
                                </span>
                              )}
                            </div>
                            {friend.currentActivity ? (
                              <p className="text-[11px] text-[#64748B] truncate">{friend.currentActivity.name}</p>
                            ) : (
                              <p className="text-[11px] text-[#3CFF00]">Online</p>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Offline Friends Section */}
              {offlineFriends.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-2 mt-2">
                    <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Offline</span>
                    <span className="text-[10px] text-[#64748B]">— {offlineFriends.length}</span>
                  </div>
                  <AnimatePresence>
                    {offlineFriends.map((friend, index) => {
                        const tag = getUserTag(friend);
                        return (
                        <motion.button
                          key={friend.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.01 }}
                          onClick={() => onFriendClick?.(friend.id)}
                          className="w-full flex items-center gap-2.5 py-2 px-2 hover:bg-white/[0.03] rounded-lg transition-colors opacity-50"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full p-[2px] bg-white/10">
                              <div className="w-full h-full rounded-full overflow-hidden bg-black/50 grayscale">
                                {friend.avatarUrl ? (
                                  <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white/50">
                                    {(friend.displayName || friend.name).charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Offline indicator */}
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#131022] bg-[#64748B]" />
                            {/* Badge (grayscale) */}
                            {friend.equippedBadge?.imageUrl && (
                              <div 
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#131022] p-0.5 grayscale opacity-60"
                                title={friend.equippedBadge.name}
                              >
                                <img 
                                  src={friend.equippedBadge.imageUrl} 
                                  alt={friend.equippedBadge.name} 
                                  className="w-full h-full object-contain"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-[#94A3B8] truncate">{friend.displayName || friend.name}</p>
                              {tag && (
                                <span 
                                  className="px-1 py-0.5 text-[8px] font-bold rounded opacity-60"
                                  style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                                >
                                  {tag.text}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#64748B]">Offline</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Empty State */}
              {onlineFriends.length === 0 && offlineFriends.length === 0 && (
                <div className="py-6 text-center text-[#64748B]">
                  <p className="text-xs">Nenhum amigo encontrado</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Panel at bottom - with real user data and status picker */}
        <div className="border-t border-white/5 flex-shrink-0 relative" ref={statusPickerRef}>
          {/* Status Picker Dropdown */}
          <AnimatePresence>
            {showStatusPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-2 right-2 mb-2 bg-[#1a1625] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50"
              >
                {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((status) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  const isActive = userStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${isActive ? 'bg-white/10' : ''}`}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} fill={config.color} />
                      <span className="text-sm text-[#F1F5F9]">{config.label}</span>
                      {isActive && (
                        <span className="ml-auto text-xs" style={{ color: accentColor }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-3 flex items-center gap-3">
            {/* Current user avatar */}
            <div className="relative flex-shrink-0">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName || user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {(user?.displayName || user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Status indicator on avatar */}
              <div 
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#131022]"
                style={{ backgroundColor: currentStatus.color }}
              />
            </div>
            
            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#F1F5F9] truncate">
                {user?.displayName || user?.name || 'User'}
              </p>
              <button 
                onClick={() => setShowStatusPicker(!showStatusPicker)}
                className="flex items-center gap-1 group"
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStatus.color }}
                />
                <span className="text-xs" style={{ color: currentStatus.color }}>
                  {currentStatus.label}
                </span>
                <ChevronDown className="w-3 h-3 text-[#64748B] group-hover:text-[#F1F5F9] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectOnlineFriends;
