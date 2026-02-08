import { useState, useEffect } from 'react';
import { Package, Palette, Image, Award, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface InventoryItem {
    id: string;
    name: string;
    type: 'background' | 'badge' | 'color';
    preview: string;
    isEquipped: boolean;
}

// Item data for display
const ITEM_DATA: Record<string, { name: string; type: 'background' | 'badge' | 'color'; preview: string }> = {
    // Backgrounds
    bg_aurora: { name: 'Aurora Boreal', type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%)' },
    bg_sunset: { name: 'Pôr do Sol', type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #4a2020 50%, #1a0a0a 100%)' },
    bg_ocean: { name: 'Oceano Profundo', type: 'background', preview: 'linear-gradient(135deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)' },
    bg_forest: { name: 'Floresta', type: 'background', preview: 'linear-gradient(135deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)' },
    bg_galaxy: { name: 'Galáxia', type: 'background', preview: 'linear-gradient(135deg, #0c0c0c 0%, #2d1b4e 50%, #0c0c0c 100%)' },
    bg_matrix: { name: 'Matrix', type: 'background', preview: 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 50%, #0a0f0a 100%)' },
    bg_fire: { name: 'Fogo', type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #4a2a0a 50%, #1a0a0a 100%)' },
    bg_city: { name: 'Cidade', type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' },
    bg_space: { name: 'Espaço', type: 'background', preview: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)' },
    bg_cyberpunk: { name: 'Cyberpunk', type: 'background', preview: 'linear-gradient(135deg, #0a0a1a 0%, #2a0a3a 50%, #0a0a1a 100%)' },
    bg_lava: { name: 'Lava', type: 'background', preview: 'linear-gradient(135deg, #2a0a00 0%, #6a2000 50%, #2a0a00 100%)' },
    bg_ice: { name: 'Gelo', type: 'background', preview: 'linear-gradient(135deg, #0a1a2a 0%, #143040 50%, #0a1a2a 100%)' },
    bg_neon_grid: { name: 'Neon Grid', type: 'background', preview: 'linear-gradient(135deg, #0d0d0d 0%, #2a0d2a 50%, #0d0d0d 100%)' },
    bg_emerald: { name: 'Esmeralda', type: 'background', preview: 'linear-gradient(135deg, #0a1a0f 0%, #143a25 50%, #0a1a0f 100%)' },
    bg_royal: { name: 'Royal', type: 'background', preview: 'linear-gradient(135deg, #0f0a1a 0%, #25143a 50%, #0f0a1a 100%)' },
    bg_carbon: { name: 'Carbon', type: 'background', preview: 'linear-gradient(135deg, #0a0a0a 0%, #202020 50%, #0a0a0a 100%)' },
    // Animated backgrounds
    'anim-cosmic-triangles': { name: 'Triângulos Cósmicos', type: 'background', preview: 'radial-gradient(circle at center, #111 0%, #000 60%)' },
    'anim-gradient-waves': { name: 'Ondas Gradiente', type: 'background', preview: 'linear-gradient(315deg, rgba(30,20,10,1) 0%, rgba(139,115,55,1) 25%, rgba(212,175,55,1) 50%, rgba(139,115,55,1) 75%, rgba(30,20,10,1) 100%)' },
    'anim-rainbow-skies': { name: 'Rainbow Skies', type: 'background', preview: 'linear-gradient(315deg, rgba(232,121,249,1) 10%, rgba(96,165,250,1) 50%, rgba(94,234,212,1) 90%)' },
    'anim-infinite-triangles': { name: 'Infinite Triangles', type: 'background', preview: 'linear-gradient(135deg, #d4af37 0%, #000 100%)' },
    'anim-moonlit-sky': { name: 'Moonlit Sky', type: 'background', preview: 'linear-gradient(180deg, #000011 0%, #0a0a2e 50%, #1a1a4a 100%)' },
    'anim-dark-veil': { name: 'Véu Sombrio', type: 'background', preview: 'radial-gradient(ellipse at center, #2a0845 0%, #1a0530 30%, #0a0115 100%)' },
    'anim-iridescence': { name: 'Prisma Iridescente', type: 'background', preview: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #1a1a2e 100%)' },
    // Badges - using icons8 URLs
    badge_crown: { name: 'Coroa', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=hcZ65S78dSp6&format=png&color=000000' },
    badge_skull: { name: 'Caveira', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=1aDNYh2zesKP&format=png&color=000000' },
    badge_fire: { name: 'Fogo', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=NjzqV0aREXb6&format=png&color=000000' },
    badge_diamond: { name: 'Diamante', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=8k9NF5LzoTVC&format=png&color=000000' },
    badge_star: { name: 'Estrela', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
    badge_lightning: { name: 'Raio', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
    badge_pony: { name: 'Unicórnio', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=16114&format=png&color=000000' },
    badge_heart: { name: 'Coração', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=yQTLnfG3Agzl&format=png&color=000000' },
    badge_moon: { name: 'Lua', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=6DXM8bs2tFSU&format=png&color=000000' },
    badge_sun: { name: 'Sol', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=OIr0zJdeXCbg&format=png&color=000000' },
    badge_seal: { name: 'Foca', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=FVRVluUvxBrh&format=png&color=000000' },
    badge_shark: { name: 'Grande Norke', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=81021&format=png&color=000000' },
    badge_egghead: { name: 'Cabeça de Ovo', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=_jtfUqyZM2Pw&format=png&color=000000' },
    // Colors
    color_gold: { name: 'Dourado', type: 'color', preview: '#d4af37' },
    color_rgb: { name: 'RGB Dinâmico', type: 'color', preview: 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff)' },
    color_cyan: { name: 'Ciano', type: 'color', preview: '#00ffff' },
    color_magenta: { name: 'Magenta', type: 'color', preview: '#ff00ff' },
    color_lime: { name: 'Lima', type: 'color', preview: '#00ff00' },
    color_orange: { name: 'Laranja', type: 'color', preview: '#ff6600' },
    color_purple: { name: 'Roxo', type: 'color', preview: '#9933ff' },
    color_pink: { name: 'Rosa', type: 'color', preview: '#ff69b4' },
    color_blue: { name: 'Azul', type: 'color', preview: '#0066ff' },
    color_red: { name: 'Vermelho', type: 'color', preview: '#ff0033' },
    color_pastel_pink: { name: 'Rosa Pastel', type: 'color', preview: '#ffb6c1' },
    color_pastel_lavender: { name: 'Lavanda', type: 'color', preview: '#e6e6fa' },
    color_pastel_mint: { name: 'Menta', type: 'color', preview: '#98fb98' },
    color_pastel_peach: { name: 'Pêssego', type: 'color', preview: '#ffdab9' },
    color_pastel_sky: { name: 'Céu', type: 'color', preview: '#87ceeb' },
    color_pastel_coral: { name: 'Coral', type: 'color', preview: '#ffb5a7' },
    color_pastel_lilac: { name: 'Lilás', type: 'color', preview: '#dda0dd' },
    color_pastel_sage: { name: 'Sálvia', type: 'color', preview: '#9dc183' },
    color_pastel_butter: { name: 'Manteiga', type: 'color', preview: '#fffacd' },
    color_pastel_periwinkle: { name: 'Pervinca', type: 'color', preview: '#ccccff' },
    // Gradient Colors
    color_gradient_sunset: { name: 'Pôr do Sol', type: 'color', preview: 'linear-gradient(135deg, #ff6b35, #f72585)' },
    color_gradient_ocean: { name: 'Oceano', type: 'color', preview: 'linear-gradient(135deg, #0077b6, #00f5d4)' },
    color_gradient_aurora: { name: 'Aurora Boreal', type: 'color', preview: 'linear-gradient(135deg, #7b4397, #00d9ff)' },
    color_gradient_fire: { name: 'Fogo Infernal', type: 'color', preview: 'linear-gradient(135deg, #ff0000, #ffc300)' },
    color_gradient_galaxy: { name: 'Galáxia', type: 'color', preview: 'linear-gradient(135deg, #1a0033, #7303c0, #ec38bc)' },
    color_gradient_neon: { name: 'Neon Elétrico', type: 'color', preview: 'linear-gradient(135deg, #ff00ff, #00ffff)' },
    color_gradient_forest: { name: 'Floresta Mística', type: 'color', preview: 'linear-gradient(135deg, #134e5e, #71b280)' },
    color_gradient_gold: { name: 'Dourado Premium', type: 'color', preview: 'linear-gradient(135deg, #8b7335, #d4af37, #f4e4a6)' },
    color_gradient_midnight: { name: 'Meia-Noite', type: 'color', preview: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
    color_gradient_candy: { name: 'Doce Intenso', type: 'color', preview: 'linear-gradient(135deg, #ff9a9e, #fecfef, #a18cd1)' },
};

interface InventoryCardProps {
    onOpenShop?: () => void;
}

export default function InventoryCard({ onOpenShop }: InventoryCardProps) {
    const { user, theme, accentColor, accentGradient } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const isMGT = user?.membershipType === 'MGT';
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeAccent = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeGlow = isMGT
        ? 'shadow-[0_0_20px_rgba(16,185,129,0.15)]'
        : 'shadow-[0_0_20px_rgba(212,175,55,0.15)]';
    const bgColor = theme === 'light' ? 'bg-white/80' : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');

    useEffect(() => {
        const loadInventory = () => {
            if (!user?.ownedCustomizations || user.ownedCustomizations.length === 0) {
                setItems([]);
                setLoading(false);
                return;
            }

            const ownedItems: InventoryItem[] = user.ownedCustomizations
                .map(id => {
                    // Check if we have data for this item
                    if (ITEM_DATA[id]) {
                        return {
                            id,
                            name: ITEM_DATA[id].name,
                            type: ITEM_DATA[id].type,
                            preview: ITEM_DATA[id].preview,
                            isEquipped: 
                                user.equippedBackground === id || 
                                user.equippedBadge === id || 
                                user.equippedColor === id
                        };
                    }
                    
                    // For unknown items, try to infer type from prefix
                    let type: 'background' | 'badge' | 'color' = 'background';
                    let preview = '#333';
                    let name = id.replace(/_/g, ' ').replace(/^(bg|badge|color)/, '').trim();
                    
                    if (id.startsWith('bg_')) {
                        type = 'background';
                        preview = 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1a1a2e 100%)';
                    } else if (id.startsWith('badge_')) {
                        type = 'badge';
                        preview = '🏆';
                    } else if (id.startsWith('color_')) {
                        type = 'color';
                        preview = '#9933ff';
                    }
                    
                    return {
                        id,
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        type,
                        preview,
                        isEquipped: 
                            user.equippedBackground === id || 
                            user.equippedBadge === id || 
                            user.equippedColor === id
                    };
                });

            setItems(ownedItems);
            setLoading(false);
        };

        loadInventory();
    }, [user]);

    const backgroundCount = items.filter(i => i.type === 'background').length;
    const badgeCount = items.filter(i => i.type === 'badge').length;
    const colorCount = items.filter(i => i.type === 'color').length;
    const totalItems = items.length;

    // Preview items (up to 6)
    const previewItems = items.slice(0, 6);

    if (loading) {
        return (
            <div className={`rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${bgColor} backdrop-blur-xl ${themeGlow} p-4`}>
                <div className="flex items-center gap-2 mb-4">
                    <Package className={`w-4 h-4 ${themeAccent}`} />
                    <h3 className={`font-serif text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Inventário
                    </h3>
                </div>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${bgColor} backdrop-blur-xl ${themeGlow} overflow-hidden transition-all duration-300`}>
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4`} style={{ color: accentColor }} />
                    <h3 className={`font-serif text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Inventário
                    </h3>
                </div>
                <span className="text-xs text-gray-500">{totalItems} itens</span>
            </div>

            {/* Content */}
            <div className="p-4">
                {totalItems === 0 ? (
                    <div className="text-center py-4">
                        <Package className="w-10 h-10 text-gray-600 mx-auto mb-2 opacity-50" />
                        <p className="text-gray-500 text-sm mb-3">
                            Seu inventário está vazio
                        </p>
                        {onOpenShop && (
                            <button
                                onClick={onOpenShop}
                                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                style={{ backgroundColor: accentColor, color: '#000' }}
                            >
                                Ir para Loja
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="flex flex-col items-center justify-center p-2 min-h-[72px] rounded-lg bg-white/5">
                                <Image className="w-4 h-4 mb-1 text-purple-400" />
                                <p className="text-lg font-bold text-white">{backgroundCount}</p>
                                <p className="text-[10px] text-gray-400">Fundos</p>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 min-h-[72px] rounded-lg bg-white/5">
                                <Award className="w-4 h-4 mb-1 text-yellow-400" />
                                <p className="text-lg font-bold text-white">{badgeCount}</p>
                                <p className="text-[10px] text-gray-400">Badges</p>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 min-h-[72px] rounded-lg bg-white/5">
                                <Palette className="w-4 h-4 mb-1 text-cyan-400" />
                                <p className="text-lg font-bold text-white">{colorCount}</p>
                                <p className="text-[10px] text-gray-400">Cores</p>
                            </div>
                        </div>

                        {/* Preview Grid */}
                        <div className="grid grid-cols-6 gap-1.5 mb-3">
                            {previewItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`relative aspect-square rounded-lg overflow-hidden border ${item.isEquipped ? 'border-2 ring-2' : 'border-white/10'}`}
                                    style={{ 
                                        borderColor: item.isEquipped ? accentColor : undefined,
                                    }}
                                    title={item.name}
                                >
                                    {item.type === 'badge' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black/50 text-lg">
                                            {item.preview.startsWith('http') ? (
                                                <img src={item.preview} alt={item.name} className="w-8 h-8 object-contain" />
                                            ) : (
                                                item.preview
                                            )}
                                        </div>
                                    ) : item.type === 'color' ? (
                                        <div 
                                            className="w-full h-full"
                                            style={{ 
                                                background: item.preview.includes('gradient') 
                                                    ? item.preview 
                                                    : item.preview 
                                            }}
                                        />
                                    ) : (
                                        <div 
                                            className="w-full h-full"
                                            style={{ background: item.preview }}
                                        />
                                    )}
                                    {item.isEquipped && (
                                        <div className="absolute top-0 right-0 w-4 h-4 rounded-full m-0.5 flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                                            <Check className="w-3 h-3 text-black" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Footer Button */}
            {onOpenShop && (
                <button
                    onClick={onOpenShop}
                    className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white/5 transition-colors border-t border-white/10`}
                    style={{ color: accentColor }}
                >
                    {totalItems === 0 ? 'Explorar Loja' : 'Gerenciar Itens'}
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
