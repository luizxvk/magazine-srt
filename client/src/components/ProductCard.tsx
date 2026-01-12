import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Gamepad2, Gift, CreditCard, Sparkles, Check, Loader2, Key } from 'lucide-react';
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
    GAME_KEY: <Gamepad2 className="w-5 h-5" />,
    GIFT_CARD: <Gift className="w-5 h-5" />,
    SUBSCRIPTION: <CreditCard className="w-5 h-5" />,
    DIGITAL_ITEM: <Package className="w-5 h-5" />,
    SERVICE: <Sparkles className="w-5 h-5" />
};

const categoryLabels: Record<string, string> = {
    GAME_KEY: 'Key de Jogo',
    GIFT_CARD: 'Gift Card',
    SUBSCRIPTION: 'Assinatura',
    DIGITAL_ITEM: 'Item Digital',
    SERVICE: 'Serviço'
};

export default function ProductCard({ product, onPurchase }: ProductCardProps) {
    const { user, theme, updateUserZions } = useAuth();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [purchasedKeys, setPurchasedKeys] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    
    const gradientFrom = isMGT ? 'from-emerald-500' : 'from-yellow-500';
    const gradientTo = isMGT ? 'to-emerald-600' : 'to-yellow-600';
    const borderColor = isMGT ? 'border-emerald-500/30' : 'border-yellow-500/30';
    const bgAccent = isMGT ? 'bg-emerald-500/10' : 'bg-yellow-500/10';
    const textAccent = isMGT ? 'text-emerald-400' : 'text-yellow-400';
    const bgHover = isMGT ? 'hover:bg-emerald-500/20' : 'hover:bg-yellow-500/20';

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
            className={`relative rounded-2xl border ${borderColor} ${theme === 'light' ? 'bg-white/90' : 'bg-white/5'} backdrop-blur-xl overflow-hidden group`}
        >
            {/* Product Image or Placeholder - 16:9 aspect ratio */}
            <div className={`aspect-video ${bgAccent} flex items-center justify-center relative overflow-hidden`}>
                {product.imageUrl ? (
                    <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className={`${textAccent} opacity-30`}>
                        {categoryIcons[product.category] || <Package className="w-16 h-16" />}
                    </div>
                )}
                
                {/* Category Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full ${bgAccent} backdrop-blur-sm border ${borderColor}`}>
                    <div className={`flex items-center gap-1.5 ${textAccent} text-xs font-medium`}>
                        {categoryIcons[product.category]}
                        <span>{categoryLabels[product.category]}</span>
                    </div>
                </div>

                {/* Stock Badge */}
                {!product.isUnlimited && (
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                        isOutOfStock 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : product.availableStock <= 5 
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                        {isOutOfStock ? 'Esgotado' : `${product.availableStock} em estoque`}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <h3 className={`font-bold text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {product.name}
                </h3>
                
                <p className={`text-sm line-clamp-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {product.description}
                </p>

                {/* Prices */}
                <div className="flex items-center gap-3 flex-wrap">
                    {product.priceZions && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${bgAccent}`}>
                            <span className="text-lg">💎</span>
                            <span className={`font-bold ${textAccent}`}>
                                {product.priceZions.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400">Zions</span>
                        </div>
                    )}
                    
                    {product.priceBRL && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10">
                            <span className="font-bold text-green-400">
                                R$ {product.priceBRL.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Success Message with Keys */}
                {showSuccess && purchasedKeys.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2"
                    >
                        <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-5 h-5" />
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
                                    className="bg-black/30 px-3 py-2 rounded-lg font-mono text-sm text-green-300 break-all select-all"
                                >
                                    {key}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Buy Button */}
                {!showSuccess && (
                    <div className="flex gap-2 pt-2">
                        {product.priceZions && (
                            <button
                                onClick={handleBuyWithZions}
                                disabled={!canBuyWithZions || isPurchasing}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
                                    ${canBuyWithZions 
                                        ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white hover:opacity-90 active:scale-95` 
                                        : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {isPurchasing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>Comprar com Zions</span>
                                    </>
                                )}
                            </button>
                        )}

                        {product.priceBRL && (
                            <button
                                disabled={isOutOfStock}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all border
                                    ${!isOutOfStock 
                                        ? `${borderColor} ${bgHover} ${textAccent}` 
                                        : 'bg-gray-500/20 text-gray-500 cursor-not-allowed border-gray-500/30'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5" />
                                <span>Pagar R$</span>
                            </button>
                        )}
                    </div>
                )}

                {/* User Zions balance hint */}
                {product.priceZions && user && !canBuyWithZions && !isOutOfStock && !showSuccess && (
                    <p className="text-xs text-center text-gray-500">
                        Você tem {user.zions.toLocaleString()} Zions. 
                        Faltam {(product.priceZions - user.zions).toLocaleString()} Zions.
                    </p>
                )}
            </div>
        </motion.div>
    );
}
