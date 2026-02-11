import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Sparkles, Gift, Coins, TrendingUp, Zap } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ThemePackCard from './ThemePackCard';
import { RARITY_CONFIG, getRarityColor, getRarityLabel } from '../utils/raritySystem';

interface SupplyBoxModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// Array format for UI rendering
const RARITIES_DISPLAY = Object.values(RARITY_CONFIG).map(r => ({
    name: r.name,
    label: r.label,
    color: r.color,
    chance: r.chance
}));

// Preview configurations for items
const BACKGROUND_PREVIEWS: Record<string, string> = {
    'bg_default': 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    'bg_aurora': 'linear-gradient(125deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)',
    'bg_sunset': 'linear-gradient(125deg, #1a0a0a 0%, #2d1f1f 25%, #4a2020 50%, #2d1f1f 75%, #1a0a0a 100%)',
    'bg_ocean': 'linear-gradient(125deg, #0a1628 0%, #0c2340 33%, #0a1628 66%, #0c2340 100%)',
    'bg_forest': 'linear-gradient(125deg, #0a1a0a 0%, #0f2a0f 33%, #0a1a0a 66%, #0f2a0f 100%)',
    'bg_galaxy': 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 25%, #2d1b4e 50%, #1a0a2e 75%, #0c0c0c 100%)',
    'bg_matrix': 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 33%, #0a0f0a 66%, #0a1a0a 100%)',
    'bg_fire': 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 25%, #4a2a0a 50%, #2d1a0a 75%, #1a0a0a 100%)',
    'bg_city': 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 33%, #1a1a2e 66%, #0f0f1a 100%)',
    'bg_space': 'linear-gradient(135deg, #000005 0%, #0a0a1a 33%, #000005 66%, #0a0a1a 100%)',
    'bg_cyberpunk': 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)',
    'bg_lava': 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)',
    'bg_ice': 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)',
    'bg_neon_grid': 'linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 25%, #2a0d2a 50%, #1a0d1a 75%, #0d0d0d 100%)',
    'bg_emerald': 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)',
    'bg_royal': 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)',
    'bg_carbon': 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)',
    'anim-cosmic-triangles': 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)',
    'anim-gradient-waves': 'linear-gradient(135deg, #1e140a 0%, #8b7335 25%, #d4af37 50%, #8b7335 75%, #1e140a 100%)',
    'anim-rainbow-skies': 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)',
    'anim-infinite-triangles': 'linear-gradient(135deg, #2d1b4e 0%, #4a2c7d 50%, #2d1b4e 100%)',
    'anim-moonlit-sky': 'linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a0a2e 100%)',
    'anim-dark-veil': 'radial-gradient(ellipse at center, #2a0845 0%, #1a0530 30%, #0a0115 100%)',
    'anim-iridescence': 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #1a1a2e 100%)',
};

const COLOR_PREVIEWS: Record<string, string> = {
    'color_gold': '#d4af37',
    'color_rgb': 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000)',
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
    // Gradient Colors
    'color_gradient_sunset': 'linear-gradient(135deg, #ff6b35, #f72585)',
    'color_gradient_ocean': 'linear-gradient(135deg, #0077b6, #00f5d4)',
    'color_gradient_aurora': 'linear-gradient(135deg, #7b4397, #00d9ff)',
    'color_gradient_fire': 'linear-gradient(135deg, #ff0000, #ffc300)',
    'color_gradient_galaxy': 'linear-gradient(135deg, #1a0033, #7303c0, #ec38bc)',
    'color_gradient_neon': 'linear-gradient(135deg, #ff00ff, #00ffff)',
    'color_gradient_forest': 'linear-gradient(135deg, #134e5e, #71b280)',
    'color_gradient_gold': 'linear-gradient(135deg, #8b7335, #d4af37, #f4e4a6)',
    'color_gradient_midnight': 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    'color_gradient_candy': 'linear-gradient(135deg, #ff9a9e, #fecfef, #a18cd1)',
};

