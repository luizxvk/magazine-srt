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
    Mail,
    AlertCircle,
    Banknote,
    Percent,
    QrCode,
    Receipt,
    ExternalLink,
    Copy,
    Check,
    Clock
} from 'lucide-react';
import Loader from './Loader';
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
    magazineDiscount?: boolean;
    acceptedPaymentMethods?: string[];
    pixKey?: string;
    pixKeyType?: string;
    pixApprovalStatus?: string;
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
    const { user, accentColor, updateUserZions, showEdgeNotification } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState<'zions' | 'brl' | 'pix_direct' | null>(null);
    const [brlPaymentType, setBrlPaymentType] = useState<'pix' | 'card' | 'boleto' | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseComplete, setPurchaseComplete] = useState(false);
    const [pixOrderCreated, setPixOrderCreated] = useState(false);
    const [copiedPix, setCopiedPix] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    const isMagazine = user?.membershipType === 'MAGAZINE';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    // Discount calculation for MAGAZINE/Elite members
    const isElite = user?.isElite || user?.membershipType === 'MGT';
    const hasDiscount = product.magazineDiscount && (isMagazine || isElite);
    const discountPercent = isElite ? 0.15 : 0.10; // Elite 15%, Magazine 10%
    const discountMultiplier = 1 - discountPercent;
    const discountedPriceZions = hasDiscount && product.priceZions 
        ? Math.floor(product.priceZions * discountMultiplier) 
        : product.priceZions;
    const discountedPriceBRL = hasDiscount && product.priceBRL 
        ? Number((product.priceBRL * discountMultiplier).toFixed(2)) 
        : product.priceBRL;

    const canBuyWithZions = discountedPriceZions && user && user.zionsCash >= (discountedPriceZions * quantity);
    const totalZions = discountedPriceZions ? discountedPriceZions * quantity : 0;
    const totalBRL = discountedPriceBRL ? discountedPriceBRL * quantity : 0;
    const originalTotalZions = product.priceZions ? product.priceZions * quantity : 0;
    const originalTotalBRL = product.priceBRL ? product.priceBRL * quantity : 0;

    const maxQuantity = product.isUnlimited ? 10 : Math.min(product.availableStock, 10);

    // Determine available payment methods
    const acceptedMethods = product.acceptedPaymentMethods && product.acceptedPaymentMethods.length > 0
        ? product.acceptedPaymentMethods
        : []; // If empty, show all that have prices set
    const showZions = product.priceZions && (acceptedMethods.length === 0 || acceptedMethods.includes('ZIONS'));
    const showPixDirect = product.priceBRL && product.pixKey && acceptedMethods.includes('PIX') && product.pixApprovalStatus === 'APPROVED';
    const showMercadoPago = product.priceBRL && (acceptedMethods.length === 0 || acceptedMethods.includes('MERCADO_PAGO'));

    const pixKeyTypeLabels: Record<string, string> = {
        CPF: 'CPF',
        CNPJ: 'CNPJ',
        EMAIL: 'E-mail',
        PHONE: 'Telefone',
        RANDOM: 'Chave Aleatória'
    };

    const handleCopyPixKey = async () => {
        if (product.pixKey) {
            try {
                await navigator.clipboard.writeText(product.pixKey);
                setCopiedPix(true);
                setTimeout(() => setCopiedPix(false), 2000);
            } catch {
                // Fallback
                const el = document.createElement('textarea');
                el.value = product.pixKey;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                setCopiedPix(true);
                setTimeout(() => setCopiedPix(false), 2000);
            }
        }
    };

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
                setPurchaseComplete(true);
                onPurchaseComplete?.();
            } else if (paymentMethod === 'pix_direct') {
                // Create a pending order for PIX direct payment
                const { data } = await api.post('/products/purchase/pix-direct', {
                    productId: product.id,
                    quantity
                });
                if (data.orderId) {
                    setPixOrderCreated(true);
                    showEdgeNotification?.('info', 'Pedido Criado', 'Faça o PIX e aguarde confirmação do vendedor');
                }
            } else {
                // BRL payment via MercadoPago
                const { data } = await api.post('/payments/product/create-preference', {
                    productId: product.id,
                    quantity,
                    paymentType: brlPaymentType
                });

                if (data.simulation) {
                    // Modo simulação - simular pagamento aprovado
                    await api.post('/payments/product/simulate', { orderId: data.orderId });
                    showEdgeNotification?.('success', 'Compra Simulada!', 'Pagamento processado com sucesso (modo dev)');
                    setPurchaseComplete(true);
                    onPurchaseComplete?.();
                } else if (data.init_point) {
                    // Redirecionar para checkout MercadoPago
                    showEdgeNotification?.('info', 'Redirecionando...', 'Você será redirecionado para o checkout do MercadoPago');
                    
                    // Abrir em nova aba ou redirecionar
                    window.open(data.init_point, '_blank');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao processar compra');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleClose = () => {
        if (!isPurchasing) {
            setPurchaseComplete(false);
            setPixOrderCreated(false);
            setCopiedPix(false);
            setPaymentMethod(null);
            setBrlPaymentType(null);
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
                        ) : pixOrderCreated ? (
                            /* PIX Direct - Order Created, Show PIX Key */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6 space-y-4"
                            >
                                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center relative bg-cyan-500/20">
                                    <QrCode className="w-10 h-10 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Pedido Criado!</h3>
                                    <p className="text-gray-300 text-sm">
                                        Faça o PIX de <strong className="text-cyan-400">R$ {totalBRL.toFixed(2)}</strong> para a chave abaixo:
                                    </p>
                                </div>

                                {/* PIX Key Display */}
                                <div className="bg-cyan-500/5 border border-cyan-500/30 rounded-xl p-4 space-y-3">
                                    <div className="text-xs text-cyan-400/70 uppercase tracking-wider">
                                        {product.pixKeyType ? pixKeyTypeLabels[product.pixKeyType] || product.pixKeyType : 'Chave PIX'}
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg p-3">
                                        <span className="flex-1 text-white font-mono text-sm break-all text-left">
                                            {product.pixKey}
                                        </span>
                                        <button
                                            onClick={handleCopyPixKey}
                                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                                                copiedPix 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                            }`}
                                        >
                                            {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {copiedPix && (
                                        <p className="text-xs text-green-400">Chave copiada!</p>
                                    )}
                                </div>

                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left">
                                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-300">
                                        <p className="font-medium">Aguardando confirmação</p>
                                        <p className="text-amber-400/70 mt-0.5">
                                            Após realizar o PIX, o vendedor confirmará o pagamento e suas keys serão liberadas.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-col gap-3">
                                    {onGoToOrders && (
                                        <button
                                            onClick={handleGoToOrders}
                                            className="w-full py-3 rounded-xl font-bold text-white transition-all bg-cyan-600 hover:bg-cyan-500"
                                        >
                                            Ver Meus Pedidos
                                        </button>
                                    )}
                                    <button
                                        onClick={handleClose}
                                        className="w-full py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Fechar
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
                                    
                                    {/* Discount Banner */}
                                    {hasDiscount && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3">
                                            <Percent className="w-4 h-4 text-amber-400" />
                                            <span className="text-amber-400 text-sm font-medium">-10% de desconto MAGAZINE aplicado!</span>
                                        </div>
                                    )}
                                    
                                    <div className={`grid ${[showZions, showPixDirect, showMercadoPago].filter(Boolean).length >= 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                                        {/* Zions Payment */}
                                        {showZions && (
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
                                                    <span className="text-white font-medium text-sm">Zions Cash</span>
                                                </div>
                                                {hasDiscount ? (
                                                    <div>
                                                        <p className="text-xs text-gray-500 line-through">
                                                            R$ {originalTotalZions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-base font-bold text-amber-400">
                                                            R$ {totalZions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-base font-bold" style={{ color }}>
                                                        R$ {totalZions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    Saldo: R$ {user?.zionsCash?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                                </p>
                                                {!canBuyWithZions && (
                                                    <p className="text-[10px] text-red-400 mt-0.5">
                                                        Saldo insuficiente
                                                    </p>
                                                )}
                                            </button>
                                        )}

                                        {/* PIX Direct Payment */}
                                        {showPixDirect && (
                                            <button
                                                onClick={() => setPaymentMethod('pix_direct')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'pix_direct'
                                                    ? 'border-cyan-500'
                                                    : 'border-cyan-500/30 hover:border-cyan-500/50'
                                                    }`}
                                                style={{
                                                    backgroundColor: paymentMethod === 'pix_direct' ? 'rgba(6, 182, 212, 0.15)' : 'transparent'
                                                }}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <QrCode className="w-5 h-5 text-cyan-400" />
                                                    <span className="text-white font-medium text-sm">PIX Direto</span>
                                                </div>
                                                {hasDiscount ? (
                                                    <div>
                                                        <p className="text-xs text-gray-500 line-through">
                                                            R$ {originalTotalBRL.toFixed(2)}
                                                        </p>
                                                        <p className="text-base font-bold text-amber-400">
                                                            R$ {totalBRL.toFixed(2)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-base font-bold text-cyan-400">
                                                        R$ {totalBRL.toFixed(2)}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-cyan-400/60 mt-1">
                                                    Transferência direta
                                                </p>
                                            </button>
                                        )}

                                        {/* BRL/MercadoPago Payment */}
                                        {showMercadoPago && (
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
                                                    <span className="text-white font-medium text-sm">Mercado Pago</span>
                                                </div>
                                                {hasDiscount ? (
                                                    <div>
                                                        <p className="text-xs text-gray-500 line-through">
                                                            R$ {originalTotalBRL.toFixed(2)}
                                                        </p>
                                                        <p className="text-base font-bold text-amber-400">
                                                            R$ {totalBRL.toFixed(2)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-base font-bold text-green-400">
                                                        R$ {totalBRL.toFixed(2)}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-green-400/60 mt-1">
                                                    PIX, Cartão ou Boleto
                                                </p>
                                            </button>
                                        )}
                                    </div>

                                    {/* BRL Payment Type Selection */}
                                    <AnimatePresence>
                                        {paymentMethod === 'brl' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 overflow-hidden"
                                            >
                                                <p className="text-xs text-gray-400 mb-2">Escolha a forma de pagamento:</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={() => setBrlPaymentType('pix')}
                                                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
                                                            brlPaymentType === 'pix'
                                                                ? 'border-cyan-500 bg-cyan-500/10'
                                                                : 'border-white/10 hover:border-white/30 bg-white/5'
                                                        }`}
                                                    >
                                                        <QrCode className={`w-5 h-5 ${brlPaymentType === 'pix' ? 'text-cyan-400' : 'text-gray-400'}`} />
                                                        <span className={`text-xs font-medium ${brlPaymentType === 'pix' ? 'text-cyan-400' : 'text-gray-400'}`}>
                                                            PIX
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => setBrlPaymentType('card')}
                                                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
                                                            brlPaymentType === 'card'
                                                                ? 'border-purple-500 bg-purple-500/10'
                                                                : 'border-white/10 hover:border-white/30 bg-white/5'
                                                        }`}
                                                    >
                                                        <CreditCard className={`w-5 h-5 ${brlPaymentType === 'card' ? 'text-purple-400' : 'text-gray-400'}`} />
                                                        <span className={`text-xs font-medium ${brlPaymentType === 'card' ? 'text-purple-400' : 'text-gray-400'}`}>
                                                            Cartão
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => setBrlPaymentType('boleto')}
                                                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
                                                            brlPaymentType === 'boleto'
                                                                ? 'border-orange-500 bg-orange-500/10'
                                                                : 'border-white/10 hover:border-white/30 bg-white/5'
                                                        }`}
                                                    >
                                                        <Receipt className={`w-5 h-5 ${brlPaymentType === 'boleto' ? 'text-orange-400' : 'text-gray-400'}`} />
                                                        <span className={`text-xs font-medium ${brlPaymentType === 'boleto' ? 'text-orange-400' : 'text-gray-400'}`}>
                                                            Boleto
                                                        </span>
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" />
                                                    Você será redirecionado para o checkout seguro do MercadoPago
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                    disabled={
                                        !paymentMethod || 
                                        isPurchasing || 
                                        (paymentMethod === 'zions' && !canBuyWithZions) ||
                                        (paymentMethod === 'brl' && !brlPaymentType)
                                    }
                                    className="w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background: paymentMethod 
                                            ? paymentMethod === 'pix_direct' 
                                                ? 'linear-gradient(135deg, #06b6d4, #0891b2)' 
                                                : `linear-gradient(135deg, ${color}, ${color}dd)` 
                                            : '#374151'
                                    }}
                                >
                                    {isPurchasing ? (
                                        <>
                                            <Loader size="sm" />
                                            <span>Processando...</span>
                                        </>
                                    ) : paymentMethod === 'pix_direct' ? (
                                        <>
                                            <QrCode className="w-5 h-5" />
                                            <span>Gerar Pedido PIX</span>
                                        </>
                                    ) : paymentMethod === 'brl' ? (
                                        <>
                                            <ExternalLink className="w-5 h-5" />
                                            <span>Ir para Checkout</span>
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
