import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Search, Filter, Gamepad2, Gift, CreditCard, Package, Sparkles, ChevronDown, ArrowLeft, ShoppingBag, History, Key, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import LuxuriousBackground from '../components/LuxuriousBackground';

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
    createdAt: string;
}

interface Order {
    id: string;
    quantity: number;
    totalZions?: number;
    totalBRL?: number;
    paymentStatus: string;
    createdAt: string;
    product: {
        id: string;
        name: string;
        imageUrl?: string;
        category: string;
    };
    deliveredKeys: { key: string }[];
}

type Category = 'ALL' | 'GAME_KEY' | 'GIFT_CARD' | 'SUBSCRIPTION' | 'DIGITAL_ITEM' | 'SERVICE';
type SortBy = 'createdAt' | 'priceZions' | 'priceBRL' | 'name';
type Tab = 'store' | 'orders';

const categoryOptions = [
    { value: 'ALL', label: 'Todos', icon: <Package className="w-4 h-4" /> },
    { value: 'GAME_KEY', label: 'Keys de Jogos', icon: <Gamepad2 className="w-4 h-4" /> },
    { value: 'GIFT_CARD', label: 'Gift Cards', icon: <Gift className="w-4 h-4" /> },
    { value: 'SUBSCRIPTION', label: 'Assinaturas', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'DIGITAL_ITEM', label: 'Itens Digitais', icon: <Package className="w-4 h-4" /> },
    { value: 'SERVICE', label: 'Serviços', icon: <Sparkles className="w-4 h-4" /> }
];

