import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import ChatWindow from './ChatWindow';
import { playSound } from '../utils/sounds';

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
        equippedProfileBorder?: string | null;
    };
}

interface MessagePopupProps {
    activeChatUserId?: string | null;
}

export default function MessagePopup({ activeChatUserId }: MessagePopupProps) {
    const { user, isVisitor, theme, setActiveChatUserId } = useAuth();
    const { tierStdName, tierVipName } = useCommunity();
    const [unreadMessage, setUnreadMessage] = useState<UnreadMessage | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [showChat, setShowChat] = useState(false);
    // State for external chat open (from UserPresenceCard)
    const [externalChatUser, setExternalChatUser] = useState<{ id: string; name: string; avatarUrl?: string } | null>(null);
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

    // Open chat when activeChatUserId is set from outside (e.g., UserPresenceCard)
    useEffect(() => {
        if (activeChatUserId && activeChatUserId !== externalChatUser?.id) {
            // Fetch user info and open chat
            const fetchUserAndOpenChat = async () => {
                try {
                    const response = await api.get(`/users/${activeChatUserId}`);
                    setExternalChatUser({
                        id: activeChatUserId,
                        name: response.data.displayName || response.data.name,
                        avatarUrl: response.data.avatarUrl
                    });
                    setShowChat(true);
                    setIsVisible(false); // Hide any notification popup
                } catch (error) {
                    console.error('[MessagePopup] Failed to fetch user for chat:', error);
                    // Still try to open chat with minimal info
                    setExternalChatUser({
                        id: activeChatUserId,
                        name: 'Usuário',
                        avatarUrl: undefined
                    });
                    setShowChat(true);
                }
            };
            fetchUserAndOpenChat();
        }
    }, [activeChatUserId]);

    useEffect(() => {
        // Don't run any polling if user is not logged in
        if (isVisitor || !user?.id) {
            // Clear any existing popup
            setIsVisible(false);
            setUnreadMessage(null);
            return;
        }

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
                
                // Play notification sound
                playSound('notification');

                if (autoDismissTimer.current) {
                    clearTimeout(autoDismissTimer.current);
                }
                // Auto-dismiss after 15 seconds
                autoDismissTimer.current = setTimeout(() => {
                    setIsVisible(false);
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
        setExternalChatUser(null);
        setActiveChatUserId(null); // Clear the active chat context
        lastNotifId.current = null;
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        if (unreadMessage?.id) {
            dismissedNotifIds.current.add(unreadMessage.id);
        }
    };

    const themeBg = theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeSubtext = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const avatarBorder = isSenderMGT ? 'border-tier-std-500' : 'border-gold-500';

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
            {/* Chat Window - from notification */}
            {showChat && unreadMessage && !externalChatUser && (
                <ChatWindow
                    otherUserId={unreadMessage.senderId}
                    otherUserName={unreadMessage.sender.name}
                    otherUserAvatar={unreadMessage.sender.avatarUrl}
                    otherUserMembershipType={unreadMessage.sender.membershipType}
                    otherUserProfileBorder={unreadMessage.sender.equippedProfileBorder}
                    onClose={handleCloseChat}
                />
            )}
            
            {/* Chat Window - from external (UserPresenceCard) */}
            {showChat && externalChatUser && (
                <ChatWindow
                    otherUserId={externalChatUser.id}
                    otherUserName={externalChatUser.name}
                    otherUserAvatar={externalChatUser.avatarUrl}
                    onClose={handleCloseChat}
                />
            )}

            {/* Notification Popup */}
            <AnimatePresence>
                {isVisible && unreadMessage && !showChat && (
                    <>
                        {/* Both Mobile and Desktop: Full Card */}
                        <motion.div
                            initial={{ opacity: 0, y: isMobile ? -100 : 100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: isMobile ? -50 : 50, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={`fixed z-[100] ${
                                isMobile 
                                    ? 'top-4 left-4 right-4 max-w-md mx-auto' 
                                    : 'bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)]'
                            }`}
                        >
                            <div 
                                onClick={handleOpenChat}
                                className={`${themeBg} rounded-2xl border ${isSenderMGT ? 'border-tier-std-500/30' : 'border-gold-500/30'} shadow-2xl backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl group`}
                            >
                                {/* Top Accent Line */}
                                <div className={`h-1 bg-gradient-to-r ${isSenderMGT ? 'from-tier-std-600 via-tier-std-400 to-tier-std-600' : 'from-gold-600 via-gold-400 to-gold-600'}`} />
                                
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
                                            <div className={`absolute -bottom-1 -right-1 ${isSenderMGT ? 'bg-tier-std-600' : 'bg-amber-600'} rounded-full p-1 border-2 ${theme === 'light' ? 'border-white' : 'border-black'}`}>
                                                <MessageCircle className="w-2.5 h-2.5 text-white fill-current" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold ${themeText} truncate text-sm`}>{unreadMessage.sender.name}</h4>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSenderMGT ? 'bg-tier-std-500/20 text-tier-std-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                                        {isSenderMGT ? tierStdName : tierVipName}
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
                                        <span className={`text-xs font-medium ${isSenderMGT ? 'text-tier-std-400' : 'text-gold-400'}`}>
                                            Toque para responder →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
