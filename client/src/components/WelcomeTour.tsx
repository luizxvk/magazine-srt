import { useState, useEffect } from 'react';
import { X, ChevronRight, Star, Award, Layout, Zap, ShoppingBag, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WelcomeTour() {
    const { theme, user } = useAuth();
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const isMGT = user?.membershipType === 'MGT';
    const accentColor = isMGT ? 'emerald' : 'gold';

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('has_seen_tour');
        if (!hasSeenTour) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('has_seen_tour', 'true');
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
            description: "Explore o universo exclusivo da nossa comunidade.",
            icon: <Star className="w-12 h-12 text-emerald-400" />
        },
        {
            title: "Feed Exclusivo",
            description: "Compartilhe momentos com a elite.",
            icon: <Layout className="w-12 h-12 text-emerald-400" />
        },
        {
            title: "Sistema de Zions",
            description: "Ganhe moedas por engajamento.",
            icon: <Zap className="w-12 h-12 text-emerald-400" />
        },
        {
            title: "Loja Premium",
            description: "Troque Zions por recompensas reais.",
            icon: <ShoppingBag className="w-12 h-12 text-emerald-400" />
        },
        {
            title: "Eventos VIP",
            description: "Acesso a encontros exclusivos.",
            icon: <Calendar className="w-12 h-12 text-emerald-400" />
        }
    ] : [
        {
            title: "Bem-vindo ao Magazine",
            description: "Uma experiência exclusiva de rede social, gamificação e recompensas.",
            icon: <Star className="w-12 h-12 text-gold-400" />
        },
        {
            title: "Feed Premium",
            description: "Compartilhe seus momentos, interaja com a comunidade e descubra conteúdos incríveis.",
            icon: <Layout className="w-12 h-12 text-gold-400" />
        },
        {
            title: "Gamificação",
            description: "Ganhe troféus por interagir, suba no ranking e desbloqueie recompensas exclusivas.",
            icon: <Award className="w-12 h-12 text-gold-400" />
        }
    ];

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-900'} border ${theme === 'light' ? `border-${accentColor}-500/20` : `border-${accentColor}-500/30`} rounded-2xl p-8 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(212,175,55,0.2)]`}>
                <button
                    onClick={handleClose}
                    className={`absolute top-4 right-4 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-white'} transition-colors`}
                    aria-label="Fechar tour"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="mb-6 flex justify-center">
                    <div className={`w-24 h-24 ${theme === 'light' ? (isMGT ? 'bg-emerald-50' : 'bg-gold-50') : (isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10')} rounded-full flex items-center justify-center border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
                        {steps[step].icon}
                    </div>
                </div>

                <h2 className={`text-2xl font-serif ${theme === 'light' ? 'text-gray-900' : (isMGT ? 'text-emerald-300' : 'text-gold-300')} mb-4`}>{steps[step].title}</h2>
                <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} mb-8 leading-relaxed`}>{steps[step].description}</p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${i === step ? (isMGT ? 'bg-emerald-500' : 'bg-gold-500') : (theme === 'light' ? 'bg-gray-300' : 'bg-gray-700')}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'} text-black px-6 py-2 rounded-full font-medium ${isMGT ? 'hover:bg-emerald-400' : 'hover:bg-gold-400'} transition-colors`}
                    >
                        {step === steps.length - 1 ? 'Começar' : 'Próximo'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
