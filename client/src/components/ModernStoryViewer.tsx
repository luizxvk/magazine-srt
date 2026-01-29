import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MoreVertical, Eye, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';

interface Story {
    id: string;
    imageUrl: string;
    user: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
    };
    createdAt: string;
    expiresAt: string;
    viewCount?: number;
}

interface StoryViewer {
    id: string;
    viewer: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
    };
    viewedAt: string;
}

interface ModernStoryViewerProps {
    stories: Story[];
    initialStoryIndex: number;
    onClose: () => void;
    onStoryViewed: (storyId: string) => void;
}

export default function ModernStoryViewer({ stories, initialStoryIndex, onClose, onStoryViewed }: ModernStoryViewerProps) {
    const { user, showToast } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);
    const [viewers, setViewers] = useState<StoryViewer[]>([]);
    const [showViewers, setShowViewers] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Group stories by user
    const storiesByUser = useMemo(() => {
        const grouped: { userId: string; user: Story['user']; stories: Story[] }[] = [];
        stories.forEach(story => {
            const existing = grouped.find(g => g.userId === story.user.id);
            if (existing) {
                existing.stories.push(story);
            } else {
                grouped.push({ userId: story.user.id, user: story.user, stories: [story] });
            }
        });
        return grouped;
    }, [stories]);

    // Find current user group and story index within that group
    const currentNavigation = useMemo(() => {
        let totalIndex = 0;
        for (let userIdx = 0; userIdx < storiesByUser.length; userIdx++) {
            const userStories = storiesByUser[userIdx].stories;
            for (let storyIdx = 0; storyIdx < userStories.length; storyIdx++) {
                if (totalIndex === currentIndex) {
                    return {
                        userIndex: userIdx,
                        storyIndexInUser: storyIdx,
                        totalStoriesForUser: userStories.length,
                        currentUserStories: userStories
                    };
                }
                totalIndex++;
            }
        }
        return { userIndex: 0, storyIndexInUser: 0, totalStoriesForUser: 1, currentUserStories: stories.slice(0, 1) };
    }, [currentIndex, storiesByUser, stories]);
    const currentStory = stories[currentIndex];
    const isMyStory = currentStory?.user.id === user?.id;
    const isAdmin = user?.role === 'ADMIN';
    const canDelete = isMyStory || isAdmin;
    const accentColor = isMGT ? 'emerald-500' : 'gold-500';

    // Emit event to hide/show bottom navigation when story viewer opens/closes
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('storyViewerStateChange', { detail: { isOpen: true } }));
        return () => {
            window.dispatchEvent(new CustomEvent('storyViewerStateChange', { detail: { isOpen: false } }));
        };
    }, []);

    useEffect(() => {
        if (currentStory) {
            onStoryViewed(currentStory.id);
            markStoryAsViewed(currentStory.id);
            if (isMyStory) {
                fetchViewers(currentStory.id);
            }
            // Reset like state and fetch current story like status
            setIsLiked(false);
            checkStoryLikeStatus(currentStory.id);
        }
    }, [currentStory?.id]);
    
    // Check if current user has liked this story
    const checkStoryLikeStatus = async (storyId: string) => {
        if (!isValidStoryId(storyId)) return;
        try {
            const response = await api.get(`/feed/stories/${storyId}/like-status`);
            setIsLiked(response.data.isLiked);
        } catch (error) {
            // Silently fail - assume not liked
            setIsLiked(false);
        }
    };

    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + 2;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [currentIndex, isPaused]);

    const isValidStoryId = (storyId: string | undefined): boolean => {
        // Check if ID is valid (not undefined, not empty, and not a local temporary ID)
        return !!storyId && storyId !== 'undefined' && !storyId.startsWith('story-local-');
    };

    const markStoryAsViewed = async (storyId: string) => {
        if (!isValidStoryId(storyId)) {
            console.log('Skipping view mark for temporary/invalid story ID:', storyId);
            return;
        }
        try {
            await api.post(`/feed/stories/${storyId}/view`);
        } catch (error: any) {
            // Silently ignore 404 errors (story was deleted or doesn't exist)
            if (error?.response?.status !== 404) {
                console.error('Error marking story as viewed:', error);
            }
        }
    };

    const fetchViewers = async (storyId: string) => {
        if (!isValidStoryId(storyId)) {
            console.log('Skipping viewers fetch for temporary/invalid story ID:', storyId);
            return;
        }
        try {
            const response = await api.get(`/feed/stories/${storyId}/viewers`);
            setViewers(response.data);
        } catch (error) {
            console.error('Error fetching viewers:', error);
        }
    };

    const handleNext = useCallback(() => {
        setTransitionDirection('right');
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    const handlePrevious = useCallback(() => {
        setTransitionDirection('left');
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    }, [currentIndex]);

    const handleDelete = async () => {
        if (!canDelete) return;
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/feed/stories/${currentStory.id}`);
            onClose();
        } catch (error) {
            console.error('Error deleting story:', error);
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentStory.imageUrl;
        link.download = `story-${currentStory.id}.jpg`;
        link.click();
    };

    const handleLike = async () => {
        try {
            await api.post(`/feed/stories/${currentStory.id}/like`);
            setIsLiked(!isLiked);
        } catch (error) {
            console.error('Error liking story:', error);
        }
    };

    const handleComment = () => {
        setShowCommentInput(true);
        setIsPaused(true);
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        
        try {
            // Send as direct message with story context
            await api.post('/messages', {
                receiverId: currentStory.user.id,
                content: commentText,
                storyImageUrl: currentStory.imageUrl
            });
            setCommentText('');
            setShowCommentInput(false);
            setIsPaused(false);
        } catch (error) {
            console.error('Error sending comment:', error);
        }
    };

    const handleShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/story/${currentStory.id}`;
            await navigator.clipboard.writeText(shareUrl);
            showToast('Link Copiado!');
        } catch (error) {
            console.error('Error sharing story:', error);
        }
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
        return `${Math.floor(seconds / 3600)}h`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
        >
            {/* Progress Bars - Per User's Stories */}
            <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
                {currentNavigation.currentUserStories.map((_, index) => (
                    <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'}`}
                            initial={{ width: '0%' }}
                            animate={{
                                width: index < currentNavigation.storyIndexInUser 
                                    ? '100%' 
                                    : index === currentNavigation.storyIndexInUser 
                                        ? `${progress}%` 
                                        : '0%'
                            }}
                            transition={{ duration: 0.1, ease: 'linear' }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-4 left-0 right-0 z-50 px-4 mt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={currentStory?.user.avatarUrl || '/default-avatar.png'}
                            alt={currentStory?.user.name}
                            className="w-10 h-10 rounded-full ring-2 ring-white"
                        />
                        <div>
                            <p className="text-white font-semibold text-sm">
                                {currentStory?.user.displayName || currentStory?.user.name}
                            </p>
                            <p className="text-white/70 text-xs">{timeAgo(currentStory?.createdAt)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {(isMyStory || isAdmin) && (
                            <button
                                onClick={() => setShowOptions(!showOptions)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <MoreVertical className="w-6 h-6 text-white" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Story Image with Animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStory?.id}
                    initial={{ opacity: 0, x: transitionDirection === 'right' ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: transitionDirection === 'right' ? -50 : 50 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="relative w-full h-full max-w-lg cursor-pointer"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        if (x < rect.width / 2) {
                            handlePrevious();
                        } else {
                            handleNext();
                        }
                    }}
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    <img
                        src={currentStory?.imageUrl}
                        alt="Story"
                        className="w-full h-full object-contain"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Bottom Actions - Show for all stories */}
            <div className="absolute bottom-6 left-0 right-0 z-50 px-6">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    {/* Viewers count - only for own stories */}
                    {isMyStory ? (
                        <button
                            onClick={() => setShowViewers(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                        >
                            <Eye className="w-5 h-5 text-white" />
                            <span className="text-white font-semibold">{currentStory?.viewCount || viewers.length}</span>
                        </button>
                    ) : (
                        <div /> /* Empty spacer */
                    )}

                    {/* Interaction buttons - only show for other people's stories */}
                    {!isMyStory && (
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleLike}
                                className={`p-3 backdrop-blur-md rounded-full transition-all ${
                                    isLiked 
                                        ? 'bg-red-500/80 hover:bg-red-500' 
                                        : 'bg-white/10 hover:bg-white/20'
                                }`}
                            >
                                <Heart className={`w-6 h-6 ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
                            </button>
                            <button 
                                onClick={handleComment}
                                className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                            >
                                <MessageCircle className="w-6 h-6 text-white" />
                            </button>
                            <button 
                                onClick={handleShare}
                                className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                            >
                                <Send className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comment Input */}
            <AnimatePresence>
                {showCommentInput && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 left-4 right-4 z-50"
                    >
                        <div className="max-w-lg mx-auto">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                    placeholder="Enviar mensagem..."
                                    autoFocus
                                    className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm min-w-0"
                                />
                                <button
                                    onClick={handleSendComment}
                                    className={`p-2 rounded-full transition-all ${
                                        commentText.trim() 
                                            ? `bg-${accentColor} text-black` 
                                            : 'bg-white/10 text-white/50'
                                    }`}
                                    disabled={!commentText.trim()}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCommentInput(false);
                                        setIsPaused(false);
                                        setCommentText('');
                                    }}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Viewers Modal */}
            <AnimatePresence>
                {showViewers && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] flex items-end justify-center"
                        onClick={() => setShowViewers(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        
                        {/* Modal Content */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={`relative w-full max-w-lg max-h-[70vh] bg-gradient-to-b ${isMGT ? 'from-zinc-900 to-black' : 'from-zinc-900 to-black'} rounded-t-3xl overflow-hidden border-t ${isMGT ? 'border-emerald-500/30' : 'border-gold-500/30'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className={`w-12 h-1 rounded-full ${isMGT ? 'bg-emerald-500/50' : 'bg-gold-500/50'}`} />
                            </div>
                            
                            {/* Header */}
                            <div className="px-6 pb-4 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                                            <Eye className={`w-5 h-5 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">Visualizações</h2>
                                            <p className="text-sm text-gray-400">{viewers.length} {viewers.length === 1 ? 'pessoa viu' : 'pessoas viram'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowViewers(false)} 
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Viewers List */}
                            <div className="px-4 py-4 overflow-y-auto max-h-[50vh]">
                                {viewers.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400">Nenhuma visualização ainda</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {viewers.map((viewer) => (
                                            <motion.div 
                                                key={viewer.id} 
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={viewer.viewer.avatarUrl || '/default-avatar.png'}
                                                        alt={viewer.viewer.name}
                                                        className={`w-11 h-11 rounded-full object-cover ring-2 ${isMGT ? 'ring-emerald-500/30' : 'ring-gold-500/30'}`}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-white">
                                                            {viewer.viewer.displayName || viewer.viewer.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{timeAgo(viewer.viewedAt)}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    className={`p-2 rounded-full ${isMGT ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-gold-500/10 hover:bg-gold-500/20'} transition-colors`}
                                                >
                                                    <Send className={`w-4 h-4 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Options Menu */}
            <AnimatePresence>
                {showOptions && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/20 z-[60]"
                            onClick={() => setShowOptions(false)}
                        />
                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-4 top-20 bg-black/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden z-[70] min-w-[200px] border border-white/10"
                        >
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-6 py-3 text-left hover:bg-white/10 text-red-500 font-medium transition-colors"
                                >
                                    {isAdmin && !isMyStory ? 'Deletar (Admin)' : 'Deletar'}
                                </button>
                            )}
                            <button
                                onClick={handleDownload}
                                className="w-full px-6 py-3 text-left hover:bg-white/10 text-white transition-colors"
                            >
                                Salvar Foto
                            </button>
                            <button className="w-full px-6 py-3 text-left hover:bg-white/10 text-white transition-colors">
                                Enviar para...
                            </button>
                            <button className="w-full px-6 py-3 text-left hover:bg-white/10 text-white transition-colors">
                                Compartilhar como Post...
                            </button>
                            <button className="w-full px-6 py-3 text-left hover:bg-white/10 text-white transition-colors">
                                Configurações do Story
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Story Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                title="Deletar Story"
                message="Tem certeza que deseja deletar este story? Esta ação não pode ser desfeita."
                onConfirm={confirmDelete}
                onClose={() => setShowDeleteModal(false)}
                confirmText="Deletar"
            />
        </motion.div>
    );
}
