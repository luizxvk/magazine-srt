import { useState, useEffect } from 'react';
import { Gift, Lock, Check, Clock, Box, Tag, X, History, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ModernLoader from './ModernLoader';

interface Reward {
    id: string;
    title: string;
    type: 'PRODUCT' | 'COUPON' | 'DIGITAL';
    costZions: number;
    zionsReward?: number;
    stock: number;
    isUnlimited: boolean;
    metadata: any;
    backgroundColor?: string;
}

interface Redemption {
    id: string;
    reward: Reward;
    cost: number;
    redeemedAt: string;
    code?: string;
    status: string;
    metadata?: any;
}

interface ZionHistoryItem {
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
}

export default function Rewards() {
    const { user, login, theme } = useAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [zionHistory, setZionHistory] = useState<ZionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [redeemedCode, setRedeemedCode] = useState<{ id: string, code: string } | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'redemptions' | 'history'>('redemptions');
    const [historyLimit, setHistoryLimit] = useState(10);

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeText = isMGT ? 'text-emerald-400' : 'text-gold-400';
    const themeCardText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const themeTabActive = isMGT ? 'text-emerald-500' : 'text-gold-400';
    const themeTabBorder = isMGT ? 'bg-emerald-500' : 'bg-gold-500';
    const themeShadow = isMGT ? 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'shadow-[0_0_10px_rgba(212,175,55,0.5)]';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rewardsRes, redemptionsRes] = await Promise.all([
                api.get('/gamification/rewards'),
                api.get('/gamification/rewards/my')
            ]);
            setRewards(rewardsRes.data);
            setRedemptions(redemptionsRes.data);
            
            // Load zions history separately (may fail if table doesn't exist yet)
            try {
                const historyRes = await api.get('/gamification/zions-history');
                setZionHistory(historyRes.data);
            } catch (historyError) {
                console.warn('Zions history not available yet:', historyError);
                setZionHistory([]);
            }
        } catch (error) {
            console.error('Failed to load rewards data', error);
        } finally {
            setLoading(false);
        }
    };

    const sendTicketEmail = async (ticket: string, rewardTitle: string, cost: number) => {
        // Placeholder for EmailJS
        console.log(`[EmailJS] Sending ticket ${ticket} for ${rewardTitle} (${cost} Zions) to ${user?.email}`);
        // emailjs.send('service_id', 'template_id', { to_email: user.email, ticket, reward: rewardTitle, cost, date: new Date().toLocaleDateString() });
    };

    const handleRedeem = async (reward: Reward) => {
        if (!user || (user.zionsPoints || 0) < reward.costZions) return;

        setRedeeming(reward.id);
        try {
            const response = await api.post('/gamification/rewards/redeem', { rewardId: reward.id });

            // Buscar o usuário atualizado do backend para garantir que os Zions estão corretos
            const userResponse = await api.get('/users/me');
            const updatedUser = userResponse.data;
            // @ts-ignore
            login(localStorage.getItem('token') || '', updatedUser);

            const ticketCode = response.data.code?.code;
            if (ticketCode) {
                setRedeemedCode({ id: reward.id, code: ticketCode });
                sendTicketEmail(ticketCode, reward.title, reward.costZions);
                
                // Mostrar notificação de sucesso com informações sobre Zions
                const zionChange = reward.costZions - (reward.zionsReward || 0);
                let successMessage = `Recompensa resgatada com sucesso! Ticket: ${ticketCode}`;
                
                if (reward.zionsReward && reward.zionsReward > 0) {
                    successMessage += `\n💎 Você recebeu ${reward.zionsReward} Zions!`;
                    if (zionChange > 0) {
                        successMessage += ` (Custo: ${reward.costZions} - Recompensa: ${reward.zionsReward} = -${zionChange} Zions)`;
                    } else if (zionChange < 0) {
                        successMessage += ` (Você ganhou ${Math.abs(zionChange)} Zions!)`;
                    }
                } else {
                    successMessage += `\n💰 -${reward.costZions} Zions`;
                }
                
                setNotification({ type: 'success', message: successMessage });
                setTimeout(() => setNotification(null), 6000);
            } else if (response.data.code?.url) {
                window.open(response.data.code.url, '_blank');
            }

            loadData();
        } catch (error: any) {
            console.error('Redemption failed', error);
            const errorMessage = error.response?.data?.error || 'Falha ao resgatar prêmio.';
            setNotification({ type: 'error', message: errorMessage });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setRedeeming(null);
        }
    };

    if (loading) return <ModernLoader />;

    return (
        <div className="space-y-12 relative">
            {/* Styled Notification Popup */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className={`relative backdrop-blur-xl rounded-2xl border shadow-2xl p-4 pr-12 max-w-md w-full pointer-events-auto ${
                            notification.type === 'error' 
                                ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                                : notification.type === 'success'
                                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}>
                            <button
                                onClick={() => setNotification(null)}
                                className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                    notification.type === 'error' ? 'bg-red-500/20' : 
                                    notification.type === 'success' ? 'bg-green-500/20' : 'bg-blue-500/20'
                                }`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{notification.message}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Available Rewards */}
            <div className="space-y-4">
                <h3 className={`text-xl font-serif ${themeCardText} mb-6 flex items-center gap-2`}>
                    <Gift className={`w-5 h-5 ${themeColor}`} />
                    Recompensas Exclusivas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <Gift className="w-12 h-12 text-gray-500/50 mb-4" />
                            <p className={`text-lg font-medium ${themeSecondary}`}>Nenhuma recompensa disponível</p>
                            <p className="text-sm text-gray-500 mt-1">Fique ligado! Novas recompensas serão adicionadas em breve.</p>
                        </div>
                    ) : rewards.map((reward) => {
                        const canAfford = (user?.zionsPoints || 0) >= reward.costZions;
                        const isRedeemed = redeemedCode?.id === reward.id;
                        const alreadyRedeemedUnique = !reward.isUnlimited && redemptions.some(r => r.reward.id === reward.id);

                        return (
                            <div
                                key={reward.id}
                                className="border border-white/10 rounded-xl overflow-hidden shadow-lg relative group flex flex-col"
                                style={{
                                    background: reward.backgroundColor || 'linear-gradient(to bottom right, #111827, #000000)'
                                }}
                            >
                                {/* Unique/Unlimited Badge */}
                                {!reward.isUnlimited && (
                                    <div className="absolute top-3 left-3 bg-gold-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-black shadow-lg z-10 uppercase tracking-wider">
                                        🎁 Único
                                    </div>
                                )}
                                
                                {/* Image/Icon Area */}
                                <div className="h-40 bg-black/50 flex items-center justify-center relative overflow-hidden">
                                    {reward.metadata?.imageUrl ? (
                                        <img src={reward.metadata.imageUrl} alt={reward.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="text-gold-500/50 transition-transform duration-500 group-hover:scale-110">
                                            {reward.type === 'PRODUCT' ? <Box className="w-16 h-16" /> :
                                                reward.type === 'COUPON' ? <Tag className="w-16 h-16" /> :
                                                    <Gift className="w-16 h-16" />}
                                        </div>
                                    )}

                                    {/* Cost Badge */}
                                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-gold-400 border border-gold-500/20 shadow-lg z-10">
                                        {reward.costZions === 0 ? 'GRÁTIS' : `${reward.costZions} Z`}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h4 className={`text-lg font-bold ${themeCardText} leading-tight mb-1 font-serif truncate text-center group-hover:${themeText} transition-colors`}>
                                        {reward.title}
                                    </h4>
                                    <p className={`text-xs ${themeSecondary} mb-6 text-center uppercase tracking-wider font-medium`}>
                                        {reward.type === 'PRODUCT' ? 'Produto Físico' : reward.type === 'COUPON' ? 'Cupom' : 'Digital'}
                                    </p>

                                    <div className="mt-auto space-y-3">
                                        {alreadyRedeemedUnique ? (
                                            <div className="w-full py-2.5 rounded-lg bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                                                <Lock className="w-4 h-4" />
                                                Já Resgatado
                                            </div>
                                        ) : isRedeemed ? (
                                            <div className="w-full py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                                                <Check className="w-4 h-4" />
                                                {redeemedCode.code}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleRedeem(reward)}
                                                disabled={!canAfford || reward.stock === 0 || redeeming === reward.id}
                                                className={`w-full py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2
                                                    ${canAfford && reward.stock > 0
                                                        ? 'bg-gold-500/10 border-gold-500/30 text-gold-400 hover:bg-gold-500 hover:text-black hover:border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                                        : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'}`}
                                            >
                                                {redeeming === reward.id ? 'Processando...' : (
                                                    canAfford ? (reward.stock > 0 ? 'Resgatar' : 'Esgotado') : <><Lock className="w-3 h-3" /> Bloqueado</>
                                                )}
                                            </button>
                                        )}

                                        <div className="flex justify-center items-center text-[10px] text-gray-600 font-medium uppercase tracking-widest">
                                            {reward.stock > 0 ? `${reward.stock} disponíveis` : 'Sem estoque'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* History Section with Tabs */}
            {(redemptions.length > 0 || zionHistory.length > 0) && (
                <div className="space-y-4 pt-8 border-t border-white/10">
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-white/10 pb-1">
                        <button
                            onClick={() => setActiveTab('redemptions')}
                            className={`pb-3 px-4 text-sm font-medium tracking-wide transition-colors relative flex items-center gap-2 ${
                                activeTab === 'redemptions' ? themeTabActive : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            Meus Resgates
                            {activeTab === 'redemptions' && (
                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeTabBorder} ${themeShadow}`} />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 px-4 text-sm font-medium tracking-wide transition-colors relative flex items-center gap-2 ${
                                activeTab === 'history' ? themeTabActive : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <History className="w-4 h-4" />
                            Histórico de Zions
                            {activeTab === 'history' && (
                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeTabBorder} ${themeShadow}`} />
                            )}
                        </button>
                    </div>

                    {/* Redemptions Tab Content */}
                    {activeTab === 'redemptions' && (
                        <div className="space-y-3">
                            {redemptions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhum resgate realizado ainda</p>
                                </div>
                            ) : (
                                redemptions.map((redemption) => (
                                    <div key={redemption.id} className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <h4 className={`${themeCardText} font-medium`}>{redemption.reward.title}</h4>
                                            <p className={`text-xs ${themeSecondary} mt-1`}>
                                                Resgatado em {new Date(redemption.redeemedAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right mr-4">
                                                <span className={`text-sm font-bold ${themeText}`}>
                                                    -{redemption.cost}
                                                </span>
                                                <span className="text-[10px] text-gray-600 block uppercase tracking-widest">Zions</span>
                                            </div>

                                            {/* Status Display */}
                                            <div className="flex flex-col items-end gap-1">
                                                {redemption.status === 'PENDING' && (
                                                    <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-yellow-500/20">
                                                        Em Análise
                                                    </div>
                                                )}
                                                {redemption.status === 'PROCESSING' && (
                                                    <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                                                        Processando
                                                    </div>
                                                )}
                                                {redemption.status === 'COMPLETED' && (
                                                    <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                        Completo
                                                    </div>
                                                )}
                                                {redemption.status === 'CANCELLED' && (
                                                    <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                                                        Cancelado
                                                    </div>
                                                )}

                                                {redemption.metadata?.ticketCode && (
                                                    <span className="text-[10px] font-mono text-gray-500">
                                                        {redemption.metadata.ticketCode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Zion History Tab Content */}
                    {activeTab === 'history' && (
                        <div className="space-y-3">
                            {zionHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma transação registrada</p>
                                </div>
                            ) : (
                                <>
                                {zionHistory.slice(0, historyLimit).map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                item.amount > 0 
                                                    ? 'bg-green-500/10' 
                                                    : 'bg-red-500/10'
                                            }`}>
                                                {item.amount > 0 ? (
                                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={`${themeCardText} font-medium text-sm`}>
                                                    {item.reason}
                                                </h4>
                                                <p className={`text-xs ${themeSecondary}`}>
                                                    {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-bold ${
                                                item.amount > 0 
                                                    ? 'text-green-400' 
                                                    : 'text-red-400'
                                            }`}>
                                                {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString('pt-BR')}
                                            </span>
                                            <span className="text-[10px] text-gray-600 block uppercase tracking-widest">
                                                Points
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                                {zionHistory.length > historyLimit && (
                                    <button
                                        onClick={() => setHistoryLimit(prev => prev + 10)}
                                        className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${isMGT ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-gold-500/10 text-gold-400 hover:bg-gold-500/20'}`}
                                    >
                                        Mostrar Mais ({zionHistory.length - historyLimit} restantes)
                                    </button>
                                )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
