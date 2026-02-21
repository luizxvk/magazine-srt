import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, ShoppingCart, Package, Gamepad2, Gift, CreditCard, 
    Sparkles, Coins, Calendar, HardDrive, Monitor, User, 
    ChevronLeft, ChevronRight, X, Shield, Percent
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LuxuriousBackground from '../components/LuxuriousBackground';
import PurchaseModal from '../components/PurchaseModal';
import Loader from '../components/Loader';

interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    screenshots?: string[];
    category: 'GAME_KEY' | 'GIFT_CARD' | 'SUBSCRIPTION' | 'DIGITAL_ITEM' | 'SERVICE';
    priceZions?: number;
    priceBRL?: number;
    availableStock: number;
    isUnlimited: boolean;
    magazineDiscount?: boolean;
    developer?: string;
    releaseDate?: string;
    sizeGB?: number;
    platform?: string;
    tags?: { tag: string }[];
    createdAt: string;
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

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, accentColor } = useAuth();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);

    const { isStdTier } = useCommunity();
    const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;
    const isMagazine = user?.membershipType === 'MAGAZINE';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    // Discount calculation for MAGAZINE/Elite members
    const isElite = user?.isElite || user?.membershipType === 'MGT';
    const hasDiscount = product?.magazineDiscount && (isMagazine || isElite);
    const discountPercent = isElite ? 0.15 : 0.10; // Elite 15%, Magazine 10%
    const discountMultiplier = 1 - discountPercent;
    const discountedZions = hasDiscount && product?.priceZions 
        ? Math.floor(product.priceZions * discountMultiplier) 
        : null;
    const discountedBRL = hasDiscount && product?.priceBRL 
        ? (product.priceBRL * discountMultiplier).toFixed(2) 
        : null;

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/products/${id}`);
            setProduct(response.data);
        } catch (error) {
            console.error('Error fetching product:', error);
            navigate('/loja');
        } finally {
            setLoading(false);
        }
    };

    const allImages = product ? [product.imageUrl, ...(product.screenshots || [])].filter(Boolean) as string[] : [];

    const nextImage = () => {
        setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = () => {
        setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LuxuriousBackground />
                <Loader size="lg" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LuxuriousBackground />
                <div className="text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color }} />
                    <h2 className="text-xl font-bold text-white mb-2">Produto não encontrado</h2>
                    <button
                        onClick={() => navigate('/loja')}
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: color }}
                    >
                        Voltar à Loja
                    </button>
                </div>
            </div>
        );
    }

    const isOutOfStock = !product.isUnlimited && product.availableStock <= 0;

    return (
        <div className="min-h-screen">
            <LuxuriousBackground />
            <Header />

            {/* Purchase Modal */}
            {showPurchaseModal && (
                <PurchaseModal
                    product={product}
                    isOpen={showPurchaseModal}
                    onClose={() => setShowPurchaseModal(false)}
                    onPurchaseComplete={() => {
                        setShowPurchaseModal(false);
                        fetchProduct();
                    }}
                    onGoToOrders={() => navigate('/loja?tab=orders')}
                />
            )}

            {/* Gallery Modal */}
            <AnimatePresence>
                {showGallery && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                        onClick={() => setShowGallery(false)}
                    >
                        <button
                            onClick={() => setShowGallery(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        
                        <button
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ChevronLeft className="w-8 h-8 text-white" />
                        </button>

                        <motion.img
                            key={selectedImageIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            src={allImages[selectedImageIndex]}
                            alt={product.name}
                            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                        />

                        <button
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ChevronRight className="w-8 h-8 text-white" />
                        </button>

                        {/* Thumbnails */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {allImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                                    className={`w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                                        idx === selectedImageIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 pb-24">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/loja')}
                    className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: `${color}15`, color }}
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Voltar à Loja</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Images */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Main Image */}
                        <div 
                            className="aspect-video rounded-2xl overflow-hidden cursor-pointer relative group"
                            onClick={() => setShowGallery(true)}
                        >
                            <img
                                src={allImages[selectedImageIndex] || '/placeholder-game.jpg'}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-medium">Clique para expandir</span>
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {allImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                            idx === selectedImageIndex 
                                                ? 'scale-105' 
                                                : 'opacity-60 hover:opacity-100 border-transparent'
                                        }`}
                                        style={{ borderColor: idx === selectedImageIndex ? color : 'transparent' }}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Description Section */}
                        <div 
                            className="rounded-2xl p-6"
                            style={{ 
                                backgroundColor: `${color}08`,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: `${color}20`
                            }}
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5" style={{ color }} />
                                Sobre este produto
                            </h3>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Product Info */}
                    <div className="space-y-4">
                        {/* Product Card */}
                        <div 
                            className="rounded-2xl p-6 sticky top-24"
                            style={{ 
                                backgroundColor: `${color}08`,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: `${color}20`
                            }}
                        >
                            {/* Category Badge */}
                            <div 
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4"
                                style={{ backgroundColor: `${color}20`, color }}
                            >
                                {categoryIcons[product.category]}
                                <span className="text-sm font-medium">{categoryLabels[product.category]}</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-bold text-white mb-4">{product.name}</h1>

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {product.tags.map((t, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                                            style={{ 
                                                backgroundColor: `${color}15`,
                                                color: color,
                                                borderWidth: '1px',
                                                borderStyle: 'solid',
                                                borderColor: `${color}30`
                                            }}
                                        >
                                            #{t.tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Price */}
                            <div className="border-t border-white/10 pt-4 mb-4">
                                {/* Discount Badge */}
                                {hasDiscount && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40">
                                            <Percent className="w-4 h-4 text-amber-400" />
                                            <span className="text-amber-400 text-sm font-bold">-10% MAGAZINE</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    {product.priceZions && (
                                        <div className="flex items-center gap-2">
                                            <Coins className="w-6 h-6" style={{ color }} />
                                            {hasDiscount ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl text-gray-500 line-through">
                                                        {product.priceZions} Z$
                                                    </span>
                                                    <span className="text-3xl font-bold text-amber-400">
                                                        {discountedZions} Z$
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-3xl font-bold" style={{ color }}>
                                                    {product.priceZions} Z$
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {product.priceZions && product.priceBRL && (
                                        <span className="text-gray-400 mx-2">ou</span>
                                    )}
                                    {product.priceBRL && (
                                        hasDiscount ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg text-gray-500 line-through">
                                                    R$ {product.priceBRL.toFixed(2)}
                                                </span>
                                                <span className="text-2xl font-bold text-amber-400">
                                                    R$ {discountedBRL}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-bold text-emerald-400">
                                                R$ {product.priceBRL.toFixed(2)}
                                            </span>
                                        )
                                    )}
                                </div>
                                
                                {/* User Balance */}
                                {user && product.priceZions && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Seu saldo: <span style={{ color }}>{user.zionsCash?.toFixed(2) || '0.00'} Z$</span>
                                    </p>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-4 h-4 text-gray-400" />
                                {product.isUnlimited ? (
                                    <span className="text-emerald-400 text-sm">Estoque ilimitado</span>
                                ) : isOutOfStock ? (
                                    <span className="text-red-400 text-sm">Esgotado</span>
                                ) : (
                                    <span className="text-gray-400 text-sm">{product.availableStock} disponíveis</span>
                                )}
                            </div>

                            {/* Buy Button */}
                            <button
                                onClick={() => setShowPurchaseModal(true)}
                                disabled={isOutOfStock}
                                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ 
                                    backgroundColor: isOutOfStock ? 'rgba(255,255,255,0.1)' : color,
                                    color: isOutOfStock ? 'rgba(255,255,255,0.5)' : '#000'
                                }}
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {isOutOfStock ? 'Indisponível' : 'Comprar Agora'}
                            </button>

                            {/* Product Details */}
                            <div className="border-t border-white/10 mt-6 pt-4 space-y-3">
                                {product.developer && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Desenvolvedor
                                        </span>
                                        <span className="text-white">{product.developer}</span>
                                    </div>
                                )}
                                
                                {product.releaseDate && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Lançamento
                                        </span>
                                        <span className="text-white">{product.releaseDate}</span>
                                    </div>
                                )}
                                
                                {product.sizeGB && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 flex items-center gap-2">
                                            <HardDrive className="w-4 h-4" /> Tamanho
                                        </span>
                                        <span className="text-white">{product.sizeGB} GB</span>
                                    </div>
                                )}
                                
                                {product.platform && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 flex items-center gap-2">
                                            <Monitor className="w-4 h-4" /> Plataforma
                                        </span>
                                        <span className="text-white">{product.platform}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
