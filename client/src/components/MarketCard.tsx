import { Store, TrendingUp, Package, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MarketCard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    // Use equipped color or fallback to theme colors
    const equippedColor = user?.equippedColor;
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const accentColor = equippedColor || defaultColor;
    
    const handleTabNavigation = (tab: string) => {
        navigate('/market', { state: { activeTab: tab } });
    };
    
    const themeBorder = isMGT ? 'border-emerald-500/20 hover:border-emerald-500/50' : 'border-gold-500/20 hover:border-gold-500/50';
    const themeBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';

    return (
        <div className={`glass-panel rounded-xl p-5 border ${themeBorder} transition-all duration-300 group cursor-pointer relative overflow-hidden`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${themeBg}`} />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl shadow-lg`} style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>
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
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group/btn`}
                >
                    <div className="group-hover/btn:scale-110 transition-transform">
                        <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Navegar</span>
                </button>
                <button
                    onClick={() => handleTabNavigation('sell')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group/btn`}
                >
                    <div className="group-hover/btn:scale-110 transition-transform">
                        <Package className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Vender</span>
                </button>
                <button
                    onClick={() => handleTabNavigation('history')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group/btn`}
                >
                    <div className="group-hover/btn:scale-110 transition-transform">
                        <History className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Histórico</span>
                </button>
            </div>

            {/* CTA */}
            <button
                onClick={() => navigate('/market')}
                className={`w-full mt-4 py-2.5 rounded-lg text-white text-sm font-bold hover:shadow-lg transition-all relative z-10`}
                style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}dd)` }}
            >
                Ir ao Mercado
            </button>
        </div>
    );
}
