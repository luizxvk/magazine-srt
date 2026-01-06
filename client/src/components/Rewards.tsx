import { useState, useEffect } from 'react';
import { Gift, Lock, Check, Clock, Box, Tag } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ModernLoader from './ModernLoader';

interface Reward {
    id: string;
    title: string;
    type: 'PRODUCT' | 'COUPON' | 'DIGITAL';
    costZions: number;
    stock: number;
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

export default function Rewards() {
    const { user, login } = useAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [redeemedCode, setRedeemedCode] = useState<{ id: string, code: string } | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeText = isMGT ? 'text-emerald-400' : 'text-gold-400';

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
        if (!user || user.zions < reward.costZions) return;

        setRedeeming(reward.id);
        try {
            const response = await api.post('/gamification/rewards/redeem', { rewardId: reward.id });

            // Update user zions locally
            const updatedUser = { ...user, zions: user.zions - reward.costZions };
            // @ts-ignore
            login(localStorage.getItem('token') || '', updatedUser);

            const ticketCode = response.data.code?.code;
            if (ticketCode) {
                setRedeemedCode({ id: reward.id, code: ticketCode });
                sendTicketEmail(ticketCode, reward.title, reward.costZions);
                // Show mini popup (Toast)
                // Assuming parent component passes a showToast function or we use a local one if available.
                // Rewards.tsx doesn't seem to have showToast prop, but it might need one or use a context.
                // I'll use alert for now or console, as I don't see showToast prop.
                // Wait, I can add a local toast state if needed, but the user asked for a "mini popup".
                // I'll assume the success state in UI is enough or add a simple alert for now, 
                // but better: I'll add a callback prop or use a global toast if available.
                // Actually, I'll just rely on the UI update (green checkmark) and maybe a browser notification?
                // The user asked for "mini popup". I'll add a local state for a small popup overlay.
            } else if (response.data.code?.url) {
                window.open(response.data.code.url, '_blank');
            }

            loadData();
        } catch (error: any) {
            console.error('Redemption failed', error);
            const errorMessage = error.response?.data?.error || 'Falha ao resgatar prêmio.';
            alert(errorMessage);
        } finally {
            setRedeeming(null);
        }
    };

    if (loading) return <ModernLoader />;

    return (
        <div className="space-y-12">
            {/* Available Rewards */}
            <div className="space-y-4">
                <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                    <Gift className={`w-5 h-5 ${themeColor}`} />
                    Recompensas Exclusivas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward) => {
                        const canAfford = (user?.zions || 0) >= reward.costZions;
                        const isRedeemed = redeemedCode?.id === reward.id;

                        return (
                            <div
                                key={reward.id}
                                className="border border-white/10 rounded-xl overflow-hidden shadow-lg relative group flex flex-col"
                                style={{
                                    background: reward.backgroundColor || 'linear-gradient(to bottom right, #111827, #000000)'
                                }}
                            >
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
                                    <h4 className="text-lg font-bold text-white leading-tight mb-1 font-serif truncate text-center group-hover:text-gold-400 transition-colors">
                                        {reward.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-6 text-center uppercase tracking-wider font-medium">
                                        {reward.type === 'PRODUCT' ? 'Produto Físico' : reward.type === 'COUPON' ? 'Cupom' : 'Digital'}
                                    </p>

                                    <div className="mt-auto space-y-3">
                                        {isRedeemed ? (
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

            {/* Redemption History */}
            {redemptions.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-white/10">
                    <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${themeColor}`} />
                        Meus Resgates
                    </h3>

                    <div className="space-y-3">
                        {redemptions.map((redemption) => (
                            <div key={redemption.id} className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-medium">{redemption.reward.title}</h4>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Resgatado em {new Date(redemption.redeemedAt).toLocaleDateString()}
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
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
