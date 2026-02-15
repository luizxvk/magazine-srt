import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Image as ImageIcon, Send, X, Layers, Sparkles, ShoppingBag, ChevronDown, Check } from 'lucide-react';
import api from '../services/api';
import Loader from './Loader';

interface Product {
    id: string;
    name: string;
    imageUrl: string | null;
    priceZions: number | null;
    priceBRL: number | null;
    stock: number;
    isUnlimited: boolean;
}

interface AdminCreatePostProps {
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminCreatePost({ showToast }: AdminCreatePostProps) {
    const [caption, setCaption] = useState('');
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'TEXT'>('TEXT');
    const [mediaUrl, setMediaUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [isHighlight, setIsHighlight] = useState(true);
    
    // Product linking states
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const response = await api.get('/products');
            setProducts(response.data.filter((p: Product) => p.stock > 0 || p.isUnlimited));
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setShowProductDropdown(false);
        // Auto-fill image if not already set
        if (!mediaUrl && product.imageUrl) {
            setMediaUrl(product.imageUrl);
            setMediaType('IMAGE');
        }
    };

    const handleRemoveProduct = () => {
        setSelectedProduct(null);
    };

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!caption.trim() && !mediaUrl && !selectedProduct) return;

        setLoading(true);

        try {
            // If product is selected and no custom image, use product image
            const finalMediaUrl = mediaUrl || (selectedProduct?.imageUrl || '');
            const finalMediaType = finalMediaUrl ? 'IMAGE' : 'TEXT';

            await api.post('/posts', {
                caption,
                mediaType: finalMediaType,
                imageUrl: finalMediaType === 'IMAGE' ? finalMediaUrl : undefined,
                videoUrl: mediaType === 'VIDEO' ? mediaUrl : undefined,
                tags: ['OFFICIAL', 'ADMIN'],
                isHighlight: isHighlight,
                ...(selectedProduct?.id && { linkedProductId: selectedProduct.id })
            });

            setCaption('');
            setMediaUrl('');
            setMediaType('TEXT');
            setSelectedProduct(null);
            if (showToast) showToast('Postagem oficial criada com sucesso!', 'success');
        } catch (error: any) {
            console.error('Failed to create post', error);
            if (showToast) {
                showToast(`Erro ao criar post: ${error.response?.data?.error || error.message}`, 'error');
            } else {
                alert(`Erro ao criar post: ${error.response?.data?.error || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaUrl(reader.result as string);
                setMediaType('IMAGE'); // Simplified for now
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="admin-card relative overflow-hidden group">
            {/* Liquid Glass Effect Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-gold-500/20 transition-colors duration-700" />

            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2 relative z-10">
                <Sparkles className="w-5 h-5 text-gold-400" /> Criar Postagem Oficial
            </h2>

            <div className="space-y-4 relative z-10">
                {/* Selected Product Preview */}
                {selectedProduct && (
                    <div className="flex items-center gap-3 p-3 bg-gold-500/10 border border-gold-500/30 rounded-xl">
                        {selectedProduct.imageUrl && (
                            <img 
                                src={selectedProduct.imageUrl} 
                                alt={selectedProduct.name}
                                className="w-12 h-12 object-cover rounded-lg"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{selectedProduct.name}</p>
                            <p className="text-xs text-gold-400">
                                {selectedProduct.priceZions ? `${selectedProduct.priceZions} Z$` : ''}
                                {selectedProduct.priceZions && selectedProduct.priceBRL ? ' ou ' : ''}
                                {selectedProduct.priceBRL ? `R$ ${selectedProduct.priceBRL.toFixed(2)}` : ''}
                            </p>
                        </div>
                        <button
                            onClick={handleRemoveProduct}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Remover produto"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                )}

                <div className="relative">
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder={selectedProduct 
                            ? `Escreva sobre ${selectedProduct.name}...` 
                            : "O que a equipe Magazine tem a dizer?"
                        }
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-gold-500/50 outline-none resize-none transition-all"
                    />
                    {mediaUrl && (
                        <div className="mt-2 relative rounded-lg overflow-hidden border border-white/10 group/media">
                            <img src={mediaUrl} alt="Preview" className="w-full h-32 object-cover" />
                            <button
                                onClick={() => setMediaUrl('')}
                                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                                aria-label="Remover mídia"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-2">
                        {/* Media Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-white/5 hover:bg-white/10 text-gold-400 rounded-lg transition-colors border border-white/5"
                            title="Adicionar Mídia"
                            aria-label="Adicionar mídia"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        {/* Highlight Button */}
                        <button
                            onClick={() => setIsHighlight(!isHighlight)}
                            className={`p-2 rounded-lg transition-colors border flex items-center gap-2 ${isHighlight ? 'bg-gold-500/20 border-gold-500/30 text-gold-400' : 'bg-white/5 border-white/5 text-gray-400'}`}
                            title="Priorizar no Feed"
                            aria-label={isHighlight ? 'Remover destaque' : 'Adicionar destaque'}
                        >
                            <Layers className="w-5 h-5" />
                            <span className="text-xs font-medium hidden sm:inline">Destaque</span>
                        </button>

                        {/* Product Selector Button */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowProductDropdown(!showProductDropdown)}
                                className={`p-2 rounded-lg transition-colors border flex items-center gap-2 ${
                                    selectedProduct 
                                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-gold-400'
                                }`}
                                title="Vincular Produto"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                <span className="text-xs font-medium hidden sm:inline">
                                    {selectedProduct ? 'Produto' : 'Vincular'}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Product Dropdown */}
                            {showProductDropdown && (
                                <div className="absolute left-0 bottom-full mb-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
                                    {loadingProducts ? (
                                        <div className="p-4 flex justify-center">
                                            <Loader size="sm" />
                                        </div>
                                    ) : products.length === 0 ? (
                                        <div className="p-4 text-center text-gray-400">
                                            Nenhum produto disponível
                                        </div>
                                    ) : (
                                        <div className="p-2">
                                            <p className="text-xs text-gray-500 px-2 py-1 mb-1">Selecionar produto para destacar</p>
                                            {products.map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleSelectProduct(product)}
                                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                                        selectedProduct?.id === product.id 
                                                            ? 'bg-gold-500/20' 
                                                            : 'hover:bg-white/5'
                                                    }`}
                                                >
                                                    {product.imageUrl ? (
                                                        <img 
                                                            src={product.imageUrl} 
                                                            alt={product.name}
                                                            className="w-10 h-10 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-sm text-white truncate">{product.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {product.priceZions ? `${product.priceZions} Z$` : ''}
                                                            {product.priceZions && product.priceBRL ? ' • ' : ''}
                                                            {product.priceBRL ? `R$ ${product.priceBRL.toFixed(2)}` : ''}
                                                        </p>
                                                    </div>
                                                    {selectedProduct?.id === product.id && (
                                                        <Check className="w-4 h-4 text-gold-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading || (!caption.trim() && !mediaUrl && !selectedProduct)}
                        className="bg-gold-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Enviando...' : 'Publicar'}
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
