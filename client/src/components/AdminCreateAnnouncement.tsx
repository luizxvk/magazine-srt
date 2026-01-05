import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { Image as ImageIcon, Send, Megaphone, Upload, X, Zap, Shield, Trash2, Save } from 'lucide-react';
import api from '../services/api';

interface AdminCreateAnnouncementProps {
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface Plan {
    id: string;
    name: string;
    price: number;
    displayPrice: string;
    period: string;
    description: string;
    features: string[];
    highlight: boolean;
    iconName: 'Shield' | 'Star' | 'Zap';
}

const defaultPlans: Plan[] = [
    {
        id: 'stock',
        name: 'SRT LOG Stock',
        price: 5,
        displayPrice: 'R$ 5',
        period: '/mês',
        description: 'Carros originais, prontos para serem conduzidos.',
        features: ['4 carros por mês', '1 todo sábado', 'Acesso à coleção básica', 'Suporte padrão'],
        highlight: false,
        iconName: 'Shield'
    },
    {
        id: 'signature',
        name: 'SRT LOG Signature',
        price: 15,
        displayPrice: 'R$ 15',
        period: '/mês',
        description: 'Carros exclusivos da nova atualização. Modelos selecionados, edição limitada.',
        features: ['Modelos Selecionados*', 'Edição Limitada', 'Acesso antecipado', 'Suporte VIP 24/7', 'Badge Exclusivo no Perfil'],
        highlight: true,
        iconName: 'Star'
    },
    {
        id: 'plotted',
        name: 'SRT LOG Plotted',
        price: 10,
        displayPrice: 'R$ 10',
        period: '/mês',
        description: 'Carros personalizados, com identidade SRT.',
        features: ['4 carros por mês', '1 todo sábado', 'Personalização exclusiva', 'Acesso à coleção custom'],
        highlight: false,
        iconName: 'Zap'
    }
];

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
        tag: 'Nova Assinatura Premium',
        heroTitle: 'Anunciamos a',
        heroDescription: '',
        logoUrl: '/assets/mgt-log-logo.png',
        plans: defaultPlans,
        footerText: '',
        footerSubText: ''
    });

    // Fetch page content when entering edit tab
    useEffect(() => {
        if (activeTab === 'edit_page') {
            fetchPageContent();
        }
    }, [activeTab]);

    const fetchPageContent = async () => {
        try {
            const response = await api.get('/content/mgt-log-page');
            if (response.data) {
                // Determine if the response is directly the content or wrapped in `value`
                const contentData = response.data.value || response.data;
                const mergedContent = { ...pageContent, ...contentData };

                if (!mergedContent.plans || mergedContent.plans.length === 0) {
                    mergedContent.plans = defaultPlans;
                }
                setPageContent(mergedContent);
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
            // Send exactly as PageContent model expects (wrapped or direct depending on controller logic)
            // Based on previous debugging, controller expects body to be the content directly usually, or wrapped in `value` for generic content routes.
            // Let's assume generic content route: PUT /content/:key -> { value: ... }
            await api.put('/content/mgt-log-page', {
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

    const updatePlan = (index: number, field: keyof Plan, value: any) => {
        const newPlans = [...pageContent.plans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setPageContent({ ...pageContent, plans: newPlans });
    };

    const updatePlanFeatures = (index: number, featuresText: string) => {
        const features = featuresText.split('\n');
        updatePlan(index, 'features', features);
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
                                            aria-label="Remover logo"
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
                                            aria-label="Remover imagem de fundo"
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
                <div className="space-y-6 relative z-10 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Hero Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Tag Superior</label>
                            <input
                                type="text"
                                value={pageContent.tag}
                                onChange={(e) => setPageContent(prev => ({ ...prev, tag: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Título Principal</label>
                            <input
                                type="text"
                                value={pageContent.heroTitle}
                                onChange={(e) => setPageContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Logo Principal (Arquivo)</label>
                            <div className="flex gap-4 items-center">
                                <div className="relative group cursor-pointer" onClick={() => document.getElementById('logo-upload-edit')?.click()}>
                                    <div className="w-20 h-20 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                                        {pageContent.logoUrl ? (
                                            <img src={pageContent.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Upload className="text-gray-500 w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                        <span className="text-[10px] text-white">Alterar</span>
                                    </div>
                                </div>
                                <input
                                    id="logo-upload-edit"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setPageContent({ ...pageContent, logoUrl: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <div className="text-xs text-gray-500 max-w-xs">
                                    Clique na imagem para enviar uma nova logo.
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Descrição Principal</label>
                            <textarea
                                value={pageContent.heroDescription}
                                onChange={(e) => setPageContent(prev => ({ ...prev, heroDescription: e.target.value }))}
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-red-500/50 outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-4" />

                    {/* Plans Editor */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-gold-500" /> Planos
                        </h3>
                        <div className="space-y-4">
                            {pageContent.plans.map((plan, index) => (
                                <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400">Plano {index + 1}</span>
                                            <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={plan.highlight}
                                                    onChange={(e) => updatePlan(index, 'highlight', e.target.checked)}
                                                    className="accent-red-500 w-3 h-3"
                                                />
                                                <span className="text-[10px] text-gray-400">Destaque</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <input
                                            type="text"
                                            value={plan.name}
                                            onChange={(e) => updatePlan(index, 'name', e.target.value)}
                                            className="col-span-2 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                            placeholder="Nome do Plano"
                                        />
                                        <input
                                            type="text"
                                            value={plan.displayPrice}
                                            onChange={(e) => updatePlan(index, 'displayPrice', e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                            placeholder="Preço (Ex: R$ 5)"
                                        />
                                        <input
                                            type="number"
                                            value={plan.price}
                                            onChange={(e) => updatePlan(index, 'price', Number(e.target.value))}
                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                            placeholder="Valor Numérico"
                                        />
                                    </div>

                                    <textarea
                                        value={plan.description}
                                        onChange={(e) => updatePlan(index, 'description', e.target.value)}
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white mb-3 resize-none"
                                        placeholder="Descrição curta"
                                    />

                                    <textarea
                                        value={plan.features.join('\n')}
                                        onChange={(e) => updatePlanFeatures(index, e.target.value)}
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 resize-none font-mono"
                                        placeholder="Lista de benefícios (1 por linha)"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-4" />

                    {/* Footer */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gold-500" /> Rodapé
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={pageContent.footerText}
                                onChange={(e) => setPageContent(prev => ({ ...prev, footerText: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                placeholder="Texto de aviso (*)"
                            />
                            <input
                                type="text"
                                value={pageContent.footerSubText}
                                onChange={(e) => setPageContent(prev => ({ ...prev, footerSubText: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                placeholder="Subtexto"
                            />
                        </div>
                    </div>

                    <div className="sticky bottom-0 z-20 flex gap-3 bg-[#111] p-4 -mx-2 -mb-2 border-t border-white/10">
                        <button
                            onClick={async () => {
                                if (!window.confirm('Tem certeza que deseja remover este anúncio? Ele será ocultado do feed.')) return;
                                try {
                                    setLoading(true);
                                    await api.put('/content/mgt-log-page', {
                                        logoUrl: '',
                                        heroTitle: '',
                                        heroSubtitle: '',
                                        cards: [],
                                        // Preserve footer to avoid complete breakage or clear if desired. 
                                        // Clearing main fields usually hides it.
                                    });
                                    setPageContent({
                                        ...pageContent,
                                        logoUrl: '',
                                        heroTitle: '',
                                        tag: '',
                                        heroDescription: ''
                                    });
                                    alert('Anúncio removido com sucesso!'); // Using alert as simple feedback
                                } catch (error) {
                                    console.error('Failed to remove', error);
                                    alert('Erro ao remover anúncio');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="flex-1 bg-red-900/50 text-red-200 font-medium py-3 rounded-lg hover:bg-red-900/70 transition-colors flex items-center justify-center gap-2 border border-red-800"
                        >
                            Remover Anúncio
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handlePageContentUpdate}
                            disabled={loading}
                            className="flex-[2] bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-xl"
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
