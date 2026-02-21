import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import { Check, Star, Shield, Zap, Edit2 } from 'lucide-react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Initialize Mercado Pago
const mpKey = import.meta.env.VITE_MP_PUBLIC_KEY;
if (mpKey) {
    initMercadoPago(mpKey, { locale: 'pt-BR' });
} else {
    console.warn('Mercado Pago public key not found');
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
    iconName: string;
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
        name: 'MGT LOG Stock',
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
        name: 'MGT LOG Signature',
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
        name: 'MGT LOG Plotted',
        price: 10,
        displayPrice: 'R$ 10',
        period: '/mês',
        description: 'Carros personalizados, com identidade MGT.',
        features: ['4 carros por mês', '1 todo sábado', 'Personalização exclusiva', 'Acesso à coleção custom'],
        highlight: false,
        iconName: 'Zap'
    }
];

export default function MgtLogPage() {
    const { user, showError } = useAuth();
    const { isStdTier } = useCommunity();
    const navigate = useNavigate();
    const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;
    const isAdmin = user?.role === 'ADMIN';
    const [loading, setLoading] = useState<string | null>(null);

    // Theme Colors (emerald for MGT, gold for Magazine)
    const themeAccent = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeButton = isMGT ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gold-500 hover:bg-gold-400';
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT ? 'shadow-emerald-500/20' : 'shadow-gold-500/20';

    const [pageContent, setPageContent] = useState<PageContent>({
        tag: 'Nova Assinatura Premium',
        heroTitle: 'Anunciamos a',
        heroDescription: 'Nem todo carro criado é igual. Alguns carregam um nome.\nEscolha seu plano e defina seu legado na elite.',
        logoUrl: '/assets/mgt-log-logo.png',
        plans: defaultPlans,
        footerText: '* A disponibilidade de modelos pode variar conforme cada atualização.',
        footerSubText: 'Disponível em breve para membros MGT. Assine e receba acesso prioritário à nova coleção.'
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get('/content/mgt-log-page');
                if (response.data) {
                    const mergedContent = { ...pageContent, ...response.data };
                    if (!mergedContent.plans || mergedContent.plans.length === 0) {
                        mergedContent.plans = defaultPlans;
                    }
                    setPageContent(mergedContent);
                }
            } catch (error) {
                console.error('Failed to fetch page content', error);
            }
        };
        fetchContent();
    }, []);

    const handleSubscribe = async (plan: Plan) => {
        try {
            setLoading(plan.id);
            const response = await api.post('/create-preference', {
                title: plan.name,
                price: plan.price,
                planId: plan.id
            });

            const data = response.data;

            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                showError('Erro ao iniciar pagamento', 'Tente novamente.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Erro ao conectar', 'Não foi possível conectar com o servidor.');
        } finally {
            setLoading(null);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Shield': return Shield;
            case 'Star': return Star;
            case 'Zap': return Zap;
            default: return Star;
        }
    };

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative overflow-x-hidden">
            <LuxuriousBackground />
            <Header />

            {isAdmin && (
                <button
                    onClick={() => navigate('/admin/edit-mgt-log')}
                    className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-500 transition-all hover:scale-110"
                    title="Editar Página"
                >
                    <Edit2 className="w-6 h-6 text-white" />
                </button>
            )}



            <div className="relative z-10 pt-48 pb-20 px-4 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-20 animate-fade-in-down">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Star className={`w-4 h-4 ${themeAccent}`} />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{pageContent.tag}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight flex flex-col items-center">
                        {pageContent.heroTitle} <br />
                        <div className="relative mt-0 group">
                            <div className={`absolute inset-0 ${isMGT ? 'bg-emerald-600' : 'bg-gold-500'} blur-[40px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full`} />
                            <img
                                src={pageContent.logoUrl}
                                alt="MGT LOG"
                                className="h-48 md:h-64 w-auto relative z-10 drop-shadow-2xl invert brightness-0"
                            />
                        </div>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed whitespace-pre-line">
                        {pageContent.heroDescription}
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {pageContent.plans.map((plan, index) => {
                        const Icon = getIcon(plan.iconName);
                        return (
                            <div
                                key={plan.id}
                                className={`relative group p-8 rounded-3xl backdrop-blur-xl border transition-all duration-500 
                                    ${plan.highlight
                                        ? `bg-white/10 ${themeBorder} scale-105 shadow-2xl ${themeGlow} z-10`
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-[1.02]'
                                    }
                                    ${index === 1 ? 'delay-150' : index === 2 ? 'delay-300' : ''}
                                `}
                            >
                                {plan.highlight && (
                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full ${themeButton} text-white text-xs font-bold uppercase tracking-widest shadow-lg`}>
                                        Mais Popular
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${themeAccent}`}>
                                    <Icon className="w-6 h-6" />
                                </div>

                                <h3 className="text-2xl font-serif text-white mb-2">{plan.name}</h3>
                                <p className="text-sm text-gray-400 mb-6 min-h-[40px]">{plan.description}</p>

                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className={`text-4xl font-bold ${plan.highlight ? themeAccent : 'text-white'}`}>
                                        {plan.displayPrice}
                                    </span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                            <Check className={`w-4 h-4 mt-0.5 ${themeAccent}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    disabled={loading === plan.id}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all transform active:scale-[0.98]
                                        ${plan.highlight
                                            ? `${themeButton} text-white shadow-lg`
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                        }
                                        ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                    onClick={() => handleSubscribe(plan)}
                                >
                                    {loading === plan.id ? 'Processando...' : 'Assinar Agora'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Note */}
                <div className="text-center mt-16 text-gray-500 text-sm font-light">
                    <p>{pageContent.footerText}</p>
                    <p className="mt-2">{pageContent.footerSubText}</p>
                </div>
            </div>
        </div>
    );
}
