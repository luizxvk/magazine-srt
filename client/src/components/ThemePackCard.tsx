import { useState } from 'react';
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
    isOwned?: boolean;
    isEquipped?: boolean;
}

interface ThemePackCardProps {
    pack: ThemePack;
    onPurchase: (packId: string) => void;
    onEquip?: (packId: string) => void;
    loading?: boolean;
}

export default function ThemePackCard({ pack, onPurchase, onEquip, loading }: ThemePackCardProps) {
    const { user, theme } = useAuth();
    const [imageLoaded, setImageLoaded] = useState(false);

    const isOutOfStock = pack.maxStock && pack.soldCount >= pack.maxStock;
    const stockLeft = pack.maxStock ? pack.maxStock - pack.soldCount : null;
    const isLowStock = stockLeft && stockLeft <= 3;
    const canAfford = user && (user.zionsPoints || 0) >= pack.price;

    const handleAction = () => {
        if (pack.isOwned && onEquip) {
            onEquip(pack.id);
        } else if (!pack.isOwned && !isOutOfStock) {
            onPurchase(pack.id);
        }
    };

    return (
        <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col ${theme === 'light'
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
            {/* Preview Image/Video */}
            <div className="relative aspect-video overflow-hidden bg-black flex-shrink-0">
                {pack.backgroundUrl.endsWith('.mp4') || pack.backgroundUrl.endsWith('.webm') ? (
                    <video
                        src={pack.backgroundUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div
                        className={`w-full h-full transition-all duration-500 bg-center bg-cover ${imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
                            }`}
                        style={{
                            backgroundImage: imageLoaded ? `url(${pack.previewUrl || pack.backgroundUrl})` : undefined,
                            backgroundColor: pack.accentColor // Fallback color while loading/error
                        }}
                    >
                        <img
                            src={pack.previewUrl || pack.backgroundUrl}
                            alt={pack.name}
                            className="hidden" // Hidden img for loading event
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                                // Fallback to gradient if image fails
                                e.currentTarget.parentElement!.style.backgroundImage = `linear-gradient(135deg, ${pack.accentColor} 30%, #000 100%)`;
                                setImageLoaded(true);
                            }}
                        />
                    </div>
                )}

                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60" />

                {/* Badges no topo */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {pack.isLimited && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white rounded">
                            Edição Limitada
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
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <p className="text-white/60 text-xs uppercase tracking-widest font-medium text-shadow-sm">
                        {pack.gameTitle}
                    </p>

                    {/* Visual Color Palette in Preview */}
                    <div className="flex -space-x-2">
                        <div
                            className="w-6 h-6 rounded-full shadow-lg ring-2 ring-black/50 z-30"
                            style={{ backgroundColor: pack.accentColor }}
                            title="Cor Principal"
                        />
                        <div
                            className="w-6 h-6 rounded-full shadow-lg ring-2 ring-black/50 z-20"
                            style={{ backgroundColor: adjustBrightness(pack.accentColor, 20) }}
                            title="Tom Claro"
                        />
                        <div
                            className="w-6 h-6 rounded-full shadow-lg ring-2 ring-black/50 z-10"
                            style={{ backgroundColor: adjustBrightness(pack.accentColor, -20) }}
                            title="Tom Escuro"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-1 leading-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {pack.name}
                    </h3>
                    {pack.description && (
                        <p className={`text-xs mb-4 line-clamp-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {pack.description}
                        </p>
                    )}

                    {/* Included Items - Detailed List */}
                    <div className={`mb-4 rounded-lg p-3 ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                            O Pack Inclui:
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`p-1 rounded ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-black/20'}`}>
                                    <Sparkles className="w-3 h-3" style={{ color: pack.accentColor }} />
                                </div>
                                <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                                    Fundo Animado Exclusivo
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`p-1 rounded ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-black/20'}`}>
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pack.accentColor }} />
                                </div>
                                <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                                    Esquema de Cores: {pack.accentColor}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price & Action - Column Layout for better fit */}
                <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex items-center justify-between">
                        {!pack.isOwned ? (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Preço</span>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    <span className={`font-bold text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {pack.price.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-green-500 uppercase font-bold">Adquirido</span>
                                <span className="text-xs text-gray-500">Pronto para usar</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAction}
                        disabled={loading || (!pack.isOwned && (isOutOfStock || !canAfford))}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${pack.isOwned
                            ? pack.isEquipped
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            : isOutOfStock
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : !canAfford
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed'
                                    : 'text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
                        style={{
                            ...(!pack.isOwned && !isOutOfStock && canAfford && {
                                backgroundImage: `linear-gradient(to right, ${pack.accentColor}, ${adjustBrightness(pack.accentColor, -20)})`
                            }),
                            ...(pack.isOwned && !pack.isEquipped && {
                                backgroundColor: pack.accentColor
                            })
                        }}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : pack.isEquipped ? (
                            <>
                                <Check className="w-4 h-4" /> Equipado
                            </>
                        ) : pack.isOwned ? (
                            'Equipar Tema'
                        ) : isOutOfStock ? (
                            <>
                                <Lock className="w-4 h-4" /> Esgotado
                            </>
                        ) : !canAfford ? (
                            <>
                                <Lock className="w-4 h-4" /> Saldo Insuficiente
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="w-4 h-4" /> Comprar Agora
                            </>
                        )}
                    </button>
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
