import { Sparkles, Check, Lock, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ThemePack {
    id: string;
    name: string;
    description?: string;
    gameTitle: string;
    backgroundUrl: string;
    accentColor: string;
    previewUrl?: string;
    price: number;
    maxStock?: number;
    soldCount: number;
    isLimited: boolean;
    rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    isOwned?: boolean;
    isEquipped?: boolean;
}

interface ThemePackCardProps {
    pack: ThemePack;
    onPurchase: (packId: string) => void;
    onEquip?: (packId: string) => void;
    onUnequip?: () => void;
    loading?: boolean;
}

export default function ThemePackCard({ pack, onPurchase, onEquip, onUnequip, loading }: ThemePackCardProps) {
    const { user, theme } = useAuth();

    const isOutOfStock = pack.maxStock && pack.soldCount >= pack.maxStock;
    const stockLeft = pack.maxStock ? pack.maxStock - pack.soldCount : null;
    const isLowStock = stockLeft && stockLeft <= 3;
    const canAfford = user && (user.zionsPoints || 0) >= pack.price;

    const handleAction = () => {
        if (pack.isEquipped && onUnequip) {
            onUnequip();
        } else if (pack.isOwned && onEquip) {
            onEquip(pack.id);
        } else if (!pack.isOwned && !isOutOfStock) {
            onPurchase(pack.id);
        }
    };

    return (
        <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
            theme === 'light' 
                ? 'bg-white border-gray-200 hover:shadow-xl' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
        } ${pack.isEquipped ? 'ring-2 ring-offset-2 ring-offset-zinc-900' : ''}`}
            style={{ 
                ...(pack.isEquipped && { 
                    borderColor: pack.accentColor,
                    ringColor: pack.accentColor 
                })
            }}
        >
            {/* Preview - Animated Background with CSS class */}
            <div className="relative aspect-video overflow-hidden bg-black">
                {/* Background Animation Preview using CSS class */}
                <div 
                    className={`w-full h-full ${pack.backgroundUrl} group-hover:scale-105 transition-transform duration-500`}
                    style={{ backgroundSize: '200% 200%' }}
                />

                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />

                {/* Badges no topo */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {pack.rarity && (
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded ${
                            pack.rarity === 'LEGENDARY' ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600' :
                            pack.rarity === 'EPIC' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                            pack.rarity === 'RARE' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            'bg-gray-500'
                        }`}>
                            {pack.rarity === 'LEGENDARY' ? 'Lendário' :
                             pack.rarity === 'EPIC' ? 'Épico' :
                             pack.rarity === 'RARE' ? 'Raro' : 'Comum'}
                        </span>
                    )}
                    {pack.isEquipped && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-500 text-white rounded flex items-center gap-1">
                            <Check className="w-3 h-3" /> Equipado
                        </span>
                    )}
                    {pack.isOwned && !pack.isEquipped && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white rounded">
                            Adquirido
                        </span>
                    )}
                </div>

                {/* Stock info */}
                {isLowStock && !isOutOfStock && !pack.isOwned && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white rounded animate-pulse">
                            {stockLeft} restantes!
                        </span>
                    </div>
                )}

                {/* Game Title no bottom */}
                <div className="absolute bottom-3 left-3">
                    <p className="text-white/60 text-xs uppercase tracking-widest font-medium">
                        {pack.gameTitle}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className={`text-lg font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {pack.name}
                </h3>
                {pack.description && (
                    <p className={`text-xs mb-3 line-clamp-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {pack.description}
                    </p>
                )}

                {/* Included Items */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Sparkles className="w-4 h-4" style={{ color: pack.accentColor || '#d4af37' }} />
                        <span>Fundo Animado Exclusivo</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div 
                            className="w-4 h-4 rounded-full border-2 border-white/30" 
                            style={{ backgroundColor: pack.accentColor || '#d4af37' }} 
                        />
                        <span>Cor Destaque: {pack.accentColor || '#d4af37'}</span>
                    </div>
                </div>

                {/* Price & Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-shrink-0">
                        {!pack.isOwned && (
                            pack.rarity === 'LEGENDARY' ? (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-amber-400">
                                            Exclusivo
                                        </span>
                                        <span className={`font-bold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                            Supply Box
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <img 
                                        src="/assets/zions/zion-50.png" 
                                        alt="Zions Points" 
                                        className="w-5 h-5 object-contain flex-shrink-0"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    <span className={`font-bold text-sm sm:text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'} whitespace-nowrap`}>
                                        {pack.price.toLocaleString('pt-BR')} Points
                                    </span>
                                </div>
                            )
                        )}
                    </div>

                    {/* Botão só aparece se NÃO for legendário OU se for owned */}
                    {(pack.isOwned || pack.rarity !== 'LEGENDARY') && (
                        <button
                            onClick={handleAction}
                            disabled={loading || (!pack.isOwned && (isOutOfStock || !canAfford))}
                            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 flex-shrink-0 ${
                                pack.isOwned
                                    ? pack.isEquipped
                                        ? 'bg-gray-500/20 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    : isOutOfStock
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : !canAfford
                                            ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r hover:opacity-90 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{
                                ...(pack.isOwned && !pack.isEquipped && { backgroundColor: pack.accentColor || '#d4af37' }),
                                ...(!pack.isOwned && canAfford && !isOutOfStock && {
                                    backgroundImage: `linear-gradient(to right, ${pack.accentColor || '#d4af37'}, ${adjustBrightness(pack.accentColor || '#d4af37', -20)})`
                                })
                            }}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : pack.isEquipped ? (
                                'Desequipar'
                            ) : pack.isOwned ? (
                                'Equipar'
                            ) : isOutOfStock ? (
                                <>
                                    <Lock className="w-4 h-4 flex-shrink-0" /> <span>Esgotado</span>
                                </>
                            ) : !canAfford ? (
                                <>
                                    <Lock className="w-4 h-4 flex-shrink-0" /> <span>Sem Zions</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="w-4 h-4 flex-shrink-0" /> <span>Comprar</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Utility para ajustar brilho da cor hex
function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}
