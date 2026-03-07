import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, ArrowRight, Users, Bell, ChevronLeft } from 'lucide-react';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';
import RovexConnectIcon from './RovexConnectIcon';

interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  user: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    isOnline?: boolean;
    membershipType?: string;
    equippedProfileBorder?: string | null;
  };
}

interface ConnectGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isPrivate: boolean;
  isMember?: boolean;
  members: GroupMember[];
  _count: {
    messages: number;
    members: number;
  };
}

interface MobileConnectViewProps {
  groups: ConnectGroup[];
  accentColor: string;
  onGroupClick: (group: ConnectGroup) => void;
  onCreateGroup: () => void;
  onUserClick?: (userId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isMGT: boolean;
  onBack?: () => void;
  userAvatarUrl?: string;
  hasNotifications?: boolean;
}

/**
 * Mobile-optimized Connect view matching Figma design node 75-2.
 * Features:
 * - Header with logo, search bar, notification bell
 * - Horizontal scrolling "Grupos ativos agora" cards
 * - Clean glassmorphic design
 */
export const MobileConnectView: React.FC<MobileConnectViewProps> = ({
  groups,
  accentColor,
  onGroupClick,
  onCreateGroup,
  onUserClick: _onUserClick,
  searchQuery,
  onSearchChange,
  isMGT,
  onBack,
  userAvatarUrl,
  hasNotifications = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate into active (has online members) and all groups
  const activeGroups = filteredGroups.filter(group => 
    group.members.some(m => m.user.isOnline)
  );

  return (
    <div className="h-screen flex flex-col bg-[#08081B] font-grotesk relative z-10">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-2">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white/60" />
              </button>
            )}
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: accentColor }}
            >
              <RovexConnectIcon size={16} color="white" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">ROVEX CONNECT</h1>
          </div>

          {/* Right: Notification & Profile */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border border-[#0F0F23]" />
              )}
            </button>
            <div className="relative">
              <img 
                src={userAvatarUrl || '/assets/logo-rovex.png'} 
                className="w-9 h-9 rounded-full border-2"
                style={{ borderColor: `${accentColor}40` }}
                alt="Profile"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F0F23]" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="pesquisar"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-full text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Groups Section */}
        <div className="py-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-base font-bold text-white">Grupos ativos agora</h2>
            <button 
              className="text-xs font-medium flex items-center gap-1 transition-colors"
              style={{ color: accentColor }}
            >
              visualizar todos
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Horizontal Scroll Container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {activeGroups.length === 0 ? (
              <div className="flex-1 min-w-[280px] text-center py-8 px-4 bg-white/[0.03] rounded-[22px] border border-white/10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Users className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <p className="text-white/60 text-sm">Nenhum grupo ativo</p>
              </div>
            ) : (
              activeGroups.map((group) => (
                <MobileGroupCard
                  key={group.id}
                  group={group}
                  accentColor={accentColor}
                  onClick={() => onGroupClick(group)}
                  isMGT={isMGT}
                />
              ))
            )}
          </div>
        </div>

        {/* All Groups Section */}
        <div className="py-4 px-4">
          <h2 className="text-base font-bold text-white mb-3">Todos os grupos</h2>
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <MobileGroupListItem
                key={group.id}
                group={group}
                accentColor={accentColor}
                onClick={() => onGroupClick(group)}
                isMGT={isMGT}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        onClick={onCreateGroup}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-20"
        style={{ 
          backgroundColor: accentColor,
          boxShadow: `0 0 30px ${accentColor}50`
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
};

/**
 * Compact group card for horizontal scroll (matching Figma design)
 */
const MobileGroupCard: React.FC<{
  group: ConnectGroup;
  accentColor: string;
  onClick: () => void;
  isMGT: boolean;
}> = ({ group, accentColor, onClick, isMGT: _isMGT }) => {
  const onlineMembers = group.members.filter(m => m.user.isOnline);
  const displayMembers = onlineMembers.slice(0, 3);
  const remainingCount = Math.max(0, onlineMembers.length - 3);

  return (
    <motion.button
      onClick={onClick}
      className="flex-shrink-0 w-[160px] bg-white/[0.03] border border-white/10 rounded-[22px] overflow-hidden text-left backdrop-blur-[12px]"
      style={{ scrollSnapAlign: 'start' }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Cover Image */}
      <div className="relative h-24 overflow-hidden rounded-t-[20px]">
        {group.bannerUrl || group.avatarUrl ? (
          <>
            <img 
              src={group.bannerUrl || group.avatarUrl} 
              className="w-full h-full object-cover" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <div 
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)` }}
          />
        )}
        {/* Online indicator */}
        <div className="absolute top-2 right-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse block" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-white truncate mb-2">{group.name}</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">{onlineMembers.length} online</span>
          
          {/* Member Avatars */}
          <div className="flex -space-x-2">
            {displayMembers.map((member, idx) => (
              <div 
                key={member.id}
                className="w-6 h-6 rounded-full border-2 border-[#0F0F23] overflow-hidden"
                style={{ 
                  zIndex: 3 - idx,
                  background: getProfileBorderGradient(member.user.equippedProfileBorder, member.user.membershipType === 'MGT')
                }}
              >
                <img 
                  src={member.user.avatarUrl || '/assets/logo-rovex.png'} 
                  className="w-full h-full object-cover rounded-full"
                  alt=""
                />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="w-6 h-6 rounded-full border-2 border-[#0F0F23] bg-[#64748B] flex items-center justify-center text-[10px] font-bold text-white">
                +{remainingCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

/**
 * List item for "All groups" section
 */
const MobileGroupListItem: React.FC<{
  group: ConnectGroup;
  accentColor: string;
  onClick: () => void;
  isMGT: boolean;
}> = ({ group, accentColor, onClick, isMGT: _isMGT2 }) => {
  const onlineCount = group.members.filter(m => m.user.isOnline).length;

  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative">
        {group.avatarUrl ? (
          <img 
            src={group.avatarUrl} 
            className="w-12 h-12 rounded-xl object-cover" 
            alt="" 
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)` }}
          >
            {group.name.charAt(0).toUpperCase()}
          </div>
        )}
        {onlineCount > 0 && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0F0F23]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate">{group.name}</h3>
        <p className="text-xs text-white/40">
          {group._count.members} membros • {onlineCount} online
        </p>
      </div>

      {/* Chevron */}
      <ArrowRight className="w-4 h-4 text-white/30" />
    </motion.button>
  );
};

export default MobileConnectView;
