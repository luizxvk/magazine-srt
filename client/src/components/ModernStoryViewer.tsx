import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MoreVertical, Eye, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

    const currentStory = stories[currentIndex];
    const isMyStory = currentStory?.user.id === user?.id;
    const isAdmin = user?.role === 'ADMIN';
    const canDelete = isMyStory || isAdmin;
    const accentColor = isMGT ? 'emerald-500' : 'gold-500';

    useEffect(() => {
        if (currentStory) {
            onStoryViewed(currentStory.id);
            markStoryAsViewed(currentStory.id);
            if (isMyStory) {
                fetchViewers(currentStory.id);
            }
        }
    }, [currentStory?.id]);

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

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        if (!confirm('Deseja deletar este story?')) return;

        try {
            await api.delete(`/feed/stories/${currentStory.id}`);
            onClose();
        } catch (error) {
            console.error('Error deleting story:', error);
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
            {/* Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
                {stories.map((_, index) => (
                    <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full bg-${accentColor}`}
                            initial={{ width: '0%' }}
                            animate={{
                                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
                            }}
                            transition={{ duration: 0.1 }}
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

            {/* Story Image */}
            <div
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
            </div>

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

                    {/* Interaction buttons - for all stories */}
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
                </div>
            </div>

            {/* Comment Input */}
            <AnimatePresence>
                {showCommentInput && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 left-0 right-0 z-50 px-6"
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
                                    className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
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
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="absolute inset-0 bg-white z-[60] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Visualizações</h2>
                                <button onClick={() => setShowViewers(false)} className="p-2">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <p className="text-gray-500 mb-6">{viewers.length} visualizações</p>

                            <div className="space-y-3">
                                {viewers.map((viewer) => (
                                    <div key={viewer.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={viewer.viewer.avatarUrl || '/default-avatar.png'}
                                                alt={viewer.viewer.name}
                                                className="w-12 h-12 rounded-full"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {viewer.viewer.displayName || viewer.viewer.name}
                                                </p>
                                                <p className="text-sm text-gray-500">{timeAgo(viewer.viewedAt)}</p>
                                            </div>
                                        </div>
                                        <button className="p-2">
                                            <Send className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
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
        </motion.div>
    );
}
