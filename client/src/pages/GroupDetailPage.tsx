import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Send, Settings, Crown, Shield, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import GroupSettingsModal from '../components/GroupSettingsModal';
import Loader from '../components/Loader';

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
  isMuted?: boolean;
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
  backgroundId?: string;
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
  const { isStdTier } = useCommunity();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Background gradients map
  const backgroundGradients: Record<string, string> = {
    bg_default: 'linear-gradient(125deg, #0a0a0a 0%, #1a1a1a 100%)',
    bg_aurora: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)',
    bg_galaxy: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)',
    bg_matrix: 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 50%, #0a0f0a 100%)',
    bg_fire: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)',
    bg_ocean: 'linear-gradient(180deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)',
    bg_forest: 'linear-gradient(180deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)',
    bg_city: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)',
    bg_space: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)',
    bg_sunset: 'linear-gradient(135deg, #1a0505 0%, #2a0a0a 25%, #3a1515 50%, #2a0a0a 75%, #1a0505 100%)',
    bg_cyberpunk: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)',
    bg_lava: 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)',
    bg_ice: 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)',
    bg_neon_grid: 'linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 25%, #2a0d2a 50%, #1a0d1a 75%, #0d0d0d 100%)',
    bg_emerald: 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)',
    bg_royal: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)',
    bg_carbon: 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)',
  };

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const themeInput = theme === 'light' ? 'bg-gray-100' : 'bg-white/5';
  const accentColor = isMGT ? 'tier-std-500' : 'gold-500';

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
      // Set muted status from membership
      const myMember = response.data.members?.find((m: any) => m.user.id === user?.id);
      if (myMember) {
        setIsMuted(myMember.isMuted || false);
      }
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
        <Loader size="lg" />
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
  const chatBackground = group.backgroundId ? backgroundGradients[group.backgroundId] : backgroundGradients.bg_default;

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
              <div className="flex items-center gap-2">
                <h2 className={`font-semibold ${themeText}`}>{group.name}</h2>
                {isMuted && (
                  <span title="Notificações silenciadas">
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  </span>
                )}
              </div>
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
            <button 
              onClick={() => setShowSettings(true)}
              className={`p-2 hover:bg-white/10 rounded-full transition-colors`}
            >
                <Settings className="w-5 h-5" />
              </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages List with custom background */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ background: chatBackground }}
          >
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

      {/* Settings Modal */}
      <GroupSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        groupId={group.id}
        groupName={group.name}
        currentBackground={group.backgroundId}
        isMuted={isMuted}
        isAdmin={myMembership?.role === 'ADMIN'}
        members={group.members}
        onMuteToggle={(muted) => setIsMuted(muted)}
        onBackgroundChange={(bgId) => setGroup({ ...group, backgroundId: bgId })}
        onMemberRemove={(memberId) => {
          setGroup({
            ...group,
            members: group.members.filter(m => m.user.id !== memberId)
          });
        }}
        onRoleChange={(memberId, role) => {
          setGroup({
            ...group,
            members: group.members.map(m => 
              m.user.id === memberId ? { ...m, role } : m
            )
          });
        }}
        onDeleteGroup={() => navigate('/groups')}
      />
    </div>
  );
}
