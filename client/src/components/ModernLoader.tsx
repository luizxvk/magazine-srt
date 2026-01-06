import { useAuth } from '../context/AuthContext';

interface ModernLoaderProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    fullScreen?: boolean;
}

export default function ModernLoader({ text, size = 'md', className = '', fullScreen = false }: ModernLoaderProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-14 h-14'
    };

    const dotSizeClasses = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const accentColor = isMGT ? 'bg-emerald-500' : 'bg-yellow-500';
    const textColor = isMGT ? 'text-emerald-500/70' : 'text-yellow-500/70';

    const containerClass = fullScreen 
        ? 'min-h-screen flex flex-col items-center justify-center bg-black/90 w-full'
        : `flex flex-col items-center justify-center py-16 w-full ${className}`;

    return (
        <div className={containerClass}>
            {/* Apple-style spinner */}
            <div className={`relative ${sizeClasses[size]}`}>
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute ${dotSizeClasses[size]} rounded-full ${accentColor}`}
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${i * 45}deg) translateY(-150%)`,
                            transformOrigin: '0 0',
                            opacity: 1 - (i * 0.1),
                            animation: `spinnerFade 0.8s linear infinite`,
                            animationDelay: `${i * 0.1}s`
                        }}
                    />
                ))}
            </div>

            {/* Text */}
            {text && (
                <p className={`mt-4 ${textSizeClasses[size]} ${textColor} font-medium animate-pulse`}>
                    {text}
                </p>
            )}

            {/* CSS Animation */}
            <style>{`
                @keyframes spinnerFade {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// Skeleton loader for cards
export function SkeletonCard({ className = '' }: { className?: string }) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const shimmerBg = isMGT ? 'from-emerald-500/5 via-emerald-500/10 to-emerald-500/5' : 'from-yellow-500/5 via-yellow-500/10 to-yellow-500/5';

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 ${className}`}>
            <div className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-white/10 rounded-lg w-32 animate-pulse" />
                        <div className="h-3 bg-white/10 rounded-lg w-20 animate-pulse" />
                    </div>
                </div>
                {/* Content lines */}
                <div className="h-3 bg-white/10 rounded-lg w-full animate-pulse" />
                <div className="h-3 bg-white/10 rounded-lg w-3/4 animate-pulse" />
            </div>

            {/* Shimmer effect */}
            <div 
                className={`absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r ${shimmerBg}`}
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

// Simple dots loader
export function DotsLoader({ className = '' }: { className?: string }) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const dotColor = isMGT ? 'bg-emerald-500' : 'bg-yellow-500';

    return (
        <div className={`flex items-center justify-center gap-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${dotColor}`}
                    style={{
                        animation: 'dotBounce 1.4s ease-in-out infinite',
                        animationDelay: `${i * 0.16}s`
                    }}
                />
            ))}
            <style>{`
                @keyframes dotBounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
