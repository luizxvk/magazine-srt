import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Crown, Zap, Trophy, Gift, MessageCircle, Shield, Palette, 
    Sparkles, Star, Check, ChevronRight, X,
    Rocket, Heart, Package
} from 'lucide-react';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
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
    benefits: any;
    prices: Record<string, number>;
}

export default function ElitePage() {
    const { user, showEdgeNotification } = useAuth();
    
    const [plans, setPlans] = useState<Plan[]>([]);
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [subscribing, setSubscribing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleSubscribe = async () => {
        if (!selectedPlan) return;
        if (!user) {
            showEdgeNotification('error', 'Login necessário', 'Faça login para assinar o ELITE');
            return;
        }
        
        setSubscribing(true);
        try {
            const { data } = await api.post('/subscriptions/subscribe', {
                planType: selectedPlan,
                paymentMethod: 'pix'
            });

            // Trigger confetti
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF6B35', '#E91E63']
            });

            showEdgeNotification('success', 'Bem-vindo ao ELITE! 🎉', data.message);
            setShowConfirmModal(false);
            fetchData();
        } catch (error: any) {
            showEdgeNotification('error', 'Erro', error.response?.data?.error || 'Erro ao processar assinatura');
        } finally {
            setSubscribing(false);
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
        <div className="min-h-screen bg-black text-white">
            <LuxuriousBackground />
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
                            className="inline-flex p-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6"
                        >
                            <Crown className="w-16 h-16 text-amber-400" />
                        </motion.div>
                        
                        <h1 className="text-5xl md:text-6xl font-black mb-4">
                            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
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
                                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50"
                            >
                                <Crown className="w-5 h-5 text-amber-400" />
                                <span className="text-amber-300 font-bold">Você é ELITE!</span>
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
                                        className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-colors">
                                                <Icon className="w-6 h-6 text-amber-400" />
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
                                                ? 'border-amber-500 bg-amber-500/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/30'
                                        }`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-black">
                                                POPULAR
                                            </div>
                                        )}
                                        
                                        <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                                        
                                        <div className="mb-3">
                                            <span className="text-3xl font-black text-amber-400">
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
                                                <Check className="w-6 h-6 text-amber-400" />
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
                                    className="w-64 h-14 mx-auto"
                                >
                                    <Crown className="w-5 h-5" />
                                    ASSINAR ELITE
                                    <ChevronRight className="w-5 h-5" />
                                </LiquidButton>
                                
                                <p className="text-sm text-gray-500 mt-6">
                                    Pagamento seguro via PIX
                                </p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Elite Status Card */}
                    {isAlreadyElite && status && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-lg mx-auto p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
                        >
                            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
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
                                    <span className="text-amber-400 font-bold">{status.daysRemaining}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Streak de meses</span>
                                    <span className="text-amber-400 font-bold">{status.eliteStreak} 🔥</span>
                                </div>
                            </div>
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
                                <div className="inline-flex p-4 rounded-full bg-amber-500/20 mb-4">
                                    <Crown className="w-10 h-10 text-amber-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Confirmar Assinatura</h3>
                                <p className="text-gray-400">
                                    Plano {plans.find(p => p.id === selectedPlan)?.name}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Total</span>
                                    <span className="text-2xl font-bold text-amber-400">
                                        R$ {plans.find(p => p.id === selectedPlan)?.price.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Pagamento via PIX. Seus benefícios serão ativados imediatamente.
                                </p>
                            </div>

                            <button
                                onClick={handleSubscribe}
                                disabled={subscribing}
                                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {subscribing ? (
                                    <>
                                        <Loader size="sm" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Crown className="w-5 h-5" />
                                        CONFIRMAR E PAGAR
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
