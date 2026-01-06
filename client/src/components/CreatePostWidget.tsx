import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Send, X, Layers, Lock, Hash, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { compressImage, getBase64Size } from '../utils/imageCompression';

interface CreatePostWidgetProps {
    onPostCreated: () => void;
}

export default function CreatePostWidget({ onPostCreated }: CreatePostWidgetProps) {
    const { user, isVisitor, showAchievement, updateUserZions, updateUser, theme } = useAuth();
    const [caption, setCaption] = useState('');
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'TEXT'>('TEXT');
    const [mediaUrl, setMediaUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCarouselMode, setIsCarouselMode] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showTagInput, setShowTagInput] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canUseCarousel = (user?.zions || 0) >= 300;
    const isMGT = user?.membershipType === 'MGT';

    // Theme Colors
    // Theme Colors
    const themeBorder = isMGT ? 'border-emerald-500/40' : 'border-gold-500/20';
    const themeText = isMGT ? (theme === 'light' ? 'text-emerald-900' : 'text-emerald-100') : (theme === 'light' ? 'text-gray-900' : 'text-gold-200');
    const themeTextMuted = isMGT ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-100') : (theme === 'light' ? 'text-gray-600' : 'text-gold-200/80');
    const themeTextHover = isMGT ? 'hover:text-emerald-100' : 'hover:text-gold-100';
    const themeBgHover = isMGT ? 'hover:bg-emerald-200/10' : 'hover:bg-gold-200/10';
    const themeBgActive = isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20';
    const themeTextActive = isMGT ? 'text-emerald-300' : 'text-gold-300';
    const themeButton = isMGT ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-gold-400 hover:bg-gold-300';
    const themeButtonShadow = isMGT ? 'hover:shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'hover:shadow-[0_0_15px_rgba(252,246,186,0.6)]';

    const themePillBg = isMGT
        ? (theme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-900/20')
        : (theme === 'light' ? 'bg-white border-gray-200' : 'bg-gold-300/10');

    const themePillBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-200/30';
    const themePillShadow = isMGT ? 'shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]' : 'shadow-[0_8px_32px_0_rgba(252,246,186,0.1)]';
    const themePillHoverShadow = isMGT ? 'hover:shadow-[0_8px_40px_0_rgba(16,185,129,0.2)]' : 'hover:shadow-[0_8px_40px_0_rgba(252,246,186,0.2)]';
    const themePillHoverBorder = isMGT ? 'hover:border-emerald-500/40' : 'hover:border-gold-200/40';
    const themePillExpandedBg = isMGT ? 'bg-emerald-900/30' : 'bg-gold-300/15';
    const themeGlow = isMGT ? 'from-transparent via-emerald-500/10' : 'from-transparent via-gold-200/10';

    const themeInputText = isMGT
        ? (theme === 'light' ? 'text-emerald-900' : 'text-emerald-100')
        : (theme === 'light' ? 'text-gray-800' : 'text-gold-100');

    const themeInputPlaceholder = isMGT
        ? (theme === 'light' ? 'placeholder-emerald-900/50' : 'placeholder-emerald-200/60')
        : (theme === 'light' ? 'placeholder-gray-400' : 'placeholder-gold-200/60');

    const themeSelection = isMGT ? 'selection:bg-emerald-500/30' : 'selection:bg-gold-200/30';
    const themeTagBg = isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20';
    const themeTagBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeTagText = isMGT ? 'text-emerald-300' : 'text-gold-300';

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isVisitor) {
            alert('Faça login para publicar.');
            return;
        }
        if (!caption.trim() && !mediaUrl) return;

        console.log('Submitting post...', { caption, mediaUrl, isCarouselMode, selectedTags });
        setLoading(true);

        try {
            const response = await api.post('/posts', {
                caption,
                mediaType: mediaUrl ? mediaType : 'TEXT',
                imageUrl: mediaType === 'IMAGE' ? mediaUrl : undefined,
                videoUrl: mediaType === 'VIDEO' ? mediaUrl : undefined,
                tags: selectedTags,
                isHighlight: isCarouselMode
            });

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

            if (response.data.userStats) {
                updateUser(response.data.userStats);
            }

            // Deduct Zions locally for immediate feedback if highlight
            if (isCarouselMode) {
                updateUserZions(-300);
            }

            // Success Animation & Sound
            setIsSuccess(true);
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); // Pop sound
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed', e));

            setTimeout(() => {
                setCaption('');
                setMediaUrl('');
                setMediaType('TEXT');
                setIsExpanded(false);
                setIsCarouselMode(false);
                setSelectedTags([]);
                setIsSuccess(false);
                onPostCreated();
            }, 1500);

        } catch (error: any) {
            console.error('Failed to create post', error);
            alert(`Failed to create post: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleAddTag = () => {
        setShowTagInput(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Compress image for faster upload
                const compressed = await compressImage(file, {
                    maxWidth: 1920,
                    maxHeight: 1920,
                    quality: 0.85,
                    outputFormat: 'image/jpeg'
                });
                
                console.log(`[Post] Compressed to ${getBase64Size(compressed)}KB`);
                setMediaUrl(compressed);
                setMediaType('IMAGE');
            } catch (error) {
                console.error('Failed to compress image', error);
                // Fallback to original
                const reader = new FileReader();
                reader.onloadend = () => {
                    setMediaUrl(reader.result as string);
                    setMediaType('IMAGE');
                };
                reader.readAsDataURL(file);
            }
        }
    };

    if (isVisitor) {
        return (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[95%] max-w-2xl z-50">
                <div className={`bg-black/60 backdrop-blur-xl border ${themeBorder} rounded-full p-4 text-center shadow-2xl`}>
                    <p className={`${themeText} text-sm`}>
                        <span className="font-semibold">Visitante:</span> Faça login para interagir e publicar.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[95%] max-w-2xl z-50">
            {/* Media Preview (Pops up above the bar) */}
            {mediaUrl && (
                <div className={`mb-4 bg-black/40 backdrop-blur-xl rounded-2xl p-2 border ${themeBorder} animate-fade-in-up relative mx-auto w-full max-w-sm shadow-2xl`}>
                    <button
                        onClick={() => setMediaUrl('')}
                        className="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg z-10 backdrop-blur-sm transition-colors"
                        title="Remover mídia"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    {mediaType === 'IMAGE' ? (
                        <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-inner" />
                    ) : (
                        <video src={mediaUrl} className="w-full h-48 object-cover rounded-xl shadow-inner" controls />
                    )}
                </div>
            )}

            {/* Tag Input Popup */}
            {showTagInput && (
                <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border ${themeBorder} rounded-2xl p-4 shadow-2xl w-64 animate-fade-in-up z-50`}>
                    <h3 className={`${isMGT ? 'text-emerald-400' : 'text-gold-400'} text-xs uppercase tracking-widest mb-2 text-center`}>Adicionar Tag</h3>
                    <input
                        autoFocus
                        type="text"
                        aria-label="Nome da tag"
                        className={`w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-${isMGT ? 'red' : 'gold'}-500/50 outline-none mb-2`}
                        placeholder="Ex: Tecnologia"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = e.currentTarget.value.trim();
                                if (val && !selectedTags.includes(val.toUpperCase())) {
                                    setSelectedTags([...selectedTags, val.toUpperCase()]);
                                    setShowTagInput(false);
                                }
                            }
                            if (e.key === 'Escape') setShowTagInput(false);
                        }}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowTagInput(false)}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-1.5 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={(e) => {
                                const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                                const val = input.value.trim();
                                if (val && !selectedTags.includes(val.toUpperCase())) {
                                    setSelectedTags([...selectedTags, val.toUpperCase()]);
                                    setShowTagInput(false);
                                }
                            }}
                            className={`flex-1 ${themeButton} text-black text-xs py-1.5 rounded-lg transition-colors font-medium`}
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            )}

            {/* Tags Preview */}
            {selectedTags.length > 0 && (
                <div className="mb-2 flex gap-2 justify-center flex-wrap">
                    {selectedTags.map(tag => (
                        <span key={tag} className={`px-2 py-1 ${themeTagBg} border ${themeTagBorder} rounded-md text-[10px] ${themeTagText} uppercase tracking-wider flex items-center gap-1`}>
                            #{tag}
                            <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} className="hover:text-white" aria-label={`Remover tag ${tag}`}><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            )}

            {/* The Liquid Glass Pill */}
            <div className={`
                relative overflow-hidden
                ${themePillBg} backdrop-blur-2xl
                border ${themePillBorder}
                rounded-full ${themePillShadow}
                p-2 flex items-center gap-4 transition-all duration-500 ease-out
                group ${themePillHoverShadow} ${themePillHoverBorder}
                ${isExpanded ? `scale-105 ${themePillExpandedBg}` : 'scale-100'}
            `}>
                {/* Subtle internal glow */}
                <div className={`absolute inset-0 bg-gradient-to-r ${themeGlow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

                {/* Input Area */}
                <div className="flex-1 flex items-center px-4">
                    <textarea
                        ref={inputRef}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        onBlur={() => !caption && setIsExpanded(false)}
                        onKeyDown={handleKeyDown}
                        placeholder={isSuccess ? "Publicado!" : "Escreva aqui"}
                        rows={1}
                        disabled={isSuccess}
                        className={`w-full bg-transparent border-none ${themeInputText} ${themeInputPlaceholder} text-lg font-light tracking-wide focus:ring-0 resize-none py-3 scrollbar-hide leading-tight min-h-[44px] max-h-[120px] ${themeSelection} disabled:opacity-50`}
                        aria-label="Criar nova postagem"
                    />
                </div>

                {/* Actions Group */}
                <div className="flex items-center gap-3 pr-2 relative z-10">
                    {/* Carousel Mode Toggle */}
                    <button
                        type="button"
                        onClick={() => canUseCarousel && setIsCarouselMode(!isCarouselMode)}
                        className={`
                            rounded-full p-2 transition-all duration-300 flex items-center gap-1
                            ${isCarouselMode ? `${themeBgActive} ${themeTextActive}` : `${themeTextMuted} ${themeTextHover} ${themeBgHover}`}
                            ${!canUseCarousel ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={canUseCarousel ? "Modo Carrossel (Destaque - 300 Zions)" : "Modo Carrossel (Requer 300 Zions)"}
                    >
                        {!canUseCarousel && <Lock className="w-3 h-3" />}
                        <Layers className="w-5 h-5 stroke-[1.5]" />
                    </button>

                    {/* Tag Button */}
                    <button
                        type="button"
                        onClick={handleAddTag}
                        className={`${themeTextMuted} ${themeTextHover} ${themeBgHover} rounded-full p-2 transition-all duration-300`}
                        title="Adicionar Tag"
                    >
                        <Hash className="w-5 h-5 stroke-[1.5]" />
                    </button>

                    {/* Media Icons */}
                    <div className="flex items-center gap-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                            aria-label="Selecionar imagem"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`${themeTextMuted} ${themeTextHover} ${themeBgHover} rounded-full p-2 transition-all duration-300`}
                            title="Adicionar Imagem"
                        >
                            <ImageIcon className="w-5 h-5 stroke-[1.5]" />
                        </button>
                    </div>

                    {/* Send Button */}
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={loading || (!caption.trim() && !mediaUrl)}
                        className={`
                            ${themeButton} text-black rounded-full p-2.5 
                            transition-all duration-300 transform hover:scale-110 active:scale-95
                            ${themeButtonShadow}
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        `}
                        title="Publicar"
                    >
                        {isSuccess ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5 stroke-[2]" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
