import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users } from 'lucide-react';
import { ConnectGroupCard } from './ConnectGroupCard';

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

interface ViewAllGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ConnectGroup[];
  accentColor: string;
  onGroupClick: (group: ConnectGroup) => void;
  isMGT: boolean;
}

export const ViewAllGroupsModal: React.FC<ViewAllGroupsModalProps> = ({
  isOpen,
  onClose,
  groups,
  accentColor,
  onGroupClick,
  isMGT,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'mine'>('all');

  // Filter groups based on search and filter
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'active') {
      return matchesSearch && group.members.some(m => m.user.isOnline);
    }
    if (filter === 'mine') {
      return matchesSearch && group.isMember !== false;
    }
    return matchesSearch;
  });

  // Get real online count for each group
  const getOnlineCount = (group: ConnectGroup) => {
    return group.members.filter(m => m.user.isOnline).length;
  };

  const handleGroupClick = (group: ConnectGroup) => {
    onGroupClick(group);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-x-20 md:inset-y-10 z-50 flex items-center justify-center"
          >
            <div 
              className="w-full h-full max-w-6xl bg-[#0d0d1a] border border-white/10 rounded-3xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-white font-grotesk">Todos os Grupos</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {filteredGroups.length} grupos encontrados
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 border-b border-white/10">
                {/* Search */}
                <div className="relative flex-1 w-full md:w-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar grupos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                  {(['all', 'active', 'mine'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        filter === f
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={filter === f ? { backgroundColor: accentColor } : {}}
                    >
                      {f === 'all' && 'Todos'}
                      {f === 'active' && 'Ativos'}
                      {f === 'mine' && 'Meus Grupos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Groups Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <Users className="w-10 h-10" style={{ color: accentColor }} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum grupo encontrado</h3>
                    <p className="text-gray-400">
                      {searchQuery ? 'Tente buscar por outro termo' : 'Crie ou entre em um grupo para começar'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGroups.map((group, index) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <ConnectGroupCard
                          id={group.id}
                          name={group.name}
                          avatarUrl={group.avatarUrl}
                          bannerUrl={group.bannerUrl}
                          members={group.members}
                          onlineCount={getOnlineCount(group)}
                          onClick={() => handleGroupClick(group)}
                          accentColor={accentColor}
                          isMGT={isMGT}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewAllGroupsModal;
