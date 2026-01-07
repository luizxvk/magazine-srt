import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Send, Settings, Crown, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GroupMessage {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string;
  };
}

interface GroupMember {
  id: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string;
  };
}

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
  members: GroupMember[];
  settings: any;
  _count: {
    messages: number;
  };
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, theme } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMGT = user?.membershipType === 'MGT';

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeInput = theme === 'light' ? 'bg-gray-100' : 'bg-white/5';
  const accentColor = isMGT ? 'emerald-500' : 'gold-500';

  useEffect(() => {
    if (id) {
      fetchGroup();
      fetchMessages();
    }
  }, [id]);

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
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/groups/${id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const response = await api.post(`/groups/${id}/messages`, {
        content: newMessage.trim(),
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
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

  if (loading) {
    return (
      <div className={`min-h-screen ${themeBg} ${themeText} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-${accentColor}`}></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={`min-h-screen ${themeBg} ${themeText} flex items-center justify-center`}>
        <p>Grupo não encontrado</p>
      </div>
    );
  }

  const myMembership = group.members.find((m) => m.user.id === user?.id);

  return (
    <div className={`h-screen ${themeBg} ${themeText} flex flex-col`}>
      {/* Header */}
      <div className={`border-b ${themeBorder} px-4 py-3`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/groups')}
              className={`p-2 hover:bg-white/10 rounded-full transition-colors`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {group.avatarUrl ? (
              <img
                src={group.avatarUrl}
                alt={group.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full bg-${accentColor}/20 flex items-center justify-center`}>
                <Users className={`w-5 h-5 text-${accentColor}`} />
              </div>
            )}

            <div>
              <h2 className={`font-semibold ${themeText}`}>{group.name}</h2>
              <p className={`text-xs ${themeSecondary}`}>
                {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 hover:bg-white/10 rounded-full transition-colors`}
            >
              <Users className="w-5 h-5" />
            </button>
            {myMembership?.role === 'ADMIN' && (
              <button className={`p-2 hover:bg-white/10 rounded-full transition-colors`}>
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <p className={themeSecondary}>Nenhuma mensagem ainda. Seja o primeiro a falar!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMyMessage = message.sender.id === user?.id;
                const memberRole = group.members.find((m) => m.user.id === message.sender.id)?.role;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      {!isMyMessage && (
                        <img
                          src={message.sender.avatarUrl || '/default-avatar.png'}
                          alt={message.sender.displayName || message.sender.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}

                      {/* Message Bubble */}
                      <div>
                        {!isMyMessage && (
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-sm font-medium ${themeText}`}>
                              {message.sender.displayName || message.sender.name}
                            </p>
                            {getRoleIcon(memberRole || '')}
                          </div>
                        )}

                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMyMessage
                              ? `bg-${accentColor} text-white`
                              : `${themeInput} ${themeText}`
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>

                        <p className={`text-xs ${themeSecondary} mt-1 ${isMyMessage ? 'text-right' : ''}`}>
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className={`border-t ${themeBorder} p-4`}>
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className={`flex-1 px-4 py-3 rounded-full ${themeInput} ${themeText} border ${themeBorder} focus:ring-2 focus:ring-${accentColor} focus:border-transparent transition-all`}
              />
              <motion.button
                type="submit"
                disabled={!newMessage.trim() || sending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`bg-${accentColor} text-white p-3 rounded-full hover:bg-${accentColor}/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </form>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div className={`w-80 border-l ${themeBorder} overflow-y-auto p-4`}>
            <h3 className={`text-lg font-semibold ${themeText} mb-4`}>
              Membros ({group.members.length})
            </h3>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <img
                    src={member.user.avatarUrl || '/default-avatar.png'}
                    alt={member.user.displayName || member.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${themeText} text-sm`}>
                        {member.user.displayName || member.user.name}
                      </p>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className={`text-xs ${themeSecondary}`}>
                      {member.role === 'ADMIN' ? 'Admin' : member.role === 'MODERATOR' ? 'Moderador' : 'Membro'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
