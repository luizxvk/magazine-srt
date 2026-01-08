import React, { useState } from 'react';
import { X, Image as ImageIcon, Video, Tag, Sparkles, MoreHorizontal } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
    const { user } = useAuth();
    const [caption, setCaption] = useState('');
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'TEXT'>('TEXT');
    const [mediaUrl, setMediaUrl] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isHighlight, setIsHighlight] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    if (!isOpen) return null;

    const canHighlight = (user?.trophies || 0) >= 1000;

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting post...', { caption, mediaUrl, tags, isHighlight });
        // alert('Submitting post...'); // Debug
        setLoading(true);

        try {
            await api.post('/posts', {
                caption,
                mediaType: mediaUrl ? mediaType : 'TEXT',
                imageUrl: mediaType === 'IMAGE' ? mediaUrl : undefined,
                videoUrl: mediaType === 'VIDEO' ? mediaUrl : undefined,
                tags,
                isHighlight: canHighlight ? isHighlight : false
            });

            setCaption('');
            setMediaUrl('');
            setTags([]);
            setIsHighlight(false);
            onPostCreated();
            onClose();
            // alert('Post created successfully!'); // Debug
        } catch (error: any) {
            console.error('Failed to create post', error);
            alert(`Failed to create post: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-2xl transform transition-all animate-fade-in-up">
                {/* Main Card */}
                <div className="bg-[#0a0a0a] rounded-[2rem] border border-gold-500/20 shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden relative">
                    {/* Gold Gradient Segment (Top Line) */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-800" />

                    <div className="p-6 md:p-8">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-500">
                                Criar Publicação
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                title="Fechar"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Input Area - The "Bar" Look */}
                            <div className="bg-white/5 rounded-3xl p-4 md:p-4 border border-white/10 focus-within:border-gold-500/50 transition-colors relative">
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Compartilhe algo exclusivo..."
                                    className="w-full bg-transparent border-none text-white text-base md:text-lg placeholder-gray-500 focus:ring-0 resize-none min-h-[180px] md:min-h-[120px] scrollbar-hide"
                                />

                                {/* Media Preview inside the "Bar" */}
                                {mediaUrl && (
                                    <div className="mt-4 relative rounded-xl overflow-hidden border border-white/10 group">
                                        {mediaType === 'IMAGE' ? (
                                            <img src={mediaUrl} alt="Preview" className="w-full h-64 object-cover" />
                                        ) : (
                                            <video src={mediaUrl} className="w-full h-64 object-cover" controls />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setMediaUrl('')}
                                            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                            title="Remover mídia"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Controls Bar */}
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                {/* Left Side: Media & Tags */}
                                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                    {/* Mobile: Show only More button */}
                                    <div className="md:hidden relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                                            className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:border-gold-500/30 transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5 text-gold-400" />
                                            <span className="text-sm text-gray-400">Opções</span>
                                        </button>
                                        
                                        {/* Mobile Menu Dropdown */}
                                        {showMoreMenu && (
                                            <div className="absolute top-full mt-2 left-0 bg-black/95 border border-white/10 rounded-xl p-2 shadow-xl z-10 min-w-[200px]">
                                                {!mediaUrl && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMediaType('IMAGE');
                                                                const url = prompt('URL da Imagem:');
                                                                if (url) setMediaUrl(url);
                                                                setShowMoreMenu(false);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gold-400 transition-colors"
                                                        >
                                                            <ImageIcon className="w-5 h-5" />
                                                            <span className="text-sm">Adicionar Imagem</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMediaType('VIDEO');
                                                                const url = prompt('URL do Vídeo:');
                                                                if (url) setMediaUrl(url);
                                                                setShowMoreMenu(false);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gold-400 transition-colors"
                                                        >
                                                            <Video className="w-5 h-5" />
                                                            <span className="text-sm">Adicionar Vídeo</span>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        document.getElementById('tag-input')?.focus();
                                                        setShowMoreMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gold-400 transition-colors"
                                                >
                                                    <Tag className="w-5 h-5" />
                                                    <span className="text-sm">Adicionar Tags</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop: Show all icons inline */}
                                    <div className="hidden md:flex items-center gap-2">
                                        {!mediaUrl && (
                                            <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                                                <input
                                                    type="text"
                                                    value={mediaUrl}
                                                    onChange={(e) => {
                                                        setMediaUrl(e.target.value);
                                                        if (e.target.value) setMediaType('IMAGE');
                                                    }}
                                                    placeholder="URL da mídia..."
                                                    className="bg-transparent border-none text-sm text-white focus:ring-0 w-32 md:w-48 placeholder-gray-600"
                                                />
                                                <div className="w-px h-4 bg-white/10" />
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaType('IMAGE')}
                                                    className={`text-gray-400 hover:text-gold-400 transition-colors ${mediaType === 'IMAGE' ? 'text-gold-400' : ''}`}
                                                    title="Adicionar Imagem"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaType('VIDEO')}
                                                    className={`text-gray-400 hover:text-gold-400 transition-colors ${mediaType === 'VIDEO' ? 'text-gold-400' : ''}`}
                                                    title="Adicionar Vídeo"
                                                >
                                                    <Video className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Tag Input */}
                                        <div className="relative group">
                                            <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:border-gold-500/30 transition-colors cursor-text" onClick={() => document.getElementById('tag-input')?.focus()}>
                                                <Tag className="w-4 h-4 text-gold-400" />
                                                <input
                                                    id="tag-input"
                                                    type="text"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={handleAddTag}
                                                    placeholder={tags.length ? "Mais tags..." : "Tags"}
                                                    className="bg-transparent border-none text-sm text-white focus:ring-0 w-20 placeholder-gray-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Switch & Send */}
                                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                    {/* Destaque Switch */}
                                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${isHighlight ? 'bg-gold-500/10 border-gold-500/50' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isHighlight ? 'text-gold-400' : 'text-gray-500'}`}>
                                                Destaque
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isHighlight}
                                                onChange={(e) => setIsHighlight(e.target.checked)}
                                                disabled={!canHighlight}
                                                aria-label="Destacar postagem"
                                            />
                                            <div className={`w-10 h-5 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${!canHighlight ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-700 peer-checked:bg-gold-500'}`}></div>
                                        </label>
                                    </div>

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={loading || (!caption && !mediaUrl)}
                                        className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-black font-bold p-3 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        title="Publicar"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            <Sparkles className="w-6 h-6" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Tags Display */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="bg-gold-500/10 text-gold-400 text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-gold-500/20 animate-fade-in">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white" title="Remover tag">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
