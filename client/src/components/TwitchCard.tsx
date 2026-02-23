import { useState, useEffect, useRef, useCallback } from 'react';
import { Tv, Eye, ExternalLink, CheckCircle, LogOut, Link, Volume2, VolumeX } from 'lucide-react';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface TwitchStream {
    userId: string;
    username: string;
    displayName: string;
    gameName: string;
    title: string;
    viewerCount: number;
    thumbnailUrl: string;
    isLive: boolean;
    streamUrl: string;
}

interface TwitchConnection {
    platformUsername: string;
    metadata?: {
        avatar?: string;
        login?: string;
    };
}

interface TwitchCardProps {
    usernames?: string[]; // Default Twitch usernames to monitor when not connected
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

// Sub-component for individual stream cards with hover preview
function StreamCard({ stream, accentColor, textMain, textSub, theme }: {
    stream: TwitchStream;
    accentColor: string;
    textMain: string;
    textSub: string;
    theme: string;
}) {
    const [showPreview, setShowPreview] = useState(false);
    const [muted, setMuted] = useState(true);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const handleMouseEnter = useCallback(() => {
        hoverTimeout.current = setTimeout(() => setShowPreview(true), 800);
    }, []);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(hoverTimeout.current);
        setShowPreview(false);
        setMuted(true);
    }, []);

    const parentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    return (
        <div
            className={`block rounded-xl overflow-hidden ${theme === 'light' ? 'bg-gray-50/80' : 'bg-white/5'} transition-all duration-300 group`}
            style={{
                borderColor: hexToRgba(accentColor, 0.1),
                borderWidth: '1px'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Thumbnail / Live Preview */}
            <div className="relative aspect-video">
                {showPreview ? (
                    <iframe
                        src={`https://player.twitch.tv/?channel=${stream.username}&parent=${parentHost}&muted=${muted}`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                    />
                ) : (
                    <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 z-10">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    AO VIVO
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    {showPreview && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMuted(!muted);
                            }}
                            className="bg-black/70 hover:bg-black/90 text-white p-1.5 rounded transition-colors"
                            title={muted ? 'Ativar som' : 'Mutar'}
                        >
                            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    <div className="bg-black/70 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {stream.viewerCount.toLocaleString('pt-BR')}
                    </div>
                </div>
                {!showPreview && (
                    <a
                        href={stream.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
                    >
                        <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
            </div>

            {/* Info */}
            <a href={stream.streamUrl} target="_blank" rel="noopener noreferrer" className="block p-3">
                <h4 className={`font-medium ${textMain} text-sm mb-1 line-clamp-2`}>
                    {stream.title}
                </h4>
                <p className={`text-xs ${textSub} mb-0.5`}>
                    {stream.displayName}
                </p>
                <p className={`text-xs ${textSub}`}>
                    {stream.gameName}
                </p>
            </a>
        </div>
    );
}

export default function TwitchCard({ usernames = ['gaules', 'alanzoka', 'loud_coringa'] }: TwitchCardProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [streams, setStreams] = useState<TwitchStream[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [connection, setConnection] = useState<TwitchConnection | null>(null);
    const [connecting, setConnecting] = useState(false);

    // Get the actual color hex from user's equipped color ID
    const getUserAccentColor = () => {
        if (!user?.equippedColor) return null;
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        return COLOR_MAP[user.equippedColor] || null;
    };

    // Use user's equipped color or fallback to membership color
    const accentColor = getUserAccentColor() || (isMGT ? '#10b981' : '#d4af37');

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
        loadStreams();
        const interval = setInterval(loadStreams, 60000);
        return () => clearInterval(interval);
    }, [usernames]);

    const checkConnection = async () => {
        try {
            const { data } = await api.get('/social/connections');
            const twitch = data.connections?.find((c: any) => c.platform === 'TWITCH');
            if (twitch) {
                setConnected(true);
                setConnection(twitch);
            }
        } catch {}
    };

    const loadStreams = async () => {
        try {
            const allStreams: TwitchStream[] = [];
            const seenUserIds = new Set<string>();

            // Always load admin-configured channels first
            try {
                const adminResponse = await api.get('/social/twitch/streams', {
                    params: { usernames: usernames.join(',') },
                });
                if (adminResponse.data.streams?.length > 0) {
                    for (const stream of adminResponse.data.streams) {
                        if (!seenUserIds.has(stream.userId)) {
                            allStreams.push(stream);
                            seenUserIds.add(stream.userId);
                        }
                    }
                }
            } catch {}

            // Then add followed streams if connected (avoiding duplicates)
            try {
                const followedResponse = await api.get('/social/twitch/followed');
                if (followedResponse.data.streams?.length > 0) {
                    for (const stream of followedResponse.data.streams) {
                        if (!seenUserIds.has(stream.userId)) {
                            allStreams.push(stream);
                            seenUserIds.add(stream.userId);
                        }
                    }
                }
            } catch {}

            setStreams(allStreams);
        } catch (error) {
            console.error('Error loading Twitch streams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            setConnecting(true);
            const { data } = await api.get('/social/twitch/auth');
            window.location.href = data.authUrl;
        } catch (error) {
            console.error('Error connecting Twitch:', error);
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await api.delete('/social/disconnect/twitch');
            setConnected(false);
            setConnection(null);
            loadStreams();
        } catch (error) {
            console.error('Error disconnecting Twitch:', error);
        }
    };

    if (loading) {
        return (
            <div className={`${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} p-6 flex items-center justify-center transition-all duration-300`}>
                <Loader size="md" />
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
                            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textMain}`}>Twitch</h3>
                        <p className={`text-sm ${textSub}`}>
                            {connected 
                                ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" />{connection?.platformUsername}</span>
                                : `${streams.length} streams ao vivo`}
                        </p>
                    </div>
                </div>

                {/* Connect / Disconnect button */}
                {connected ? (
                    <button
                        onClick={handleDisconnect}
                        className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-500/10 text-red-400'}`}
                        title="Desconectar"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                            backgroundColor: hexToRgba(accentColor, 0.15),
                            color: accentColor,
                            borderColor: hexToRgba(accentColor, 0.3),
                            borderWidth: '1px',
                        }}
                    >
                        <Link className="w-3.5 h-3.5" />
                        {connecting ? 'Conectando...' : 'Conectar'}
                    </button>
                )}
            </div>

            {streams.length === 0 ? (
                <div className={`text-center py-8 ${textSub}`}>
                    <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: accentColor }} />
                    {/* Show connect prompt only if no admin channels AND not connected */}
                    {!connected && usernames.length === 0 ? (
                        <>
                            <p className="mb-4">Conecte sua conta para ver streams ao vivo</p>
                            <button
                                onClick={handleConnect}
                                disabled={connecting}
                                className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                                style={{
                                    backgroundColor: accentColor,
                                    color: '#000',
                                }}
                            >
                                <Link className="w-4 h-4" />
                                {connecting ? 'Conectando...' : 'Conectar Twitch'}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="mb-2">Nenhuma stream ao vivo no momento</p>
                            <p className="text-xs opacity-60">
                                {usernames.length > 0 && `Monitorando: ${usernames.slice(0, 3).join(', ')}${usernames.length > 3 ? '...' : ''}`}
                            </p>
                            {!connected && (
                                <button
                                    onClick={handleConnect}
                                    disabled={connecting}
                                    className="mt-4 flex items-center gap-2 mx-auto px-3 py-2 rounded-lg text-xs font-medium transition-all opacity-70 hover:opacity-100"
                                    style={{
                                        backgroundColor: hexToRgba(accentColor, 0.15),
                                        color: accentColor,
                                    }}
                                >
                                    <Link className="w-3.5 h-3.5" />
                                    Conectar para ver seus seguidos
                                </button>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {streams.map((stream) => (
                        <StreamCard key={stream.userId} stream={stream} accentColor={accentColor} textMain={textMain} textSub={textSub} theme={theme} />
                    ))}
                </div>
            )}
        </div>
    );
}
