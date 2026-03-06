import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Gamepad2, Headphones, Radio, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';

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

interface ConnectOnlineFriendsProps {
  accentColor: string;
  onFriendClick?: (friendId: string) => void;
  onSettingsClick?: () => void;
}

export const ConnectOnlineFriends: React.FC<ConnectOnlineFriendsProps> = ({
  accentColor,
  onFriendClick,
  onSettingsClick,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

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

  const displayedFriends = showAll ? friends : friends.slice(0, 5);

  return (
    <div className="flex flex-col h-full p-4 font-grotesk">
      {/* Glassmorphic Card Container */}
      <div className="flex-1 flex flex-col bg-white/[0.03] border border-white/10 backdrop-blur-[12px] rounded-[22px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
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

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
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
              {displayedFriends.map((friend, index) => {
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

        {/* Show more/less button */}
        {friends.length > 5 && (
          <div className="px-6 py-3">
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-[#64748B] hover:text-[#F1F5F9] transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Ver todos ({friends.length - 5} mais)
                </>
              )}
            </button>
          </div>
        )}

        {/* User Panel at bottom - matching Figma */}
        <div className="mt-auto border-t border-white/5">
          <div className="p-4 mx-2 my-2 bg-white/[0.03] border border-white/10 backdrop-blur-[12px] rounded-xl flex items-center gap-3">
            {/* Current user avatar */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <Settings className="w-5 h-5 text-white" />
            </div>
            
            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#F1F5F9] truncate">Admin_User</p>
              <div className="flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#3CFF00' }}
                />
                <span className="text-xs text-[#3CFF00]">Online</span>
              </div>
            </div>
            
            <button className="p-1.5 text-[#64748B] hover:text-[#F1F5F9] transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectOnlineFriends;