const BORDER_PREVIEWS: Record<string, string> = {
    'border_gold': 'linear-gradient(135deg, #d4af37, #f4d03f)',
    'border_emerald': 'linear-gradient(135deg, #10b981, #34d399)',
    'border_rose': 'linear-gradient(135deg, #f43f5e, #fb7185)',
    'border_blue': 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'border_purple': 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'border_green': 'linear-gradient(135deg, #22c55e, #4ade80)',
    'border_red': 'linear-gradient(135deg, #ef4444, #f87171)',
    'border_cyan': 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    'border_orange': 'linear-gradient(135deg, #f97316, #fb923c)',
    'border_midnight': 'linear-gradient(135deg, #1e1b4b, #312e81)',
    'border_ocean': 'linear-gradient(135deg, #0369a1, #0ea5e9)',
    'border_forest': 'linear-gradient(135deg, #166534, #22c55e)',
    'border_cherry_blossom': 'linear-gradient(135deg, #fda4af, #fecdd3)',
    'border_autumn': 'linear-gradient(135deg, #ea580c, #f97316)',
    'border_cotton_candy': 'linear-gradient(135deg, #f0abfc, #e879f9)',
    'border_ice': 'linear-gradient(135deg, #67e8f9, #a5f3fc)',
    'border_sunset': 'linear-gradient(135deg, #f97316, #eab308, #ef4444)',
    'border_fire': 'linear-gradient(135deg, #ef4444, #f97316, #eab308)',
    'border_aurora': 'linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)',
    'border_neon': 'linear-gradient(135deg, #22d3ee, #a855f7, #ec4899)',
    'border_lava': 'linear-gradient(135deg, #dc2626, #ea580c, #fbbf24)',
    'border_electric': 'linear-gradient(135deg, #3b82f6, #06b6d4, #22d3ee)',
    'border_mystic': 'linear-gradient(135deg, #7c3aed, #a855f7, #d946ef)',
    'border_galaxy': 'linear-gradient(135deg, #1e1b4b, #7c3aed, #ec4899)',
    'border_rainbow': 'linear-gradient(135deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)',
    'border_diamond': 'linear-gradient(135deg, #e5e7eb, #f3f4f6, #d1d5db)',
    'border_platinum': 'linear-gradient(135deg, #94a3b8, #cbd5e1, #94a3b8)',
    'border_holographic': 'linear-gradient(135deg, #06b6d4, #a855f7, #ec4899, #eab308, #22c55e)',
    'border_cosmic': 'linear-gradient(135deg, #1e1b4b, #4c1d95, #7c3aed, #ec4899)',
    'border_phoenix': 'linear-gradient(135deg, #dc2626, #f97316, #eab308, #f97316, #dc2626)',
    'border_pastel_pink': 'linear-gradient(135deg, #ffc1cc, #ffb6c1)',
    'border_pastel_lavender': 'linear-gradient(135deg, #e6e6fa, #d8bfd8)',
    'border_pastel_mint': 'linear-gradient(135deg, #98fb98, #90ee90)',
    'border_pastel_peach': 'linear-gradient(135deg, #ffdab9, #ffe4c4)',
    'border_pastel_sky': 'linear-gradient(135deg, #87ceeb, #add8e6)',
};

const BADGE_ICONS: Record<string, string> = {
    'badge_crown': '👑',
    'badge_fire': '🔥',
    'badge_heart': '❤️',
    'badge_pony': '🦄',
    'badge_skull': '💀',
    'badge_star': '⭐',
    'badge_moon': '🌙',
    'badge_sun': '☀️',
    'badge_lightning': '⚡',
    'badge_diamond': '💎',
};

