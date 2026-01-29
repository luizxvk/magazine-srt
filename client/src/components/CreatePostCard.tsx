import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video, Hash, Send, X, Layers, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { compressImage, getBase64Size } from '../utils/imageCompression';
import { getProfileBorderGradient } from '../utils/profileBorderUtils';

interface CreatePostCardProps {
    onPostCreated: () => void;
}

export default function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
    const { user, showSuccess, showError, updateUser, theme } = useAuth();
    const [caption, setCaption] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'TEXT'>('TEXT');
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showTagInput, setShowTagInput] = useState(false);
    const [isCarouselMode, setIsCarouselMode] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isMGT = user?.membershipType === 'MGT';
    const canUseCarousel = (user?.zionsPoints || 0) >= 300;

    // Theme - seguindo padrão do projeto (emerald para MGT, gold para Magazine)
    const cardBg = theme === 'light' ? 'bg-white' : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const cardBorder = theme === 'light' ? 'border-gray-200' : (isMGT ? 'border-emerald-500/30' : 'border-gold-500/30');
    const cardGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)]';
    const inputBg = theme === 'light' ? 'bg-gray-100' : 'bg-white/10';
    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textMuted = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
    const accentBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';
    const accentText = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const accentHover = isMGT ? 'hover:bg-emerald-500/10' : 'hover:bg-gold-500/10';

    const handleSubmit = async () => {
        if (!caption.trim() && !mediaUrl) return;
        
        setLoading(true);
        try {
            await api.post('/posts', {
                caption,
                imageUrl: mediaType === 'IMAGE' ? mediaUrl : undefined,
                videoUrl: mediaType === 'VIDEO' ? mediaUrl : undefined,
                mediaType: mediaUrl ? mediaType : 'TEXT',
                isHighlight: isCarouselMode,
                tags: selectedTags.length > 0 ? selectedTags : undefined
            });

            // Reset
            setCaption('');
            setMediaUrl('');
            setMediaType('TEXT');
            setSelectedTags([]);
            setIsCarouselMode(false);
            
            // Refresh user to update Zions
            const userRes = await api.get('/users/me');
            updateUser(userRes.data);
            
            showSuccess('Post Publicado!', 'Sua publicação está no ar.');
            onPostCreated();
        } catch (error: any) {
            console.error('Failed to create post', error);
            showError('Falha ao publicar', error.response?.data?.error || 'Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.85,
                outputFormat: 'image/jpeg'
            });
            console.log(`Compressed to ${getBase64Size(compressed)}KB`);
            setMediaUrl(compressed);
            setMediaType('IMAGE');
        } catch {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaUrl(reader.result as string);
                setMediaType(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCaption(e.target.value);
        
        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    return (
        <div className={`${cardBg} rounded-2xl border ${cardBorder} ${cardGlow} backdrop-blur-xl overflow-hidden transition-all duration-300`}>
            {/* Header with user info */}
            <div className="p-4 flex items-center gap-3">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full p-[2px]" style={{ background: getProfileBorderGradient(user?.equippedProfileBorder, isMGT) }}>
                        <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                            alt={user?.name}
                            className="w-full h-full rounded-full object-cover bg-black"
                        />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${accentBg} rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-[#1a1a1a]'}`} />
                </div>
                <div className="flex-1">
                    <p className={`font-semibold ${textColor}`}>{user?.displayName || user?.name}</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${textMuted}`}>Publicação</span>
                        {isCarouselMode && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${accentBg} text-black font-bold uppercase`}>
                                Destaque
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Text Input Area */}
            <div className="px-4 pb-3">
                <textarea
                    ref={textareaRef}
                    value={caption}
                    onChange={handleTextareaChange}
                    placeholder={`No que você está pensando, ${user?.name?.split(' ')[0]}?`}
                    className={`w-full ${inputBg} ${textColor} rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 ${isMGT ? 'focus:ring-emerald-500/30' : 'focus:ring-amber-500/30'} min-h-[60px] max-h-[200px] text-base placeholder:${textMuted}`}
                    rows={2}
                />
            </div>

            {/* Tags Preview */}
            {selectedTags.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                        <span 
                            key={tag} 
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}
                        >
                            #{tag}
                            <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Media Preview */}
            {mediaUrl && (
                <div className="px-4 pb-3 relative">
                    <button
                        onClick={() => { setMediaUrl(''); setMediaType('TEXT'); }}
                        className="absolute top-2 right-6 z-10 bg-black/70 hover:bg-black text-white rounded-full p-1.5 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    {mediaType === 'IMAGE' ? (
                        <img src={mediaUrl} alt="Preview" className="w-full max-h-80 object-cover rounded-xl" />
                    ) : (
                        <video src={mediaUrl} className="w-full max-h-80 rounded-xl" controls />
                    )}
                </div>
            )}

            {/* Tag Input */}
            {showTagInput && (
                <div className="px-4 pb-3">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Digite a tag e pressione Enter"
                        className={`w-full ${inputBg} ${textColor} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isMGT ? 'focus:ring-emerald-500/30' : 'focus:ring-amber-500/30'}`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = e.currentTarget.value.trim().toUpperCase();
                                if (val && !selectedTags.includes(val)) {
                                    setSelectedTags([...selectedTags, val]);
                                }
                                e.currentTarget.value = '';
                                setShowTagInput(false);
                            }
                            if (e.key === 'Escape') setShowTagInput(false);
                        }}
                    />
                </div>
            )}

            {/* Divider */}
            <div className={`border-t ${cardBorder}`} />

            {/* Action Buttons */}
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {/* Photo */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${accentHover} transition-colors`}
                    >
                        <ImageIcon className={`w-5 h-5 ${isMGT ? 'text-emerald-500' : 'text-green-500'}`} />
                        <span className={`text-sm ${textMuted} hidden sm:inline`}>Foto</span>
                    </button>

                    {/* Video */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${accentHover} transition-colors`}
                    >
                        <Video className="w-5 h-5 text-red-500" />
                        <span className={`text-sm ${textMuted} hidden sm:inline`}>Vídeo</span>
                    </button>

                    {/* Tag */}
                    <button
                        onClick={() => setShowTagInput(!showTagInput)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${accentHover} transition-colors`}
                    >
                        <Hash className="w-5 h-5 text-blue-500" />
                        <span className={`text-sm ${textMuted} hidden sm:inline`}>Tag</span>
                    </button>

                    {/* Destaque/Carousel */}
                    <button
                        onClick={() => canUseCarousel && setIsCarouselMode(!isCarouselMode)}
                        disabled={!canUseCarousel}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            isCarouselMode 
                                ? `${isMGT ? 'bg-emerald-500/20' : 'bg-amber-500/20'}` 
                                : accentHover
                        } ${!canUseCarousel ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={canUseCarousel ? 'Destacar post (300 Zions)' : 'Requer 300 Zions'}
                    >
                        {!canUseCarousel ? (
                            <Lock className="w-5 h-5 text-gray-500" />
                        ) : (
                            <Layers className={`w-5 h-5 ${isCarouselMode ? accentText : 'text-purple-500'}`} />
                        )}
                        <span className={`text-sm ${textMuted} hidden sm:inline`}>Destaque</span>
                    </button>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || (!caption.trim() && !mediaUrl)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                        loading || (!caption.trim() && !mediaUrl)
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                            : `${accentBg} text-black hover:opacity-90 active:scale-95`
                    }`}
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    <span>Publicar</span>
                </button>
            </div>
        </div>
    );
}
