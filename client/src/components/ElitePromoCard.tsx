import { motion } from 'framer-motion';
import { Crown, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Apple Vision Pro inspired Elite promotion card
 * Sleek glassmorphism design with animated glow border
 */
export default function ElitePromoCard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Don't show if user is already Elite
    const isElite = user?.isElite && user?.eliteUntil && new Date(user.eliteUntil) > new Date();
    if (isElite) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => navigate('/elite')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl p-[2px]"
        >
            {/* Animated glow border */}
            <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, #7c3aed 25%, #3b82f6 50%, #6366f1 75%, transparent 100%)',
                    backgroundSize: '200% 100%',
                }}
                animate={{
                    backgroundPosition: ['200% 0%', '-200% 0%'],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            
            {/* Inner container */}
            <div 
                className="relative rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.98) 0%, rgba(15, 15, 20, 0.99) 100%)',
                }}
            >
                {/* Floating glow effect */}
                <motion.div
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                    style={{
                        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 5, 0],
                        y: [0, -5, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Content */}
                <div className="relative p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                                    boxShadow: '0 0 20px rgba(124, 58, 237, 0.1)',
                                }}
                            >
                            <Crown className="w-4 h-4 text-violet-400" />
                        </div>
                        <span 
                            className="text-xs font-medium tracking-widest uppercase"
                            style={{
                                background: 'linear-gradient(90deg, #7c3aed 0%, #3b82f6 50%, #6366f1 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            Elite
                        </span>
                    </div>
                    
                    <motion.div
                        className="flex items-center gap-1 text-white/40 group-hover:text-violet-400/80 transition-colors duration-300"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <span className="text-[10px] font-medium">Saiba mais</span>
                        <ChevronRight className="w-3 h-3" />
                    </motion.div>
                </div>

                {/* Main text */}
                <h3 
                    className="text-lg font-semibold mb-1 text-white/90 group-hover:text-white transition-colors duration-300"
                    style={{ letterSpacing: '-0.02em' }}
                >
                    Eleve sua experiência
                </h3>
                
                <p className="text-xs text-white/50 leading-relaxed mb-3">
                    XP em dobro, backgrounds exclusivos, sem limites.
                </p>

                {/* Features pills */}
                <div className="flex flex-wrap gap-1.5">
                    {['2x XP', '500 Zions/mês', 'Exclusivos'].map((feature, i) => (
                        <span 
                            key={i}
                            className="px-2 py-0.5 text-[9px] font-medium rounded-full"
                            style={{
                                background: 'rgba(124, 58, 237, 0.1)',
                                color: 'rgba(167, 139, 250, 0.9)',
                                border: '1px solid rgba(124, 58, 237, 0.15)',
                            }}
                        >
                            {feature}
                        </span>
                    ))}
                </div>

                {/* Price tag */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs text-white/40">A partir de</span>
                        <span className="text-lg font-semibold text-white">R$9,90</span>
                        <span className="text-xs text-white/40">/mês</span>
                    </div>
                    
                    <motion.div 
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        <span className="text-xs font-medium text-violet-400">Assinar</span>
                    </motion.div>
                </div>
                </div>

                {/* Shine effect on hover */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)',
                    }}
                    animate={{
                        x: ['-100%', '100%'],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: 'easeInOut',
                    }}
                />
            </div>
        </motion.div>
    );
}
