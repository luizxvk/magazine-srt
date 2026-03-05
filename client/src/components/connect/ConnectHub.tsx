import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { ConnectGroupCard } from './ConnectGroupCard';
import { ConnectRecentActivity } from './ConnectRecentActivity';
import { LightRays } from '../effects';

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
      {/* WebGL Light Rays Effect - animates on entry, then static */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <LightRays
          color={accentColor}
          origin="top-center"
          speed={1.5}
          spread={0.6}
          length={3}
          animationDuration={3}
          blur={80}
          fadeDistance={1.2}
        />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-white tracking-wide"
          >
            ROVEX <span style={{ color: accentColor }}>CONNECT</span>
          </motion.h1>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="pesquisar"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-48 md:w-64 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
              />
            </motion.div>

            {/* Create Group Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={onCreateGroup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
              style={{ backgroundColor: accentColor }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
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
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
              Grupos ativos agora
            </h2>
            <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
              visualizar todos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {activeGroups.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white/5 rounded-2xl border border-white/10">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Sparkles className="w-8 h-8" style={{ color: accentColor }} />
              </div>
              <h3 className="text-white font-medium mb-2">Nenhum grupo ativo</h3>
              <p className="text-gray-500 text-sm mb-4">
                Crie ou entre em um grupo para começar a conectar
              </p>
              <button
                onClick={onCreateGroup}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:scale-105 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                Criar seu primeiro grupo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
