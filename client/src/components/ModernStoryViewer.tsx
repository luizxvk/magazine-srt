import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Send, Share2, MoreVertical, Eye, Heart, MessageCircle } from 'lucide-react';
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
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);
    const [viewers, setViewers] = useState<StoryViewer[]>([]);
    const [showViewers, setShowViewers] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const currentStory = stories[currentIndex];
    const isMyStory = currentStory?.user.id === user?.id;
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

    const markStoryAsViewed = async (storyId: string) => {
        try {
            await api.post(`/social/stories/${storyId}/view`);
        } catch (error) {
            console.error('Error marking story as viewed:', error);
        }
    };

    const fetchViewers = async (storyId: string) => {
        try {
            const response = await api.get(`/social/stories/${storyId}/viewers`);
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
        if (!isMyStory) return;
        if (!confirm('Deseja deletar este story?')) return;

        try {
            await api.delete(`/social/stories/${currentStory.id}`);
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
                        {isMyStory && (
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

            {/* Bottom Actions */}
            {isMyStory && (
                <div className="absolute bottom-6 left-0 right-0 z-50 px-6">
                    <div className="flex items-center justify-between max-w-lg mx-auto">
                        <button
                            onClick={() => setShowViewers(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                        >
                            <Eye className="w-5 h-5 text-white" />
                            <span className="text-white font-semibold">{currentStory?.viewCount || viewers.length}</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors">
                                <Heart className="w-6 h-6 text-white" />
                            </button>
                            <button className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </button>
                            <button className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors">
                                <Send className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-4 top-20 bg-white rounded-2xl shadow-2xl overflow-hidden z-[70] min-w-[200px]"
                    >
                        <button
                            onClick={handleDelete}
                            className="w-full px-6 py-3 text-left hover:bg-gray-50 text-red-600 font-medium"
                        >
                            Delete
                        </button>
                        <button
                            onClick={handleDownload}
                            className="w-full px-6 py-3 text-left hover:bg-gray-50 text-gray-900"
                        >
                            Save Photo
                        </button>
                        <button className="w-full px-6 py-3 text-left hover:bg-gray-50 text-gray-900">
                            Send to...
                        </button>
                        <button className="w-full px-6 py-3 text-left hover:bg-gray-50 text-gray-900">
                            Share as Post...
                        </button>
                        <button className="w-full px-6 py-3 text-left hover:bg-gray-50 text-gray-900">
                            Story Setting
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
