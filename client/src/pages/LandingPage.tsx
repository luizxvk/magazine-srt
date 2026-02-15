import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LuxuriousBackground from '../components/LuxuriousBackground';

export default function LandingPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);

    const handleSelect = (type: 'MAGAZINE' | 'MGT') => {
        navigate('/login', { state: { membershipType: type } });
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col md:flex-row font-sans">
            <LuxuriousBackground />

            {/* Magazine Side (Left) */}
            <div
                className={`relative flex-1 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out cursor-pointer group
                    ${hoveredSide === 'left' ? 'flex-[1.5] bg-black/40' : 'flex-1 bg-black/60'}
                    ${hoveredSide === 'right' ? 'flex-[0.5] opacity-50 blur-sm' : 'opacity-100'}
                    border-r border-white/10
                `}
                onMouseEnter={() => setHoveredSide('left')}
                onMouseLeave={() => setHoveredSide(null)}
                onClick={() => handleSelect('MAGAZINE')}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-gold-900/20 to-transparent opacity-50" />

                <div className="relative z-10 text-center transform transition-transform duration-500 group-hover:scale-105">
                    <div className="w-24 h-24 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-shadow">
                        <Crown className="w-12 h-12 text-gold-400" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tighter">
                        MAGAZINE
                    </h2>
                    <p className="text-gold-400 uppercase tracking-widest text-sm md:text-base mb-8 font-medium">
                        {t('landing.magazine.subtitle')}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <button className="flex items-center gap-2 text-white border-b border-gold-500 pb-1 hover:text-gold-400 transition-colors">
                            {t('landing.magazine.cta')} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* SRT Side (Right) */}
            <div
                className={`relative flex-1 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out cursor-pointer group
                    ${hoveredSide === 'right' ? 'flex-[1.5] bg-black/40' : 'flex-1 bg-black/60'}
                    ${hoveredSide === 'left' ? 'flex-[0.5] opacity-50 blur-sm' : 'opacity-100'}
                `}
                onMouseEnter={() => setHoveredSide('right')}
                onMouseLeave={() => setHoveredSide(null)}
                onClick={() => handleSelect('MGT')}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent opacity-50" />

                <div className="relative z-10 text-center transform transition-transform duration-500 group-hover:scale-105">
                    <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 group-hover:shadow-[0_0_30px_rgba(220,20,60,0.4)] transition-shadow">
                        <Zap className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tighter">
                        SRT
                    </h2>
                    <p className="text-red-500 uppercase tracking-widest text-sm md:text-base mb-8 font-medium">
                        {t('landing.srt.subtitle')}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <button className="flex items-center gap-2 text-white border-b border-red-500 pb-1 hover:text-red-400 transition-colors">
                            {t('landing.srt.cta')} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Center Divider/Logo - REMOVED */}
            {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div
                    className={`w-16 h-16 bg-black border rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl transition-all duration-500
                        ${hoveredSide === 'left' ? 'border-gold-500 shadow-[0_0_30px_rgba(212,175,55,0.5)] scale-110' : ''}
                        ${hoveredSide === 'right' ? 'border-red-500 shadow-[0_0_30px_rgba(220,20,60,0.5)] scale-110' : ''}
                        ${!hoveredSide ? 'border-white/10' : ''}
                    `}
                >
                    <span className={`font-serif font-bold text-xl transition-colors duration-500
                        ${hoveredSide === 'left' ? 'text-gold-400' : ''}
                        ${hoveredSide === 'right' ? 'text-red-500' : ''}
                        ${!hoveredSide ? 'text-white' : ''}
                    `}>M</span>
                </div>
            </div> */}
        </div>
    );
}
