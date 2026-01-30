import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Sparkles, Gift, Coins, TrendingUp, Zap } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ThemePackCard from './ThemePackCard';

interface SupplyBoxModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// Rarity configuration
const RARITIES = [
    { name: 'COMMON', label: 'Comum', color: '#9ca3af', chance: 60, gradient: 'from-gray-400 to-gray-500' },
    { name: 'RARE', label: 'Raro', color: '#3b82f6', chance: 25, gradient: 'from-blue-400 to-blue-600' },
    { name: 'EPIC', label: 'Épico', color: '#a855f7', chance: 12, gradient: 'from-purple-400 to-purple-600' },
    { name: 'LEGENDARY', label: 'Lendário', color: '#f59e0b', chance: 3, gradient: 'from-amber-400 to-orange-500' }
];

export default function SupplyBoxModal({ isOpen, onClose, onSuccess }: SupplyBoxModalProps) {
    const { user, theme, accentColor } = useAuth();
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

    const getRarityColor = (rarity: string) => {
        const r = RARITIES.find(r => r.name === rarity);
        return r?.color || '#9ca3af';
    };

    const getRarityLabel = (rarity: string) => {
        const r = RARITIES.find(r => r.name === rarity);
        return r?.label || 'Comum';
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
                                    {RARITIES.map((rarity) => (
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
                                className="w-full px-8 py-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-black"
                                style={{
                                    background: `linear-gradient(135deg, ${userAccent}, ${userAccent}dd)`,
                                    boxShadow: `0 8px 30px ${userAccent}40`
                                }}
                            >
                                {opening ? (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-spin" />
                                        Abrindo...
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
                                        // Individual Item Display (Background, Badge, Color, Border)
                                        <div className={`rounded-2xl p-6 text-center ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", delay: 0.4 }}
                                                className="flex justify-center mb-4"
                                            >
                                                <div 
                                                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl"
                                                    style={{ 
                                                        background: `linear-gradient(135deg, ${userAccent}40, ${userAccent}20)`,
                                                        border: `2px solid ${userAccent}60`,
                                                        boxShadow: `0 0 30px ${userAccent}30`
                                                    }}
                                                >
                                                    {reward.rewardType === 'BACKGROUND' && '🎨'}
                                                    {reward.rewardType === 'BADGE' && '🏅'}
                                                    {reward.rewardType === 'COLOR' && '🎯'}
                                                    {reward.rewardType === 'BORDER' && '🖼️'}
                                                </div>
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


