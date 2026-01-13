import { useState, useEffect } from 'react';
import { Users, Activity, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface DiscordFriend {
    id: string;
    username: string;
    avatar: string | null;
    status: 'online' | 'idle' | 'dnd' | 'offline';
}

export default function DiscordCard() {
    const { user, theme } = useAuth();
    const [friends, setFriends] = useState<DiscordFriend[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const bgCard = theme === 'light' ? 'bg-white' : 'bg-white/5';
    const borderColor = theme === 'light' ? 'border-gray-200' : 'border-white/10';

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const response = await api.get('/social/connections');
            const discordConnection = response.data.connections.find(
                (c: any) => c.platform === 'DISCORD'
            );
            
            if (discordConnection) {
                setConnected(true);
                await loadFriends();
            }
        } catch (error) {
            console.error('Error checking Discord connection:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFriends = async () => {
        try {
            const response = await api.get('/social/discord/friends');
            setFriends(response.data.friends);
        } catch (error) {
            console.error('Error loading Discord friends:', error);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await api.get('/social/discord/auth');
            // Adicionar userId como state parameter
            const authUrl = `${response.data.authUrl}&state=${user?.id}`;
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error initiating Discord auth:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'idle':
                return 'bg-yellow-500';
            case 'dnd':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getAvatarUrl = (friend: DiscordFriend) => {
        if (!friend.avatar) return 'https://cdn.discordapp.com/embed/avatars/0.png';
        return `https://cdn.discordapp.com/avatars/${friend.id}/${friend.avatar}.png`;
    };

    if (loading) {
        return (
            <div className={`${bgCard} ${borderColor} border rounded-xl p-6 flex items-center justify-center`}>
                <Loader2 className="w-6 h-6 animate-spin text-[#5865F2]" />
            </div>
        );
    }

    if (!connected) {
        return (
            <div className={`${bgCard} ${borderColor} border rounded-xl p-6`}>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold ${textMain} mb-1`}>
                            Conectar Discord
                        </h3>
                        <p className={`text-sm ${textSub} mb-4`}>
                            Veja seus amigos online e o que eles estão jogando
                        </p>
                        <button
                            onClick={handleConnect}
                            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Conectar Discord
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const onlineFriends = friends.filter(f => f.status !== 'offline');

    return (
        <div className={`${bgCard} ${borderColor} border rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textMain}`}>Discord</h3>
                        <p className={`text-sm ${textSub}`}>
                            {onlineFriends.length} amigos online
                        </p>
                    </div>
                </div>
            </div>

            {onlineFriends.length === 0 ? (
                <div className={`text-center py-8 ${textSub}`}>
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum amigo online no momento</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {onlineFriends.map((friend) => (
                        <div
                            key={friend.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'} hover:bg-white/10 transition-colors`}
                        >
                            <div className="relative">
                                <img
                                    src={getAvatarUrl(friend)}
                                    alt={friend.username}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusColor(friend.status)} border-2 ${theme === 'light' ? 'border-white' : 'border-gray-900'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${textMain} truncate`}>
                                    {friend.username}
                                </p>
                                <p className={`text-xs ${textSub} capitalize`}>
                                    {friend.status === 'dnd' ? 'Não perturbe' : friend.status === 'idle' ? 'Ausente' : 'Online'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
