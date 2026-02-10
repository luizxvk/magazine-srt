import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    Search, TrendingUp, Users, Sparkles, 
    ChevronRight, Heart, MessageCircle, Star,
    Crown, Store, Gift, Users2, MessageSquare, 
    ShoppingBag, Trophy, Camera, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Header from '../components/Header';
import ModernLoader from '../components/ModernLoader';
import SearchModal from '../components/SearchModal';
import GradientText from '../components/GradientText';
import ExploreCardsCarousel from '../components/ExploreCardsCarousel';
import { useTranslation } from 'react-i18next';

interface TrendingPost {
    id: string;
    imageUrl?: string;
    caption?: string;
    likesCount: number;
    commentsCount: number;
    user: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

interface TopMember {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    trophies: number;
    level: number;
    isVerified?: boolean;
}

interface FeatureCard {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    path: string;
}

export default function ExplorePage() {
    const { user, theme } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const isMGT = user?.membershipType === 'MGT';
    
    const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
    const [topMembers, setTopMembers] = useState<TopMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'discover' | 'trending' | 'members'>('discover');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

    // Theme colors
    const themeTitle = isMGT ? 'text-emerald-400' : 'text-gold-400';
    // GradientText used for the page title
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'shadow-[0_0_20px_rgba(212,175,55,0.3)]';
    const themeButtonActive = isMGT ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-gold-500/20 text-gold-400 border-gold-500/50';
    const themeCardBg = theme === 'light' ? 'bg-white/80' : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeTextSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    // Features disponíveis na plataforma
    const features: FeatureCard[] = [
        { id: 'market', name: 'Mercado', description: 'Compre e venda itens', icon: <Store className="w-6 h-6" />, color: isMGT ? 'from-emerald-500 to-emerald-700' : 'from-gold-500 to-amber-700', path: '/market' },
        { id: 'rewards', name: 'Recompensas', description: 'Resgate prêmios exclusivos', icon: <Gift className="w-6 h-6" />, color: 'from-purple-500 to-violet-700', path: '/rewards' },
        { id: 'groups', name: 'Grupos', description: 'Comunidades e chats', icon: <Users2 className="w-6 h-6" />, color: 'from-blue-500 to-indigo-700', path: '/groups' },
        { id: 'social', name: 'Social', description: 'Amigos e conexões', icon: <MessageSquare className="w-6 h-6" />, color: 'from-pink-500 to-rose-700', path: '/social' },
        { id: 'store', name: 'Loja', description: 'Produtos físicos', icon: <ShoppingBag className="w-6 h-6" />, color: 'from-orange-500 to-red-700', path: '/store' },
        { id: 'catalog', name: 'Catálogo', description: 'Galeria de fotos', icon: <Camera className="w-6 h-6" />, color: 'from-cyan-500 to-blue-700', path: '/catalog' },
        { id: 'ranking', name: 'Ranking', description: 'Classificação global', icon: <Trophy className="w-6 h-6" />, color: 'from-amber-500 to-yellow-700', path: '/ranking' },
        { id: 'roadmap', name: 'Roadmap', description: 'Próximas novidades', icon: <Map className="w-6 h-6" />, color: 'from-teal-500 to-emerald-700', path: '/roadmap' },
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [postsRes, rankingRes] = await Promise.all([
                api.get('/feed/highlights'),
                api.get('/gamification/ranking')
            ]);
            
            // Get top 6 trending posts with images
            const postsWithImages = postsRes.data
                .filter((p: TrendingPost) => p.imageUrl)
                .sort((a: TrendingPost, b: TrendingPost) => b.likesCount - a.likesCount)
                .slice(0, 6);
            setTrendingPosts(postsWithImages);
            
            // Get top 5 members
            setTopMembers(rankingRes.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to load explore data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFeatureClick = (feature: FeatureCard) => {
        setSelectedFeature(feature.id);
        // Navegar para a feature após um pequeno delay para mostrar animação
        setTimeout(() => {
            navigate(feature.path);
        }, 200);
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white font-sans relative">
                <LuxuriousBackground />
                <Header />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <ModernLoader />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans relative">
            <LuxuriousBackground />
            <Header />

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <div className="max-w-6xl mx-auto pt-24 pb-32 px-4 relative z-10">
                {/* Search Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <GradientText as="h1" className="text-3xl md:text-4xl font-serif mb-2" fallbackClassName={themeTitle}>
                        {t('nav.explore')}
                    </GradientText>
                    <p className={themeTextSecondary}>
                        Descubra conteúdos incríveis da comunidade
                    </p>
                </motion.div>

                {/* Search Bar - Abre o SearchModal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className={`w-full relative rounded-2xl ${themeCardBg} backdrop-blur-xl border ${themeBorder} overflow-hidden ${themeGlow} text-left transition-all hover:scale-[1.01]`}
                    >
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeTextSecondary}`} />
                        <div className={`w-full py-4 pl-12 pr-4 ${themeTextSecondary} text-lg`}>
                            Buscar posts, membros, tags...
                        </div>
                    </button>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide"
                >
                    {['discover', 'trending', 'members'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 border ${
                                activeTab === tab
                                    ? themeButtonActive
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {tab === 'discover' && <Sparkles className="w-4 h-4 inline mr-2" />}
                            {tab === 'trending' && <TrendingUp className="w-4 h-4 inline mr-2" />}
                            {tab === 'members' && <Users className="w-4 h-4 inline mr-2" />}
                            {tab === 'discover' ? 'Descobrir' : tab === 'trending' ? 'Em Alta' : 'Membros'}
                        </button>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* Discover Tab */}
                    {activeTab === 'discover' && (
                        <motion.div
                            key="discover"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Mobile Cards Carousel - sidebar cards */}
                            <ExploreCardsCarousel />

                            {/* Features Card */}
                            <div className={`${themeCardBg} backdrop-blur-xl rounded-2xl border ${themeBorder} p-6`}>
                                <h2 className={`text-xl font-semibold ${themeText} mb-2 flex items-center gap-2`}>
                                    <Sparkles className={`w-5 h-5 ${themeTitle}`} />
                                    O que você quer explorar?
                                </h2>
                                <p className={`${themeTextSecondary} text-sm mb-6`}>
                                    Selecione uma feature para começar
                                </p>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {features.map((feature, index) => (
                                        <motion.button
                                            key={feature.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleFeatureClick(feature)}
                                            className={`group relative p-4 rounded-xl bg-gradient-to-br ${feature.color} overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                                                selectedFeature === feature.id ? 'ring-2 ring-white scale-105' : ''
                                            }`}
                                        >
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                            <div className="relative flex flex-col items-center gap-2 text-white text-center">
                                                {feature.icon}
                                                <span className="font-semibold text-sm">{feature.name}</span>
                                                <span className="text-xs text-white/70 hidden sm:block">{feature.description}</span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Featured Content Preview */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`text-xl font-semibold ${themeText} flex items-center gap-2`}>
                                        <Star className={`w-5 h-5 ${themeTitle}`} />
                                        Destaques
                                    </h2>
                                    <Link 
                                        to="/highlights" 
                                        className={`text-sm ${themeTitle} hover:underline flex items-center gap-1`}
                                    >
                                        Ver todos <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {trendingPosts.slice(0, 3).map((post, index) => (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Link
                                                to={`/post/${post.id}`}
                                                className="group block relative aspect-square rounded-2xl overflow-hidden"
                                            >
                                                <img
                                                    src={post.imageUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="flex items-center gap-3 text-white text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="w-4 h-4" /> {post.likesCount}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle className="w-4 h-4" /> {post.commentsCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Trending Tab */}
                    {activeTab === 'trending' && (
                        <motion.div
                            key="trending"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {trendingPosts.map((post, index) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            to={`/post/${post.id}`}
                                            className={`group block relative aspect-square rounded-2xl overflow-hidden ${themeCardBg} backdrop-blur-xl border ${themeBorder}`}
                                        >
                                            <img
                                                src={post.imageUrl}
                                                alt=""
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                            
                                            {/* Rank Badge */}
                                            <div className={`absolute top-3 left-3 w-8 h-8 rounded-full bg-gradient-to-br ${
                                                index === 0 ? 'from-amber-400 to-amber-600' :
                                                index === 1 ? 'from-gray-300 to-gray-500' :
                                                index === 2 ? 'from-amber-600 to-amber-800' :
                                                'from-white/20 to-white/10'
                                            } flex items-center justify-center text-black font-bold text-sm shadow-lg`}>
                                                {index + 1}
                                            </div>
                                            
                                            {/* Stats */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-white text-sm font-medium truncate mb-1">
                                                    {post.user.displayName || post.user.name}
                                                </p>
                                                <div className="flex items-center gap-3 text-white/80 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="w-3 h-3" /> {post.likesCount}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="w-3 h-3" /> {post.commentsCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <motion.div
                            key="members"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-xl font-semibold ${themeText} flex items-center gap-2`}>
                                    <Crown className={`w-5 h-5 ${themeTitle}`} />
                                    Ranking Elite
                                </h2>
                                <Link 
                                    to="/ranking" 
                                    className={`text-sm ${themeTitle} hover:underline flex items-center gap-1`}
                                >
                                    Ver completo <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                            
                            {topMembers.map((member, index) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={`/profile/${member.id}`}
                                        className={`flex items-center gap-4 p-4 rounded-2xl ${themeCardBg} backdrop-blur-xl border ${themeBorder} hover:border-opacity-50 transition-all duration-300 group`}
                                    >
                                        {/* Rank */}
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                                            index === 0 ? 'from-amber-400 to-amber-600' :
                                            index === 1 ? 'from-gray-300 to-gray-500' :
                                            index === 2 ? 'from-amber-600 to-amber-800' :
                                            'from-white/20 to-white/10'
                                        } flex items-center justify-center text-black font-bold shadow-lg`}>
                                            {index + 1}
                                        </div>
                                        
                                        {/* Avatar */}
                                        <div className="relative">
                                            <img
                                                src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}&background=random`}
                                                alt={member.name}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-colors"
                                            />
                                            {member.isVerified && (
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'} flex items-center justify-center`}>
                                                    <Star className="w-3 h-3 text-black" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold ${themeText} truncate`}>
                                                {member.displayName || member.name}
                                            </p>
                                            <p className={`text-sm ${themeTextSecondary}`}>
                                                Nível {member.level} • {member.trophies} troféus
                                            </p>
                                        </div>
                                        
                                        <ChevronRight className={`w-5 h-5 ${themeTextSecondary} group-hover:${themeTitle} transition-colors`} />
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
