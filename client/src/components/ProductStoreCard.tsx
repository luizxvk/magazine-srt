import { useState, useEffect } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import Loader from './Loader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import api from '../services/api';

interface Product {
    id: string;
    name: string;
    imageUrl?: string;
    priceZions?: number;
    availableStock: number;
    isUnlimited: boolean;
}

export default function ProductStoreCard() {
    const navigate = useNavigate();
    useAuth(); // Required for user context
    const { getUserAccent } = useTierColors();
    const [products, setProducts] = useState<Product[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const color = getUserAccent();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products?limit=5');
            setProducts(response.data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextProduct = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (products.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }
    };

    const prevProduct = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (products.length > 0) {
            setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
        }
    };

    const currentProduct = products[currentIndex];

    return (
        <div 
            className="glass-panel rounded-xl overflow-hidden border transition-all duration-300 group cursor-pointer relative"
            style={{ borderColor: `${color}33` }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = `${color}80`}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = `${color}33`}
            onClick={() => navigate('/store')}
        >
            {/* Header */}
            <div className="p-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" style={{ color }} />
                    <h3 className="text-sm font-bold text-white">Loja</h3>
                </div>
                <span className="text-xs text-gray-500">{products.length} produtos</span>
            </div>

            {/* Product Carousel */}
            <div className="relative px-4 pb-3">
                {loading ? (
                    <div className="h-28 flex items-center justify-center">
                        <Loader size="sm" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-gray-500 text-sm">
                        Nenhum produto disponível
                    </div>
                ) : (
                    <>
                        {/* Product Display */}
                        <div className="flex gap-3 items-center">
                            {/* Image */}
                            <div 
                                className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                                style={{ backgroundColor: `${color}15` }}
                            >
                                {currentProduct?.imageUrl ? (
                                    <img 
                                        src={currentProduct.imageUrl} 
                                        alt={currentProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 opacity-30" style={{ color }} />
                                    </div>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">
                                    {currentProduct?.name}
                                </p>
                                {currentProduct?.priceZions && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Coins className="w-3.5 h-3.5" style={{ color }} />
                                        <span className="text-sm font-bold" style={{ color }}>
                                            {currentProduct.priceZions.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {currentProduct?.isUnlimited ? 'Ilimitado' : `${currentProduct?.availableStock} disponíveis`}
                                </p>
                            </div>
                        </div>

                        {/* Navigation Dots & Arrows */}
                        {products.length > 1 && (
                            <div className="flex items-center justify-between mt-3">
                                <button 
                                    onClick={prevProduct}
                                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                                </button>
                                
                                <div className="flex gap-1">
                                    {products.map((_, idx) => (
                                        <div 
                                            key={idx}
                                            className="w-1.5 h-1.5 rounded-full transition-all"
                                            style={{ 
                                                backgroundColor: idx === currentIndex ? color : 'rgba(255,255,255,0.2)'
                                            }}
                                        />
                                    ))}
                                </div>

                                <button 
                                    onClick={nextProduct}
                                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
                <button
                    onClick={(e) => { e.stopPropagation(); navigate('/store'); }}
                    className="w-full py-2 rounded-lg text-white text-xs font-medium transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                >
                    Ver Todos os Produtos
                </button>
            </div>
        </div>
    );
}
