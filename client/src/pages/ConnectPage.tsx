import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Volume2, MicOff, Menu,
  Settings, Hash, ChevronRight, ChevronDown, Radio, X,
  Camera, HeadphoneOff, Pencil, Phone, Bot, Link, Copy, UserPlus, Mail, Edit3, Check, Trash2
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
import { VoiceChannelBar, ConnectGroupChat, UserPresenceCard, GroupInviteCard, StreamViewer, AudioSettingsModal } from '../components/connect';

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
  bannerUrl?: string;
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
  const { user, theme, showToast, showError, accentColor, setActiveChatUserId } = useAuth();
  const { isStdTier } = useCommunity();
  const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;

  const [groups, setGroups] = useState<ConnectGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ConnectGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnecting, setSocketConnecting] = useState(true);
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
  
  // Banner and name editing state
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Rename channel state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameChannel, setRenameChannel] = useState<{ id: string; name: string; type: 'TEXT' | 'VOICE'; groupId: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Invite to call state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteChannelId, setInviteChannelId] = useState<string | null>(null);
  
  // User presence card state
  const [showPresenceCard, setShowPresenceCard] = useState(false);
  const [presenceUserId, setPresenceUserId] = useState<string | null>(null);
  const [presenceFallbackData, setPresenceFallbackData] = useState<{ name: string; displayName?: string; avatarUrl?: string } | undefined>(undefined);
  const [presenceAnchorPosition, setPresenceAnchorPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Audio settings state
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  
  // Bots management state
  const [showBotsModal, setShowBotsModal] = useState(false);
  
  // Invite to group state
  const [showGroupInviteModal, setShowGroupInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteTab, setInviteTab] = useState<'link' | 'friends' | 'community'>('link');
  const [inviteFriends, setInviteFriends] = useState<Array<{ id: string; name: string; displayName?: string; avatarUrl?: string; trophies: number; level: number }>>([]);
  const [inviteCommunityUsers, setInviteCommunityUsers] = useState<Array<{ id: string; name: string; displayName?: string; avatarUrl?: string; trophies: number; level: number }>>([]);
  const [inviting, setInviting] = useState(false);
  
  // Join group via link state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingJoinGroup, setPendingJoinGroup] = useState<{ id: string; name: string; avatarUrl?: string; memberCount?: number } | null>(null);
  const [joining, setJoining] = useState(false);
  
  // Mobile state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Delete group state
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  
  // Text channel state
  const [selectedTextChannel, setSelectedTextChannel] = useState<TextChannel | null>(null);
  
  // Voice state
  const [currentVoice, setCurrentVoice] = useState<CurrentVoice | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  
  // Stream viewer state
  const [showStreamViewer, setShowStreamViewer] = useState(false);
  const [streamerInfo, setStreamerInfo] = useState<Map<string, { username: string; avatarUrl?: string }>>(new Map());
  
  // Real-time voice participant state (userId -> state)
  const [voiceParticipantStates, setVoiceParticipantStates] = useState<Map<string, { isMuted: boolean; isDeafened: boolean; isStreaming: boolean }>>(new Map());

  // Socket.io hook for real-time communication
  const socket = useSocket();
  
  // WebRTC hook for voice/video (pass current channel id)
  const webrtc = useWebRTC(currentVoice?.channelId || null);
  
  // Ref for remote audio elements
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Play remote audio streams
  useEffect(() => {
    const audioElements = remoteAudioElementsRef.current;
    
    // Add new audio elements for new streams
    webrtc.remoteAudioStreams.forEach((stream, odiserId) => {
      if (!audioElements.has(odiserId)) {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.srcObject = stream;
        audioElements.set(odiserId, audio);
        console.log('[ConnectPage] Playing remote audio from:', odiserId);
      }
    });
    
    // Remove audio elements for streams that no longer exist
    audioElements.forEach((audio, odiserId) => {
      if (!webrtc.remoteAudioStreams.has(odiserId)) {
        audio.pause();
        audio.srcObject = null;
        audioElements.delete(odiserId);
        console.log('[ConnectPage] Stopped remote audio from:', odiserId);
      }
    });
    
    return () => {
      // Cleanup all audio elements on unmount
      audioElements.forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      audioElements.clear();
    };
  }, [webrtc.remoteAudioStreams]);

  // Register socket event listeners
  useEffect(() => {
    if (!socket.isConnected) {
      return;
    }
    
    // Socket connected - stop connecting state
    setSocketConnecting(false);

    socket.onVoiceUserJoined(() => {
      showToast('Usuário entrou no canal de voz');
      fetchGroups();
    });

    socket.onVoiceUserLeft(() => {
      fetchGroups();
    });

    socket.onScreenShareStarted((data: { userId: string; channelId: string }) => {
      showToast('🖥️ Alguém iniciou compartilhamento de tela! Clique para assistir.');
      // Update participant streaming state
      setVoiceParticipantStates(prev => {
        const updated = new Map(prev);
        const existing = updated.get(data.userId) || { isMuted: false, isDeafened: false, isStreaming: false };
        updated.set(data.userId, { ...existing, isStreaming: true });
        return updated;
      });
      // Find user info for the streamer
      const findUserInGroups = () => {
        for (const group of groups) {
          for (const channel of group.voiceChannels) {
            const participant = channel.participants.find(p => p.user.id === data.userId);
            if (participant) {
              return { 
                username: participant.user.displayName || participant.user.name, 
                avatarUrl: participant.user.avatarUrl 
              };
            }
          }
          const member = group.members?.find(m => m.userId === data.userId);
          if (member) {
            return { 
              username: member.user.displayName || member.user.name, 
              avatarUrl: member.user.avatarUrl 
            };
          }
        }
        return { username: 'Usuário' };
      };
      
      const info = findUserInGroups();
      setStreamerInfo(prev => new Map(prev).set(data.userId, info));
    });

    socket.onScreenShareStopped((data: { userId: string; channelId: string }) => {
      showToast('Compartilhamento de tela encerrado');
      // Update participant streaming state
      setVoiceParticipantStates(prev => {
        const updated = new Map(prev);
        const existing = updated.get(data.userId);
        if (existing) {
          updated.set(data.userId, { ...existing, isStreaming: false });
        }
        return updated;
      });
      setStreamerInfo(prev => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    // Listen for voice state changes (mute/deafen)
    socket.onVoiceStateChanged((data: { odiserId: string; isMuted?: boolean; isDeafened?: boolean; isStreaming?: boolean }) => {
      // Update local participant state
      if (data.odiserId) {
        setVoiceParticipantStates(prev => {
          const updated = new Map(prev);
          const existing = updated.get(data.odiserId) || { isMuted: false, isDeafened: false, isStreaming: false };
          updated.set(data.odiserId, {
            isMuted: data.isMuted ?? existing.isMuted,
            isDeafened: data.isDeafened ?? existing.isDeafened,
            isStreaming: data.isStreaming ?? existing.isStreaming,
          });
          return updated;
        });
      }
      // Also refresh groups for member list updates
      fetchGroups(false);
    });
  }, [socket.isConnected]);

  // Timeout for socket connection - show UI after 5 seconds even if not connected
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSocketConnecting(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeSidebar = theme === 'light' ? 'bg-gray-100' : 'bg-zinc-950';
  const themeHover = theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-white/5';

  useEffect(() => {
    fetchGroups();
    fetchCurrentVoice();
  }, []);

  // Re-establish voice connection after page refresh
  useEffect(() => {
    const rejoinVoiceChannel = async () => {
      if (currentVoice && socket.isConnected && user && !webrtc.isAudioEnabled) {
        // Rejoin socket room
        socket.joinVoice(currentVoice.channelId, {
          odiserId: user.id,
          name: user.displayName || user.name,
          avatarUrl: user.avatarUrl,
          isMuted: isMuted,
          isDeafened: isDeafened,
          isSpeaking: false,
          isStreaming: webrtc.isScreenSharing,
        });
        
        // Restart audio capture (user permission will be requested)
        if (!isMuted && !isDeafened) {
          await webrtc.startAudio();
        }
      }
    };
    
    rejoinVoiceChannel();
  }, [currentVoice, socket.isConnected, user]);

  useEffect(() => {
    if (groupId && groups.length > 0) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroup(group);
        setExpandedGroups(prev => new Set([...prev, group.id]));
      } else {
        // Group not in user's list - check if it's a valid group they can join
        checkInviteGroup(groupId);
      }
    }
  }, [groupId, groups]);

  // Check if a group exists for joining via invite link
  const checkInviteGroup = async (gId: string) => {
    try {
      const response = await api.get(`/groups/${gId}`);
      if (response.data) {
        setPendingJoinGroup({
          id: response.data.id,
          name: response.data.name,
          avatarUrl: response.data.avatarUrl,
          memberCount: response.data.members?.length || 0
        });
        setShowJoinModal(true);
      }
    } catch (error: any) {
      // Group doesn't exist or user doesn't have access
      console.error('Group not found:', error);
      showError('Grupo não encontrado ou você não tem acesso');
      navigate('/connect');
    }
  };

  // Join a group via invite link
  const handleJoinGroup = async () => {
    if (!pendingJoinGroup) return;
    setJoining(true);
    try {
      await api.post(`/groups/${pendingJoinGroup.id}/join`);
      showToast('✅ Você entrou no grupo!');
      setShowJoinModal(false);
      setPendingJoinGroup(null);
      // Refresh groups list
      await fetchGroups(false);
      // Navigate to the group
      navigate(`/connect/${pendingJoinGroup.id}`);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao entrar no grupo');
    } finally {
      setJoining(false);
    }
  };

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
      
      // Update local participant state immediately for instant UI feedback
      if (user) {
        setVoiceParticipantStates(prev => {
          const updated = new Map(prev);
          const existing = updated.get(user.id) || { isMuted: false, isDeafened: false, isStreaming: false };
          updated.set(user.id, { ...existing, isMuted: newMuted });
          return updated;
        });
      }
      
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
      
      // Update local participant state immediately for instant UI feedback
      if (user) {
        setVoiceParticipantStates(prev => {
          const updated = new Map(prev);
          const existing = updated.get(user.id) || { isMuted: false, isDeafened: false, isStreaming: false };
          updated.set(user.id, { 
            ...existing, 
            isDeafened: newDeafened, 
            isMuted: newDeafened ? true : existing.isMuted 
          });
          return updated;
        });
      }
      
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
        // Update local streaming state
        if (user) {
          setVoiceParticipantStates(prev => {
            const updated = new Map(prev);
            const existing = updated.get(user.id) || { isMuted: false, isDeafened: false, isStreaming: false };
            updated.set(user.id, { ...existing, isStreaming: false });
            return updated;
          });
        }
        showToast('Compartilhamento de tela encerrado');
      } else {
        const success = await webrtc.startScreenShare();
        if (success && currentVoice) {
          socket.startScreenShare(currentVoice.channelId);
          // Update local streaming state
          if (user) {
            setVoiceParticipantStates(prev => {
              const updated = new Map(prev);
              const existing = updated.get(user.id) || { isMuted: false, isDeafened: false, isStreaming: false };
              updated.set(user.id, { ...existing, isStreaming: true });
              return updated;
            });
          }
          showToast('Compartilhamento de tela iniciado');
        }
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
          maxUsers: 25, // Default max users - can be edited later
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

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroup) return;

    try {
      setUploadingBanner(true);
      const formData = new FormData();
      formData.append('banner', file);

      const response = await api.patch(`/connect/groups/${selectedGroup.id}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update local state
      setSelectedGroup({ ...selectedGroup, bannerUrl: response.data.bannerUrl });
      setGroups(groups.map(g => 
        g.id === selectedGroup.id ? { ...g, bannerUrl: response.data.bannerUrl } : g
      ));
      showToast('Banner do grupo atualizado!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao atualizar banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || !selectedGroup) return;

    try {
      const response = await api.patch(`/connect/groups/${selectedGroup.id}`, {
        name: newGroupName.trim()
      });

      // Update local state
      setSelectedGroup({ ...selectedGroup, name: response.data.name });
      setGroups(groups.map(g => 
        g.id === selectedGroup.id ? { ...g, name: response.data.name } : g
      ));
      setEditingGroupName(false);
      showToast('Nome do grupo atualizado!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao atualizar nome');
    }
  };

  // Rename channel
  const handleOpenRename = (channel: { id: string; name: string }, type: 'TEXT' | 'VOICE', groupId: string) => {
    setRenameChannel({ id: channel.id, name: channel.name, type, groupId });
    setRenameValue(channel.name);
    setShowRenameModal(true);
  };

  const handleRenameChannel = async () => {
    if (!renameChannel || !renameValue.trim()) return;
    
    try {
      const endpoint = renameChannel.type === 'VOICE' 
        ? `/connect/groups/${renameChannel.groupId}/voice/${renameChannel.id}`
        : `/connect/groups/${renameChannel.groupId}/text/${renameChannel.id}`;
      
      await api.patch(endpoint, { name: renameValue.trim() });
      showToast('Canal renomeado!');
      setShowRenameModal(false);
      setRenameChannel(null);
      fetchGroups(false);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao renomear canal');
    }
  };

  // Invite to call - prefixed with underscore as it's prepared for future use
  const _handleOpenInvite = (channelId: string) => {
    setInviteChannelId(channelId);
    setShowInviteModal(true);
  };
  void _handleOpenInvite; // Prevent unused warning

  const handleInviteToCall = async (targetUserId: string) => {
    if (!currentVoice || !inviteChannelId) return;
    
    try {
      await api.post('/notifications/call-invite', {
        targetUserId,
        channelId: inviteChannelId,
        groupId: selectedGroup?.id,
        channelName: currentVoice.channel.name,
        groupName: selectedGroup?.name,
      });
      showToast('Convite enviado!');
      setShowInviteModal(false);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao enviar convite');
    }
  };

  // Open invite modal for group
  const handleOpenInviteModal = async () => {
    if (!selectedGroup) return;
    setShowGroupInviteModal(true);
    setInviteLoading(true);
    setInviteCopied(false);
    setInviteTab('link');
    
    try {
      // Generate invite link and fetch friends/community in parallel
      const [inviteRes, friendsRes, communityRes] = await Promise.all([
        api.post(`/connect/groups/${selectedGroup.id}/invite`).catch(() => null),
        api.get('/social/friends').catch(() => ({ data: [] })),
        api.get('/users?limit=100').catch(() => ({ data: [] }))
      ]);
      
      // Set invite link
      if (inviteRes?.data) {
        setInviteLink(inviteRes.data.inviteLink || `${window.location.origin}/connect/join/${inviteRes.data.inviteCode}`);
      } else {
        setInviteLink(`${window.location.origin}/connect/${selectedGroup.id}`);
      }
      
      // Set friends (exclude members already in group)
      const memberIds = new Set(selectedGroup.members?.map(m => m.userId) || []);
      const friendsData = Array.isArray(friendsRes.data) ? friendsRes.data : (friendsRes.data.friends || friendsRes.data || []);
      const friendsList = friendsData
        .filter((f: any) => !memberIds.has(f.id) && f.id !== user?.id)
        .map((f: any) => ({
          id: f.id,
          name: f.name,
          displayName: f.displayName,
          avatarUrl: f.avatarUrl,
          trophies: f.trophies || 0,
          level: f.level || 1
        }));
      setInviteFriends(friendsList);
      
      // Set community users (exclude members and friends)
      const friendIds = new Set(friendsList.map((f: any) => f.id));
      const communityData = Array.isArray(communityRes.data) ? communityRes.data : (communityRes.data.users || communityRes.data || []);
      const communityList = communityData
        .filter((u: any) => !memberIds.has(u.id) && !friendIds.has(u.id) && u.id !== user?.id)
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          trophies: u.trophies || 0,
          level: u.level || 1
        }));
      setInviteCommunityUsers(communityList);
    } catch (error: any) {
      // Fallback to direct link
      setInviteLink(`${window.location.origin}/connect/${selectedGroup.id}`);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteMember = async (userId: string) => {
    if (!selectedGroup || inviting) return;
    setInviting(true);
    try {
      await api.post(`/connect/groups/${selectedGroup.id}/invite`, { userId });
      showToast('Convite enviado!');
      // Remove user from lists
      setInviteFriends(prev => prev.filter(f => f.id !== userId));
      setInviteCommunityUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      showToast('Link copiado!');
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || deletingGroup) return;
    setDeletingGroup(true);
    try {
      await api.delete(`/groups/${selectedGroup.id}`);
      showToast('Grupo deletado com sucesso!');
      setShowDeleteGroupConfirm(false);
      setShowGroupSettings(false);
      setSelectedGroup(null);
      // Refresh groups list
      fetchGroups();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao deletar grupo');
    } finally {
      setDeletingGroup(false);
    }
  };

  // Open user presence card
  const handleOpenPresenceCard = (
    userId: string, 
    memberData?: { name: string; displayName?: string; avatarUrl?: string },
    event?: React.MouseEvent
  ) => {
    setPresenceUserId(userId);
    setPresenceFallbackData(memberData);
    // Set anchor position for desktop positioning
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setPresenceAnchorPosition({ x: rect.right, y: rect.top });
    } else {
      setPresenceAnchorPosition(null);
    }
    setShowPresenceCard(true);
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
                  <div key={channel.id} className="group/channel flex items-center">
                    <button
                      onClick={() => handleSelectTextChannel(channel, group)}
                      className={`flex-1 flex items-center gap-2 px-4 py-1.5 ${themeHover} rounded-md transition-colors ${
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
                    {/* Rename button for admins */}
                    {group.members.find(m => m.userId === user?.id)?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenRename(channel, 'TEXT', group.id); }}
                        className={`p-1.5 rounded ${themeHover} ${themeSecondary} opacity-0 group-hover/channel:opacity-100 transition-opacity`}
                        title="Renomear canal"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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
                <div key={channel.id} className="group/vchannel">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleJoinVoice(group.id, channel.id)}
                      disabled={channel.isLocked}
                      className={`flex-1 flex items-center gap-2 px-4 py-1.5 ${themeHover} rounded-md transition-colors ${themeSecondary} ${
                        currentVoice?.channelId === channel.id ? 'bg-green-500/10 text-green-500' : ''
                      } ${channel.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="text-sm flex-1 text-left">{channel.name}</span>
                      <span className="text-xs opacity-60">
                        {channel.participants.length}/{channel.maxUsers}
                      </span>
                    </button>
                    {/* Rename button for admins */}
                    {group.members.find(m => m.userId === user?.id)?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenRename(channel, 'VOICE', group.id); }}
                        className={`p-1.5 rounded ${themeHover} ${themeSecondary} opacity-0 group-hover/vchannel:opacity-100 transition-opacity`}
                        title="Renomear canal"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* Voice Participants */}
                  {channel.participants.length > 0 && (
                    <div className="pl-8 py-1 space-y-1">
                      {channel.participants.map(participant => {
                        // Get real-time state from voiceParticipantStates
                        const realTimeState = voiceParticipantStates.get(participant.user.id);
                        const effectiveMuted = realTimeState?.isMuted ?? participant.isMuted;
                        const effectiveDeafened = realTimeState?.isDeafened ?? participant.isDeafened;
                        const effectiveStreaming = realTimeState?.isStreaming ?? participant.isStreaming;
                        
                        return (
                        <div 
                          key={participant.id}
                          className={`group/participant flex items-center gap-2 px-2 py-1 rounded ${themeSecondary}`}
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
                          {effectiveStreaming && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                // Add streamer info if not already present
                                if (!streamerInfo.has(participant.user.id)) {
                                  setStreamerInfo(prev => new Map(prev).set(participant.user.id, {
                                    username: participant.user.displayName || participant.user.name,
                                    avatarUrl: participant.user.avatarUrl
                                  }));
                                }
                                setShowStreamViewer(true); 
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1"
                              title="Assistir transmissão"
                            >
                              <Radio className="w-2.5 h-2.5 animate-pulse" />
                              AO VIVO
                            </button>
                          )}
                          {/* Mute icon */}
                          {effectiveMuted && <MicOff className="w-3 h-3 text-red-400" />}
                          {/* Deafen icon */}
                          {effectiveDeafened && <HeadphoneOff className="w-3 h-3 text-red-400" />}
                          {/* Invite to call button (only for other users when in voice) */}
                          {currentVoice && participant.user.id !== user?.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleInviteToCall(participant.user.id); }}
                              className="p-1 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 opacity-0 group-hover/participant:opacity-100 transition-opacity"
                              title="Chamar para call"
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                      })}
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

  if (loading || socketConnecting) {
    return (
      <div className="min-h-screen text-white font-sans relative">
        <LuxuriousBackground />
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          {/* Premium Connect Loading - uses user's accent color */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
            >
              <Radio className="w-12 h-12 text-white" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl border-2"
              style={{ borderColor: `${accentColor}80` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: accentColor }}>Rovex Connect</h2>
            <p className="text-gray-400">Carregando...</p>
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
                  hasActiveStreams={webrtc.remoteScreenStreams.size > 0}
                  onToggleMute={handleToggleMute}
                  onToggleDeafen={handleToggleDeafen}
                  onToggleScreenShare={handleToggleScreenShare}
                  onWatchStream={() => setShowStreamViewer(true)}
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
                <button 
                  onClick={() => setShowAudioSettings(true)}
                  className={`p-2 ${themeHover} rounded-lg ${themeSecondary}`}
                  title="Configurações de áudio"
                >
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
              hasActiveStreams={webrtc.remoteScreenStreams.size > 0}
              onToggleMute={handleToggleMute}
              onToggleDeafen={handleToggleDeafen}
              onToggleScreenShare={handleToggleScreenShare}
              onWatchStream={() => setShowStreamViewer(true)}
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
            <button 
              onClick={() => setShowAudioSettings(true)}
              className={`p-2 ${themeHover} rounded-lg ${themeSecondary}`}
              title="Configurações de áudio"
            >
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
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              {/* Group Invites */}
              <div className="w-full max-w-md mb-6">
                <GroupInviteCard 
                  accentColor={accentColor}
                  onInviteAccepted={() => fetchGroups()}
                />
              </div>
              
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
                  onClick={(e) => handleOpenPresenceCard(member.userId, { name: member.user.name, displayName: member.user.displayName, avatarUrl: member.user.avatarUrl }, e)}
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
                    onClick={(e) => handleOpenPresenceCard(member.userId, { name: member.user.name, displayName: member.user.displayName, avatarUrl: member.user.avatarUrl }, e)}
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
            hasActiveStreams={webrtc.remoteScreenStreams.size > 0}
            onToggleMute={handleToggleMute}
            onToggleDeafen={handleToggleDeafen}
            onToggleScreenShare={handleToggleScreenShare}
            onWatchStream={() => setShowStreamViewer(true)}
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
            className="fixed inset-0 z-[60] lg:hidden"
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowMembersDrawer(false);
                      handleOpenInviteModal();
                    }}
                    className={`p-2 rounded-lg ${themeHover}`}
                    style={{ color: accentColor }}
                    title="Convidar pessoas"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowMembersDrawer(false)}
                    className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${themeSecondary}`}>
                Online — {getOnlineMembers(selectedGroup.members).length}
              </h4>
              <div className="space-y-2 mb-6">
                {getOnlineMembers(selectedGroup.members).map(member => (
                  <div 
                    key={member.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${themeHover} cursor-pointer`}
                    onClick={(e) => { handleOpenPresenceCard(member.userId, { name: member.user.name, displayName: member.user.displayName, avatarUrl: member.user.avatarUrl }, e); setShowMembersDrawer(false); }}
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
                      onClick={(e) => { handleOpenPresenceCard(member.userId, { name: member.user.name, displayName: member.user.displayName, avatarUrl: member.user.avatarUrl }, e); setShowMembersDrawer(false); }}
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
              {/* Header with gradient - clickable for banner change */}
              <div 
                className="h-24 relative group cursor-pointer overflow-hidden"
                style={{ 
                  background: selectedGroup.bannerUrl 
                    ? `url(${selectedGroup.bannerUrl}) center/cover`
                    : `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` 
                }}
                onClick={() => bannerInputRef.current?.click()}
              >
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingBanner ? <Loader size="sm" /> : <Camera className="w-8 h-8 text-white" />}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowGroupSettings(false); }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors z-10"
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
                {/* Group Info - Editable Name */}
                {editingGroupName ? (
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-zinc-800'} ${themeText} border ${themeBorder} text-lg font-bold`}
                      placeholder="Nome do grupo"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateGroupName}
                      className="p-2 rounded-lg text-white"
                      style={{ background: accentColor }}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditingGroupName(false)}
                      className={`p-2 rounded-lg ${themeHover}`}
                    >
                      <X className="w-5 h-5" style={{ color: accentColor }} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-xl font-bold ${themeText}`}>{selectedGroup.name}</h2>
                    <button
                      onClick={() => { setNewGroupName(selectedGroup.name); setEditingGroupName(true); }}
                      className={`p-1 rounded ${themeHover}`}
                    >
                      <Edit3 className="w-4 h-4" style={{ color: accentColor }} />
                    </button>
                  </div>
                )}
                {selectedGroup.description && !editingGroupName && (
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

                  <button
                    onClick={() => {
                      setShowGroupSettings(false);
                      setShowBotsModal(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${themeHover} transition-colors`}
                  >
                    <Bot className={`w-5 h-5 ${themeSecondary}`} />
                    <span className={themeText}>Bots</span>
                    <ChevronRight className={`w-4 h-4 ml-auto ${themeSecondary}`} />
                  </button>

                  <button
                    onClick={() => {
                      setShowGroupSettings(false);
                      handleOpenInviteModal();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${themeHover} transition-colors`}
                  >
                    <UserPlus className={`w-5 h-5 ${themeSecondary}`} />
                    <span className={themeText}>Convidar Membros</span>
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

                {/* Delete Group Button - Only for creator */}
                {selectedGroup.creator.id === user?.id && (
                  <button
                    onClick={() => setShowDeleteGroupConfirm(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                    Deletar Grupo
                  </button>
                )}

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

      {/* Delete Group Confirmation Modal */}
      <AnimatePresence>
        {showDeleteGroupConfirm && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteGroupConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl p-6 ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} shadow-xl`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${themeText}`}>Deletar Grupo</h3>
                  <p className={`text-sm ${themeSecondary}`}>Esta ação não pode ser desfeita</p>
                </div>
              </div>
              
              <p className={`text-sm ${themeSecondary} mb-6`}>
                Tem certeza que deseja deletar o grupo <strong className={themeText}>{selectedGroup.name}</strong>? 
                Todos os canais, mensagens e membros serão removidos permanentemente.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteGroupConfirm(false)}
                  className={`flex-1 py-3 rounded-xl font-medium ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={deletingGroup}
                  className="flex-1 py-3 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingGroup ? <Loader size="sm" /> : 'Deletar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Channel Modal */}
      <AnimatePresence>
        {showRenameModal && renameChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowRenameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl p-6 ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border ${themeBorder}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${themeText}`}>Renomear Canal</h3>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                {renameChannel.type === 'TEXT' ? (
                  <Hash className="w-5 h-5" style={{ color: accentColor }} />
                ) : (
                  <Volume2 className="w-5 h-5" style={{ color: accentColor }} />
                )}
                <span className={`text-sm ${themeSecondary}`}>
                  Canal de {renameChannel.type === 'TEXT' ? 'texto' : 'voz'}
                </span>
              </div>
              
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Nome do canal"
                className={`w-full px-4 py-3 rounded-xl mb-4 ${
                  theme === 'light' 
                    ? 'bg-gray-100 text-gray-900 placeholder:text-gray-500' 
                    : 'bg-zinc-800 text-white placeholder:text-gray-500'
                } border ${themeBorder} focus:outline-none focus:ring-2`}
                style={{ '--tw-ring-color': accentColor } as any}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRenameChannel()}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl ${themeHover} ${themeSecondary} font-medium`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRenameChannel}
                  disabled={!renameValue.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: accentColor }}
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite to Call Modal */}
      <AnimatePresence>
        {showInviteModal && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl p-6 ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border ${themeBorder}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${themeText}`}>Chamar para Call</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className={`text-sm ${themeSecondary} mb-4`}>
                Selecione um membro para convidar para a call:
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedGroup.members
                  .filter(m => m.userId !== user?.id && m.user.isOnline)
                  .map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleInviteToCall(member.userId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl ${themeHover} transition-colors`}
                    >
                      <img
                        src={member.user.avatarUrl || '/assets/default-avatar.png'}
                        className="w-10 h-10 rounded-full"
                        alt=""
                      />
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${themeText}`}>
                          {member.user.displayName || member.user.name}
                        </p>
                        <p className="text-xs text-green-500">Online</p>
                      </div>
                      <Phone className="w-5 h-5 text-green-500" />
                    </button>
                  ))}
                
                {selectedGroup.members.filter(m => m.userId !== user?.id && m.user.isOnline).length === 0 && (
                  <p className={`text-center py-4 ${themeSecondary}`}>
                    Nenhum membro online disponível
                  </p>
                )}
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

      {/* Hidden Banner Input */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadBanner}
        className="hidden"
      />

      {/* Bots Management Modal */}
      <AnimatePresence>
        {showBotsModal && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowBotsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border ${themeBorder}`}
            >
              {/* Header */}
              <div className={`p-4 border-b ${themeBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${accentColor}20` }}
                  >
                    <Bot className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${themeText}`}>Bots</h3>
                    <p className={`text-xs ${themeSecondary}`}>{selectedGroup.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBotsModal(false)}
                  className={`p-2 rounded-lg ${themeHover}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                {/* Info Card */}
                <div 
                  className="p-4 rounded-xl mb-4"
                  style={{ background: `${accentColor}10` }}
                >
                  <div className="flex items-start gap-3">
                    <Bot className="w-8 h-8 mt-1 flex-shrink-0" style={{ color: accentColor }} />
                    <div>
                      <h4 className={`font-semibold ${themeText} mb-1`}>Automatize seu grupo</h4>
                      <p className={`text-sm ${themeSecondary}`}>
                        Adicione bots para moderar, reproduzir música, dar boas-vindas a novos membros e muito mais.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bot Categories */}
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${themeSecondary}`}>
                  Bots Populares
                </h4>
                
                <div className="space-y-2">
                  {/* Music Bot */}
                  <div className={`p-3 rounded-xl ${themeHover} flex items-center gap-3 cursor-pointer`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${themeText}`}>Melody Bot</p>
                      <p className={`text-xs ${themeSecondary} truncate`}>Reproduza músicas nos canais de voz</p>
                    </div>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Moderation Bot */}
                  <div className={`p-3 rounded-xl ${themeHover} flex items-center gap-3 cursor-pointer`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${themeText}`}>Guardian Bot</p>
                      <p className={`text-xs ${themeSecondary} truncate`}>Moderação automática e anti-spam</p>
                    </div>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Welcome Bot */}
                  <div className={`p-3 rounded-xl ${themeHover} flex items-center gap-3 cursor-pointer`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${themeText}`}>Greeter Bot</p>
                      <p className={`text-xs ${themeSecondary} truncate`}>Boas-vindas personalizadas</p>
                    </div>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* AI Bot */}
                  <div className={`p-3 rounded-xl ${themeHover} flex items-center gap-3 cursor-pointer`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${themeText}`}>AI Assistant</p>
                      <p className={`text-xs ${themeSecondary} truncate`}>Chat com IA para seu grupo</p>
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400"
                    >
                      Em breve
                    </div>
                  </div>
                </div>

                {/* Create Custom Bot */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    className="w-full p-4 rounded-xl border-2 border-dashed text-center transition-all hover:border-solid"
                    style={{ borderColor: `${accentColor}40`, color: accentColor }}
                  >
                    <Plus className="w-6 h-6 mx-auto mb-2" style={{ color: accentColor }} />
                    <span className="font-medium">Criar Bot Personalizado</span>
                    <p className={`text-xs ${themeSecondary} mt-1`}>
                      Desenvolva seu próprio bot com nossa API
                    </p>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Invite Modal */}
      <AnimatePresence>
        {showGroupInviteModal && selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowGroupInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border ${themeBorder}`}
            >
              {/* Header */}
              <div className="p-4 border-b" style={{ borderColor: theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <UserPlus className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <h2 className={`font-bold ${themeText}`}>Convidar para {selectedGroup.name}</h2>
                      <p className={`text-xs ${themeSecondary}`}>Compartilhe o link ou convide diretamente</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGroupInviteModal(false)}
                    className={`p-2 rounded-lg ${themeHover} ${themeSecondary}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setInviteTab('link')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      inviteTab === 'link'
                        ? 'text-white'
                        : `${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400'} hover:opacity-80`
                    }`}
                    style={inviteTab === 'link' ? { backgroundColor: accentColor } : {}}
                  >
                    Link
                  </button>
                  <button
                    onClick={() => setInviteTab('friends')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      inviteTab === 'friends'
                        ? 'text-white'
                        : `${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400'} hover:opacity-80`
                    }`}
                    style={inviteTab === 'friends' ? { backgroundColor: accentColor } : {}}
                  >
                    Amigos ({inviteFriends.length})
                  </button>
                  <button
                    onClick={() => setInviteTab('community')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      inviteTab === 'community'
                        ? 'text-white'
                        : `${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400'} hover:opacity-80`
                    }`}
                    style={inviteTab === 'community' ? { backgroundColor: accentColor } : {}}
                  >
                    Comunidade ({inviteCommunityUsers.length})
                  </button>
                </div>

                {/* Tab Content */}
                {inviteTab === 'link' ? (
                  <>
                    {/* Invite Link */}
                    <div>
                      <label className={`text-sm font-medium ${themeText} mb-2 block`}>
                        Link de convite
                      </label>
                      <div className="flex gap-2">
                        <div 
                          className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-zinc-800'} border ${themeBorder} min-w-0 overflow-hidden`}
                        >
                          <Link className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                          {inviteLoading ? (
                            <span className={themeSecondary}>Gerando link...</span>
                          ) : (
                            <span className={`${themeText} text-sm truncate max-w-full`}>
                              {inviteLink || 'Erro ao gerar link'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleCopyInviteLink}
                          disabled={inviteLoading || !inviteLink}
                          className={`px-4 py-2.5 rounded-xl font-medium text-white transition-all flex items-center gap-2 ${inviteLoading ? 'opacity-50' : 'hover:opacity-90'}`}
                          style={{ backgroundColor: accentColor }}
                        >
                          {inviteCopied ? (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Or divider */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-1 h-px ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`} />
                      <span className={`text-xs ${themeSecondary}`}>ou</span>
                      <div className={`flex-1 h-px ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`} />
                    </div>

                    {/* Share options */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          if (inviteLink) {
                            window.open(`https://wa.me/?text=${encodeURIComponent(`Junte-se ao meu grupo no Rovex Connect! ${inviteLink}`)}`, '_blank');
                          }
                        }}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl ${themeHover} border ${themeBorder} transition-all`}
                      >
                        <span className="text-green-500 text-lg">📱</span>
                        <span className={themeText}>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => {
                          if (inviteLink) {
                            window.open(`mailto:?subject=Convite para ${selectedGroup.name}&body=${encodeURIComponent(`Junte-se ao meu grupo no Rovex Connect! ${inviteLink}`)}`, '_blank');
                          }
                        }}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl ${themeHover} border ${themeBorder} transition-all`}
                      >
                        <Mail className="w-5 h-5" style={{ color: accentColor }} />
                        <span className={themeText}>Email</span>
                      </button>
                    </div>

                    {/* Tip */}
                    <div 
                      className="p-3 rounded-xl text-sm"
                      style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
                    >
                      💡 Quando alguém acessar o link, receberá um convite para entrar no grupo.
                    </div>
                  </>
                ) : inviteTab === 'friends' ? (
                  <div className="max-h-64 overflow-y-auto">
                    {inviteFriends.length === 0 ? (
                      <p className={`${themeSecondary} text-center py-8`}>
                        Nenhum amigo disponível para convidar
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {inviteFriends.map((friend) => (
                          <div key={friend.id} className={`flex items-center gap-3 p-3 rounded-lg ${themeHover} transition-colors`}>
                            <img
                              src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}`}
                              alt={friend.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${themeText} truncate`}>
                                {friend.displayName || friend.name}
                              </p>
                              <p className={`text-xs ${themeSecondary}`}>{friend.trophies} Troféus • Nível {friend.level}</p>
                            </div>
                            <button
                              onClick={() => handleInviteMember(friend.id)}
                              disabled={inviting}
                              className="px-4 py-2 rounded-lg text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: accentColor }}
                            >
                              Convidar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {inviteCommunityUsers.length === 0 ? (
                      <p className={`${themeSecondary} text-center py-8`}>
                        Nenhum usuário disponível para convidar
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {inviteCommunityUsers.map((u) => (
                          <div key={u.id} className={`flex items-center gap-3 p-3 rounded-lg ${themeHover} transition-colors`}>
                            <img
                              src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                              alt={u.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${themeText} truncate`}>
                                {u.displayName || u.name}
                              </p>
                              <p className={`text-xs ${themeSecondary}`}>{u.trophies || 0} Troféus • Nível {u.level || 1}</p>
                            </div>
                            <button
                              onClick={() => handleInviteMember(u.id)}
                              disabled={inviting}
                              className="px-4 py-2 rounded-lg text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: accentColor }}
                            >
                              Convidar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Group Modal (for invite links) */}
      <AnimatePresence>
        {showJoinModal && pendingJoinGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => {
              setShowJoinModal(false);
              setPendingJoinGroup(null);
              navigate('/connect');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border ${themeBorder}`}
            >
              {/* Group Preview */}
              <div className="p-6 text-center">
                {/* Avatar */}
                <div 
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  {pendingJoinGroup.avatarUrl ? (
                    <img src={pendingJoinGroup.avatarUrl} alt={pendingJoinGroup.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-10 h-10" style={{ color: accentColor }} />
                  )}
                </div>

                {/* Group Name */}
                <h2 className={`text-xl font-bold ${themeText} mb-2`}>{pendingJoinGroup.name}</h2>
                <p className={`text-sm ${themeSecondary} mb-6`}>
                  {pendingJoinGroup.memberCount || 0} membros
                </p>

                {/* Info text */}
                <p className={`text-sm ${themeSecondary} mb-6`}>
                  Você foi convidado para este grupo. Deseja entrar?
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowJoinModal(false);
                      setPendingJoinGroup(null);
                      navigate('/connect');
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium border ${themeBorder} ${themeHover} ${themeText} transition-all`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleJoinGroup}
                    disabled={joining}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    {joining ? (
                      <>Entrando...</>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Entrar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Presence Card */}
      <UserPresenceCard
        userId={presenceUserId || ''}
        isOpen={showPresenceCard}
        onClose={() => setShowPresenceCard(false)}
        onStartChat={(userId) => {
          setShowPresenceCard(false);
          setActiveChatUserId(userId);
        }}
        accentColor={accentColor}
        fallbackData={presenceFallbackData}
        anchorPosition={presenceAnchorPosition}
      />

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
        accentColor={accentColor}
      />

      {/* Stream Viewer */}
      <StreamViewer
        streams={webrtc.remoteScreenStreams}
        streamerInfo={streamerInfo}
        isOpen={showStreamViewer}
        onClose={() => setShowStreamViewer(false)}
      />
    </div>
  );
}
