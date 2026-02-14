import { useNavigate } from 'react-router-dom';
import { BarChart3, Gamepad2, ArrowRight } from 'lucide-react';
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
            className={`${themeBg} backdrop-blur-xl rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} p-4 transition-all duration-300 cursor-pointer group hover:scale-[1.02]`}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                    <div
                        className="absolute inset-0 rounded-full blur-lg opacity-30"
                        style={{ background: color }}
                    />
                    <img
                        src="/assets/statforge-logo.png"
                        alt="StatForge"
                        className="relative w-10 h-10 object-contain"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <GradientText as="h3" className="font-bold text-sm leading-tight" fallbackClassName={isMGT ? 'text-emerald-400' : 'text-gold-400'}>
                        StatForge
                    </GradientText>
                    <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        Tracker de Stats
                    </p>
                </div>
                <ArrowRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1"
                    style={{ color }}
                />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
                <div
                    className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ backgroundColor: `${color}10` }}
                >
                    <Gamepad2 className="w-4 h-4" style={{ color }} />
                    <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        17+ Jogos
                    </span>
                </div>
                <div
                    className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ backgroundColor: `${color}10` }}
                >
                    <BarChart3 className="w-4 h-4" style={{ color }} />
                    <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                        Tempo Real
                    </span>
                </div>
            </div>

            {/* CTA */}
            <div
                className="mt-3 text-center py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                    backgroundColor: `${color}15`,
                    color,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${color}20`
                }}
            >
                Acompanhe suas Stats →
            </div>
        </div>
    );
}
