import { useState, useEffect } from 'react';
import { X, Send, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Comment {
    id: string;
    content: string;
    author: {
        name: string;
        avatarUrl: string;
    };
    createdAt: string;
}

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    onCommentAdded: () => void;
}

export default function CommentsModal({ isOpen, onClose, postId, onCommentAdded }: CommentsModalProps) {
    const { user, showAchievement, updateUserZions, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const themeBorder = isMGT
        ? (theme === 'light' ? 'border-red-200' : 'border-red-500/20')
        : (theme === 'light' ? 'border-gold-200' : 'border-gold-500/20');
    const themeText = isMGT ? 'text-emerald-500' : 'text-gold-400';
    const themeTextSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const themeInputBg = theme === 'light' ? 'bg-gray-100' : 'bg-white/5';
    const themeInputText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeButton = isMGT ? 'bg-emerald-600 hover:bg-red-500 text-white' : 'bg-gold-500 hover:bg-gold-400 text-black';
    const themeCommentBg = theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/5 border-white/5';

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/posts/${postId}/comments`);
            const mappedComments = response.data.map((c: any) => ({
                id: c.id,
                content: c.text,
                author: {
                    name: c.user?.displayName || c.user?.name || 'Usuário Desconhecido',
                    avatarUrl: c.user?.avatarUrl
                },
                createdAt: c.createdAt
            }));
            setComments(mappedComments);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            const response = await api.post(`/posts/${postId}/comments`, { text: newComment });

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

            setNewComment('');
            fetchComments();
            onCommentAdded();
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-lg ${themeBg} border ${themeBorder} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-black/40'}`}>
                    <h3 className={`text-lg font-serif ${themeText}`}>Comentários</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Fechar">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gold-500/20 scrollbar-track-transparent">
                    {loading ? (
                        <div className={`text-center py-8 ${themeTextSecondary} animate-pulse`}>Carregando...</div>
                    ) : comments.length === 0 ? (
                        <div className={`text-center py-8 ${themeTextSecondary}`}>Seja o primeiro a comentar!</div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'} overflow-hidden shrink-0`}>
                                    {comment.author.avatarUrl ? (
                                        <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className={`w-4 h-4 ${themeText}`} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`${themeCommentBg} rounded-2xl rounded-tl-none p-3 border`}>
                                        <p className={`text-xs ${themeText} font-bold mb-1`}>{comment.author.name}</p>
                                        <p className={`text-sm ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>{comment.content}</p>
                                    </div>
                                    <p className={`text-[10px] ${themeTextSecondary} mt-1 ml-2`}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className={`p-4 border-t ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-black/40'} flex gap-2`}>
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreva um comentário..."
                        className={`flex-1 ${themeInputBg} border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} rounded-full px-4 py-2 text-sm ${themeInputText} focus:outline-none focus:border-opacity-50 transition-colors placeholder-gray-500`}
                    />
                    <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className={`p-2 ${themeButton} rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                        aria-label="Enviar comentário"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 ml-0.5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