export default function SupplyBoxModal({ isOpen, onClose, onSuccess }: SupplyBoxModalProps) {
    const { user, theme, accentColor, updateUserPoints } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const userAccent = accentColor || defaultAccent;

    const [opening, setOpening] = useState(false);
    const [reward, setReward] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [cost, setCost] = useState<number>(0);
    const [opensToday, setOpensToday] = useState<number>(0);
    const [loadingCost, setLoadingCost] = useState(false);

    // Fetch cost when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoadingCost(true);
            api.get('/supply-box/status')
                .then(res => {
                    setCost(res.data.cost);
                    setOpensToday(res.data.opensToday || 0);
                })
                .catch(err => console.error('Error fetching box status:', err))
                .finally(() => setLoadingCost(false));
        }
    }, [isOpen]);

    const handleOpen = async () => {
        setOpening(true);
        setError(null);
        try {
            // Animation delay simulation
            await new Promise(resolve => setTimeout(resolve, 2000));

            const res = await api.post('/supply-box/open');
            setReward(res.data);

            // Update opens count
            setOpensToday(prev => prev + 1);
            setCost(res.data.nextCost);

            // Atualizar saldo de Zions Points no contexto do usuário
            const currentCost = cost || 0;
            let pointsDelta = -currentCost; // Desconta o custo da abertura

            if (res.data.rewardType === 'ZIONS' && res.data.item?.value) {
                // Ganhou Zions bônus
                pointsDelta += res.data.item.value;
            }
            if (res.data.type === 'DUPLICATE' && res.data.compensation) {
                // Compensação por duplicata
                pointsDelta += res.data.compensation;
            }
            if (pointsDelta !== 0) {
                updateUserPoints(pointsDelta);
            }

            // Trigger parent update independently of UI state
            if (onSuccess) onSuccess();

        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao abrir Supply Box');
        } finally {
            setOpening(false);
        }
    };

    const reset = () => {
        setReward(null);
        setError(null);
        setOpening(false);
    };

    const closeAndReset = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                onClick={closeAndReset}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-lg overflow-hidden rounded-3xl"
                    style={{
                        background: theme === 'light'
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.9) 100%)'
                            : 'linear-gradient(135deg, rgba(25,25,30,0.98) 0%, rgba(15,15,20,0.95) 100%)',
                        boxShadow: `0 25px 80px -20px rgba(0,0,0,0.6), 0 0 60px ${userAccent}15, inset 0 0 0 1px ${theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)'}`
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Accent glow */}
                    <div 
                        className="absolute inset-0 opacity-40 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at top center, ${userAccent}30, transparent 50%)`
                        }}
                    />

                    {/* Close Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={closeAndReset}
                        className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                    >
                        <X className={`w-6 h-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                    </motion.button>

                    {!reward ? (
                        <div className="relative p-8 flex flex-col items-center">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-2">
                                <div 
                                    className="p-2 rounded-xl"
                                    style={{ backgroundColor: `${userAccent}20` }}
                                >
                                    <Package className="w-6 h-6" style={{ color: userAccent }} />
                                </div>
                                <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Supply Box
                                </h2>
                            </div>
                            <p className={`text-sm mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {opensToday === 0 ? 'Primeira abertura grátis!' : `Aberturas hoje: ${opensToday}`}
                            </p>

                            {/* Box Animation */}
                            <div className="relative mb-6 group cursor-pointer" onClick={!opening ? handleOpen : undefined}>
                                <div 
                                    className={`absolute inset-0 blur-3xl rounded-full transition-all duration-500 ${opening ? 'scale-150 opacity-100' : 'scale-100 opacity-50 group-hover:opacity-80'}`}
                                    style={{ backgroundColor: `${userAccent}30` }}
                                />
                                <motion.div
                                    animate={opening ? {
                                        rotate: [0, -10, 10, -10, 10, 0],
                                        scale: [1, 1.1, 0.9, 1.1, 1],
                                        transition: { duration: 0.5, repeat: Infinity }
                                    } : {
                                        y: [0, -8, 0],
                                        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                >
                                    <Package 
                                        className="w-32 h-32 transition-colors duration-300"
                                        style={{ 
                                            color: opening ? userAccent : `${userAccent}cc`,
                                            filter: `drop-shadow(0 0 30px ${userAccent}50)`
                                        }}
                                    />
                                </motion.div>
                            </div>

                            {/* Rarity Drop Rates */}
                            <div className={`w-full p-4 rounded-2xl mb-6 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className={`w-4 h-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Chances de Drop
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {RARITIES_DISPLAY.map((rarity) => (
                                        <div key={rarity.name} className="text-center">
                                            <div 
                                                className="w-full h-1.5 rounded-full mb-1"
                                                style={{ 
                                                    background: `linear-gradient(90deg, ${rarity.color}, ${rarity.color}80)`,
                                                    boxShadow: `0 0 10px ${rarity.color}40`
                                                }}
                                            />
                                            <span className="text-[10px] font-medium" style={{ color: rarity.color }}>
                                                {rarity.label}
                                            </span>
                                            <span className={`block text-[10px] ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {rarity.chance}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Possible Prizes */}
                            <div className={`w-full p-4 rounded-2xl mb-6 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Gift className={`w-4 h-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Prêmios Possíveis
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                                        🎨 Fundos
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                                        🏅 Badges
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                                        🎯 Cores
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                                        🖼️ Bordas
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                                        📦 Packs
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                                        💰 10-500 Zions
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleOpen}
                                disabled={opening || loadingCost}
                                className="w-full px-8 py-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-black"
                                style={{
                                    background: `linear-gradient(135deg, ${userAccent}, ${userAccent}dd)`,
                                    boxShadow: `0 8px 30px ${userAccent}40`
                                }}
                            >
                                {opening ? (
                                    <>
                                        {/* Apple-style spinning loader */}
                                        <div className="relative w-5 h-5">
                                            {[...Array(8)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute w-1.5 h-1.5 rounded-full bg-black"
                                                    style={{
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: `rotate(${i * 45}deg) translateY(-150%)`,
                                                        transformOrigin: '0 0',
                                                        opacity: 1 - (i * 0.1),
                                                        animation: `spinnerFade 0.8s linear infinite`,
                                                        animationDelay: `${i * 0.1}s`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span>Abrindo...</span>
                                        <style>{`
                                            @keyframes spinnerFade {
                                                0%, 100% { opacity: 0.2; }
                                                50% { opacity: 1; }
                                            }
                                        `}</style>
                                    </>
                                ) : (
                                    <>
                                        {cost === 0 ? (
                                            <>
                                                <Zap className="w-5 h-5" />
                                                Abrir Grátis!
                                            </>
                                        ) : (
                                            <>
                                                <Coins className="w-5 h-5" />
                                                Abrir por {cost} Zions
                                            </>
                                        )}
                                    </>
                                )}
                            </motion.button>

                            {cost > 0 && (
                                <p className={`text-xs mt-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    Seu saldo: <span style={{ color: userAccent }}>{user?.zionsPoints?.toLocaleString() || 0}</span> Zions Points
                                </p>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative p-8 flex flex-col items-center"
                        >
                            {/* Reward Type Header */}
                            <div className="mb-4 flex flex-col items-center gap-2">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.2 }}
                                >
                                    <Sparkles 
                                        className="w-12 h-12 animate-pulse" 
                                        style={{ color: getRarityColor(reward.rarity) }}
                                    />
                                </motion.div>
                                <h2 
                                    className="text-3xl font-bold"
                                    style={{ 
                                        background: `linear-gradient(135deg, ${getRarityColor(reward.rarity)}, ${getRarityColor(reward.rarity)}aa)`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}
                                >
                                    {reward.type === 'DUPLICATE' ? 'Item Duplicado!' : 'Novo Item!'}
                                </h2>
                                <span 
                                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: getRarityColor(reward.rarity) }}
                                >
                                    {getRarityLabel(reward.rarity)}
                                </span>
                            </div>

                            {reward.item && (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="w-full max-w-sm mb-6"
                                >
                                    {reward.rewardType === 'ZIONS' ? (
                                        // Zions Bonus Display
                                        <div className={`rounded-2xl p-6 text-center ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", delay: 0.4 }}
                                                className="flex justify-center mb-4"
                                            >
                                                <div 
                                                    className="w-24 h-24 rounded-full flex items-center justify-center"
                                                    style={{ 
                                                        background: `linear-gradient(135deg, ${userAccent}, ${userAccent}88)`,
                                                        boxShadow: `0 0 40px ${userAccent}40`
                                                    }}
                                                >
                                                    <Coins className="w-12 h-12 text-white" />
                                                </div>
                                            </motion.div>
                                            <h3 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                +{reward.item.value} Zions
                                            </h3>
                                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                Adicionados ao seu saldo
                                            </p>
                                        </div>
                                    ) : reward.rewardType === 'PACK' ? (
                                        // ThemePack Display
                                        <ThemePackCard
                                            pack={reward.item}
                                            onPurchase={() => { }}
                                            loading={false}
                                            isReward={true}
                                        />
                                    ) : (
                                        // Individual Item Display with REAL Preview (Background, Badge, Color, Border)
                                        <div className={`rounded-2xl p-6 text-center ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", delay: 0.4 }}
                                                className="flex justify-center mb-4"
                                            >
                                                {reward.rewardType === 'BACKGROUND' && (
                                                    <div 
                                                        className="w-28 h-28 rounded-2xl shadow-lg"
                                                        style={{ 
                                                            background: BACKGROUND_PREVIEWS[reward.item.id] || `linear-gradient(135deg, ${userAccent}40, ${userAccent}20)`,
                                                            boxShadow: `0 8px 30px ${getRarityColor(reward.rarity)}40`
                                                        }}
                                                    />
                                                )}
                                                {reward.rewardType === 'COLOR' && (
                                                    <div 
                                                        className="w-28 h-28 rounded-full shadow-lg flex items-center justify-center"
                                                        style={{ 
                                                            background: reward.item.id === 'color_rgb' 
                                                                ? COLOR_PREVIEWS[reward.item.id]
                                                                : COLOR_PREVIEWS[reward.item.id] || userAccent,
                                                            boxShadow: `0 8px 30px ${COLOR_PREVIEWS[reward.item.id] || userAccent}60`
                                                        }}
                                                    >
                                                        {reward.item.id === 'color_rgb' && (
                                                            <span className="text-white text-xl font-bold drop-shadow-lg">RGB</span>
                                                        )}
                                                    </div>
                                                )}
                                                {reward.rewardType === 'BORDER' && (
                                                    <div 
                                                        className="w-28 h-28 rounded-full p-1 shadow-lg"
                                                        style={{ 
                                                            background: BORDER_PREVIEWS[reward.item.id] || `linear-gradient(135deg, ${userAccent}, ${userAccent}aa)`,
                                                            boxShadow: `0 8px 30px ${getRarityColor(reward.rarity)}40`
                                                        }}
                                                    >
                                                        <div className={`w-full h-full rounded-full ${theme === 'light' ? 'bg-gray-100' : 'bg-[#1a1a1a]'} flex items-center justify-center`}>
                                                            <span className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-400' : 'text-white/30'}`}>👤</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {reward.rewardType === 'BADGE' && (
                                                    <div 
                                                        className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-lg"
                                                        style={{ 
                                                            background: `linear-gradient(135deg, ${theme === 'light' ? '#f3f4f6' : 'rgba(255,255,255,0.1)'}, ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.05)'})`,
                                                            boxShadow: `0 8px 30px ${getRarityColor(reward.rarity)}40`
                                                        }}
                                                    >
                                                        <span className="text-5xl">{BADGE_ICONS[reward.item.id] || '🏅'}</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                            <h3 className={`text-xl font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                {reward.item.name}
                                            </h3>
                                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {reward.rewardType === 'BACKGROUND' && 'Fundo de Perfil'}
                                                {reward.rewardType === 'BADGE' && 'Badge de Perfil'}
                                                {reward.rewardType === 'COLOR' && 'Cor de Destaque'}
                                                {reward.rewardType === 'BORDER' && 'Borda de Perfil'}
                                            </p>
                                            {reward.type === 'DUPLICATE' && (
                                                <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/20 inline-flex items-center gap-2">
                                                    <Coins className="w-4 h-4 text-amber-400" />
                                                    <span className="text-sm text-amber-400 font-medium">
                                                        +{reward.compensation} Zions (duplicata)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <div className="text-center mb-6">
                                <p className={`text-lg font-medium mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    {reward.message}
                                </p>
                                {reward.type === 'DUPLICATE' && (
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <Coins className="w-4 h-4" style={{ color: userAccent }} />
                                        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                                            +{reward.compensation} Zions Points de compensação
                                        </span>
                                    </div>
                                )}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={closeAndReset}
                                className={`w-full px-8 py-3 font-medium rounded-xl transition-all ${
                                    theme === 'light' 
                                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900' 
                                        : 'bg-white/10 hover:bg-white/15 text-white'
                                }`}
                            >
                                Fechar
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}


