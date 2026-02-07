import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StoriesBar from './StoriesBar';
import GradientText from './GradientText';

interface WelcomeCardProps {
    viewingStoryId: string | null;
    onViewStory: (id: string | null) => void;
    onCloseStory: () => void;
}

export default function WelcomeCard({ viewingStoryId, onViewStory, onCloseStory }: WelcomeCardProps) {
    const { user, theme, accentColor, accentGradient, accentGradientColors } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    // Theme-based styling
    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const userAccent = accentColor || defaultAccent;
    
    const themeIconBg = theme === 'light' 
        ? 'bg-gray-100 hover:bg-gray-200' 
        : 'bg-white/10 hover:bg-white/15';
    const themeIconColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden"
            style={{
                background: theme === 'light'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.9) 100%)'
                    : `linear-gradient(135deg, rgba(25,25,30,0.85) 0%, rgba(20,20,25,0.8) 100%)`,
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: theme === 'light'
                    ? '0 8px 32px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.8)'
                    : `0 8px 32px rgba(0,0,0,0.4), 0 0 80px ${userAccent}08, inset 0 0 0 1px rgba(255,255,255,0.08)`,
            }}
        >
            {/* Accent glow gradient */}
            <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at top center, ${userAccent}20, transparent 60%)`
                }}
            />

            {/* Content container */}
            <div className="relative p-6 space-y-6">
                {/* Welcome Header */}
                <div className="flex items-start justify-between">
                    <div>
                        {accentGradientColors ? (
                            <GradientText
                                colors={accentGradientColors}
                                animationSpeed={6}
                                className="text-3xl md:text-4xl font-serif mb-2"
                            >
                                Bem vindo, {user?.name?.split(' ')[0] || 'Membro'}
                            </GradientText>
                        ) : (
                            <h1 
                                className="text-3xl md:text-4xl font-serif text-transparent bg-clip-text mb-2"
                                style={{
                                    backgroundImage: accentGradient || `linear-gradient(to right, ${userAccent}, ${userAccent})`
                                }}
                            >
                                Bem vindo, {user?.name?.split(' ')[0] || 'Membro'}
                            </h1>
                        )}
                        <p className={theme === 'light' ? 'text-gray-500 text-lg font-light tracking-wide' : 'text-gray-400 text-lg font-light tracking-wide'}>
                            {isMGT ? 'Seu feed exclusivo do Machine Gold Team' : 'Seu feed exclusivo do Magazine'}
                        </p>
                    </div>
                    <Link
                        to="/settings"
                        className={`p-2.5 rounded-xl ${themeIconBg} ${themeIconColor} transition-all duration-200`}
                        title="Configurações"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>

                {/* Stories Bar */}
                <div className="relative z-10">
                    <StoriesBar
                        viewingStoryId={viewingStoryId}
                        onViewStory={onViewStory}
                        onCloseStory={onCloseStory}
                    />
                </div>
            </div>

            {/* Bottom border accent */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40"
                style={{
                    background: accentGradient 
                        ? `linear-gradient(90deg, transparent, ${userAccent}, transparent)` 
                        : `linear-gradient(90deg, transparent, ${userAccent}, transparent)`
                }}
            />
        </motion.div>
    );
}
