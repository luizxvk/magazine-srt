import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Crown, Zap, Trophy, Gift, MessageCircle, Shield, Palette, 
    Sparkles, Star, Check, X,
    Rocket, Heart, Package
} from 'lucide-react';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import api from '../services/api';
import Header from '../components/Header';
import ColorBends from '../components/ColorBends';
import LiquidEliteButton from '../components/LiquidEliteButton';
import confetti from 'canvas-confetti';

interface Plan {
    id: string;
    name: string;
    price: number;
    pricePerMonth: string | null;
    duration: string;
    popular: boolean;
    savings: string | null;
}

interface Benefit {
    id: string;
    name: string;
    description: string;
    value: boolean | number;
}

interface SubscriptionStatus {
    isElite: boolean;
    eliteUntil: string | null;
    eliteSince: string | null;
    eliteStreak: number;
    daysRemaining: number;
    activeSubscription: any;
    isCancelled?: boolean;
    benefits: any;
    prices: Record<string, number>;
}

export default function ElitePage() {
    const { user, showEdgeNotification } = useAuth();
    const { config } = useCommunity();
    const { t } = useTranslation('common');
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [plans, setPlans] = useState<Plan[]>([]);
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [subscribing, setSubscribing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchData = async () => {
        try {
            const [plansRes, statusRes] = await Promise.all([
                api.get('/subscriptions/plans'),
                api.get('/subscriptions/status')
            ]);
            setPlans(plansRes.data.plans);
            setBenefits(plansRes.data.benefits);
            setStatus(statusRes.data);
        } catch (error) {
            console.error('Error fetching elite data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tratar retorno do Mercado Pago
    useEffect(() => {
        const paymentStatus = searchParams.get('status');
        
        if (paymentStatus) {
            // Limpar parâmetros da URL
            setSearchParams({});
            
            if (paymentStatus === 'success') {
                // Pagamento aprovado!
                confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.5 },
                    colors: ['#8B5CF6', '#6366F1', '#4F46E5', '#818CF8', '#A78BFA']
                });
                showEdgeNotification('success', t('elite.welcomeElite'), t('elite.success'));
                // Recarregar dados
                fetchData();
            } else if (paymentStatus === 'pending') {
                showEdgeNotification('info', t('payments.awaitingPayment'), t('payments.processing'));
            } else if (paymentStatus === 'failure') {
                showEdgeNotification('error', t('payments.paymentFailed'), t('payments.tryAgain'));
            }
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubscribe = async () => {
        if (!selectedPlan) return;
        if (!user) {
            showEdgeNotification('error', t('errors.unauthorized'), t('elite.subscribe'));
            return;
        }
        
        setSubscribing(true);
        try {
            // Criar preferência no Mercado Pago
            const { data } = await api.post('/payment/elite/create-preference', {
                planType: selectedPlan
            });

            // Se for modo simulação, já foi ativado
            if (data.simulation) {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#8B5CF6', '#6366F1', '#4F46E5', '#818CF8']
                });
                showEdgeNotification('success', t('elite.welcomeElite'), data.message);
                setShowConfirmModal(false);
                fetchData();
                return;
            }

            // Redirecionar para o Mercado Pago
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error(t('errors.generic'));
            }
        } catch (error: any) {
            showEdgeNotification('error', t('status.error'), error.response?.data?.error || t('errors.generic'));
        } finally {
            setSubscribing(false);
        }
    };

    const handleCancelSubscription = async () => {
        setCancelling(true);
        try {
            const { data } = await api.post('/subscriptions/cancel', {
                reason: 'Cancelado pelo usuário'
            });
            showEdgeNotification('success', t('elite.cancel'), data.message);
            setShowCancelModal(false);
            fetchData();
        } catch (error: any) {
            showEdgeNotification('error', t('status.error'), error.response?.data?.error || t('errors.generic'));
        } finally {
            setCancelling(false);
        }
    };

    const getBenefitIcon = (id: string) => {
        const icons: Record<string, any> = {
            xpMultiplier: Zap,
            trophyMultiplier: Trophy,
            monthlyZions: Gift,
            shopDiscount: Package,
            noCommentLimit: MessageCircle,
            streakProtection: Shield,
            prioritySupport: Heart,
            exclusiveBackgrounds: Palette,
            animatedBorders: Sparkles,
            exclusiveColors: Star,
            earlyAccess: Rocket,
            exclusiveSupplyBox: Package
        };
        return icons[id] || Star;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader size="md" />
            </div>
        );
    }

    const isAlreadyElite = status?.isElite;

    return (
        <div className="min-h-screen relative text-white">
            {/* ColorBends animated background - Elite theme */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
                <ColorBends
                    colors={['#7C3AED', '#A78BFA', '#5227FF', '#8B5CF6', '#312e81']}
                    rotation={0}
                    speed={0.2}
                    scale={1}
                    frequency={1}
                    warpStrength={1}
                    noise={0.1}
                    transparent={false}
                    autoRotate={0}
                    mouseInfluence={0}
                    parallax={0}
                />
            </div>
            
            <div className="relative z-10">
                <Header />
                
                <main className="pt-24 pb-32 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section - Compact & Professional */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center mb-16"
                    >
                        {/* Badge pill */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
                        >
                            <Crown className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-medium text-violet-300">{t('elite.exclusiveZone')}</span>
                        </motion.div>
                        
                        {/* Title with Premium Typography */}
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-5xl md:text-7xl font-black mb-4 tracking-tight"
                        >
                            <span className="inline-block bg-gradient-to-b from-white via-white to-violet-200 bg-clip-text text-transparent">
                                {config.tierVipName}
                            </span>
                            <span className="inline-block ml-3 bg-gradient-to-b from-violet-300 via-violet-400 to-indigo-500 bg-clip-text text-transparent">
                                ELITE
                            </span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-8 font-light"
                        >
                            {t('elite.subtitle')}
                        </motion.p>

                        {isAlreadyElite && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-xl border border-violet-500/30"
                            >
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                                    <Crown className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white font-medium">{t('elite.alreadyMember')}</span>
                                <div className="h-5 w-px bg-white/20" />
                                <span className="text-violet-300 font-bold">{t('elite.daysRemaining', { days: status?.daysRemaining })}</span>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Benefits Grid - Glass Cards */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mb-20"
                    >
                        <h2 className="text-2xl font-bold text-center mb-3 text-white/90 tracking-wide">
                            {t('elite.benefitsTitle')}
                        </h2>
                        <p className="text-center text-white/40 mb-10">{t('elite.subtitle')}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {benefits.map((benefit, index) => {
                                const Icon = getBenefitIcon(benefit.id);
                                return (
                                    <motion.div
                                        key={benefit.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index + 0.6 }}
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        className="group relative p-6 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-violet-500/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(139,92,246,0.15)] overflow-hidden"
                                    >
                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5" />
                                        
                                        <div className="relative flex items-start gap-5">
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 group-hover:border-violet-500/40 transition-colors shadow-[0_4px_20px_rgba(139,92,246,0.15)]">
                                                <Icon className="w-6 h-6 text-violet-300" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white text-lg mb-1.5 group-hover:text-violet-200 transition-colors">{benefit.name}</h3>
                                                <p className="text-sm text-white/50 leading-relaxed">{benefit.description}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Pricing Section - Premium Glass Cards */}
                    {!isAlreadyElite && (
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                        >
                            <h2 className="text-2xl font-bold text-center mb-3 text-white/90 tracking-wide">
                                {t('payments.selectAmount')}
                            </h2>
                            <p className="text-center text-white/40 mb-10">{t('payments.secure')}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {plans.map((plan, index) => (
                                    <motion.button
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index + 0.8 }}
                                        whileHover={{ scale: 1.03, y: -6 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative p-6 rounded-3xl text-left transition-all duration-500 overflow-hidden ${
                                            selectedPlan === plan.id
                                                ? 'bg-white/10 border-2 border-violet-500 shadow-[0_20px_50px_rgba(139,92,246,0.3)]'
                                                : 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        {/* Popular Badge */}
                                        {plan.popular && (
                                            <div className="absolute -top-px left-1/2 -translate-x-1/2">
                                                <div className="px-4 py-1.5 rounded-b-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]">
                                                    {t('elite.bestValue')}
                                                </div>
                                            </div>
                                        )}

                                        {/* Selected Glow */}
                                        {selectedPlan === plan.id && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10" />
                                        )}
                                        
                                        <div className="relative">
                                            <h3 className="text-lg font-bold text-white mb-4 mt-2">{plan.name}</h3>
                                            
                                            <div className="mb-4">
                                                <span className="text-4xl font-black bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent">
                                                    R$ {plan.price.toFixed(2).replace('.', ',')}
                                                </span>
                                                {plan.pricePerMonth && (
                                                    <span className="block text-sm text-white/40 mt-1">
                                                        R$ {plan.pricePerMonth}/mês
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm text-white/50 mb-4">{plan.duration}</p>
                                            
                                            {plan.savings && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tier-std-500/20 text-tier-std-400 text-xs font-bold border border-tier-std-500/30">
                                                    <Sparkles className="w-3 h-3" />
                                                    {t('elite.annualDiscount', { percent: plan.savings })}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Selection Indicator */}
                                        <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            selectedPlan === plan.id 
                                                ? 'border-violet-500 bg-violet-500' 
                                                : 'border-white/20'
                                        }`}>
                                            {selectedPlan === plan.id && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Subscribe Button - Premium CTA */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="mt-12 text-center"
                            >
                                <LiquidEliteButton
                                    onClick={() => setShowConfirmModal(true)}
                                    disabled={!selectedPlan}
                                />
                                
                                <p className="text-sm text-white/30 mt-6 flex items-center justify-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    {t('payments.secure')}
                                </p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Elite Status Card - Premium Glass */}
                    {isAlreadyElite && status && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="max-w-xl mx-auto"
                        >
                            <div className="relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(139,92,246,0.15)] overflow-hidden">
                                {/* Background Glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5" />
                                
                                <div className="relative">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_8px_32px_rgba(139,92,246,0.4)]">
                                            <Crown className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{t('elite.eliteActive')}</h3>
                                            <p className="text-white/50">{t('elite.benefitsSubtitle')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-white/40 text-sm mb-1">{t('elite.memberSince')}</p>
                                            <p className="text-white font-bold text-lg">
                                                {status.eliteSince 
                                                    ? new Date(status.eliteSince).toLocaleDateString('pt-BR')
                                                    : '-'
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-white/40 text-sm mb-1">{t('elite.expiresAt')}</p>
                                            <p className="text-white font-bold text-lg">
                                                {status.eliteUntil 
                                                    ? new Date(status.eliteUntil).toLocaleDateString('pt-BR')
                                                    : '-'
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30">
                                            <p className="text-violet-300 text-sm mb-1">{t('elite.daysRemaining', { days: '' })}</p>
                                            <p className="text-violet-200 font-black text-3xl">{status.daysRemaining}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                                            <p className="text-orange-300 text-sm mb-1">{t('profile.currentStreak')}</p>
                                            <p className="text-orange-200 font-black text-3xl">{status.eliteStreak} 🔥</p>
                                        </div>
                                    </div>

                                    {/* Cancel Button or Cancelled Notice */}
                                    {status.isCancelled ? (
                                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                                            <p className="text-amber-400 font-semibold flex items-center justify-center gap-2">
                                                <Shield className="w-5 h-5" />
                                                {t('elite.cancel')}
                                            </p>
                                            <p className="text-sm text-white/40 mt-1">
                                                {t('elite.expiresAt')}: {status.eliteUntil 
                                                    ? new Date(status.eliteUntil).toLocaleDateString()
                                                    : '-'}
                                            </p>
                                        </div>
                                    ) : status.activeSubscription && status.activeSubscription.status === 'ACTIVE' && (
                                        <div className="pt-6 border-t border-white/10">
                                            <button
                                                onClick={() => setShowCancelModal(true)}
                                                className="w-full py-3 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-300"
                                            >
                                                {t('elite.cancel')}
                                            </button>
                                            <p className="text-xs text-white/30 text-center mt-2">
                                                {t('elite.benefitsContinue')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
            </div>

            {/* Confirm Modal - Premium Glass Design */}
            <AnimatePresence>
                {showConfirmModal && selectedPlan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white/[0.05] backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="absolute top-4 right-4 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/30 mb-4">
                                    <Crown className="w-8 h-8 text-violet-300" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{t('actions.confirm')}</h3>
                                <p className="text-white/50">
                                    {plans.find(p => p.id === selectedPlan)?.name}
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-white/40">{t('payments.total')}</span>
                                    <span className="text-3xl font-black bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                                        R$ {plans.find(p => p.id === selectedPlan)?.price.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                                <p className="text-sm text-white/30">
                                    {t('payments.processing')}
                                </p>
                            </div>

                            <motion.button
                                onClick={handleSubscribe}
                                disabled={subscribing}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-5 rounded-2xl font-bold bg-gradient-to-r from-violet-500 to-indigo-600 text-white flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_16px_40px_rgba(139,92,246,0.3)] hover:shadow-[0_20px_50px_rgba(139,92,246,0.4)] transition-all"
                            >
                                {subscribing ? (
                                    <>
                                        <Loader size="sm" />
                                        {t('payments.processing')}
                                    </>
                                ) : (
                                    <>
                                        <Crown className="w-5 h-5" />
                                        {t('payments.paymentMethod')}
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Cancel Subscription Modal - Premium Glass Design */}
                {showCancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-white/[0.05] backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 mb-4">
                                    <X className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{t('elite.cancelConfirm')}</h3>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
                                <p className="text-sm text-white/60 mb-3 flex items-center gap-2">
                                    <Check className="text-tier-std-400 w-4 h-4" /> 
                                    {t('elite.benefitsContinue')}
                                </p>
                                <p className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                                    {status?.eliteUntil 
                                        ? new Date(status.eliteUntil).toLocaleDateString('pt-BR', { 
                                            day: '2-digit', 
                                            month: 'long', 
                                            year: 'numeric' 
                                        })
                                        : '-'
                                    }
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <motion.button
                                    onClick={() => setShowCancelModal(false)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 py-4 rounded-2xl font-semibold bg-white/10 text-white hover:bg-white/15 transition-all border border-white/10"
                                >
                                    {t('actions.cancel')}
                                </motion.button>
                                <motion.button
                                    onClick={handleCancelSubscription}
                                    disabled={cancelling}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 py-4 rounded-2xl font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {cancelling ? (
                                        <Loader size="sm" />
                                    ) : (
                                        t('actions.confirm')
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
