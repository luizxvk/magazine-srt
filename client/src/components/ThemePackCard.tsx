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
    rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
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

    const getRarityColor = (rarity?: string) => {
        switch (rarity) {
            case 'LEGENDARY': return 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
            case 'EPIC': return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
            case 'RARE': return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
            default: return theme === 'light' ? 'border-gray-200' : 'border-white/10';
        }
    };

    const rarityClass = getRarityColor(pack.rarity);

    return (
        <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col ${theme === 'light'
            ? 'bg-white hover:shadow-xl'
            : 'bg-white/5 hover:border-white/20'
            } ${pack.isEquipped ? 'ring-2 ring-offset-2 ring-offset-zinc-900' : ''} ${rarityClass}`}
            style={{
                ...(pack.isEquipped && {
                    borderColor: pack.accentColor,
                    ringColor: pack.accentColor
                })
            }}
        >
            {/* Preview Image/Video */}
            <div className="relative aspect-video overflow-hidden bg-black flex-shrink-0">
                {pack.backgroundUrl && (pack.backgroundUrl.endsWith('.mp4') || pack.backgroundUrl.endsWith('.webm')) ? (
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
                        className="w-full h-full transition-all duration-500 bg-center bg-cover group-hover:scale-105"
                        style={{
                            background: `linear-gradient(135deg, ${adjustBrightness(pack.accentColor, -30)} 0%, ${pack.accentColor} 50%, ${adjustBrightness(pack.accentColor, 30)} 100%)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {/* Optional image overlay if previewUrl exists */}
                        {(pack.previewUrl || pack.backgroundUrl) && (
                            <div
                                className={`w-full h-full ${imageLoaded ? 'opacity-60' : 'opacity-0'} transition-opacity duration-500`}
                                style={{
                                    backgroundImage: `url(${pack.previewUrl || pack.backgroundUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    mixBlendMode: 'overlay'
                                }}
                            >
                                <img
                                    src={pack.previewUrl || pack.backgroundUrl}
                                    alt={pack.name}
                                    className="hidden"
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageLoaded(false)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Rarity Badge */}
                {pack.rarity && pack.rarity !== 'COMMON' && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md border ${pack.rarity === 'LEGENDARY' ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' :
                        pack.rarity === 'EPIC' ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' :
                            'bg-blue-500/20 border-blue-500/50 text-blue-200'
                        }`}>
                        {pack.rarity === 'LEGENDARY' ? '✨ Legendary' : pack.rarity}
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
                        {!pack.isOwned && pack.rarity !== 'LEGENDARY' ? (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Preço</span>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    <span className={`font-bold text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {pack.price.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        ) : pack.isOwned ? (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-green-500 uppercase font-bold">Adquirido</span>
                                <span className="text-xs text-gray-500">Pronto para usar</span>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-amber-500 uppercase font-bold">Exclusivo</span>
                                <span className="text-xs text-gray-500">Item Lendário</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAction}
                        disabled={loading || (!pack.isOwned && (isOutOfStock || !canAfford || pack.rarity === 'LEGENDARY'))}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${pack.isOwned
                            ? pack.isEquipped
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            : pack.rarity === 'LEGENDARY'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-not-allowed'
                                : isOutOfStock
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : !canAfford
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed'
                                        : 'text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
                        style={{
                            ...(!pack.isOwned && !isOutOfStock && canAfford && pack.rarity !== 'LEGENDARY' && {
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
                        ) : pack.rarity === 'LEGENDARY' ? (
                            <>
                                <Sparkles className="w-4 h-4" /> Supply Box
                            </>
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
