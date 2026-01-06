import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatWindow from './ChatWindow';

interface UnreadMessage {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
        membershipType?: 'MAGAZINE' | 'MGT';
    };
}

interface MessagePopupProps {
    activeChatUserId?: string | null;
}

export default function MessagePopup({ activeChatUserId }: MessagePopupProps) {
    const { user, isVisitor, theme } = useAuth();
    const [unreadMessage, setUnreadMessage] = useState<UnreadMessage | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const lastNotifId = useRef<string | null>(null);
    const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isVisitor || !user) return;

        const checkUnreadMessages = async () => {
            try {
                const response = await api.get('/notifications');
                const notifications = response.data;
                const messageNotif = notifications.find((n: any) => n.type === 'MESSAGE' && !n.read);

                if (messageNotif && messageNotif.id !== lastNotifId.current) {
                    lastNotifId.current = messageNotif.id;
                    const content = JSON.parse(messageNotif.content);
                    
                    // Don't show notification if chat with this user is already open
                    if (activeChatUserId === content.actor.id) {
                        return;
                    }
                    
                    setUnreadMessage({
                        id: messageNotif.id,
                        senderId: content.actor.id,
                        content: content.text,
                        createdAt: messageNotif.createdAt,
                        sender: {
                            ...content.actor,
                            membershipType: content.actor.membershipType
                        }
                    });
                    setIsVisible(true);

                    // Auto dismiss after 10 seconds
                    if (autoDismissTimer.current) {
                        clearTimeout(autoDismissTimer.current);
                    }
                    autoDismissTimer.current = setTimeout(() => {
                        setIsVisible(false);
                    }, 10000);
                }
            } catch (error) {
                console.error('Failed to check messages', error);
            }
        };

        checkUnreadMessages();
        const interval = setInterval(checkUnreadMessages, 5000);
        return () => {
            clearInterval(interval);
            if (autoDismissTimer.current) {
                clearTimeout(autoDismissTimer.current);
            }
        };
    }, [user, isVisitor, activeChatUserId]);

    // Hide popup if chat becomes active with same user
    useEffect(() => {
        if (activeChatUserId && unreadMessage && activeChatUserId === unreadMessage.senderId) {
            setIsVisible(false);
        }
    }, [activeChatUserId, unreadMessage]);

    const isSenderMGT = unreadMessage?.sender?.membershipType === 'MGT';

    const handleOpenChat = () => {
        setShowChat(true);
        setIsVisible(false);
    };

    const handleCloseChat = () => {
        setShowChat(false);
        setUnreadMessage(null);
        lastNotifId.current = null;
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
    };

    const themeBg = theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeSubtext = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const avatarBorder = isSenderMGT ? 'border-emerald-500' : 'border-gold-500';

    const formatTimeAgo = (dateStr: string): string => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffSec < 60) return 'Agora';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
        return `${Math.floor(diffSec / 86400)}d`;
    };

    return (
        <>
            {/* Chat Window */}
            {showChat && unreadMessage && (
                <ChatWindow
                    otherUserId={unreadMessage.senderId}
                    otherUserName={unreadMessage.sender.name}
                    otherUserAvatar={unreadMessage.sender.avatarUrl}
                    otherUserMembershipType={unreadMessage.sender.membershipType}
                    onClose={handleCloseChat}
                />
            )}

            {/* Notification Popup */}
            <AnimatePresence>
                {isVisible && unreadMessage && !showChat && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-4 right-4 z-[100] w-80 max-w-[calc(100vw-2rem)]"
                    >
                        <div 
                            onClick={handleOpenChat}
                            className={`${themeBg} rounded-2xl border ${isSenderMGT ? 'border-emerald-500/30' : 'border-gold-500/30'} shadow-2xl backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl group`}
                        >
                            {/* Top Accent Line */}
                            <div className={`h-1 bg-gradient-to-r ${isSenderMGT ? 'from-emerald-600 via-emerald-400 to-emerald-600' : 'from-gold-600 via-gold-400 to-gold-600'}`} />
                            
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {unreadMessage.sender.avatarUrl ? (
                                            <img
                                                src={unreadMessage.sender.avatarUrl}
                                                alt={unreadMessage.sender.name}
                                                className={`w-12 h-12 rounded-full object-cover border-2 ${avatarBorder}`}
                                            />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-gray-100' : 'bg-neutral-800'} border-2 ${avatarBorder}`}>
                                                <User className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-black" />
                                        <div className={`absolute -bottom-1 -right-1 ${isSenderMGT ? 'bg-emerald-600' : 'bg-gold-600'} rounded-full p-1 border-2 ${theme === 'light' ? 'border-white' : 'border-black'}`}>
                                            <MessageCircle className="w-2.5 h-2.5 text-white fill-current" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold ${themeText} truncate text-sm`}>{unreadMessage.sender.name}</h4>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSenderMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                                    {isSenderMGT ? 'MGT' : 'MAG'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleDismiss}
                                                className={`p-1.5 rounded-full opacity-50 hover:opacity-100 transition-all ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className={`text-sm ${themeSubtext} line-clamp-2 mt-1`}>
                                            {unreadMessage.content}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={`mt-3 pt-3 border-t ${theme === 'light' ? 'border-gray-100' : 'border-white/5'} flex items-center justify-between`}>
                                    <span className={`text-xs ${themeSubtext} opacity-60`}>
                                        {formatTimeAgo(unreadMessage.createdAt)}
                                    </span>
                                    <span className={`text-xs font-medium ${isSenderMGT ? 'text-emerald-400' : 'text-gold-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        Clique para responder →
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
