import { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [isMobile, setIsMobile] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Theme colors - Apple Vision Pro style
    const glassStyle = theme === 'light' 
        ? 'bg-white/80 backdrop-blur-2xl border-white/50' 
        : 'bg-black/40 backdrop-blur-2xl border-white/10';
    const commentBubble = theme === 'light'
        ? (isMGT ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100')
        : (isMGT ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10');
    const accentGradient = isMGT 
        ? 'from-emerald-500 to-teal-400' 
        : 'from-amber-500 to-yellow-400';

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
            setTimeout(() => inputRef.current?.focus(), 300);
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

    const formatTimeAgo = (dateStr: string): string => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffSec < 60) return 'Agora';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal - Bottom Sheet on Mobile, Centered on Desktop */}
                    <motion.div
                        initial={isMobile 
                            ? { y: '100%', opacity: 1 } 
                            : { scale: 0.9, opacity: 0, y: 20 }
                        }
                        animate={isMobile 
                            ? { y: 0, opacity: 1 } 
                            : { scale: 1, opacity: 1, y: 0 }
                        }
                        exit={isMobile 
                            ? { y: '100%', opacity: 1 } 
                            : { scale: 0.95, opacity: 0, y: 10 }
                        }
                        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                        className={`fixed z-[70] ${
                            isMobile 
                                ? 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl pb-20' 
                                : 'inset-0 flex items-center justify-center pointer-events-none'
                        }`}
                    >
                        <div className={`${!isMobile ? 'w-full max-w-lg max-h-[80vh] rounded-3xl pointer-events-auto' : 'w-full h-full'} ${glassStyle} border shadow-2xl overflow-hidden flex flex-col`}
                            style={{
                                boxShadow: isMGT 
                                    ? '0 25px 50px -12px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.1)'
                                    : '0 25px 50px -12px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.1)'
                            }}
                        >
                        {/* Mobile Handle Bar */}
                        {isMobile && (
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 rounded-full bg-gray-400/50" />
                            </div>
                        )}

                        {/* Header */}
                        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === 'light' ? 'border-gray-100' : 'border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-gradient-to-br ${accentGradient} shadow-lg`}>
                                    <MessageCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        Comentários
                                    </h3>
                                    <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className={`p-2 rounded-full transition-all ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                            >
                                <X className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-500/20 scrollbar-track-transparent">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className={`w-10 h-10 border-3 rounded-full animate-spin ${isMGT ? 'border-emerald-500/30 border-t-emerald-500' : 'border-amber-500/30 border-t-amber-500'}`} />
                                    <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Carregando...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                                        <MessageCircle className={`w-8 h-8 ${isMGT ? 'text-emerald-500/50' : 'text-amber-500/50'}`} />
                                    </div>
                                    <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Seja o primeiro a comentar!
                                    </p>
                                </div>
                            ) : (
                                comments.map((comment, index) => (
                                    <motion.div 
                                        key={comment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex gap-3"
                                    >
                                        <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ${isMGT ? 'ring-emerald-500/30' : 'ring-amber-500/30'}`}>
                                            {comment.author.avatarUrl ? (
                                                <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${isMGT ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                                    <User className={`w-5 h-5 ${isMGT ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className={`${commentBubble} rounded-2xl rounded-tl-md p-4 border shadow-sm`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className={`text-sm font-semibold truncate ${isMGT ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {comment.author.name}
                                                    </p>
                                                    <span className={`text-[10px] ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        • {formatTimeAgo(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Input Area - Apple Vision Pro style */}
                        <form 
                            onSubmit={handleSubmit} 
                            className={`p-4 border-t ${theme === 'light' ? 'border-gray-100 bg-gray-50/80' : 'border-white/5 bg-black/20'}`}
                        >
                            <div className={`flex items-center gap-3 p-2 rounded-2xl ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Escreva um comentário..."
                                    className={`flex-1 px-3 py-2 bg-transparent text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'} focus:outline-none placeholder-gray-400`}
                                />
                                <motion.button
                                    type="submit"
                                    disabled={submitting || !newComment.trim()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`p-3 rounded-xl bg-gradient-to-br ${accentGradient} text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                                    style={{
                                        boxShadow: newComment.trim() 
                                            ? (isMGT ? '0 4px 15px rgba(16, 185, 129, 0.4)' : '0 4px 15px rgba(245, 158, 11, 0.4)')
                                            : 'none'
                                    }}
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </motion.button>
                            </div>
                        </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
