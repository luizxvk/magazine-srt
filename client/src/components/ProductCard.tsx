import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Gamepad2, Gift, CreditCard, Sparkles, Check, Loader2, Key, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    category: 'GAME_KEY' | 'GIFT_CARD' | 'SUBSCRIPTION' | 'DIGITAL_ITEM' | 'SERVICE';
    priceZions?: number;
    priceBRL?: number;
    availableStock: number;
    isUnlimited: boolean;
}

interface ProductCardProps {
    product: Product;
    onPurchase?: (keys: string[]) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
    GAME_KEY: <Gamepad2 className="w-4 h-4" />,
    GIFT_CARD: <Gift className="w-4 h-4" />,
    SUBSCRIPTION: <CreditCard className="w-4 h-4" />,
    DIGITAL_ITEM: <Package className="w-4 h-4" />,
    SERVICE: <Sparkles className="w-4 h-4" />
};

const categoryLabels: Record<string, string> = {
    GAME_KEY: 'Key de Jogo',
    GIFT_CARD: 'Gift Card',
    SUBSCRIPTION: 'Assinatura',
    DIGITAL_ITEM: 'Item Digital',
    SERVICE: 'Serviço'
};

export default function ProductCard({ product, onPurchase }: ProductCardProps) {
    const { user, theme, updateUserZions, accentColor } = useAuth();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [purchasedKeys, setPurchasedKeys] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    const isOutOfStock = !product.isUnlimited && product.availableStock <= 0;
    const canBuyWithZions = product.priceZions && user && user.zions >= product.priceZions && !isOutOfStock;

    const handleBuyWithZions = async () => {
        if (!product.priceZions || !user) return;
        
        setIsPurchasing(true);
        setError(null);

        try {
            const response = await api.post('/products/purchase/zions', {
                productId: product.id,
                quantity: 1
            });

            setPurchasedKeys(response.data.keys || []);
            setShowSuccess(true);
            updateUserZions(-(product.priceZions || 0));
            onPurchase?.(response.data.keys || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao comprar');
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel relative rounded-xl overflow-hidden group transition-all duration-300"
            style={{ 
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `${color}33`
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}66`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${color}33`)}
        >
            {/* Product Image or Placeholder - 16:9 aspect ratio */}
            <div 
                className="aspect-video flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: `${color}10` }}
            >
                {product.imageUrl ? (
                    <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="opacity-30" style={{ color }}>
                        <Package className="w-16 h-16" />
                    </div>
                )}
                
                {/* Category Badge */}
                <div 
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1.5 text-xs font-medium"
                    style={{ 
                        backgroundColor: `${color}20`,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: `${color}40`,
                        color
                    }}
                >
                    {categoryIcons[product.category]}
                    <span>{categoryLabels[product.category]}</span>
                </div>

                {/* Stock Badge */}
                {!product.isUnlimited && (
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
                        isOutOfStock 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : product.availableStock <= 5 
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                        {isOutOfStock ? 'Esgotado' : `${product.availableStock} disponíveis`}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <h3 className={`font-bold text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'} line-clamp-1`}>
                    {product.name}
                </h3>
                
                <p className={`text-sm line-clamp-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {product.description}
                </p>

                {/* Prices */}
                <div className="flex items-center gap-2 flex-wrap">
                    {product.priceZions && (
                        <div 
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                            style={{ backgroundColor: `${color}15` }}
                        >
                            <Coins className="w-4 h-4" style={{ color }} />
                            <span className="font-bold text-sm" style={{ color }}>
                                {product.priceZions.toLocaleString()}
                            </span>
                        </div>
                    )}
                    
                    {product.priceBRL && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10">
                            <span className="font-bold text-sm text-green-400">
                                R$ {product.priceBRL.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                        {error}
                    </div>
                )}

                {/* Success Message with Keys */}
                {showSuccess && purchasedKeys.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2"
                    >
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <Check className="w-4 h-4" />
                            <span className="font-medium">Compra realizada!</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Key className="w-3 h-3" />
                                Sua(s) key(s):
                            </p>
                            {purchasedKeys.map((key, i) => (
                                <div 
                                    key={i}
                                    className="bg-black/30 px-2 py-1.5 rounded font-mono text-xs text-green-300 break-all select-all"
                                >
                                    {key}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Buy Button */}
                {!showSuccess && (
                    <div className="flex gap-2 pt-1">
                        {product.priceZions && (
                            <button
                                onClick={handleBuyWithZions}
                                disabled={!canBuyWithZions || isPurchasing}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ 
                                    background: canBuyWithZions ? `linear-gradient(135deg, ${color}, ${color}dd)` : undefined,
                                    backgroundColor: !canBuyWithZions ? '#374151' : undefined
                                }}
                            >
                                {isPurchasing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>Comprar</span>
                                    </>
                                )}
                            </button>
                        )}

                        {product.priceBRL && !product.priceZions && (
                            <button
                                disabled={isOutOfStock}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>R$ {product.priceBRL.toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* User Zions balance hint */}
                {product.priceZions && user && !canBuyWithZions && !isOutOfStock && !showSuccess && (
                    <p className="text-xs text-center text-gray-500">
                        Faltam {(product.priceZions - user.zions).toLocaleString()} Zions
                    </p>
                )}
            </div>
        </motion.div>
    );
}
