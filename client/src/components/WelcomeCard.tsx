import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useTranslation } from 'react-i18next';
import StoriesBar from './StoriesBar';

interface WelcomeCardProps {
    viewingStoryId: string | null;
    onViewStory: (id: string | null) => void;
    onCloseStory: () => void;
}

export default function WelcomeCard({ viewingStoryId, onViewStory, onCloseStory }: WelcomeCardProps) {
    const { user, theme, accentColor, accentGradient } = useAuth();
    const { config, isStdTier } = useCommunity();
    const { t } = useTranslation(['feed', 'common']);
    const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;
    
    // Theme-based styling
    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const userAccent = accentColor || defaultAccent;
    
    const themeIconBg = theme === 'light' 
        ? 'bg-gray-100 hover:bg-gray-200' 
        : 'bg-white/10 hover:bg-white/15';
    const themeIconColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';

    const themeBg = theme === 'light'
        ? 'bg-white/90'
        : (isMGT ? 'bg-tier-std-950/60' : 'bg-black/60');
    const themeBorderClass = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT
        ? 'shadow-[0_0_15px_rgba(var(--tier-std-color-rgb),0.15)]'
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`relative rounded-3xl overflow-hidden ${themeBg} backdrop-blur-xl ${themeGlow} ${accentGradient ? 'border-gradient-accent' : `border ${themeBorderClass}`}`}
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
                        <h1 
                            className="text-3xl md:text-4xl font-serif text-transparent bg-clip-text mb-2"
                            style={{
                                backgroundImage: accentGradient || `linear-gradient(to right, ${userAccent}, ${userAccent})`
                            }}
                        >
                            {t('feed:feed.welcome', { name: user?.name?.split(' ')[0] || t('common:nav.profile') })}
                        </h1>
                        <p className={theme === 'light' ? 'text-gray-500 text-lg font-light tracking-wide' : 'text-gray-400 text-lg font-light tracking-wide'}>
                            {t('feed:feed.subtitle', { communityName: config.name || 'Magazine' })}
                        </p>
                    </div>
                    <Link
                        to="/settings"
                        className={`p-2.5 rounded-xl ${themeIconBg} ${themeIconColor} transition-all duration-200`}
                        title={t('common:nav.settings')}
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
