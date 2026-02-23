import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Search, Tag, ShoppingCart,
  X, Zap, History, Package,
  Image, Award, Palette, Heart, MessageCircle,
  Star, Crown, ShieldCheck, Send
} from 'lucide-react';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import api from '../services/api';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import VisitorBlockPopup from '../components/VisitorBlockPopup';
import GradientText from '../components/GradientText';
import { useTranslation } from 'react-i18next';
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
  isFavorited?: boolean;
  isFeatured?: boolean;
  eliteOnly?: boolean;
  seller: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl: string;
    isTrustedSeller?: boolean;
    marketSalesCount?: number;
  };
}

interface Offer {
  id: string;
  listingId: string;
  amount: number;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  buyer?: { id: string; name: string; displayName: string; avatarUrl: string };
  seller?: { id: string; name: string; displayName: string; avatarUrl: string };
  listing: { id: string; itemId: string; itemName: string; itemPreview: string; price: number; status: string };
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

type TabType = 'browse' | 'sell' | 'my-listings' | 'history' | 'favorites' | 'offers';
type FilterType = 'all' | 'background' | 'badge' | 'color' | 'elite';
type SortType = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export default function MarketPage() {
  const { user, theme, updateUser, isVisitor } = useAuth();
  const { isStdTier } = useCommunity();
  const { t } = useTranslation(['shop', 'common']);
  const location = useLocation();
  const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;

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

  // Market 6.0 - Favorites and Offers
  const [favorites, setFavorites] = useState<any[]>([]);
  const [offersReceived, setOffersReceived] = useState<Offer[]>([]);
  const [offersSent, setOffersSent] = useState<Offer[]>([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerListingId, setOfferListingId] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [makingOffer, setMakingOffer] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

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
  const [showVisitorBlock, setShowVisitorBlock] = useState(false);

  const isDarkMode = theme === 'dark';
  const themeColor = isMGT ? 'tier-std' : 'gold';
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
        const eliteOnlyParam = filterType === 'elite' ? '&eliteOnly=true' : '';
        const typeParam = filterType === 'elite' ? 'all' : filterType;
        const [listingsRes, statsRes] = await Promise.all([
          api.get(`/market/listings?type=${typeParam}&sortBy=${sortBy}${eliteOnlyParam}`),
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
      } else if (activeTab === 'favorites') {
        const res = await api.get('/market/favorites');
        setFavorites(res.data);
      } else if (activeTab === 'offers') {
        const [receivedRes, sentRes] = await Promise.all([
          api.get('/market/offers/received'),
          api.get('/market/offers/sent')
        ]);
        setOffersReceived(receivedRes.data);
        setOffersSent(sentRes.data);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (listing: Listing) => {
    if (!user || buyingId) return;

    if (isVisitor) {
      setShowVisitorBlock(true);
      return;
    }

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

    if (isVisitor) {
      setShowVisitorBlock(true);
      return;
    }

    // Verificar se é theme pack para calcular preço mínimo
    const selectedPack = userPacks.find(up => up.pack.id === selectedItem);
    const isThemePack = !!selectedPack;
    const originalPrice = selectedPack?.pack?.price || 0;
    const minPrice = isThemePack && originalPrice > 0 ? Math.floor(originalPrice * 0.8) : 10;

    const price = parseInt(sellPrice);
    if (isNaN(price) || price < minPrice || price > 10000) {
      showNotification('error', `Preço deve ser entre ${minPrice.toLocaleString()} e 10.000 Zions`);
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

  // Market 6.0 Handlers
  const handleToggleFavorite = async (listing: Listing) => {
    if (isVisitor) {
      setShowVisitorBlock(true);
      return;
    }
    if (togglingFavorite) return;
    setTogglingFavorite(listing.id);
    try {
      if (listing.isFavorited) {
        await api.delete(`/market/favorites/${listing.id}`);
        showNotification('success', 'Removido dos favoritos');
      } else {
        await api.post(`/market/favorites/${listing.id}`);
        showNotification('success', 'Adicionado aos favoritos');
      }
      // Update listings locally
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, isFavorited: !l.isFavorited } : l));
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro');
    } finally {
      setTogglingFavorite(null);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerListingId || !offerAmount || makingOffer) return;
    if (isVisitor) {
      setShowVisitorBlock(true);
      return;
    }
    const amount = parseInt(offerAmount);
    if (isNaN(amount) || amount < 1) {
      showNotification('error', 'Valor inválido');
      return;
    }
    setMakingOffer(true);
    try {
      await api.post(`/market/offers/${offerListingId}`, { amount, message: offerMessage || null });
      showNotification('success', 'Oferta enviada!');
      setShowOfferModal(false);
      setOfferListingId(null);
      setOfferAmount('');
      setOfferMessage('');
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro ao enviar oferta');
    } finally {
      setMakingOffer(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject' | 'cancel') => {
    try {
      if (action === 'cancel') {
        await api.delete(`/market/offers/${offerId}`);
      } else {
        await api.post(`/market/offers/${offerId}/${action}`);
      }
      showNotification('success', action === 'accept' ? 'Oferta aceita!' : action === 'reject' ? 'Oferta recusada' : 'Oferta cancelada');
      fetchData();
      api.get('/users/me').then(res => updateUser(res.data));
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro');
    }
  };

  const handleFeatureListing = async (listingId: string) => {
    if (isVisitor) {
      setShowVisitorBlock(true);
      return;
    }
    try {
      await api.post(`/market/listings/${listingId}/feature`);
      showNotification('success', 'Anúncio destacado por 24h!');
      fetchData();
      api.get('/users/me').then(res => updateUser(res.data));
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro ao destacar');
    }
  };

  const handleToggleEliteOnly = async (listingId: string) => {
    try {
      const res = await api.post(`/market/listings/${listingId}/elite-only`);
      showNotification('success', res.data.message);
      fetchData();
    } catch (error: any) {
      showNotification('error', error.response?.data?.error || 'Erro');
    }
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
      // Check if itemPreview is a URL (image) or a gradient
      const isImageUrl = item.itemPreview && (item.itemPreview.startsWith('http') || item.itemPreview.startsWith('/'));
      
      if (isImageUrl) {
        return (
          <img
            src={item.itemPreview}
            alt={item.itemName || 'Theme Pack'}
            className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm`}
          />
        );
      }
      
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
          {item.itemPreview.startsWith('http') ? (
            <img src={item.itemPreview} alt="Badge" className={`${size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-14 h-14'} object-contain`} />
          ) : (
            item.itemPreview
          )}
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
    { id: 'favorites' as const, label: 'Favoritos', icon: Heart },
    { id: 'offers' as const, label: 'Ofertas', icon: MessageCircle },
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
    // Animated premium backgrounds
    'anim-cosmic-triangles': { name: 'Triângulos Cósmicos', type: 'background', preview: 'radial-gradient(circle at center, #111 0%, #000 60%)' },
    'anim-gradient-waves': { name: 'Ondas Gradiente', type: 'background', preview: 'linear-gradient(315deg, rgba(30,20,10,1) 0%, rgba(139,115,55,1) 25%, rgba(212,175,55,1) 50%, rgba(139,115,55,1) 75%, rgba(30,20,10,1) 100%)' },
    'anim-rainbow-skies': { name: 'Rainbow Skies', type: 'background', preview: 'linear-gradient(315deg, rgba(232,121,249,1) 10%, rgba(96,165,250,1) 50%, rgba(94,234,212,1) 90%)' },
    'anim-infinite-triangles': { name: 'Infinite Triangles', type: 'background', preview: 'linear-gradient(135deg, #d4af37 0%, #000 100%)' },
    'anim-moonlit-sky': { name: 'Moonlit Sky', type: 'background', preview: 'linear-gradient(180deg, #000011 0%, #0a0a2e 50%, #1a1a4a 100%)' },
    'anim-dark-veil': { name: 'Véu Sombrio', type: 'background', preview: 'radial-gradient(ellipse at center, #2a0845 0%, #1a0530 30%, #0a0115 100%)' },
    'anim-iridescence': { name: 'Prisma Iridescente', type: 'background', preview: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #1a1a2e 100%)' },
    // Badges - using icons8 URLs
    badge_skull: { name: 'Caveira', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=1aDNYh2zesKP&format=png&color=000000' },
    badge_fire: { name: 'Fogo', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=NjzqV0aREXb6&format=png&color=000000' },
    badge_star: { name: 'Estrela', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
    badge_diamond: { name: 'Diamante', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=8k9NF5LzoTVC&format=png&color=000000' },
    badge_lightning: { name: 'Raio', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
    badge_pony: { name: 'Unicórnio', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=16114&format=png&color=000000' },
    badge_heart: { name: 'Coração', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=yQTLnfG3Agzl&format=png&color=000000' },
    badge_moon: { name: 'Lua', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=6DXM8bs2tFSU&format=png&color=000000' },
    badge_sun: { name: 'Sol', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=OIr0zJdeXCbg&format=png&color=000000' },
    badge_seal: { name: 'Foca', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=FVRVluUvxBrh&format=png&color=000000' },
    badge_shark: { name: 'Grande Norke', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=81021&format=png&color=000000' },
    badge_egghead: { name: 'Cabeça de Ovo', type: 'badge', preview: 'https://img.icons8.com/?size=100&id=_jtfUqyZM2Pw&format=png&color=000000' },
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
    // Gradient Colors
    color_gradient_sunset: { name: 'Pôr do Sol', type: 'color', preview: 'linear-gradient(135deg, #ff6b35, #f72585)' },
    color_gradient_ocean: { name: 'Oceano', type: 'color', preview: 'linear-gradient(135deg, #0077b6, #00f5d4)' },
    color_gradient_aurora: { name: 'Aurora Boreal', type: 'color', preview: 'linear-gradient(135deg, #7b4397, #00d9ff)' },
    color_gradient_fire: { name: 'Fogo Infernal', type: 'color', preview: 'linear-gradient(135deg, #ff0000, #ffc300)' },
    color_gradient_galaxy: { name: 'Galáxia', type: 'color', preview: 'linear-gradient(135deg, #1a0033, #7303c0, #ec38bc)' },
    color_gradient_neon: { name: 'Neon Elétrico', type: 'color', preview: 'linear-gradient(135deg, #ff00ff, #00ffff)' },
    color_gradient_forest: { name: 'Floresta Mística', type: 'color', preview: 'linear-gradient(135deg, #134e5e, #71b280)' },
    color_gradient_gold: { name: 'Dourado Premium', type: 'color', preview: 'linear-gradient(135deg, #8b7335, #d4af37, #f4e4a6)' },
    color_gradient_midnight: { name: 'Meia-Noite', type: 'color', preview: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
    color_gradient_candy: { name: 'Doce Intenso', type: 'color', preview: 'linear-gradient(135deg, #ff9a9e, #fecfef, #a18cd1)' },
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
    preview: up.pack.backgroundUrl,
    originalPrice: up.pack.price || 0, // Preço original para calcular mínimo
    rarity: up.pack.rarity || 'COMMON'
  }));

  const sellableItems = [...standardSellableItems, ...themePackItems];

  return (
    <div className={`min-h-screen font-sans selection:${isMGT ? 'bg-tier-std-500/30' : 'bg-gold-500/30'} relative`}>
      <LuxuriousBackground />
      <Header />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-24 sm:pt-32 pb-8 relative z-10">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Store className={`w-6 sm:w-8 h-6 sm:h-8 ${isMGT ? 'text-tier-std-400' : 'text-gold-400'}`} />
            <div>
              <div className="flex items-center gap-3">
                <GradientText as="h1" className="text-2xl sm:text-3xl md:text-4xl font-bold leading-none" fallbackClassName={isMGT ? 'text-tier-std-400' : 'text-gold-400'}>
                  {t('shop:market.title')}
                </GradientText>
                <span className={`flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isMGT ? 'bg-tier-std-500/20 text-tier-std-400 border border-tier-std-500/40' : 'bg-gold-500/20 text-gold-400 border border-gold-500/40'} animate-pulse translate-y-1`}>
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
                  {user?.isElite && <option value="elite">🔒 Elite</option>}
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
                <Loader size="md" />
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
                    className={`${themeCard} rounded-xl border ${listing.isFeatured ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : themeBorder} overflow-hidden hover:border-${themeColor}-500/50 transition-all relative`}
                  >
                    {/* Featured/Elite Badges */}
                    <div className="absolute top-2 left-2 flex gap-1 z-10">
                      {listing.isFeatured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500 text-black flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> DESTAQUE
                        </span>
                      )}
                      {listing.eliteOnly && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500 text-white flex items-center gap-1">
                          <Crown className="w-3 h-3" /> ELITE
                        </span>
                      )}
                    </div>

                    {/* Favorite Button */}
                    {!listing.isOwnListing && (
                      <button
                        onClick={() => handleToggleFavorite(listing)}
                        disabled={togglingFavorite === listing.id}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
                      >
                        <Heart 
                          className={`w-4 h-4 ${listing.isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`}
                        />
                      </button>
                    )}

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
                        {listing.seller.isTrustedSeller && (
                          <span title="Vendedor Confiável"><ShieldCheck className="w-4 h-4 text-green-500" /></span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1">
                          <Zap className={`w-4 h-4 text-${themeColor}-400`} />
                          <span className={`font-bold text-${themeColor}-400`}>{listing.price}</span>
                        </div>

                        {listing.isOwnListing ? (
                          <div className="flex gap-1">
                            {!listing.isFeatured && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleFeatureListing(listing.id)}
                                className={`px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30`}
                                title="Destacar (50 Zions)"
                              >
                                <Star className="w-3 h-3" />
                              </motion.button>
                            )}
                            {user?.isElite && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleEliteOnly(listing.id)}
                                className={`px-2 py-1 rounded-lg ${listing.eliteOnly ? 'bg-violet-500/30 text-violet-300' : 'bg-violet-500/10 text-violet-400'} text-xs font-medium`}
                                title={listing.eliteOnly ? 'Remover Elite Only' : 'Marcar Elite Only'}
                              >
                                <Crown className="w-3 h-3" />
                              </motion.button>
                            )}
                            <span className={`text-xs ${themeSecondary} self-center ml-1`}>Seu</span>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setOfferListingId(listing.id);
                                setShowOfferModal(true);
                              }}
                              className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                              title="Fazer Oferta"
                            >
                              <Send className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleBuy(listing)}
                              disabled={buyingId === listing.id}
                              className={`px-3 py-1.5 rounded-lg bg-${themeColor}-500 text-white text-sm font-medium hover:bg-${themeColor}-600 disabled:opacity-50 flex items-center gap-1`}
                            >
                              {buyingId === listing.id ? (
                                <Loader size="sm" />
                              ) : (
                                <ShoppingCart className="w-3 h-3" />
                              )}
                              Comprar
                            </motion.button>
                          </div>
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
                <Loader size="md" />
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
                <Loader size="md" />
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

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader size="md" />
              </div>
            ) : favorites.length === 0 ? (
              <div className={`${themeCard} rounded-2xl p-16 text-center border ${themeBorder}`}>
                <Heart className={`w-16 h-16 mx-auto mb-4 ${themeSecondary}`} />
                <h3 className={`text-xl font-bold ${themeText} mb-2`}>Sem favoritos</h3>
                <p className={themeSecondary}>Clique no ❤️ para salvar itens</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((fav: any) => (
                  <motion.div
                    key={fav.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${themeCard} rounded-xl border ${themeBorder} overflow-hidden`}
                  >
                    <div className={`aspect-square flex items-center justify-center ${isDarkMode ? 'bg-black/20' : 'bg-gray-50'} p-4`}>
                      {renderItemPreview({ itemType: fav.listing.itemType, itemPreview: fav.listing.itemPreview }, 'lg')}
                    </div>
                    <div className="p-4">
                      <h3 className={`font-semibold ${themeText} truncate`}>{fav.listing.itemName}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <Zap className={`w-4 h-4 text-${themeColor}-400`} />
                          <span className={`font-bold text-${themeColor}-400`}>{fav.listing.price}</span>
                        </div>
                        {fav.listing.status === 'ACTIVE' ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleBuy(fav.listing)}
                            disabled={buyingId === fav.listing.id}
                            className={`px-3 py-1.5 rounded-lg bg-${themeColor}-500 text-white text-sm font-medium`}
                          >
                            Comprar
                          </motion.button>
                        ) : (
                          <span className="text-xs text-gray-500">Vendido</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            {/* Offers Received */}
            <div>
              <h3 className={`text-lg font-bold ${themeText} mb-4 flex items-center gap-2`}>
                <MessageCircle className="w-5 h-5" /> Ofertas Recebidas
              </h3>
              {offersReceived.filter(o => o.status === 'PENDING').length === 0 ? (
                <p className={themeSecondary}>Nenhuma oferta pendente</p>
              ) : (
                <div className="space-y-3">
                  {offersReceived.filter(o => o.status === 'PENDING').map((offer) => (
                    <div key={offer.id} className={`${themeCard} rounded-xl border ${themeBorder} p-4`}>
                      <div className="flex items-center gap-4">
                        {renderItemPreview({ itemType: offer.listing.itemId.includes('bg_') ? 'background' : 'badge', itemPreview: offer.listing.itemPreview }, 'sm')}
                        <div className="flex-1">
                          <h4 className={`font-semibold ${themeText}`}>{offer.listing.itemName}</h4>
                          <p className={themeSecondary}>
                            <span className="font-medium">{offer.buyer?.displayName || offer.buyer?.name}</span> oferece{' '}
                            <span className={`text-${themeColor}-400 font-bold`}>{offer.amount} Zions</span>
                          </p>
                          {offer.message && <p className={`text-sm ${themeSecondary} italic mt-1`}>"{offer.message}"</p>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOfferAction(offer.id, 'accept')}
                            className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => handleOfferAction(offer.id, 'reject')}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offers Sent */}
            <div>
              <h3 className={`text-lg font-bold ${themeText} mb-4 flex items-center gap-2`}>
                <Send className="w-5 h-5" /> Ofertas Enviadas
              </h3>
              {offersSent.length === 0 ? (
                <p className={themeSecondary}>Você não enviou nenhuma oferta</p>
              ) : (
                <div className="space-y-3">
                  {offersSent.map((offer) => (
                    <div key={offer.id} className={`${themeCard} rounded-xl border ${themeBorder} p-4`}>
                      <div className="flex items-center gap-4">
                        {renderItemPreview({ itemType: offer.listing.itemId.includes('bg_') ? 'background' : 'badge', itemPreview: offer.listing.itemPreview }, 'sm')}
                        <div className="flex-1">
                          <h4 className={`font-semibold ${themeText}`}>{offer.listing.itemName}</h4>
                          <p className={themeSecondary}>
                            Sua oferta: <span className={`text-${themeColor}-400 font-bold`}>{offer.amount} Zions</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            offer.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            offer.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' :
                            offer.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {offer.status === 'PENDING' ? 'Pendente' :
                             offer.status === 'ACCEPTED' ? 'Aceita' :
                             offer.status === 'REJECTED' ? 'Recusada' :
                             'Cancelada'}
                          </span>
                          {offer.status === 'PENDING' && (
                            <button
                              onClick={() => handleOfferAction(offer.id, 'cancel')}
                              className="text-xs text-red-400 hover:underline"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Offer Modal */}
      <AnimatePresence>
        {showOfferModal && offerListingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowOfferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md ${isDarkMode ? 'bg-neutral-900' : 'bg-white'} rounded-2xl border ${themeBorder} p-6`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${themeText}`}>Fazer Oferta</h2>
                <button onClick={() => setShowOfferModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${themeSecondary} mb-2`}>Valor (Zions Points)</label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Ex: 500"
                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} border ${themeBorder} ${themeText}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeSecondary} mb-2`}>Mensagem (opcional)</label>
                  <textarea
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="Escreva algo para o vendedor..."
                    maxLength={200}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} border ${themeBorder} ${themeText} resize-none`}
                  />
                </div>
                <button
                  onClick={handleMakeOffer}
                  disabled={makingOffer || !offerAmount}
                  className={`w-full py-3 rounded-xl bg-${themeColor}-500 text-white font-bold hover:bg-${themeColor}-600 disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {makingOffer ? <Loader size="sm" /> : <Send className="w-5 h-5" />}
                  Enviar Oferta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

                // Verificar se é theme pack para mostrar valor original
                const isThemePack = itemToSell.type === 'theme_pack';
                const originalPrice = (itemToSell as any).originalPrice || 0;

                return (
                  <div className="flex items-center gap-4 mb-6">
                    {renderItemPreview({ itemType: itemToSell.type, itemPreview: itemToSell.preview }, 'md')}
                    <div>
                      <h3 className={`font-semibold ${themeText}`}>{itemToSell.name}</h3>
                      <p className={`text-sm ${themeSecondary} capitalize`}>{itemToSell.type === 'theme_pack' ? 'Theme Pack' : itemToSell.type}</p>
                      {isThemePack && originalPrice > 0 && (
                        <p className={`text-xs ${themeSecondary} mt-1`}>
                          Valor original: <span className={`text-${themeColor}-400`}>{originalPrice.toLocaleString()} Zions</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Price Input */}
              {(() => {
                const itemToSell = sellableItems.find(i => i.id === selectedItem);
                const isThemePack = itemToSell?.type === 'theme_pack';
                const originalPrice = (itemToSell as any)?.originalPrice || 0;
                const minPrice = isThemePack && originalPrice > 0 ? Math.floor(originalPrice * 0.8) : 10;

                return (
                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${themeText} mb-2`}>
                      Preço ({minPrice.toLocaleString()} - 10.000 Zions)
                    </label>
                    <div className="relative">
                      <Zap className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-${themeColor}-400`} />
                      <input
                        type="number"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        placeholder={`Mínimo ${minPrice.toLocaleString()} Zions...`}
                        min={minPrice}
                        max={10000}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} border ${themeBorder} ${themeText}`}
                      />
                    </div>
                    {sellPrice && (
                      <p className={`text-sm ${themeSecondary} mt-2`}>
                        Você receberá: <span className={`text-${themeColor}-400 font-medium`}>{Math.floor(parseInt(sellPrice) * 0.95)} Zions</span> (após taxa de 5%)
                      </p>
                    )}
                    {sellPrice && parseInt(sellPrice) < minPrice && (
                      <p className="text-sm text-red-400 mt-1">
                        ⚠️ Preço mínimo para este item é {minPrice.toLocaleString()} Zions
                      </p>
                    )}
                  </div>
                );
              })()}

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
                    <Loader size="sm" />
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

      {/* Visitor Block Popup */}
      <VisitorBlockPopup 
        isOpen={showVisitorBlock} 
        onClose={() => setShowVisitorBlock(false)} 
        featureName="interagir com o mercado"
      />
    </div>
  );
}
