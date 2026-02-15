import { useState, useEffect } from 'react';
import { Gift, ExternalLink, Clock, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface FreeGame {
    id: string;
    title: string;
    imageUrl: string;
    claimUrl: string;
    platform: 'prime' | 'twitch' | 'epic' | 'steam' | 'gog' | 'other';
    expiresAt?: string | null;
    source?: 'manual' | 'gamerpower';
    worth?: string;
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    prime: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    twitch: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    epic: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    steam: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30' },
    gog: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
    other: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

const PLATFORM_NAMES: Record<string, string> = {
    prime: 'Prime Gaming',
    twitch: 'Twitch Drops',
    epic: 'Epic Games',
    steam: 'Steam',
    gog: 'GOG',
    other: 'Outro',
};

export default function FreeGamesCard() {
    const { user, theme, accentGradient } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [games, setGames] = useState<FreeGame[]>([]);
    const [enabled, setEnabled] = useState(false);

    // Theme styles
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const accentColor = isMGT ? '#10b981' : '#d4af37';

    useEffect(() => {
        api.get('/social/twitch/free-games')
            .then(({ data }) => {
                setEnabled(data.enabled);
                setGames(data.games || []);
            })
            .catch(() => {});
    }, []);

    // Show placeholder if disabled or no games
    if (!enabled || games.length === 0) {
        return (
            <div className={`${themeBg} backdrop-blur-xl rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} p-6 text-center`}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}1a` }}>
                    <Gamepad2 className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <h3 className={`text-lg font-bold ${textMain} mb-1`}>Jogos Grátis</h3>
                <p className={`text-sm ${textSub}`}>Nenhum jogo grátis disponível no momento</p>
                <p className={`text-xs ${textSub} mt-2`}>Volte depois para conferir novas ofertas!</p>
            </div>
        );
    }

    const getDaysRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className={`${themeBg} backdrop-blur-xl rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} p-4 transition-all duration-300`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ 
                        backgroundColor: `${accentColor}33`,
                        borderColor: `${accentColor}50`,
                        borderWidth: '1px'
                    }}
                >
                    <Gift className="w-4 h-4" style={{ color: accentColor }} />
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${textMain}`}>Jogos Grátis</h3>
                    <p className={`text-xs ${textSub}`}>{games.length} {games.length === 1 ? 'jogo disponível' : 'jogos disponíveis'}</p>
                </div>
            </div>

            {/* Games List */}
            <div className="space-y-3">
                {games.map(game => {
                    const platformStyle = PLATFORM_COLORS[game.platform] || PLATFORM_COLORS.other;
                    const daysRemaining = game.expiresAt ? getDaysRemaining(game.expiresAt) : null;
                    
                    return (
                        <a
                            key={game.id}
                            href={game.claimUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'light' ? 'bg-gray-50/80 hover:bg-gray-100/80' : 'bg-white/5 hover:bg-white/10'} transition-all duration-200 group`}
                        >
                            {/* Game Image */}
                            {game.imageUrl ? (
                                <img 
                                    src={game.imageUrl} 
                                    alt={game.title} 
                                    className="w-14 h-14 rounded-lg object-cover"
                                />
                            ) : (
                                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`}>
                                    <Gamepad2 className={`w-6 h-6 ${textSub}`} />
                                </div>
                            )}

                            {/* Game Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium ${textMain} truncate group-hover:underline`}>{game.title}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformStyle.bg} ${platformStyle.text} border ${platformStyle.border}`}>
                                        {PLATFORM_NAMES[game.platform]}
                                    </span>
                                    {game.worth && game.worth !== 'N/A' && (
                                        <span className="text-xs text-green-400 font-medium line-through opacity-60">
                                            {game.worth}
                                        </span>
                                    )}
                                    <span className="text-xs text-green-400 font-bold">
                                        Grátis
                                    </span>
                                    {daysRemaining !== null && daysRemaining <= 7 && (
                                        <span className={`text-xs flex items-center gap-1 ${daysRemaining <= 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                                            <Clock className="w-3 h-3" />
                                            {daysRemaining <= 0 ? 'Último dia!' : `${daysRemaining}d restantes`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Claim Arrow */}
                            <div className={`p-2 rounded-lg ${platformStyle.bg} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <ExternalLink className={`w-4 h-4 ${platformStyle.text}`} />
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
