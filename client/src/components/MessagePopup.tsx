import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, User, ChevronRight } from 'lucide-react';
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
    const [isExpanded, setIsExpanded] = useState(false); // For mobile pill expansion
    const [showChat, setShowChat] = useState(false);
    const lastNotifId = useRef<string | null>(null);
    const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dismissedNotifIds = useRef<Set<string>>(new Set());
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isVisitor || !user) return;

        const doNotDisturb = localStorage.getItem('doNotDisturb') === 'true';
        if (doNotDisturb) return;

        const checkUnreadMessages = async () => {
            try {
                const response = await api.get('/notifications');
                const notifications = response.data;
                
                // Find unread MESSAGE notification
                const messageNotif = notifications.find((n: any) => 
                    n.type === 'MESSAGE' && 
                    !n.read && 
                    !dismissedNotifIds.current.has(n.id)
                );

                console.log('[MessagePopup] Checking notifications, found message:', messageNotif?.id);

                if (!messageNotif || messageNotif.id === lastNotifId.current) {
                    return;
                }
                
                let content;
                try {
                    content = JSON.parse(messageNotif.content);
                } catch {
                    console.error('[MessagePopup] Failed to parse notification content');
                    return;
                }
                    
                if (activeChatUserId && activeChatUserId === content.actor?.id) {
                    dismissedNotifIds.current.add(messageNotif.id);
                    return;
                }
                
                console.log('[MessagePopup] Showing popup for message from:', content.actor?.name);
                
                lastNotifId.current = messageNotif.id;
                setUnreadMessage({
                    id: messageNotif.id,
                    senderId: content.actor?.id,
                    content: content.text || 'Nova mensagem',
                    createdAt: messageNotif.createdAt,
                    sender: {
                        id: content.actor?.id,
                        name: content.actor?.name || 'Usuário',
                        avatarUrl: content.actor?.avatarUrl || null,
                        membershipType: content.actor?.membershipType
                    }
                });
                setIsVisible(true);
                setIsExpanded(false); // Start collapsed on mobile

                if (autoDismissTimer.current) {
                    clearTimeout(autoDismissTimer.current);
                }
                // Auto-dismiss after 15 seconds
                autoDismissTimer.current = setTimeout(() => {
                    setIsVisible(false);
                    setIsExpanded(false);
                }, 15000);
            } catch (error) {
                console.error('[MessagePopup] Failed to check messages', error);
            }
        };

        // Check immediately and then every 10 seconds
        checkUnreadMessages();
        const interval = setInterval(checkUnreadMessages, 10000);
        return () => {
            clearInterval(interval);
            if (autoDismissTimer.current) {
                clearTimeout(autoDismissTimer.current);
            }
        };
    }, [user, isVisitor, activeChatUserId, isMobile]);

    useEffect(() => {
        if (activeChatUserId && unreadMessage && activeChatUserId === unreadMessage.senderId) {
            setIsVisible(false);
            if (unreadMessage.id) {
                dismissedNotifIds.current.add(unreadMessage.id);
            }
        }
    }, [activeChatUserId, unreadMessage]);

    const isSenderMGT = unreadMessage?.sender?.membershipType === 'MGT';

    const handleOpenChat = async () => {
        setShowChat(true);
        setIsVisible(false);
        setIsExpanded(false);
        if (unreadMessage?.id) {
            dismissedNotifIds.current.add(unreadMessage.id);
            try {
                await api.put(`/notifications/${unreadMessage.id}/read`);
            } catch (error) {
                console.error('Failed to mark notification as read', error);
            }
        }
    };

    const handleCloseChat = () => {
        setShowChat(false);
        setUnreadMessage(null);
        lastNotifId.current = null;
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        setIsExpanded(false);
        if (unreadMessage?.id) {
            dismissedNotifIds.current.add(unreadMessage.id);
        }
    };

    const handlePillClick = () => {
        if (isMobile && !isExpanded) {
            setIsExpanded(true);
            // Auto dismiss after expansion
            if (autoDismissTimer.current) {
                clearTimeout(autoDismissTimer.current);
            }
            autoDismissTimer.current = setTimeout(() => {
                if (!showChat) {
                    setIsExpanded(false);
                    setIsVisible(false);
                }
            }, 15000);
        } else {
            handleOpenChat();
        }
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
                    <>
                        {/* Mobile: Edge Pill (Samsung Style) */}
                        {isMobile && !isExpanded && (
                            <motion.div
                                initial={{ x: 100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 100, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed right-0 top-1/3 z-[100]"
                                onClick={handlePillClick}
                            >
                                <div 
                                    className={`flex items-center gap-2 pl-3 pr-1 py-2 rounded-l-full shadow-2xl backdrop-blur-xl cursor-pointer
                                        ${isSenderMGT ? 'bg-emerald-600/95' : 'bg-gradient-to-r from-yellow-600/95 to-amber-500/95'}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {unreadMessage.sender.avatarUrl ? (
                                            <img
                                                src={unreadMessage.sender.avatarUrl}
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 border-2 border-white/30">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        {/* Message icon badge */}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <MessageCircle className={`w-2.5 h-2.5 ${isSenderMGT ? 'text-emerald-600' : 'text-amber-600'} fill-current`} />
                                        </div>
                                    </div>
                                    
                                    {/* Chevron */}
                                    <ChevronRight className="w-4 h-4 text-white/80" />
                                </div>
                            </motion.div>
                        )}

                        {/* Mobile: Expanded Card / Desktop: Full Card */}
                        {(!isMobile || isExpanded) && (
                            <motion.div
                                initial={{ opacity: 0, y: isMobile ? 0 : 100, x: isMobile ? 50 : 0, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                                exit={{ opacity: 0, y: isMobile ? 0 : 50, x: isMobile ? 50 : 0, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className={`fixed z-[100] ${
                                    isMobile 
                                        ? 'right-2 top-1/3 w-72' 
                                        : 'bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)]'
                                }`}
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
                                                <div className={`absolute -bottom-1 -right-1 ${isSenderMGT ? 'bg-emerald-600' : 'bg-amber-600'} rounded-full p-1 border-2 ${theme === 'light' ? 'border-white' : 'border-black'}`}>
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
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
