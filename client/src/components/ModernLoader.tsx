/**
 * ModernLoader — Full-featured loading component
 *
 * Uses the Aceternity-style bouncing dots (LoaderOne pattern).
 * Supports fullScreen mode, text, and sizes.
 * 
 * Also re-exports SkeletonCard and DotsLoader for backward compat.
 */
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// ============================================
// MAIN LOADER
// ============================================

interface ModernLoaderProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    fullScreen?: boolean;
}

const sizeMap = {
    sm: { dot: 'h-2 w-2',   gap: 'gap-1',   bounce: 5 },
    md: { dot: 'h-3.5 w-3.5', gap: 'gap-1.5', bounce: 10 },
    lg: { dot: 'h-5 w-5',   gap: 'gap-2',   bounce: 14 },
};

const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
};

export default function ModernLoader({ text, size = 'md', className = '', fullScreen = false }: ModernLoaderProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const { dot, gap, bounce } = sizeMap[size];

    const gradientClass = isMGT
        ? 'border-tier-std-400/50 bg-gradient-to-b from-tier-std-400 to-tier-std-500'
        : 'border-gold-400/50 bg-gradient-to-b from-gold-400 to-gold-500';

    const textColor = isMGT ? 'text-tier-std-400/60' : 'text-gold-400/60';

    const transition = (delay: number) => ({
        duration: 1,
        repeat: Infinity,
        repeatType: 'loop' as const,
        delay: delay * 0.2,
        ease: 'easeInOut' as const,
    });

    const containerClass = fullScreen
        ? 'min-h-screen flex flex-col items-center justify-center bg-black/90 w-full'
        : `flex flex-col items-center justify-center py-16 w-full ${className}`;

    return (
        <div className={containerClass}>
            {/* Bouncing dots */}
            <div className={`flex items-center ${gap}`}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 0 }}
                        animate={{ y: [0, bounce, 0] }}
                        transition={transition(i)}
                        className={`${dot} rounded-full border ${gradientClass}`}
                    />
                ))}
            </div>

            {/* Optional text */}
            {text && (
                <motion.p
                    className={`mt-4 ${textSizeMap[size]} ${textColor} font-light tracking-wider`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
}

// ============================================
// SKELETON CARD  (unchanged API)
// ============================================

export function SkeletonCard({ className = '' }: { className?: string }) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const shimmerBg = isMGT
        ? 'from-tier-std-500/5 via-tier-std-500/10 to-tier-std-500/5'
        : 'from-yellow-500/5 via-yellow-500/10 to-yellow-500/5';

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 ${className}`}>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-white/10 rounded-lg w-32 animate-pulse" />
                        <div className="h-3 bg-white/10 rounded-lg w-20 animate-pulse" />
                    </div>
                </div>
                <div className="h-3 bg-white/10 rounded-lg w-full animate-pulse" />
                <div className="h-3 bg-white/10 rounded-lg w-3/4 animate-pulse" />
            </div>
            <div
                className={`absolute inset-0 -translate-x-full bg-gradient-to-r ${shimmerBg}`}
                style={{ animation: 'shimmer 2s infinite' }}
            />
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}

// ============================================
// DOTS LOADER  (compact, for inline use)
// ============================================

export function DotsLoader({ className = '' }: { className?: string }) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const gradientClass = isMGT
        ? 'border-tier-std-400/50 bg-gradient-to-b from-tier-std-400 to-tier-std-500'
        : 'border-gold-400/50 bg-gradient-to-b from-gold-400 to-gold-500';

    const transition = (delay: number) => ({
        duration: 1,
        repeat: Infinity,
        repeatType: 'loop' as const,
        delay: delay * 0.2,
        ease: 'easeInOut' as const,
    });

    return (
        <div className={`flex items-center justify-center gap-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    initial={{ y: 0 }}
                    animate={{ y: [0, 5, 0] }}
                    transition={transition(i)}
                    className={`w-2 h-2 rounded-full border ${gradientClass}`}
                />
            ))}
        </div>
    );
}
