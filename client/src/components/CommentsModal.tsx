import { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageCircle, Heart, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CommentAuthor {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl: string;
    equippedColor?: string;
    membershipType?: 'MAGAZINE' | 'MGT';
}

interface CommentReply {
    id: string;
    text: string;
    user: CommentAuthor;
    createdAt: string;
    likesCount: number;
    isLikedByMe: boolean;
}

interface Comment {
    id: string;
    text: string;
    user: CommentAuthor;
    createdAt: string;
    likesCount: number;
    isLikedByMe: boolean;
    replies: CommentReply[];
}

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    onCommentAdded: () => void;
}

export default function CommentsModal({ isOpen, onClose, postId, onCommentAdded }: CommentsModalProps) {
    const { user, showAchievement, updateUserZions, theme, showEdgeNotification } = useAuth();
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
    const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [likingComment, setLikingComment] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
            setTimeout(() => inputRef.current?.focus(), 300);
        }
        // Reset state when modal closes
        if (!isOpen) {
            setReplyingTo(null);
            setNewComment('');
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/posts/${postId}/comments`);
            setComments(response.data);
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
            
            if (replyingTo) {
                // Submit reply
                await api.post(`/posts/${postId}/comments/${replyingTo.id}/reply`, { text: newComment });
                setReplyingTo(null);
                // Auto-expand replies for the parent comment
                setExpandedReplies(prev => new Set([...prev, replyingTo.id]));
            } else {
                // Submit new comment
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
            }

            setNewComment('');
            fetchComments();
            onCommentAdded();
        } catch (error: any) {
            if (error.response?.status === 429 && error.response?.data?.error === 'COMMENT_RATE_LIMIT') {
                showEdgeNotification(
                    'warning',
                    'Limite de Comentários',
                    error.response.data.message || 'Você atingiu o limite de 10 comentários por hora.',
                    { duration: 6000 }
                );
            } else {
                console.error('Failed to add comment', error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId: string) => {
        if (likingComment) return;
        
        try {
            setLikingComment(commentId);
            const response = await api.post(`/posts/${postId}/comments/${commentId}/like`);
            
            // Update local state
            setComments(prevComments => 
                prevComments.map(comment => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            likesCount: response.data.likesCount,
                            isLikedByMe: response.data.liked
                        };
                    }
                    // Check replies
                    return {
                        ...comment,
                        replies: comment.replies.map(reply => 
                            reply.id === commentId 
                                ? { ...reply, likesCount: response.data.likesCount, isLikedByMe: response.data.liked }
                                : reply
                        )
                    };
                })
            );
        } catch (error) {
            console.error('Failed to like comment', error);
        } finally {
            setLikingComment(null);
        }
    };

    const handleReply = (commentId: string, authorName: string) => {
        setReplyingTo({ id: commentId, authorName });
        inputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setNewComment('');
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const getTotalComments = () => {
        return comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
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
                                        {getTotalComments()} {getTotalComments() === 1 ? 'comentário' : 'comentários'}
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
                                comments.map((comment, index) => {
                                    const authorName = comment.user?.displayName || comment.user?.name || 'Usuário';
                                    const authorMGT = comment.user?.membershipType === 'MGT';
                                    const hasReplies = comment.replies && comment.replies.length > 0;
                                    const isExpanded = expandedReplies.has(comment.id);

                                    return (
                                        <motion.div 
                                            key={comment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="space-y-2"
                                        >
                                            {/* Main Comment */}
                                            <div className="flex gap-3">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ${authorMGT ? 'ring-emerald-500/30' : 'ring-amber-500/30'}`}>
                                                    {comment.user?.avatarUrl ? (
                                                        <img src={comment.user.avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center ${authorMGT ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                                            <User className={`w-5 h-5 ${authorMGT ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className={`${commentBubble} rounded-2xl rounded-tl-md p-4 border shadow-sm`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p 
                                                                className="text-sm font-semibold truncate"
                                                                style={{ color: comment.user?.equippedColor || (authorMGT ? '#10b981' : '#f59e0b') }}
                                                            >
                                                                {authorName}
                                                            </p>
                                                            <span className={`text-[10px] ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                • {formatTimeAgo(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
                                                            {comment.text}
                                                        </p>
                                                    </div>

                                                    {/* Actions Row */}
                                                    <div className="flex items-center gap-4 mt-2 ml-1">
                                                        {/* Like button */}
                                                        <button
                                                            onClick={() => handleLikeComment(comment.id)}
                                                            disabled={likingComment === comment.id}
                                                            className={`flex items-center gap-1.5 text-xs transition-all ${
                                                                comment.isLikedByMe
                                                                    ? 'text-red-500'
                                                                    : theme === 'light' ? 'text-gray-500 hover:text-red-500' : 'text-gray-400 hover:text-red-400'
                                                            }`}
                                                        >
                                                            <Heart className={`w-4 h-4 ${comment.isLikedByMe ? 'fill-current' : ''}`} />
                                                            {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
                                                        </button>

                                                        {/* Reply button */}
                                                        <button
                                                            onClick={() => handleReply(comment.id, authorName)}
                                                            className={`flex items-center gap-1.5 text-xs transition-all ${
                                                                theme === 'light' ? 'text-gray-500 hover:text-blue-500' : 'text-gray-400 hover:text-blue-400'
                                                            }`}
                                                        >
                                                            <Reply className="w-4 h-4" />
                                                            <span>Responder</span>
                                                        </button>

                                                        {/* Show replies button */}
                                                        {hasReplies && (
                                                            <button
                                                                onClick={() => toggleReplies(comment.id)}
                                                                className={`flex items-center gap-1 text-xs font-medium transition-all ${
                                                                    isMGT ? 'text-emerald-500 hover:text-emerald-400' : 'text-amber-500 hover:text-amber-400'
                                                                }`}
                                                            >
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                <span>{comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Replies Section */}
                                            <AnimatePresence>
                                                {hasReplies && isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="ml-8 pl-5 border-l-2 border-gray-300/30 space-y-3"
                                                    >
                                                        {comment.replies.map((reply, replyIndex) => {
                                                            const replyAuthorName = reply.user?.displayName || reply.user?.name || 'Usuário';
                                                            const replyAuthorMGT = reply.user?.membershipType === 'MGT';

                                                            return (
                                                                <motion.div
                                                                    key={reply.id}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: replyIndex * 0.05 }}
                                                                    className="flex gap-2"
                                                                >
                                                                    <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ${replyAuthorMGT ? 'ring-emerald-500/20' : 'ring-amber-500/20'}`}>
                                                                        {reply.user?.avatarUrl ? (
                                                                            <img src={reply.user.avatarUrl} alt={replyAuthorName} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className={`w-full h-full flex items-center justify-center ${replyAuthorMGT ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                                                                <User className={`w-4 h-4 ${replyAuthorMGT ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`${theme === 'light' ? 'bg-gray-100/80' : 'bg-white/5'} rounded-xl rounded-tl-sm p-3 border ${theme === 'light' ? 'border-gray-200/50' : 'border-white/5'}`}>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <p 
                                                                                    className="text-xs font-semibold truncate"
                                                                                    style={{ color: reply.user?.equippedColor || (replyAuthorMGT ? '#10b981' : '#f59e0b') }}
                                                                                >
                                                                                    {replyAuthorName}
                                                                                </p>
                                                                                <span className={`text-[10px] ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                    • {formatTimeAgo(reply.createdAt)}
                                                                                </span>
                                                                            </div>
                                                                            <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                                                                                {reply.text}
                                                                            </p>
                                                                        </div>

                                                                        {/* Reply Actions */}
                                                                        <div className="flex items-center gap-3 mt-1.5 ml-1">
                                                                            <button
                                                                                onClick={() => handleLikeComment(reply.id)}
                                                                                disabled={likingComment === reply.id}
                                                                                className={`flex items-center gap-1 text-[11px] transition-all ${
                                                                                    reply.isLikedByMe
                                                                                        ? 'text-red-500'
                                                                                        : theme === 'light' ? 'text-gray-400 hover:text-red-500' : 'text-gray-500 hover:text-red-400'
                                                                                }`}
                                                                            >
                                                                                <Heart className={`w-3.5 h-3.5 ${reply.isLikedByMe ? 'fill-current' : ''}`} />
                                                                                {reply.likesCount > 0 && <span>{reply.likesCount}</span>}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Replying Indicator */}
                        <AnimatePresence>
                            {replyingTo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className={`px-4 py-2 border-t ${theme === 'light' ? 'bg-blue-50 border-blue-100' : 'bg-blue-900/20 border-blue-500/20'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                                            Respondendo a <strong>{replyingTo.authorName}</strong>
                                        </span>
                                        <button
                                            onClick={cancelReply}
                                            className={`p-1 rounded-full ${theme === 'light' ? 'hover:bg-blue-100' : 'hover:bg-blue-500/20'}`}
                                        >
                                            <X className={`w-4 h-4 ${theme === 'light' ? 'text-blue-500' : 'text-blue-400'}`} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                                    placeholder={replyingTo ? `Responder ${replyingTo.authorName}...` : "Escreva um comentário..."}
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
