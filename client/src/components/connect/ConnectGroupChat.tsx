import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Settings, Hash, Smile, Reply,
  Trash2, X, Plus, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader from '../Loader';

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

interface ConnectGroupChatProps {
  group: ConnectGroup;
  textChannel?: TextChannel | null;
  theme: 'light' | 'dark';
  isMGT: boolean;
  accentColor?: string;
  onRefresh: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🔥', '💯'];
const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '😏', '😐', '😑', '😶', '👍', '👎', '👋', '🤚', '✋', '🖐️', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💖', '💗', '💘', '💝', '🔥', '⭐', '✨', '💫', '🌟', '💥', '💯', '💢', '🎉', '🎊'];

export default function ConnectGroupChat({ group, textChannel, theme, isMGT, accentColor }: ConnectGroupChatProps) {
  const navigate = useNavigate();
  const { user, showToast, showError, accentColor: authAccent } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAccent = accentColor || authAccent || '#10b981';
  void activeAccent; // Used for future styling
  const themeBg = theme === 'light' ? 'bg-white' : 'bg-transparent';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeInput = theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-zinc-800/80 text-white';
  const themeHover = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5';

  const myMember = group.members.find(m => m.userId === user?.id);
  const isAdmin = myMember?.role === 'ADMIN';
  const isMod = myMember?.role === 'MODERATOR';

  useEffect(() => {
    fetchMessages();
  }, [group.id, textChannel?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await api.get(`/groups/${group.id}/messages`, {
        params: { 
          page: pageNum, 
          limit: 50,
          textChannelId: textChannel?.id || null // null = canal "geral" padrão
        }
      });
      
      if (pageNum === 1) {
        setMessages(response.data.messages || response.data);
      } else {
        setMessages(prev => [...(response.data.messages || response.data), ...prev]);
      }
      
      setHasMore(response.data.hasMore ?? false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const response = await api.post(`/groups/${group.id}/messages`, {
        content: messageText.trim(),
        replyToId: replyingTo?.id,
        textChannelId: textChannel?.id || null
      });
      
      setMessages([...messages, response.data]);
      setMessageText('');
      setReplyingTo(null);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/groups/${group.id}/messages/${messageId}/reactions`, { emoji });
      // Refresh messages to get updated reactions
      fetchMessages();
      setShowReactionPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/groups/${group.id}/messages/${messageId}`);
      setMessages(messages.filter(m => m.id !== messageId));
      showToast('Mensagem deletada');
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      showError('Apenas imagens são suportadas');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('channelId', textChannel?.id || 'default');

      await api.post(`/groups/${group.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Imagem enviada');
      fetchMessages();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('pt-BR');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className={`h-14 px-4 flex items-center gap-3 border-b ${themeBorder} ${themeBg}`}>
        <Hash className={`w-5 h-5 ${themeSecondary}`} />
        <div className="flex-1">
          <h2 className={`font-semibold ${themeText}`}>{textChannel?.name || 'geral'}</h2>
          {(textChannel?.description || group.description) && (
            <p className={`text-xs ${themeSecondary} truncate`}>{textChannel?.description || group.description}</p>
          )}
        </div>
        {textChannel?.isNSFW && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
            18+
          </span>
        )}
        {isAdmin && (
          <button 
            onClick={() => navigate(`/groups/${group.id}`)}
            className={`p-2 ${themeHover} rounded-lg ${themeSecondary}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 ${themeBg}`}>
        {hasMore && (
          <button
            onClick={() => fetchMessages(page + 1)}
            className={`w-full py-2 text-sm ${themeSecondary} hover:underline`}
          >
            Carregar mensagens anteriores
          </button>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`w-16 h-16 rounded-full ${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'} flex items-center justify-center mb-4`}>
              <Hash className={`w-8 h-8 ${isMGT ? 'text-tier-std-500' : 'text-gold-500'}`} />
            </div>
            <h3 className={`text-lg font-bold ${themeText}`}>Bem-vindo ao #{group.name}!</h3>
            <p className={`${themeSecondary} text-center mt-2`}>
              Este é o início do canal. Comece uma conversa!
            </p>
          </div>
        ) : (
          groupMessagesByDate(messages).map(({ date, messages: dayMessages }) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center gap-4 my-4">
                <div className={`flex-1 h-px ${themeBorder} border-t`} />
                <span className={`text-xs ${themeSecondary} px-2`}>{date}</span>
                <div className={`flex-1 h-px ${themeBorder} border-t`} />
              </div>

              {/* Messages */}
              {dayMessages.map((message, index) => {
                const showAvatar = index === 0 || 
                  dayMessages[index - 1].sender.id !== message.sender.id ||
                  new Date(message.createdAt).getTime() - new Date(dayMessages[index - 1].createdAt).getTime() > 5 * 60 * 1000;

                return (
                  <div 
                    key={message.id}
                    className={`group relative ${showAvatar ? 'mt-4' : 'mt-0.5'} ${themeHover} rounded-lg px-2 py-1 -mx-2`}
                  >
                    {/* Reply Preview */}
                    {message.replyTo && (
                      <div className={`flex items-center gap-2 ml-12 mb-1 text-xs ${themeSecondary}`}>
                        <Reply className="w-3 h-3" />
                        <span className="font-medium">
                          {message.replyTo.sender.displayName || message.replyTo.sender.name}
                        </span>
                        <span className="truncate max-w-xs">{message.replyTo.content}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {showAvatar ? (
                        <img
                          src={message.sender.avatarUrl || '/assets/default-avatar.png'}
                          className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80"
                          onClick={() => navigate(`/profile/${message.sender.id}`)}
                          alt=""
                        />
                      ) : (
                        <div className="w-10" />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-center gap-2">
                            <span 
                              className={`font-medium cursor-pointer hover:underline ${themeText}`}
                              onClick={() => navigate(`/profile/${message.sender.id}`)}
                            >
                              {message.senderNickname || message.sender.displayName || message.sender.name}
                            </span>
                            <span className={`text-xs ${themeSecondary}`}>
                              {new Date(message.createdAt).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}
                        
                        <p className={`${themeText} break-words`}>{message.content}</p>

                        {/* Image */}
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            className="mt-2 max-w-md rounded-lg cursor-pointer hover:opacity-90"
                            alt=""
                          />
                        )}

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(
                              message.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction(message.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-sm ${
                                  message.reactions?.some(r => r.emoji === emoji && r.userId === user?.id)
                                    ? isMGT ? 'bg-tier-std-500/20 border border-tier-std-500/40' : 'bg-gold-500/20 border border-gold-500/40'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                          onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                          className={`p-1.5 ${themeHover} rounded ${themeSecondary}`}
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setReplyingTo(message)}
                          className={`p-1.5 ${themeHover} rounded ${themeSecondary}`}
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        {(message.sender.id === user?.id || isAdmin || isMod) && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className={`p-1.5 hover:bg-red-500/10 rounded text-red-400`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reaction Picker */}
                    <AnimatePresence>
                      {showReactionPicker === message.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`absolute right-0 top-0 z-10 flex gap-1 p-2 rounded-lg ${theme === 'light' ? 'bg-white shadow-lg' : 'bg-zinc-800'} border ${themeBorder}`}
                        >
                          {QUICK_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(message.id, emoji)}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-4 py-2 border-t ${themeBorder} ${themeBg}`}
          >
            <div className="flex items-center gap-2">
              <Reply className={`w-4 h-4 ${themeSecondary}`} />
              <span className={`text-sm ${themeSecondary}`}>Respondendo a</span>
              <span className={`text-sm font-medium ${themeText}`}>
                {replyingTo.sender.displayName || replyingTo.sender.name}
              </span>
              <span className={`text-sm ${themeSecondary} truncate flex-1`}>
                {replyingTo.content}
              </span>
              <button onClick={() => setReplyingTo(null)} className={themeSecondary}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={`p-4 border-t ${themeBorder} ${themeBg} relative`}>
        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute bottom-full right-4 mb-2 p-3 rounded-xl ${theme === 'light' ? 'bg-white shadow-lg' : 'bg-zinc-800'} border ${themeBorder} z-10`}
            >
              <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto w-[280px]">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-xl p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className={`flex items-center gap-3 p-3 rounded-xl ${themeInput}`}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className={`p-1 ${themeSecondary} hover:text-white transition-colors ${uploadingImage ? 'opacity-50' : ''}`}
            title="Enviar imagem"
          >
            {uploadingImage ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Mensagem #${textChannel?.name || 'geral'}`}
            className={`flex-1 bg-transparent outline-none ${themeText} placeholder:${themeSecondary}`}
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-1 ${showEmojiPicker ? 'text-yellow-400' : themeSecondary} hover:text-yellow-400 transition-colors`}
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className={`p-2 rounded-lg transition-all ${
              messageText.trim()
                ? isMGT 
                  ? 'bg-tier-std-500 text-white hover:bg-tier-std-600' 
                  : 'bg-gold-500 text-black hover:bg-gold-600'
                : `${themeSecondary} cursor-not-allowed`
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
