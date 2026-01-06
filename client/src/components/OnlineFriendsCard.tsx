import { useState, useEffect } from 'react';
import { MessageCircle, User, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ChatWindow from './ChatWindow';

interface OnlineFriend {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    isOnline: boolean;
    lastSeenAt?: string;
    membershipType?: string;
}

interface OnlineFriendsCardProps {
    maxDisplay?: number;
}

export default function OnlineFriendsCard({ maxDisplay = 5 }: OnlineFriendsCardProps) {
    const { user, theme } = useAuth();
    const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatOpen, setChatOpen] = useState<OnlineFriend | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeAccent = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeBg = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';
    const themeGlow = isMGT
        ? 'shadow-[0_0_20px_rgba(16,185,129,0.15)]'
        : 'shadow-[0_0_20px_rgba(212,175,55,0.15)]';
    const bgColor = theme === 'light' ? 'bg-white/80' : 'bg-white/5';

    useEffect(() => {
        const fetchOnlineFriends = async () => {
            try {
                const response = await api.get('/social/friends/online');
                setOnlineFriends(response.data);
            } catch (error) {
                console.error('Failed to fetch online friends', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOnlineFriends();
        // Refresh every 30 seconds
        const interval = setInterval(fetchOnlineFriends, 30000);
        return () => clearInterval(interval);
    }, []);

    // Send heartbeat to keep user online
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                await api.post('/social/heartbeat');
            } catch (error) {
                console.error('Heartbeat failed', error);
            }
        };

        sendHeartbeat();
        // Send heartbeat every 2 minutes
        const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const displayFriends = onlineFriends.slice(0, maxDisplay);
    const remaining = onlineFriends.length - maxDisplay;

    const getTimeAgo = (lastSeenAt?: string) => {
        if (!lastSeenAt) return '';
        const minutes = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60000);
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h`;
    };

    if (loading) {
        return (
            <div className={`rounded-2xl border ${themeBorder} ${bgColor} backdrop-blur-xl ${themeGlow} p-4`}>
                <div className="flex items-center gap-2 mb-4">
                    <Wifi className={`w-4 h-4 ${themeAccent}`} />
                    <h3 className={`font-serif text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Amigos Online
                    </h3>
                </div>
                <div className="flex gap-2 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full bg-white/10" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`rounded-2xl border ${themeBorder} ${bgColor} backdrop-blur-xl ${themeGlow} overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Wifi className={`w-4 h-4 ${themeAccent}`} />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <h3 className={`font-serif text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Amigos Online
                        </h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${themeBg} ${themeAccent}`}>
                        {onlineFriends.length}
                    </span>
                </div>

                {/* Friends List */}
                <div className="p-4">
                    {onlineFriends.length === 0 ? (
                        <div className="text-center py-4">
                            <Wifi className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                            <p className="text-gray-500 text-sm">Nenhum amigo online</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {displayFriends.map((friend) => {
                                const friendMGT = friend.membershipType === 'MGT';
                                return (
                                    <div
                                        key={friend.id}
                                        className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {friend.avatarUrl ? (
                                                    <img
                                                        src={friend.avatarUrl}
                                                        alt={friend.displayName || friend.name}
                                                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                                                    />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeBg}`}>
                                                        <User className={`w-5 h-5 ${themeAccent}`} />
                                                    </div>
                                                )}
                                                {/* Online indicator */}
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                    {friend.displayName || friend.name}
                                                </p>
                                                <p className={`text-[10px] uppercase tracking-wider ${friendMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                                                    {friendMGT ? 'MGT' : 'MAGAZINE'} • {friend.isOnline ? 'online' : getTimeAgo(friend.lastSeenAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setChatOpen(friend)}
                                            className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${friendMGT ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-gold-500/20 text-gold-400 hover:bg-gold-500/30'}`}
                                            title="Enviar mensagem"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                            {remaining > 0 && (
                                <p className="text-center text-xs text-gray-500 pt-2">
                                    +{remaining} amigo{remaining > 1 ? 's' : ''} online
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            {chatOpen && (
                <ChatWindow
                    otherUserId={chatOpen.id}
                    otherUserName={chatOpen.displayName || chatOpen.name}
                    otherUserAvatar={chatOpen.avatarUrl}
                    otherUserMembershipType={chatOpen.membershipType}
                    onClose={() => setChatOpen(null)}
                />
            )}
        </>
    );
}
