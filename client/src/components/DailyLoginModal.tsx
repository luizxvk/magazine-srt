import { useState } from 'react';
import { X, Check, Gift, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('common');
    const [claiming, setClaiming] = useState(false);

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
    const themeColor = isMGT ? 'text-tier-std-500' : 'text-gold-500';
    const themeBg = isMGT ? 'bg-tier-std-500' : 'bg-gold-500';
    const themeBorder = isMGT
        ? (theme === 'light' ? 'border-tier-std-500/30' : 'border-tier-std-500/30')
        : (theme === 'light' ? 'border-gold-500/30' : 'border-gold-500/30');

    const containerBg = theme === 'light' ? 'bg-white/95' : 'bg-black/90';
    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    const subTextColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const closeBtnColor = theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-white';

    const currentDayIndex = status.claimed ? (status.streak - 1) % 7 : status.streak % 7;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md ${containerBg} border ${themeBorder} rounded-2xl p-6 shadow-2xl transform transition-all scale-100`}
            >
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 ${closeBtnColor} transition-colors z-10`}
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header with Icon */}
                <div className="text-center mb-6">
                    <div className={`inline-flex p-4 rounded-full ${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'} mb-4`}>
                        <Calendar className={`w-8 h-8 ${themeColor}`} />
                    </div>
                    <h2 className={`text-2xl font-serif ${textColor} mb-2`}>{t('dailyLogin.title')}</h2>
                    <p className={`${subTextColor} text-sm`}>
                        {t('dailyLogin.streak')}: <span className={themeColor}>{t('dailyLogin.days', { count: status.streak })}</span> • {t('dailyLogin.loginEveryDay')}
                    </p>
                </div>

                {/* Daily Rewards Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {status.rewards.map((amount, index) => {
                        const isToday = index === currentDayIndex;
                        const isPast = index < currentDayIndex;
                        const isBigReward = index === 6; // Day 7

                        let stateClass = theme === 'light' ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-white/10 bg-white/5 text-gray-500'; // Future

                        if (isPast) {
                            stateClass = `${isMGT ? 'border-tier-std-500/50 bg-tier-std-500/10 text-tier-std-400' : 'border-gold-500/50 bg-gold-500/10 text-gold-400'}`;
                        } else if (isToday) {
                            stateClass = `${isMGT ? 'border-tier-std-500 bg-tier-std-500/20 text-white shadow-[0_0_15px_rgba(var(--tier-std-color-rgb),0.3)]' : 'border-gold-500 bg-gold-500/20 text-white shadow-[0_0_15px_rgba(212,175,55,0.3)]'} scale-105 z-10`;
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
                                <span className="text-[10px] uppercase tracking-wider mb-1">{t('dailyLogin.day', { day: index + 1 })}</span>
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

                {/* Claim Button or Status */}
                <div className="text-center">
                    {status.claimed ? (
                        <div className={`inline-flex items-center gap-2 ${subTextColor} ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} px-6 py-3 rounded-full`}>
                            <Check className="w-5 h-5" />
                            <span>{t('dailyLogin.comeBackTomorrow')}</span>
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
                            {claiming ? t('dailyLogin.claiming') : t('dailyLogin.claim', { amount: status.nextReward })}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
