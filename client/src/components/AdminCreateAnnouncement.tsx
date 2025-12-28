import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { Image as ImageIcon, Send, Megaphone, Upload, X } from 'lucide-react';
import api from '../services/api';

interface AdminCreateAnnouncementProps {
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminCreateAnnouncement({ showToast }: AdminCreateAnnouncementProps) {
    const [activeTab, setActiveTab] = useState<'create' | 'edit_page'>('create');
    const [loading, setLoading] = useState(false);

    // Create Announcement State
    const [title, setTitle] = useState('');
    const [tag, setTag] = useState('');
    const [subscriptionType, setSubscriptionType] = useState('');
    const [description, setDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [bgUrl, setBgUrl] = useState('');

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    // Page Content State
    const [pageContent, setPageContent] = useState({
        heroTitle: '',
        heroDescription: ''
    });

    // Fetch page content when entering edit tab
    useEffect(() => {
        if (activeTab === 'edit_page') {
            fetchPageContent();
        }
    }, [activeTab]);

    const fetchPageContent = async () => {
        try {
            const response = await api.get('/content/srt-log-page');
            if (response.data && response.data.value) {
                setPageContent(response.data.value);
            }
        } catch (error) {
            console.error('Failed to fetch page content', error);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!title || !description) {
            if (showToast) showToast('Preencha os campos obrigatórios', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.post('/announcements', {
                title,
                tag,
                subscriptionType,
                description,
                logoUrl,
                backgroundUrl: bgUrl
            });

            // Reset form
            setTitle('');
            setTag('');
            setSubscriptionType('');
            setDescription('');
            setLogoUrl('');
            setBgUrl('');

            if (showToast) showToast('Anúncio criado com sucesso!', 'success');
        } catch (error) {
            console.error('Failed to create announcement', error);
            if (showToast) showToast('Erro ao criar anúncio', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePageContentUpdate = async () => {
        setLoading(true);
        try {
            await api.put('/content/srt-log-page', {
                value: pageContent
            });
            if (showToast) showToast('Página atualizada com sucesso!', 'success');
        } catch (error) {
            console.error('Failed to update page content', error);
            if (showToast) showToast('Erro ao atualizar página', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-red-400" />
                    {activeTab === 'create' ? 'Criar Atualização/Novidade' : 'Editar Página SRT'}
                </h2>

                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Criar Anúncio
                    </button>
                    <button
                        onClick={() => setActiveTab('edit_page')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'edit_page' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Editar Página
                    </button>
                </div>
            </div>

            {activeTab === 'create' ? (
                <div className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Nome do Anúncio/Produto</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none"
                            placeholder="Ex: Anunciamos a..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Tag</label>
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none"
                                placeholder="Ex: Lançamento"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Tipo de Assinatura</label>
                            <input
                                type="text"
                                value={subscriptionType}
                                onChange={(e) => setSubscriptionType(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none"
                                placeholder="Ex: Assinatura Premium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none resize-none"
                            placeholder="Descrição do produto..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Logo/Ícone</label>
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={() => logoInputRef.current?.click()}
                                    onKeyDown={(e) => e.key === 'Enter' && logoInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    className="flex-1 border border-dashed border-white/20 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors h-24 relative overflow-hidden"
                                >
                                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500">Upload Logo</span>
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, setLogoUrl)}
                                    />
                                </div>
                                {logoUrl && (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/20 bg-black/50">
                                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                        <button
                                            onClick={() => setLogoUrl('')}
                                            className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Background Upload */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Imagem de Fundo</label>
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={() => bgInputRef.current?.click()}
                                    onKeyDown={(e) => e.key === 'Enter' && bgInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    className="flex-1 border border-dashed border-white/20 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors h-24 relative overflow-hidden"
                                >
                                    <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500">Upload Fundo</span>
                                    <input
                                        type="file"
                                        ref={bgInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, setBgUrl)}
                                    />
                                </div>
                                {bgUrl && (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/20 bg-black/50">
                                        <img src={bgUrl} alt="Background Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setBgUrl('')}
                                            className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'Criando...' : 'Criar Anúncio'}
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Título Principal (Hero)</label>
                        <input
                            type="text"
                            value={pageContent.heroTitle}
                            onChange={(e) => setPageContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none"
                            placeholder="Ex: Anunciamos a"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Descrição Principal</label>
                        <textarea
                            value={pageContent.heroDescription}
                            onChange={(e) => setPageContent(prev => ({ ...prev, heroDescription: e.target.value }))}
                            rows={4}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none resize-none"
                            placeholder="Descrição do topo da página..."
                        />
                    </div>

                    <button
                        onClick={handlePageContentUpdate}
                        disabled={loading}
                        className="w-full bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
