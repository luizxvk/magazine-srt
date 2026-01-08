import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Image, ArrowLeft, Users, Settings, LogOut,
  Edit3, Volume2, VolumeX, Palette, Eye, EyeOff, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

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
}

export default function GroupChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, theme } = useAuth();
  const isMGT = user?.membershipType === 'MGT';
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

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const accentColor = isMGT ? 'emerald-500' : 'gold-500';
  const accentBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';

  const myMember = group?.members.find(m => m.userId === user?.id);
  const isAdmin = myMember?.role === 'ADMIN';

  useEffect(() => {
    fetchGroup();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll messages every 3s
    return () => clearInterval(interval);
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
      
      const myMember = response.data.members.find((m: GroupMember) => m.userId === user?.id);
      if (myMember?.nickname) {
        setNickname(myMember.nickname);
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      navigate('/groups');
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
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await api.post(`/groups/${id}/messages`, {
        content: messageText,
        type: 'TEXT'
      });
      setMessageText('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check Zion balance
    if ((user?.zions || 0) < 10) {
      alert('Você precisa de 10 Zions para enviar uma imagem');
      return;
    }

    const confirmed = window.confirm('Enviar esta imagem custará 10 Zions. Confirmar?');
    if (!confirmed) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await api.post('/upload', formData);
      const imageUrl = uploadResponse.data.url;

      await api.post(`/groups/${id}/messages/image`, {
        imageUrl,
        content: '',
        isNSFW: false
      });

      fetchMessages();
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Erro ao enviar imagem');
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
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const getDisplayName = (msg: Message) => {
    // Priority: nickname > displayName > name
    const member = group?.members.find(m => m.userId === msg.sender.id);
    return member?.nickname || msg.sender.displayName || msg.sender.name;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeBg} ${themeText} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-${accentColor}`}></div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className={`h-screen flex flex-col ${themeBg} ${themeText}`}>
      {/* Header */}
      <div className={`border-b ${themeBorder} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/groups')}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
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
          
          <div>
            <h1 className={`font-semibold ${themeText}`}>{group.name}</h1>
            <p className={`text-sm ${themeSecondary}`}>{group.members.length} membros</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showNSFW ? (
            <button
              onClick={() => setShowNSFW(false)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
              title="Ocultar conteúdo +18"
            >
              <Eye className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowNSFW(true)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
              title="Mostrar conteúdo +18"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={() => setShowMembers(true)}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
          >
            <Users className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages
          .filter(msg => showNSFW || !msg.isNSFW)
          .map((msg) => {
            const isMe = msg.sender.id === user?.id;
            const displayName = getDisplayName(msg);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <span className={`text-xs ${themeSecondary} mb-1 ml-2`}>{displayName}</span>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isMe
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
                  
                  <span className={`text-xs ${themeSecondary} mt-1 ${isMe ? 'mr-2' : 'ml-2'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={`border-t ${themeBorder} p-4 flex items-center gap-2`}>
        <input
          type="file"
          accept="image/*"
          onChange={handleSendImage}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer`}
          title="Enviar imagem (10 Zions)"
        >
          <Image className="w-5 h-5" />
        </label>

        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className={`flex-1 px-4 py-2 rounded-full ${
            theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
          } ${themeText} border-0 focus:outline-none focus:ring-2 focus:ring-${accentColor}`}
        />

        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          className={`p-2 rounded-full ${accentBg} text-white disabled:opacity-50 transition-all hover:scale-110`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

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
                    // TODO: Open background selector
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
                className={`w-full px-4 py-2 rounded-lg ${
                  theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
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
                <button onClick={() => setShowMembers(false)}>
                  <X className="w-5 h-5" />
                </button>
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
    </div>
  );
}
