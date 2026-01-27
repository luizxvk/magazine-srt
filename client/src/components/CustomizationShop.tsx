import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Lock, Palette, Image, Award, Zap, PackageOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ThemePackCard from './ThemePackCard';
import SupplyBoxModal from './SupplyBoxModal';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    type: 'background' | 'badge' | 'color';
    preview: string;
    owned: boolean;
    equipped: boolean;
}

interface CustomizationShopProps {
    isOpen: boolean;
    onClose: () => void;
}

// Default items (free, always owned)
const defaultItems = {
    background: { id: 'bg_default', name: 'Magazine Clássico', description: 'O visual padrão do Magazine', price: 0, type: 'background' as const, preview: 'linear-gradient(125deg, #0a0a0a 0%, #1a1a1a 100%)' },
    badge: { id: 'badge_crown', name: 'Coroa Magazine', description: 'Símbolo de elite', price: 0, type: 'badge' as const, preview: '👑' },
    color: { id: 'color_gold', name: 'Dourado Magazine', description: 'A cor clássica Magazine', price: 0, type: 'color' as const, preview: '#d4af37' },
};

// Predefined backgrounds
const backgrounds: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    defaultItems.background,
    { id: 'bg_aurora', name: 'Aurora Boreal', description: 'Ondas suaves de luz em movimento', price: 600, type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' },
    { id: 'bg_galaxy', name: 'Galáxia', description: 'Estrelas e constelações', price: 500, type: 'background', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)' },
    { id: 'bg_matrix', name: 'Matrix', description: 'Código caindo estilo matrix', price: 450, type: 'background', preview: 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 50%, #0a0f0a 100%)' },
    { id: 'bg_fire', name: 'Fogo', description: 'Fogo dançante nas bordas', price: 400, type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)' },
    { id: 'bg_ocean', name: 'Oceano', description: 'Ondas calmas em azul', price: 350, type: 'background', preview: 'linear-gradient(180deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)' },
    { id: 'bg_forest', name: 'Floresta', description: 'Verde natural e sereno', price: 300, type: 'background', preview: 'linear-gradient(180deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)' },
    { id: 'bg_city', name: 'Cidade Neon', description: 'Luzes urbanas vibrantes', price: 550, type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)' },
    { id: 'bg_space', name: 'Espaço Profundo', description: 'Vastidão do cosmos', price: 700, type: 'background', preview: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)' },
    // NOVOS FUNDOS ANIMADOS
    { id: 'bg_sunset', name: 'Pôr do Sol', description: 'Transição laranja-rosa vibrante', price: 650, type: 'background', preview: 'linear-gradient(135deg, #1a0505 0%, #2a0a0a 25%, #3a1515 50%, #2a0a0a 75%, #1a0505 100%)' },
    { id: 'bg_cyberpunk', name: 'Cyberpunk', description: 'Néon rosa e azul futurista', price: 750, type: 'background', preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)' },
    { id: 'bg_lava', name: 'Lava', description: 'Magma incandescente em movimento', price: 800, type: 'background', preview: 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)' },
    { id: 'bg_ice', name: 'Gelo Ártico', description: 'Cristais de gelo azulados', price: 600, type: 'background', preview: 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)' },
    { id: 'bg_neon_grid', name: 'Grade Neon', description: 'Grid retro synthwave', price: 850, type: 'background', preview: 'linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 25%, #2a0d2a 50%, #1a0d1a 75%, #0d0d0d 100%)' },
    { id: 'bg_emerald', name: 'Esmeralda', description: 'Verde profundo luxuoso', price: 700, type: 'background', preview: 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)' },
    { id: 'bg_royal', name: 'Real Púrpura', description: 'Púrpura majestoso', price: 900, type: 'background', preview: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)' },
    { id: 'bg_carbon', name: 'Fibra de Carbono', description: 'Textura escura premium', price: 500, type: 'background', preview: 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)' },
    // FUNDOS ANIMADOS PREMIUM
    { id: 'anim-cosmic-triangles', name: 'Triângulos Cósmicos', description: 'Triângulos 3D coloridos em movimento hipnótico', price: 2500, type: 'background', preview: 'radial-gradient(circle at center, #111 0%, #000 60%)' },
    { id: 'anim-gradient-waves', name: 'Ondas Gradiente', description: 'Gradiente animado com ondas fluidas', price: 2000, type: 'background', preview: 'linear-gradient(315deg, rgba(101,0,94,1) 3%, rgba(60,132,206,1) 38%, rgba(48,238,226,1) 68%, rgba(255,25,25,1) 98%)' },
];

// Predefined badges (profile decorations)
const badges: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    defaultItems.badge,
    { id: 'badge_skull', name: 'Caveira', description: 'Estilo rebelde', price: 300, type: 'badge', preview: '💀' },
    { id: 'badge_fire', name: 'Fogo', description: 'Queima tudo!', price: 200, type: 'badge', preview: '🔥' },
    { id: 'badge_star', name: 'Estrela', description: 'Brilhe sempre', price: 350, type: 'badge', preview: '⭐' },
    { id: 'badge_diamond', name: 'Diamante', description: 'Precioso e raro', price: 500, type: 'badge', preview: '💎' },
    { id: 'badge_lightning', name: 'Raio', description: 'Velocidade máxima', price: 400, type: 'badge', preview: '⚡' },
    { id: 'badge_pony', name: 'Unicórnio', description: 'Mágico e único', price: 250, type: 'badge', preview: '🦄' },
    { id: 'badge_heart', name: 'Coração', description: 'Com amor', price: 200, type: 'badge', preview: '❤️' },
    { id: 'badge_moon', name: 'Lua', description: 'Noturno', price: 300, type: 'badge', preview: '🌙' },
    { id: 'badge_sun', name: 'Sol', description: 'Radiante', price: 350, type: 'badge', preview: '☀️' },
];

