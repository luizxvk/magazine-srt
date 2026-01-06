import { useEffect, useState } from 'react';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import api from '../services/api';
import { Bell, Heart, MessageCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModernLoader from '../components/ModernLoader';

interface Notification {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'SYSTEM' | 'BADGE';
    content: string;
    createdAt: string;
    read: boolean;
    postId?: string; // Optional, if the notification is related to a post
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';


    const themeText = isMGT ? 'text-emerald-400' : 'text-gold-400';
    const themeBg = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';
    const themeBorder = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';
    const themeHoverBorder = isMGT ? 'hover:border-red-500/30' : 'hover:border-gold-500/30';
    const themeShadow = isMGT ? 'shadow-[0_0_15px_rgba(220,20,60,0.1)]' : 'shadow-[0_0_15px_rgba(212,175,55,0.1)]';
    const themeIconBg = isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20';
    const themeDot = isMGT ? 'bg-emerald-500 shadow-[0_0_10px_#DC143C]' : 'bg-gold-500 shadow-[0_0_10px_#D4AF37]';
    const themeLoading = isMGT ? 'text-emerald-500/50' : 'text-gold-500/50';
    const themeEmptyIcon = isMGT ? 'text-emerald-500/30' : 'text-gold-500/30';

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/notifications');
                setNotifications(response.data);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
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

        // If it's a post-related notification (Like/Comment)
        if ((notification.type === 'LIKE' || notification.type === 'COMMENT') && parsedContent.postId) {
            try {
                // Check if post exists
                await api.get(`/posts/${parsedContent.postId}`);
                navigate(`/feed?postId=${parsedContent.postId}`);
            } catch (error) {
                // If 404 or other error, assume deleted
                navigate('/post-deleted');
            }
        } else if (notification.type === 'BADGE') {
            navigate('/profile');
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
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
            <LuxuriousBackground />
            <Header />

            <div className="max-w-4xl mx-auto pt-48 pb-20 px-4 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 ${themeBg} rounded-xl border ${themeBorder}`}>
                            <Bell className={`w-8 h-8 ${themeText}`} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white">Notificações</h1>
                            <p className="text-gray-400">Suas atualizações e interações recentes.</p>
                        </div>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={markAllAsRead}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${themeBorder} hover:bg-white/5 transition-colors ${themeText}`}
                        >
                            Marcar todas como lidas
                        </button>
                    )}
                </div>

                {loading ? (
                    <ModernLoader text="Carregando notificações..." />
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm animate-fade-in">
                        <Bell className={`w-12 h-12 ${themeEmptyIcon} mx-auto mb-4`} />
                        <p className="text-gray-400 font-serif text-xl">Sem notificações no momento</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                        {notifications.map((notification) => {
                            const parsedContent = parseContent(notification.content);
                            const hasActor = !!parsedContent.actor;

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`
                                        glass-panel p-6 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start group
                                        ${!notification.read ? `${themeBorder} ${themeShadow}` : 'border-white/5 hover:border-white/20'}
                                        ${themeHoverBorder}
                                    `}
                                >
                                    <div className="shrink-0 relative">
                                        {hasActor ? (
                                            <div className="relative">
                                                <img
                                                    src={parsedContent.actor.avatarUrl || `https://ui-avatars.com/api/?name=${parsedContent.actor.name}`}
                                                    alt={parsedContent.actor.name}
                                                    className={`w-12 h-12 rounded-full object-cover border ${themeBorder}`}
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-black">
                                                    {notification.type === 'LIKE' && <Heart className="w-3 h-3 text-red-400 fill-current" />}
                                                    {notification.type === 'COMMENT' && <MessageCircle className="w-3 h-3 text-blue-400 fill-current" />}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`p-3 rounded-full ${!notification.read ? `${themeIconBg} ${themeText}` : 'bg-white/5 text-gray-400'}`}>
                                                {notification.type === 'LIKE' && <Heart className="w-6 h-6" />}
                                                {notification.type === 'COMMENT' && <MessageCircle className="w-6 h-6" />}
                                                {notification.type === 'BADGE' && <Star className="w-6 h-6" />}
                                                {notification.type === 'SYSTEM' && <Bell className="w-6 h-6" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-lg leading-snug mb-1 ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                            {hasActor && <span className={`font-bold ${isMGT ? 'text-white' : 'text-gold-400'}`}>{parsedContent.actor.name} </span>}
                                            {parsedContent.text}
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium tracking-wider uppercase flex items-center gap-2">
                                            {getTimeAgo(notification.createdAt)}
                                            {!notification.read && (
                                                <span className={`w-2 h-2 rounded-full ${themeDot} animate-pulse`} />
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
