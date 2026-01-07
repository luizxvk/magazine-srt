import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StoryViewer from './StoryViewer';
import StoryEditor from './StoryEditor';
import { cropImageToAspectRatio, getBase64Size } from '../utils/imageCompression';

interface Story {
    id: string;
    user: {
        id: string;
        name: string;
        avatarUrl: string;
    };
    imageUrl: string;
    timestamp: string;
    hasUnseen: boolean;
}

interface StoriesBarProps {
    viewingStoryId: string | null;
    onViewStory: (id: string) => void;
    onCloseStory: () => void;
    onEditorStateChange?: (isOpen: boolean) => void;
}

export default function StoriesBar({ viewingStoryId, onViewStory, onCloseStory, onEditorStateChange }: StoriesBarProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [stories, setStories] = useState<Story[]>([]);
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Notify parent when editor state changes
    useEffect(() => {
        onEditorStateChange?.(isEditorOpen);
    }, [isEditorOpen, onEditorStateChange]);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await api.get('/feed/stories');
                // Response format: { id, user, items, hasUnseen, latestStory }

                const mappedStories: Story[] = response.data.map((group: any) => ({
                    id: group.id,
                    user: {
                        id: group.user.id,
                        name: group.user.displayName || group.user.name,
                        avatarUrl: group.user.avatarUrl
                    },
                    imageUrl: group.latestStory.imageUrl,
                    timestamp: new Date(group.latestStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    hasUnseen: group.hasUnseen,
                    items: group.items // Store all items for the viewer
                }));

                setStories(mappedStories);
            } catch (error) {
                console.error('Failed to fetch stories', error);
            }
        };

        fetchStories();
    }, [user?.id]);

    const handleAddStory = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            try {
                // Close any open story viewer first
                onCloseStory();
                
                // Auto-crop image to 9:16 aspect ratio for stories
                const imageUrl = await cropImageToAspectRatio(file, 9/16, {
                    maxWidth: 1080,
                    maxHeight: 1920, // Story aspect ratio
                    quality: 0.85,
                    outputFormat: 'image/jpeg'
                });
                
                console.log(`[Story] Cropped to 9:16 - ${getBase64Size(imageUrl)}KB`);
                
                // Open editor with cropped image
                setEditorImage(imageUrl);
                setIsEditorOpen(true);
                
                // Clear file input for next selection
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } catch (error) {
                console.error('Failed to process story image', error);
            }
        }
    };

    const handlePublishStory = async (finalImageUrl: string) => {
        if (!user) return;
        
        setIsEditorOpen(false);
        setEditorImage(null);
        
        // Optimistic update
        setStories(prev => {
            const existingGroupIndex = prev.findIndex(s => s.user.id === user.id);

            const newStoryItem = {
                id: `story-local-${Date.now()}`,
                imageUrl: finalImageUrl,
                createdAt: new Date().toISOString(),
                isSeen: false
            };

            if (existingGroupIndex >= 0) {
                const updatedGroup = {
                    ...prev[existingGroupIndex],
                    imageUrl: finalImageUrl,
                    timestamp: 'Agora',
                    hasUnseen: false,
                    items: [newStoryItem, ...(prev[existingGroupIndex] as any).items || []]
                };

                const newStories = [...prev];
                newStories.splice(existingGroupIndex, 1);
                return [updatedGroup, ...newStories];
            } else {
                const newGroup: Story = {
                    id: `story-group-${user.id}`,
                    user: {
                        id: user.id,
                        name: user.name,
                        avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
                    },
                    imageUrl: finalImageUrl,
                    timestamp: 'Agora',
                    hasUnseen: false,
                    items: [newStoryItem]
                } as any;
                return [newGroup, ...prev];
            }
        });

        // Call API to create story
        try {
            await api.post('/feed/stories', { imageUrl: finalImageUrl });
        } catch (error) {
            console.error('Failed to create story on backend', error);
        }
    };

    const handleViewStory = (storyId: string) => {
        onViewStory(storyId);
        setStories(stories.map(s => s.id === storyId ? { ...s, hasUnseen: false } : s));
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                aria-label="Adicionar story"
            />

            <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex gap-4 px-2">
                    {/* Add Story Button - Only for Members */}
                    {user?.role !== 'VISITOR' && (
                        <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={handleAddStory}>
                            <div className={`w-16 h-16 rounded-full p-[2px] relative ${isMGT ? 'bg-gray-800' : 'bg-gray-800'}`}>
                                <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-black">
                                    <img
                                        src={user?.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl !== '' ? user.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`;
                                        }}
                                        alt="Your Story"
                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className={`absolute inset-0 flex items-center justify-center bg-black/30`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isMGT ? 'bg-emerald-600' : 'bg-gold-500'} text-white shadow-lg`}>
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-xs font-medium ${isMGT ? 'text-gray-300 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>Seu Story</span>
                        </div>
                    )}

                    {/* Stories List */}
                    {stories.map((story) => (
                        <div
                            key={story.id}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                            onClick={() => handleViewStory(story.id)}
                        >
                            <div className={`w-16 h-16 rounded-full p-[2px] ${story.hasUnseen
                                ? (isMGT ? 'bg-gradient-to-tr from-red-600 to-red-400' : 'bg-gradient-to-tr from-gold-600 to-gold-300')
                                : 'bg-gray-700'}`}>
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-black relative">
                                    <img
                                        src={story.user.avatarUrl}
                                        alt={story.user.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                            </div>
                            <span className={`text-xs font-medium ${isMGT ? 'text-gray-300 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>{story.user.name.split(' ')[0]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Story Viewer Modal */}
            {viewingStoryId && stories.find(s => s.id === viewingStoryId) && (
                <StoryViewer
                    stories={stories}
                    initialStoryIndex={stories.findIndex(s => s.id === viewingStoryId)}
                    onClose={onCloseStory}
                    onStoryViewed={(id) => setStories(prev => prev.map(s => s.id === id ? { ...s, hasUnseen: false } : s))}
                />
            )}

            {/* Story Editor Modal */}
            {isEditorOpen && editorImage && (
                <StoryEditor
                    imageUrl={editorImage}
                    onClose={() => {
                        setIsEditorOpen(false);
                        setEditorImage(null);
                    }}
                    onPublish={handlePublishStory}
                />
            )}
        </>
    );
}