export default function ProductStore() {
    const { user, theme } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<Category>('ALL');
    const [sortBy, setSortBy] = useState<SortBy>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('store');

    const isMGT = user?.membershipType === 'MGT';
    const gradientFrom = isMGT ? 'from-emerald-500' : 'from-yellow-500';
    const gradientTo = isMGT ? 'to-emerald-600' : 'to-yellow-600';
    const textAccent = isMGT ? 'text-emerald-400' : 'text-yellow-400';
    const borderAccent = isMGT ? 'border-emerald-500/30' : 'border-yellow-500/30';
    const bgAccent = isMGT ? 'bg-emerald-500/10' : 'bg-yellow-500/10';

    useEffect(() => {
        if (activeTab === 'store') {
            fetchProducts();
        } else {
            fetchOrders();
        }
    }, [category, sortBy, sortOrder, search, activeTab]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params: any = {
                sortBy,
                order: sortOrder
            };
            if (category !== 'ALL') params.category = category;
            if (search) params.search = search;

            const response = await api.get('/products', { params });
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/products/orders/my');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
            <LuxuriousBackground />
            <Header />
            
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 pb-24">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/"
                            className={`p-2 rounded-xl ${bgAccent} ${textAccent} hover:opacity-80 transition-opacity`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className={`text-3xl font-bold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent flex items-center gap-3`}>
                                <Store className="w-8 h-8" />
                                Loja de Produtos
                            </h1>
                            <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                                Compre keys, gift cards e muito mais com Zions ou dinheiro real
                            </p>
                        </div>
                    </div>

                    {/* Zions Balance */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${bgAccent} border ${borderAccent}`}>
                        <span className="text-2xl">💎</span>
                        <div>
                            <p className="text-xs text-gray-400">Seu saldo</p>
                            <p className={`font-bold ${textAccent}`}>{user?.zions?.toLocaleString() || 0} Zions</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-2 p-1 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} mb-6 w-fit`}>
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium
                            ${activeTab === 'store' 
                                ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white` 
                                : `${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`
                            }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Loja
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium
                            ${activeTab === 'orders' 
                                ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white` 
                                : `${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Minhas Compras
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'store' ? (
                        <motion.div
                            key="store"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {/* Search & Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                {/* Search */}
                                <div className="relative flex-1">
                                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar produtos..."
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${borderAccent} ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-white/5 text-white'} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-yellow-500'}`}
                                    />
                                </div>

                                {/* Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${borderAccent} ${bgAccent} ${textAccent} transition-all`}
                                >
                                    <Filter className="w-5 h-5" />
                                    <span>Filtros</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Filters Panel */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-6"
                                    >
                                        <div className={`p-4 rounded-xl border ${borderAccent} ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}>
                                            {/* Categories */}
                                            <div className="mb-4">
                                                <p className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Categoria</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {categoryOptions.map(cat => (
                                                        <button
                                                            key={cat.value}
                                                            onClick={() => setCategory(cat.value as Category)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
                                                                ${category === cat.value 
                                                                    ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white` 
                                                                    : `${bgAccent} ${textAccent} hover:opacity-80`
                                                                }`}
                                                        >
                                                            {cat.icon}
                                                            {cat.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sort */}
                                            <div className="flex flex-wrap gap-4">
                                                <div>
                                                    <p className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Ordenar por</p>
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                                        className={`px-3 py-2 rounded-lg border ${borderAccent} ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-white/10 text-white'}`}
                                                    >
                                                        <option value="createdAt">Data</option>
                                                        <option value="priceZions">Preço (Zions)</option>
                                                        <option value="priceBRL">Preço (R$)</option>
                                                        <option value="name">Nome</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Ordem</p>
                                                    <select
                                                        value={sortOrder}
                                                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                                        className={`px-3 py-2 rounded-lg border ${borderAccent} ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-white/10 text-white'}`}
                                                    >
                                                        <option value="desc">Decrescente</option>
                                                        <option value="asc">Crescente</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Products Grid */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className={`w-8 h-8 animate-spin ${textAccent}`} />
                                </div>
                            ) : products.length === 0 ? (
                                <div className={`text-center py-20 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">Nenhum produto encontrado</p>
                                    <p className="text-sm mt-1">Tente mudar os filtros ou volte mais tarde</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map(product => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product}
                                            onPurchase={() => fetchProducts()}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Orders List */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className={`w-8 h-8 animate-spin ${textAccent}`} />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className={`text-center py-20 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">Nenhuma compra realizada</p>
                                    <p className="text-sm mt-1">Suas compras aparecerão aqui</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-xl border ${borderAccent} ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Product Image */}
                                                <div className={`w-16 h-16 rounded-lg ${bgAccent} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                                                    {order.product.imageUrl ? (
                                                        <img src={order.product.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className={`w-8 h-8 ${textAccent} opacity-50`} />
                                                    )}
                                                </div>

                                                {/* Order Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                        {order.product.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                    
                                                    {/* Price */}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {order.totalZions && (
                                                            <span className={`text-sm ${textAccent}`}>
                                                                💎 {order.totalZions.toLocaleString()} Zions
                                                            </span>
                                                        )}
                                                        {order.totalBRL && (
                                                            <span className="text-sm text-green-400">
                                                                R$ {order.totalBRL.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status */}
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    order.paymentStatus === 'COMPLETED' 
                                                        ? 'bg-green-500/20 text-green-400' 
                                                        : order.paymentStatus === 'PENDING'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {order.paymentStatus === 'COMPLETED' ? 'Concluído' : 
                                                     order.paymentStatus === 'PENDING' ? 'Pendente' : 'Falhou'}
                                                </div>
                                            </div>

                                            {/* Keys */}
                                            {order.deliveredKeys && order.deliveredKeys.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-white/10">
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                                                        <Key className="w-3 h-3" />
                                                        Sua(s) key(s):
                                                    </p>
                                                    <div className="space-y-2">
                                                        {order.deliveredKeys.map((k, i) => (
                                                            <div 
                                                                key={i}
                                                                className="bg-black/30 px-3 py-2 rounded-lg font-mono text-sm text-green-300 break-all select-all"
                                                            >
                                                                {k.key}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            
            <Footer />
        </div>
    );
}
