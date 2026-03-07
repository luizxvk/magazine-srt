import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Users, Settings, Send, Hash, Smile, Reply,
  Trash2, X, Phone,
  ImagePlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import Loader from '../Loader';
import { getProfileBorderGradient } from '../../utils/profileBorderUtils';

interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  nickname?: string;
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
    membershipType?: string;
    equippedProfileBorder?: string | null;
  };
  senderNickname?: string;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      displayName?: string;
    };
  } | null;
  reactions?: {
    id: string;
    emoji: string;
    userId: string;
  }[];
}

interface ConnectGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isPrivate: boolean;
  membershipType: 'MAGAZINE' | 'MGT';
  creator: {
    id: string;
    name: string;
  };
  members: GroupMember[];
}

interface TextChannel {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isNSFW: boolean;
}

interface OnlineFriend {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  status?: string;
  isOnline: boolean;
  membershipType?: string;
  equippedProfileBorder?: string | null;
}

interface FullScreenChatViewProps {
  group: ConnectGroup;
  textChannel?: TextChannel | null;
  accentColor: string;
  isMGT: boolean;
  onBack: () => void;
  onOpenSettings?: () => void;
  onStartCall?: () => void;
  onMemberClick?: (userId: string, event: React.MouseEvent) => void;
  onlineFriends?: OnlineFriend[];
  showOnlineFriends?: boolean;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🔥', '💯'];
const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '😏', '😐', '😑', '😶', '👍', '👎', '👋', '🤚', '✋', '🖐️', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💖', '💗', '💘', '💝', '🔥', '⭐', '✨', '💫', '🌟', '💥', '💯', '💢', '🎉', '🎊'];

/**
 * Full screen chat view matching Figma design node 1-5.
 * Shows the group chat without the call card - just the messages area.
 * Features:
 * - Header with group info and controls
 * - Full width message area
 * - Optional right sidebar with online friends
 * - Input with emoji picker
 */
export const FullScreenChatView: React.FC<FullScreenChatViewProps> = ({
  group,
  textChannel,
  accentColor,
  isMGT: _isMGT,
  onBack,
  onOpenSettings,
  onStartCall,
  onMemberClick,
  onlineFriends = [],
  showOnlineFriends = true,
}) => {
  const { user, showToast, showError } = useAuth();
  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const myMember = group.members.find(m => m.userId === user?.id);
  const isAdmin = myMember?.role === 'ADMIN';
  const isMod = myMember?.role === 'MODERATOR';
  const onlineMembers = group.members.filter(m => m.user.isOnline);

  // Fetch messages
  const fetchMessages = async (pageNum = 1, append = false) => {
    try {
      const channelQuery = textChannel ? `&textChannelId=${textChannel.id}` : '';
      const { data } = await api.get(`/connect/groups/${group.id}/messages?page=${pageNum}&limit=50${channelQuery}`);
      
      if (append) {
        setMessages(prev => [...data.messages.reverse(), ...prev]);
      } else {
        setMessages(data.messages.reverse());
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [group.id, textChannel?.id]);

  // Socket for real-time messages
  useEffect(() => {
    if (socket.isConnected && group.id) {
      socket.joinGroup(group.id);
      
      socket.onNewMessage((message: any) => {
        if (message.groupId === group.id) {
          const msgChannelId = message.textChannelId || null;
          const currentChannelId = textChannel?.id || null;
          if (msgChannelId === currentChannelId) {
            setMessages(prev => {
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        }
      });
      
      return () => {
        socket.leaveGroup(group.id);
      };
    }
  }, [socket.isConnected, group.id, textChannel?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const payload: any = {
        content: messageText.trim(),
        type: 'TEXT',
      };
      
      if (textChannel) {
        payload.textChannelId = textChannel.id;
      }
      
      if (replyingTo) {
        payload.replyToId = replyingTo.id;
      }

      await api.post(`/connect/groups/${group.id}/messages`, payload);
      setMessageText('');
      setReplyingTo(null);
    } catch (err: any) {
      showError('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/connect/messages/${messageId}/reactions`, { emoji });
      setShowReactionPicker(null);
    } catch (err) {
      showError('Erro ao adicionar reação');
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Excluir mensagem?')) return;
    try {
      await api.delete(`/connect/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      showToast('Mensagem excluída');
    } catch (err) {
      showError('Erro ao excluir mensagem');
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  };

  return (
    <div className="h-full flex flex-col bg-transparent font-grotesk">
      {/* Header - Glassmorphic */}
      <div className="shrink-0 px-4 py-3 bg-white/[0.03] backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          
          {/* Group Avatar */}
          {group.avatarUrl ? (
            <img 
              src={group.avatarUrl} 
              className="w-10 h-10 rounded-xl object-cover" 
              alt="" 
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)` }}
            >
              {group.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-white font-bold">{group.name}</h1>
            <p className="text-white/40 text-xs">{onlineMembers.length} online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onStartCall && (
            <button 
              onClick={onStartCall}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Iniciar chamada"
            >
              <Phone className="w-5 h-5 text-white/60" />
            </button>
          )}
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
            onClick={() => setShowMobileMembers(true)}
          >
            <Users className="w-5 h-5 text-white/60" />
          </button>
          {onOpenSettings && isAdmin && (
            <button 
              onClick={onOpenSettings}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader size="lg" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: `${accentColor}20` }}
                >
                  <Hash className="w-8 h-8" style={{ color: accentColor }} />
                </div>
                <h3 className="text-lg font-bold text-white">Bem-vindo ao {group.name}!</h3>
                <p className="text-white/40 text-center mt-2">
                  Este é o início do canal. Comece uma conversa!
                </p>
              </div>
            ) : (
              <>
                {hasMore && (
                  <button
                    onClick={() => fetchMessages(page + 1, true)}
                    className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Carregar mensagens anteriores
                  </button>
                )}
                
                {groupMessagesByDate(messages).map(({ date, messages: dayMessages }) => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center gap-4 my-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-white/40 px-2">{date}</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Messages */}
                    {dayMessages.map((message, index) => {
                      const showAvatar = index === 0 || 
                        dayMessages[index - 1].sender.id !== message.sender.id ||
                        new Date(message.createdAt).getTime() - new Date(dayMessages[index - 1].createdAt).getTime() > 5 * 60 * 1000;

                      return (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          showAvatar={showAvatar}
                          isOwn={message.sender.id === user?.id}
                          canDelete={message.sender.id === user?.id || isAdmin || isMod}
                          onReply={() => setReplyingTo(message)}
                          onDelete={() => deleteMessage(message.id)}
                          onReaction={(emoji) => addReaction(message.id, emoji)}
                          showReactionPicker={showReactionPicker === message.id}
                          onToggleReactionPicker={() => setShowReactionPicker(
                            showReactionPicker === message.id ? null : message.id
                          )}
                          accentColor={accentColor}
                        />
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-4 bg-white/[0.02] border-t border-white/10">
            {/* Reply Preview */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-2 px-3 py-2 bg-white/5 rounded-lg flex items-center gap-2"
                >
                  <Reply className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/60 flex-1 truncate">
                    Respondendo a <strong>{replyingTo.sender.displayName || replyingTo.sender.name}</strong>: {replyingTo.content}
                  </span>
                  <button onClick={() => setReplyingTo(null)}>
                    <X className="w-4 h-4 text-white/40 hover:text-white/60" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <button 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Adicionar imagem"
              >
                <ImagePlus className="w-5 h-5 text-white/40" />
              </button>

              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite uma mensagem..."
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Smile className="w-5 h-5 text-white/40" />
                </button>
                
                {/* Emoji Picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-12 right-0 w-72 max-h-60 overflow-y-auto bg-[#1A1A2E] border border-white/10 rounded-xl p-2 shadow-xl z-50"
                    >
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setMessageText(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={sendMessage}
                disabled={!messageText.trim() || sending}
                className="p-3 rounded-xl transition-all disabled:opacity-50"
                style={{ 
                  background: accentColor,
                  boxShadow: messageText.trim() ? `0 0 20px ${accentColor}40` : 'none'
                }}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Online Friends (Desktop) */}
        {showOnlineFriends && (
          <div className="hidden lg:flex w-72 flex-col bg-white/[0.03] border-l border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">amigos online</h3>
              <span 
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: `${accentColor}20`, color: accentColor }}
              >
                {onlineFriends.filter(f => f.isOnline).length} Online
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {onlineFriends.filter(f => f.isOnline).map(friend => (
                <button
                  key={friend.id}
                  className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                  onClick={(e) => onMemberClick?.(friend.id, e)}
                >
                  <div className="relative">
                    <div 
                      className="w-9 h-9 rounded-full p-[2px]"
                      style={{ background: getProfileBorderGradient(friend.equippedProfileBorder, friend.membershipType === 'MGT') }}
                    >
                      <img 
                        src={friend.avatarUrl || '/assets/logo-rovex.png'} 
                        className="w-full h-full rounded-full object-cover bg-[#101022]"
                        alt=""
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#101022]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {friend.displayName || friend.name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {friend.status || 'Online'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Members Drawer */}
      <AnimatePresence>
        {showMobileMembers && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowMobileMembers(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#0F0F23] z-50 flex flex-col lg:hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold">Membros ({group.members.length})</h3>
                <button onClick={() => setShowMobileMembers(false)}>
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {group.members.map(member => (
                  <button
                    key={member.id}
                    className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                    onClick={(e) => onMemberClick?.(member.userId, e)}
                  >
                    <div className="relative">
                      <div 
                        className="w-9 h-9 rounded-full p-[2px]"
                        style={{ background: getProfileBorderGradient(member.user.equippedProfileBorder, member.user.membershipType === 'MGT') }}
                      >
                        <img 
                          src={member.user.avatarUrl || '/assets/logo-rovex.png'} 
                          className="w-full h-full rounded-full object-cover bg-[#101022]"
                          alt=""
                        />
                      </div>
                      {member.user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F0F23]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {member.user.displayName || member.user.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {member.role === 'ADMIN' ? 'Admin' : member.role === 'MODERATOR' ? 'Mod' : 'Membro'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual message bubble component
 */
const MessageBubble: React.FC<{
  message: Message;
  showAvatar: boolean;
  isOwn: boolean;
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  showReactionPicker: boolean;
  onToggleReactionPicker: () => void;
  accentColor: string;
}> = ({ 
  message, 
  showAvatar, 
  isOwn: _isOwn, 
  canDelete, 
  onReply, 
  onDelete,
  onReaction,
  showReactionPicker,
  onToggleReactionPicker,
  accentColor: _accentColor
}) => {
  const isMGT = message.sender.membershipType === 'MGT';

  return (
    <div className={`group relative ${showAvatar ? 'mt-4' : 'mt-0.5'} hover:bg-white/[0.02] rounded-lg px-2 py-1 -mx-2`}>
      {/* Reply Preview */}
      {message.replyTo && (
        <div className="flex items-center gap-2 ml-12 mb-1 text-xs text-white/40">
          <Reply className="w-3 h-3" />
          <span className="font-medium">
            {message.replyTo.sender.displayName || message.replyTo.sender.name}
          </span>
          <span className="truncate max-w-[200px]">{message.replyTo.content}</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        {showAvatar ? (
          <div 
            className="w-10 h-10 rounded-full p-[2px] shrink-0"
            style={{ background: getProfileBorderGradient(message.sender.equippedProfileBorder, isMGT) }}
          >
            <img
              src={message.sender.avatarUrl || '/assets/logo-rovex.png'}
              className="w-full h-full rounded-full object-cover bg-[#101022]"
              alt=""
            />
          </div>
        ) : (
          <div className="w-10 shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {showAvatar && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm text-white">
                {message.senderNickname || message.sender.displayName || message.sender.name}
              </span>
              <span className="text-xs text-white/30">
                {new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Text Content */}
          {message.type === 'TEXT' && (
            <p className="text-white/80 text-sm break-words">{message.content}</p>
          )}

          {/* Image */}
          {message.type === 'IMAGE' && message.imageUrl && (
            <div className="mt-1">
              <img 
                src={message.imageUrl} 
                className="max-w-[300px] max-h-[300px] rounded-lg object-cover"
                alt="Imagem"
              />
              {message.content && (
                <p className="text-white/80 text-sm mt-1">{message.content}</p>
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onReaction(emoji)}
                  className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-xs flex items-center gap-1 transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-white/40">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons (on hover) */}
        <div className="opacity-0 group-hover:opacity-100 flex items-start gap-1 transition-opacity">
          <button
            onClick={onToggleReactionPicker}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Smile className="w-4 h-4 text-white/40" />
          </button>
          <button
            onClick={onReply}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Reply className="w-4 h-4 text-white/40" />
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400/60" />
            </button>
          )}
        </div>
      </div>

      {/* Reaction Picker */}
      <AnimatePresence>
        {showReactionPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-0 top-0 bg-[#1A1A2E] border border-white/10 rounded-lg p-1 flex gap-0.5 shadow-xl z-10"
          >
            {QUICK_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onReaction(emoji)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FullScreenChatView;
