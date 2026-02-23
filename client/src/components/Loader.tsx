/**
 * Loader — Aceternity-style bouncing dots loader
 * 
 * Drop-in replacement for the old iOS blade spinner.
 * Supports sm / md / lg sizes. Themed per membership (gold / emerald).
 */
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = {
    sm: { dot: 'h-1.5 w-1.5', gap: 'gap-1', bounce: 4 },
    md: { dot: 'h-3 w-3',     gap: 'gap-1.5', bounce: 8 },
    lg: { dot: 'h-4 w-4',     gap: 'gap-2', bounce: 10 },
};

const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '' }) => {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const { dot, gap, bounce } = sizeMap[size];

    const gradientClass = isMGT
        ? 'border-tier-std-400/60 bg-gradient-to-b from-tier-std-400 to-tier-std-500'
        : 'border-gold-400/60 bg-gradient-to-b from-gold-400 to-gold-500';

    const transition = (delay: number) => ({
        duration: 1,
        repeat: Infinity,
        repeatType: 'loop' as const,
        delay: delay * 0.2,
        ease: 'easeInOut' as const,
    });

    return (
        <div className={`flex items-center ${gap} ${className}`}>
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
    );
};

export default Loader;
