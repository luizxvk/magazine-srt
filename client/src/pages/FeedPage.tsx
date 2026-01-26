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
import { Sparkles, Settings } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';
import ModernLoader from '../components/ModernLoader';

import AnnouncementCard from '../components/AnnouncementCard';
import StoriesBar from '../components/StoriesBar';
import RecommendationsDrawer from '../components/RecommendationsDrawer';
import NewMembersModal from '../components/NewMembersModal';
import EventsModal from '../components/EventsModal';
import CustomizationShop from '../components/CustomizationShop';
import GroupChatCard from '../components/GroupChatCard';
import MarketCard from '../components/MarketCard';
import FeedbackFormCard from '../components/FeedbackFormCard';
import InventoryCard from '../components/InventoryCard';
import MobileCarousel from '../components/MobileCarousel';
import LeftSidebar from '../components/LeftSidebar';
import ToolsCarousel from '../components/ToolsCarousel';

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
    linkedProduct?: {
        id: string;
        name: string;
        imageUrl: string | null;
        priceZions: number | null;
        priceBRL: number | null;
    } | null;
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
                isLiked: p.isLiked || false,
                linkedProduct: p.linkedProduct || null
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

        // Event listener for opening radio from search
        const handleOpenRadio = () => {
            const radioElement = document.getElementById('radio-card');
            if (radioElement) {
                radioElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a highlight animation
                radioElement.classList.add('ring-4', 'ring-gold-500/50');
                setTimeout(() => {
                    radioElement.classList.remove('ring-4', 'ring-gold-500/50');
                }, 2000);
            }
        };

        window.addEventListener('openRadio', handleOpenRadio);

        return () => {
            clearInterval(interval);
            window.removeEventListener('openRadio', handleOpenRadio);
        };
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


    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative overflow-x-hidden">
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

            <div className="max-w-[1600px] mx-auto pt-40 sm:pt-44 md:pt-48 pb-32 px-4 sm:px-6 md:px-8 relative z-10">
                <div className="flex gap-6">
                    {/* Left Sidebar - Facebook Style */}
                    <LeftSidebar
                        onDailyLoginClick={openDailyLoginModal}
                        onNewMembersClick={() => setIsNewMembersOpen(true)}
                        onEventsClick={() => setIsEventsOpen(true)}
                    />
                    {/* Main Feed Column */}
                    <main className="flex-1 max-w-2xl mx-auto space-y-8 w-full">
                        {/* Welcome Header */}
                        <div className="mb-8 animate-fade-in-down">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className={`text-3xl md:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r ${themeTextGradient} mb-2`}>
                                        Bem vindo, {user?.name?.split(' ')[0] || 'Membro'}
                                    </h1>
                                    <p className="text-gray-400 text-lg font-light tracking-wide">
                                        {isMGT ? 'Seu feed exclusivo do Machine Gold Team' : 'Seu feed exclusivo do Magazine'}
                                    </p>
                                </div>
                                <Link
                                    to="/settings"
                                    className={`p-2 rounded-lg ${themeIconBg} ${themeIconColor} hover:opacity-80 transition-all duration-200`}
                                    title="Configurações"
                                >
                                    <Settings className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>

                        {/* Stories Bar */}
                        <div className="mb-6 animate-fade-in">
                            <StoriesBar
                                viewingStoryId={viewingStoryId}
                                onViewStory={setViewingStoryId}
                                onCloseStory={() => setViewingStoryId(null)}
                                onEditorStateChange={setIsStoryEditorOpen}
                            />
                        </div>

                        {/* Mobile Carousel - Quick Access Cards (below Stories) */}
                        <div className="mb-8 lg:hidden">
                            <MobileCarousel
                                dailyLoginStatus={dailyLoginStatus}
                                onDailyLoginClick={openDailyLoginModal}
                                onNewMembersClick={() => setIsNewMembersOpen(true)}
                                onEventsClick={() => setIsEventsOpen(true)}
                            />
                        </div>

                        {/* SRT Log Card - Mobile Only (Below Stories) */}
                        <div className="xl:hidden mb-8 transform active:scale-95 transition-transform duration-300">
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
                                        author: p.author,
                                        linkedProduct: p.linkedProduct
                                    }))} />
                                )}

                                {/* Inline Post Pill - Mobile Only (below carousel) */}
                                <div className="lg:hidden">
                                    <CreatePostWidget onPostCreated={handlePostCreated} inline />
                                </div>

                                {posts.length === 0 ? (
                                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm animate-fade-in">
                                        <Sparkles className={`w-12 h-12 ${isMGT ? 'text-emerald-500/30' : 'text-gold-500/30'} mx-auto mb-4`} />
                                        <p className="text-gray-400 font-serif text-xl">Nenhuma postagem no momento</p>
                                        <p className="text-gray-600 text-sm mt-2">Seja o primeiro a compartilhar algo exclusivo.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
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

                    {/* Right Sidebar (Desktop Only - hidden below xl/1280px) */}
                    <aside className="hidden xl:block w-72 space-y-4 sticky top-24 h-fit animate-fade-in-left">
                        {/* Tools Carousel - Radio, Discord, Steam, Twitch */}
                        <div id="radio-card" className="transition-all duration-300 rounded-2xl">
                            <ToolsCarousel />
                        </div>

                        {/* Market Card */}
                        <MarketCard />

                        {/* Inventory Card */}
                        <InventoryCard onOpenShop={() => setIsShopOpen(true)} />

                        {/* Group Chat Card */}
                        <GroupChatCard />

                        {/* Feedback Form Card */}
                        <FeedbackFormCard />

                        {/* SRT LOG Promotion Card */}
                        <div className="transform hover:scale-105 transition-transform duration-500">
                            <AnnouncementCard />
                        </div>
                    </aside>
                </div>
            </div>

            {/* Create Post Widget (Fixed Bottom - Desktop Only) - Hide when viewing stories or editing story */}
            {!viewingStoryId && !isStoryEditorOpen && (
                <div className="hidden lg:block">
                    <CreatePostWidget onPostCreated={handlePostCreated} />
                </div>
            )}

            {/* Modals */}
            <NewMembersModal isOpen={isNewMembersOpen} onClose={() => setIsNewMembersOpen(false)} />
            <EventsModal isOpen={isEventsOpen} onClose={() => setIsEventsOpen(false)} />
        </div>
    );
}
