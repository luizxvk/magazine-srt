import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    Search, TrendingUp, Users, Hash, Sparkles, 
    ChevronRight, Heart, MessageCircle, Star,
    Zap, Crown, Flame, Music, Gamepad2, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Header from '../components/Header';
import ModernLoader from '../components/ModernLoader';

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

interface Category {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    count: number;
}

export default function ExplorePage() {
    const { user, theme } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';
    
    const [searchQuery, setSearchQuery] = useState('');
    const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
    const [topMembers, setTopMembers] = useState<TopMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'discover' | 'trending' | 'members'>('discover');

    // Theme colors
    const themeTitle = isMGT ? 'text-emerald-400' : 'text-gold-400';
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT ? 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'shadow-[0_0_20px_rgba(212,175,55,0.3)]';
    const themeButtonActive = isMGT ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-gold-500/20 text-gold-400 border-gold-500/50';
    const themeCardBg = theme === 'light' ? 'bg-white/80' : 'bg-white/5';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeTextSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    // Categories for explore
    const categories: Category[] = [
        { id: 'gaming', name: 'Gaming', icon: <Gamepad2 className="w-5 h-5" />, color: 'from-purple-500 to-indigo-600', count: 0 },
        { id: 'music', name: 'Música', icon: <Music className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', count: 0 },
        { id: 'photos', name: 'Fotos', icon: <Camera className="w-5 h-5" />, color: 'from-blue-500 to-cyan-600', count: 0 },
        { id: 'trending', name: 'Em Alta', icon: <Flame className="w-5 h-5" />, color: 'from-orange-500 to-red-600', count: 0 },
        { id: 'elite', name: 'Elite', icon: <Crown className="w-5 h-5" />, color: 'from-amber-500 to-yellow-600', count: 0 },
        { id: 'new', name: 'Novidades', icon: <Zap className="w-5 h-5" />, color: 'from-green-500 to-emerald-600', count: 0 },
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to search results or filter
            navigate(`/feed?search=${encodeURIComponent(searchQuery)}`);
        }
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

            <div className="max-w-6xl mx-auto pt-24 pb-32 px-4 relative z-10">
                {/* Search Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className={`text-3xl md:text-4xl font-serif ${themeTitle} mb-2`}>
                        Explorar
                    </h1>
                    <p className={themeTextSecondary}>
                        Descubra conteúdos incríveis da comunidade
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSearch}
                    className="mb-8"
                >
                    <div className={`relative rounded-2xl ${themeCardBg} backdrop-blur-xl border ${themeBorder} overflow-hidden ${themeGlow}`}>
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeTextSecondary}`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar posts, membros, tags..."
                            className={`w-full py-4 pl-12 pr-4 bg-transparent ${themeText} placeholder:${themeTextSecondary} focus:outline-none text-lg`}
                        />
                    </div>
                </motion.form>

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
                            onClick={() => setActiveTab(tab as any)}
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
                            {/* Categories Grid */}
                            <div>
                                <h2 className={`text-xl font-semibold ${themeText} mb-4 flex items-center gap-2`}>
                                    <Hash className={`w-5 h-5 ${themeTitle}`} />
                                    Categorias
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {categories.map((category, index) => (
                                        <motion.button
                                            key={category.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => navigate(`/feed?tag=${category.id}`)}
                                            className={`group relative p-4 rounded-2xl bg-gradient-to-br ${category.color} overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                                        >
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                            <div className="relative flex flex-col items-center gap-2 text-white">
                                                {category.icon}
                                                <span className="font-medium text-sm">{category.name}</span>
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
