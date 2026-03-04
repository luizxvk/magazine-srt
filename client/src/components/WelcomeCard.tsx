import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useTranslation } from 'react-i18next';
import StoriesBar from './StoriesBar';

// Helper to convert hex to rgb components
const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '139,92,246'; // fallback purple
    return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
};

interface WelcomeCardProps {
    viewingStoryId: string | null;
    onViewStory: (id: string | null) => void;
    onCloseStory: () => void;
}

export default function WelcomeCard({ viewingStoryId, onViewStory, onCloseStory }: WelcomeCardProps) {
    const { user, theme, accentGradient } = useAuth();
    const { config } = useCommunity();
    const { t } = useTranslation(['feed', 'common']);
    
    // Theme-based styling - use CommunityContext colors
    // Use community accent color for the welcome card - always use accent (purple for Rovex)
    const communityAccent = config.accentColor || config.primaryColor || config.backgroundColor || '#8B5CF6';
    // If user has equippedColor starting with #, use it. Otherwise use community color.
    const userAccent = (user?.equippedColor?.startsWith('#')) ? user.equippedColor : communityAccent;
    
    // Dynamic RGB values for glow effects
    const glowRgb = hexToRgb(communityAccent);
    
    const themeIconBg = theme === 'light' 
        ? 'bg-gray-100 hover:bg-gray-200' 
        : 'bg-white/10 hover:bg-white/15';
    const themeIconColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';

    const themeBg = theme === 'light'
        ? 'bg-white/90'
        : 'bg-black/60';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`relative rounded-3xl overflow-hidden ${themeBg} backdrop-blur-xl border`}
            style={{
                boxShadow: `0 0 15px rgba(${glowRgb},0.15)`,
                borderColor: accentGradient ? undefined : `${communityAccent}30`,
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
