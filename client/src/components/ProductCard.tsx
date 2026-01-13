import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Gamepad2, Gift, CreditCard, Sparkles, Coins, Percent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    magazineDiscount?: boolean; // 10% discount for MAGAZINE members
}

interface ProductCardProps {
    product: Product;
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

export default function ProductCard({ product }: ProductCardProps) {
    const { user, theme, accentColor } = useAuth();
    const navigate = useNavigate();

    const isMGT = user?.membershipType === 'MGT';
    const isMagazine = user?.membershipType === 'MAGAZINE';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    const isOutOfStock = !product.isUnlimited && product.availableStock <= 0;
    
    // Calculate discounted prices for MAGAZINE members
    const hasDiscount = product.magazineDiscount && isMagazine;
    const discountedZions = hasDiscount && product.priceZions ? Math.floor(product.priceZions * 0.9) : product.priceZions;
    const discountedBRL = hasDiscount && product.priceBRL ? +(product.priceBRL * 0.9).toFixed(2) : product.priceBRL;
    
    const canBuyWithZions = discountedZions && user && user.zionsCash >= discountedZions && !isOutOfStock;

    const handleCardClick = () => {
        navigate(`/loja/${product.id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleCardClick}
            className="glass-panel relative rounded-xl overflow-hidden group transition-all duration-300 cursor-pointer"
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
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${isOutOfStock
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : product.availableStock <= 5
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}>
                            {isOutOfStock ? 'Esgotado' : `${product.availableStock} disponíveis`}
                        </div>
                    )}

                    {/* Discount Badge */}
                    {hasDiscount && (
                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm bg-green-500/90 text-white flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            -10% MAGAZINE
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
                                {hasDiscount ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs line-through opacity-50" style={{ color }}>
                                            {product.priceZions.toLocaleString()}
                                        </span>
                                        <span className="font-bold text-sm" style={{ color }}>
                                            {discountedZions?.toLocaleString()}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="font-bold text-sm" style={{ color }}>
                                        {product.priceZions.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        )}

                        {product.priceBRL && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10">
                                {hasDiscount ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs line-through opacity-50 text-green-400">
                                            R$ {product.priceBRL.toFixed(2)}
                                        </span>
                                        <span className="font-bold text-sm text-green-400">
                                            R$ {discountedBRL?.toFixed(2)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="font-bold text-sm text-green-400">
                                        R$ {product.priceBRL.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Buy Button */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                            disabled={isOutOfStock}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: !isOutOfStock ? `linear-gradient(135deg, ${color}, ${color}dd)` : '#374151'
                            }}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Comprar</span>
                        </button>
                    </div>

                    {/* User Zions balance hint */}
                    {discountedZions && user && !canBuyWithZions && !isOutOfStock && (
                        <p className="text-xs text-center text-gray-500">
                            Faltam {(discountedZions - user.zionsCash).toLocaleString()} Zions
                        </p>
                    )}
                </div>
        </motion.div>
    );
}