// Neon accent colors (excluding gold for Magazine exclusivity)
const colors: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    defaultItems.color,
    { id: 'color_rgb', name: 'RGB Dinâmico', description: 'Troca entre Red, Green, Blue ao vivo!', price: 1000, type: 'color', preview: 'rgb-dynamic' },
    { id: 'color_cyan', name: 'Ciano Neon', description: 'Azul elétrico vibrante', price: 400, type: 'color', preview: '#00ffff' },
    { id: 'color_magenta', name: 'Magenta Neon', description: 'Rosa intenso', price: 400, type: 'color', preview: '#ff00ff' },
    { id: 'color_lime', name: 'Verde Limão', description: 'Verde vibrante', price: 400, type: 'color', preview: '#00ff00' },
    { id: 'color_orange', name: 'Laranja Neon', description: 'Quente e energético', price: 400, type: 'color', preview: '#ff6600' },
    { id: 'color_purple', name: 'Roxo Neon', description: 'Misterioso e elegante', price: 400, type: 'color', preview: '#9933ff' },
    { id: 'color_pink', name: 'Rosa Neon', description: 'Doce e marcante', price: 400, type: 'color', preview: '#ff69b4' },
    { id: 'color_blue', name: 'Azul Elétrico', description: 'Clássico e moderno', price: 400, type: 'color', preview: '#0066ff' },
    { id: 'color_red', name: 'Vermelho Neon', description: 'Intenso e poderoso', price: 400, type: 'color', preview: '#ff0033' },
    // Pastel Colors
    { id: 'color_pastel_pink', name: 'Rosa Pastel', description: 'Delicado e suave', price: 350, type: 'color', preview: '#ffb6c1' },
    { id: 'color_pastel_lavender', name: 'Lavanda Pastel', description: 'Relaxante e elegante', price: 350, type: 'color', preview: '#e6e6fa' },
    { id: 'color_pastel_mint', name: 'Menta Pastel', description: 'Fresco e natural', price: 350, type: 'color', preview: '#98fb98' },
    { id: 'color_pastel_peach', name: 'Pêssego Pastel', description: 'Acolhedor e quente', price: 350, type: 'color', preview: '#ffdab9' },
    { id: 'color_pastel_sky', name: 'Céu Pastel', description: 'Sereno e calmo', price: 350, type: 'color', preview: '#87ceeb' },
    { id: 'color_pastel_coral', name: 'Coral Pastel', description: 'Vibrante mas suave', price: 350, type: 'color', preview: '#ffb5a7' },
    { id: 'color_pastel_lilac', name: 'Lilás Pastel', description: 'Romântico e místico', price: 350, type: 'color', preview: '#dda0dd' },
    { id: 'color_pastel_sage', name: 'Sálvia Pastel', description: 'Terroso e natural', price: 350, type: 'color', preview: '#9dc183' },
    { id: 'color_pastel_butter', name: 'Manteiga Pastel', description: 'Amarelo suave', price: 350, type: 'color', preview: '#fffacd' },
    { id: 'color_pastel_periwinkle', name: 'Pervinca Pastel', description: 'Azul-violeta delicado', price: 350, type: 'color', preview: '#ccccff' },
];

