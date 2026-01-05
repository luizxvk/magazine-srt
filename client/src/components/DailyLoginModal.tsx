import { useState } from 'react';
import { X, Check, Gift, ChevronRight, ChevronLeft, Star, Zap, ShoppingBag, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface DailyLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: {
        claimed: boolean;
        streak: number;
        nextReward: number;
        rewards: number[];
    } | null;
    onClaim: () => void;
}

export default function DailyLoginModal({ isOpen, onClose, status, onClaim }: DailyLoginModalProps) {
    const { user, theme } = useAuth();
    const [claiming, setClaiming] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    if (!isOpen || !status) return null;

    const handleClaim = async () => {
        setClaiming(true);
        try {
            await onClaim();
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: user?.membershipType === 'MGT' ? ['#ef4444', '#b91c1c', '#ffffff'] : ['#eab308', '#a16207', '#ffffff']
            });
        } catch (error) {
            console.error('Failed to claim', error);
        } finally {
            setClaiming(false);
        }
    };

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';
    const themeBorder = isMGT
        ? (theme === 'light' ? 'border-red-500/30' : 'border-red-500/30')
        : (theme === 'light' ? 'border-gold-500/30' : 'border-gold-500/30');
    const themeText = isMGT
        ? (theme === 'light' ? 'text-red-700' : 'text-red-200')
        : (theme === 'light' ? 'text-gold-700' : 'text-gold-200');

    const containerBg = theme === 'light' ? 'bg-white/95' : 'bg-black/90';
    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    const subTextColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const cardBg = theme === 'light' ? 'bg-gray-100 border-gray-200 hover:bg-gray-200' : 'bg-white/5 border-white/5 hover:bg-white/10';
    const closeBtnColor = theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-white';

    const currentDayIndex = status.claimed ? (status.streak - 1) % 7 : status.streak % 7;

    const nextSlide = () => setCurrentSlide((prev) => (prev === 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? 1 : prev - 1));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md ${containerBg} border ${themeBorder} rounded-2xl p-6 shadow-2xl transform transition-all scale-100 min-h-[500px] flex flex-col`}
            >
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 ${closeBtnColor} transition-colors z-10`}
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Carousel Content */}
                <div className="flex-1 flex items-center justify-center">
                    {currentSlide === 0 ? (
                        // Slide 0: Briefing / Welcome
                        <div className="w-full animate-fade-in">
                            <div className="text-center mb-6">
                                <h2 className={`text-2xl font-serif ${textColor} mb-2`}>Bem-vindo à {isMGT ? 'MGT' : 'Magazine'}</h2>
                                <p className={`${subTextColor} text-sm`}>Explore o universo exclusivo da nossa comunidade.</p>
                            </div>

                            <div className="space-y-4">
                                <div className={`flex items-center gap-4 p-3 rounded-xl ${cardBg} transition-colors`}>
                                    <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5'} ${themeColor}`}>
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-medium ${themeText}`}>Feed Exclusivo</h3>
                                        <p className={`text-xs ${subTextColor}`}>Compartilhe momentos com a elite.</p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 p-3 rounded-xl ${cardBg} transition-colors`}>
                                    <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5'} ${themeColor}`}>
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-medium ${themeText}`}>Sistema de Zions</h3>
                                        <p className={`text-xs ${subTextColor}`}>Ganhe moedas por engajamento.</p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 p-3 rounded-xl ${cardBg} transition-colors`}>
                                    <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5'} ${themeColor}`}>
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-medium ${themeText}`}>Loja Premium</h3>
                                        <p className={`text-xs ${subTextColor}`}>Troque Zions por recompensas reais.</p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 p-3 rounded-xl ${cardBg} transition-colors`}>
                                    <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/5'} ${themeColor}`}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-medium ${themeText}`}>Eventos VIP</h3>
                                        <p className={`text-xs ${subTextColor}`}>Acesso a encontros exclusivos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Slide 1: Daily Bonus
                        <div className="w-full animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className={`text-2xl font-serif ${textColor} mb-2`}>Bônus Diário</h2>
                                <p className={`${subTextColor} text-sm`}>
                                    Entre todos os dias para ganhar mais Zions!
                                </p>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-8">
                                {status.rewards.map((amount, index) => {
                                    const isToday = index === currentDayIndex;
                                    const isPast = index < currentDayIndex;
                                    const isBigReward = index === 6; // Day 7

                                    let stateClass = theme === 'light' ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-white/10 bg-white/5 text-gray-500'; // Future

                                    if (isPast) {
                                        stateClass = `${isMGT ? 'border-emerald-500/50 bg-red-500/10 text-red-400' : 'border-gold-500/50 bg-gold-500/10 text-gold-400'}`;
                                    } else if (isToday) {
                                        stateClass = `${isMGT ? 'border-emerald-500 bg-red-500/20 text-white shadow-[0_0_15px_rgba(220,20,60,0.3)]' : 'border-gold-500 bg-gold-500/20 text-white shadow-[0_0_15px_rgba(212,175,55,0.3)]'} scale-105 z-10`;
                                    }

                                    return (
                                        <div
                                            key={index}
                                            className={`
                                                relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all
                                                ${stateClass}
                                                ${isBigReward ? 'col-span-2 aspect-auto' : 'aspect-square'}
                                            `}
                                        >
                                            <span className="text-[10px] uppercase tracking-wider mb-1">Dia {index + 1}</span>
                                            {isPast ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <span className="text-lg font-bold">{amount}</span>
                                            )}
                                            {isBigReward && <Gift className={`w-4 h-4 absolute top-2 right-2 ${themeColor}`} />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-center">
                                {status.claimed ? (
                                    <div className={`inline-flex items-center gap-2 ${subTextColor} ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} px-6 py-3 rounded-full`}>
                                        <Check className="w-5 h-5" />
                                        <span>Volte amanhã para mais!</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleClaim}
                                        disabled={claiming}
                                        className={`
                                            w-full py-3 rounded-xl font-bold text-black uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                            ${themeBg} hover:opacity-90
                                            ${claiming ? 'opacity-50 cursor-not-allowed' : 'shadow-lg'}
                                        `}
                                    >
                                        {claiming ? 'Resgatando...' : 'Resgatar Agora'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Dots */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setCurrentSlide(0)} className={`w-2 h-2 rounded-full transition-all ${currentSlide === 0 ? `w-6 ${themeBg}` : (theme === 'light' ? 'bg-gray-300 hover:bg-gray-400' : 'bg-white/20 hover:bg-white/40')}`} aria-label="Slide 1" />
                    <button onClick={() => setCurrentSlide(1)} className={`w-2 h-2 rounded-full transition-all ${currentSlide === 1 ? `w-6 ${themeBg}` : (theme === 'light' ? 'bg-gray-300 hover:bg-gray-400' : 'bg-white/20 hover:bg-white/40')}`} aria-label="Slide 2" />
                </div>

                {/* Navigation Arrows (Optional, maybe for desktop) */}
                <button
                    onClick={prevSlide}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-white/50 hover:text-white'} transition-colors`}
                    aria-label="Slide anterior"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={nextSlide}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-white/50 hover:text-white'} transition-colors`}
                    aria-label="Próximo slide"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
