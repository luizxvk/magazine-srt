import { useState, useEffect, useRef } from 'react';
import { Send, X, User, Minimize2, Eye, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ModernLoader from './ModernLoader';

// ChatWindow Component - Vision Pro Style (SRT Edition)
interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    storyImageUrl?: string | null;
    createdAt: string;
    read: boolean;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

interface ChatWindowProps {
    otherUserId: string;
    otherUserName: string;
    otherUserAvatar?: string | null;
    otherUserMembershipType?: string;
    onClose: () => void;
}

export default function ChatWindow({ otherUserId, otherUserName, otherUserAvatar, otherUserMembershipType, onClose }: ChatWindowProps) {
    const { user, theme, setActiveChatUserId } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [lastSentTime, setLastSentTime] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Rate limit: 2 seconds between messages
    const RATE_LIMIT_MS = 2000;
    
    // Determine other user's theme
    const isOtherMGT = otherUserMembershipType === 'MGT';
    const isMeMGT = user?.membershipType === 'MGT';

    // Notify context that this chat is active
    useEffect(() => {
        setActiveChatUserId(otherUserId);
        return () => setActiveChatUserId(null);
    }, [otherUserId, setActiveChatUserId]);

    useEffect(() => {
        let isMounted = true;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/${otherUserId}`);
                if (isMounted) {
                    setMessages(response.data);
                    
                    // Mark messages from other user as read
                    const unreadFromOther = response.data.filter((msg: Message) => 
                        msg.senderId === otherUserId && !msg.read
                    );
                    
                    if (unreadFromOther.length > 0) {
                        await api.put('/messages/read', { senderId: otherUserId });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch messages', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Reduced from 3s to 5s to save bandwidth

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [otherUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Deletar esta mensagem?')) return;
        
        try {
            await api.delete(`/messages/${messageId}`);
            setMessages(messages.filter(msg => msg.id !== messageId));
        } catch (error) {
            console.error('Failed to delete message', error);
            alert('Erro ao deletar mensagem');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        // Check rate limit
        const now = Date.now();
        if (now - lastSentTime < RATE_LIMIT_MS) {
            return; // Still within cooldown
        }

        setSending(true);
        try {
            const response = await api.post('/messages', {
                receiverId: otherUserId,
                content: newMessage
            });
            setMessages([...messages, response.data]);
            setNewMessage('');
            setLastSentTime(now);
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setSending(false);
        }
    };

    // Calculate remaining cooldown
    const getRemainingCooldown = () => {
        const elapsed = Date.now() - lastSentTime;
        if (elapsed >= RATE_LIMIT_MS) return 0;
        return Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
    };

    const [cooldown, setCooldown] = useState(0);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCooldown(getRemainingCooldown());
        }, 100);
        return () => clearInterval(timer);
    }, [lastSentTime]);

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            {/* Vision Pro Style Container - SRT Theme (Black/Gold) - Facebook-style bottom-right position */}
            <div className={`w-[360px] h-[480px] flex flex-col ${theme === 'light' ? 'bg-white/95 border-gray-200' : 'bg-[#0a0a0a]/95 border-white/10'} backdrop-blur-3xl border rounded-2xl shadow-2xl overflow-hidden relative ring-1 ring-white/5`}>

                {/* Glassy Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black overflow-visible border border-gold-500/30 shadow-inner relative group">
                            {otherUserAvatar ? (
                                <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center text-gray-400 bg-neutral-900">
                                    <User className="w-5 h-5" />
                                </div>
                            )}
                            {/* Online Indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base leading-tight tracking-wide font-serif">{otherUserName}</h3>
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${isOtherMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                                Membro {isOtherMGT ? 'MGT' : 'MAGAZINE'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            aria-label="Minimizar chat"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/20"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Fechar chat"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 border border-red-500/10 hover:border-red-500/30"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className={`flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <ModernLoader />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <User className="w-8 h-8 text-gold-500" />
                            </div>
                            <p className="text-gray-400 text-sm">Inicie uma conversa com <span className="text-gold-400 font-bold">{otherUserName}</span></p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId === user?.id;
                            const isLastRead = isMe && msg.read && (index === messages.length - 1 || !messages[index + 1]?.read);
                            
                            // My messages use my membership color, their messages use their membership color
                            const myBubbleClass = isMeMGT 
                                ? 'bg-emerald-500/10 text-white border-emerald-500/20 rounded-tr-sm'
                                : 'bg-gold-500/10 text-white border-gold-500/20 rounded-tr-sm';
                            const theirBubbleClass = isOtherMGT
                                ? 'bg-emerald-500/5 text-white border-emerald-500/10 rounded-tl-sm'
                                : (theme === 'light' ? 'bg-gray-100 text-gray-900 border-gray-200 rounded-tl-sm' : 'bg-white/5 text-gray-200 border-white/10 rounded-tl-sm');
                            const bubbleClass = isMe ? myBubbleClass : theirBubbleClass;
                            const timeClass = isMe 
                                ? (isMeMGT ? 'text-emerald-200' : 'text-gold-200')
                                : (theme === 'light' ? 'text-gray-600' : 'text-gray-400');

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up group`}>
                                    <div className="flex items-end gap-2">
                                        {/* Delete button (sender or admin) */}
                                        {(isMe || user?.role === 'ADMIN') && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-red-400"
                                                title="Deletar mensagem"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                        
                                        <div
                                            className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-md border ${bubbleClass}`}
                                        >
                                        {/* Story thumbnail if it's a story reply */}
                                        {msg.storyImageUrl && (
                                            <div className="mb-2 -mt-1 -mx-1">
                                                <div className="relative rounded-lg overflow-hidden border border-white/10">
                                                    <img 
                                                        src={msg.storyImageUrl} 
                                                        alt="Story" 
                                                        className="w-full h-20 object-cover opacity-80"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    <span className="absolute bottom-1 left-2 text-[10px] text-white/70">📷 Story</span>
                                                </div>
                                            </div>
                                        )}
                                        {msg.content}
                                        <div className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'} ${timeClass} flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {isLastRead && (
                                                <span className="ml-1" title="Visto">
                                                    <Eye className="w-3 h-3 text-blue-400" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5">
                    <div className={`relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 py-2 transition-all duration-300 shadow-lg ${isMeMGT ? 'focus-within:border-emerald-500/30 focus-within:bg-emerald-500/5' : 'focus-within:border-gold-500/30 focus-within:bg-gold-500/5'}`}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-transparent border-none px-4 text-white placeholder-gray-500 focus:outline-none text-sm"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending || cooldown > 0}
                            aria-label="Enviar mensagem"
                            className={`p-2.5 text-white rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg relative ${isMeMGT ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30' : 'bg-gold-600 hover:bg-gold-500 shadow-gold-500/30'}`}
                        >
                            {cooldown > 0 ? (
                                <span className="w-4 h-4 flex items-center justify-center text-[10px] font-bold">{cooldown}</span>
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
