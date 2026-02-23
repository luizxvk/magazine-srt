import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import logoFallback from '../assets/logo-mgzn.png';
import logoMgtFallback from '../assets/logo-mgt.png';

export default function LoadingScreen() {
    const { user } = useAuth();
    const { config } = useCommunity();
    const isMGT = user?.membershipType === 'MGT';
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        // Simulate loading phases
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                // Faster at start, slower near end (Apple-like)
                const increment = prev < 50 ? 8 : prev < 80 ? 4 : 2;
                return Math.min(prev + increment, 100);
            });
        }, 100);

        // Phase animations
        const phaseTimer = setInterval(() => {
            setPhase(prev => (prev + 1) % 3);
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(phaseTimer);
        };
    }, []);

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center ${isMGT ? 'bg-[#0a0a0a]' : 'bg-black'}`}>
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute inset-0 ${isMGT ? 'bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.08)_0%,_transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_50%,_rgba(212,175,55,0.08)_0%,_transparent_50%)]'}`} />
                <div className="absolute inset-0 animated-fog opacity-20" />
            </div>

            {/* Logo container with glow effect */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Pulsing glow behind logo */}
                <div className={`absolute inset-0 blur-3xl opacity-30 animate-pulse ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'}`} style={{ borderRadius: '50%', transform: 'scale(1.5)' }} />

                {/* Logo */}
                <img
                    src={config.logoIconUrl || (isMGT ? logoMgtFallback : logoFallback)}
                    alt="Logo"
                    className={`h-24 md:h-32 object-contain relative z-10 ${isMGT ? 'drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]'} animate-pulse`}
                    style={{ animationDuration: '2s' }}
                />

                {/* Progress bar container - Apple style */}
                <div className="mt-12 w-48 md:w-64 relative">
                    {/* Background track */}
                    <div className={`h-1 rounded-full ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'} overflow-hidden backdrop-blur-sm`}>
                        {/* Progress fill */}
                        <div
                            className={`h-full rounded-full transition-all duration-300 ease-out ${isMGT ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-gold-600 to-gold-400'}`}
                            style={{
                                width: `${progress}%`,
                                boxShadow: isMGT
                                    ? '0 0 20px rgba(16,185,129,0.5)'
                                    : '0 0 20px rgba(212,175,55,0.5)'
                            }}
                        />
                    </div>

                    {/* Shimmer effect over progress bar */}
                    <div
                        className="absolute inset-0 overflow-hidden rounded-full"
                        style={{ opacity: progress < 100 ? 1 : 0 }}
                    >
                        <div
                            className={`absolute inset-y-0 w-20 ${isMGT ? 'bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-gold-400/30 to-transparent'} animate-shimmer`}
                        />
                    </div>
                </div>

                {/* Status text */}
                <div className="mt-6 h-6 flex items-center justify-center">
                    <p className={`text-xs uppercase tracking-[0.3em] font-light transition-opacity duration-500 ${isMGT ? 'text-emerald-400/60' : 'text-gold-400/60'}`}>
                        {phase === 0 && 'Carregando'}
                        {phase === 1 && 'Preparando ambiente'}
                        {phase === 2 && 'Quase lá'}
                        <span className="inline-flex w-6 ml-1">
                            {phase === 0 && '...'}
                            {phase === 1 && '..'}
                            {phase === 2 && '.'}
                        </span>
                    </p>
                </div>
            </div>

            {/* Bottom branding */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                <p className={`text-[10px] uppercase tracking-[0.4em] font-light ${isMGT ? 'text-emerald-500/30' : 'text-gold-500/30'}`}>
                    {isMGT ? 'Machine Gold Team' : 'A Elite do Sucesso'}
                </p>
            </div>

            {/* Inline styles for shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
}
