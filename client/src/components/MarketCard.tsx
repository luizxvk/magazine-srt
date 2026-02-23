import { Store, TrendingUp, Package, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';

export default function MarketCard() {
    const navigate = useNavigate();
    const { user, accentColor, accentGradient, theme } = useAuth();
    const { config } = useCommunity();
    const isMGT = user?.membershipType === 'MGT';
    
    // Use dynamic colors from CommunityContext
    const stdColor = config.accentColor || config.backgroundColor || '#10b981';
    const vipColor = config.tierVipColor || '#d4af37';
    const defaultColor = isMGT ? stdColor : vipColor;
    const backgroundAccent = accentColor || defaultColor;
    const themeBg = theme === 'light' ? 'bg-white/80' : (isMGT ? 'bg-tier-std-950/30' : 'bg-black/30');
    const themeBorder = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT
        ? 'shadow-[0_0_15px_rgba(var(--tier-std-color-rgb),0.15)] hover:shadow-[0_0_25px_rgba(var(--tier-std-color-rgb),0.25)]'
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]';
    
    const handleTabNavigation = (tab: string) => {
        navigate('/market', { state: { activeTab: tab } });
    };

    return (
        <div 
            className={`${themeBg} backdrop-blur-xl rounded-xl p-5 ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} transition-all duration-300 group cursor-pointer relative overflow-hidden`}
        >
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{ backgroundColor: backgroundAccent }}
            />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div 
                    className="p-2.5 rounded-xl shadow-lg"
                    style={{ background: accentGradient || `linear-gradient(135deg, ${backgroundAccent}, ${backgroundAccent}dd)` }}
                >
                    <Store className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Mercado</h3>
                    <p className="text-xs text-gray-400">Compre e venda itens</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 relative z-10">
                <button
                    onClick={() => handleTabNavigation('browse')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 min-h-[72px] rounded-lg bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group/btn`}
                >
                    <div className="group-hover/btn:scale-110 transition-transform">
                        <TrendingUp className="w-4 h-4" style={{ color: backgroundAccent }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Navegar</span>
                </button>
                <button
                    onClick={() => handleTabNavigation('sell')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 min-h-[72px] rounded-lg bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group/btn`}
                >
                    <div className="group-hover/btn:scale-110 transition-transform">
                        <Package className="w-4 h-4" style={{ color: backgroundAccent }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Vender</span>
                </button>
                <button
                    onClick={() => handleTabNavigation('history')}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 min-h-[72px] rounded-lg bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group/btn`}
                >
                    <div className="group-hover/btn:scale-110 transition-transform">
                        <History className="w-4 h-4" style={{ color: backgroundAccent }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Histórico</span>
                </button>
            </div>

            {/* CTA - with gradient support */}
            <button
                onClick={() => navigate('/market')}
                className="w-full mt-4 py-2.5 rounded-lg text-white text-sm font-bold hover:shadow-lg hover:brightness-110 transition-all relative z-10"
                style={{ background: accentGradient || `linear-gradient(90deg, ${backgroundAccent}, ${backgroundAccent}dd)` }}
            >
                Ir ao Mercado
            </button>
        </div>
    );
}
