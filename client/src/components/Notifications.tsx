import { Bell, Heart, MessageCircle, Star, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const themeText = isMGT ? 'text-emerald-400' : 'text-gold-400';
    const themeBg = isMGT
        ? (theme === 'light' ? 'bg-red-500/10' : 'bg-red-500/5')
        : (theme === 'light' ? 'bg-gold-500/10' : 'bg-gold-500/5');
    const themeDot = isMGT ? 'bg-emerald-500' : 'bg-gold-500';
    const themeIcon = isMGT ? 'text-emerald-400' : 'text-gold-400';

    // Container Styles
    const containerStyle = theme === 'light'
        ? 'bg-white/90 border-gray-200 shadow-xl'
        : 'bg-black border-white/10 shadow-2xl';
    const headerBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
    const titleColor = theme === 'light' ? 'text-gray-800' : 'text-white';
    const itemBorder = theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-white/5 hover:bg-white/5';
    const contentColor = theme === 'light' ? 'text-gray-700' : 'text-gray-200';
    const timeColor = theme === 'light' ? 'text-gray-500' : 'text-gray-500';
    const footerBg = theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black/20 border-white/10';

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
            
            {/* Desktop: positioned relative to bell icon, Mobile: centered modal */}
            <div className={`
                fixed md:absolute 
                inset-x-4 md:inset-x-auto
                top-20 md:top-12 
                md:right-0 
                w-auto md:w-80 
                max-w-sm md:max-w-none
                mx-auto md:mx-0
                rounded-xl border overflow-hidden z-50 animate-fade-in-up backdrop-blur-xl 
                ${containerStyle}
            `}>
            <div className={`p-4 border-b ${headerBorder} flex justify-between items-center`}>
                <h3 className={`${titleColor} font-serif text-sm tracking-wider`}>Notificações</h3>
                <span onClick={markAllAsRead} className={`text-[10px] ${themeText} uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity`}>Marcar lidas</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className={`p-4 text-center text-xs ${timeColor}`}>Nenhuma notificação</div>
                ) : (
                    notifications.map((notification) => {
                        const parsedContent = parseContent(notification.content);
                        const hasActor = !!parsedContent.actor;

                        return (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 border-b ${itemBorder} transition-colors flex gap-3 cursor-pointer ${!notification.read ? themeBg : ''}`}
                            >
                                <div className="mt-1 shrink-0 relative">
                                    {hasActor ? (
                                        <div className="relative">
                                            <img
                                                src={parsedContent.actor.avatarUrl || `https://ui-avatars.com/api/?name=${parsedContent.actor.name}`}
                                                alt={parsedContent.actor.name}
                                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                                                {notification.type === 'LIKE' && <Heart className="w-3 h-3 text-red-400 fill-current" />}
                                                {notification.type === 'COMMENT' && <MessageCircle className="w-3 h-3 text-blue-400 fill-current" />}
                                                {notification.type === 'MESSAGE' && <MessageCircle className="w-3 h-3 text-emerald-400 fill-current" />}
                                                {notification.type === 'FRIEND_REQUEST' && <UserPlus className="w-3 h-3 text-blue-400" />}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {notification.type === 'LIKE' && <Heart className="w-4 h-4 text-red-400" />}
                                            {notification.type === 'COMMENT' && <MessageCircle className="w-4 h-4 text-blue-400" />}
                                            {notification.type === 'MESSAGE' && <MessageCircle className="w-4 h-4 text-emerald-400" />}
                                            {notification.type === 'FRIEND_REQUEST' && <UserPlus className="w-4 h-4 text-blue-400" />}
                                            {notification.type === 'BADGE' && <Star className={`w-4 h-4 ${themeIcon}`} />}
                                            {notification.type === 'SYSTEM' && <Bell className="w-4 h-4 text-gray-400" />}
                                        </>
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm leading-tight mb-1 ${contentColor}`}>
                                        {hasActor && <span className={`font-bold ${isMGT ? 'text-white' : 'text-gold-400'}`}>{parsedContent.actor.name} </span>}
                                        {parsedContent.title && <span className="font-semibold">{parsedContent.title} </span>}
                                        {parsedContent.message || parsedContent.text}
                                    </p>
                                    <p className={`text-[10px] ${timeColor}`}>{getTimeAgo(notification.createdAt)}</p>
                                </div>
                                {!notification.read && (
                                    <div className={`w-1.5 h-1.5 rounded-full ${themeDot} mt-2 ml-auto shrink-0`} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            <div className={`p-3 text-center border-t ${footerBg}`}>
                <button
                    onClick={() => {
                        onClose?.();
                        navigate('/notifications');
                    }}
                    className={`text-[10px] ${timeColor} hover:${titleColor} uppercase tracking-widest transition-colors`}
                >
                    Ver todas
                </button>
            </div>
        </div>
        </>
    );
}
