import { ShoppingBag, Gamepad2, Gift, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProductStoreCard() {
    const navigate = useNavigate();
    const { user, accentColor } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const backgroundAccent = accentColor || defaultColor;

    return (
        <div 
            className="glass-panel rounded-xl p-5 border transition-all duration-300 group cursor-pointer relative overflow-hidden"
            style={{ 
                borderColor: `${backgroundAccent}33`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = `${backgroundAccent}80`}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = `${backgroundAccent}33`}
            onClick={() => navigate('/store')}
        >
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{ backgroundColor: backgroundAccent }}
            />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2.5 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${backgroundAccent}, ${backgroundAccent}dd)` }}>
                    <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Loja</h3>
                    <p className="text-xs text-gray-400">Keys, Gift Cards e mais</p>
                </div>
            </div>

            {/* Quick Categories */}
            <div className="grid grid-cols-3 gap-2 relative z-10">
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10">
                    <Gamepad2 className="w-4 h-4" style={{ color: backgroundAccent }} />
                    <span className="text-[10px] text-gray-400 font-medium">Jogos</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10">
                    <Gift className="w-4 h-4" style={{ color: backgroundAccent }} />
                    <span className="text-[10px] text-gray-400 font-medium">Gift Cards</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-black/40 border border-white/10">
                    <Key className="w-4 h-4" style={{ color: backgroundAccent }} />
                    <span className="text-[10px] text-gray-400 font-medium">Keys</span>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={(e) => { e.stopPropagation(); navigate('/store'); }}
                className="w-full mt-4 py-2.5 rounded-lg text-white text-sm font-bold hover:shadow-lg transition-all relative z-10"
                style={{ background: `linear-gradient(90deg, ${backgroundAccent}, ${backgroundAccent}dd)` }}
            >
                Ver Produtos
            </button>
        </div>
    );
}
