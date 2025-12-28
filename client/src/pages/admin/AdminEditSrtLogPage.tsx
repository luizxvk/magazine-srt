import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Star, Shield, Zap } from 'lucide-react';
import api from '../../services/api';
import LuxuriousBackground from '../../components/LuxuriousBackground';
import Header from '../../components/Header';

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

interface PageContent {
    tag: string;
    heroTitle: string;
    heroDescription: string;
    logoUrl: string;
    plans: Plan[];
    footerText: string;
    footerSubText: string;
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

export default function AdminEditSrtLogPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState<PageContent>({
        tag: 'Nova Assinatura Premium',
        heroTitle: 'Anunciamos a',
        heroDescription: 'Nem todo carro criado é igual. Alguns carregam um nome.\nEscolha seu plano e defina seu legado na elite.',
        logoUrl: '/assets/srt-log-logo.png',
        plans: defaultPlans,
        footerText: '* A disponibilidade de modelos pode variar conforme cada atualização.',
        footerSubText: 'Disponível em breve para membros SRT. Assine e receba acesso prioritário à nova coleção.'
    });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await api.get('/content/srt-log-page');
            if (response.data) {
                // Ensure plans exist, merge with default if missing
                const mergedContent = { ...content, ...response.data };
                if (!mergedContent.plans || mergedContent.plans.length === 0) {
                    mergedContent.plans = defaultPlans;
                }
                setContent(mergedContent);
            }
        } catch (error) {
            console.error('Failed to fetch content', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/content/srt-log-page', content); // Using POST/PUT handled by controller
            alert('Alterações salvas com sucesso!');
        } catch (error) {
            console.error('Failed to save content', error);
            alert('Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const updatePlan = (index: number, field: keyof Plan, value: any) => {
        const newPlans = [...content.plans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setContent({ ...content, plans: newPlans });
    };

    const updatePlanFeatures = (index: number, featuresText: string) => {
        const features = featuresText.split('\n').filter(f => f.trim() !== '');
        updatePlan(index, 'features', features);
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Carregando...</div>;

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
            <LuxuriousBackground />
            <Header />

            <main className="pt-32 pb-20 px-4 max-w-5xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gold-400" />
                        </button>
                        <h1 className="text-3xl font-serif font-bold text-white">Editar Página SRT Log</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>

                <div className="space-y-8">
                    {/* General Settings */}
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-serif text-gold-400 mb-6 flex items-center gap-2">
                            <Star className="w-5 h-5" /> Informações Principais
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Tag (Topo)</label>
                                <input
                                    type="text"
                                    aria-label="Tag"
                                    value={content.tag}
                                    onChange={(e) => setContent({ ...content, tag: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Título Principal</label>
                                <input
                                    type="text"
                                    aria-label="Título Principal"
                                    value={content.heroTitle}
                                    onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors"
                                />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Descrição Principal</label>
                                <textarea
                                    aria-label="Descrição Principal"
                                    value={content.heroDescription}
                                    onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors resize-none"
                                />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">URL da Logo</label>
                                <input
                                    type="text"
                                    aria-label="URL da Logo"
                                    value={content.logoUrl}
                                    onChange={(e) => setContent({ ...content, logoUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Plans */}
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-serif text-gold-400 mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5" /> Planos e Produtos
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {content.plans.map((plan, index) => (
                                <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                        <span className="text-sm font-bold text-gray-300">Plano {index + 1}</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                aria-label="Destaque"
                                                checked={plan.highlight}
                                                onChange={(e) => updatePlan(index, 'highlight', e.target.checked)}
                                                className="accent-gold-500"
                                            />
                                            <span className="text-xs text-gold-400">Destaque</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nome</label>
                                        <input
                                            type="text"
                                            aria-label="Nome do Plano"
                                            value={plan.name}
                                            onChange={(e) => updatePlan(index, 'name', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Preço (Num)</label>
                                            <input
                                                type="number"
                                                aria-label="Preço Numérico"
                                                value={plan.price}
                                                onChange={(e) => updatePlan(index, 'price', Number(e.target.value))}
                                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Preço (Display)</label>
                                            <input
                                                type="text"
                                                aria-label="Preço de Exibição"
                                                value={plan.displayPrice}
                                                onChange={(e) => updatePlan(index, 'displayPrice', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Descrição</label>
                                        <textarea
                                            aria-label="Descrição do Plano"
                                            value={plan.description}
                                            onChange={(e) => updatePlan(index, 'description', e.target.value)}
                                            rows={2}
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Destaques (1 por linha)</label>
                                        <textarea
                                            aria-label="Destaques do Plano"
                                            value={plan.features.join('\n')}
                                            onChange={(e) => updatePlanFeatures(index, e.target.value)}
                                            rows={5}
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white resize-none font-mono"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-serif text-gold-400 mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5" /> Rodapé
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Texto de Aviso (*)</label>
                                <input
                                    type="text"
                                    aria-label="Texto de Aviso"
                                    value={content.footerText}
                                    onChange={(e) => setContent({ ...content, footerText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Subtexto</label>
                                <input
                                    type="text"
                                    aria-label="Subtexto"
                                    value={content.footerSubText}
                                    onChange={(e) => setContent({ ...content, footerSubText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
