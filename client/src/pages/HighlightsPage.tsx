import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import LuxuriousBackground from '../components/LuxuriousBackground';

interface HighlightPost {
    id: string;
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
    likesCount: number;
    commentsCount: number;
    user: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    isLiked: boolean;
}

export default function HighlightsPage() {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [posts, setPosts] = useState<HighlightPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHighlights();
    }, []);

    const fetchHighlights = async () => {
        try {
            const response = await api.get('/feed/highlights');
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to fetch highlights', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-white font-sans relative">
            <LuxuriousBackground />

            <div className="max-w-7xl mx-auto pt-24 px-4 relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/feed" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" title="Voltar ao Feed">
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className={`text-3xl font-serif ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                        Destaques da Semana
                    </h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {posts.map((post, index) => (
                            <div key={post.id} className="glass-panel group relative overflow-hidden rounded-xl aspect-[4/5] hover:scale-[1.02] transition-transform duration-300">
                                {(post.imageUrl || post.videoUrl) ? (
                                    <img
                                        src={post.imageUrl || post.videoUrl}
                                        alt={post.caption}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                                        Sem mídia
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index < 3 ? 'bg-gold-500 text-black' : 'bg-white/20 text-white'}`}>
                                            #{index + 1}
                                        </div>
                                        <h3 className="font-medium text-white truncate max-w-[150px]">{post.user.name}</h3>
                                    </div>
                                    <p className="text-gray-300 text-sm line-clamp-2 mb-4">{post.caption}</p>
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
