import { useState, useEffect } from 'react';
import { Music, Gamepad2, Twitch, Youtube, Twitter, Github, Globe, Tv, CheckCircle, ExternalLink, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface ExternalConnection {
    id: string;
    type: string;
    name: string;
    verified: boolean;
    visibility: number;
}

interface SocialConnection {
    platform: string;
    platformUsername: string;
    isActive: boolean;
}

// Platform icons and colors
const PLATFORM_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    spotify: { icon: Music, color: '#1DB954', label: 'Spotify' },
    steam: { icon: Gamepad2, color: '#1b2838', label: 'Steam' },
    twitch: { icon: Twitch, color: '#9146FF', label: 'Twitch' },
    youtube: { icon: Youtube, color: '#FF0000', label: 'YouTube' },
    twitter: { icon: Twitter, color: '#1DA1F2', label: 'Twitter' },
    github: { icon: Github, color: '#181717', label: 'GitHub' },
    xbox: { icon: Gamepad2, color: '#107C10', label: 'Xbox' },
    playstation: { icon: Gamepad2, color: '#003087', label: 'PlayStation' },
    epicgames: { icon: Gamepad2, color: '#313131', label: 'Epic Games' },
    reddit: { icon: Globe, color: '#FF4500', label: 'Reddit' },
    facebook: { icon: Globe, color: '#1877F2', label: 'Facebook' },
    instagram: { icon: Globe, color: '#E4405F', label: 'Instagram' },
    tiktok: { icon: Tv, color: '#000000', label: 'TikTok' },
    battlenet: { icon: Gamepad2, color: '#00AEFF', label: 'Battle.net' },
    riotgames: { icon: Gamepad2, color: '#D32936', label: 'Riot Games' },
};

export default function ProfileSocialConnections() {
    const { user, theme } = useAuth();
    const { getAccentColor } = useTierColors();
    const { t } = useTranslation('common');
    const isMGT = user?.membershipType === 'MGT';
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [externalConnections, setExternalConnections] = useState<ExternalConnection[]>([]);
    const [loading, setLoading] = useState(true);

    const themeBorder = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(var(--tier-std-color-rgb),0.15)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-tier-std-950/30' : 'bg-black/30');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const accentColor = getAccentColor(isMGT);

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            // Load platform connections (Discord, Steam, Twitch)
            const connectionsRes = await api.get('/social/connections');
            setConnections(connectionsRes.data.connections || []);
            
            // If Discord is connected, load external connections
            const discordConn = connectionsRes.data.connections?.find((c: any) => c.platform === 'DISCORD');
            if (discordConn) {
                try {
                    const extRes = await api.get('/social/discord/connections');
                    setExternalConnections(extRes.data.connections || []);
                } catch {
                    // Discord connections might fail if scope not approved yet
                }
            }
        } catch (error) {
            console.error('Error loading connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (platform: string) => {
        try {
            const response = await api.get(`/social/${platform.toLowerCase()}/auth`);
            // Always append state with userId for OAuth callback
            const authUrl = user?.id 
                ? `${response.data.authUrl}&state=${user.id}`
                : response.data.authUrl;
            window.location.href = authUrl;
        } catch (error) {
            console.error(`Error initiating ${platform} auth:`, error);
        }
    };

    if (loading) {
        return (
            <div className={`${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} p-4`}>
                <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-5 h-5 rounded bg-gray-700" />
                    <div className="h-4 w-24 rounded bg-gray-700" />
                </div>
            </div>
        );
    }

    const discordConnected = connections.some(c => c.platform === 'DISCORD' && c.isActive);
    const steamConnected = connections.some(c => c.platform === 'STEAM' && c.isActive);
    const totalConnections = externalConnections.length + (steamConnected ? 1 : 0);

    // If no connections at all, show connect prompt
    if (!discordConnected && !steamConnected) {
        return (
            <div className={`${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} p-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4" style={{ color: accentColor }} />
                        <span className={`text-sm font-medium ${textMain}`}>{t('social.connections')}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleConnect('discord')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 hover:bg-[#5865F2]/30 transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                            </svg>
                            Discord
                        </button>
                        <button
                            onClick={() => handleConnect('steam')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
                        >
                            <Gamepad2 className="w-3 h-3" />
                            Steam
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} p-4`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" style={{ color: accentColor }} />
                    <span className={`text-sm font-medium ${textMain}`}>{t('social.connections')}</span>
                    {totalConnections > 0 && (
                        <span className={`text-xs ${textSub}`}>({totalConnections})</span>
                    )}
                </div>
            </div>

            {/* Connections Grid - Compact inline display */}
            <div className="flex flex-wrap gap-2">
                {/* Discord external connections (Spotify, Steam from Discord, YouTube, etc) */}
                {externalConnections.map((conn) => {
                    const config = PLATFORM_CONFIG[conn.type.toLowerCase()] || { 
                        icon: Globe, 
                        color: accentColor, 
                        label: conn.type 
                    };
                    const Icon = config.icon;
                    return (
                        <div
                            key={conn.id}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-100/80' : 'bg-white/5'} transition-all duration-300`}
                            style={{ 
                                borderColor: `${config.color}30`,
                                borderWidth: '1px'
                            }}
                            title={`${config.label}: ${conn.name}${conn.verified ? ` (${t('social.verified')})` : ''}`}
                        >
                            <Icon 
                                className="w-3.5 h-3.5" 
                                style={{ color: config.color }}
                            />
                            <span className={`text-xs ${textMain} truncate max-w-[70px]`}>
                                {conn.name}
                            </span>
                            {conn.verified && (
                                <CheckCircle className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            )}
                        </div>
                    );
                })}

                {/* Steam connection (if connected directly, not from Discord) */}
                {steamConnected && (
                    <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-100/80' : 'bg-white/5'} transition-all duration-300`}
                        style={{ 
                            borderColor: '#1b283830',
                            borderWidth: '1px'
                        }}
                        title={`Steam ${t('social.connected')}`}
                    >
                        <Gamepad2 className="w-3.5 h-3.5" style={{ color: '#66c0f4' }} />
                        <span className={`text-xs ${textMain}`}>Steam</span>
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    </div>
                )}

                {/* Connect more button */}
                {!discordConnected && (
                    <button
                        onClick={() => handleConnect('discord')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-100/80 hover:bg-gray-200/80' : 'bg-white/5 hover:bg-white/10'} transition-all duration-300 border border-dashed border-gray-500/30`}
                    >
                        <ExternalLink className="w-3.5 h-3.5" style={{ color: accentColor }} />
                        <span className={`text-xs ${textSub}`}>+ Discord</span>
                    </button>
                )}
            </div>
        </div>
    );
}
