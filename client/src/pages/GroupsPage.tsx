import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Lock, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CreateGroupModal from '../components/CreateGroupModal';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';

interface Group {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  membershipType: 'MAGAZINE' | 'MGT';
  isPrivate: boolean;
  maxMembers: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string;
  };
  members: any[];
  _count: {
    messages: number;
  };
}

export default function GroupsPage() {
  const { user, theme } = useAuth();
  const navigate = useNavigate();
  const isMGT = user?.membershipType === 'MGT';

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const accentColor = isMGT ? 'emerald-500' : 'gold-500';

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups([newGroup, ...groups]);
    setShowCreateModal(false);
    navigate(`/groups/${newGroup.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
        <LuxuriousBackground />
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-${accentColor}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
      <LuxuriousBackground />
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 pt-48 pb-8 relative z-10">
        {/* Page Title with Icon */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className={`w-8 h-8 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
            <div>
              <h1 className={`text-4xl font-serif ${isMGT ? 'text-emerald-400' : 'text-gold-400'} mb-1`}>Grupos</h1>
              <p className="text-gray-400 text-sm">Conecte-se com membros de interesses similares</p>
            </div>
          </div>
          <motion.button
            onClick={handleCreateGroup}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${isMGT ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gold-500 hover:bg-gold-400'} text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-lg transition-colors`}
          >
            <Plus className="w-5 h-5" />
            Criar Grupo
          </motion.button>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className={`w-16 h-16 ${themeSecondary} mx-auto mb-4`} />
            <h3 className={`text-xl font-medium ${themeText} mb-2`}>Nenhum grupo ainda</h3>
            <p className={themeSecondary}>Crie o primeiro grupo e comece a conectar membros!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/groups/${group.id}`)}
                className={`glass-panel rounded-xl overflow-hidden border ${themeBorder} cursor-pointer transition-all duration-300 hover:border-${accentColor}/50`}
              >
                {/* Avatar */}
                <div className="relative h-32 bg-gradient-to-br from-${accentColor}/20 to-${accentColor}/5 flex items-center justify-center">
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.name}
                      className="w-20 h-20 rounded-full border-4 border-white/20"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full bg-${accentColor}/20 flex items-center justify-center`}>
                      <Users className={`w-10 h-10 text-${accentColor}`} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`text-lg font-semibold ${themeText}`}>{group.name}</h3>
                    {group.isPrivate ? (
                      <Lock className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Globe className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  {group.description && (
                    <p className={`${themeSecondary} text-sm mb-3 line-clamp-2`}>
                      {group.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className={themeSecondary}>
                        {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                      </span>
                      <span className={themeSecondary}>
                        {group._count.messages} {group._count.messages === 1 ? 'mensagem' : 'mensagens'}
                      </span>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${themeSecondary}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
