import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, ArrowRight, Users } from 'lucide-react';
import { ConnectGroupCard } from './ConnectGroupCard';
import { ConnectRecentActivity } from './ConnectRecentActivity';
import { ConicLightEffect } from '../effects';

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

interface ConnectHubProps {
  groups: ConnectGroup[];
  accentColor: string;
  onGroupClick: (group: ConnectGroup) => void;
  onCreateGroup: () => void;
  onUserClick?: (userId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isMGT: boolean;
}

export const ConnectHub: React.FC<ConnectHubProps> = ({
  groups,
  accentColor,
  onGroupClick,
  onCreateGroup,
  onUserClick,
  searchQuery,
  onSearchChange,
  isMGT,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="relative flex-1 overflow-y-auto">
      {/* Conic gradient light effect - based on Figma design */}
      <ConicLightEffect color={accentColor} />

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto font-grotesk">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-[#F1F5F9] tracking-tight"
            style={{ letterSpacing: '-0.025em' }}
          >
            ROVEX CONNECT
          </motion.h1>

          <div className="flex items-center gap-4">
            {/* Search Bar - Glassmorphic */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="pesquisar"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-48 md:w-64 pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-full text-sm text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all backdrop-blur-[12px]"
              />
            </motion.div>

            {/* Create Group Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={onCreateGroup}
              className="flex items-center gap-2 px-6 py-2 rounded-full text-base font-bold text-white transition-all hover:scale-105"
              style={{ 
                backgroundColor: accentColor,
                boxShadow: `0px 0px 15px 0px ${accentColor}66`
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">criar grupo</span>
            </motion.button>
          </div>
        </div>

        {/* Active Groups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
              Grupos ativos agora
            </h2>
            <button 
              className="text-sm font-medium hover:text-white flex items-center gap-1 transition-colors"
              style={{ color: '#A796FF' }}
            >
              visualizar todos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {activeGroups.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/[0.03] rounded-[22px] border border-white/10 backdrop-blur-[12px]">
              <div 
                className="w-16 h-16 rounded-[22px] flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Users className="w-8 h-8" style={{ color: accentColor }} />
              </div>
              <h3 className="text-[#F1F5F9] font-bold mb-2">Nenhum grupo ativo</h3>
              <p className="text-[#64748B] text-sm mb-4">
                Crie ou entre em um grupo para começar a conectar
              </p>
              <button
                onClick={onCreateGroup}
                className="px-6 py-2 rounded-full text-base font-bold text-white hover:scale-105 transition-transform"
                style={{ 
                  backgroundColor: accentColor,
                  boxShadow: `0px 0px 15px 0px ${accentColor}66`
                }}
              >
                Criar seu primeiro grupo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGroups.slice(0, 4).map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <ConnectGroupCard
                    id={group.id}
                    name={group.name}
                    avatarUrl={group.avatarUrl}
                    bannerUrl={group.bannerUrl}
                    members={group.members}
                    onlineCount={group.members.filter(m => m.user.isOnline).length}
                    onClick={() => onGroupClick(group)}
                    accentColor={accentColor}
                    isMGT={isMGT}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ConnectRecentActivity
            accentColor={accentColor}
            onUserClick={onUserClick}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ConnectHub;
