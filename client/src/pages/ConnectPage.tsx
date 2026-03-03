import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Volume2, MicOff, Menu,
  Settings, Hash, ChevronRight, ChevronDown, Radio, X,
  Camera, HeadphoneOff
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

interface TextChannel {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isNSFW: boolean;
  position: number;
  _count?: {
    messages: number;
  };
}

interface ConnectGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPrivate: boolean;
  membershipType: 'MAGAZINE' | 'MGT';
  maxMembers?: number;
  creator: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
  };
  members: GroupMember[];
  voiceChannels: VoiceChannel[];
  textChannels: TextChannel[];
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
  const { user, theme, showToast, showError, accentColor } = useAuth();
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
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'VOICE'>('VOICE');
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Mobile state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Text channel state
  const [selectedTextChannel, setSelectedTextChannel] = useState<TextChannel | null>(null);
  
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

  const fetchGroups = async (showLoader = true) => {
    try {
      if (showLoader && groups.length === 0) {
        setLoading(true);
      }
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
      fetchGroups(false); // Refresh without loading spinner
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
      fetchGroups(false);
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
    setNewChannelType('VOICE');
    setShowAddChannelModal(true);
  };

  const handleCreateChannel = async () => {
    if (!addChannelGroupId || !newChannelName.trim()) return;
    
    try {
      if (newChannelType === 'VOICE') {
        await api.post(`/connect/groups/${addChannelGroupId}/voice`, {
          name: newChannelName.trim(),
          maxUsers: selectedGroup?.maxMembers || selectedGroup?.members.length || 25,
        });
        showToast('Canal de voz criado com sucesso!');
      } else {
        await api.post(`/connect/groups/${addChannelGroupId}/text`, {
          name: newChannelName.trim(),
        });
        showToast('Canal de texto criado com sucesso!');
      }
      setShowAddChannelModal(false);
      setNewChannelName('');
      fetchGroups(false);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao criar canal');
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroup) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.patch(`/connect/groups/${selectedGroup.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update local state
      setSelectedGroup({ ...selectedGroup, avatarUrl: response.data.avatarUrl });
      setGroups(groups.map(g => 
        g.id === selectedGroup.id ? { ...g, avatarUrl: response.data.avatarUrl } : g
      ));
      showToast('Foto do grupo atualizada!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao atualizar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getOnlineMembers = (members: GroupMember[]) => {
    return members.filter(m => m.user.isOnline);
  };

  const handleSelectGroup = (group: ConnectGroup) => {
    setSelectedGroup(group);
    // Seleciona o canal de texto padrão ou o primeiro canal
    const defaultChannel = group.textChannels?.find(c => c.isDefault) || group.textChannels?.[0] || null;
    setSelectedTextChannel(defaultChannel);
    navigate(`/connect/${group.id}`);
    setShowMobileSidebar(false);
  };

  const handleSelectTextChannel = (channel: TextChannel, group: ConnectGroup) => {
    setSelectedGroup(group);
    setSelectedTextChannel(channel);
    navigate(`/connect/${group.id}`);
    setShowMobileSidebar(false);
  };

  // Render groups list (used in both desktop and mobile)
  const renderGroupsList = () => {
    if (groups.length === 0) {
      return (
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
      );
    }

    return groups.map(group => (
      <div key={group.id} className="px-2 mb-1 group/item">
        {/* Group Header */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleGroupExpand(group.id)}
            className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg ${themeHover} transition-colors`}
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
          {/* Settings button */}
          {group.creator.id === user?.id && (
            <button
              onClick={() => {
                setSelectedGroup(group);
                setShowGroupSettings(true);
              }}
              className={`p-2 rounded-lg ${themeHover} ${themeSecondary} md:opacity-0 md:group-hover/item:opacity-100 transition-opacity`}
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Channels */}
        <AnimatePresence>
          {expandedGroups.has(group.id) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Text Channels */}
              {group.textChannels && group.textChannels.length > 0 ? (
                group.textChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectTextChannel(channel, group)}
                    className={`w-full flex items-center gap-2 px-4 py-1.5 ${themeHover} rounded-md transition-colors ${
                      selectedGroup?.id === group.id && selectedTextChannel?.id === channel.id 
                        ? (isMGT ? 'bg-tier-std-500/10 text-tier-std-500' : 'bg-gold-500/10 text-gold-500') 
                        : themeSecondary
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    <span className="text-sm flex-1 text-left truncate">{channel.name}</span>
                    {channel.isNSFW && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">18+</span>
                    )}
                  </button>
                ))
              ) : (
                // Fallback: canal "geral" padrão se não houver canais de texto
                <button
                  onClick={() => handleSelectGroup(group)}
                  className={`w-full flex items-center gap-2 px-4 py-1.5 ${themeHover} rounded-md transition-colors ${
                    selectedGroup?.id === group.id ? (isMGT ? 'bg-tier-std-500/10 text-tier-std-500' : 'bg-gold-500/10 text-gold-500') : themeSecondary
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">geral</span>
                </button>
              )}

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
                          {/* Avatar with speaking indicator */}
                          <div className="relative">
                            <img
                              src={participant.user.avatarUrl || '/assets/default-avatar.png'}
                              className="w-5 h-5 rounded-full"
                              alt=""
                            />
                            {/* Speaking ring animation */}
                            {participant.isSpeaking && (
                              <motion.div
                                className="absolute -inset-0.5 rounded-full border-2 border-green-500"
                                animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                              />
                            )}
                          </div>
                          <span className="text-xs truncate flex-1">
                            {participant.user.displayName || participant.user.name}
                          </span>
                          {participant.isStreaming && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">AO VIVO</span>
                          )}
                          {/* Mute icon */}
                          {participant.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                          {/* Deafen icon */}
                          {participant.isDeafened && <HeadphoneOff className="w-3 h-3 text-red-400" />}
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
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white font-sans relative">
        <LuxuriousBackground />
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          {/* Premium Connect Loading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${isMGT ? 'bg-gradient-to-br from-tier-std-500 to-tier-std-600' : 'bg-gradient-to-br from-gold-500 to-amber-600'}`}>
              <Radio className="w-12 h-12 text-white" />
            </div>
            <motion.div
              className={`absolute -inset-2 rounded-3xl border-2 ${isMGT ? 'border-tier-std-500/50' : 'border-gold-500/50'}`}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-2 ${isMGT ? 'text-tier-std-400' : 'text-gold-400'}`}>Rovex Connect</h2>
            <p className="text-gray-400">Conectando aos servidores...</p>
          </div>
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen font-sans relative ${theme === 'light' ? 'bg-gray-50' : 'bg-zinc-900'}`}
      style={{
        background: theme === 'dark' 
          ? `linear-gradient(180deg, ${accentColor}08 0%, transparent 30%), 
             linear-gradient(90deg, ${accentColor}05 0%, transparent 50%), 
             #18181b`
          : undefined
      }}
    >
      <Header />
      
      {/* Mobile Navigation Header */}
      <div className={`md:hidden fixed top-16 left-0 right-0 z-30 ${themeSidebar} border-b ${themeBorder} px-4 py-3 flex items-center justify-between`}>
        <button
          onClick={() => {
            setShowMobileSidebar(true);
          }}
          className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {selectedGroup && (
            <>
              {selectedGroup.avatarUrl ? (
                <img src={selectedGroup.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
              ) : (
                <div className={`w-6 h-6 rounded-full ${isMGT ? 'bg-tier-std-500/20' : 'bg-gold-500/20'} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${isMGT ? 'text-tier-std-500' : 'text-gold-500'}`}>
                    {selectedGroup.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className={`font-medium truncate max-w-[150px] ${themeText}`}>
                {selectedGroup.name}
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => setShowMembersDrawer(true)}
          className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay - starts below header */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 top-16 bg-black/50 z-40"
              onClick={() => setShowMobileSidebar(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`md:hidden fixed left-0 top-16 bottom-0 w-80 max-w-[85vw] z-50 ${themeSidebar} flex flex-col`}
            >
              {/* Mobile Sidebar Header */}
              <div className={`p-4 border-b ${themeBorder} flex items-center justify-between safe-area-top`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMGT ? 'bg-tier-std' : 'bg-gold-500'}`}>
                    <Radio className={`w-4 h-4 ${isMGT ? 'text-white' : 'text-black'}`} />
                  </div>
                  <span className={`font-bold ${themeText}`}>Connect</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Groups List */}
              <div className="flex-1 overflow-y-auto py-2">
                {renderGroupsList()}
              </div>

              {/* Mobile Voice Bar */}
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

              {/* Mobile User Panel */}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <div className={`flex h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] pt-[120px] md:pt-16 ${currentVoice ? 'pb-36 md:pb-0' : ''}`}>
        {/* Left Sidebar - Groups & Channels (Desktop only) */}
        <div className={`hidden md:flex w-64 ${themeSidebar} border-r ${themeBorder} flex-col`}>
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
            {renderGroupsList()}
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
              textChannel={selectedTextChannel}
              theme={theme}
              isMGT={isMGT}
              accentColor={accentColor}
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

      {/* Mobile Voice Bar (Fixed at bottom) */}
      {currentVoice && (
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border-t ${themeBorder} safe-area-bottom`}>
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
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {/* Add Channel Modal */}
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
                <h3 className={`text-lg font-bold ${themeText}`}>Criar Canal</h3>
                <button
                  onClick={() => setShowAddChannelModal(false)}
                  className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Channel Type Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setNewChannelType('TEXT')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    newChannelType === 'TEXT'
                      ? isMGT 
                        ? 'border-tier-std bg-tier-std\/10 text-tier-std' 
                        : 'border-gold-500 bg-gold-500/10 text-gold-500'
                      : `${themeBorder} ${themeSecondary} hover:bg-white/5`
                  }`}
                >
                  <Hash className="w-5 h-5" />
                  <span className="font-medium">Texto</span>
                </button>
                <button
                  onClick={() => setNewChannelType('VOICE')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    newChannelType === 'VOICE'
                      ? isMGT 
                        ? 'border-tier-std bg-tier-std\/10 text-tier-std' 
                        : 'border-gold-500 bg-gold-500/10 text-gold-500'
                      : `${themeBorder} ${themeSecondary} hover:bg-white/5`
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="font-medium">Voz</span>
                </button>
              </div>
              
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder={newChannelType === 'TEXT' ? 'nome-do-canal' : 'Nome do canal'}
                className={`w-full px-4 py-3 rounded-xl mb-4 ${
                  theme === 'light' 
                    ? 'bg-gray-100 text-gray-900 placeholder:text-gray-500' 
                    : 'bg-zinc-800 text-white placeholder:text-gray-500'
                } border ${themeBorder} focus:outline-none focus:ring-2 ${isMGT ? 'focus:ring-tier-std' : 'focus:ring-gold-500'}`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddChannelModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl ${themeHover} ${themeSecondary} font-medium`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateChannel}
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

      {/* Members Drawer (Mobile) - starts below header */}
      <AnimatePresence>
        {showMembersDrawer && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 z-40 lg:hidden"
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

      {/* Group Settings Modal - Connect Style */}
      <AnimatePresence>
        {showGroupSettings && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowGroupSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border ${themeBorder}`}
              style={{
                background: theme === 'dark' 
                  ? `linear-gradient(180deg, ${accentColor}10 0%, transparent 30%), #18181b`
                  : undefined
              }}
            >
              {/* Header with gradient */}
              <div 
                className="h-24 relative"
                style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
              >
                <button
                  onClick={() => setShowGroupSettings(false)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Avatar overlapping header */}
              <div className="px-6 -mt-12">
                <div className="relative group inline-block">
                  {selectedGroup.avatarUrl ? (
                    <img
                      src={selectedGroup.avatarUrl}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-zinc-900"
                      alt={selectedGroup.name}
                    />
                  ) : (
                    <div 
                      className="w-24 h-24 rounded-2xl flex items-center justify-center border-4 border-zinc-900"
                      style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
                    >
                      <span className="text-3xl font-bold text-white">
                        {selectedGroup.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {uploadingAvatar ? <Loader size="sm" /> : <Camera className="w-8 h-8 text-white" />}
                  </button>
                </div>
              </div>

              <div className="p-6 pt-4">
                {/* Group Info */}
                <h2 className={`text-xl font-bold ${themeText} mb-1`}>{selectedGroup.name}</h2>
                {selectedGroup.description && (
                  <p className={`text-sm ${themeSecondary} mb-4`}>{selectedGroup.description}</p>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div 
                    className="p-3 rounded-xl text-center"
                    style={{ background: `${accentColor}15` }}
                  >
                    <p className="text-lg font-bold" style={{ color: accentColor }}>{selectedGroup.members.length}</p>
                    <p className={`text-xs ${themeSecondary}`}>Membros</p>
                  </div>
                  <div 
                    className="p-3 rounded-xl text-center"
                    style={{ background: `${accentColor}15` }}
                  >
                    <p className="text-lg font-bold" style={{ color: accentColor }}>{selectedGroup.voiceChannels.length}</p>
                    <p className={`text-xs ${themeSecondary}`}>Voz</p>
                  </div>
                  <div 
                    className="p-3 rounded-xl text-center"
                    style={{ background: `${accentColor}15` }}
                  >
                    <p className="text-lg font-bold" style={{ color: accentColor }}>{selectedGroup.textChannels?.length || 1}</p>
                    <p className={`text-xs ${themeSecondary}`}>Texto</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleOpenAddChannel(selectedGroup.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${themeHover} transition-colors`}
                  >
                    <Plus className={`w-5 h-5 ${themeSecondary}`} />
                    <span className={themeText}>Adicionar Canal</span>
                    <ChevronRight className={`w-4 h-4 ml-auto ${themeSecondary}`} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowGroupSettings(false);
                      setShowMembersDrawer(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${themeHover} transition-colors`}
                  >
                    <Users className={`w-5 h-5 ${themeSecondary}`} />
                    <span className={themeText}>Gerenciar Membros</span>
                    <ChevronRight className={`w-4 h-4 ml-auto ${themeSecondary}`} />
                  </button>
                </div>

                {/* Privacy Badge */}
                <div className={`mt-4 p-3 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-zinc-800/50'}`}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${accentColor}20` }}
                    >
                      <Radio className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${themeText}`}>
                        {selectedGroup.isPrivate ? 'Grupo Privado' : 'Grupo Público'}
                      </p>
                      <p className={`text-xs ${themeSecondary}`}>
                        {selectedGroup.membershipType === 'MGT' ? 'Exclusivo MGT' : 'Magazine'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowGroupSettings(false)}
                  className="w-full mt-4 px-4 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
                  style={{ background: accentColor }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Avatar Input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadAvatar}
        className="hidden"
      />
    </div>
  );
}
