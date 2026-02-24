import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, DollarSign, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SponsorPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    onSuccess?: () => void;
}

export default function SponsorPostModal({ isOpen, onClose, postId, onSuccess }: SponsorPostModalProps) {
    const { user, updateUser, showToast } = useAuth();
    const [price, setPrice] = useState<number>(50);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Fetch current price
            api.get('/sponsored-posts/price').then(res => {
                setPrice(res.data.cost);
            }).catch(() => {
                // Use default price
            });
            setSuccess(false);
            setError(null);
        }
    }, [isOpen]);

    const handleSponsor = async () => {
        if (!user) return;
        
        setLoading(true);
        setError(null);

        try {
            await api.post('/sponsored-posts', { postId });
            
            // Update local user state
            updateUser({ 
                ...user, 
                zionsCash: (user.zionsCash || 0) - price 
            });

            setSuccess(true);
            showToast?.('✅ Solicitação enviada! Aguardando aprovação.');
            
            setTimeout(() => {
                onClose();
                onSuccess?.();
            }, 2000);
        } catch (err: any) {
            const message = err.response?.data?.error || 'Erro ao solicitar patrocínio';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const hasEnoughBalance = (user?.zionsCash || 0) >= price;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gold-500/20 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gold-500/20">
                                <Sparkles className="w-5 h-5 text-gold-400" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white">Patrocinar Post</h2>
                                <p className="text-xs text-gray-400">Destaque seu conteúdo no feed</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Solicitação Enviada!</h3>
                                <p className="text-gray-400 text-sm">
                                    Um administrador irá revisar seu post em breve.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Benefits */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                        <div className="p-1.5 rounded-lg bg-gold-500/20 mt-0.5">
                                            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white">Destaque Especial</h4>
                                            <p className="text-xs text-gray-400">Seu post aparecerá em destaque no feed de todos os usuários</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/20 mt-0.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white">Aprovação do Admin</h4>
                                            <p className="text-xs text-gray-400">Seu post será revisado antes de ser destacado</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="p-4 rounded-xl bg-gradient-to-r from-gold-500/10 to-amber-500/10 border border-gold-500/20 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Custo:</span>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-gold-400" />
                                            <span className="text-2xl font-bold text-gold-400">{price}</span>
                                            <span className="text-gray-400 text-sm">Zions Cash</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Seu saldo:</span>
                                        <span className={hasEnoughBalance ? 'text-green-400' : 'text-red-400'}>
                                            {(user?.zionsCash || 0).toFixed(2)} Z$
                                        </span>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                        <span className="text-sm text-red-400">{error}</span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSponsor}
                                        disabled={loading || !hasEnoughBalance}
                                        className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                                            hasEnoughBalance
                                                ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-black hover:brightness-110'
                                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Patrocinar
                                            </>
                                        )}
                                    </button>
                                </div>

                                {!hasEnoughBalance && (
                                    <p className="text-center text-xs text-red-400 mt-3">
                                        Saldo insuficiente. Recarregue seu Zions Cash.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
