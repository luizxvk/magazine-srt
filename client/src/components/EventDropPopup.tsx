import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Key, X, CheckCircle, Clock, Sparkles, Palette, Image, Award, CircleDot } from 'lucide-react';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import confetti from 'canvas-confetti';

interface EventDrop {
    id: string;
    title: string;
    imageUrl?: string;
    date: string;
    dropItemId: string;
    dropItemType: string;
    dropClaimUntil: string;
}

interface EventDropPopupProps {
    onClose: () => void;
}

export default function EventDropPopup({ onClose }: EventDropPopupProps) {
    const { user } = useAuth();
    const [availableDrops, setAvailableDrops] = useState<EventDrop[]>([]);
    const [currentDropIndex, setCurrentDropIndex] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [claimedItem, setClaimedItem] = useState<{ type: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const isMGT = user?.membershipType === 'MGT';
    const accentColor = isMGT ? 'tier-std' : 'purple';
    const bgGradient = isMGT 
        ? 'from-tier-std-500/20 to-teal-500/20' 
        : 'from-purple-500/20 to-pink-500/20';

    useEffect(() => {
        fetchAvailableDrops();
    }, []);

    const fetchAvailableDrops = async () => {
        try {
            const { data } = await api.get('/events/available-drops');
            setAvailableDrops(data);
        } catch (err) {
            console.error('Error fetching drops:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentDrop = availableDrops[currentDropIndex];

    const handleClaim = async () => {
        if (!currentDrop || !keyword.trim()) return;

        setIsSubmitting(true);
        setError('');

        try {
            const { data } = await api.post(`/events/${currentDrop.id}/claim-drop`, {
                keyword: keyword.trim().toUpperCase()
            });

            // Success!
            setSuccess(true);
            setClaimedItem({
                type: currentDrop.dropItemType,
                name: data.itemName || 'Item Exclusivo'
            });

            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: isMGT 
                    ? ['#10B981', '#059669', '#34D399', '#6EE7B7']
                    : ['#A855F7', '#9333EA', '#C084FC', '#E879F9']
            });

            // Remove this drop from the list
            setTimeout(() => {
                const newDrops = availableDrops.filter((_, i) => i !== currentDropIndex);
                setAvailableDrops(newDrops);
                if (newDrops.length === 0) {
                    setTimeout(onClose, 2000);
                } else {
                    setCurrentDropIndex(0);
                    setSuccess(false);
                    setKeyword('');
                    setClaimedItem(null);
                }
            }, 3000);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Palavra-chave incorreta. Tente novamente!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTimeRemaining = (claimUntil: string) => {
        const now = new Date();
        const end = new Date(claimUntil);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return 'Expirado';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) return `${hours}h ${minutes}m restantes`;
        return `${minutes}m restantes`;
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'background': return Image;
            case 'badge': return Award;
            case 'color': return Palette;
            case 'profileBorder': return CircleDot;
            default: return Gift;
        }
    };

    const getItemTypeName = (type: string) => {
        switch (type) {
            case 'background': return 'Background';
            case 'badge': return 'Badge Exclusivo';
            case 'color': return 'Cor de Perfil';
            case 'profileBorder': return 'Borda de Perfil';
            default: return 'Item';
        }
    };

    if (loading) {
        return null;
    }

    if (availableDrops.length === 0) {
        return null;
    }

    const ItemIcon = getItemIcon(currentDrop?.dropItemType || '');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 50 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={`relative w-full max-w-md bg-gradient-to-br ${bgGradient} border border-white/20 rounded-2xl overflow-hidden`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} blur-3xl opacity-50`} />
                    
                    {/* Content */}
                    <div className="relative bg-gray-900/90 backdrop-blur-xl p-6">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className={`inline-flex p-4 rounded-full bg-${accentColor}-500/20 mb-4`}
                            >
                                <Gift className={`w-10 h-10 text-${accentColor}-400`} />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Drop Exclusivo!
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Você participou do evento e pode resgatar um item exclusivo!
                            </p>
                        </div>

                        {/* Event info */}
                        {currentDrop && !success && (
                            <div className={`mb-6 p-4 rounded-xl bg-${accentColor}-500/10 border border-${accentColor}-500/30`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg bg-${accentColor}-500/20`}>
                                        <ItemIcon className={`w-6 h-6 text-${accentColor}-400`} />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{currentDrop.title}</p>
                                        <p className={`text-sm text-${accentColor}-400`}>
                                            {getItemTypeName(currentDrop.dropItemType)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{getTimeRemaining(currentDrop.dropClaimUntil)}</span>
                                </div>
                            </div>
                        )}

                        {/* Success state */}
                        {success && claimedItem && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-6"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring' }}
                                    className="inline-flex p-4 rounded-full bg-green-500/20 mb-4"
                                >
                                    <CheckCircle className="w-12 h-12 text-green-400" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Item Resgatado!
                                </h3>
                                <p className="text-gray-400 mb-4">
                                    {getItemTypeName(claimedItem.type)} adicionado ao seu perfil
                                </p>
                                <div className="flex items-center justify-center gap-2 text-green-400">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="font-semibold">{claimedItem.name}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Keyword input */}
                        {!success && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                                        <Key className="w-3 h-3" /> Palavra-chave
                                    </label>
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => {
                                            setKeyword(e.target.value.toUpperCase());
                                            setError('');
                                        }}
                                        placeholder="Digite a palavra-chave do evento"
                                        className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white text-center text-lg font-mono uppercase tracking-widest placeholder-gray-500 focus:outline-none focus:border-${accentColor}-500/50 transition-colors`}
                                        autoFocus
                                    />
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-sm mt-2 text-center"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>

                                <button
                                    onClick={handleClaim}
                                    disabled={isSubmitting || !keyword.trim()}
                                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 ${
                                        isMGT
                                            ? 'bg-gradient-to-r from-tier-std-500 to-teal-500 hover:from-tier-std-600 hover:to-teal-600'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                    } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader size="sm" />
                                            Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <Gift className="w-4 h-4" />
                                            Resgatar Item
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-xs text-gray-500">
                                    A palavra-chave foi revelada durante o evento/live
                                </p>
                            </div>
                        )}

                        {/* Multiple drops indicator */}
                        {availableDrops.length > 1 && !success && (
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-400">
                                    {currentDropIndex + 1} de {availableDrops.length} drops disponíveis
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
