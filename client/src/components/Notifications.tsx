import { Bell, Heart, MessageCircle, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Notification {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'SYSTEM' | 'BADGE';
    content: string;
    createdAt: string;
    read: boolean;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
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
        : 'bg-black/60 border-white/10 shadow-2xl';
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
        // Poll every 30 seconds for new notifications
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
        <div className={`absolute top-12 right-0 w-80 rounded-xl border overflow-hidden z-50 animate-fade-in-up backdrop-blur-xl ${containerStyle}`}>
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
                                onClick={() => {
                                    if (!notification.read) markAsRead(notification.id);
                                }}
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
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {notification.type === 'LIKE' && <Heart className="w-4 h-4 text-red-400" />}
                                            {notification.type === 'COMMENT' && <MessageCircle className="w-4 h-4 text-blue-400" />}
                                            {notification.type === 'BADGE' && <Star className={`w-4 h-4 ${themeIcon}`} />}
                                            {notification.type === 'SYSTEM' && <Bell className="w-4 h-4 text-gray-400" />}
                                        </>
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm leading-tight mb-1 ${contentColor}`}>
                                        {hasActor && <span className={`font-bold ${isMGT ? 'text-white' : 'text-gold-400'}`}>{parsedContent.actor.name} </span>}
                                        {parsedContent.text}
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
                    onClick={() => navigate('/notifications')}
                    className={`text-[10px] ${timeColor} hover:${titleColor} uppercase tracking-widest transition-colors`}
                >
                    Ver todas
                </button>
            </div>
        </div>
    );
}
