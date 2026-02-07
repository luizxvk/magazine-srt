import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import FeedItem from '../components/FeedItem';
import LuxuriousBackground from '../components/LuxuriousBackground';
import FeedCarousel from '../components/FeedCarousel';
import CommentsModal from '../components/CommentsModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ChevronDown, Settings } from 'lucide-react';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';
import ModernLoader from '../components/ModernLoader';
import { TimelineAnimation, feedItemVariants } from '../components/TimelineAnimation';

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
import CreatePostCard from '../components/CreatePostCard';
import SupplyBoxModal from '../components/SupplyBoxModal';
import EventDropPopup from '../components/EventDropPopup';
import ElitePromoCard from '../components/ElitePromoCard';
import WelcomeCard from '../components/WelcomeCard';

interface PollOption {
    id: string;
    text: string;
    voteCount: number;
    percentage: number;
}

interface Poll {
    question: string;
    options: PollOption[];
    totalVotes: number;
    userVotedOptionId: string | null;
}

interface Post {
    id: string;
    author: {
        id: string;
        name: string;
        avatarUrl: string;
        trophies: number;
        membershipType?: string;
        equippedProfileBorder?: string | null;
        isElite?: boolean;
        eliteUntil?: string | null;
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
    poll?: Poll | null;
    linkedProduct?: {
        id: string;
        name: string;
        imageUrl: string | null;
        priceZions: number | null;
        priceBRL: number | null;
    } | null;
}

export default function FeedPage() {
    const { user, dailyLoginStatus, openDailyLoginModal, showAchievement, updateUserZions, updateUser } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [toast, setToast] = useState({ message: '', isVisible: false, type: 'success' as 'success' | 'error' | 'info' });

    const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
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
    const [isSupplyBoxOpen, setIsSupplyBoxOpen] = useState(false);
    const [showEventDropPopup, setShowEventDropPopup] = useState(false);

    // Check URL params to auto-open events modal (from push notification)
    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        if (searchParams.get('openEvents') === 'true') {
            setIsEventsOpen(true);
            // Remove the query param after opening
            searchParams.delete('openEvents');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const fetchPosts = async (silent = false, page = 1, append = false) => {
        try {
            if (!silent && !append) setLoading(true);
            if (append) setLoadingMore(true);
            
            const response = await api.get(`/feed?page=${page}&limit=10`);
            const mappedPosts = response.data.map((p: any) => ({
                id: p.id,
                author: {
                    id: p.user.id,
                    name: p.user.displayName || p.user.name,
                    avatarUrl: p.user.avatarUrl,
                    trophies: p.user.trophies || 0,
                    membershipType: p.user.membershipType,
                    equippedProfileBorder: p.user.equippedProfileBorder
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
                poll: p.poll ? {
                    ...p.poll,
                    options: p.poll.options.map((opt: any) => ({
                        ...opt,
                        voteCount: opt.votesCount ?? opt.voteCount ?? 0,
                        percentage: opt.percentage ?? 0
                    }))
                } : null,
                linkedProduct: p.linkedProduct || null
            }));
            
            if (append) {
                setPosts(prev => [...prev, ...mappedPosts]);
            } else {
                setPosts(mappedPosts);
            }
            
            // Check if there are more posts
            setHasMore(mappedPosts.length === 10);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            if (!silent && !append) setLoading(false);
            if (append) setLoadingMore(false);
        }
    };
    
    const loadMorePosts = async () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        await fetchPosts(true, nextPage, true);
    };

    useEffect(() => {
        fetchPosts(false, 1, false);
        const interval = setInterval(() => {
            fetchPosts(true, 1, false);
        }, 30000); // Poll every 30s for real-time updates

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

    // Check for available event drops
    useEffect(() => {
        const checkEventDrops = async () => {
            try {
                const { data } = await api.get('/events/available-drops');
                if (data && data.length > 0) {
                    // Delay the popup slightly so it doesn't interrupt initial load
                    setTimeout(() => setShowEventDropPopup(true), 2000);
                }
            } catch (err) {
                // Silent fail - drops are optional
            }
        };

        // Check after posts load
        if (!loading && user) {
            checkEventDrops();
        }
    }, [loading, user]);

    const handlePostCreated = () => {
        fetchPosts();
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, isVisible: true, type });
    };

    const handleShare = (postId: string | number) => {
        navigator.clipboard.writeText(`https://magazine-srt.vercel.app/api/og/post/${postId}`);
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
                        dailyLoginStatus={dailyLoginStatus}
                    />
                    {/* Main Feed Column */}
                    <main className="flex-1 max-w-2xl mx-auto space-y-8 w-full">
                        {/* Welcome Card with Stories (toggleable) */}
                        {user?.showWelcomeCard !== false && (
                            <TimelineAnimation animationNum={0} className="mb-8">
                                <WelcomeCard
                                    viewingStoryId={viewingStoryId}
                                    onViewStory={setViewingStoryId}
                                    onCloseStory={() => setViewingStoryId(null)}
                                />
                            </TimelineAnimation>
                        )}

                        {/* Simple header + Stories Bar when WelcomeCard disabled */}
                        {user?.showWelcomeCard === false && (
                            <>
                                <TimelineAnimation animationNum={0} className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className={`text-2xl md:text-3xl font-serif ${isMGT ? 'text-white' : 'text-gold-400'}`}>
                                                Bem vindo, {user?.name?.split(' ')[0] || 'Membro'}
                                            </h1>
                                        </div>
                                        <Link
                                            to="/settings"
                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 transition-all"
                                            title="Configurações"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </TimelineAnimation>
                                <TimelineAnimation animationNum={1} className="mb-6 relative z-10">
                                    <StoriesBar
                                        viewingStoryId={viewingStoryId}
                                        onViewStory={setViewingStoryId}
                                        onCloseStory={() => setViewingStoryId(null)}
                                    />
                                </TimelineAnimation>
                            </>
                        )}

                        {/* Create Post Card - Right after welcome */}
                        <TimelineAnimation animationNum={2}>
                            <CreatePostCard onPostCreated={handlePostCreated} />
                        </TimelineAnimation>

                        {/* Mobile Carousel - Quick Access Cards */}
                        <TimelineAnimation animationNum={3} className="mb-8 lg:hidden">
                            <MobileCarousel
                                dailyLoginStatus={dailyLoginStatus}
                                onDailyLoginClick={openDailyLoginModal}
                                onNewMembersClick={() => setIsNewMembersOpen(true)}
                                onEventsClick={() => setIsEventsOpen(true)}
                                onSupplyBoxClick={() => setIsSupplyBoxOpen(true)}
                            />
                        </TimelineAnimation>

                        {/* SRT Log Card - Mobile Only */}
                        <TimelineAnimation animationNum={4} className="xl:hidden mb-8">
                            <AnnouncementCard />
                        </TimelineAnimation>

                        {/* Feed Carousel & Feed Items */}
                        {loading ? (
                            <ModernLoader />
                        ) : (
                            <>
                                {highlightedPosts.length > 0 && (
                                    <TimelineAnimation animationNum={5}>
                                        <FeedCarousel posts={highlightedPosts.map(p => ({
                                            id: p.id,
                                            title: p.content,
                                            image: p.image,
                                            category: p.tags[0] || 'DESTAQUE',
                                            author: p.author,
                                            linkedProduct: p.linkedProduct || null
                                        }))} />
                                    </TimelineAnimation>
                                )}

                                {posts.length === 0 ? (
                                    <TimelineAnimation animationNum={6}>
                                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                            <Sparkles className={`w-12 h-12 ${isMGT ? 'text-emerald-500/30' : 'text-gold-500/30'} mx-auto mb-4`} />
                                            <p className="text-gray-400 font-serif text-xl">Nenhuma postagem no momento</p>
                                            <p className="text-gray-600 text-sm mt-2">Seja o primeiro a compartilhar algo exclusivo.</p>
                                        </div>
                                    </TimelineAnimation>
                                ) : (
                                    <div className="space-y-6">
                                        {regularPosts.map((post, index) => (
                                            <TimelineAnimation 
                                                key={post.id}
                                                animationNum={index}
                                                customVariants={feedItemVariants}
                                            >
                                                <FeedItem
                                                    id={post.id}
                                                    image={post.image}
                                                    video={post.video}
                                                    title={post.content}
                                                    category={post.tags[0] || 'GERAL'}
                                                    author={post.author.name}
                                                    authorAvatar={post.author.avatarUrl}
                                                    authorId={post.author.id}
                                                    authorProfileBorder={post.author.equippedProfileBorder}
                                                    authorMembershipType={post.author.membershipType}
                                                    authorIsElite={post.author.isElite}
                                                    authorEliteUntil={post.author.eliteUntil}
                                                    likes={post.likes}
                                                    comments={post.comments}
                                                    isLiked={post.isLiked}
                                                    isHighlight={post.isHighlight}
                                                    poll={post.poll}
                                                    onLike={() => handleLike(post.id)}
                                                    onComment={() => setActiveCommentPostId(post.id)}
                                                    onDelete={() => setDeleteModal({ isOpen: true, postId: post.id })}
                                                    onShare={() => handleShare(post.id)}
                                                    onPollVote={(postId, optionId) => {
                                                        // Update local state after vote
                                                        setPosts(prev => prev.map(p => {
                                                            if (p.id !== postId || !p.poll) return p;
                                                            const totalVotes = (p.poll.totalVotes || 0) + 1;
                                                            return {
                                                                ...p,
                                                                poll: {
                                                                    ...p.poll,
                                                                    totalVotes,
                                                                    userVotedOptionId: optionId,
                                                                    options: p.poll.options.map(opt => {
                                                                        const currentVotes = opt.voteCount || 0;
                                                                        const newVoteCount = opt.id === optionId ? currentVotes + 1 : currentVotes;
                                                                        const percentage = totalVotes > 0 ? Math.round((newVoteCount / totalVotes) * 100) : 0;
                                                                        return {
                                                                            ...opt,
                                                                            voteCount: newVoteCount,
                                                                            percentage: isNaN(percentage) ? 0 : percentage
                                                                        };
                                                                    })
                                                                }
                                                            };
                                                        }));
                                                    }}
                                                />
                                            </TimelineAnimation>
                                        ))}
                                        
                                        {/* Load More Button */}
                                        {hasMore && regularPosts.length > 0 && (
                                            <div className="flex justify-center pt-4 pb-8">
                                                <button
                                                    onClick={loadMorePosts}
                                                    disabled={loadingMore}
                                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                                                        isMGT
                                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/20'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <Loader size="sm" />
                                                            Carregando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            Carregar Mais
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
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

                        {/* Elite Promo Card - Apple Vision Pro style */}
                        <ElitePromoCard />

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

            {/* Modals */}
            <NewMembersModal isOpen={isNewMembersOpen} onClose={() => setIsNewMembersOpen(false)} />
            <EventsModal isOpen={isEventsOpen} onClose={() => setIsEventsOpen(false)} />
            <SupplyBoxModal 
                isOpen={isSupplyBoxOpen} 
                onClose={() => setIsSupplyBoxOpen(false)} 
            />
            
            {showEventDropPopup && (
                <EventDropPopup onClose={() => setShowEventDropPopup(false)} />
            )}
        </div>
    );
}
