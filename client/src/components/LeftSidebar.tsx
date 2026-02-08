import { Users, Camera, Calendar, UserPlus, Star, Lock, ShoppingBag, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, type DailyLoginStatus } from '../context/AuthContext';
import OnlineFriendsCard from './OnlineFriendsCard';
import DailyLoginCard from './DailyLoginCard';
import { Feature } from '../utils/features';
import { useFeature } from '../hooks/useFeature';
import { useState } from 'react';
import UpgradeModal from './UpgradeModal';

interface LeftSidebarProps {
    onDailyLoginClick: () => void;
    onNewMembersClick: () => void;
    onEventsClick: () => void;
    dailyLoginStatus?: DailyLoginStatus | null;
}

interface SidebarItem {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    to?: string;
    feature?: Feature; // Feature gate opcional
}

export default function LeftSidebar({ onDailyLoginClick, onNewMembersClick, onEventsClick, dailyLoginStatus }: LeftSidebarProps) {
    const { user, theme, accentColor, accentGradient } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    // Use accent color from context (with fallback)
    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const userAccent = accentColor || defaultAccent;
    const hasCustomAccent = !!accentColor;

    // Theme styles - consistent with project pattern
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const themeIconColor = isMGT ? 'text-emerald-500' : 'text-gold-400';
    const themeHoverBg = isMGT 
        ? 'hover:bg-emerald-500/10' 
        : 'hover:bg-gold-500/10';

    const items: SidebarItem[] = [
        {
            icon: <Users className="w-5 h-5" />,
            label: 'Grupos',
            to: '/groups',
            feature: Feature.GROUPS
        },
        {
            icon: <ShoppingBag className="w-5 h-5" />,
            label: 'Loja de Produtos',
            to: '/store'
        },
        {
            icon: <Camera className="w-5 h-5" />,
            label: 'Catálogo de Fotos',
            to: '/catalog',
            feature: Feature.PHOTO_CATALOG
        },
        {
            icon: <Calendar className="w-5 h-5" />,
            label: 'Eventos Exclusivos',
            onClick: onEventsClick
        },
        {
            icon: <UserPlus className="w-5 h-5" />,
            label: 'Novos Membros',
            onClick: onNewMembersClick
        },
        {
            icon: <Star className="w-5 h-5" />,
            label: 'Destaques da Semana',
            to: '/highlights',
            feature: Feature.HIGHLIGHTS
        },
        {
            icon: <Info className="w-5 h-5" />,
            label: 'Quem Somos',
            to: '/sobre-rovex'
        }
    ];

    // Estado para modal de upgrade
    const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: Feature | null; requiredPlan?: string; currentPlan?: string }>({
        open: false,
        feature: null
    });

    // Componente interno para item do menu com verificação de feature
    const MenuItem = ({ item, index }: { item: SidebarItem; index: number }) => {
        const featureCheck = useFeature(item.feature || Feature.FEED);
        const isLocked = item.feature ? !featureCheck.isAvailable : false;
        
        const handleClick = () => {
            if (isLocked && item.feature) {
                setUpgradeModal({ 
                    open: true, 
                    feature: item.feature,
                    requiredPlan: featureCheck.requiredPlan,
                    currentPlan: featureCheck.currentPlan
                });
                return;
            }
            item.onClick?.();
        };

        const content = (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${themeHoverBg} transition-all duration-200 cursor-pointer group ${isLocked ? 'opacity-60' : ''}`}>
                <span 
                    className={`${!hasCustomAccent ? themeIconColor : ''} group-hover:scale-110 transition-transform duration-200`}
                    style={hasCustomAccent ? { color: userAccent } : undefined}
                >
                    {item.icon}
                </span>
                <span className={`flex-1 text-sm font-medium ${textMain} group-hover:${isMGT ? 'text-emerald-400' : 'text-gold-400'} transition-colors`}>
                    {item.label}
                </span>
                {isLocked && (
                    <Lock size={12} className="text-amber-500" />
                )}
            </div>
        );

        if (isLocked) {
            return (
                <li key={index} onClick={handleClick} className="cursor-pointer">
                    {content}
                </li>
            );
        }

        if (item.to) {
            return (
                <li key={index}>
                    <Link to={item.to}>
                        {content}
                    </Link>
                </li>
            );
        }

        return (
            <li key={index} onClick={handleClick}>
                {content}
            </li>
        );
    };

    return (
        <aside className="hidden lg:block w-56 sticky top-24 h-fit animate-fade-in-right">
            <nav className={`${themeBg} backdrop-blur-xl rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} p-3 transition-all duration-300`}>
                <ul className="space-y-1">
                    {items.map((item, index) => (
                        <MenuItem key={index} item={item} index={index} />
                    ))}
                </ul>
            </nav>

            {/* Quick Stats */}
            <div className={`mt-4 ${themeBg} backdrop-blur-xl rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} p-4 transition-all duration-300`}>
                <p className={`text-xs ${textSub} mb-2`}>Seu progresso</p>
                {(() => {
                    // XP Table matching server: Level X requires XP_TABLE[X-1] total XP
                    const XP_TABLE = Array.from({ length: 30 }, (_, i) => {
                        const level = i + 1;
                        if (level === 1) return 0;
                        return Math.floor(1000 * Math.pow(level - 1, 1.2));
                    });
                    
                    const currentLevel = user?.level || 1;
                    const currentXP = user?.xp || 0;
                    const currentLevelXP = XP_TABLE[currentLevel - 1] || 0;
                    const nextLevelXP = XP_TABLE[currentLevel] || XP_TABLE[29];
                    const xpInCurrentLevel = currentXP - currentLevelXP;
                    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
                    const progressPercent = xpNeededForNextLevel > 0 
                        ? Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100)
                        : 100;

                    return (
                        <>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm ${textMain}`}>Nível {currentLevel}</span>
                                <span className={`text-xs ${themeIconColor}`}>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
                            </div>
                            <div className={`mt-2 h-1.5 rounded-full ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`}>
                                <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                        width: `${progressPercent}%`,
                                        background: accentGradient || accentColor || (isMGT ? '#10b981' : '#d4af37')
                                    }}
                                />
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Online Friends Card */}
            <div className="mt-4">
                <OnlineFriendsCard maxDisplay={4} />
            </div>

            {/* Daily Login Card */}
            <div className="mt-4">
                <DailyLoginCard status={dailyLoginStatus ?? null} onClick={onDailyLoginClick} />
            </div>

            {/* Upgrade Modal */}
            {upgradeModal.feature && (
                <UpgradeModal
                    isOpen={upgradeModal.open}
                    onClose={() => setUpgradeModal({ open: false, feature: null })}
                    feature={upgradeModal.feature}
                    currentPlan={upgradeModal.currentPlan}
                    requiredPlan={upgradeModal.requiredPlan}
                />
            )}
        </aside>
    );
}
