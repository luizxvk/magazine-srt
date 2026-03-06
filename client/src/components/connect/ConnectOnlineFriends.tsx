import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Gamepad2, Headphones, Radio, Eye, ChevronDown, Circle, Moon, MinusCircle, Wifi } from 'lucide-react';
import api from '../../services/api';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';
import { useAuth } from '../../context/AuthContext';

interface Friend {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  membershipType?: string;
  equippedProfileBorder?: string | null;
  currentActivity?: {
    type: 'PLAYING' | 'IN_CALL' | 'LISTENING' | 'WATCHING' | 'STREAMING' | 'IDLE';
    name: string;
  } | null;
}

type UserStatus = 'ONLINE' | 'IDLE' | 'DO_NOT_DISTURB' | 'INVISIBLE';

interface ConnectOnlineFriendsProps {
  accentColor: string;
  onFriendClick?: (friendId: string) => void;
  onSettingsClick?: () => void;
}

const STATUS_CONFIG: Record<UserStatus, { color: string; label: string; icon: React.ElementType }> = {
  ONLINE: { color: '#3CFF00', label: 'Online', icon: Circle },
  IDLE: { color: '#FBBF24', label: 'Ausente', icon: Moon },
  DO_NOT_DISTURB: { color: '#EF4444', label: 'Não Perturbe', icon: MinusCircle },
  INVISIBLE: { color: '#6B7280', label: 'Invisível', icon: Wifi },
};

export const ConnectOnlineFriends: React.FC<ConnectOnlineFriendsProps> = ({
  accentColor,
  onFriendClick,
  onSettingsClick,
}) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>('ONLINE');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const statusPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFriends();
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
      // Try the new Connect endpoint first
      const response = await api.get('/connect/friends/online');
      const onlineFriends = response.data.friends || [];
      setFriends(onlineFriends);
    } catch (error) {
      // Fallback to users/friends endpoint
      try {
        const response = await api.get('/users/friends');
        setFriends(response.data.filter((f: Friend) => f.isOnline));
      } catch (e) {
        console.error('Error fetching friends:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'PLAYING':
        return <Gamepad2 className="w-3 h-3 text-green-400" />;
      case 'IN_CALL':
        return <Headphones className="w-3 h-3 text-blue-400" />;
      case 'LISTENING':
        return <Radio className="w-3 h-3 text-purple-400" />;
      case 'WATCHING':
        return <Eye className="w-3 h-3 text-red-400" />;
      case 'STREAMING':
        return <Radio className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type?: string) => {
    switch (type) {
      case 'PLAYING': return 'text-green-400';
      case 'IN_CALL': return 'text-blue-400';
      case 'LISTENING': return 'text-purple-400';
      case 'WATCHING': return 'text-red-400';
      case 'STREAMING': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const currentStatus = STATUS_CONFIG[userStatus];

  return (
    <div className="flex flex-col h-full p-4 font-grotesk">
      {/* Glassmorphic Card Container */}
      <div className="flex-1 flex flex-col bg-white/[0.03] border border-white/10 backdrop-blur-[12px] rounded-[22px] overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[#F1F5F9] font-bold text-lg">amigos online</h3>
            <span 
              className="px-2 py-0.5 text-xs font-bold rounded-lg"
              style={{ backgroundColor: `${accentColor}33`, color: accentColor }}
            >
              {friends.length} Online
            </span>
          </div>
          <button
            onClick={onSettingsClick}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Friends List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4 min-h-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="py-8 text-center text-[#64748B]">
              <p className="text-sm">Nenhum amigo online</p>
            </div>
          ) : (
            <AnimatePresence>
              {friends.map((friend, index) => {
                const isMGT = friend.membershipType === 'MGT';
                
                return (
                  <motion.button
                    key={friend.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onFriendClick?.(friend.id)}
                    className="w-full flex items-center gap-3 py-2 hover:bg-white/[0.02] rounded-xl transition-colors group"
                  >
                    {/* Avatar with profile border */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-full p-[2px]"
                        style={{ background: getProfileBorderGradient(friend.equippedProfileBorder, isMGT) }}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-black/50">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.displayName || friend.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                              style={{ backgroundColor: accentColor }}
                            >
                              {(friend.displayName || friend.name).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Online indicator */}
                      <div 
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#131022]"
                        style={{ backgroundColor: '#3CFF00', boxShadow: '0 0 8px #3CFF00' }}
                      />
                    </div>

                    {/* Name & Activity */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-[#F1F5F9] truncate">
                        {friend.displayName || friend.name}
                      </p>
                      {friend.currentActivity ? (
                        <div className={`flex items-center gap-1 text-xs ${getActivityColor(friend.currentActivity.type)}`}>
                          {getActivityIcon(friend.currentActivity.type)}
                          <span className="truncate uppercase text-[10px] tracking-wider text-[#64748B]">{friend.currentActivity.name}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-[#3CFF00]">Online</p>
                      )}
                    </div>

                    {/* Activity indicator dot (right side) */}
                    {friend.currentActivity && (
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getActivityColor(friend.currentActivity.type).includes('green') ? '#3CFF00' : '#94A3B8' }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* User Panel at bottom - with real user data and status picker */}
        <div className="mt-auto border-t border-white/5 flex-shrink-0 relative" ref={statusPickerRef}>
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

          <div className="p-4 mx-2 my-2 bg-white/[0.03] border border-white/10 backdrop-blur-[12px] rounded-xl flex items-center gap-3">
            {/* Current user avatar */}
            <div className="relative flex-shrink-0">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName || user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
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
            
            <button 
              onClick={onSettingsClick}
              className="p-1.5 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectOnlineFriends;
