import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Send, Trash2 } from 'lucide-react';
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
    items?: { id: string; imageUrl: string; timestamp?: string; }[];
}

interface StoryViewerProps {
    stories: Story[];
    initialStoryIndex: number;
    onClose: () => void;
    onStoryViewed: (storyId: string) => void;
}

export default function StoryViewer({ stories, initialStoryIndex, onClose, onStoryViewed }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [currentItemIndex, setCurrentItemIndex] = useState(0); // Track which item in the group is being shown
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);

    const currentStoryGroup = stories[currentIndex];
    // If items exist, use them. Otherwise fallback to the main story object (old behavior/compatibility)
    const storyItems = currentStoryGroup?.items && currentStoryGroup.items.length > 0
        ? currentStoryGroup.items
        : [{ id: currentStoryGroup.id, imageUrl: currentStoryGroup.imageUrl, timestamp: currentStoryGroup.timestamp }];

    // Sort items by date (newest last? typically stories play oldest to newest)
    // Assuming backend returns them in order or we sort.
    // Let's assume order is correct for now or sort by createdAt if available.
    // Usually stories play Chronological (oldest first).
    // Let's verify data structure: Backend getStories returns items sorted?
    // Backend: userGroup.stories.push(...) then res.json.
    // Backend `stories` query is ORDER BY createdAt DESC.
    // So `items` are DESC (newest first).
    // WE SHOULD PLAY OLDEST FIRST.
    // So we should reverse `storyItems` locally for playback if they are DESC.
    // But `StoryViewer` logic:
    // Ideally we want to see what we haven't seen.
    // For simplicity, let's play them in the order provided (which is likely Newest First based on backend query).
    // Users might find it weird to see newest first, but let's stick to simple iteration for now.
    // actually, typically you watch oldest unseen to newest. 
    // Since backend returns DESC, index 0 is NEWEST.
    // We should probably iterate reverse? Or just iterate 0..N.
    // Let's iterate 0..N for now (Newest to Oldest) as user requested "replacing with current".
    // Wait, "replacing" means they only saw the new one.
    // If I iterate, they see all.

    const currentItem = storyItems[currentItemIndex] || storyItems[0];

    // reset item index when switching users
    useEffect(() => {
        setCurrentItemIndex(0);
    }, [currentIndex]);

    if (!currentStoryGroup) return null;

    const STORY_DURATION = 5000; // 5 seconds per story
    const isLiked = likedStories.has(currentItem.id || currentStoryGroup.id);

    const handleNext = useCallback(() => {
        if (currentItemIndex < storyItems.length - 1) {
            // Next item in current user's story
            setCurrentItemIndex(prev => prev + 1);
            setProgress(0);
        } else if (currentIndex < stories.length - 1) {
            // Next user
            setCurrentIndex(prev => prev + 1);
            setCurrentItemIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentIndex, currentItemIndex, storyItems.length, stories.length, onClose]);

    const handlePrev = useCallback(() => {
        if (currentItemIndex > 0) {
            // Prev item in current user's story
            setCurrentItemIndex(prev => prev - 1);
            setProgress(0);
        } else if (currentIndex > 0) {
            // Prev user
            setCurrentIndex(prev => prev - 1);
            setCurrentItemIndex(0); // Should probably go to *last* item of prev user?
            setProgress(0);
        }
    }, [currentIndex, currentItemIndex]);

    const handleLike = async () => {
        if (isLiked) return;

        setLikedStories(prev => new Set(prev).add(currentItem.id || currentStoryGroup.id));
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);

        try {
            await api.post(`/feed/stories/${currentStoryGroup.user.id}/like`);
        } catch (error) {
            console.error('Failed to like story', error);
        }
    };

    useEffect(() => {
        if (isPaused || isInputFocused) return;

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
    }, [currentIndex, currentItemIndex, isPaused, isInputFocused, handleNext]);

    useEffect(() => {
        onStoryViewed(currentStoryGroup.id);
    }, [currentStoryGroup.id, onStoryViewed]);

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

            {/* Delete Button (for own stories) */}
            {currentStoryGroup.user.id === user?.id && (
                <button
                    onClick={async () => {
                        if (confirm('Deseja remover este story?')) {
                            try {
                                await api.delete(`/feed/stories/${currentItem.id}`);
                                handleNext();
                            } catch (error) {
                                console.error('Failed to delete story', error);
                            }
                        }
                    }}
                    className="absolute top-4 left-4 text-white z-50 p-2 hover:bg-red-500/20 rounded-full transition-colors"
                    aria-label="Deletar story"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            )}

            {/* Main Container */}
            <div className="relative w-full h-full md:max-w-md md:h-full bg-black shadow-2xl">
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1 pt-4 md:pt-2">
                    {/* Show progress bars for all items in the CURRENT user's story if multiple items exist */}
                    {/* If we want instagram style: show bars for ITEMS. */}
                    {/* Currently renders 1 bar per USER. Keep it simple or sophisticated? */}
                    {/* User asked for "adding photos to story". Expected: multiple bars for that user. */}
                    {storyItems.map((item, index) => (
                        <div key={item.id || index} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-white transition-all duration-100 ease-linear ${index < currentItemIndex ? 'w-full' :
                                    index === currentItemIndex ? `w-[${progress}%]` : 'w-0'
                                    }`}
                                style={{ width: index === currentItemIndex ? `${progress}%` : index < currentItemIndex ? '100%' : '0%' }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-6 left-0 right-0 z-20 p-4 flex items-center gap-3 mt-2">
                    <div className={`w-10 h-10 rounded-full p-[1px] ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'}`}>
                        <img
                            src={currentStoryGroup.user.avatarUrl}
                            alt={currentStoryGroup.user.name}
                            className="w-full h-full rounded-full object-cover border-2 border-black"
                        />
                    </div>
                    <div>
                        <p className={`font-medium text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${isMGT ? 'text-emerald-400' : 'text-white'}`}>{currentStoryGroup.user.name}</p>
                        <p className="text-white/90 text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {currentItem.timestamp ? (currentItem.timestamp.includes('T') ? new Date(currentItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : currentItem.timestamp) : currentStoryGroup.timestamp}
                        </p>
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
                        key={currentItem.id} // Add key to force re-render/animation if needed
                        src={currentItem.imageUrl} // Use item image
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
                                <Heart className={`w-32 h-32 ${isMGT ? 'text-emerald-500' : 'text-gold-500'} fill-current drop-shadow-2xl`} />
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
                    {currentStoryGroup.user.id !== user?.id && user?.role !== 'VISITOR' && (
                        <input
                            type="text"
                            placeholder="Enviar mensagem..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && commentText.trim()) {
                                    // Send message
                                    api.post(`/messages`, {
                                        recipientId: currentStoryGroup.user.id,
                                        content: commentText,
                                        context: 'story'
                                    }).then(() => {
                                        setCommentText('');
                                        alert('Mensagem enviada!');
                                    }).catch(console.error);
                                }
                            }}
                            className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:border-white/60 backdrop-blur-sm"
                        />
                    )}
                    {user?.role !== 'VISITOR' && (
                        <button
                            className={`p-2 hover:scale-110 transition-transform ml-auto ${isLiked ? (isMGT ? 'text-emerald-500' : 'text-gold-500') : 'text-white'}`}
                            onClick={handleLike}
                            aria-label="Curtir story"
                        >
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    {currentStoryGroup.user.id !== user?.id && user?.role !== 'VISITOR' && (
                        <button
                            className="text-white p-2 hover:scale-110 transition-transform"
                            aria-label="Enviar mensagem"
                            onClick={() => {
                                if (commentText.trim()) {
                                    api.post(`/messages`, {
                                        recipientId: currentStoryGroup.user.id,
                                        content: commentText,
                                        context: 'story'
                                    }).then(() => {
                                        setCommentText('');
                                        alert('Mensagem enviada!');
                                    }).catch(console.error);
                                }
                            }}
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
