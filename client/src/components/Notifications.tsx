import { Bell, Heart, MessageCircle, Star, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatWindow from './ChatWindow';

interface Notification {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'SYSTEM' | 'BADGE' | 'MESSAGE' | 'FRIEND_REQUEST';
    content: string;
    createdAt: string;
    read: boolean;
}

interface ChatUser {
    id: string;
    name: string;
    avatarUrl: string | null;
    membershipType?: 'MAGAZINE' | 'MGT';
    equippedProfileBorder?: string | null;
}

interface NotificationsProps {
    onClose?: () => void;
}

export default function Notifications({ onClose }: NotificationsProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [chatUser, setChatUser] = useState<ChatUser | null>(null);
    const navigate = useNavigate();
    const { user, theme, accentColor } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const userAccent = accentColor || defaultAccent;

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/notifications');
                setNotifications(response.data);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        fetchNotifications();
        // Poll every 30 seconds for new notifications (real-time updates)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/all/read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        const parsedContent = parseContent(notification.content);

        // Handle different notification types
        switch (notification.type) {
            case 'MESSAGE':
                // Open chat with the sender - Close notifications first
                if (parsedContent.actor) {
                    onClose?.(); // Close notifications dropdown first
                    setChatUser({
                        id: parsedContent.actor.id,
                        name: parsedContent.actor.name,
                        avatarUrl: parsedContent.actor.avatarUrl,
                        membershipType: parsedContent.actor.membershipType
                    });
                }
                break;

            case 'LIKE':
            case 'COMMENT':
                // Navigate to the post
                if (parsedContent.postId) {
                    onClose?.();
                    navigate(`/feed?postId=${parsedContent.postId}`);
                }
                break;

            case 'FRIEND_REQUEST':
                // Navigate to the requester's profile or friends page
                if (parsedContent.actor?.id) {
                    onClose?.();
                    navigate(`/profile/${parsedContent.actor.id}`);
                } else {
                    onClose?.();
                    navigate('/profile?tab=friends');
                }
                break;

            case 'BADGE':
                // Navigate to profile badges section
                onClose?.();
                navigate('/profile?tab=badges');
                break;

            case 'SYSTEM':
                // System notifications may have different contexts
                if (parsedContent.postId) {
                    onClose?.();
                    navigate(`/feed?postId=${parsedContent.postId}`);
                } else if (parsedContent.actor?.id) {
                    onClose?.();
                    navigate(`/profile/${parsedContent.actor.id}`);
                }
                // Otherwise just mark as read, no navigation
                break;

            default:
                break;
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Agora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    const parseContent = (content: string) => {
        try {
            return JSON.parse(content);
        } catch {
            return { text: content };
        }
    };

    return (
        <>
            {/* Chat Window for MESSAGE notifications - Rendered via portal to avoid z-index issues */}
            {chatUser && createPortal(
                <ChatWindow
                    otherUserId={chatUser.id}
                    otherUserName={chatUser.name}
                    otherUserAvatar={chatUser.avatarUrl}
                    otherUserMembershipType={chatUser.membershipType}
                    otherUserProfileBorder={chatUser.equippedProfileBorder}
                    onClose={() => setChatUser(null)}
                />,
                document.body
            )}
            
            {/* Desktop: Glass morphism dropdown, Mobile: Full-width slide-in panel */}
            <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="fixed md:absolute inset-x-4 md:inset-x-auto top-20 md:top-12 md:right-0 w-auto md:w-96 max-w-sm md:max-w-none mx-auto md:mx-0 rounded-2xl overflow-hidden z-50"
                style={{
                    background: theme === 'light'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(25,25,30,0.98) 0%, rgba(15,15,20,0.95) 100%)',
                    boxShadow: `0 25px 50px -12px rgba(0,0,0,0.4), 0 0 30px ${userAccent}10, inset 0 0 0 1px ${theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    backdropFilter: 'blur(20px)'
                }}
            >
                {/* Accent glow */}
                <div 
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at top center, ${userAccent}20, transparent 60%)`
                    }}
                />

                {/* Header */}
                <div 
                    className="relative p-4 flex justify-between items-center"
                    style={{ borderBottom: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}
                >
                    <div className="flex items-center gap-2">
                        <div 
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: `${userAccent}20` }}
                        >
                            <Bell className="w-4 h-4" style={{ color: userAccent }} />
                        </div>
                        <h3 className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Notificações
                        </h3>
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span 
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black"
                                style={{ backgroundColor: userAccent }}
                            >
                                {notifications.filter(n => !n.read).length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={markAllAsRead}
                            className="text-xs font-medium transition-colors"
                            style={{ color: userAccent }}
                        >
                            Marcar lidas
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className={`p-1.5 rounded-full transition-colors md:hidden ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                        >
                            <X className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                        </motion.button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className={`p-8 text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {notifications.map((notification, index) => {
                                const parsedContent = parseContent(notification.content);
                                const hasActor = !!parsedContent.actor;

                                const getTypeIcon = () => {
                                    switch (notification.type) {
                                        case 'LIKE': return <Heart className="w-3 h-3 text-red-400 fill-current" />;
                                        case 'COMMENT': return <MessageCircle className="w-3 h-3 text-blue-400 fill-current" />;
                                        case 'MESSAGE': return <MessageCircle className="w-3 h-3 text-emerald-400 fill-current" />;
                                        case 'FRIEND_REQUEST': return <UserPlus className="w-3 h-3 text-purple-400" />;
                                        case 'BADGE': return <Star className="w-3 h-3" style={{ color: userAccent }} />;
                                        default: return <Bell className="w-3 h-3 text-gray-400" />;
                                    }
                                };

                                return (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`relative p-4 cursor-pointer transition-all duration-200 ${
                                            theme === 'light' 
                                                ? 'hover:bg-gray-50' 
                                                : 'hover:bg-white/5'
                                        }`}
                                        style={{
                                            borderBottom: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                                            background: !notification.read 
                                                ? (theme === 'light' ? `${userAccent}08` : `${userAccent}10`)
                                                : 'transparent'
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            {/* Avatar or Icon */}
                                            <div className="relative shrink-0">
                                                {hasActor ? (
                                                    <div className="relative">
                                                        <img
                                                            src={parsedContent.actor.avatarUrl || `https://ui-avatars.com/api/?name=${parsedContent.actor.name}`}
                                                            alt={parsedContent.actor.name}
                                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                                                        />
                                                        <div 
                                                            className="absolute -bottom-1 -right-1 p-1 rounded-full"
                                                            style={{ 
                                                                backgroundColor: theme === 'light' ? '#fff' : '#1a1a1a',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                                            }}
                                                        >
                                                            {getTypeIcon()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: `${userAccent}20` }}
                                                    >
                                                        {getTypeIcon()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-snug ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                                    {hasActor && (
                                                        <span className="font-semibold" style={{ color: userAccent }}>
                                                            {parsedContent.actor.name}{' '}
                                                        </span>
                                                    )}
                                                    {parsedContent.title && <span className="font-medium">{parsedContent.title} </span>}
                                                    <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                                                        {parsedContent.message || parsedContent.text}
                                                    </span>
                                                </p>
                                                <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {getTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>

                                            {/* Unread indicator */}
                                            {!notification.read && (
                                                <div 
                                                    className="w-2 h-2 rounded-full shrink-0 mt-2"
                                                    style={{ backgroundColor: userAccent }}
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div 
                    className="relative p-3 text-center"
                    style={{ 
                        borderTop: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                        background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                    }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            onClose?.();
                            navigate('/notifications');
                        }}
                        className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
                            theme === 'light' 
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                                : 'bg-white/5 hover:bg-white/10 text-white'
                        }`}
                    >
                        Ver todas as notificações
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
}
