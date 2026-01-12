import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Sparkles, Gift } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ThemePackCard from './ThemePackCard';

interface SupplyBoxModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SupplyBoxModal({ isOpen, onClose }: SupplyBoxModalProps) {
    const { updateUserZios } = useAuth(); // Assuming this function exists or similar
    const [opening, setOpening] = useState(false);
    const [reward, setReward] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = async () => {
        setOpening(true);
        setError(null);
        try {
            // Animation delay simulation
            await new Promise(resolve => setTimeout(resolve, 2000));

            const res = await api.post('/supply-box/open');
            setReward(res.data);

            // If it was a duplicate/Zions reward
            if (res.data.type === 'DUPLICATE' && res.data.compensation > 0) {
                // Update zions context if possible, or force refresh
                // Ideally useAuth provides a way to refetch user data
                window.location.reload(); // Simple fallback if context update is hard
            } else if (res.data.type === 'NEW_ITEM') {
                // Maybe refresh packs?
                window.location.reload();
            }

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
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                onClick={closeAndReset}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative w-full max-w-lg bg-zinc-900 rounded-3xl border border-white/10 p-8 text-center overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeAndReset}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>

                    {!reward ? (
                        <div className="flex flex-col items-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Supply Box Diário</h2>
                            <p className="text-gray-400 mb-8">Abra para ganhar um Theme Pack aleatório!</p>

                            <div className="relative mb-8 group cursor-pointer" onClick={!opening ? handleOpen : undefined}>
                                <div className={`absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transition-all duration-500 ${opening ? 'scale-150 opacity-100' : 'scale-100 opacity-50 group-hover:opacity-80'}`} />
                                <motion.div
                                    animate={opening ? {
                                        rotate: [0, -10, 10, -10, 10, 0],
                                        scale: [1, 1.1, 0.9, 1.1, 1],
                                        transition: { duration: 0.5, repeat: Infinity }
                                    } : {
                                        y: [0, -10, 0],
                                        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                >
                                    <Package className={`w-40 h-40 ${opening ? 'text-blue-400' : 'text-blue-500 group-hover:text-blue-400'} transition-colors duration-300 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]`} />
                                </motion.div>
                            </div>

                            {error && (
                                <div className="mb-6 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleOpen}
                                disabled={opening}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {opening ? (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-spin" />
                                        Abrindo...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="w-5 h-5" />
                                        Abrir Grátis
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="mb-6">
                                <Sparkles className="w-16 h-16 text-yellow-400 animate-pulse mx-auto mb-4" />
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                                    {reward.type === 'DUPLICATE' ? 'Item Duplicado!' : 'Novo Item!'}
                                </h2>
                            </div>

                            {reward.item && reward.type === 'NEW_ITEM' && (
                                <div className="w-full max-w-sm mb-6 pointer-events-none">
                                    <ThemePackCard
                                        pack={reward.item}
                                        onPurchase={() => { }}
                                        loading={false}
                                    />
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <p className="text-xl text-white font-medium mb-1">{reward.message}</p>
                                {reward.type === 'DUPLICATE' && (
                                    <p className="text-gray-400">Compensação adicionada à sua carteira.</p>
                                )}
                            </div>

                            <button
                                onClick={closeAndReset}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all"
                            >
                                Fechar
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
