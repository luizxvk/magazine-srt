import { useState, useEffect, useRef } from 'react';
import { Send, X, User, Minimize2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ChatWindow Component - Vision Pro Style (SRT Edition)
interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
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
    onClose: () => void;
}

export default function ChatWindow({ otherUserId, otherUserName, otherUserAvatar, onClose }: ChatWindowProps) {
    const { user, theme } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/${otherUserId}`);
                if (isMounted) {
                    setMessages(response.data);
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
        const interval = setInterval(fetchMessages, 3000);

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

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await api.post('/messages', {
                receiverId: otherUserId,
                content: newMessage
            });
            setMessages([...messages, response.data]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            {/* Vision Pro Style Container - SRT Theme (Black/Gold) */}
            <div className={`w-full max-w-lg h-[80vh] flex flex-col ${theme === 'light' ? 'bg-white/90 border-gray-200' : 'bg-[#0a0a0a]/80 border-white/10'} backdrop-blur-3xl border rounded-[32px] shadow-2xl overflow-hidden relative ring-1 ring-white/5`}>

                {/* Glassy Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-gold-500/30 shadow-inner relative group">
                            {otherUserAvatar ? (
                                <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-neutral-900">
                                    <User className="w-5 h-5" />
                                </div>
                            )}
                            {/* Online Indicator */}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base leading-tight tracking-wide font-serif">{otherUserName}</h3>
                            <span className="text-[10px] text-gold-400 font-bold tracking-widest uppercase">Membro MGT</span>
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
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <User className="w-8 h-8 text-gold-500" />
                            </div>
                            <p className="text-gray-400 text-sm">Inicie uma conversa com <span className="text-gold-400 font-bold">{otherUserName}</span></p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === user?.id;
                            const bubbleClass = isMe
                                ? 'bg-gold-500/10 text-gold-100 border-gold-500/20 rounded-tr-sm'
                                : (theme === 'light' ? 'bg-gray-100 text-gray-800 border-gray-200 rounded-tl-sm' : 'bg-white/5 text-gray-200 border-white/10 rounded-tl-sm');

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                    <div
                                        className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-md border ${bubbleClass}`}
                                    >
                                        {msg.content}
                                        <div className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-right text-gold-200' : (theme === 'light' ? 'text-left text-gray-500' : 'text-left text-gray-400')}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 py-2 focus-within:border-gold-500/30 focus-within:bg-white/10 transition-all duration-300 shadow-lg">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-transparent border-none px-4 text-white placeholder-gray-500 focus:outline-none text-sm"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            aria-label="Enviar mensagem"
                            className="p-2.5 bg-gold-500 text-black rounded-full hover:bg-gold-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-gold-500/20"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
