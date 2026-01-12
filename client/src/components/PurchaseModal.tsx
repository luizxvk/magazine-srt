import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ShoppingCart,
    CreditCard,
    Package,
    Gamepad2,
    Gift,
    Sparkles,
    Loader2,
    Mail,
    AlertCircle,
    Banknote
} from 'lucide-react';
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

interface PurchaseModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onPurchaseComplete?: () => void;
    onGoToOrders?: () => void;
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

export default function PurchaseModal({ product, isOpen, onClose, onPurchaseComplete, onGoToOrders }: PurchaseModalProps) {
    const { user, accentColor, updateUserZions } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState<'zions' | 'brl' | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseComplete, setPurchaseComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    const canBuyWithZions = product.priceZions && user && user.zionsCash >= (product.priceZions * quantity);
    const totalZions = product.priceZions ? product.priceZions * quantity : 0;
    const totalBRL = product.priceBRL ? product.priceBRL * quantity : 0;

    const maxQuantity = product.isUnlimited ? 10 : Math.min(product.availableStock, 10);

    const handlePurchase = async () => {
        if (!paymentMethod) return;

        setIsPurchasing(true);
        setError(null);

        try {
            if (paymentMethod === 'zions') {
                await api.post('/products/purchase/zions', {
                    productId: product.id,
                    quantity
                });
                updateUserZions(-totalZions);
            } else {
                // BRL payment would redirect to payment gateway
                // For now, just show a message
                setError('Pagamento em BRL em breve! Use Zions por enquanto.');
                setIsPurchasing(false);
                return;
            }

            setPurchaseComplete(true);
            onPurchaseComplete?.();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao processar compra');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleClose = () => {
        if (!isPurchasing) {
            setPurchaseComplete(false);
            setPaymentMethod(null);
            setQuantity(1);
            setError(null);
            onClose();
        }
    };

    const handleGoToOrders = () => {
        handleClose();
        onGoToOrders?.();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl overflow-hidden border shadow-2xl"
                    style={{ borderColor: `${color}40` }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="p-5 border-b flex items-center justify-between"
                        style={{
                            borderColor: `${color}30`,
                            background: `linear-gradient(135deg, ${color}10, transparent)`
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="p-2 rounded-xl"
                                style={{ backgroundColor: `${color}20` }}
                            >
                                <ShoppingCart className="w-5 h-5" style={{ color }} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Finalizar Compra</h2>
                                <p className="text-xs text-gray-500">Confirme os detalhes abaixo</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isPurchasing}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-5">
                        {purchaseComplete ? (
                            /* Success State */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6 space-y-4"
                            >
                                <div
                                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center relative"
                                    style={{ backgroundColor: `${color}20` }}
                                >
                                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
                                    <Sparkles className="w-10 h-10" style={{ color }} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Parabéns pela Compra!</h3>
                                    <p className="text-gray-300 text-base">
                                        Você adquiriu <strong style={{ color }}>{product.name}</strong> com sucesso.
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Sua key foi enviada para seu email e está disponível na aba <strong className="text-white">Minhas Compras</strong>.
                                    </p>
                                </div>

                                <div className="pt-4 flex flex-col gap-3">
                                    {onGoToOrders && (
                                        <button
                                            onClick={handleGoToOrders}
                                            className="w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:brightness-110"
                                            style={{
                                                background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                                                boxShadow: `0 8px 20px -4px ${color}66`
                                            }}
                                        >
                                            Ver Meus Produtos
                                        </button>
                                    )}
                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Continuar Comprando
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {/* Product Preview */}
                                <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                                    <div
                                        className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                                        style={{ backgroundColor: `${color}10` }}
                                    >
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="opacity-30" style={{ color }}>
                                                {categoryIcons[product.category]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate">{product.name}</h3>
                                        <div
                                            className="inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded"
                                            style={{ backgroundColor: `${color}20`, color }}
                                        >
                                            {categoryIcons[product.category]}
                                            <span className="text-[10px]">{categoryLabels[product.category]}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {product.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                {maxQuantity > 1 && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Quantidade</label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white font-bold text-lg"
                                            >
                                                -
                                            </button>
                                            <span className="text-white font-bold text-xl w-12 text-center">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white font-bold text-lg"
                                            >
                                                +
                                            </button>
                                            {!product.isUnlimited && (
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({product.availableStock} disponíveis)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Payment Method Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Forma de Pagamento</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Zions Payment */}
                                        {product.priceZions && (
                                            <button
                                                onClick={() => setPaymentMethod('zions')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'zions'
                                                    ? 'border-opacity-100'
                                                    : 'border-opacity-30 hover:border-opacity-50'
                                                    }`}
                                                style={{
                                                    borderColor: paymentMethod === 'zions' ? color : `${color}`,
                                                    backgroundColor: paymentMethod === 'zions' ? `${color}15` : 'transparent'
                                                }}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Banknote className="w-5 h-5" style={{ color }} />
                                                    <span className="text-white font-medium">Zions Cash</span>
                                                </div>
                                                <p className="text-lg font-bold" style={{ color }}>
                                                    R$ {totalZions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Saldo: R$ {user?.zionsCash?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                                </p>
                                                {!canBuyWithZions && (
                                                    <p className="text-xs text-red-400 mt-1">
                                                        Saldo insuficiente
                                                    </p>
                                                )}
                                            </button>
                                        )}

                                        {/* BRL Payment */}
                                        {product.priceBRL && (
                                            <button
                                                onClick={() => setPaymentMethod('brl')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'brl'
                                                    ? 'border-green-500'
                                                    : 'border-green-500/30 hover:border-green-500/50'
                                                    }`}
                                                style={{
                                                    backgroundColor: paymentMethod === 'brl' ? 'rgba(34, 197, 94, 0.15)' : 'transparent'
                                                }}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CreditCard className="w-5 h-5 text-green-400" />
                                                    <span className="text-white font-medium">BRL</span>
                                                </div>
                                                <p className="text-lg font-bold text-green-400">
                                                    R$ {totalBRL.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Em breve
                                                </p>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Email Notice */}
                                <div
                                    className="flex items-start gap-2 p-3 rounded-lg text-sm"
                                    style={{ backgroundColor: `${color}10` }}
                                >
                                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
                                    <div>
                                        <p className="text-gray-300">
                                            As keys serão enviadas para:
                                        </p>
                                        <p className="font-medium" style={{ color }}>
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Purchase Button */}
                                <button
                                    onClick={handlePurchase}
                                    disabled={!paymentMethod || isPurchasing || (paymentMethod === 'zions' && !canBuyWithZions)}
                                    className="w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background: paymentMethod ? `linear-gradient(135deg, ${color}, ${color}dd)` : '#374151'
                                    }}
                                >
                                    {isPurchasing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-5 h-5" />
                                            <span>Confirmar Compra</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
