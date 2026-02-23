/**
 * AdminConsumptionTracker
 * 
 * Painel de rastreamento de consumo/compras com Zions.
 * Estilo Apple Vision Pro com glassmorphism.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, 
    TrendingDown, 
    TrendingUp, 
    Search, 
    User, 
    Package,
    Palette,
    Gift,
    Store,
    Calendar,
    Filter,
    ChevronDown,
    Sparkles,
    X,
    Coins,
    Banknote
} from 'lucide-react';
import Loader from '../../components/Loader';

// Tipo de moeda
type CurrencyFilter = 'ALL' | 'POINTS' | 'CASH';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Tipos de transação
type TransactionType = 'SHOP_PURCHASE' | 'MARKET_PURCHASE' | 'MARKET_SALE' | 'SUPPLY_BOX' | 'STORE_PURCHASE' | 'DAILY_LOGIN' | 'BADGE_REWARD' | 'OTHER';

interface Transaction {
    id: string;
    type: TransactionType;
    amount: number; // positivo = ganho, negativo = gasto
    description: string;
    itemName?: string;
    itemType?: string;
    currency: 'POINTS' | 'CASH'; // Tipo de moeda
    createdAt: string;
    user: {
        id: string;
        name: string;
        displayName?: string;
        email: string;
        avatarUrl?: string;
        membershipType: string;
    };
}

interface Stats {
    // Cash (moeda real)
    cashSpent: number;
    cashEarned: number;
    cashTransactions: number;
    // Points (moeda virtual)
    pointsSpent: number;
    pointsEarned: number;
    pointsTransactions: number;
    // Gerais
    totalTransactions: number;
    shopPurchases: number;
    marketTransactions: number;
    storePurchases: number;
    supplyBoxOpens: number;
}

const transactionTypeConfig: Record<TransactionType, { 
    label: string; 
    icon: typeof ShoppingBag; 
    color: string; 
    bgColor: string;
}> = {
    SHOP_PURCHASE: { label: 'Loja de Customização', icon: Palette, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    MARKET_PURCHASE: { label: 'Compra no Mercado', icon: ShoppingBag, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    MARKET_SALE: { label: 'Venda no Mercado', icon: Store, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    SUPPLY_BOX: { label: 'Supply Box', icon: Gift, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    STORE_PURCHASE: { label: 'Loja de Produtos', icon: Package, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    DAILY_LOGIN: { label: 'Bônus Diário', icon: Calendar, color: 'text-tier-std-400', bgColor: 'bg-tier-std-500/20' },
    BADGE_REWARD: { label: 'Conquista', icon: Sparkles, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    OTHER: { label: 'Outro', icon: TrendingDown, color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

interface AdminConsumptionTrackerProps {
    onClose: () => void;
}

export default function AdminConsumptionTracker({ onClose }: AdminConsumptionTrackerProps) {
    const { theme, user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
    const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
    
    const isDarkMode = theme === 'dark';
    const isMGT = user?.membershipType === 'MGT';
    
    // Cores do tema
    const accentColor = isMGT ? 'emerald' : 'amber';
    const accentHex = isMGT ? '#10b981' : '#d4af37';

    useEffect(() => {
        fetchTransactions();
    }, [dateRange, currencyFilter]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (dateRange !== 'all') params.period = dateRange;
            if (currencyFilter !== 'ALL') params.currency = currencyFilter;
            
            const response = await api.get('/admin/consumption-tracker', { params });
            setTransactions(response.data.transactions || []);
            setStats(response.data.stats || null);
        } catch (error) {
            console.error('Error fetching consumption data:', error);
            // Fallback: buscar dados do ZionHistory
            try {
                const historyRes = await api.get('/admin/zion-history', { params: { limit: 200 } });
                const history = historyRes.data || [];
                
                // Transformar ZionHistory em formato de Transaction
                const mappedTransactions: Transaction[] = history.map((h: any) => ({
                    id: h.id,
                    type: categorizeReason(h.reason),
                    amount: h.amount,
                    description: h.reason,
                    currency: h.currency || 'POINTS',
                    createdAt: h.createdAt,
                    user: h.user || { id: h.userId, name: 'Usuário', email: '', membershipType: 'MAGAZINE' }
                }));
                
                setTransactions(mappedTransactions);
                
                // Calcular stats separando por moeda
                const cashTx = mappedTransactions.filter(t => t.currency === 'CASH');
                const pointsTx = mappedTransactions.filter(t => t.currency === 'POINTS');
                
                const cashSpent = cashTx.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const cashEarned = cashTx.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
                const pointsSpent = pointsTx.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const pointsEarned = pointsTx.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
                
                setStats({
                    cashSpent,
                    cashEarned,
                    cashTransactions: cashTx.length,
                    pointsSpent,
                    pointsEarned,
                    pointsTransactions: pointsTx.length,
                    totalTransactions: mappedTransactions.length,
                    shopPurchases: mappedTransactions.filter(t => t.type === 'SHOP_PURCHASE').length,
                    marketTransactions: mappedTransactions.filter(t => t.type === 'MARKET_PURCHASE' || t.type === 'MARKET_SALE').length,
                    storePurchases: mappedTransactions.filter(t => t.type === 'STORE_PURCHASE').length,
                    supplyBoxOpens: mappedTransactions.filter(t => t.type === 'SUPPLY_BOX').length,
                });
            } catch {
                setTransactions([]);
                setStats(null);
            }
        } finally {
            setLoading(false);
        }
    };

    // Categorizar reason do ZionHistory
    const categorizeReason = (reason: string): TransactionType => {
        const lowerReason = reason.toLowerCase();
        if (lowerReason.includes('supply box') || lowerReason.includes('caixa')) return 'SUPPLY_BOX';
        if (lowerReason.includes('compra') && lowerReason.includes('loja')) return 'SHOP_PURCHASE';
        if (lowerReason.includes('mercado') && lowerReason.includes('compra')) return 'MARKET_PURCHASE';
        if (lowerReason.includes('mercado') && lowerReason.includes('venda')) return 'MARKET_SALE';
        if (lowerReason.includes('produto') || lowerReason.includes('key')) return 'STORE_PURCHASE';
        if (lowerReason.includes('daily') || lowerReason.includes('diário') || lowerReason.includes('login')) return 'DAILY_LOGIN';
        if (lowerReason.includes('badge') || lowerReason.includes('conquista') || lowerReason.includes('level')) return 'BADGE_REWARD';
        return 'OTHER';
    };

    // Filtrar transações
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Filtro de busca
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesSearch = (
                    t.user.name.toLowerCase().includes(searchLower) ||
                    t.user.email.toLowerCase().includes(searchLower) ||
                    t.description.toLowerCase().includes(searchLower) ||
                    (t.itemName?.toLowerCase().includes(searchLower) ?? false)
                );
                if (!matchesSearch) return false;
            }
            
            // Filtro de tipo
            if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
            
            return true;
        });
    }, [transactions, search, typeFilter]);

    // Agrupar por data
    const groupedByDate = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};
        
        filteredTransactions.forEach(t => {
            const date = new Date(t.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(t);
        });
        
        return groups;
    }, [filteredTransactions]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 sm:p-6 space-y-6 max-h-[85vh] overflow-y-auto"
        >
            {/* Header - Apple Vision Pro style */}
            <div className="relative">
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${
                    isMGT 
                        ? 'from-tier-std-500/10 via-transparent to-cyan-500/10' 
                        : 'from-amber-500/10 via-transparent to-orange-500/10'
                } blur-xl`} />
                
                <div className={`relative p-6 rounded-3xl border ${
                    isDarkMode 
                        ? 'bg-white/5 border-white/10 backdrop-blur-xl' 
                        : 'bg-white/80 border-gray-200/50 backdrop-blur-xl'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${
                                isMGT 
                                    ? 'from-tier-std-500/20 to-cyan-500/20' 
                                    : 'from-amber-500/20 to-orange-500/20'
                            }`}>
                                <ShoppingBag className={`w-8 h-8 ${isMGT ? 'text-tier-std-400' : 'text-amber-400'}`} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Rastreio de Consumo
                                </h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {currencyFilter === 'CASH' 
                                        ? 'Transações de Zions Cash (moeda real)'
                                        : currencyFilter === 'POINTS'
                                            ? 'Transações de Zions Points (customizações)'
                                            : 'Todas as transações de Zions da comunidade'
                                    }
                                </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl border transition-all hover:scale-105 ${
                                isDarkMode 
                                    ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5' 
                                    : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Glassmorphism */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cash Gasto */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    isDarkMode 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : 'bg-red-50 border-red-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Banknote className="w-4 h-4 text-red-400" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                            Cash Gasto
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {loading ? '...' : `Z$ ${(stats?.cashSpent || 0).toLocaleString('pt-BR')}`}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {stats?.cashTransactions || 0} transações
                    </p>
                </div>
                
                {/* Cash Ganho */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    isDarkMode 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-green-50 border-green-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Banknote className="w-4 h-4 text-green-400" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                            Cash Ganho
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {loading ? '...' : `Z$ ${(stats?.cashEarned || 0).toLocaleString('pt-BR')}`}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Recargas e vendas
                    </p>
                </div>
                
                {/* Points Gasto */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    isDarkMode 
                        ? 'bg-purple-500/10 border-purple-500/20' 
                        : 'bg-purple-50 border-purple-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-purple-400" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                            Points Gasto
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {loading ? '...' : `ZP ${(stats?.pointsSpent || 0).toLocaleString('pt-BR')}`}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Customizações e mercado
                    </p>
                </div>
                
                {/* Points Ganho */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    isDarkMode 
                        ? 'bg-amber-500/10 border-amber-500/20' 
                        : 'bg-amber-50 border-amber-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                            Points Ganho
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        {loading ? '...' : `ZP ${(stats?.pointsEarned || 0).toLocaleString('pt-BR')}`}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Daily, badges, vendas
                    </p>
                </div>
            </div>
            
            {/* Stats secundárias */}
            <div className="grid grid-cols-3 gap-4">
                {/* Transações */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    isDarkMode 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white border-gray-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" style={{ color: accentHex }} />
                        <span className="text-xs font-medium" style={{ color: accentHex }}>
                            Transações
                        </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: accentHex }}>
                        {loading ? '...' : (stats?.totalTransactions || 0).toLocaleString('pt-BR')}
                    </p>
                </div>
                
                {/* Supply Boxes */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    isDarkMode 
                        ? 'bg-amber-500/10 border-amber-500/20' 
                        : 'bg-amber-50 border-amber-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-amber-400" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                            Supply Boxes
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        {loading ? '...' : (stats?.supplyBoxOpens || 0).toLocaleString('pt-BR')}
                    </p>
                </div>
                
                {/* Mercado P2P */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    isDarkMode 
                        ? 'bg-blue-500/10 border-blue-500/20' 
                        : 'bg-blue-50 border-blue-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Store className="w-4 h-4 text-blue-400" />
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                            Mercado P2P
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {loading ? '...' : (stats?.marketTransactions || 0).toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className={`p-4 rounded-2xl border backdrop-blur-xl ${
                isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/80 border-gray-200'
            }`}>
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Busca */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por usuário, item ou descrição..."
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                                isDarkMode 
                                    ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20' 
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-${accentColor}-500/20`}
                        />
                    </div>
                    
                    {/* Filtro de Moeda (Cash / Points) */}
                    <div className={`flex rounded-xl border overflow-hidden ${
                        isDarkMode ? 'border-white/10' : 'border-gray-200'
                    }`}>
                        <button
                            onClick={() => setCurrencyFilter('ALL')}
                            className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                                currencyFilter === 'ALL'
                                    ? 'text-white'
                                    : isDarkMode 
                                        ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            style={currencyFilter === 'ALL' ? { backgroundColor: accentHex } : undefined}
                        >
                            Tudo
                        </button>
                        <button
                            onClick={() => setCurrencyFilter('CASH')}
                            className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                                currencyFilter === 'CASH'
                                    ? 'bg-green-500 text-white'
                                    : isDarkMode 
                                        ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Banknote className="w-4 h-4" />
                            <span className="hidden sm:inline">Cash</span>
                        </button>
                        <button
                            onClick={() => setCurrencyFilter('POINTS')}
                            className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                                currencyFilter === 'POINTS'
                                    ? 'bg-purple-500 text-white'
                                    : isDarkMode 
                                        ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <Coins className="w-4 h-4" />
                            <span className="hidden sm:inline">Points</span>
                        </button>
                    </div>
                    
                    {/* Período */}
                    <div className="flex gap-2">
                        {(['today', 'week', 'month', 'all'] as const).map(period => (
                            <button
                                key={period}
                                onClick={() => setDateRange(period)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    dateRange === period
                                        ? `text-white`
                                        : isDarkMode 
                                            ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                style={dateRange === period ? { backgroundColor: accentHex } : undefined}
                            >
                                {period === 'today' && 'Hoje'}
                                {period === 'week' && 'Semana'}
                                {period === 'month' && 'Mês'}
                                {period === 'all' && 'Tudo'}
                            </button>
                        ))}
                    </div>
                    
                    {/* Filtro de tipo */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                            showFilters 
                                ? 'border-current' 
                                : isDarkMode 
                                    ? 'border-white/10 hover:border-white/20' 
                                    : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={showFilters ? { borderColor: accentHex, color: accentHex } : undefined}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                
                {/* Filtros expandidos */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setTypeFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        typeFilter === 'ALL'
                                            ? 'text-white'
                                            : isDarkMode 
                                                ? 'text-gray-400 bg-white/5 hover:bg-white/10' 
                                                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                    }`}
                                    style={typeFilter === 'ALL' ? { backgroundColor: accentHex } : undefined}
                                >
                                    Todos
                                </button>
                                {Object.entries(transactionTypeConfig).map(([type, config]) => {
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setTypeFilter(type as TransactionType)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                typeFilter === type
                                                    ? `${config.bgColor} ${config.color}`
                                                    : isDarkMode 
                                                        ? 'text-gray-400 bg-white/5 hover:bg-white/10' 
                                                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {config.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Lista de Transações */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader size="lg" />
                    <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Carregando transações...
                    </p>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${
                    isDarkMode 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white/80 border-gray-200'
                }`}>
                    <div className={`p-4 rounded-full mb-4 ${
                        isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                    }`}>
                        <ShoppingBag className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>
                    <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nenhuma transação encontrada
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Ajuste os filtros ou aguarde novas transações
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
                        <div key={date}>
                            {/* Data */}
                            <div className="flex items-center gap-3 mb-3">
                                <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {date}
                                </span>
                                <div className={`flex-1 h-px ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                            </div>
                            
                            {/* Transações do dia */}
                            <div className="space-y-2">
                                {dayTransactions.map((transaction, index) => {
                                    const config = transactionTypeConfig[transaction.type] || transactionTypeConfig.OTHER;
                                    const Icon = config.icon;
                                    const isNegative = transaction.amount < 0;
                                    
                                    return (
                                        <motion.div
                                            key={transaction.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={`p-4 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.01] ${
                                                isDarkMode 
                                                    ? 'bg-white/5 border-white/10 hover:bg-white/[0.07]' 
                                                    : 'bg-white border-gray-200 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Ícone do tipo */}
                                                <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
                                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                                </div>
                                                
                                                {/* Info do usuário */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${
                                                        isDarkMode ? 'bg-white/10' : 'bg-gray-100'
                                                    }`}>
                                                        {transaction.user.avatarUrl ? (
                                                            <img 
                                                                src={transaction.user.avatarUrl} 
                                                                alt="" 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <User className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {transaction.user.displayName || transaction.user.name}
                                                        </p>
                                                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {transaction.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Valor */}
                                                <div className="text-right flex-shrink-0">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {transaction.currency === 'CASH' ? (
                                                            <Banknote className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <Coins className="w-4 h-4 text-purple-400" />
                                                        )}
                                                        <p className={`font-bold text-lg ${
                                                            isNegative ? 'text-red-400' : 'text-green-400'
                                                        }`}>
                                                            {isNegative ? '-' : '+'}
                                                            {transaction.currency === 'CASH' ? 'Z$' : 'ZP'} 
                                                            {Math.abs(transaction.amount).toLocaleString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {new Date(transaction.createdAt).toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        {' · '}
                                                        <span className={transaction.currency === 'CASH' ? 'text-green-500' : 'text-purple-400'}>
                                                            {transaction.currency === 'CASH' ? 'Cash' : 'Points'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
