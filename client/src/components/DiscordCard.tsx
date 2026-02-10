import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, LogOut } from 'lucide-react';
import Loader from './Loader';
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

// Color mapping from CustomizationShop
const COLOR_MAP: Record<string, string> = {
    'color_gold': '#d4af37',
    'color_rgb': 'rgb-dynamic',
    'color_cyan': '#00ffff',
    'color_magenta': '#ff00ff',
    'color_lime': '#00ff00',
    'color_orange': '#ff6600',
    'color_purple': '#9933ff',
    'color_pink': '#ff69b4',
    'color_blue': '#0066ff',
    'color_red': '#ff0033',
    'color_pastel_pink': '#ffb6c1',
    'color_pastel_lavender': '#e6e6fa',
    'color_pastel_mint': '#98fb98',
    'color_pastel_peach': '#ffdab9',
    'color_pastel_sky': '#87ceeb',
    'color_pastel_coral': '#ffb5a7',
    'color_pastel_lilac': '#dda0dd',
    'color_pastel_sage': '#9dc183',
    'color_pastel_butter': '#fffacd',
    'color_pastel_periwinkle': '#ccccff',
};

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function DiscordCard() {
    const { user, theme, showToast } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
    const [connection, setConnection] = useState<DiscordConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    // Get the actual color hex from user's equipped color ID
    const getUserAccentColor = () => {
        if (!user?.equippedColor) return null;
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        return COLOR_MAP[user.equippedColor] || null;
    };

    // Use user's equipped color or fallback to membership color
    const accentColor = getUserAccentColor() || (isMGT ? '#10b981' : '#d4af37');

    // Theme styles - consistent with RadioCard pattern
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

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
        } catch (error: any) {
            console.error('Error loading Discord guilds:', error);
            // If token expired, mark as disconnected so user can reconnect
            if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
                setConnected(false);
                setConnection(null);
            }
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
                showToast('Você precisa estar logado para conectar o Discord');
                return;
            }

            const response = await api.get('/social/discord/auth');
            // Adicionar userId como state parameter
            const authUrl = `${response.data.authUrl}&state=${user.id}`;
            console.log('Redirecting to Discord OAuth:', authUrl);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error initiating Discord auth:', error);
            showToast('Erro ao iniciar autenticação com Discord');
        }
    };

    const getGuildIcon = (guild: DiscordGuild) => {
        if (!guild.icon) return null;
        return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    };

    if (loading) {
        return (
            <div className={`${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} p-6 flex items-center justify-center transition-all duration-300`}>
                <Loader size="md" />
            </div>
        );
    }

    if (!connected) {
        return (
            <div className={`${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} p-6 transition-all duration-300`}>
                <div className="flex items-start gap-4">
                    <div 
                        className="w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center flex-shrink-0"
                        style={{ 
                            backgroundColor: hexToRgba(accentColor, 0.2),
                            borderColor: hexToRgba(accentColor, 0.3),
                            borderWidth: '1px'
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={accentColor}>
                            <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold ${textMain} mb-1`}>
                            Conectar Discord
                        </h3>
                        <p className={`text-sm ${textSub} mb-4`}>
                            Veja seus servidores e mostre sua presença
                        </p>
                        <button
                            onClick={handleConnect}
                            className="px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2"
                            style={{ 
                                backgroundColor: hexToRgba(accentColor, 0.2),
                                color: accentColor,
                                borderColor: hexToRgba(accentColor, 0.3),
                                borderWidth: '1px'
                            }}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Conectar Discord
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} p-6 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center"
                        style={{ 
                            backgroundColor: hexToRgba(accentColor, 0.2),
                            borderColor: hexToRgba(accentColor, 0.3),
                            borderWidth: '1px'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={accentColor}>
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
                    className="p-2 hover:bg-red-500/10 rounded-xl transition-all duration-300 text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/20"
                    title="Desconectar"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
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
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${theme === 'light' ? 'bg-gray-100/80' : 'bg-white/5'} transition-all duration-300`}
                                style={{ 
                                    borderColor: hexToRgba(accentColor, 0.1),
                                    borderWidth: '1px'
                                }}
                                title={guild.name}
                            >
                                {getGuildIcon(guild) ? (
                                    <img
                                        src={getGuildIcon(guild)!}
                                        alt={guild.name}
                                        className="w-5 h-5 rounded-full"
                                    />
                                ) : (
                                    <div 
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                                        style={{ 
                                            backgroundColor: hexToRgba(accentColor, 0.2),
                                            color: accentColor
                                        }}
                                    >
                                        {guild.name.charAt(0)}
                                    </div>
                                )}
                                <span className={`text-xs ${textMain} truncate max-w-[80px]`}>
                                    {guild.name}
                                </span>
                            </div>
                        ))}
                        {guilds.length > 8 && (
                            <div 
                                className={`px-2.5 py-1.5 rounded-xl ${theme === 'light' ? 'bg-gray-100/80' : 'bg-white/5'} text-xs ${textSub}`}
                                style={{ 
                                    borderColor: hexToRgba(accentColor, 0.1),
                                    borderWidth: '1px'
                                }}
                            >
                                +{guilds.length - 8} mais
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
