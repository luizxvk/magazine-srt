import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Volume2, MicOff,
  Settings, Hash, ChevronRight, ChevronDown, Radio, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../services/api';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Loader from '../components/Loader';
import GradientText from '../components/GradientText';
import CreateGroupModal from '../components/CreateGroupModal';
import { VoiceChannelBar, ConnectGroupChat } from '../components/connect';

interface VoiceParticipant {
  id: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isStreaming: boolean;
  user: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface VoiceChannel {
  id: string;
  name: string;
  description?: string;
  maxUsers: number;
  isLocked: boolean;
  participants: VoiceParticipant[];
}

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
  };
}

interface ConnectGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPrivate: boolean;
  membershipType: 'MAGAZINE' | 'MGT';
  creator: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
  };
  members: GroupMember[];
  voiceChannels: VoiceChannel[];
  _count: {
    messages: number;
    members: number;
  };
}

interface CurrentVoice {
  channelId: string;
  channel: VoiceChannel & {
    group: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  };
}

export default function ConnectPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user, theme, showToast, showError } = useAuth();
  const { isStdTier } = useCommunity();
  const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;

  const [groups, setGroups] = useState<ConnectGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ConnectGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [addChannelGroupId, setAddChannelGroupId] = useState<string | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  
  // Voice state
  const [currentVoice, setCurrentVoice] = useState<CurrentVoice | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Socket.io hook for real-time communication
  const socket = useSocket();
  
  // WebRTC hook for voice/video (pass current channel id)
  const webrtc = useWebRTC(currentVoice?.channelId || null);

  // Register socket event listeners
  useEffect(() => {
    if (!socket.isConnected) return;

    socket.onVoiceUserJoined(() => {
      showToast('Usuário entrou no canal de voz');
      fetchGroups();
    });

    socket.onVoiceUserLeft(() => {
      fetchGroups();
    });

    socket.onScreenShareStarted(() => {
      showToast('Alguém iniciou compartilhamento de tela');
    });

    socket.onScreenShareStopped(() => {
      showToast('Compartilhamento de tela encerrado');
    });
  }, [socket.isConnected]);

  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeSidebar = theme === 'light' ? 'bg-gray-100' : 'bg-zinc-950';
  const themeHover = theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-white/5';

  useEffect(() => {
    fetchGroups();
    fetchCurrentVoice();
  }, []);

  useEffect(() => {
    if (groupId && groups.length > 0) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroup(group);
        setExpandedGroups(prev => new Set([...prev, group.id]));
      }
    }
  }, [groupId, groups]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/connect/groups');
      setGroups(response.data);
      
      // Auto-select first group if none selected
      if (response.data.length > 0 && !groupId) {
        setSelectedGroup(response.data[0]);
        setExpandedGroups(new Set([response.data[0].id]));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentVoice = async () => {
    try {
      const response = await api.get('/connect/voice/current');
      if (response.data) {
        setCurrentVoice(response.data);
        setIsMuted(response.data.isMuted);
        setIsDeafened(response.data.isDeafened);
      }
    } catch (error) {
      console.error('Error fetching current voice:', error);
    }
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleJoinVoice = async (groupId: string, channelId: string) => {
    try {
      const response = await api.post(`/connect/groups/${groupId}/voice/${channelId}/join`);
      setCurrentVoice(response.data);
      
      // Join via Socket.io for real-time updates
      if (user) {
        socket.joinVoice(channelId, {
          odiserId: user.id,
          name: user.displayName || user.name,
          avatarUrl: user.avatarUrl,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          isStreaming: false,
        });
      }
      
      // Start WebRTC audio
      await webrtc.startAudio();
      
      showToast('Conectado ao canal de voz');
      fetchGroups(); // Refresh to show updated participants
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao conectar');
    }
  };

  const handleLeaveVoice = async () => {
    try {
      if (currentVoice) {
        // Leave via Socket.io
        socket.leaveVoice(currentVoice.channelId);
        
        // Stop WebRTC
        webrtc.stopAudio();
        webrtc.stopScreenShare();
      }
      
      await api.post('/connect/voice/leave');
      setCurrentVoice(null);
      setIsMuted(false);
      setIsDeafened(false);
      showToast('Desconectado do canal de voz');
      fetchGroups();
    } catch (error) {
      console.error('Error leaving voice:', error);
    }
  };

  const handleToggleMute = async () => {
    try {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      
      // Update WebRTC audio track
      webrtc.toggleMute();
      
      // Sync via Socket
      if (currentVoice) {
        socket.updateVoiceState(currentVoice.channelId, { isMuted: newMuted });
      }
      
      await api.patch('/connect/voice/state', { isMuted: newMuted });
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleToggleDeafen = async () => {
    try {
      const newDeafened = !isDeafened;
      setIsDeafened(newDeafened);
      // Deafen also mutes
      if (newDeafened) setIsMuted(true);
      
      // Update WebRTC - mute audio when deafening
      if (newDeafened) {
        webrtc.toggleMute();
      }
      
      // Sync via Socket
      if (currentVoice) {
        socket.updateVoiceState(currentVoice.channelId, { 
          isDeafened: newDeafened,
          isMuted: newDeafened ? true : isMuted 
        });
      }
      
      await api.patch('/connect/voice/state', { 
        isDeafened: newDeafened,
        isMuted: newDeafened ? true : isMuted 
      });
    } catch (error) {
      console.error('Error toggling deafen:', error);
    }
  };

  // Screen sharing handler
  const handleToggleScreenShare = async () => {
    try {
      if (webrtc.isScreenSharing) {
        webrtc.stopScreenShare();
        if (currentVoice) {
          socket.stopScreenShare(currentVoice.channelId);
        }
        showToast('Compartilhamento de tela encerrado');
      } else {
        await webrtc.startScreenShare();
        if (currentVoice) {
          socket.startScreenShare(currentVoice.channelId);
        }
        showToast('Compartilhamento de tela iniciado');
      }
    } catch (error) {
      showError('Não foi possível compartilhar a tela');
    }
  };

  const handleGroupCreated = (newGroup: any) => {
    setGroups([newGroup, ...groups]);
    setSelectedGroup(newGroup);
    setShowCreateModal(false);
  };

  const handleOpenAddChannel = (groupId: string) => {
    setAddChannelGroupId(groupId);
    setNewChannelName('');
    setShowAddChannelModal(true);
  };

  const handleCreateVoiceChannel = async () => {
    if (!addChannelGroupId || !newChannelName.trim()) return;
    
    try {
      await api.post(`/connect/groups/${addChannelGroupId}/voice`, {
        name: newChannelName.trim(),
        maxUsers: selectedGroup?.members.length || 25,
      });
      showToast('Canal de voz criado com sucesso!');
      setShowAddChannelModal(false);
      setNewChannelName('');
      fetchGroups();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao criar canal');
    }
  };

  const getOnlineMembers = (members: GroupMember[]) => {
    return members.filter(m => m.user.isOnline);
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white font-sans relative">
        <LuxuriousBackground />
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans relative ${theme === 'light' ? 'bg-gray-50' : 'bg-zinc-900'}`}>
      <Header />
      
      <div className="flex h-[calc(100vh-64px)] pt-16">
        {/* Left Sidebar - Groups & Channels */}
        <div className={`w-64 ${themeSidebar} border-r ${themeBorder} flex flex-col`}>
          {/* Header */}
          <div className={`p-4 border-b ${themeBorder} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMGT ? 'bg-tier-std' : 'bg-gold-500'}`}>
                <Radio className={`w-4 h-4 ${isMGT ? 'text-white' : 'text-black'}`} />
              </div>
              <span className={`font-bold ${themeText}`}>Connect</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`p-2 rounded-lg ${themeHover} ${themeSecondary} transition-colors`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto py-2">
            {groups.length === 0 ? (
              <div className={`px-4 py-8 text-center ${themeSecondary}`}>
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum grupo ainda</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={`mt-3 text-sm hover:underline ${isMGT ? 'text-tier-std' : 'text-gold-500'}`}
                >
                  Criar seu primeiro grupo
                </button>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.id} className="px-2 mb-1">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroupExpand(group.id)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg ${themeHover} transition-colors`}
                  >
                    {group.avatarUrl ? (
                      <img 
                        src={group.avatarUrl} 
                        className="w-8 h-8 rounded-full object-cover"
                        alt={group.name}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${isMGT ? 'bg-tier-std-500/20' : 'bg-gold-500/20'} flex items-center justify-center`}>
                        <span className={`text-sm font-bold ${isMGT ? 'text-tier-std-500' : 'text-gold-500'}`}>
                          {group.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className={`flex-1 text-left text-sm font-medium truncate ${themeText}`}>
                      {group.name}
                    </span>
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className={`w-4 h-4 ${themeSecondary}`} />
                    ) : (
                      <ChevronRight className={`w-4 h-4 ${themeSecondary}`} />
                    )}
                  </button>

                  {/* Channels */}
                  <AnimatePresence>
                    {expandedGroups.has(group.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        {/* Text Channel */}
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            navigate(`/connect/${group.id}`);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-1.5 ${themeHover} rounded-md transition-colors ${
                            selectedGroup?.id === group.id ? (isMGT ? 'bg-tier-std-500/10 text-tier-std-500' : 'bg-gold-500/10 text-gold-500') : themeSecondary
                          }`}
                        >
                          <Hash className="w-4 h-4" />
                          <span className="text-sm">geral</span>
                        </button>

                        {/* Voice Channels */}
                        {group.voiceChannels.map(channel => (
                          <div key={channel.id}>
                            <button
                              onClick={() => handleJoinVoice(group.id, channel.id)}
                              disabled={channel.isLocked}
                              className={`w-full flex items-center gap-2 px-4 py-1.5 ${themeHover} rounded-md transition-colors ${themeSecondary} ${
                                currentVoice?.channelId === channel.id ? 'bg-green-500/10 text-green-500' : ''
                              } ${channel.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Volume2 className="w-4 h-4" />
                              <span className="text-sm flex-1 text-left">{channel.name}</span>
                              <span className="text-xs opacity-60">
                                {channel.participants.length}/{channel.maxUsers}
                              </span>
                            </button>
                            
                            {/* Voice Participants */}
                            {channel.participants.length > 0 && (
                              <div className="pl-8 py-1 space-y-1">
                                {channel.participants.map(participant => (
                                  <div 
                                    key={participant.id}
                                    className={`flex items-center gap-2 px-2 py-1 rounded ${themeSecondary}`}
                                  >
                                    <img
                                      src={participant.user.avatarUrl || '/assets/default-avatar.png'}
                                      className={`w-5 h-5 rounded-full ${participant.isSpeaking ? 'ring-2 ring-green-500' : ''}`}
                                      alt=""
                                    />
                                    <span className="text-xs truncate">
                                      {participant.user.displayName || participant.user.name}
                                    </span>
                                    {participant.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add Voice Channel (Admin only) */}
                        {group.members.find(m => m.userId === user?.id)?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleOpenAddChannel(group.id)}
                            className={`w-full flex items-center gap-2 px-4 py-1.5 ${themeHover} rounded-md transition-colors ${themeSecondary} opacity-60 hover:opacity-100`}
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-xs">Adicionar canal</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>

          {/* Voice Controls (when in voice) */}
          {currentVoice && (
            <VoiceChannelBar
              channel={currentVoice.channel}
              isMuted={isMuted}
              isDeafened={isDeafened}
              isScreenSharing={webrtc.isScreenSharing}
              onToggleMute={handleToggleMute}
              onToggleDeafen={handleToggleDeafen}
              onToggleScreenShare={handleToggleScreenShare}
              onDisconnect={handleLeaveVoice}
              theme={theme}
            />
          )}

          {/* User Panel */}
          <div className={`p-3 border-t ${themeBorder} flex items-center gap-2`}>
            <img
              src={user?.avatarUrl || '/assets/default-avatar.png'}
              className="w-8 h-8 rounded-full"
              alt=""
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${themeText}`}>
                {user?.displayName || user?.name}
              </p>
              <p className="text-xs text-green-500">Online</p>
            </div>
            <button className={`p-2 ${themeHover} rounded-lg ${themeSecondary}`}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content - Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <ConnectGroupChat 
              group={selectedGroup} 
              theme={theme}
              isMGT={isMGT}
              onRefresh={fetchGroups}
              onMembersClick={() => setShowMembersDrawer(true)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isMGT ? 'bg-tier-std\/20' : 'bg-gold-500/20'}`}>
                  <Radio className={`w-10 h-10 ${isMGT ? 'text-tier-std-500' : 'text-gold-500'}`} />
                </div>
                <h2 className={`text-xl font-bold mb-2 ${themeText}`}>
                  Bem-vindo ao <GradientText>Rovex Connect</GradientText>
                </h2>
                <p className={`${themeSecondary} max-w-md`}>
                  Selecione um grupo para começar a conversar ou entre em um canal de voz.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Members */}
        {selectedGroup && (
          <div className={`w-60 ${themeSidebar} border-l ${themeBorder} p-4 hidden lg:block`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${themeSecondary}`}>
              Online — {getOnlineMembers(selectedGroup.members).length}
            </h3>
            <div className="space-y-2">
              {getOnlineMembers(selectedGroup.members).map(member => (
                <div 
                  key={member.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${themeHover} cursor-pointer`}
                  onClick={() => navigate(`/profile/${member.userId}`)}
                >
                  <div className="relative">
                    <img
                      src={member.user.avatarUrl || '/assets/default-avatar.png'}
                      className="w-8 h-8 rounded-full"
                      alt=""
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${themeText}`}>
                      {member.user.displayName || member.user.name}
                    </p>
                    {member.role !== 'MEMBER' && (
                      <p className={`text-xs ${member.role === 'ADMIN' ? (isMGT ? 'text-tier-std-400' : 'text-gold-400') : 'text-blue-400'}`}>
                        {member.role === 'ADMIN' ? 'Admin' : 'Mod'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 mt-6 ${themeSecondary}`}>
              Offline — {selectedGroup.members.length - getOnlineMembers(selectedGroup.members).length}
            </h3>
            <div className="space-y-2 opacity-50">
              {selectedGroup.members
                .filter(m => !m.user.isOnline)
                .slice(0, 10)
                .map(member => (
                  <div 
                    key={member.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${themeHover} cursor-pointer`}
                    onClick={() => navigate(`/profile/${member.userId}`)}
                  >
                    <img
                      src={member.user.avatarUrl || '/assets/default-avatar.png'}
                      className="w-8 h-8 rounded-full grayscale"
                      alt=""
                    />
                    <p className={`text-sm truncate ${themeSecondary}`}>
                      {member.user.displayName || member.user.name}
                    </p>
                  </div>
                ))}
            </div>
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

      {/* Add Voice Channel Modal */}
      <AnimatePresence>
        {showAddChannelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowAddChannelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl p-6 ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border ${themeBorder}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${themeText}`}>Criar Canal de Voz</h3>
                <button
                  onClick={() => setShowAddChannelModal(false)}
                  className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Nome do canal"
                className={`w-full px-4 py-3 rounded-xl mb-4 ${
                  theme === 'light' 
                    ? 'bg-gray-100 text-gray-900 placeholder:text-gray-500' 
                    : 'bg-zinc-800 text-white placeholder:text-gray-500'
                } border ${themeBorder} focus:outline-none focus:ring-2 focus:ring-tier-std`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateVoiceChannel()}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddChannelModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl ${themeHover} ${themeSecondary} font-medium`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateVoiceChannel}
                  disabled={!newChannelName.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    newChannelName.trim()
                      ? isMGT 
                        ? 'bg-tier-std text-white hover:bg-tier-std-600' 
                        : 'bg-gold-500 text-black hover:bg-gold-600'
                      : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Criar Canal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Drawer (Mobile) */}
      <AnimatePresence>
        {showMembersDrawer && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setShowMembersDrawer(false)}
          >
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute right-0 top-0 bottom-0 w-72 ${themeSidebar} border-l ${themeBorder} p-4 overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${themeText}`}>Membros</h3>
                <button
                  onClick={() => setShowMembersDrawer(false)}
                  className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${themeSecondary}`}>
                Online — {getOnlineMembers(selectedGroup.members).length}
              </h4>
              <div className="space-y-2 mb-6">
                {getOnlineMembers(selectedGroup.members).map(member => (
                  <div 
                    key={member.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${themeHover} cursor-pointer`}
                    onClick={() => { navigate(`/profile/${member.userId}`); setShowMembersDrawer(false); }}
                  >
                    <div className="relative">
                      <img
                        src={member.user.avatarUrl || '/assets/default-avatar.png'}
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${themeText}`}>
                        {member.user.displayName || member.user.name}
                      </p>
                      {member.role !== 'MEMBER' && (
                        <p className={`text-xs ${member.role === 'ADMIN' ? (isMGT ? 'text-tier-std-400' : 'text-gold-400') : 'text-blue-400'}`}>
                          {member.role === 'ADMIN' ? 'Admin' : 'Mod'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${themeSecondary}`}>
                Offline — {selectedGroup.members.length - getOnlineMembers(selectedGroup.members).length}
              </h4>
              <div className="space-y-2 opacity-50">
                {selectedGroup.members
                  .filter(m => !m.user.isOnline)
                  .map(member => (
                    <div 
                      key={member.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${themeHover} cursor-pointer`}
                      onClick={() => { navigate(`/profile/${member.userId}`); setShowMembersDrawer(false); }}
                    >
                      <img
                        src={member.user.avatarUrl || '/assets/default-avatar.png'}
                        className="w-8 h-8 rounded-full grayscale"
                        alt=""
                      />
                      <p className={`text-sm truncate ${themeSecondary}`}>
                        {member.user.displayName || member.user.name}
                      </p>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
