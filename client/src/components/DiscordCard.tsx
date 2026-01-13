import { useState, useEffect } from 'react';
import { Users, ExternalLink, Loader2, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
}

interface DiscordConnection {
    platformUsername: string;
    metadata?: {
        avatar?: string;
    };
}

export default function DiscordCard() {
    const { user, theme } = useAuth();
    const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
    const [connection, setConnection] = useState<DiscordConnection | null>(null);
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
                setConnection(discordConnection);
                await loadGuilds();
            }
        } catch (error) {
            console.error('Error checking Discord connection:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGuilds = async () => {
        try {
            const response = await api.get('/social/discord/guilds');
            setGuilds(response.data.guilds || []);
        } catch (error) {
            console.error('Error loading Discord guilds:', error);
        }
    };

    const handleDisconnect = async () => {
        try {
            await api.delete('/social/disconnect/DISCORD');
            setConnected(false);
            setConnection(null);
            setGuilds([]);
        } catch (error) {
            console.error('Error disconnecting Discord:', error);
        }
    };

    const handleConnect = async () => {
        try {
            if (!user?.id) {
                console.error('User not logged in');
                alert('Você precisa estar logado para conectar o Discord');
                return;
            }

            const response = await api.get('/social/discord/auth');
            // Adicionar userId como state parameter
            const authUrl = `${response.data.authUrl}&state=${user.id}`;
            console.log('Redirecting to Discord OAuth:', authUrl);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error initiating Discord auth:', error);
            alert('Erro ao iniciar autenticação com Discord');
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

    const getGuildIcon = (guild: DiscordGuild) => {
        if (!guild.icon) return null;
        return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
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

    const onlineFriends = guilds; // usando guilds agora

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
                            @{connection?.platformUsername || 'Conectado'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDisconnect}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                    title="Desconectar"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className={`text-sm ${textMain}`}>Conta conectada com sucesso!</span>
            </div>

            {guilds.length > 0 && (
                <div>
                    <p className={`text-xs ${textSub} mb-2`}>Seus servidores ({guilds.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {guilds.slice(0, 8).map((guild) => (
                            <div
                                key={guild.id}
                                className={`flex items-center gap-2 px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}
                                title={guild.name}
                            >
                                {getGuildIcon(guild) ? (
                                    <img
                                        src={getGuildIcon(guild)!}
                                        alt={guild.name}
                                        className="w-5 h-5 rounded-full"
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs">
                                        {guild.name.charAt(0)}
                                    </div>
                                )}
                                <span className={`text-xs ${textMain} truncate max-w-[80px]`}>
                                    {guild.name}
                                </span>
                            </div>
                        ))}
                        {guilds.length > 8 && (
                            <div className={`px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} text-xs ${textSub}`}>
                                +{guilds.length - 8} mais
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
