import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UnreadMessage {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

export default function MessagePopup() {
    const { user, isVisitor, theme } = useAuth();
    const navigate = useNavigate();
    const [unreadMessage, setUnreadMessage] = useState<UnreadMessage | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isVisitor || !user) return;

        const checkUnreadMessages = async () => {
            try {
                const response = await api.get('/notifications');
                const notifications = response.data;
                const messageNotif = notifications.find((n: any) => n.type === 'MESSAGE' && !n.read);

                if (messageNotif) {
                    const content = JSON.parse(messageNotif.content);
                    setUnreadMessage({
                        id: messageNotif.id,
                        senderId: content.actor.id,
                        content: content.text,
                        createdAt: messageNotif.createdAt,
                        sender: content.actor
                    });
                    setIsVisible(true);
                }
            } catch (error) {
                console.error('Failed to check messages', error);
            }
        };

        const interval = setInterval(checkUnreadMessages, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [user, isVisitor]);

    const isMGT = user?.membershipType === 'MGT';

    if (!isVisible || !unreadMessage) return null;

    const handleOpenChat = () => {
        navigate(`/profile?id=${unreadMessage.senderId}&chat=true`);
        setIsVisible(false);
    };

    const themeBg = theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/10 backdrop-blur-xl border-white/20';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeSubText = theme === 'light' ? 'text-gray-500' : 'text-gray-300';
    const themeHover = theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/20';

    // MGT Colors
    const avatarBorder = isMGT ? 'border-emerald-500' : 'border-gold-500';
    const iconBg = isMGT ? 'bg-emerald-600' : 'bg-blue-500';

    return (
        <div className="fixed bottom-24 right-4 z-50 animate-fade-in-up">
            <div className="relative group">
                <button
                    onClick={() => setIsVisible(false)}
                    aria-label="Fechar notificação"
                    className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-white/10"
                >
                    <X className="w-3 h-3" />
                </button>

                <div
                    onClick={handleOpenChat}
                    className={`flex items-center gap-3 ${themeBg} border p-3 rounded-2xl shadow-2xl cursor-pointer ${themeHover} transition-all max-w-xs`}
                >
                    <div className="relative shrink-0">
                        <img
                            src={unreadMessage.sender.avatarUrl || `https://ui-avatars.com/api/?name=${unreadMessage.sender.name}`}
                            alt={unreadMessage.sender.name}
                            className={`w-12 h-12 rounded-full object-cover border-2 ${avatarBorder}`}
                        />
                        <div className={`absolute -bottom-1 -right-1 ${iconBg} rounded-full p-1 border-2 border-black`}>
                            <MessageCircle className="w-3 h-3 text-white fill-current" />
                        </div>
                    </div>

                    <div className="overflow-hidden">
                        <h4 className="text-white font-bold text-sm truncate">{unreadMessage.sender.name}</h4>
                        <p className="text-gray-300 text-xs truncate">{unreadMessage.content}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
