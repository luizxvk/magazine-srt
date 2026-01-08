import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import FeedItem from '../components/FeedItem';
import CreatePostWidget from '../components/CreatePostWidget';
import LuxuriousBackground from '../components/LuxuriousBackground';
import FeedCarousel from '../components/FeedCarousel';
import CommentsModal from '../components/CommentsModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Users, Calendar } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';
import DailyLoginCard from '../components/DailyLoginCard';
import ModernLoader from '../components/ModernLoader';

import AnnouncementCard from '../components/AnnouncementCard';
import StoriesBar from '../components/StoriesBar';
import RecommendationsDrawer from '../components/RecommendationsDrawer';
import NewMembersModal from '../components/NewMembersModal';
import EventsModal from '../components/EventsModal';
import OnlineFriendsCard from '../components/OnlineFriendsCard';
import WhatsNewCard from '../components/WhatsNewCard';
import CustomizationShop from '../components/CustomizationShop';

interface Post {
    id: string;
    author: {
        id: string;
        name: string;
        avatarUrl: string;
        trophies: number;
    };
    content: string;
    image?: string;
    video?: string;
    likes: number;
    comments: number;
    timestamp: string;
    isHighlight: boolean;
    tags: string[];
    isLiked: boolean;
}

export default function FeedPage() {
    const { user, dailyLoginStatus, openDailyLoginModal, showAchievement, updateUserZions, updateUser, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const themeTextGradient = isMGT
        ? (theme === 'light' ? 'from-gray-800 via-gray-600 to-gray-800' : 'from-white via-gray-200 to-gray-100')
        : 'from-gold-200 via-gold-400 to-gold-200';

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', isVisible: false, type: 'success' as 'success' | 'error' | 'info' });

    const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
    const [isStoryEditorOpen, setIsStoryEditorOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postId: string | null }>({
        isOpen: false,
        postId: null
    });
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);

    // New Modal States
    const [isNewMembersOpen, setIsNewMembersOpen] = useState(false);
    const [isEventsOpen, setIsEventsOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);

    const fetchPosts = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await api.get('/feed');
            const mappedPosts = response.data.map((p: any) => ({
                id: p.id,
                author: {
                    id: p.user.id,
                    name: p.user.displayName || p.user.name,
                    avatarUrl: p.user.avatarUrl,
                    trophies: p.user.trophies || 0
                },
                content: p.caption || '',
                image: p.imageUrl,
                video: p.videoUrl,
                likes: p.likesCount || 0,
                comments: p.commentsCount || 0,
                timestamp: p.createdAt,
                isHighlight: p.isHighlight,
                tags: p.tags?.map((t: any) => t.tag) || [],
                isLiked: p.isLiked || false
            }));
            setPosts(mappedPosts);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(() => {
            fetchPosts(true);
        }, 60000); // Reduced from 15s to 60s to save bandwidth
        return () => clearInterval(interval);
    }, []);

    const handlePostCreated = () => {
        fetchPosts();
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, isVisible: true, type });
    };

    const handleShare = (postId: string | number) => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        showToast('Link copiado para a área de transferência!', 'success');
    };

    const handleDeletePost = async () => {
        if (!deleteModal.postId) return;
        try {
            await api.delete(`/posts/${deleteModal.postId}`);
            setPosts(posts.filter(p => p.id !== deleteModal.postId));
            setDeleteModal({ isOpen: false, postId: null });
            showToast('Postagem deletada com sucesso', 'success');
        } catch (error) {
            console.error('Failed to delete post', error);
            showToast('Erro ao deletar postagem', 'error');
        }
    };

    const handleLike = async (postId: string) => {
        try {
            const response = await api.post(`/feed/${postId}/like`);

            // Gamification Feedback
            if (response.data.newBadges && response.data.newBadges.length > 0) {
                response.data.newBadges.forEach((badge: string) => {
                    showAchievement('Nova Conquista!', `Você desbloqueou a medalha: ${badge}`);
                });
            }

            if (response.data.zionsEarned) {
                showAchievement('Recompensa!', `Você ganhou ${response.data.zionsEarned} Zions!`);
                updateUserZions(response.data.zionsEarned);
            }

            if (response.data.user) {
                updateUser(response.data.user);
            }

            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        isLiked: response.data.isLiked,
                        likes: response.data.isLiked ? post.likes + 1 : post.likes - 1
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error('Failed to like post', error);
        }
    };

    const highlightedPosts = posts.filter(post => post.isHighlight);
    const regularPosts = posts.filter(post => !post.isHighlight);

    const themeIconColor = isMGT ? 'text-emerald-500' : 'text-gold-400';
    const themeIconBg = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';

    const themeTextHover = isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300';


    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
            <LuxuriousBackground />
            {!viewingStoryId && <Header onOpenShop={() => setIsShopOpen(true)} />}

            <ToastNotification
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type={toast.type}
            />

            <CommentsModal
                isOpen={!!activeCommentPostId}
                onClose={() => setActiveCommentPostId(null)}
                postId={activeCommentPostId || ''}
                onCommentAdded={fetchPosts}
            />

            <NewMembersModal
                isOpen={isNewMembersOpen}
                onClose={() => setIsNewMembersOpen(false)}
            />

            <EventsModal
                isOpen={isEventsOpen}
                onClose={() => setIsEventsOpen(false)}
            />

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, postId: null })}
                onConfirm={handleDeletePost}
                title="Deletar Postagem"
                message="Tem certeza que deseja remover esta postagem permanentemente? Esta ação não pode ser desfeita."
                confirmText="Deletar"
                isDestructive={true}
            />

            <RecommendationsDrawer
                isOpen={isRecommendationsOpen}
                onClose={() => setIsRecommendationsOpen(false)}
                dailyLoginStatus={dailyLoginStatus}
                openDailyLoginModal={openDailyLoginModal}
            />

            <CustomizationShop
                isOpen={isShopOpen}
                onClose={() => setIsShopOpen(false)}
            />

            <div className="max-w-7xl mx-auto pt-40 sm:pt-44 md:pt-48 pb-32 px-3 sm:px-4 md:px-6 flex gap-8 relative z-10">
                {/* Main Feed Column */}
                <main className="flex-1 max-w-2xl mx-auto space-y-8">
                    {/* Welcome Header */}
                    <div className="mb-8 animate-fade-in-down">
                        <h1 className={`text-3xl md:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r ${themeTextGradient} mb-2`}>
                            Bem vindo, {user?.name?.split(' ')[0] || 'Membro'}
                        </h1>
                        <p className="text-gray-400 text-lg font-light tracking-wide">
                            {isMGT ? 'Seu feed exclusivo do Machine Gold Team' : 'Seu feed exclusivo do Magazine'}
                        </p>
                    </div>

                    {/* Stories Bar */}
                    <div className="mb-8 animate-fade-in">
                        <StoriesBar
                            viewingStoryId={viewingStoryId}
                            onViewStory={setViewingStoryId}
                            onCloseStory={() => setViewingStoryId(null)}
                            onEditorStateChange={setIsStoryEditorOpen}
                        />
                    </div>

                    {/* SRT Log Card - Mobile Only (Below Stories) */}
                    <div className="lg:hidden mb-8 transform active:scale-95 transition-transform duration-300">
                        <AnnouncementCard />
                    </div>

                    {/* Feed Carousel & Feed Items */}
                    {loading ? (
                        <ModernLoader />
                    ) : (
                        <>
                            {highlightedPosts.length > 0 && (
                                <FeedCarousel posts={highlightedPosts.map(p => ({
                                    id: p.id,
                                    title: p.content,
                                    image: p.image,
                                    category: p.tags[0] || 'DESTAQUE',
                                    author: p.author
                                }))} />
                            )}

                            {posts.length === 0 ? (
                                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm animate-fade-in">
                                    <Sparkles className={`w-12 h-12 ${isMGT ? 'text-emerald-500/30' : 'text-gold-500/30'} mx-auto mb-4`} />
                                    <p className="text-gray-400 font-serif text-xl">Nenhuma postagem no momento</p>
                                    <p className="text-gray-600 text-sm mt-2">Seja o primeiro a compartilhar algo exclusivo.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {regularPosts.map(post => (
                                        <FeedItem
                                            key={post.id}
                                            id={post.id}
                                            image={post.image || post.video}
                                            title={post.content}
                                            category={post.tags[0] || 'GERAL'}
                                            author={post.author.name}
                                            authorAvatar={post.author.avatarUrl}
                                            authorId={post.author.id}
                                            likes={post.likes}
                                            comments={post.comments}
                                            isLiked={post.isLiked}
                                            onLike={() => handleLike(post.id)}
                                            onComment={() => setActiveCommentPostId(post.id)}
                                            onDelete={() => setDeleteModal({ isOpen: true, postId: post.id })}
                                            onShare={() => handleShare(post.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Right Sidebar (Desktop Only) */}
                <aside className="hidden lg:block w-80 space-y-6 sticky top-24 h-fit animate-fade-in-left">
                    {/* Daily Login Card */}
                    <div className="mb-10">
                        <DailyLoginCard status={dailyLoginStatus} onClick={openDailyLoginModal} />
                    </div>

                    {/* Online Friends Card */}
                    <div className="mb-6">
                        <OnlineFriendsCard maxDisplay={5} />
                    </div>

                    {/* SRT LOG Promotion Card - Featured at Top */}
                    <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
                        <AnnouncementCard />
                    </div>

                    {/* What's New Card */}
                    <div className="mb-6">
                        <WhatsNewCard />
                    </div>

                    {/* Photo Catalog Link */}
                    <Link to="/catalog">
                        <div className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 hover:border-emerald-500/50' : 'border-gold-500/20 hover:border-gold-500/50'} transition-all duration-300 group cursor-pointer mb-6 relative overflow-hidden`}>
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'}`} />
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h4 className={`font-medium text-white ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>Catálogo de Fotos</h4>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed relative z-10">
                                Explore a galeria exclusiva e baixe fotos em alta resolução.
                            </p>
                        </div>
                    </Link>

                    {/* Highlights Link */}
                    <Link to="/highlights">
                        <div className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 hover:border-white/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 group cursor-pointer`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h4 className={`font-medium text-white ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>Destaques da Semana</h4>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Confira os posts mais curtidos e comentados pelos membros da elite.
                            </p>
                        </div>
                    </Link>

                    {/* New Members Button */}
                    <div
                        onClick={() => setIsNewMembersOpen(true)}
                        className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 hover:border-white/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 group cursor-pointer`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                <Users className="w-5 h-5" />
                            </div>
                            <h4 className={`font-medium text-white ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>Novos Membros</h4>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Dê as boas-vindas aos novos integrantes da nossa comunidade exclusiva.
                        </p>
                    </div>

                    {/* Events Button */}
                    <div
                        onClick={() => setIsEventsOpen(true)}
                        className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 hover:border-white/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 group cursor-pointer`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h4 className={`font-medium text-white ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>Eventos Exclusivos</h4>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Fique por dentro dos próximos encontros e experiências {isMGT ? 'MGT' : 'Magazine'}.
                        </p>
                    </div>
                </aside>
            </div>

            {/* Create Post Widget (Fixed Bottom) - Hide when viewing stories or editing story */}
            {!viewingStoryId && !isStoryEditorOpen && <CreatePostWidget onPostCreated={handlePostCreated} />}
        </div>
    );
}
