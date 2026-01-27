import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Heart, MessageCircle, Grid, List, Filter, Star, Trophy, Coins, Package, Calendar } from 'lucide-react';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Header from '../components/Header';

interface HighlightPost {
    id: string;
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
    likesCount: number;
    commentsCount: number;
    tags?: { tag: string }[];
    user: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    isLiked: boolean;
}

interface RankingRewardConfig {
    rewardType: 'zions_points' | 'zions_cash' | 'product' | 'none';
    rewardAmount?: number;
    rewardProductName?: string;
    rewardDescription?: string;
    showInHighlights?: boolean;
}

export default function HighlightsPage() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [posts, setPosts] = useState<HighlightPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<HighlightPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [rewardConfig, setRewardConfig] = useState<RankingRewardConfig | null>(null);
    const [daysRemaining, setDaysRemaining] = useState(0);

    useEffect(() => {
        fetchHighlights();
        fetchRewardConfig();
        calculateDaysRemaining();
    }, []);

    const fetchRewardConfig = async () => {
        try {
            const response = await api.get('/content/elite-ranking-reward');
            console.log('[HighlightsPage] Reward config response:', response.data);
            if (response.data && response.data.showInHighlights && response.data.rewardType !== 'none') {
                console.log('[HighlightsPage] Setting rewardConfig:', response.data);
                setRewardConfig(response.data);
            } else {
                console.log('[HighlightsPage] Reward config not set. showInHighlights:', response.data?.showInHighlights, 'rewardType:', response.data?.rewardType);
            }
        } catch (err) {
            console.error('[HighlightsPage] Error fetching reward config:', err);
            // No reward config
        }
    };

    const calculateDaysRemaining = () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const diff = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(diff);
    };

    const getRewardIcon = () => {
        switch (rewardConfig?.rewardType) {
            case 'zions_points': return <Coins className="w-6 h-6 text-yellow-500" />;
            case 'zions_cash': return <Coins className="w-6 h-6 text-green-500" />;
            case 'product': return <Package className="w-6 h-6 text-purple-500" />;
            default: return <Trophy className="w-6 h-6 text-gold-500" />;
        }
    };

    const getRewardText = () => {
        switch (rewardConfig?.rewardType) {
            case 'zions_points': return `${rewardConfig.rewardAmount?.toLocaleString()} Zions Points`;
            case 'zions_cash': return `R$ ${rewardConfig.rewardAmount?.toFixed(2)}`;
            case 'product': return rewardConfig.rewardProductName || 'Prêmio Especial';
            default: return 'Prêmio do Ranking';
        }
    };

    useEffect(() => {
        fetchHighlights();
    }, []);

    const fetchHighlights = async () => {
        try {
            const response = await api.get('/feed/highlights');
            // Filter to only show posts WITH images AND without linked products (user posts only)
            const postsWithImages = response.data.filter((post: any) => 
                post.imageUrl && post.imageUrl.trim() !== '' && !post.linkedProductId
            );
            setPosts(postsWithImages);
            setFilteredPosts(postsWithImages);
            
            // Extract unique tags
            const tags = new Set<string>();
            postsWithImages.forEach((post: HighlightPost) => {
                post.tags?.forEach(t => tags.add(t.tag));
            });
            setAvailableTags(Array.from(tags));
        } catch (error) {
            console.error('Failed to fetch highlights', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter posts by tag
    useEffect(() => {
        if (selectedTag) {
            setFilteredPosts(posts.filter(post => 
                post.tags?.some(t => t.tag === selectedTag)
            ));
        } else {
            setFilteredPosts(posts);
        }
    }, [selectedTag, posts]);

    // Explicit theme classes for Tailwind JIT
    const themeTagActive = isMGT ? 'bg-emerald-500 text-black' : 'bg-gold-500 text-black';
    const themeBadge = isMGT ? 'bg-emerald-500 text-black' : 'bg-gold-500 text-black';
    const themeSpinner = isMGT ? 'border-emerald-500' : 'border-gold-500';

    return (
        <div className="min-h-screen text-white font-sans relative">
            <LuxuriousBackground />
            <Header />

            <div className="max-w-7xl mx-auto pt-28 px-4 relative z-10">
                {/* Header with title and controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-4">
                    {/* Title - Styled like PhotoCatalog */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl ${
                        theme === 'light' 
                            ? (isMGT ? 'bg-emerald-100' : 'bg-amber-100') 
                            : (isMGT ? 'bg-emerald-950/30' : 'bg-gold-950/30')
                    } border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
                        <Link to="/feed" className={`p-3 rounded-xl ${isMGT ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : 'bg-gold-500/20 hover:bg-gold-500/30'} transition-colors`} title="Voltar ao Feed">
                            <ArrowLeft className={`w-5 h-5 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                        </Link>
                        <div className={`p-3 rounded-xl ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                            <Star className={`w-6 h-6 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Destaques da Semana
                            </h2>
                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                Os melhores posts da comunidade.
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className={`flex rounded-lg p-1 ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'}`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' 
                                    ? (isMGT ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-black') 
                                    : (isMGT ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-gold-400 hover:bg-gold-500/20')}`}
                                title="Visualização em grade"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' 
                                    ? (isMGT ? 'bg-emerald-500 text-white' : 'bg-gold-500 text-black') 
                                    : (isMGT ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-gold-400 hover:bg-gold-500/20')}`}
                                title="Visualização em lista"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Elite Ranking Reward Card */}
                {rewardConfig && (
                    <Link to="/ranking" className="block mb-6">
                        <div className={`relative overflow-hidden rounded-2xl p-6 ${
                            theme === 'light' 
                                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' 
                                : 'bg-gradient-to-r from-gold-950/50 to-amber-950/50 border border-gold-500/30'
                        } hover:scale-[1.01] transition-transform cursor-pointer group`}>
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                                <Trophy className="w-full h-full text-gold-500" />
                            </div>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-amber-100' : 'bg-gold-500/20'}`}>
                                    {getRewardIcon()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className={`w-4 h-4 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                                            Prêmio Elite Ranking
                                        </span>
                                    </div>
                                    <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {getRewardText()}
                                    </h3>
                                    {rewardConfig.rewardDescription && (
                                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {rewardConfig.rewardDescription}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className={`flex items-center gap-1.5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                                        </span>
                                    </div>
                                    <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                        restantes
                                    </p>
                                </div>
                            </div>
                            
                            {/* Hover indicator */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
                        </div>
                    </Link>
                )}

                {/* Tag Filters */}
                {availableTags.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                !selectedTag 
                                    ? themeTagActive 
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                        >
                            Todos
                        </button>
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    selectedTag === tag 
                                        ? themeTagActive 
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${themeSpinner}`}></div>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400">Nenhum destaque encontrado.</p>
                        <p className="text-gray-500 text-sm mt-2">Posts precisam ter imagem para aparecer aqui.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20"
                        : "flex flex-col gap-4 pb-20 max-w-2xl mx-auto"
                    }>
                        {filteredPosts.map((post, index) => (
                            <div 
                                key={post.id} 
                                className={`glass-panel group relative overflow-hidden rounded-xl ${
                                    viewMode === 'grid' ? 'aspect-[4/5]' : 'flex gap-4 p-4'
                                } hover:scale-[1.02] transition-transform duration-300`}
                            >
                                {viewMode === 'grid' ? (
                                    <>
                                        <img
                                            src={post.imageUrl}
                                            alt={post.caption}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index < 3 ? themeBadge : 'bg-white/20 text-white'}`}>
                                                    #{index + 1}
                                                </div>
                                                <h3 className="font-medium text-white truncate max-w-[150px]">{post.user.name}</h3>
                                            </div>
                                            <p className="text-gray-300 text-sm line-clamp-2 mb-4">{post.caption}</p>
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {post.tags.slice(0, 3).map(t => (
                                                        <span key={t.tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white">
                                                            #{t.tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-red-500">
                                                    <Heart className="w-5 h-5 fill-current" />
                                                    <span className="font-bold text-white">{post.likesCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-blue-400">
                                                    <MessageCircle className="w-5 h-5" />
                                                    <span className="font-bold text-white">{post.commentsCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${index < 3 ? themeBadge : 'bg-white/20 text-white'}`}>
                                            #{index + 1}
                                        </div>
                                        <img
                                            src={post.imageUrl}
                                            alt={post.caption}
                                            className="w-20 h-20 object-cover rounded-lg shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-white truncate">{post.user.name}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2">{post.caption}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <Heart className="w-4 h-4 fill-current" />
                                                    <span className="text-sm text-white">{post.likesCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-blue-400">
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span className="text-sm text-white">{post.commentsCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
