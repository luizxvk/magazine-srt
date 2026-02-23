import { useState, useEffect } from 'react';
import { Gamepad2, ExternalLink } from 'lucide-react';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import api from '../services/api';

interface SteamActivity {
    steamId: string;
    username: string;
    avatar: string;
    gameName: string;
    gameId: string;
    status: 'playing';
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

export default function SteamCard() {
    const { user, theme } = useAuth();
    const { getAccentColor } = useTierColors();
    const isMGT = user?.membershipType === 'MGT';
    const [activities, setActivities] = useState<SteamActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    // Get the actual color hex from user's equipped color ID
    const getUserAccentColor = () => {
        if (!user?.equippedColor) return null;
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        return COLOR_MAP[user.equippedColor] || null;
    };

    // Use user's equipped color or fallback to membership color
    const accentColor = getUserAccentColor() || getAccentColor(isMGT);

    // Theme styles - consistent with RadioCard pattern
    const themeBorder = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(var(--tier-std-color-rgb),0.15)] hover:shadow-[0_0_20px_rgba(var(--tier-std-color-rgb),0.25)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-tier-std-950/30' : 'bg-black/30');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const response = await api.get('/social/connections');
            const steamConnection = response.data.connections.find(
                (c: any) => c.platform === 'STEAM'
            );
            
            if (steamConnection) {
                setConnected(true);
                await loadActivities();
            }
        } catch (error) {
            console.error('Error checking Steam connection:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadActivities = async () => {
        try {
            const response = await api.get('/social/steam/activities');
            setActivities(response.data.activities);
        } catch (error) {
            console.error('Error loading Steam activities:', error);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await api.get('/social/steam/auth');
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error('Error initiating Steam auth:', error);
        }
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
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold ${textMain} mb-1`}>
                            Conectar Steam
                        </h3>
                        <p className={`text-sm ${textSub} mb-4`}>
                            Compartilhe o que você está jogando e veja seus amigos
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
                            Conectar Steam
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
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textMain}`}>Steam</h3>
                        <p className={`text-sm ${textSub}`}>
                            {activities.length} amigos jogando
                        </p>
                    </div>
                </div>
            </div>

            {activities.length === 0 ? (
                <div className={`text-center py-8 ${textSub}`}>
                    <Gamepad2 className="w-12 h-12 mx-auto mb-2 opacity-50" style={{ color: accentColor }} />
                    <p>Nenhum amigo jogando no momento</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {activities.map((activity) => (
                        <div
                            key={activity.steamId}
                            className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'light' ? 'bg-gray-50/80' : 'bg-white/5'} transition-all duration-300`}
                            style={{ 
                                borderColor: hexToRgba(accentColor, 0.1),
                                borderWidth: '1px'
                            }}
                        >
                            <img
                                src={activity.avatar}
                                alt={activity.username}
                                className="w-10 h-10 rounded-full"
                                style={{ 
                                    borderColor: hexToRgba(accentColor, 0.2),
                                    borderWidth: '1px'
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${textMain} truncate`}>
                                    {activity.username}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Gamepad2 className="w-3 h-3 text-green-500" />
                                    <p className={`text-xs ${textSub} truncate`}>
                                        {activity.gameName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
