import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Search, Tag, ShoppingCart,
  X, Zap, History, Package,
  Image, Award, Palette, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Listing {
  id: string;
  sellerId: string;
  itemId: string;
  itemType: string;
  itemName: string;
  itemPreview: string;
  price: number;
  status: string;
  createdAt: string;
  isOwnListing: boolean;
  seller: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string;
  };
}

interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  itemPreview: string;
  itemType: string;
  price: number;
  type: 'purchase' | 'sale';
  createdAt: string;
  buyer: { name: string; displayName: string; avatarUrl: string };
  seller: { name: string; displayName: string; avatarUrl: string };
}

interface MarketStats {
  activeListings: number;
  totalSold: number;
  totalVolume: number;
  recentSales: any[];
}

type TabType = 'browse' | 'sell' | 'my-listings' | 'history';
type FilterType = 'all' | 'background' | 'badge' | 'color';
type SortType = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export default function MarketPage() {
  const { user, theme, updateUser } = useAuth();
  const location = useLocation();
  const isMGT = user?.membershipType === 'MGT';

  const [activeTab, setActiveTab] = useState<TabType>('browse');

  // Set active tab from navigation state
  useEffect(() => {
    const state = location.state as { activeTab?: TabType };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const [userPacks, setUserPacks] = useState<any[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Sell modal
  const [showSellModal, setShowSellModal] = useState(false);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [creating, setCreating] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isDarkMode = theme === 'dark';
  const themeColor = isMGT ? 'emerald' : 'gold';
  const themeText = isDarkMode ? 'text-white' : 'text-gray-900';
  const themeSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const themeBorder = isDarkMode ? 'border-white/10' : 'border-gray-200';
  const themeCard = isDarkMode ? 'bg-white/5' : 'bg-white';

  useEffect(() => {
    fetchData();
  }, [activeTab, filterType, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        const [listingsRes, statsRes] = await Promise.all([
          api.get(`/market/listings?type=${filterType}&sortBy=${sortBy}`),
          api.get('/market/stats'),
        ]);
        setListings(listingsRes.data);
        setStats(statsRes.data);
      } else if (activeTab === 'my-listings') {
        const res = await api.get('/market/my-listings');
        setMyListings(res.data);
      } else if (activeTab === 'history') {
        const res = await api.get('/market/transactions');
        setTransactions(res.data);
      } else if (activeTab === 'sell') {
        const [itemsRes, packsRes] = await Promise.all([
          api.get('/users/customizations'),
          api.get('/theme-packs/my-packs')
        ]);
        setOwnedItems(itemsRes.data.owned || []);
        setUserPacks(packsRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (listing: Listing) => {
    if (!user || buyingId) return;

    if ((user?.zionsPoints || 0) < listing.price) {
      showNotification('error', 'Points insuficientes!');
      return;
    }

    setBuyingId(listing.id);
    try {
      const res = await api.post(`/market/buy/${listing.id}`);
      showNotification('success', res.data.message);
      showNotification('success', res.data.message);
      // Removed updateUserZions, use logic to refresh user if needed or assume backend/context handles it
      // updateUserZions(res.data.newBalance); // Deprecated
      api.get('/users/me').then(res => updateUser(res.data)); // Refresh user data to get new points
      fetchData();
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro ao comprar');
    } finally {
      setBuyingId(null);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedItem || !sellPrice || creating) return;

    const price = parseInt(sellPrice);
    if (isNaN(price) || price < 10 || price > 10000) {
      showNotification('error', 'Preço deve ser entre 10 e 10.000 Zions');
      return;
    }

    setCreating(true);
    try {
      await api.post('/market/listings', { itemId: selectedItem, price });
      showNotification('success', 'Item colocado à venda!');
      setShowSellModal(false);
      setSelectedItem(null);
      setSellPrice('');
      setActiveTab('my-listings');
      fetchData();
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro ao criar anúncio');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    try {
      await api.delete(`/market/listings/${listingId}`);
      showNotification('success', 'Anúncio cancelado');
      fetchData();
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro ao cancelar');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredListings = listings.filter(l =>
    l.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'background': return <Image className="w-4 h-4" />;
      case 'badge': return <Award className="w-4 h-4" />;
      case 'color': return <Palette className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const renderItemPreview = (item: { itemType: string; itemPreview: string; itemName?: string }, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-12 h-12',
      md: 'w-16 h-16',
      lg: 'w-24 h-24',
    };

    if (item.itemType === 'background') {
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg shadow-sm`}
          style={{ background: item.itemPreview, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      );
    } else if (item.itemType === 'theme_pack') {
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg shadow-sm relative overflow-hidden`}
        >
          {/* Background base */}
          <div className="absolute inset-0" style={{ background: item.itemPreview.split('|')[0] || item.itemPreview }} />

          {/* Accent overlay or badge */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Package className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'} text-white drop-shadow-md`} />
          </div>
        </div>
      );
    } else if (item.itemType === 'badge') {
      return (
        <div className={`${sizeClasses[size]} rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center text-2xl`}>
          {item.itemPreview}
        </div>
      );
    } else if (item.itemType === 'color') {
      return (
        <div
          className={`${sizeClasses[size]} rounded-lg border-4 ${themeBorder}`}
          style={{
            background: item.itemPreview === 'rgb-dynamic'
              ? 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff)'
              : item.itemPreview
          }}
        />
      );
    }
    return null;
  };

  const tabs = [
    { id: 'browse' as const, label: 'Explorar', icon: Store },
    { id: 'sell' as const, label: 'Vender', icon: Tag },
    { id: 'my-listings' as const, label: 'Meus Anúncios', icon: Package },
    { id: 'history' as const, label: 'Histórico', icon: History },
  ];

  // Item data for sell modal
  const ITEM_DATA: Record<string, { name: string; type: string; preview: string }> = {
    bg_aurora: { name: 'Aurora Boreal', type: 'background', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' },
    bg_galaxy: { name: 'Galáxia', type: 'background', preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 30%, #2d1b4e 50%, #1a0a2e 70%, #0c0c0c 100%)' },
    bg_matrix: { name: 'Matrix', type: 'background', preview: 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 50%, #0a0f0a 100%)' },
    bg_fire: { name: 'Fogo', type: 'background', preview: 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 30%, #4a2a0a 50%, #2d1a0a 70%, #1a0a0a 100%)' },
    bg_ocean: { name: 'Oceano', type: 'background', preview: 'linear-gradient(180deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)' },
    bg_forest: { name: 'Floresta', type: 'background', preview: 'linear-gradient(180deg, #0a1a0a 0%, #0f2a0f 50%, #0a1a0a 100%)' },
    bg_city: { name: 'Cidade Neon', type: 'background', preview: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 50%, #1a1a2e 100%)' },
    bg_space: { name: 'Espaço Profundo', type: 'background', preview: 'linear-gradient(135deg, #000005 0%, #0a0a1a 50%, #000005 100%)' },
    bg_sunset: { name: 'Pôr do Sol', type: 'background', preview: 'linear-gradient(135deg, #1a0505 0%, #2a0a0a 25%, #3a1515 50%, #2a0a0a 75%, #1a0505 100%)' },
    bg_cyberpunk: { name: 'Cyberpunk', type: 'background', preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)' },
    bg_lava: { name: 'Lava', type: 'background', preview: 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)' },
    bg_ice: { name: 'Gelo Ártico', type: 'background', preview: 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)' },
    bg_neon_grid: { name: 'Grade Neon', type: 'background', preview: 'linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 25%, #2a0d2a 50%, #1a0d1a 75%, #0d0d0d 100%)' },
    bg_emerald: { name: 'Esmeralda', type: 'background', preview: 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)' },
    bg_royal: { name: 'Real Púrpura', type: 'background', preview: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)' },
    bg_carbon: { name: 'Fibra de Carbono', type: 'background', preview: 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)' },
    badge_skull: { name: 'Caveira', type: 'badge', preview: '💀' },
    badge_fire: { name: 'Fogo', type: 'badge', preview: '🔥' },
    badge_star: { name: 'Estrela', type: 'badge', preview: '⭐' },
    badge_diamond: { name: 'Diamante', type: 'badge', preview: '💎' },
    badge_lightning: { name: 'Raio', type: 'badge', preview: '⚡' },
    badge_pony: { name: 'Unicórnio', type: 'badge', preview: '🦄' },
    badge_heart: { name: 'Coração', type: 'badge', preview: '❤️' },
    badge_moon: { name: 'Lua', type: 'badge', preview: '🌙' },
    badge_sun: { name: 'Sol', type: 'badge', preview: '☀️' },
    color_rgb: { name: 'RGB Dinâmico', type: 'color', preview: 'rgb-dynamic' },
    color_cyan: { name: 'Ciano Neon', type: 'color', preview: '#00ffff' },
    color_magenta: { name: 'Magenta Neon', type: 'color', preview: '#ff00ff' },
    color_lime: { name: 'Verde Limão', type: 'color', preview: '#00ff00' },
    color_orange: { name: 'Laranja Neon', type: 'color', preview: '#ff6600' },
    color_purple: { name: 'Roxo Neon', type: 'color', preview: '#9933ff' },
    color_pink: { name: 'Rosa Neon', type: 'color', preview: '#ff69b4' },
    color_blue: { name: 'Azul Elétrico', type: 'color', preview: '#0066ff' },
    color_red: { name: 'Vermelho Neon', type: 'color', preview: '#ff0033' },
    color_pastel_pink: { name: 'Rosa Pastel', type: 'color', preview: '#ffb6c1' },
    color_pastel_lavender: { name: 'Lavanda Pastel', type: 'color', preview: '#e6e6fa' },
    color_pastel_mint: { name: 'Menta Pastel', type: 'color', preview: '#98fb98' },
    color_pastel_peach: { name: 'Pêssego Pastel', type: 'color', preview: '#ffdab9' },
    color_pastel_sky: { name: 'Céu Pastel', type: 'color', preview: '#87ceeb' },
    color_pastel_coral: { name: 'Coral Pastel', type: 'color', preview: '#ffb5a7' },
    color_pastel_lilac: { name: 'Lilás Pastel', type: 'color', preview: '#dda0dd' },
    color_pastel_sage: { name: 'Sálvia Pastel', type: 'color', preview: '#9dc183' },
    color_pastel_butter: { name: 'Manteiga Pastel', type: 'color', preview: '#fffacd' },
    color_pastel_periwinkle: { name: 'Pervinca Pastel', type: 'color', preview: '#ccccff' },
  };

  const DEFAULT_ITEMS = ['bg_default', 'badge_crown', 'color_gold'];

  const standardSellableItems = ownedItems
    .filter(id => !DEFAULT_ITEMS.includes(id) && ITEM_DATA[id])
    .map(id => ({ id, ...ITEM_DATA[id] }));

  // Map theme packs to sellable item format
  // Using pack.id as the ID for the listing. 
  // IMPORTANT: Backend must distinguish between standard item IDs (strings in JSON) and theme pack IDs (UUIDs)
  const themePackItems = userPacks.map(up => ({
    id: up.pack.id,
    name: up.pack.name,
    type: 'theme_pack',
    preview: up.pack.backgroundUrl
  }));

  const sellableItems = [...standardSellableItems, ...themePackItems];

  return (
    <div className={`min-h-screen font-sans selection:${isMGT ? 'bg-emerald-500/30' : 'bg-gold-500/30'} relative`}>
      <LuxuriousBackground />
      <Header />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-24 sm:pt-32 pb-8 relative z-10">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Store className={`w-6 sm:w-8 h-6 sm:h-8 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-400'} leading-none`}>
                  Mercado
                </h1>
                <span className={`flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isMGT ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-gold-500/20 text-gold-400 border border-gold-500/40'} animate-pulse translate-y-1`}>
                  BETA
                </span>
              </div>
              <p className={`${themeSecondary} text-xs sm:text-sm mt-1`}>Compre e venda itens</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} border ${themeBorder}`}>
            <Zap className={`w-4 sm:w-5 h-4 sm:h-5 text-${themeColor}-400`} />
            <span className={`font-bold text-${themeColor}-400 text-sm sm:text-base`}>{user?.zionsPoints?.toLocaleString() || 0} Points</span>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className={`${themeCard} rounded-xl p-3 sm:p-4 border ${themeBorder}`}>
              <p className={`text-xs sm:text-sm ${themeSecondary}`}>Anúncios Ativos</p>
              <p className={`text-xl sm:text-2xl font-bold ${themeText}`}>{stats.activeListings}</p>
            </div>
            <div className={`${themeCard} rounded-xl p-4 border ${themeBorder}`}>
              <p className={`text-sm ${themeSecondary}`}>Itens Vendidos</p>
              <p className={`text-2xl font-bold ${themeText}`}>{stats.totalSold}</p>
            </div>
            <div className={`${themeCard} rounded-xl p-4 border ${themeBorder}`}>
              <p className={`text-sm ${themeSecondary}`}>Volume Total</p>
              <p className={`text-2xl font-bold text-${themeColor}-400`}>{stats.totalVolume.toLocaleString()} <span className="text-sm">Zions</span></p>
            </div>
            <div className={`${themeCard} rounded-xl p-4 border ${themeBorder}`}>
              <p className={`text-sm ${themeSecondary}`}>Taxa do Mercado</p>
              <p className={`text-2xl font-bold ${themeText}`}>5%</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex gap-2 mb-6 overflow-x-auto pb-2`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                ? `bg-${themeColor}-500 text-white`
                : `${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} ${themeText}`
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeSecondary}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar itens..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white'} border ${themeBorder} ${themeText} focus:ring-2 focus:ring-${themeColor}-500`}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className={`px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white'} border ${themeBorder} ${themeText}`}
                >
                  <option value="all">Todos</option>
                  <option value="background">Fundos</option>
                  <option value="badge">Badges</option>
                  <option value="color">Cores</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className={`px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white'} border ${themeBorder} ${themeText}`}
                >
                  <option value="newest">Mais Recentes</option>
                  <option value="oldest">Mais Antigos</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className={`w-8 h-8 animate-spin text-${themeColor}-400`} />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className={`${themeCard} rounded-2xl p-16 text-center border ${themeBorder}`}>
                <Store className={`w-16 h-16 mx-auto mb-4 ${themeSecondary}`} />
                <h3 className={`text-xl font-bold ${themeText} mb-2`}>Nenhum item encontrado</h3>
                <p className={themeSecondary}>Seja o primeiro a vender algo!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredListings.map(listing => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${themeCard} rounded-xl border ${themeBorder} overflow-hidden hover:border-${themeColor}-500/50 transition-all`}
                  >
                    {/* Item Preview */}
                    <div className={`aspect-square flex items-center justify-center ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} p-4`}>
                      {renderItemPreview({ itemType: listing.itemType, itemPreview: listing.itemPreview }, 'lg')}
                    </div>

                    {/* Item Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {getItemIcon(listing.itemType)}
                        <span className={`text-xs ${themeSecondary} capitalize`}>{listing.itemType}</span>
                      </div>
                      <h3 className={`font-semibold ${themeText} truncate`}>{listing.itemName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <img
                          src={listing.seller.avatarUrl || '/default-avatar.png'}
                          alt={listing.seller.displayName || listing.seller.name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className={`text-xs ${themeSecondary} truncate`}>
                          {listing.seller.displayName || listing.seller.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1">
                          <Zap className={`w-4 h-4 text-${themeColor}-400`} />
                          <span className={`font-bold text-${themeColor}-400`}>{listing.price}</span>
                        </div>

                        {listing.isOwnListing ? (
                          <span className={`text-xs ${themeSecondary}`}>Seu anúncio</span>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleBuy(listing)}
                            disabled={buyingId === listing.id}
                            className={`px-3 py-1.5 rounded-lg bg-${themeColor}-500 text-white text-sm font-medium hover:bg-${themeColor}-600 disabled:opacity-50 flex items-center gap-1`}
                          >
                            {buyingId === listing.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShoppingCart className="w-3 h-3" />
                            )}
                            Comprar
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Sell Tab */}
        {activeTab === 'sell' && (
          <div className={`${themeCard} rounded-2xl p-6 border ${themeBorder}`}>
            <h2 className={`text-xl font-bold ${themeText} mb-4`}>Vender um Item</h2>
            <p className={`${themeSecondary} mb-6`}>
              Coloque seus itens à venda e ganhe Zions! Taxa de 5% sobre cada venda.
            </p>

            {sellableItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className={`w-12 h-12 mx-auto mb-3 ${themeSecondary}`} />
                <p className={themeSecondary}>Você não tem itens para vender.</p>
                <p className={`text-sm ${themeSecondary} mt-1`}>Compre itens na Loja de Personalização primeiro!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sellableItems.map(item => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedItem(item.id);
                      setShowSellModal(true);
                    }}
                    className={`p-4 rounded-xl border ${themeBorder} ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-all text-left`}
                  >
                    <div className="flex justify-center mb-3">
                      {renderItemPreview({ itemType: item.type, itemPreview: item.preview }, 'md')}
                    </div>
                    <p className={`font-medium ${themeText} text-sm truncate`}>{item.name}</p>
                    <p className={`text-xs ${themeSecondary} capitalize`}>{item.type}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Listings Tab */}
        {activeTab === 'my-listings' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className={`w-8 h-8 animate-spin text-${themeColor}-400`} />
              </div>
            ) : myListings.length === 0 ? (
              <div className={`${themeCard} rounded-2xl p-16 text-center border ${themeBorder}`}>
                <Package className={`w-16 h-16 mx-auto mb-4 ${themeSecondary}`} />
                <h3 className={`text-xl font-bold ${themeText} mb-2`}>Nenhum anúncio</h3>
                <p className={themeSecondary}>Vá na aba "Vender" para colocar itens à venda!</p>
              </div>
            ) : (
              myListings.map(listing => (
                <div
                  key={listing.id}
                  className={`${themeCard} rounded-xl p-4 border ${themeBorder} flex items-center gap-4`}
                >
                  {renderItemPreview({ itemType: listing.itemType, itemPreview: listing.itemPreview }, 'sm')}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${themeText}`}>{listing.itemName}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-sm ${themeSecondary} capitalize`}>{listing.itemType}</span>
                      <span className={`text-sm font-medium text-${themeColor}-400`}>{listing.price} Zions</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${listing.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {listing.status === 'ACTIVE' ? 'Ativo' : 'Vendido'}
                      </span>
                    </div>
                  </div>
                  {listing.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCancelListing(listing.id)}
                      className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} text-red-400`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className={`w-8 h-8 animate-spin text-${themeColor}-400`} />
              </div>
            ) : transactions.length === 0 ? (
              <div className={`${themeCard} rounded-2xl p-16 text-center border ${themeBorder}`}>
                <History className={`w-16 h-16 mx-auto mb-4 ${themeSecondary}`} />
                <h3 className={`text-xl font-bold ${themeText} mb-2`}>Nenhuma transação</h3>
                <p className={themeSecondary}>Suas compras e vendas aparecerão aqui</p>
              </div>
            ) : (
              transactions.map(tx => (
                <div
                  key={tx.id}
                  className={`${themeCard} rounded-xl p-4 border ${themeBorder} flex items-center gap-4`}
                >
                  {renderItemPreview({ itemType: tx.itemType, itemPreview: tx.itemPreview }, 'sm')}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${themeText}`}>{tx.itemName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.type === 'purchase'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'
                        }`}>
                        {tx.type === 'purchase' ? 'Compra' : 'Venda'}
                      </span>
                      <span className={`text-sm ${themeSecondary}`}>
                        {tx.type === 'purchase' ? `de ${tx.seller.displayName || tx.seller.name}` : `para ${tx.buyer.displayName || tx.buyer.name}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'purchase' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'purchase' ? '-' : '+'}{tx.price} Zions
                    </p>
                    <p className={`text-xs ${themeSecondary}`}>
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sell Modal */}
      <AnimatePresence>
        {showSellModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSellModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md ${isDarkMode ? 'bg-neutral-900' : 'bg-white'} rounded-2xl border ${themeBorder} p-6`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${themeText}`}>Vender Item</h2>
                <button onClick={() => setShowSellModal(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                  <X className={`w-5 h-5 ${themeSecondary}`} />
                </button>
              </div>

              {(() => {
                const itemToSell = sellableItems.find(i => i.id === selectedItem);
                if (!itemToSell) return null;

                return (
                  <div className="flex items-center gap-4 mb-6">
                    {renderItemPreview({ itemType: itemToSell.type, itemPreview: itemToSell.preview }, 'md')}
                    <div>
                      <h3 className={`font-semibold ${themeText}`}>{itemToSell.name}</h3>
                      <p className={`text-sm ${themeSecondary} capitalize`}>{itemToSell.type === 'theme_pack' ? 'Theme Pack' : itemToSell.type}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Price Input */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${themeText} mb-2`}>
                  Preço (10 - 10.000 Zions)
                </label>
                <div className="relative">
                  <Zap className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-${themeColor}-400`} />
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="Digite o preço..."
                    min={10}
                    max={10000}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} border ${themeBorder} ${themeText}`}
                  />
                </div>
                {sellPrice && (
                  <p className={`text-sm ${themeSecondary} mt-2`}>
                    Você receberá: <span className={`text-${themeColor}-400 font-medium`}>{Math.floor(parseInt(sellPrice) * 0.95)} Zions</span> (após taxa de 5%)
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSellModal(false)}
                  className={`flex-1 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} ${themeText} transition-colors`}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateListing}
                  disabled={!sellPrice || creating}
                  className={`flex-1 py-3 rounded-xl font-medium bg-${themeColor}-500 text-white hover:bg-${themeColor}-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2`}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Tag className="w-4 h-4" />
                  )}
                  Colocar à Venda
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl z-[200] shadow-xl backdrop-blur-md ${notification.type === 'success' ? 'bg-green-500/30 text-green-300 border border-green-500/40' : 'bg-red-500/30 text-red-300 border border-red-500/40'
              }`}
          >
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
