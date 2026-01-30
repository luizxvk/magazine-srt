import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video, Hash, Send, X, Layers, Lock, BarChart3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { compressImage, getBase64Size } from '../utils/imageCompression';
import { getProfileBorderGradient } from '../utils/profileBorderUtils';

interface CreatePostCardProps {
    onPostCreated: () => void;
}

export default function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
    const { user, showSuccess, showError, updateUser, theme, accentColor } = useAuth();
    const [caption, setCaption] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'TEXT'>('TEXT');
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showTagInput, setShowTagInput] = useState(false);
    const [isCarouselMode, setIsCarouselMode] = useState(false);
    const [showPollInput, setShowPollInput] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isMGT = user?.membershipType === 'MGT';
    const canUseCarousel = (user?.zionsPoints || 0) >= 300;
    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const userAccent = accentColor || defaultAccent;

    // Apple Vision Pro Glass Morphism Style
    const cardBg = theme === 'light' 
        ? 'bg-white/70' 
        : 'bg-white/[0.03]';
    const cardBorder = theme === 'light' 
        ? 'border-white/50' 
        : 'border-white/[0.08]';
    const cardShadow = theme === 'light'
        ? 'shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.5)]'
        : 'shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)]';
    const inputBg = theme === 'light' 
        ? 'bg-gray-100/80' 
        : 'bg-white/[0.04]';
    const inputBorder = theme === 'light'
        ? 'border-gray-200/50'
        : 'border-white/[0.06]';
    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textMuted = theme === 'light' ? 'text-gray-500' : 'text-white/50';

    const handleSubmit = async () => {
        if (!caption.trim() && !mediaUrl && !showPollInput) return;
        
        // Validar enquete se ativa
        const validPollOptions = pollOptions.filter(opt => opt.trim());
        if (showPollInput && validPollOptions.length < 2) {
            showError('Enquete inválida', 'Adicione pelo menos 2 opções.');
            return;
        }
        
        setLoading(true);
        try {
            await api.post('/posts', {
                caption,
                imageUrl: mediaType === 'IMAGE' ? mediaUrl : undefined,
                videoUrl: mediaType === 'VIDEO' ? mediaUrl : undefined,
                mediaType: mediaUrl ? mediaType : 'TEXT',
                isHighlight: isCarouselMode,
                tags: selectedTags.length > 0 ? selectedTags : undefined,
                // Enquete
                pollQuestion: showPollInput ? (pollQuestion || caption) : undefined,
                pollOptions: showPollInput ? validPollOptions : undefined
            });

            // Reset
            setCaption('');
            setMediaUrl('');
            setMediaType('TEXT');
            setSelectedTags([]);
            setIsCarouselMode(false);
            setShowPollInput(false);
            setPollQuestion('');
            setPollOptions(['', '']);
            
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`${cardBg} rounded-3xl border ${cardBorder} ${cardShadow} backdrop-blur-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)]`}
            style={{
                background: theme === 'light' 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)'
                    : `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
            }}
        >
            {/* Subtle accent glow */}
            <div 
                className="absolute inset-0 opacity-20 pointer-events-none rounded-3xl"
                style={{
                    background: `radial-gradient(ellipse at top, ${userAccent}15, transparent 50%)`
                }}
            />
            
            {/* Header with user info */}
            <div className="p-4 flex items-center gap-3 relative">
                <div className="relative">
                    <div 
                        className="w-12 h-12 rounded-full p-[2px] shadow-lg" 
                        style={{ background: getProfileBorderGradient(user?.equippedProfileBorder, isMGT) }}
                    >
                        <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                            alt={user?.name}
                            className="w-full h-full rounded-full object-cover bg-black"
                        />
                    </div>
                    <div 
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 shadow-sm`}
                        style={{ 
                            backgroundColor: userAccent,
                            borderColor: theme === 'light' ? '#fff' : '#1a1a1a'
                        }}
                    />
                </div>
                <div className="flex-1">
                    <p className={`font-semibold ${textColor}`}>{user?.displayName || user?.name}</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${textMuted}`}>Publicação</span>
                        {isCarouselMode && (
                            <span 
                                className="text-[10px] px-2 py-0.5 rounded-full text-black font-bold uppercase flex items-center gap-1"
                                style={{ backgroundColor: userAccent }}
                            >
                                <Sparkles className="w-3 h-3" />
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
                    className={`w-full ${inputBg} ${textColor} rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 border ${inputBorder} backdrop-blur-sm min-h-[60px] max-h-[200px] text-base transition-all duration-300`}
                    style={{ 
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    rows={2}
                />
            </div>

            {/* Tags Preview */}
            <AnimatePresence>
                {selectedTags.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-3 flex flex-wrap gap-2"
                    >
                        {selectedTags.map(tag => (
                            <span 
                                key={tag} 
                                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-sm border"
                                style={{
                                    backgroundColor: `${userAccent}20`,
                                    borderColor: `${userAccent}30`,
                                    color: userAccent
                                }}
                            >
                                #{tag}
                                <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} className="hover:opacity-70 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Media Preview - Apple Vision Pro Style */}
            <AnimatePresence>
                {mediaUrl && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="px-4 pb-3 relative"
                    >
                        <button
                            onClick={() => { setMediaUrl(''); setMediaType('TEXT'); }}
                            className="absolute top-2 right-6 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-white/10">
                            {mediaType === 'IMAGE' ? (
                                <img src={mediaUrl} alt="Preview" className="w-full max-h-80 object-cover" />
                            ) : (
                                <video src={mediaUrl} className="w-full max-h-80 object-cover" controls />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tag Input - Glass Morphism */}
            <AnimatePresence>
                {showTagInput && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-3"
                    >
                        <input
                            type="text"
                            autoFocus
                            placeholder="Digite a tag e pressione Enter"
                            className={`w-full ${inputBg} ${textColor} rounded-xl px-3 py-2.5 text-sm focus:outline-none border ${inputBorder} backdrop-blur-sm transition-all duration-300`}
                            style={{ 
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                            }}
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poll Input - Apple Vision Pro Glass Style */}
            <AnimatePresence>
                {showPollInput && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mx-4 mb-3 p-4 rounded-2xl backdrop-blur-xl border shadow-lg`}
                        style={{
                            background: theme === 'light' 
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                            borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="p-1.5 rounded-lg"
                                    style={{ backgroundColor: `${userAccent}20` }}
                                >
                                    <BarChart3 className="w-4 h-4" style={{ color: userAccent }} />
                                </div>
                                <span className={`text-sm font-semibold ${textColor}`}>Enquete</span>
                            </div>
                            <button 
                                onClick={() => setShowPollInput(false)}
                                className={`p-1.5 rounded-full hover:bg-white/10 transition-all duration-200`}
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        
                        <input
                            type="text"
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            placeholder="Pergunta da enquete (opcional)"
                            className={`w-full ${inputBg} ${textColor} rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none border ${inputBorder} backdrop-blur-sm transition-all duration-300`}
                        />
                        
                        <div className="space-y-2">
                            {pollOptions.map((option, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center gap-2"
                                >
                                    <div 
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{
                                            backgroundColor: `${userAccent}20`,
                                            color: userAccent
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...pollOptions];
                                            newOptions[index] = e.target.value;
                                            setPollOptions(newOptions);
                                        }}
                                        placeholder={`Opção ${index + 1}`}
                                        className={`flex-1 ${inputBg} ${textColor} rounded-xl px-3 py-2 text-sm focus:outline-none border ${inputBorder} backdrop-blur-sm transition-all duration-300`}
                                    />
                                    {pollOptions.length > 2 && (
                                        <button 
                                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all duration-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                        
                        {pollOptions.length < 4 && (
                            <button
                                onClick={() => setPollOptions([...pollOptions, ''])}
                                className="mt-3 text-xs font-medium hover:underline transition-all duration-200"
                                style={{ color: userAccent }}
                            >
                                + Adicionar opção
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Divider - Subtle gradient */}
            <div 
                className="h-px mx-4"
                style={{
                    background: theme === 'light' 
                        ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.1), transparent)'
                        : 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)'
                }}
            />

            {/* Action Buttons - Premium Glass Style */}
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {/* Photo */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'} transition-all duration-200 shrink-0`}
                        title="Adicionar foto"
                    >
                        <ImageIcon className="w-5 h-5 text-green-500" />
                        <span className={`text-xs ${textMuted} hidden md:inline font-medium`}>Foto</span>
                    </motion.button>

                    {/* Video */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'} transition-all duration-200 shrink-0`}
                        title="Adicionar vídeo"
                    >
                        <Video className="w-5 h-5 text-red-500" />
                        <span className={`text-xs ${textMuted} hidden md:inline font-medium`}>Vídeo</span>
                    </motion.button>

                    {/* Tag */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTagInput(!showTagInput)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 shrink-0 ${
                            showTagInput 
                                ? 'bg-blue-500/10' 
                                : theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'
                        }`}
                        title="Adicionar tag"
                    >
                        <Hash className={`w-5 h-5 ${showTagInput ? 'text-blue-400' : 'text-blue-500'}`} />
                        <span className={`text-xs ${textMuted} hidden md:inline font-medium`}>Tag</span>
                    </motion.button>

                    {/* Poll/Enquete */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPollInput(!showPollInput)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 shrink-0 border ${
                            showPollInput 
                                ? 'border-current bg-opacity-10' 
                                : `border-transparent ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`
                        }`}
                        style={showPollInput ? { 
                            backgroundColor: `${userAccent}15`,
                            borderColor: `${userAccent}40`
                        } : {}}
                        title="Criar enquete"
                    >
                        <BarChart3 className="w-5 h-5" style={{ color: showPollInput ? userAccent : '#06b6d4' }} />
                        <span className={`text-xs ${textMuted} hidden md:inline font-medium`}>Enquete</span>
                    </motion.button>

                    {/* Destaque/Carousel */}
                    <motion.button
                        whileHover={canUseCarousel ? { scale: 1.05 } : {}}
                        whileTap={canUseCarousel ? { scale: 0.95 } : {}}
                        onClick={() => canUseCarousel && setIsCarouselMode(!isCarouselMode)}
                        disabled={!canUseCarousel}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 shrink-0 ${
                            isCarouselMode 
                                ? 'border' 
                                : `${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`
                        } ${!canUseCarousel ? 'opacity-40 cursor-not-allowed' : ''}`}
                        style={isCarouselMode ? { 
                            backgroundColor: `${userAccent}15`,
                            borderColor: `${userAccent}40`
                        } : {}}
                        title={canUseCarousel ? 'Destacar post (300 Zions)' : 'Requer 300 Zions'}
                    >
                        {!canUseCarousel ? (
                            <Lock className="w-5 h-5 text-gray-500" />
                        ) : (
                            <Layers className="w-5 h-5" style={{ color: isCarouselMode ? userAccent : '#a855f7' }} />
                        )}
                        <span className={`text-xs ${textMuted} hidden lg:inline font-medium`}>Destaque</span>
                    </motion.button>
                </div>

                {/* Submit Button - Premium Style */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={loading || (!caption.trim() && !mediaUrl && !showPollInput)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 shrink-0 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    style={{
                        background: loading || (!caption.trim() && !mediaUrl && !showPollInput) 
                            ? 'rgba(128,128,128,0.3)' 
                            : `linear-gradient(135deg, ${userAccent}, ${userAccent}dd)`,
                        color: loading || (!caption.trim() && !mediaUrl && !showPollInput) ? '#888' : '#000',
                        boxShadow: loading || (!caption.trim() && !mediaUrl && !showPollInput) ? 'none' : `0 4px 20px ${userAccent}50`
                    }}
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    <span>Publicar</span>
                </motion.button>
            </div>
        </motion.div>
    );
}
