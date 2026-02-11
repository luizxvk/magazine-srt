import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Crown, Zap, Trophy, Gift, MessageCircle, Shield, Palette, 
    Sparkles, Star, Check, X,
    Rocket, Heart, Package
} from 'lucide-react';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import ColorBends from '../components/ColorBends';
import { LiquidButton } from '../components/LiquidGradient';
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
                showEdgeNotification('success', 'Bem-vindo ao ELITE! 🎉', 'Seus benefícios já estão ativos');
                // Recarregar dados
                fetchData();
            } else if (paymentStatus === 'pending') {
                showEdgeNotification('info', 'Pagamento pendente', 'Aguardando confirmação do pagamento');
            } else if (paymentStatus === 'failure') {
                showEdgeNotification('error', 'Pagamento falhou', 'Tente novamente ou use outro método');
            }
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubscribe = async () => {
        if (!selectedPlan) return;
        if (!user) {
            showEdgeNotification('error', 'Login necessário', 'Faça login para assinar o ELITE');
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
                showEdgeNotification('success', 'Bem-vindo ao ELITE! 🎉', data.message);
                setShowConfirmModal(false);
                fetchData();
                return;
            }

            // Redirecionar para o Mercado Pago
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error('Link de pagamento não gerado');
            }
        } catch (error: any) {
            showEdgeNotification('error', 'Erro', error.response?.data?.error || 'Erro ao processar assinatura');
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
            showEdgeNotification('success', 'Assinatura cancelada', data.message);
            setShowCancelModal(false);
            fetchData();
        } catch (error: any) {
            showEdgeNotification('error', 'Erro', error.response?.data?.error || 'Erro ao cancelar assinatura');
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
        <div className="min-h-screen text-white relative">
            {/* ColorBends animated background - full page, no mouse interaction */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                <ColorBends
                    colors={['#7c3aed', '#6366f1', '#4f46e5', '#8b5cf6', '#312e81']}
                    rotation={30}
                    speed={0.15}
                    scale={1.2}
                    frequency={0.8}
                    warpStrength={0.6}
                    noise={0.05}
                    transparent={false}
                    autoRotate={2}
                    mouseInfluence={0}
                    parallax={0}
                />
            </div>
            <Header />
            
            <main className="relative z-10 pt-24 pb-32 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="inline-flex p-6 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 mb-6"
                        >
                            <Crown className="w-16 h-16 text-violet-400" />
                        </motion.div>
                        
                        <h1 className="text-5xl md:text-6xl font-black mb-4">
                            <span className="bg-gradient-to-r from-violet-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                MGT ELITE
                            </span>
                        </h1>
                        
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
                            Eleve sua experiência ao máximo. XP em dobro, benefícios exclusivos e muito mais.
                        </p>

                        {isAlreadyElite && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/50"
                            >
                                <Crown className="w-5 h-5 text-violet-400" />
                                <span className="text-violet-300 font-bold">Você é ELITE!</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-300">{status?.daysRemaining} dias restantes</span>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Benefits Grid */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-16"
                    >
                        <h2 className="text-2xl font-bold text-center mb-8 text-white">
                            Benefícios Exclusivos
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {benefits.map((benefit, index) => {
                                const Icon = getBenefitIcon(benefit.id);
                                return (
                                    <motion.div
                                        key={benefit.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-colors">
                                                <Icon className="w-6 h-6 text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white mb-1">{benefit.name}</h3>
                                                <p className="text-sm text-gray-400">{benefit.description}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Pricing Section */}
                    {!isAlreadyElite && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h2 className="text-2xl font-bold text-center mb-8 text-white">
                                Escolha seu Plano
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {plans.map((plan, index) => (
                                    <motion.button
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                                            selectedPlan === plan.id
                                                ? 'border-violet-500 bg-violet-500/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/30'
                                        }`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-xs font-bold text-white">
                                                POPULAR
                                            </div>
                                        )}
                                        
                                        <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                                        
                                        <div className="mb-3">
                                            <span className="text-3xl font-black text-violet-400">
                                                R$ {plan.price.toFixed(2).replace('.', ',')}
                                            </span>
                                            {plan.pricePerMonth && (
                                                <span className="text-sm text-gray-500 ml-2">
                                                    (R$ {plan.pricePerMonth}/mês)
                                                </span>
                                            )}
                                        </div>
                                        
                                        <p className="text-sm text-gray-400 mb-3">{plan.duration}</p>
                                        
                                        {plan.savings && (
                                            <span className="inline-block px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                                                Economize {plan.savings}
                                            </span>
                                        )}
                                        
                                        {selectedPlan === plan.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-4 right-4"
                                            >
                                                <Check className="w-6 h-6 text-violet-400" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Subscribe Button */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-8 text-center"
                            >
                                <LiquidButton
                                    onClick={() => setShowConfirmModal(true)}
                                    disabled={!selectedPlan}
                                    className="w-48 h-[2.7em] mx-auto"
                                >
                                    <Crown className="w-5 h-5 group-hover:fill-violet-300 fill-white shrink-0" />
                                    ASSINAR ELITE
                                </LiquidButton>
                                
                                <p className="text-sm text-gray-500 mt-6">
                                    Pagamento seguro via Mercado Pago (PIX, Cartão ou Boleto)
                                </p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Elite Status Card */}
                    {isAlreadyElite && status && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-lg mx-auto p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30"
                        >
                            <h3 className="text-xl font-bold text-violet-400 mb-4 flex items-center gap-2">
                                <Crown className="w-6 h-6" />
                                Seu Status ELITE
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Membro desde</span>
                                    <span className="text-white font-medium">
                                        {status.eliteSince 
                                            ? new Date(status.eliteSince).toLocaleDateString('pt-BR')
                                            : '-'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Válido até</span>
                                    <span className="text-white font-medium">
                                        {status.eliteUntil 
                                            ? new Date(status.eliteUntil).toLocaleDateString('pt-BR')
                                            : '-'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Dias restantes</span>
                                    <span className="text-violet-400 font-bold">{status.daysRemaining}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Streak de meses</span>
                                    <span className="text-violet-400 font-bold">{status.eliteStreak} 🔥</span>
                                </div>
                            </div>

                            {/* Cancel Button or Cancelled Notice */}
                            {status.isCancelled ? (
                                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                                    <p className="text-amber-400 font-medium flex items-center justify-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Assinatura cancelada
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Você mantém os benefícios até {status.eliteUntil 
                                            ? new Date(status.eliteUntil).toLocaleDateString('pt-BR')
                                            : 'o fim do período'}
                                    </p>
                                </div>
                            ) : status.activeSubscription && status.activeSubscription.status === 'ACTIVE' && (
                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="w-full py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        Cancelar assinatura
                                    </button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Você mantém os benefícios até o fim do período atual
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Confirm Modal */}
            <AnimatePresence>
                {showConfirmModal && selectedPlan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="inline-flex p-4 rounded-full bg-violet-500/20 mb-4">
                                    <Crown className="w-10 h-10 text-violet-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Confirmar Assinatura</h3>
                                <p className="text-gray-400">
                                    Plano {plans.find(p => p.id === selectedPlan)?.name}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Total</span>
                                    <span className="text-2xl font-bold text-violet-400">
                                        R$ {plans.find(p => p.id === selectedPlan)?.price.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Você será redirecionado ao Mercado Pago para concluir o pagamento.
                                </p>
                            </div>

                            <button
                                onClick={handleSubscribe}
                                disabled={subscribing}
                                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {subscribing ? (
                                    <>
                                        <Loader size="sm" />
                                        Redirecionando...
                                    </>
                                ) : (
                                    <>
                                        <Crown className="w-5 h-5" />
                                        IR PARA PAGAMENTO
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Cancel Subscription Modal */}
                {showCancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex p-4 rounded-full bg-red-500/20 mb-4">
                                    <X className="w-10 h-10 text-red-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Cancelar Assinatura?</h3>
                                <p className="text-gray-400">
                                    Tem certeza que deseja cancelar sua assinatura ELITE?
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                                <p className="text-sm text-gray-300 mb-2">
                                    <span className="text-green-400">✓</span> Seus benefícios continuam ativos até:
                                </p>
                                <p className="text-violet-400 font-bold text-lg">
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

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-3 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    Manter assinatura
                                </button>
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={cancelling}
                                    className="flex-1 py-3 rounded-xl font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {cancelling ? (
                                        <Loader size="sm" />
                                    ) : (
                                        'Confirmar'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
