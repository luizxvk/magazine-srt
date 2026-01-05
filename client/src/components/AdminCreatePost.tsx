import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { Image as ImageIcon, Send, X, Layers, Sparkles } from 'lucide-react';
import api from '../services/api';


interface AdminCreatePostProps {
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminCreatePost({ showToast }: AdminCreatePostProps) {
    const [caption, setCaption] = useState('');
    const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'TEXT'>('TEXT');
    const [mediaUrl, setMediaUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [isHighlight, setIsHighlight] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!caption.trim() && !mediaUrl) return;

        setLoading(true);

        try {
            await api.post('/posts', {
                caption,
                mediaType: mediaUrl ? mediaType : 'TEXT',
                imageUrl: mediaType === 'IMAGE' ? mediaUrl : undefined,
                videoUrl: mediaType === 'VIDEO' ? mediaUrl : undefined,
                tags: ['OFFICIAL', 'ADMIN'],
                isHighlight: isHighlight
            });

            setCaption('');
            setMediaUrl('');
            setMediaType('TEXT');
            if (showToast) showToast('Postagem oficial criada com sucesso!', 'success');
        } catch (error: any) {
            console.error('Failed to create post', error);
            if (showToast) {
                showToast(`Erro ao criar post: ${error.response?.data?.error || error.message}`, 'error');
            } else {
                alert(`Erro ao criar post: ${error.response?.data?.error || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaUrl(reader.result as string);
                setMediaType('IMAGE'); // Simplified for now
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
            {/* Liquid Glass Effect Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-gold-500/20 transition-colors duration-700" />

            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2 relative z-10">
                <Sparkles className="w-5 h-5 text-gold-400" /> Criar Postagem Oficial
            </h2>

            <div className="space-y-4 relative z-10">
                <div className="relative">
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="O que a equipe Magazine tem a dizer?"
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-gold-500/50 outline-none resize-none transition-all"
                    />
                    {mediaUrl && (
                        <div className="mt-2 relative rounded-lg overflow-hidden border border-white/10 group/media">
                            <img src={mediaUrl} alt="Preview" className="w-full h-32 object-cover" />
                            <button
                                onClick={() => setMediaUrl('')}
                                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                                aria-label="Remover mídia"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-white/5 hover:bg-white/10 text-gold-400 rounded-lg transition-colors border border-white/5"
                            title="Adicionar Mídia"
                            aria-label="Adicionar mídia"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        <button
                            onClick={() => setIsHighlight(!isHighlight)}
                            className={`p-2 rounded-lg transition-colors border flex items-center gap-2 ${isHighlight ? 'bg-gold-500/20 border-gold-500/30 text-gold-400' : 'bg-white/5 border-white/5 text-gray-400'}`}
                            title="Priorizar no Feed"
                            aria-label={isHighlight ? 'Remover destaque' : 'Adicionar destaque'}
                        >
                            <Layers className="w-5 h-5" />
                            <span className="text-xs font-medium hidden sm:inline">Destaque</span>
                        </button>
                    </div>

                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading || (!caption.trim() && !mediaUrl)}
                        className="bg-gold-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-gold-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Enviando...' : 'Publicar'}
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
