import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Image, ArrowLeft, Users, Settings, LogOut,
  Edit3, Volume2, VolumeX, Palette, Eye, EyeOff, X, Edit, Trash2,
  Reply, Smile
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import GroupSettingsModal from '../components/GroupSettingsModal';
import Loader from '../components/Loader';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  backgroundId?: string;
  membershipType: 'MAGAZINE' | 'MGT';
  isPrivate: boolean;
  nsfw: boolean;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  members: GroupMember[];
}

interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  nickname?: string;
  isMuted: boolean;
  user: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string;
    displayName?: string;
  };
}

interface ReplyTo {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    displayName?: string;
  };
}

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'ANNOUNCEMENT';
  imageUrl?: string;
  isNSFW: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
  };
  senderNickname?: string;
  replyTo?: ReplyTo | null;
  reactions?: MessageReaction[];
}

interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export default function GroupChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, theme, showToast, showError } = useAuth();
  const { isStdTier } = useCommunity();
  const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showNSFW, setShowNSFW] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showEditAvatarModal, setShowEditAvatarModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [inviting, setInviting] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [showImageConfirm, setShowImageConfirm] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const accentColor = isMGT ? 'emerald-500' : 'gold-500';
  const accentBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';

  const myMember = group?.members.find(m => m.userId === user?.id);
  const isAdmin = myMember?.role === 'ADMIN';
  const isCreator = group?.creator?.id === user?.id;

  const fetchFriends = async () => {
    try {
      const response = await api.get('/social/friends');
      // Filter out users already in the group
      const currentMemberIds = group?.members.map(m => m.userId) || [];
      const availableFriends = response.data.filter((friend: any) =>
        !currentMemberIds.includes(friend.id)
      );
      setFriends(availableFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleInviteMember = async (friendId: string) => {
    if (!id) return;

    setInviting(true);
    try {
      await api.post(`/groups/${id}/invite`, { invitedUserId: friendId });
      showToast('✅ Convite enviado com sucesso!');
      setShowInviteModal(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erro ao enviar convite';
      // Não logar como erro se for uma resposta esperada do servidor
      if (error.response?.status !== 400) {
        console.error('Error inviting member:', error);
      }
      showToast(`❌ ${errorMessage}`);
    } finally {
      setInviting(false);
    }
  };

  const openInviteModal = () => {
    fetchFriends();
    setShowInviteModal(true);
  };

  // State to track the last message timestamp for delta updates
  const lastMessageDateRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset state when group changes
    setMessages([]);
    lastMessageDateRef.current = null;
    fetchInitialMessages();

    // Poll for new messages (delta updates) every 5 seconds
    const interval = setInterval(fetchNewMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchInitialMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groups/${id}/messages?limit=50`);
      const initialMessages = response.data;
      setMessages(initialMessages);

      if (initialMessages.length > 0) {
        lastMessageDateRef.current = initialMessages[initialMessages.length - 1].createdAt;
      }
    } catch (error) {
      console.error('Error fetching initial messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewMessages = async () => {
    if (!id) return;
    try {
      const url = lastMessageDateRef.current
        ? `/groups/${id}/messages?after=${lastMessageDateRef.current}`
        : `/groups/${id}/messages?limit=50`;

      const response = await api.get(url);
      const newMessages = response.data;

      if (newMessages.length > 0) {
        setMessages(prev => {
          // Prevent duplicates by checking IDs
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter((m: Message) => !existingIds.has(m.id));

          if (uniqueNewMessages.length === 0) return prev;

          return [...prev, ...uniqueNewMessages];
        });

        lastMessageDateRef.current = newMessages[newMessages.length - 1].createdAt;
      }
    } catch (error) {
      // Sliently fail for background polling to avoid console spam
    }
  };

  // Fetch group data on mount or ID change
  useEffect(() => {
    fetchGroup();
  }, [id]);

  // Poll for typing users (every 3s instead of 2s)
  useEffect(() => {
    if (!id) return;
    const fetchTypingUsers = async () => {
      try {
        const response = await api.get(`/groups/${id}/typing`);
        setTypingUsers(response.data);
      } catch (error) { /* Silent */ }
    };
    fetchTypingUsers();
    const typingInterval = setInterval(fetchTypingUsers, 3000);
    return () => clearInterval(typingInterval);
  }, [id]);

  // Re-add sendTypingIndicator and handleMessageChange that were removed in the bulk replacement
  const sendTypingIndicator = useCallback(async () => {
    if (!id) return;
    try { await api.post(`/groups/${id}/typing`); } catch (error) { /* Silent */ }
  }, [id]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentionSuggestions(true);
      setMentionFilter(mentionMatch[1].toLowerCase());
    } else {
      setShowMentionSuggestions(false);
      setMentionFilter('');
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(sendTypingIndicator, 500);
  };

  // Re-add mention logic
  const filteredMentionMembers = group?.members.filter(m => {
    const name = (m.user.displayName || m.user.name).toLowerCase();
    return name.includes(mentionFilter) && m.userId !== user?.id;
  }) || [];

  const insertMention = (member: GroupMember) => {
    if (!inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart || 0;
    const textBeforeCursor = messageText.substring(0, cursorPos);
    const textAfterCursor = messageText.substring(cursorPos);
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    if (mentionStart === -1) return;

    const newText = textBeforeCursor.substring(0, mentionStart) +
      `@${member.user.displayName || member.user.name} ` +
      textAfterCursor;
    setMessageText(newText);
    setShowMentionSuggestions(false);
    setMentionFilter('');
    inputRef.current.focus();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data);
      const myMember = response.data.members.find((m: GroupMember) => m.userId === user?.id);
      if (myMember?.nickname) setNickname(myMember.nickname);
    } catch (error) {
      console.error('Error fetching group:', error);
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await api.post(`/groups/${id}/messages`, {
        content: messageText,
        type: 'TEXT',
        replyToId: replyingTo?.id || null
      });
      setMessageText('');
      setReplyingTo(null);
      fetchNewMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await api.post(`/groups/${id}/messages/${messageId}/reactions`, { emoji });
      
      // Update local state immediately for instant feedback
      setMessages(prevMessages => prevMessages.map(msg => {
        if (msg.id !== messageId) return msg;
        
        const reactions = msg.reactions || [];
        
        if (response.data.removed) {
          // Remove the reaction
          return {
            ...msg,
            reactions: reactions.filter(r => !(r.userId === user?.id && r.emoji === emoji))
          };
        } else if (response.data.updated) {
          // Update existing reaction to new emoji
          return {
            ...msg,
            reactions: reactions.map(r => 
              r.userId === user?.id 
                ? { ...r, emoji: response.data.reaction.emoji }
                : r
            )
          };
        } else if (response.data.added) {
          // Add new reaction
          return {
            ...msg,
            reactions: [...reactions, response.data.reaction]
          };
        }
        
        return msg;
      }));
      
      setShowReactionPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check Zion balance
    if ((user?.zions || 0) < 10) {
      showToast('Você precisa de 10 Zions para enviar uma imagem');
      return;
    }

    // Store file and show custom confirmation modal
    setPendingImageFile(file);
    setShowImageConfirm(true);

    // Clear the input so user can select same file again if needed
    e.target.value = '';
  };

  const handleConfirmSendImage = async () => {
    if (!pendingImageFile) return;

    setShowImageConfirm(false);

    try {
      const formData = new FormData();
      formData.append('image', pendingImageFile);

      const uploadResponse = await api.post('/uploads/group', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadResponse.data.imageUrl;

      await api.post(`/groups/${id}/messages/image`, {
        imageUrl,
        content: '',
        isNSFW: false
      });

      fetchNewMessages();
    } catch (error: any) {
      console.error('Error sending image:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Não foi possível enviar a imagem';
      showError('Erro ao enviar imagem', errorMessage);
    } finally {
      setPendingImageFile(null);
    }
  };

  const handleToggleMute = async () => {
    try {
      await api.post(`/groups/${id}/mute`);
      fetchGroup();
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleUpdateNickname = async () => {
    try {
      await api.put(`/groups/${id}/nickname`, { nickname });
      setShowNicknameModal(false);
      fetchGroup();
    } catch (error) {
      console.error('Error updating nickname:', error);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await api.post(`/groups/${id}/leave`);
      navigate('/groups');
    } catch (error: any) {
      console.error('Error leaving group:', error);
      if (error.response?.status === 400) {
        showToast('O criador do grupo não pode sair. Transfira a propriedade ou delete o grupo.');
      } else {
        showToast('Não foi possível sair do grupo');
      }
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/groups/${id}`);
      navigate('/groups');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      showToast('Não foi possível deletar o grupo');
    }
  };

  const handleBackgroundChange = async (backgroundId: string) => {
    try {
      await api.put(`/groups/${id}/background`, { backgroundId });
      fetchGroup();
      showToast('Fundo do grupo atualizado!');
    } catch (error: any) {
      console.error('Error updating background:', error);
      showToast('Não foi possível mudar o fundo');
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || !isAdmin) return;

    try {
      await api.put(`/groups/${id}`, { name: newGroupName });
      setShowEditNameModal(false);
      fetchGroup();
    } catch (error) {
      console.error('Error updating group name:', error);
      showToast('Não foi possível atualizar o nome do grupo');
    }
  };

  const handleUpdateGroupAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await api.post('/uploads/group', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const avatarUrl = uploadResponse.data.imageUrl;

      await api.put(`/groups/${id}`, { avatarUrl });
      setShowEditAvatarModal(false);
      fetchGroup();
    } catch (error) {
      console.error('Error updating group avatar:', error);
      showToast('Não foi possível atualizar a foto do grupo');
    } finally {
      setUploading(false);
    }
  };

  const getDisplayName = (msg: Message) => {
    // Priority: nickname > displayName > name
    const member = group?.members.find(m => m.userId === msg.sender.id);
    return member?.nickname || msg.sender.displayName || msg.sender.name;
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

  if (!group) return null;

  return (
    <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
      <LuxuriousBackground />
      <Header />

      {/* Centralized Chat Container */}
      <div className="max-w-5xl mx-auto px-4 pt-48 pb-6 relative z-10">
        <div className={`h-[calc(100vh-180px)] flex flex-col glass-panel rounded-xl overflow-hidden border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
          {/* Header */}
          <div className="border-b border-white/10 p-4 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/groups')}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div
                onClick={isAdmin ? () => setShowEditAvatarModal(true) : undefined}
                className={`relative ${isAdmin ? 'cursor-pointer group' : ''}`}
              >
                {group.avatarUrl ? (
                  <img
                    src={group.avatarUrl}
                    alt={group.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${accentBg} flex items-center justify-center`}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                )}
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div
                onClick={isAdmin ? () => { setNewGroupName(group.name); setShowEditNameModal(true); } : undefined}
                className={isAdmin ? 'cursor-pointer group' : ''}
              >
                <h1 className="font-semibold text-white flex items-center gap-2">
                  {group.name}
                  {isAdmin && <Edit className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </h1>
                <p className="text-sm text-gray-400">{group.members.length} membros</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showNSFW ? (
                <button
                  onClick={() => setShowNSFW(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  title="Ocultar conteúdo +18"
                >
                  <Eye className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowNSFW(true)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  title="Mostrar conteúdo +18"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setShowMembers(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Users className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10">
            {messages
              .filter(msg => showNSFW || !msg.isNSFW)
              .map((msg) => {
                const isMe = msg.sender.id === user?.id;
                const displayName = getDisplayName(msg);

                // Group reactions by emoji
                const groupedReactions: { [key: string]: { count: number; users: string[]; userReacted: boolean } } = {};
                msg.reactions?.forEach(r => {
                  if (!groupedReactions[r.emoji]) {
                    groupedReactions[r.emoji] = { count: 0, users: [], userReacted: false };
                  }
                  groupedReactions[r.emoji].count++;
                  groupedReactions[r.emoji].users.push(r.user.displayName || r.user.name);
                  if (r.userId === user?.id) {
                    groupedReactions[r.emoji].userReacted = true;
                  }
                });

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg`}
                  >
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col relative`}>
                      {!isMe && (
                        <span className={`text-xs ${themeSecondary} mb-1 ml-2`}>{displayName}</span>
                      )}

                      {/* Reply preview */}
                      {msg.replyTo && (
                        <div className={`text-xs ${themeSecondary} mb-1 px-3 py-1 rounded-lg bg-white/5 border-l-2 ${isMGT ? 'border-emerald-500' : 'border-gold-500'} ${isMe ? 'mr-2' : 'ml-2'}`}>
                          <span className="font-medium">{msg.replyTo.sender.displayName || msg.replyTo.sender.name}</span>
                          <p className="truncate max-w-[200px]">{msg.replyTo.content}</p>
                        </div>
                      )}

                      <div className="relative">
                        <div
                          className={`rounded-2xl px-4 py-2 ${isMe
                            ? `${accentBg} text-white`
                            : `${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} ${themeText}`
                            }`}
                        >
                          {msg.type === 'IMAGE' && msg.imageUrl ? (
                            <div>
                              {msg.isNSFW && !showNSFW ? (
                                <div className="p-4 text-sm opacity-60">
                                  [Conteúdo +18 oculto]
                                </div>
                              ) : (
                                <img
                                  src={msg.imageUrl}
                                  alt="Shared image"
                                  className="max-w-full rounded-lg"
                                />
                              )}
                              {msg.content && <p className="mt-2">{msg.content}</p>}
                            </div>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>

                        {/* Action buttons (reply & react) - shown on hover */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-20' : '-right-20'} flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1.5 rounded-full bg-gray-700/80 hover:bg-gray-600 transition-colors text-white"
                            title="Responder"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                            className="p-1.5 rounded-full bg-gray-700/80 hover:bg-gray-600 transition-colors text-white"
                            title="Reagir"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Reaction picker */}
                        <AnimatePresence>
                          {showReactionPicker === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-10 bg-gray-800 rounded-full px-2 py-1 flex gap-1 shadow-lg border border-white/10 z-10`}
                            >
                              {QUICK_REACTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  className="hover:scale-125 transition-transform text-lg px-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Reactions display */}
                      {Object.keys(groupedReactions).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'mr-2 justify-end' : 'ml-2'}`}>
                          {Object.entries(groupedReactions).map(([emoji, data]) => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg.id, emoji)}
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs ${
                                data.userReacted 
                                  ? `${isMGT ? 'bg-emerald-500/30 border-emerald-500' : 'bg-gold-500/30 border-gold-500'} border` 
                                  : 'bg-gray-700/50 hover:bg-gray-600/50'
                              } transition-colors`}
                              title={data.users.join(', ')}
                            >
                              <span>{emoji}</span>
                              <span className="text-gray-300">{data.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <span className={`text-xs text-gray-400 mt-1 ${isMe ? 'mr-2' : 'ml-2'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {/* Show reactor avatars inline */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <span className="ml-2 inline-flex -space-x-1">
                            {Array.from(new Set(msg.reactions.map(r => r.userId))).slice(0, 3).map((userId) => {
                              const reactor = msg.reactions?.find(r => r.userId === userId)?.user;
                              if (!reactor) return null;
                              return (
                                <img
                                  key={userId}
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reactor.displayName || reactor.name)}&size=16`}
                                  alt={reactor.displayName || reactor.name}
                                  className="w-4 h-4 rounded-full border border-gray-800 inline-block"
                                  title={reactor.displayName || reactor.name}
                                />
                              );
                            })}
                            {Array.from(new Set(msg.reactions?.map(r => r.userId) || [])).length > 3 && (
                              <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[8px] text-white border border-gray-800 inline-flex">
                                +{Array.from(new Set(msg.reactions?.map(r => r.userId) || [])).length - 3}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <div className="flex -space-x-2">
                    {typingUsers.slice(0, 3).map((typingUser) => (
                      <img
                        key={typingUser.id}
                        src={typingUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(typingUser.name)}&size=24`}
                        alt={typingUser.name}
                        className="w-6 h-6 rounded-full border-2 border-gray-900"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">
                      {typingUsers.length === 1
                        ? `${typingUsers[0].name} está digitando`
                        : `${typingUsers.length} pessoas estão digitando`
                      }
                    </span>
                    {/* Typing dots animation */}
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-white/10 bg-black/20 relative">
            {/* Reply indicator */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`px-4 pt-3 pb-1 border-l-4 ${isMGT ? 'border-emerald-500' : 'border-gold-500'} bg-white/5`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        <span className="text-gray-400">Respondendo a </span>
                        <span className={isMGT ? 'text-emerald-400' : 'text-gold-400'}>
                          {replyingTo.sender.displayName || replyingTo.sender.name}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1 pl-6">{replyingTo.content}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 relative">
            {/* Sugestões de menção */}
            <AnimatePresence>
              {showMentionSuggestions && filteredMentionMembers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-white/20 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                >
                  <div className="p-2 text-xs text-gray-400 border-b border-white/10">Membros do grupo</div>
                  {filteredMentionMembers.slice(0, 5).map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => insertMention(member)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            {(member.user.displayName || member.user.name).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.user.displayName || member.user.name}</p>
                        <p className="text-xs text-gray-400">{member.role}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleSendImage}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Enviar imagem (10 Zions)"
              >
                <Image className="w-5 h-5" />
              </label>

              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={handleMessageChange}
                placeholder="Digite uma mensagem... Use @ para mencionar"
                className={`flex-1 px-4 py-2 rounded-full bg-white/5 text-white border border-white/10 focus:outline-none focus:ring-2 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-gold-500'} placeholder-gray-400`}
              />

              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className={`p-2 rounded-full ${accentBg} text-white disabled:opacity-50 transition-all hover:scale-110`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            </div>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={`${themeBg} rounded-xl p-6 max-w-md w-full space-y-4`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${themeText}`}>Configurações</h2>
                <button onClick={() => setShowSettings(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowNicknameModal(true);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${themeText}`}
              >
                <Edit3 className="w-5 h-5" />
                <span>Mudar Apelido</span>
              </button>

              <button
                onClick={() => {
                  handleToggleMute();
                  setShowSettings(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${themeText}`}
              >
                {myMember?.isMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span>{myMember?.isMuted ? 'Ativar Notificações' : 'Silenciar Grupo'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowBackgroundModal(true);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${themeText}`}
                >
                  <Palette className="w-5 h-5" />
                  <span>Mudar Fundo</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowLeaveConfirm(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair do Grupo</span>
              </button>

              {isCreator && (
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-red-600 font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Deletar Grupo</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nickname Modal */}
      <AnimatePresence>
        {showNicknameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNicknameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={`${themeBg} rounded-xl p-6 max-w-md w-full`}
            >
              <h2 className={`text-xl font-semibold ${themeText} mb-4`}>Mudar Apelido</h2>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Digite seu apelido"
                className={`w-full px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
                  } ${themeText} border-0 focus:outline-none focus:ring-2 focus:ring-${accentColor} mb-4`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNicknameModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${themeBorder} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateNickname}
                  className={`flex-1 px-4 py-2 rounded-lg ${accentBg} text-white hover:opacity-90 transition-opacity`}
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMembers(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={`${themeBg} rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${themeText}`}>Membros ({group.members.length})</h2>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={openInviteModal}
                      className={`px-3 py-1.5 rounded-lg ${accentBg} text-white text-sm hover:opacity-90 transition-opacity`}
                    >
                      + Adicionar
                    </button>
                  )}
                  <button onClick={() => setShowMembers(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <img
                      src={member.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}`}
                      alt={member.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${themeText}`}>
                        {member.nickname || member.user.displayName || member.user.name}
                      </p>
                      <p className={`text-xs ${themeSecondary}`}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Confirm Modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveGroup}
        title="Sair do Grupo"
        message="Tem certeza que deseja sair deste grupo?"
        confirmText="Sair"
        cancelText="Cancelar"
      />

      {/* Delete Group Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteGroup}
        title="Deletar Grupo"
        message="Tem certeza que deseja deletar este grupo permanentemente? Esta ação não pode ser desfeita e todos os membros serão removidos."
        confirmText="Deletar"
        cancelText="Cancelar"
      />

      {/* Edit Group Name Modal */}
      <AnimatePresence>
        {showEditNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditNameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-xl p-6 max-w-md w-full border border-white/10"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Editar Nome do Grupo</h2>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Digite o novo nome"
                className="w-full px-4 py-2 rounded-lg bg-white/5 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-${accentColor} mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateGroupName}
                  className={`flex-1 px-4 py-2 rounded-lg ${accentBg} text-white hover:opacity-90 transition-opacity`}
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-xl p-6 max-w-md w-full max-h-[70vh] overflow-y-auto border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Convidar Amigos</h2>
                <button onClick={() => setShowInviteModal(false)}>
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {friends.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Nenhum amigo disponível para convidar
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <img
                        src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}`}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {friend.displayName || friend.name}
                        </p>
                        <p className="text-xs text-gray-400">{friend.trophies} Troféus • Nível {friend.level}</p>
                      </div>
                      <button
                        onClick={() => handleInviteMember(friend.id)}
                        disabled={inviting}
                        className={`px-4 py-2 rounded-lg ${accentBg} text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50`}
                      >
                        Convidar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Group Avatar Modal */}
      <AnimatePresence>
        {showEditAvatarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditAvatarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-xl p-6 max-w-md w-full border border-white/10"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Editar Foto do Grupo</h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpdateGroupAvatar}
                className="w-full px-4 py-2 rounded-lg bg-white/5 text-white border border-white/10 mb-4"
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-gray-400 mb-4">Enviando...</p>
              )}
              <button
                onClick={() => setShowEditAvatarModal(false)}
                disabled={uploading}
                className="w-full px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Send Confirmation Modal */}
      <AnimatePresence>
        {showImageConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4"
            onClick={() => {
              setShowImageConfirm(false);
              setPendingImageFile(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl p-6 max-w-sm w-full border border-white/10 text-center"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${accentBg} flex items-center justify-center`}>
                <Image className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Enviar Imagem</h3>
              <p className="text-gray-400 mb-6">
                Enviar esta imagem custará <span className={`font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>10 Zions</span>. Deseja continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowImageConfirm(false);
                    setPendingImageFile(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSendImage}
                  className={`flex-1 px-4 py-3 rounded-xl ${accentBg} text-white font-medium hover:opacity-90 transition-opacity`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Settings Modal */}
      {group && (
        <GroupSettingsModal
          isOpen={showBackgroundModal}
          onClose={() => setShowBackgroundModal(false)}
          groupId={group.id}
          groupName={group.name}
          currentBackground={group.backgroundId}
          isMuted={myMember?.isMuted || false}
          isAdmin={isAdmin}
          members={group.members.map(m => ({
            id: m.id,
            role: m.role,
            user: {
              id: m.user.id,
              name: m.user.name,
              displayName: m.user.displayName || m.user.name,
              avatarUrl: m.user.avatarUrl || ''
            }
          }))}
          onMuteToggle={() => handleToggleMute()}
          onBackgroundChange={handleBackgroundChange}
          onDeleteGroup={isCreator ? handleDeleteGroup : undefined}
          initialTab="background"
        />
      )}
    </div>
  );
}
