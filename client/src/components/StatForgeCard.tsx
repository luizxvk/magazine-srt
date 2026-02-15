import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GradientText from './GradientText';

export default function StatForgeCard() {
    const { user, theme, accentColor, accentGradient } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';

    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultAccent;

    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeBg = theme === 'light'
        ? 'bg-white/80'
        : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const themeGlow = isMGT
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]'
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]';

    return (
        <div
            onClick={() => navigate('/statforge')}
            className={`${themeBg} backdrop-blur-xl rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} px-5 py-4 transition-all duration-300 cursor-pointer group hover:scale-[1.02]`}
        >
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                    <div
                        className="absolute inset-0 rounded-full blur-2xl opacity-50 scale-125"
                        style={{ background: color }}
                    />
                    <img
                        src="/assets/statforge-logo.png"
                        alt="StatForge"
                        className="relative w-16 h-16 object-contain"
                    />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                    <GradientText as="h3" className="font-bold text-lg leading-tight" fallbackClassName={isMGT ? 'text-emerald-400' : 'text-gold-400'}>
                        StatForge
                    </GradientText>
                    <p className={`text-sm mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} line-clamp-2`}>
                        Rastreie suas stats de jogos em tempo real
                    </p>
                </div>
                <ArrowRight
                    className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1 flex-shrink-0"
                    style={{ color }}
                />
            </div>
        </div>
    );
}
