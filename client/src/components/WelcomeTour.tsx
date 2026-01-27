import { useState, useEffect } from 'react';
import { X, ChevronRight, Star, Layout, Zap, ShoppingBag, Calendar, Trophy, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface WelcomeTourProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function WelcomeTour({ isOpen: externalIsOpen, onClose: externalOnClose }: WelcomeTourProps = {}) {
    const { theme, user } = useAuth();
    const [step, setStep] = useState(0);
    const [internalIsVisible, setInternalIsVisible] = useState(false);
    const isMGT = user?.membershipType === 'MGT';

    // Use external state if provided, otherwise use internal state
    const isVisible = externalIsOpen !== undefined ? externalIsOpen : internalIsVisible;

    useEffect(() => {
        // Only auto-show if using internal state (no external control)
        if (externalIsOpen !== undefined) return;
        
        const hasSeenTour = localStorage.getItem('has_seen_tour');
        if (!hasSeenTour) {
            setInternalIsVisible(true);
        }
    }, [externalIsOpen]);

    const handleClose = () => {
        setStep(0);
        localStorage.setItem('has_seen_tour', 'true');
        if (externalOnClose) {
            externalOnClose();
        } else {
            setInternalIsVisible(false);
        }
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const steps = isMGT ? [
        {
            title: "Bem-vindo à MGT",
            description: "Você faz parte de uma comunidade exclusiva! Aqui você terá acesso a funcionalidades únicas, recompensas especiais e muito mais.",
            icon: <Star className="w-12 h-12 text-emerald-400" />,
            features: ["Acesso exclusivo MGT", "Tema esmeralda personalizado", "Benefícios VIP"]
        },
        {
            title: "Feed & Comunidade",
            description: "Compartilhe momentos, crie posts com imagens, interaja com curtidas e comentários. Conecte-se com outros membros!",
            icon: <Layout className="w-12 h-12 text-emerald-400" />,
            features: ["Posts com mídia", "Curtidas e comentários", "Stories temporários"]
        },
        {
            title: "Sistema de Zions",
            description: "Nossa moeda virtual! Ganhe Zions por engajamento: posts, curtidas, comentários e login diário.",
            icon: <Zap className="w-12 h-12 text-emerald-400" />,
            features: ["Recompensas diárias", "Bônus por engajamento", "Multiplicadores"]
        },
        {
            title: "Loja & Recompensas",
            description: "Troque seus Zions por recompensas reais! Gift cards, itens exclusivos e muito mais.",
            icon: <ShoppingBag className="w-12 h-12 text-emerald-400" />,
            features: ["Gift Cards", "Itens exclusivos", "Recompensas rotativas"]
        },
        {
            title: "Ranking & Conquistas",
            description: "Suba de nível, desbloqueie badges exclusivos e dispute posições no ranking global!",
            icon: <Trophy className="w-12 h-12 text-emerald-400" />,
            features: ["Sistema de níveis", "Badges colecionáveis", "Ranking semanal"]
        },
        {
            title: "Eventos & Mais",
            description: "Acesso a eventos VIP, rádio integrada, grupos e muito mais recursos por vir!",
            icon: <Calendar className="w-12 h-12 text-emerald-400" />,
            features: ["Eventos exclusivos", "Rádio Lo-Fi", "Grupos privados"]
        }
    ] : [
        {
            title: "Bem-vindo ao Magazine",
            description: "Uma plataforma exclusiva que combina rede social, gamificação e recompensas reais. Explore tudo o que preparamos para você!",
            icon: <Star className="w-12 h-12 text-gold-400" />,
            features: ["Rede social premium", "Sistema de recompensas", "Comunidade exclusiva"]
        },
        {
            title: "Feed & Posts",
            description: "Compartilhe seus momentos com posts, imagens e interaja com a comunidade através de curtidas e comentários.",
            icon: <Layout className="w-12 h-12 text-gold-400" />,
            features: ["Posts com mídia", "Curtidas e comentários", "Stories 24h"]
        },
        {
            title: "Sistema de Zions",
            description: "Ganhe Zions (nossa moeda virtual) por tudo que você faz: posts, curtidas, comentários, login diário e mais!",
            icon: <Zap className="w-12 h-12 text-gold-400" />,
            features: ["Moeda virtual", "Recompensas diárias", "Bônus de engajamento"]
        },
        {
            title: "Loja Premium",
            description: "Use seus Zions para resgatar recompensas reais! Gift cards, itens exclusivos e muito mais.",
            icon: <ShoppingBag className="w-12 h-12 text-gold-400" />,
            features: ["Gift Cards", "Itens exclusivos", "Recompensas rotativas"]
        },
        {
            title: "Ranking & Níveis",
            description: "Suba de nível com sua atividade, colecione badges exclusivos e dispute posições no ranking!",
            icon: <Trophy className="w-12 h-12 text-gold-400" />,
            features: ["15 níveis", "Badges únicos", "Ranking global"]
        },
        {
            title: "Recursos Extras",
            description: "Rádio integrada, eventos, grupos de chat, customização de perfil e muito mais funcionalidades!",
            icon: <Sparkles className="w-12 h-12 text-gold-400" />,
            features: ["Rádio Lo-Fi", "Eventos VIP", "Customização"]
        }
    ];

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className={`${theme === 'light' ? 'bg-white' : (isMGT ? 'bg-emerald-950/90' : 'bg-[#0a0a0a]')} border ${theme === 'light' ? (isMGT ? 'border-emerald-500/20' : 'border-gold-500/20') : (isMGT ? 'border-emerald-500/30' : 'border-gold-500/30')} rounded-2xl p-6 sm:p-8 max-w-lg w-full text-center relative shadow-[0_0_50px_rgba(212,175,55,0.2)]`}>
                {/* BETA Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${isMGT ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gold-500/20 text-gold-400 border border-gold-500/30'} backdrop-blur-sm shadow-lg`}>
                        BETA v0.4.12
                    </span>
                </div>

                <button
                    onClick={handleClose}
                    className={`absolute top-4 right-4 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-white'} transition-colors z-10`}
                    aria-label="Fechar tour"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Icon centered in card - pushed down to account for badge */}
                <div className="pt-6 pb-4">
                    <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                        <div className={`w-full h-full ${theme === 'light' ? (isMGT ? 'bg-emerald-50' : 'bg-gold-50') : (isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10')} rounded-full flex items-center justify-center border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} animate-pulse`}>
                            {steps[step].icon}
                        </div>
                    </div>
                </div>

                <h2 className={`text-xl sm:text-2xl font-serif ${theme === 'light' ? 'text-gray-900' : (isMGT ? 'text-emerald-300' : 'text-gold-300')} mb-2`}>
                    {steps[step].title}
                </h2>
                
                <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} mb-4 leading-relaxed text-sm sm:text-base`}>
                    {steps[step].description}
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {steps[step].features.map((feature, i) => (
                        <span 
                            key={i}
                            className={`px-3 py-1 text-xs rounded-full ${theme === 'light' 
                                ? (isMGT ? 'bg-emerald-100 text-emerald-700' : 'bg-gold-100 text-gold-700')
                                : (isMGT ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gold-500/10 text-gold-400 border border-gold-500/20')
                            }`}
                        >
                            {feature}
                        </span>
                    ))}
                </div>

                {/* Progress & Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step 
                                    ? (isMGT ? 'bg-emerald-500 w-6' : 'bg-gold-500 w-6') 
                                    : (theme === 'light' ? 'bg-gray-300 hover:bg-gray-400' : 'bg-gray-700 hover:bg-gray-600')
                                }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 ${isMGT ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-gold-500 hover:bg-gold-400'} text-black px-5 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg`}
                    >
                        {step === steps.length - 1 ? 'Começar!' : 'Próximo'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Skip link */}
                <button 
                    onClick={handleClose}
                    className={`mt-4 text-xs ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'} transition-colors`}
                >
                    Pular introdução
                </button>
            </div>
        </div>
    );
}
