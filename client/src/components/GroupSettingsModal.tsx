import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Image, Check, Crown, Shield, UserMinus, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface GroupMember {
  id: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  user: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string;
  };
}

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  currentBackground?: string;
  isMuted: boolean;
  isAdmin: boolean;
  members: GroupMember[];
  onMuteToggle: (isMuted: boolean) => void;
  onBackgroundChange: (backgroundId: string) => void;
  onMemberRemove?: (memberId: string) => void;
  onRoleChange?: (memberId: string, role: 'MODERATOR' | 'MEMBER') => void;
  onDeleteGroup?: () => void;
  initialTab?: 'general' | 'background' | 'members';
}

// Available backgrounds with preview (same as CustomizationShop)
const backgrounds = [
  { id: 'bg_default', name: 'Padrão', preview: 'linear-gradient(125deg, #0a0a0a 0%, #1a1a1a 100%)' },
  { id: 'bg_aurora', name: 'Aurora Boreal', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' },
  { id: 'bg_galaxy', name: 'Galáxia', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)' },
  { id: 'bg_matrix', name: 'Matrix', preview: 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 50%, #0a0f0a 100%)' },
  { id: 'bg_fire', name: 'Fogo', preview: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)' },
  { id: 'bg_ocean', name: 'Oceano', preview: 'linear-gradient(180deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)' },
  { id: 'bg_forest', name: 'Floresta', preview: 'linear-gradient(180deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)' },
  { id: 'bg_city', name: 'Cidade Neon', preview: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)' },
  { id: 'bg_space', name: 'Espaço Profundo', preview: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)' },
  { id: 'bg_sunset', name: 'Pôr do Sol', preview: 'linear-gradient(135deg, #1a0505 0%, #2a0a0a 25%, #3a1515 50%, #2a0a0a 75%, #1a0505 100%)' },
  { id: 'bg_cyberpunk', name: 'Cyberpunk', preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)' },
  { id: 'bg_lava', name: 'Lava', preview: 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)' },
  { id: 'bg_ice', name: 'Gelo Ártico', preview: 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)' },
  { id: 'bg_neon_grid', name: 'Grade Neon', preview: 'linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 25%, #2a0d2a 50%, #1a0d1a 75%, #0d0d0d 100%)' },
  { id: 'bg_emerald', name: 'Esmeralda', preview: 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)' },
  { id: 'bg_royal', name: 'Real Púrpura', preview: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)' },
  { id: 'bg_carbon', name: 'Fibra de Carbono', preview: 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)' },
];

export default function GroupSettingsModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentBackground,
  isMuted,
  isAdmin,
  members,
  onMuteToggle,
  onBackgroundChange,
  onMemberRemove,
  onRoleChange,
  onDeleteGroup,
  initialTab = 'general',
}: GroupSettingsModalProps) {
  const { user, theme } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'background' | 'members'>(initialTab);
  const [ownedBackgrounds, setOwnedBackgrounds] = useState<string[]>(['bg_default']);
  const [loading, setLoading] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isMGT = user?.membershipType === 'MGT';
  const isDarkMode = theme === 'dark';
  const themeColor = isMGT ? 'emerald' : 'gold';
  const bgMain = isDarkMode ? 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-black' : 'bg-white';

  // Reset to initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const borderColor = isDarkMode ? 'border-white/10' : 'border-gray-200';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    if (isOpen) {
      fetchOwnedBackgrounds();
    }
  }, [isOpen]);

  const fetchOwnedBackgrounds = async () => {
    try {
      const response = await api.get('/users/customizations');
      const owned = response.data.owned || [];
      // Filter only backgrounds from owned items
      const ownedBgs = owned.filter((id: string) => id.startsWith('bg_'));
      // Always include default
      if (!ownedBgs.includes('bg_default')) {
        ownedBgs.unshift('bg_default');
      }
      setOwnedBackgrounds(ownedBgs);
    } catch (error) {
      console.error('Error fetching customizations:', error);
    }
  };

  const handleMuteToggle = async () => {
    setMuteLoading(true);
    try {
      const response = await api.post(`/groups/${groupId}/mute`);
      onMuteToggle(response.data.isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    } finally {
      setMuteLoading(false);
    }
  };

  const handleBackgroundSelect = async (backgroundId: string) => {
    if (!isAdmin || loading) return;
    setLoading(true);
    try {
      // Call the parent handler - it handles the API call
      onBackgroundChange(backgroundId);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin || !onMemberRemove) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      onMemberRemove(memberId);
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'MODERATOR' | 'MEMBER') => {
    if (!isAdmin || !onRoleChange) return;
    try {
      await api.put(`/groups/${groupId}/members/${memberId}/role`, { role: newRole });
      onRoleChange(memberId, newRole);
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin || !onDeleteGroup) return;
    try {
      await api.delete(`/groups/${groupId}`);
      onDeleteGroup();
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="w-4 h-4 text-gold-500" />;
      case 'MODERATOR':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const tabs = isAdmin
    ? [
        { id: 'general' as const, label: 'Geral', icon: Settings },
        { id: 'background' as const, label: 'Fundo', icon: Image },
        { id: 'members' as const, label: 'Membros', icon: Crown },
      ]
    : [{ id: 'general' as const, label: 'Geral', icon: Settings }];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isDarkMode ? 'bg-black/80' : 'bg-black/40'} backdrop-blur-sm`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className={`relative w-full max-w-lg max-h-[85vh] ${bgMain} rounded-2xl border ${borderColor} shadow-2xl overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-4 border-b ${borderColor} flex items-center justify-between bg-gradient-to-r from-${themeColor}-500/10 to-transparent`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${themeColor}-500/20`}>
                <Settings className={`w-5 h-5 text-${themeColor}-400`} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${textMain}`}>Configurações do Grupo</h2>
                <p className={`text-xs ${textSub} truncate max-w-[200px]`}>{groupName}</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 ${textSub}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${borderColor}`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? `text-${themeColor}-400 border-b-2 border-${themeColor}-400 bg-${themeColor}-500/5`
                    : `${textSub} ${isDarkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-gray-900 hover:bg-gray-100'}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-160px)]">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Mute Toggle */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} border ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isMuted ? (
                        <VolumeX className={`w-5 h-5 ${textSub}`} />
                      ) : (
                        <Volume2 className={`w-5 h-5 text-${themeColor}-400`} />
                      )}
                      <div>
                        <p className={`font-medium ${textMain}`}>Notificações</p>
                        <p className={`text-xs ${textSub}`}>
                          {isMuted ? 'Notificações silenciadas' : 'Recebendo notificações'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleMuteToggle}
                      disabled={muteLoading}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isMuted
                          ? isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                          : `bg-${themeColor}-500`
                      }`}
                    >
                      <motion.div
                        animate={{ x: isMuted ? 2 : 26 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                      />
                    </button>
                  </div>
                </div>

                {/* Delete Group (Admin only) */}
                {isAdmin && (
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'} border border-red-500/20`}>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-3 text-red-500 hover:text-red-400 transition-colors w-full"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span className="font-medium">Excluir Grupo</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className={`text-sm ${textMain}`}>Tem certeza? Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDeleteGroup}
                            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm font-medium"
                          >
                            Sim, excluir
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Background Tab (Admin only) */}
            {activeTab === 'background' && isAdmin && (
              <div className="space-y-4">
                <p className={`text-sm ${textSub}`}>
                  Escolha um fundo da sua coleção para o chat do grupo
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {backgrounds
                    .filter(bg => ownedBackgrounds.includes(bg.id))
                    .map(bg => {
                      const isSelected = currentBackground === bg.id || (!currentBackground && bg.id === 'bg_default');
                      return (
                        <motion.button
                          key={bg.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBackgroundSelect(bg.id)}
                          disabled={loading}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            isSelected
                              ? `border-${themeColor}-500 ring-2 ring-${themeColor}-500/30`
                              : `${borderColor} hover:border-${themeColor}-500/50`
                          }`}
                        >
                          <div
                            className="absolute inset-0"
                            style={{ background: bg.preview }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Check className={`w-6 h-6 text-${themeColor}-400`} />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 backdrop-blur-sm">
                            <p className="text-[10px] text-white truncate text-center">{bg.name}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
                {ownedBackgrounds.length <= 1 && (
                  <p className={`text-xs ${textSub} text-center`}>
                    Compre mais fundos na Loja de Personalização!
                  </p>
                )}
              </div>
            )}

            {/* Members Tab (Admin only) */}
            {activeTab === 'members' && isAdmin && (
              <div className="space-y-3">
                {members.map(member => {
                  const isCreator = member.role === 'ADMIN';
                  const isMe = member.user.id === user?.id;

                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} border ${borderColor} flex items-center gap-3`}
                    >
                      <img
                        src={member.user.avatarUrl || '/default-avatar.png'}
                        alt={member.user.displayName || member.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${textMain} truncate`}>
                            {member.user.displayName || member.user.name}
                          </p>
                          {getRoleIcon(member.role)}
                          {isMe && (
                            <span className={`text-xs ${textSub}`}>(você)</span>
                          )}
                        </div>
                        <p className={`text-xs ${textSub}`}>
                          {member.role === 'ADMIN' ? 'Admin' : member.role === 'MODERATOR' ? 'Moderador' : 'Membro'}
                        </p>
                      </div>

                      {/* Actions (not for creator or self) */}
                      {!isCreator && !isMe && (
                        <div className="flex items-center gap-2">
                          {/* Toggle Moderator */}
                          <button
                            onClick={() => handleRoleChange(member.user.id, member.role === 'MODERATOR' ? 'MEMBER' : 'MODERATOR')}
                            className={`p-2 rounded-lg transition-colors ${
                              member.role === 'MODERATOR'
                                ? 'bg-blue-500/20 text-blue-400'
                                : isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                            }`}
                            title={member.role === 'MODERATOR' ? 'Remover moderador' : 'Tornar moderador'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveMember(member.user.id)}
                            className={`p-2 rounded-lg transition-colors text-red-400 ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}
                            title="Remover membro"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
