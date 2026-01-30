import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import FeedItem from '../components/FeedItem';
import ModernLoader from '../components/ModernLoader';
import CommentsModal from '../components/CommentsModal';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


export default function PostPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showAchievement, updateUserZions } = useAuth();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Try to fetch specific post first
                const response = await api.get(`/posts/${id}`);
                const p = response.data;
                
                setPost({
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
                    likes: p.likesCount || p.likes?.length || 0,
                    comments: p.commentsCount || 0,
                    timestamp: p.createdAt,
                    isHighlight: p.isHighlight,
                    tags: p.tags?.map((t: any) => t.tag) || [],
                    likedBy: p.isLiked ? ['me'] : [],
                    pollQuestion: p.pollQuestion,
                    pollOptions: p.pollOptions,
                    userVote: p.userVote
                });
            } catch (error) {
                console.error('Failed to fetch post', error);
                // Fallback: try feed
                try {
                    const feedRes = await api.get('/feed?limit=50');
                    const foundPost = feedRes.data.find((p: any) => p.id === id);
                    if (foundPost) {
                        setPost({
                            id: foundPost.id,
                            author: {
                                id: foundPost.user.id,
                                name: foundPost.user.displayName || foundPost.user.name,
                                avatarUrl: foundPost.user.avatarUrl,
                                trophies: foundPost.user.trophies || 0,
                                membershipType: foundPost.user.membershipType,
                                equippedProfileBorder: foundPost.user.equippedProfileBorder
                            },
                            content: foundPost.caption || '',
                            image: foundPost.imageUrl,
                            video: foundPost.videoUrl,
                            likes: foundPost.likesCount || 0,
                            comments: foundPost.commentsCount || 0,
                            timestamp: foundPost.createdAt,
                            isHighlight: foundPost.isHighlight,
                            tags: foundPost.tags?.map((t: any) => t.tag) || [],
                            likedBy: foundPost.isLiked ? ['me'] : []
                        });
                    }
                } catch (feedError) {
                    console.error('Failed to fetch from feed too', feedError);
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPost();
    }, [id]);

    if (loading) return <ModernLoader fullScreen />;
    if (!post) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Post não encontrado</div>;

    const handleLike = async () => {
        try {
            const response = await api.post(`/feed/${id}/like`);
            setPost((prev: any) => ({
                ...prev,
                likes: response.data.likesCount,
                likedBy: response.data.isLiked ? ['me'] : []
            }));

            if (response.data.newBadges?.length > 0) {
                response.data.newBadges.forEach((badge: string) => {
                    showAchievement('Nova Conquista!', `Você desbloqueou a medalha: ${badge}`);
                });
            }

            if (response.data.zionsEarned) {
                showAchievement('Recompensa!', `Você ganhou ${response.data.zionsEarned} Zions!`);
                updateUserZions(response.data.zionsEarned);
            }
        } catch (error) {
            console.error('Failed to like post', error);
        }
    };

    const handleCommentAdded = () => {
        setPost((prev: any) => ({
            ...prev,
            comments: prev.comments + 1
        }));
    };

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
            <LuxuriousBackground />
            <Header />

            <div className="max-w-4xl mx-auto pt-32 pb-32 px-4 relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </button>

                <div className="animate-fade-in-up">
                    <FeedItem
                        id={post.id}
                        image={post.image}
                        video={post.video}
                        title={post.content}
                        category={post.tags[0] || 'GERAL'}
                        author={post.author.name}
                        authorAvatar={post.author.avatarUrl}
                        authorId={post.author.id}
                        likes={post.likes}
                        comments={post.comments}
                        isLiked={post.likedBy?.includes('me')}
                        isHighlight={post.isHighlight}
                        onLike={handleLike}
                        onComment={() => setShowComments(true)}
                        onDelete={() => { }}
                        onShare={() => { }}
                        isExpanded={true}
                    />
                </div>

                {/* Comments Modal */}
                <CommentsModal
                    isOpen={showComments}
                    onClose={() => setShowComments(false)}
                    postId={post.id}
                    onCommentAdded={handleCommentAdded}
                />
            </div>
        </div>
    );
}
