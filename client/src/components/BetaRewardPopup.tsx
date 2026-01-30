import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import packageJson from '../../package.json';

const BETA_REWARD_VERSION = '5.0'; // Versão que ativa o brinde
const BETA_REWARD_POINTS = 500;

export default function BetaRewardPopup() {
    const { user, theme, updateUser, showSuccess } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);

    const isMGT = user?.membershipType === 'MGT';
    const currentVersion = packageJson.version;

    useEffect(() => {
        // Só mostrar se:
        // 1. Usuário está logado
        // 2. Versão atual é 5.0.x
        // 3. Usuário ainda não resgatou o brinde
        if (!user) return;

        const versionMatch = currentVersion.startsWith(BETA_REWARD_VERSION);
        const hasClaimedReward = localStorage.getItem(`beta_reward_claimed_${user.id}`);

        if (versionMatch && !hasClaimedReward) {
            // Delay para não conflitar com outros modais
            const timer = setTimeout(() => setIsOpen(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [user, currentVersion]);

    const handleClaim = async () => {
        if (!user || claiming) return;

        setClaiming(true);
        try {
            // Chamar API para resgatar o brinde
            const response = await api.post('/users/claim-beta-reward');
            
            if (response.data.success) {
                // Atualizar dados do usuário
                const userResponse = await api.get('/users/me');
                if (userResponse.data) {
                    updateUser(userResponse.data);
                }

                // Marcar como resgatado
                localStorage.setItem(`beta_reward_claimed_${user.id}`, 'true');
                
                setClaimed(true);
                showSuccess('Brinde Resgatado!', `+${BETA_REWARD_POINTS} Zions Points adicionados à sua conta!`);
                
                // Fechar após animação
                setTimeout(() => setIsOpen(false), 2500);
            }
        } catch (error: any) {
            console.error('Failed to claim beta reward:', error);
            // Se já resgatou no backend, marcar localmente também
            if (error.response?.status === 400) {
                localStorage.setItem(`beta_reward_claimed_${user.id}`, 'true');
                setIsOpen(false);
            }
        } finally {
            setClaiming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-sm overflow-hidden rounded-3xl ${
                        theme === 'light' ? 'bg-white' : 'bg-zinc-900'
                    } shadow-2xl`}
                >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                        isMGT ? 'from-emerald-500/20 via-transparent to-emerald-500/10' : 'from-gold-500/20 via-transparent to-gold-500/10'
                    } animate-pulse`} />

                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={`absolute w-2 h-2 rounded-full ${isMGT ? 'bg-emerald-400' : 'bg-gold-400'}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ 
                                    opacity: [0, 0.8, 0],
                                    scale: [0, 1.5, 0],
                                    y: [0, -100],
                                    x: [0, (Math.random() - 0.5) * 50]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                    ease: 'easeOut'
                                }}
                                style={{
                                    left: `${20 + i * 10}%`,
                                    bottom: '20%'
                                }}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-8 text-center">
                        {/* Gift Icon */}
                        <motion.div 
                            className="inline-flex mb-6"
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                        >
                            <div className={`p-5 rounded-2xl bg-gradient-to-br ${
                                isMGT ? 'from-emerald-500 to-emerald-600' : 'from-gold-500 to-amber-600'
                            } shadow-2xl ${isMGT ? 'shadow-emerald-500/30' : 'shadow-gold-500/30'}`}>
                                <Gift className="w-10 h-10 text-white" />
                            </div>
                        </motion.div>

                        {/* Title */}
                        <h2 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Obrigado por fazer parte! 🎉
                        </h2>

                        {/* Description */}
                        <p className={`text-sm mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
                            Você foi um dos primeiros a testar o Magazine durante a fase Beta. 
                            Como agradecimento, preparamos um brinde especial para você!
                        </p>

                        {/* Reward Card */}
                        <div className={`p-4 rounded-2xl mb-6 ${
                            theme === 'light' ? 'bg-gray-50' : 'bg-white/5'
                        } border ${isMGT ? 'border-emerald-500/30' : 'border-gold-500/30'}`}>
                            <div className="flex items-center justify-center gap-3">
                                <Sparkles className={`w-6 h-6 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                                <span className={`text-3xl font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                                    +{BETA_REWARD_POINTS}
                                </span>
                                <span className={`text-lg ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
                                    Zions Points
                                </span>
                            </div>
                        </div>

                        {/* Claim Button */}
                        <motion.button
                            whileHover={{ scale: claimed ? 1 : 1.02 }}
                            whileTap={{ scale: claimed ? 1 : 0.98 }}
                            onClick={handleClaim}
                            disabled={claiming || claimed}
                            className={`w-full py-4 rounded-2xl font-bold text-lg text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
                                claimed
                                    ? 'bg-green-500 cursor-default'
                                    : isMGT 
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/30' 
                                        : 'bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 shadow-gold-500/30'
                            } disabled:opacity-80`}
                        >
                            {claiming ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : claimed ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Resgatado!
                                </>
                            ) : (
                                <>
                                    <Gift className="w-5 h-5" />
                                    Resgatar Brinde
                                </>
                            )}
                        </motion.button>

                        {/* Version badge */}
                        <p className={`text-xs mt-4 ${theme === 'light' ? 'text-gray-400' : 'text-white/30'}`}>
                            Versão {currentVersion} • Brinde exclusivo para usuários Beta
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
