import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Lock, Palette, Image, Award, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

// Predefined backgrounds
const backgrounds: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    { id: 'bg-aurora', name: 'Aurora Boreal', description: 'Ondas suaves de luz em movimento', price: 500, type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' },
    { id: 'bg-nebula', name: 'Nebulosa', description: 'Galáxia distante em cores vibrantes', price: 750, type: 'background', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)' },
    { id: 'bg-cyber', name: 'Cyber Grid', description: 'Grade futurista animada', price: 600, type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)' },
    { id: 'bg-fire', name: 'Chamas', description: 'Fogo dançante nas bordas', price: 800, type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)' },
    { id: 'bg-ocean', name: 'Oceano Profundo', description: 'Ondas calmas em azul', price: 450, type: 'background', preview: 'linear-gradient(180deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)' },
    { id: 'bg-matrix', name: 'Matrix', description: 'Código caindo estilo matrix', price: 900, type: 'background', preview: 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 50%, #0a0f0a 100%)' },
    { id: 'bg-sunset', name: 'Pôr do Sol', description: 'Gradiente quente e acolhedor', price: 400, type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #2d1a3e 30%, #4a2a4e 50%, #2d1a3e 70%, #1a1a2e 100%)' },
    { id: 'bg-minimal', name: 'Minimalista', description: 'Escuro puro e elegante', price: 200, type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%)' },
];

// Predefined badges (profile decorations)
const badges: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    { id: 'badge-skull', name: 'Caveira', description: 'Estilo rebelde', price: 300, type: 'badge', preview: '💀' },
    { id: 'badge-fire', name: 'Fogo', description: 'Queima tudo!', price: 350, type: 'badge', preview: '🔥' },
    { id: 'badge-star', name: 'Estrela', description: 'Brilhe sempre', price: 250, type: 'badge', preview: '⭐' },
    { id: 'badge-diamond', name: 'Diamante', description: 'Precioso e raro', price: 500, type: 'badge', preview: '💎' },
    { id: 'badge-lightning', name: 'Raio', description: 'Velocidade máxima', price: 400, type: 'badge', preview: '⚡' },
    { id: 'badge-ghost', name: 'Fantasma', description: 'Misterioso', price: 350, type: 'badge', preview: '👻' },
    { id: 'badge-rocket', name: 'Foguete', description: 'Rumo ao topo', price: 450, type: 'badge', preview: '🚀' },
    { id: 'badge-unicorn', name: 'Unicórnio', description: 'Mágico e único', price: 600, type: 'badge', preview: '🦄' },
    { id: 'badge-alien', name: 'Alien', description: 'De outro mundo', price: 400, type: 'badge', preview: '👽' },
    { id: 'badge-robot', name: 'Robô', description: 'Tecnológico', price: 350, type: 'badge', preview: '🤖' },
];

// Neon accent colors (excluding gold for Magazine exclusivity)
const colors: Omit<ShopItem, 'owned' | 'equipped'>[] = [
    { id: 'color-cyan', name: 'Ciano Neon', description: 'Azul elétrico vibrante', price: 400, type: 'color', preview: '#00ffff' },
    { id: 'color-magenta', name: 'Magenta Neon', description: 'Rosa intenso', price: 400, type: 'color', preview: '#ff00ff' },
    { id: 'color-lime', name: 'Lima Neon', description: 'Verde vibrante', price: 400, type: 'color', preview: '#00ff00' },
    { id: 'color-orange', name: 'Laranja Neon', description: 'Quente e energético', price: 400, type: 'color', preview: '#ff6600' },
    { id: 'color-purple', name: 'Roxo Neon', description: 'Misterioso e elegante', price: 400, type: 'color', preview: '#9933ff' },
    { id: 'color-pink', name: 'Rosa Neon', description: 'Doce e marcante', price: 400, type: 'color', preview: '#ff3399' },
    { id: 'color-blue', name: 'Azul Neon', description: 'Clássico e moderno', price: 400, type: 'color', preview: '#3399ff' },
    { id: 'color-red', name: 'Vermelho Neon', description: 'Intenso e poderoso', price: 400, type: 'color', preview: '#ff3333' },
];

export default function CustomizationShop({ isOpen, onClose }: CustomizationShopProps) {
    const { user, updateUserZions } = useAuth();
    const [activeTab, setActiveTab] = useState<'background' | 'badge' | 'color'>('background');
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [equippedItems, setEquippedItems] = useState<{ background?: string; badge?: string; color?: string }>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'emerald' : 'gold';

    useEffect(() => {
        if (isOpen) {
            fetchUserCustomizations();
        }
    }, [isOpen]);

    const fetchUserCustomizations = async () => {
        try {
            const response = await api.get('/users/customizations');
            setOwnedItems(response.data.owned || []);
            setEquippedItems(response.data.equipped || {});
        } catch (error) {
            console.error('Failed to fetch customizations', error);
        }
    };

    const handlePurchase = async (item: Omit<ShopItem, 'owned' | 'equipped'>) => {
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
            await api.post('/users/customizations/equip', { 
                itemId: item.id, 
                category: categoryMap[item.type] 
            });
            setEquippedItems(prev => ({ ...prev, [item.type]: item.id }));
            setNotification({ type: 'success', message: `${item.name} equipado!` });
        } catch (error) {
            setNotification({ type: 'error', message: 'Erro ao equipar item' });
        }
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUnequip = async (type: 'background' | 'badge' | 'color') => {
        try {
            const categoryMap = { background: 'backgrounds', badge: 'badges', color: 'colors' };
            await api.post('/users/customizations/unequip', { category: categoryMap[type] });
            setEquippedItems(prev => ({ ...prev, [type]: undefined }));
        } catch (error) {
            console.error('Failed to unequip', error);
        }
    };

    const getItems = () => {
        switch (activeTab) {
            case 'background': return backgrounds;
            case 'badge': return badges;
            case 'color': return colors;
        }
    };

    const tabs = [
        { id: 'background' as const, label: 'Fundos', icon: Image },
        { id: 'badge' as const, label: 'Badges', icon: Award },
        { id: 'color' as const, label: 'Cores', icon: Palette },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-br from-neutral-900 via-neutral-950 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-${themeColor}-500/10 to-transparent`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${themeColor}-500/20`}>
                                <Sparkles className={`w-5 h-5 text-${themeColor}-400`} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Loja de Personalização</h2>
                                <p className="text-xs text-gray-400">Customize seu perfil</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${themeColor}-500/20 border border-${themeColor}-500/30`}>
                                <Zap className={`w-4 h-4 text-${themeColor}-400`} />
                                <span className={`text-sm font-bold text-${themeColor}-400`}>{user?.zions || 0}</span>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Notification */}
                    <AnimatePresence>
                        {notification && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg z-50 ${
                                    notification.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                            >
                                {notification.message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? `text-${themeColor}-400 border-b-2 border-${themeColor}-400 bg-${themeColor}-500/5`
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="p-4 overflow-y-auto max-h-[calc(85vh-180px)] custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {getItems().map(item => {
                                const owned = ownedItems.includes(item.id);
                                const equipped = equippedItems[item.type] === item.id;

                                return (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ scale: 1.02 }}
                                        className={`relative rounded-xl overflow-hidden border ${
                                            equipped ? `border-${themeColor}-500` : 'border-white/10'
                                        } bg-black/40`}
                                    >
                                        {/* Preview */}
                                        <div className="aspect-square relative flex items-center justify-center">
                                            {item.type === 'background' && (
                                                <div className="absolute inset-0" style={{ background: item.preview }} />
                                            )}
                                            {item.type === 'badge' && (
                                                <span className="text-5xl">{item.preview}</span>
                                            )}
                                            {item.type === 'color' && (
                                                <div 
                                                    className="w-16 h-16 rounded-full shadow-lg"
                                                    style={{ 
                                                        backgroundColor: item.preview,
                                                        boxShadow: `0 0 30px ${item.preview}50`
                                                    }}
                                                />
                                            )}
                                            
                                            {/* Equipped badge */}
                                            {equipped && (
                                                <div className={`absolute top-2 right-2 p-1 rounded-full bg-${themeColor}-500`}>
                                                    <Check className="w-3 h-3 text-black" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-3 bg-black/60">
                                            <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                            
                                            {/* Action */}
                                            <div className="mt-2">
                                                {owned ? (
                                                    <button
                                                        onClick={() => equipped ? handleUnequip(item.type) : handleEquip(item)}
                                                        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                            equipped
                                                                ? 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                                : `bg-${themeColor}-500/20 text-${themeColor}-400 hover:bg-${themeColor}-500/30`
                                                        }`}
                                                    >
                                                        {equipped ? 'Desequipar' : 'Equipar'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePurchase(item)}
                                                        disabled={purchasing === item.id || (user?.zions || 0) < item.price}
                                                        className={`w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                                                            (user?.zions || 0) < item.price
                                                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
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
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
