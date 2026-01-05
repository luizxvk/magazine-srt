import { Calendar, Check } from 'lucide-react';
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
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const themeText = isMGT ? 'text-emerald-400' : 'text-gold-400';
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeHover = isMGT ? 'hover:border-red-500/50' : 'hover:border-gold-500/50';

    if (!status) {
        return (
            <div className={`w-full glass-panel p-4 rounded-xl border ${themeBorder} animate-pulse relative overflow-hidden`}>
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <div className="h-5 bg-white/10 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-white/10 rounded w-48"></div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="h-8 bg-white/10 rounded w-8 mb-1"></div>
                        <div className="h-2 bg-white/10 rounded w-20"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`w-full glass-panel p-4 rounded-xl border ${themeBorder} ${themeHover} transition-all group text-left relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Calendar className={`w-24 h-24 ${themeText}`} />
            </div>

            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h3 className={`font-serif text-lg mb-1 flex items-center gap-2 ${isMGT ? 'text-white' : 'text-white'}`}>
                        Bônus Diário
                        {status.claimed && <Check className="w-4 h-4 text-green-400" />}
                    </h3>
                    <p className="text-gray-400 text-xs">
                        {status.claimed
                            ? `Volte amanhã para continuar sua sequência de ${status.streak} dias!`
                            : `Resgate agora seus ${status.nextReward} Zions e mantenha a sequência!`}
                    </p>
                </div>

                <div className="flex flex-col items-end">
                    <span className={`text-2xl font-bold ${themeText}`}>
                        {status.streak}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Dias Seguidos</span>
                </div>
            </div>
        </button>
    );
}
