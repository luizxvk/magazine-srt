import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
    id: string;
    user: {
        id: string;
        name: string;
        avatarUrl: string;
    };
    imageUrl: string;
    timestamp: string;
}

interface StoryViewerProps {
    stories: Story[];
    initialStoryIndex: number;
    onClose: () => void;
    onStoryViewed: (storyId: string) => void;
}

export default function StoryViewer({ stories, initialStoryIndex, onClose, onStoryViewed }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const { user } = useAuth();
    const isSRT = user?.membershipType === 'SRT';

    const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    const currentStory = stories[currentIndex];

    if (!currentStory) return null;

    const STORY_DURATION = 5000; // 5 seconds per story
    const isLiked = likedStories.has(currentStory.id);

    const handleNext = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    }, [currentIndex]);

    const handleLike = async () => {
        if (isLiked) return;

        setLikedStories(prev => new Set(prev).add(currentStory.id));
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);

        try {
            await api.post(`/feed/stories/${currentStory.user.id}/like`);
        } catch (error) {
            console.error('Failed to like story', error);
        }
    };

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + (100 / (STORY_DURATION / 100)); // Update every 100ms
            });
        }, 100);

        return () => clearInterval(interval);
    }, [currentIndex, isPaused, handleNext]);

    useEffect(() => {
        onStoryViewed(currentStory.id);
    }, [currentStory.id, onStoryViewed]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === ' ') setIsPaused(prev => !prev);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev, onClose]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center h-screen w-screen">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white z-50 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Fechar"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Main Container */}
            <div className="relative w-full h-full md:max-w-md md:h-full bg-black shadow-2xl">
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1 pt-4 md:pt-2">
                    {stories.map((story, index) => (
                        <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-white transition-all duration-100 ease-linear ${index < currentIndex ? 'w-full' :
                                    index === currentIndex ? `w-[${progress}%]` : 'w-0'
                                    }`}
                                style={{ width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%' }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-6 left-0 right-0 z-20 p-4 flex items-center gap-3 mt-2">
                    <div className={`w-10 h-10 rounded-full p-[1px] ${isSRT ? 'bg-red-500' : 'bg-gold-500'}`}>
                        <img
                            src={currentStory.user.avatarUrl}
                            alt={currentStory.user.name}
                            className="w-full h-full rounded-full object-cover border-2 border-black"
                        />
                    </div>
                    <div>
                        <p className="text-white font-medium text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{currentStory.user.name}</p>
                        <p className="text-white/90 text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{currentStory.timestamp}</p>
                    </div>
                </div>

                {/* Story Content */}
                <div
                    className="w-full h-full relative"
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                    onDoubleClick={handleLike}
                >
                    <img
                        src={currentStory.imageUrl}
                        alt="Story"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

                    {/* Heart Animation Overlay */}
                    <AnimatePresence>
                        {showHeartAnimation && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <Heart className={`w-32 h-32 ${isSRT ? 'text-red-500' : 'text-gold-500'} fill-current drop-shadow-2xl`} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Areas */}
                <div className="absolute inset-0 flex z-10">
                    <div className="w-1/3 h-full" onClick={handlePrev} />
                    <div className="w-1/3 h-full" onClick={() => setIsPaused(prev => !prev)} />
                    <div className="w-1/3 h-full" onClick={handleNext} />
                </div>

                {/* Footer / Actions */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 flex items-center gap-4 pb-8 md:pb-4">
                    {currentStory.user.id !== user?.id && user?.role !== 'VISITOR' && (
                        <input
                            type="text"
                            placeholder="Enviar mensagem..."
                            className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:border-white/60 backdrop-blur-sm"
                        />
                    )}
                    {user?.role !== 'VISITOR' && (
                        <button
                            className={`p-2 hover:scale-110 transition-transform ml-auto ${isLiked ? (isSRT ? 'text-red-500' : 'text-gold-500') : 'text-white'}`}
                            onClick={handleLike}
                            aria-label="Curtir story"
                        >
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    {currentStory.user.id !== user?.id && user?.role !== 'VISITOR' && (
                        <button className="text-white p-2 hover:scale-110 transition-transform" aria-label="Enviar mensagem">
                            <Send className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
