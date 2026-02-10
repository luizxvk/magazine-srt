import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Lock, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CreateGroupModal from '../components/CreateGroupModal';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Loader from '../components/Loader';

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
  const { user, theme, accentColor, accentGradient } = useAuth();
  const navigate = useNavigate();
  const isMGT = user?.membershipType === 'MGT';

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';

  // Dynamic button style based on accent color/gradient
  const buttonStyle = isMGT 
    ? {} 
    : { background: accentGradient || accentColor, boxShadow: `0 10px 25px ${accentColor}40` };

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
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:${isMGT ? 'bg-emerald-500/30' : 'bg-gold-500/30'} relative`}>
      <LuxuriousBackground />
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 pt-48 pb-20 relative z-10">
        {/* Page Title with Icon */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'} rounded-xl border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
              <Users className={`w-8 h-8 ${isMGT ? 'text-emerald-500' : 'text-gold-400'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white">Grupos</h1>
              <p className="text-gray-400">Conecte-se com membros de interesses similares</p>
            </div>
          </div>
          <motion.button
            onClick={handleCreateGroup}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={buttonStyle}
            className={`${isMGT ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-emerald-500/50' : ''} text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-xl transition-all`}
          >
            <Plus className="w-5 h-5" />
            Criar Grupo
          </motion.button>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-white/10 p-16 text-center">
            <Users className={`w-20 h-20 ${isMGT ? 'text-emerald-500/50' : 'text-gold-500/50'} mx-auto mb-4`} />
            <h3 className={`text-2xl font-bold ${themeText} mb-2`}>Nenhum grupo ainda</h3>
            <p className={`${themeSecondary} mb-6`}>Crie o primeiro grupo e comece a conectar membros!</p>
            <motion.button
              onClick={handleCreateGroup}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={buttonStyle}
              className={`${isMGT ? 'bg-emerald-600 hover:bg-emerald-500' : ''} text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg transition-colors`}
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Grupo
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => navigate(`/groups/${group.id}`)}
                className={`glass-panel rounded-2xl overflow-hidden border ${themeBorder} cursor-pointer transition-all duration-300 hover:border-${isMGT ? 'emerald' : 'gold'}-500/50 hover:shadow-xl`}
              >
                {/* Avatar */}
                <div className={`relative h-32 ${isMGT ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-500/5' : 'bg-gradient-to-br from-gold-600/20 to-gold-500/5'} flex items-center justify-center`}>
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.name}
                      className="w-20 h-20 rounded-full border-4 border-white/20 object-cover"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full ${isMGT ? 'bg-emerald-600/30' : 'bg-gold-600/30'} flex items-center justify-center`}>
                      <Users className={`w-10 h-10 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                    </div>
                  )}
                  {!group.isPrivate && (
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {group.isPrivate && (
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className={`text-lg font-bold ${themeText} mb-2`}>{group.name}</h3>

                  {group.description && (
                    <p className={`${themeSecondary} text-sm mb-4 line-clamp-2 min-h-[40px]`}>
                      {group.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <span className={`${themeSecondary} flex items-center gap-1`}>
                        <Users className="w-4 h-4" />
                        {group.members.length}
                      </span>
                      <span className={`${themeSecondary} flex items-center gap-1`}>
                        <span className="w-4 h-4 flex items-center justify-center text-xs">💬</span>
                        {group._count.messages}
                      </span>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isMGT ? 'text-emerald-500' : 'text-gold-500'}`} />
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
