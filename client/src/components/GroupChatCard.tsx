import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, ChevronDown, ChevronUp, Users, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Group {
  id: string;
  name: string;
  avatarUrl?: string;
  membershipType: 'MAGAZINE' | 'MGT';
  _count?: {
    messages: number;
  };
  members: Array<{
    userId: string;
    user: {
      id: string;
      name: string;
      displayName?: string;
      avatarUrl?: string;
    };
  }>;
}

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'ANNOUNCEMENT';
  imageUrl?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export default function GroupChatCard() {
  const { user, accentGradient } = useAuth();
  const isMGT = user?.membershipType === 'MGT';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accentBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';
  const accentBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
  const accentText = isMGT ? 'text-emerald-400' : 'text-gold-400';
  const themeGlow = isMGT
      ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]'
      : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]';

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups');
        setGroups(response.data);
        if (response.data.length > 0) {
          setSelectedGroup(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Fetch messages for selected group
  useEffect(() => {
    if (!selectedGroup || !isChatOpen) return;

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/groups/${selectedGroup.id}/messages`);
        setMessages(response.data.slice(-20)); // Last 20 messages
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedGroup, isChatOpen]);

  // Poll for typing users
  useEffect(() => {
    if (!selectedGroup || !isChatOpen) return;

    const fetchTypingUsers = async () => {
      try {
        const response = await api.get(`/groups/${selectedGroup.id}/typing`);
        setTypingUsers(response.data);
      } catch (error) {
        // Silently ignore
      }
    };

    fetchTypingUsers();
    const typingInterval = setInterval(fetchTypingUsers, 2000);
    return () => clearInterval(typingInterval);
  }, [selectedGroup, isChatOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendTypingIndicator = async () => {
    if (!selectedGroup) return;
    try {
      await api.post(`/groups/${selectedGroup.id}/typing`);
    } catch (error) {
      // Silently ignore
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator();
    }, 300);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedGroup || sending) return;

    setSending(true);
    try {
      await api.post(`/groups/${selectedGroup.id}/messages`, {
        content: messageText,
        type: 'TEXT'
      });
      setMessageText('');
      
      // Refresh messages
      const response = await api.get(`/groups/${selectedGroup.id}/messages`);
      setMessages(response.data.slice(-20));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-24 mb-2" />
            <div className="h-3 bg-white/10 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className={`glass-panel rounded-xl ${accentGradient ? 'border-gradient-accent' : `border ${accentBorder}`} ${themeGlow} overflow-hidden transition-all duration-300`}>
      {/* Header - Group Selector */}
      <div 
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'} rounded-lg`}>
              <MessageCircle className={`w-5 h-5 ${accentText}`} />
            </div>
            <div>
              <h4 className="font-medium text-white">Grupos</h4>
              <p className="text-xs text-gray-400">{groups.length} grupo{groups.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Group List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="max-h-40 overflow-y-auto">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setIsChatOpen(true);
                    setIsExpanded(false);
                  }}
                  className={`flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedGroup?.id === group.id ? 'bg-white/5' : ''
                  }`}
                >
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${accentBg} flex items-center justify-center`}>
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{group.name}</p>
                    <p className="text-xs text-gray-400">{group.members.length} membros</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Chat Window */}
      <AnimatePresence>
        {isChatOpen && selectedGroup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 300, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 flex flex-col"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-black/20">
              <div className="flex items-center gap-2">
                {selectedGroup.avatarUrl ? (
                  <img
                    src={selectedGroup.avatarUrl}
                    alt={selectedGroup.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full ${accentBg} flex items-center justify-center`}>
                    <Users className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium text-white truncate max-w-[120px]">
                  {selectedGroup.name}
                </span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2 bg-black/10">
              {/* Auto-delete warning */}
              <div className="flex items-center justify-center gap-1 py-1 px-2 mx-auto w-fit rounded-full bg-amber-500/10 border border-amber-500/20">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-400">Mensagens são apagadas após 7 dias</span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender.id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && (
                        <div className="flex items-center gap-1 mb-0.5">
                          <img
                            src={msg.sender.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&size=16`}
                            alt={msg.sender.name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-[10px] text-gray-400">
                            {msg.sender.displayName || msg.sender.name}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-xl px-3 py-1.5 text-sm ${
                          isMe
                            ? `${accentBg} text-white`
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        {msg.type === 'IMAGE' && msg.imageUrl ? (
                          <img src={msg.imageUrl} alt="Image" className="max-w-full rounded" />
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-2">
                  <div className="flex -space-x-1">
                    {typingUsers.slice(0, 2).map((u) => (
                      <img
                        key={u.id}
                        src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=16`}
                        alt={u.name}
                        className="w-4 h-4 rounded-full border border-gray-800"
                      />
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2 bg-black/20">
              <input
                type="text"
                value={messageText}
                onChange={handleMessageChange}
                placeholder="Mensagem..."
                className={`flex-1 px-3 py-1.5 rounded-full bg-white/5 text-white text-sm border border-white/10 focus:outline-none focus:ring-1 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-gold-500'} placeholder-gray-500`}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className={`p-1.5 rounded-full ${accentBg} text-white disabled:opacity-50 transition-all`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