export default function CustomizationShop({ isOpen, onClose }: CustomizationShopProps) {
    const { user, updateUserZions, updateUser, theme } = useAuth();
    const [activeTab, setActiveTab] = useState<'background' | 'badge' | 'color' | 'packs'>('background');
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [equippedItems, setEquippedItems] = useState<{ background?: string; badge?: string; color?: string }>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [themePacks, setThemePacks] = useState<any[]>([]);
    const [userPacks, setUserPacks] = useState<any[]>([]);
    const [showSupplyBox, setShowSupplyBox] = useState(false);
    const [loadingPacks, setLoadingPacks] = useState(false);

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'emerald' : 'gold';
    const isDarkMode = theme === 'dark';

    // Default items are always owned
    const defaultItemIds = [defaultItems.background.id, defaultItems.badge.id, defaultItems.color.id];

    useEffect(() => {
        if (isOpen) {
            fetchUserCustomizations();
            fetchThemePacks();
            api.get('/users/me').then(res => updateUser(res.data)); // Refresh user data on open
        }
    }, [isOpen]);

    const fetchThemePacks = async () => {
        try {
            setLoadingPacks(true);
            const [packsRes, userPacksRes] = await Promise.all([
                api.get('/theme-packs'),
                api.get('/theme-packs/my-packs')
            ]);
            setThemePacks(packsRes.data);
            setUserPacks(userPacksRes.data);
        } catch (error) {
            console.error('Error fetching theme packs:', error);
        } finally {
            setLoadingPacks(false);
        }
    };

    const fetchUserCustomizations = async () => {
        try {
            const response = await api.get('/users/customizations');
            setOwnedItems([...defaultItemIds, ...(response.data.owned || [])]);
            // If no items equipped, set defaults as equipped
            const equipped = response.data.equipped || {};
            setEquippedItems({
                background: equipped.background || defaultItems.background.id,
                badge: equipped.badge || defaultItems.badge.id,
                color: equipped.color || defaultItems.color.id
            });
        } catch (error) {
            console.error('Failed to fetch customizations', error);
            // At minimum, user has default items and they are equipped
            setOwnedItems(defaultItemIds);
            setEquippedItems({
                background: defaultItems.background.id,
                badge: defaultItems.badge.id,
                color: defaultItems.color.id
            });
        }
    };

    const handlePurchase = async (item: Omit<ShopItem, 'owned' | 'equipped'>) => {
        // Default items are free and always owned
        if (item.price === 0) {
            handleEquip(item);
            return;
        }

        if (!user || (user.zions || 0) < item.price) {
            setNotification({ type: 'error', message: 'Zions insuficientes!' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setPurchasing(item.id);
        try {
            const categoryMap = { background: 'backgrounds', badge: 'badges', color: 'colors' };
            await api.post('/users/customizations/purchase', {
                itemId: item.id,
                category: categoryMap[item.type]
            });
            setOwnedItems(prev => [...prev, item.id]);
            updateUserZions(-item.price); // Subtract price from zions
            setNotification({ type: 'success', message: `${item.name} adquirido!` });
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao comprar item';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleEquip = async (item: Omit<ShopItem, 'owned' | 'equipped'>) => {
        try {
            const categoryMap = { background: 'backgrounds', badge: 'badges', color: 'colors' };
            const payload = {
                itemId: item.id,
                category: categoryMap[item.type]
            };
            console.log('[CustomizationShop] Equipping item:', payload);

            const response = await api.post('/users/customizations/equip', payload);
            console.log('[CustomizationShop] Equip response:', response.data);

            setEquippedItems(prev => ({ ...prev, [item.type]: item.id }));

            // Update user state with the equipped item so it applies globally
            if (item.type === 'background') {
                updateUser({ ...user!, equippedBackground: item.id });
            } else if (item.type === 'badge') {
                updateUser({ ...user!, equippedBadge: item.id });
            } else if (item.type === 'color') {
                updateUser({ ...user!, equippedColor: item.id });
            }

            setNotification({ type: 'success', message: `${item.name} equipado!` });
        } catch (error: any) {
            console.error('[CustomizationShop] Equip error:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.error || 'Erro ao equipar item';
            setNotification({ type: 'error', message: errorMsg });
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUnequip = async (type: 'background' | 'badge' | 'color') => {
        try {
            const categoryMap = { background: 'backgrounds', badge: 'badges', color: 'colors' };
            await api.post('/users/customizations/unequip', { category: categoryMap[type] });
            setEquippedItems(prev => ({ ...prev, [type]: undefined }));

            // Update user state to remove the equipped item
            if (type === 'background') {
                updateUser({ ...user!, equippedBackground: null });
            } else if (type === 'badge') {
                updateUser({ ...user!, equippedBadge: null });
            } else if (type === 'color') {
                updateUser({ ...user!, equippedColor: null });
            }

            setNotification({ type: 'success', message: 'Item desequipado!' });
        } catch (error) {
            console.error('Failed to unequip', error);
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handlePurchaseThemePack = async (packId: string) => {
        setPurchasing(packId);
        try {
            const response = await api.post(`/theme-packs/${packId}/purchase`);
            setNotification({ type: 'success', message: response.data.message });

            // Optimistically update owned packs to reflect change immediately
            setUserPacks(prev => [...prev, { packId: packId }]);

            fetchThemePacks(); // Refresh packs data for stock counts etc
            fetchUserCustomizations(); // Refresh zions balance
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao comprar pack';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleEquipThemePack = async (packId: string) => {
        setPurchasing(packId);
        try {
            const response = await api.post(`/theme-packs/${packId}/equip`);
            setNotification({ type: 'success', message: response.data.message });
            // Update user state with equipped items from pack
            const pack = response.data.pack;
            if (pack) {
                updateUser({
                    ...user!,
                    equippedBackground: pack.backgroundUrl,
                    equippedColor: pack.accentColor
                });
            }
            fetchThemePacks(); // Refresh to update equipped status
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao equipar pack';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleUnequipThemePack = async () => {
        setPurchasing('unequip');
        try {
            // Unequip background and color
            await api.post('/users/customizations/unequip', { category: 'backgrounds' });
            await api.post('/users/customizations/unequip', { category: 'colors' });
            
            setNotification({ type: 'success', message: 'Pack desequipado com sucesso!' });
            
            // Update user state to remove equipped items
            updateUser({
                ...user!,
                equippedBackground: null,
                equippedColor: null
            });
            
            fetchThemePacks(); // Refresh to update equipped status
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao desequipar pack';
            setNotification({ type: 'error', message });
        } finally {
            setPurchasing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const isOwned = (itemId: string) => ownedItems.includes(itemId);
    const isEquipped = (item: Omit<ShopItem, 'owned' | 'equipped'>) => equippedItems[item.type] === item.id;

    const getItems = () => {
        // Filter out Magazine-exclusive items for MGT users
        const filterMagazineExclusive = (items: typeof backgrounds | typeof badges | typeof colors) => {
            if (!isMGT) return items;
            // MGT users don't see Magazine-exclusive items (bg_default, badge_crown, color_gold)
            return items.filter(item => !['bg_default', 'badge_crown', 'color_gold'].includes(item.id));
        };

        switch (activeTab) {
            case 'background': return filterMagazineExclusive(backgrounds);
            case 'badge': return filterMagazineExclusive(badges);
            case 'color': {
                // Categorize colors
                const allColors = filterMagazineExclusive(colors);
                const basicColors = allColors.filter(c => !c.id.includes('pastel'));
                const pastelColors = allColors.filter(c => c.id.includes('pastel'));
                return { basicColors, pastelColors };
            }
        }
    };

    const tabs = [
        { id: 'background' as const, label: 'Fundos', icon: Image },
        { id: 'badge' as const, label: 'Badges', icon: Award },
        { id: 'color' as const, label: 'Cores', icon: Palette },
        { id: 'packs' as const, label: 'Packs', icon: PackageOpen },
    ];

    if (!isOpen) return null;

    const bgMain = isDarkMode ? 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-black' : 'bg-white';
    const borderColor = isDarkMode ? 'border-white/10' : 'border-gray-200';
    const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSub = isDarkMode ? 'text-gray-400' : 'text-gray-600';

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isDarkMode ? 'bg-black/80' : 'bg-black/40'} backdrop-blur-sm`}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.25 }}
                    className={`relative w-full max-w-2xl max-h-[85vh] ${bgMain} rounded-2xl border ${borderColor} shadow-2xl overflow-hidden`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-4 border-b ${borderColor} flex items-center justify-between bg-gradient-to-r from-${themeColor}-500/10 to-transparent`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${themeColor}-500/20`}>
                                <Sparkles className={`w-5 h-5 text-${themeColor}-400`} />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${textMain}`}>Meu Estilo</h2>
                                <p className={`text-xs ${textSub}`}>Customize seu perfil</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowSupplyBox(true)}
                                className={`px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-1`}
                            >
                                <PackageOpen className="w-3 h-3" />
                                Supply Box
                            </button>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${themeColor}-500/20 border border-${themeColor}-500/30`}>
                                <Zap className={`w-4 h-4 text-${themeColor}-400`} />
                                <span className={`text-sm font-bold text-${themeColor}-400`}>{user?.zionsPoints?.toLocaleString() || 0} Points</span>
                            </div>
                            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                                <X className={`w-5 h-5 ${textSub}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notification Toast - Fixed at bottom center of screen */}
                    <AnimatePresence>
                        {notification && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl z-[200] shadow-xl backdrop-blur-md ${notification.type === 'success' ? 'bg-green-500/30 text-green-300 border border-green-500/40' : 'bg-red-500/30 text-red-300 border border-red-500/40'
                                    }`}
                            >
                                <span className="font-medium">{notification.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tabs */}
                    <div className={`flex border-b ${borderColor}`}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? `text-${themeColor}-400 border-b-2 border-${themeColor}-400 bg-${themeColor}-500/5`
                                    : `${textSub} ${isDarkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-gray-900 hover:bg-gray-100'}`
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="p-4 overflow-y-auto max-h-[calc(85vh-180px)] custom-scrollbar">
                        {activeTab === 'packs' ? (
                            // Packs Tab - Real implementation
                            <div>
                                {loadingPacks ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
                                    </div>
                                ) : themePacks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className={`p-6 rounded-full bg-${themeColor}-500/10 mb-4`}>
                                            <PackageOpen className={`w-16 h-16 text-${themeColor}-400`} />
                                        </div>
                                        <h3 className={`text-xl font-bold ${textMain} mb-2`}>Packs de Tema</h3>
                                        <p className={`${textSub} max-w-md mb-4`}>
                                            Pacotes temáticos exclusivos inspirados em jogos! Cada pack inclui fundo animado + cor destaque única.
                                        </p>
                                        <div className={`px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm`}>
                                            Nenhum pack disponível no momento
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Legendary Packs Carousel */}
                                        {(() => {
                                            const legendaryPacks = themePacks.filter(p => p.rarity === 'LEGENDARY');
                                            if (legendaryPacks.length > 0) {
                                                return (
                                                    <div className="mb-8">
                                                        <h3 className={`text-lg font-bold ${textMain} mb-4`}>
                                                            Packs Lendários
                                                        </h3>
                                                        <div className="relative">
                                                            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                                                                {legendaryPacks.map(pack => {
                                                                    const isOwned = userPacks.some(up => (up.packId === pack.id) || (up.themePackId === pack.id));
                                                                    const isEquipped = user?.equippedBackground === pack.backgroundUrl &&
                                                                        user?.equippedColor === pack.accentColor;

                                                                    return (
                                                                        <div key={pack.id} className="flex-shrink-0 w-80 snap-center">
                                                                            <ThemePackCard
                                                                                pack={{ ...pack, isOwned, isEquipped }}
                                                                                onPurchase={handlePurchaseThemePack}
                                                                                onEquip={handleEquipThemePack}
                                                                                onUnequip={handleUnequipThemePack}
                                                                                loading={purchasing === pack.id || purchasing === 'unequip'}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Other Packs Grid */}
                                        {(() => {
                                            const otherPacks = themePacks.filter(p => p.rarity !== 'LEGENDARY');
                                            if (otherPacks.length > 0) {
                                                return (
                                                    <div>
                                                        <h3 className={`text-lg font-bold ${textMain} mb-4`}>
                                                            Outros Packs
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {otherPacks.map(pack => {
                                                                const isOwned = userPacks.some(up => (up.packId === pack.id) || (up.themePackId === pack.id));
                                                                const isEquipped = user?.equippedBackground === pack.backgroundUrl &&
                                                                    user?.equippedColor === pack.accentColor;

                                                                return (
                                                                    <ThemePackCard
                                                                        key={pack.id}
                                                                        pack={{ ...pack, isOwned, isEquipped }}
                                                                        onPurchase={handlePurchaseThemePack}
                                                                        onEquip={handleEquipThemePack}
                                                                        onUnequip={handleUnequipThemePack}
                                                                        loading={purchasing === pack.id || purchasing === 'unequip'}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'color' ? (
                            // Render color categories
                            (() => {
                                const { basicColors, pastelColors } = getItems() as { basicColors: typeof colors; pastelColors: typeof colors };
                                return (
                                    <>
                                        {/* Basic Colors */}
                                        <div className="mb-6">
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <Palette className={`w-4 h-4 text-${themeColor}-400`} />
                                                Cores Básicas
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {basicColors.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                                {item.preview === 'rgb-dynamic' ? (
                                                                    <div className="w-16 h-16 rounded-full shadow-lg animate-rgb-cycle" />
                                                                ) : (
                                                                    <div
                                                                        className="w-16 h-16 rounded-full shadow-lg"
                                                                        style={{
                                                                            backgroundColor: item.preview,
                                                                            boxShadow: `0 0 30px ${item.preview}50`
                                                                        }}
                                                                    />
                                                                )}
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zions || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zions || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zions || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Pastel Colors */}
                                        <div>
                                            <h3 className={`text-sm font-bold ${textMain} mb-3 flex items-center gap-2`}>
                                                <Palette className={`w-4 h-4 text-${themeColor}-400`} />
                                                Tom Pastel
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {pastelColors.map(item => {
                                                    const owned = isOwned(item.id);
                                                    const equipped = isEquipped(item);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                                        >
                                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                                {item.preview === 'rgb-dynamic' ? (
                                                                    <div className="w-16 h-16 rounded-full shadow-lg animate-rgb-cycle" />
                                                                ) : (
                                                                    <div
                                                                        className="w-16 h-16 rounded-full shadow-lg"
                                                                        style={{
                                                                            backgroundColor: item.preview,
                                                                            boxShadow: `0 0 30px ${item.preview}50`
                                                                        }}
                                                                    />
                                                                )}
                                                                {equipped && (
                                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                                        <Check className="w-3 h-3 text-black" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>
                                                                <div className="mt-2">
                                                                    {owned ? (
                                                                        <button
                                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handlePurchase(item)}
                                                                            disabled={purchasing === item.id || (user?.zions || 0) < item.price}
                                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${(user?.zions || 0) < item.price
                                                                                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                                }`}
                                                                        >
                                                                            {purchasing === item.id ? (
                                                                                <span className="animate-spin">⏳</span>
                                                                            ) : (user?.zions || 0) < item.price ? (
                                                                                <>
                                                                                    <Lock className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="w-3 h-3" />
                                                                                    {item.price}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(getItems() as typeof backgrounds | typeof badges).map(item => {
                                    const owned = isOwned(item.id);
                                    const equipped = isEquipped(item);
                                    const isFree = item.price === 0;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ scale: 1.02 }}
                                            className={`relative rounded-xl overflow-hidden border ${equipped ? `border-${themeColor}-500` : borderColor
                                                } ${isDarkMode ? 'bg-black/40' : 'bg-gray-50'}`}
                                        >
                                            {/* Preview */}
                                            <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                                                {item.type === 'background' && (
                                                    <div className="absolute inset-0 animate-wave-bg" style={{ background: item.preview, backgroundSize: '200% 200%' }} />
                                                )}
                                                {item.type === 'badge' && (
                                                    <span className="text-5xl">{item.preview}</span>
                                                )}
                                                {item.type === 'color' && (
                                                    item.preview === 'rgb-dynamic' ? (
                                                        <div className="w-16 h-16 rounded-full shadow-lg animate-rgb-cycle" />
                                                    ) : (
                                                        <div
                                                            className="w-16 h-16 rounded-full shadow-lg"
                                                            style={{
                                                                backgroundColor: item.preview,
                                                                boxShadow: `0 0 30px ${item.preview}50`
                                                            }}
                                                        />
                                                    )
                                                )}

                                                {/* Equipped badge */}
                                                {equipped && (
                                                    <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                        <Check className="w-3 h-3 text-black" />
                                                    </div>
                                                )}

                                                {/* Free badge for default items - Only show for Magazine Classico for Magazine members */}
                                                {isFree && !(isMGT && item.id === 'bg_default') && (
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                                                        <span className="text-[10px] font-bold text-green-400">GRÁTIS</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className={`p-3 ${isDarkMode ? 'bg-black/60' : 'bg-white/80'}`}>
                                                <h3 className={`text-sm font-medium ${textMain} truncate`}>{item.name}</h3>
                                                <p className={`text-xs ${textSub} truncate`}>{item.description}</p>

                                                {/* Action */}
                                                <div className="mt-2">
                                                    {owned ? (
                                                        <button
                                                            onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${equipped
                                                                ? `${isDarkMode ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`
                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                                }`}
                                                        >
                                                            {equipped ? 'Desequipar' : 'Equipar'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePurchase(item)}
                                                            disabled={purchasing === item.id || (user?.zions || 0) < item.price}
                                                            className={`w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${(user?.zions || 0) < item.price
                                                                ? `${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-300 text-gray-400'} cursor-not-allowed`
                                                                : `bg-${themeColor}-500 text-black hover:bg-${themeColor}-400`
                                                                }`}
                                                        >
                                                            {purchasing === item.id ? (
                                                                <span className="animate-spin">⏳</span>
                                                            ) : (user?.zions || 0) < item.price ? (
                                                                <>
                                                                    <Lock className="w-3 h-3" />
                                                                    {item.price}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Zap className="w-3 h-3" />
                                                                    {item.price}
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
            <SupplyBoxModal
                isOpen={showSupplyBox}
                onClose={() => setShowSupplyBox(false)}
                onSuccess={() => {
                    fetchThemePacks();
                    fetchUserCustomizations();
                }}
            />
        </AnimatePresence >
        , document.body);
}
