import { Calendar, Check, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DailyLoginCardProps {
    status: {
        claimed: boolean;
        streak: number;
        nextReward: number;
    } | null;
    onClick: () => void;
}

export default function DailyLoginCard({ status, onClick }: DailyLoginCardProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    // Explicit theme colors - no ambiguity
    const themeText = isMGT ? 'text-emerald-400' : 'text-gold-400';
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeHover = isMGT ? 'hover:border-emerald-500/60' : 'hover:border-gold-500/60';
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const iconBg = isMGT ? 'text-emerald-500/10' : 'text-gold-500/10';

    if (!status) {
        return (
            <div className={`w-full ${themeBg} backdrop-blur-xl p-4 rounded-2xl border ${themeBorder} ${themeGlow} relative overflow-hidden`}>
                <div className="flex justify-center items-center py-4">
                    <div className={`w-6 h-6 border-2 ${isMGT ? 'border-emerald-500' : 'border-gold-500'} border-t-transparent rounded-full animate-spin`}></div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`w-full ${themeBg} backdrop-blur-xl p-4 rounded-2xl border ${themeBorder} ${themeHover} ${themeGlow} transition-all duration-300 group text-left relative overflow-hidden`}
        >
            {/* Background Icon */}
            <div className={`absolute -top-4 -right-4 opacity-20 group-hover:opacity-30 transition-opacity`}>
                <Calendar className={`w-28 h-28 ${iconBg}`} style={{ color: isMGT ? 'rgba(16,185,129,0.3)' : 'rgba(212,175,55,0.3)' }} />
            </div>

            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h3 className={`font-serif text-lg mb-1 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        <Gift className={`w-5 h-5 ${themeText}`} />
                        Bônus Diário
                        {status.claimed && <Check className="w-4 h-4 text-green-400" />}
                    </h3>
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {status.claimed
                            ? `Volte amanhã para continuar sua sequência de ${status.streak} dias!`
                            : `Resgate agora seus ${status.nextReward} Zions e mantenha a sequência!`}
                    </p>
                </div>

                <div className="flex flex-col items-end">
                    <span className={`text-2xl font-bold ${themeText}`}>
                        {status.streak}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Dias Seguidos</span>
                </div>
            </div>
        </button>
    );
}
