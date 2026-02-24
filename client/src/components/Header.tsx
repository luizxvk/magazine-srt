import { Search, User, X, Menu, Home, Star, ShoppingBag, Trophy, Users, MessageCircle, Store, Ticket, Rocket, Bell, Settings, LogOut, Coins, Sparkles, Crown, Swords, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Notifications from './Notifications';
import SearchModal from './SearchModal';
import BadgeDisplay from './BadgeDisplay';
import DailyLoginCard from './DailyLoginCard';
import OnlineFriendsCard from './OnlineFriendsCard';
import WhatsNewModal from './WhatsNewModal';
import GroupChatCard from './GroupChatCard';
import CustomizationShop from './CustomizationShop';
import VisitorBlockPopup from './VisitorBlockPopup';
import RadioCard from './RadioCard';
import api from '../services/api';
import logoRovexFallback from '../assets/logo-rovex.png';
import { getProfileBorderGradient } from '../utils/profileBorderUtils';
import { useDynamicHead } from '../hooks/useDynamicHead';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    onOpenShop?: () => void;
}

// Badge icons based on equipped badge - now using URLs from icons8
const BADGE_URLS: Record<string, string> = {
    'badge_crown': 'https://img.icons8.com/?size=100&id=hcZ65S78dSp6&format=png&color=000000',
    'badge_skull': 'https://img.icons8.com/?size=100&id=1aDNYh2zesKP&format=png&color=000000',
    'badge_fire': 'https://img.icons8.com/?size=100&id=NjzqV0aREXb6&format=png&color=000000',
    'badge_diamond': 'https://img.icons8.com/?size=100&id=8k9NF5LzoTVC&format=png&color=000000',
    'badge_star': 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000', // Using raio for star
    'badge_lightning': 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000',
    'badge_pony': 'https://img.icons8.com/?size=100&id=16114&format=png&color=000000',
    'badge_heart': 'https://img.icons8.com/?size=100&id=yQTLnfG3Agzl&format=png&color=000000',
    'badge_moon': 'https://img.icons8.com/?size=100&id=6DXM8bs2tFSU&format=png&color=000000',
    'badge_sun': 'https://img.icons8.com/?size=100&id=OIr0zJdeXCbg&format=png&color=000000',
    'badge_seal': 'https://img.icons8.com/?size=100&id=FVRVluUvxBrh&format=png&color=000000',
    'badge_shark': 'https://img.icons8.com/?size=100&id=81021&format=png&color=000000',
    'badge_egghead': 'https://img.icons8.com/?size=100&id=_jtfUqyZM2Pw&format=png&color=000000',
    'badge_xitada': 'https://img.icons8.com/?size=100&id=8S7SkmQtNOry&format=png&color=000000',
};

export default function Header({ onOpenShop }: HeaderProps) {
    const { user, isVisitor, logout, showAchievement, theme, openZionsModal, equippedBadge, dailyLoginStatus, openDailyLoginModal, isMobileDrawerOpen, setIsMobileDrawerOpen, accentColor, accentGradient, accentGradientColors, previewTheme } = useAuth();
    const { config } = useCommunity();
    
    // Atualiza título e favicon dinamicamente
    useDynamicHead();
    
    // Logo dinâmica: usa logoIconUrl, fallback para logoUrl, ou asset local
    const logoUrl = config.logoIconUrl || config.logoUrl || logoRovexFallback;
    
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [hasGroupInvites, setHasGroupInvites] = useState(false);
    const [hasGroupMentions, setHasGroupMentions] = useState(false);
    const [hasGroupMessages, setHasGroupMessages] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isWhatsNewModalOpen, setIsWhatsNewModalOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [showVisitorBlock, setShowVisitorBlock] = useState(false);
    const [visitorBlockFeature, setVisitorBlockFeature] = useState('');
    const [displayMode, setDisplayMode] = useState<'trophies' | 'points' | 'cash' | 'membership'>('trophies');

    const isMGT = user?.membershipType === 'MGT';
    const headerBorder = theme === 'light' ? 'border-gray-200' : 'border-gray-800';

    // Get badge icon - supports URLs (pack badges) and IDs (market badges)
    // Also supports preview mode
    const getBadgeIcon = () => {
        // Visitors don't get badges
        if (isVisitor) return null;
        
        // If preview is active and has badge, use preview badge
        if (previewTheme?.badgeUrl) {
            return <img src={previewTheme.badgeUrl} alt="Preview Badge" className="w-4 h-4 object-contain" />;
        }
        
        // If equipped badge is a URL (from theme pack)
        if (equippedBadge && equippedBadge.startsWith('http')) {
            return <img src={equippedBadge} alt="Badge" className="w-4 h-4 object-contain" />;
        }
        
        // If equipped badge is a market badge ID
        if (equippedBadge && BADGE_URLS[equippedBadge]) {
            return <img src={BADGE_URLS[equippedBadge]} alt="Badge" className="w-4 h-4 object-contain" />;
        }
        
        // No badge equipped - no default for anyone
        return null;
    };

    useEffect(() => {
        if (isVisitor) return;
        const interval = setInterval(() => {
            setDisplayMode(prev => {
                if (prev === 'trophies') return 'points';
                if (prev === 'points') return 'cash';
                if (prev === 'cash') return 'membership';
                return 'trophies';
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [isVisitor]);

    // Listen for WhatsNew open event from carousel
    useEffect(() => {
        const handleOpenWhatsNew = () => {
            setIsWhatsNewModalOpen(true);
        };
        window.addEventListener('openWhatsNew', handleOpenWhatsNew);
        return () => window.removeEventListener('openWhatsNew', handleOpenWhatsNew);
    }, []);

    useEffect(() => {
        if (isVisitor) return;

        const checkNotifications = async () => {
            try {
                const response = await api.get('/notifications');
                const notifications = response.data;
                const unread = notifications.some((n: any) => !n.read);
                setHasUnread(unread);

                // Check for group invites (social icon should pulse)
                const groupInvites = notifications.filter((n: any) => !n.read && n.type === 'GROUP_INVITE');
                setHasGroupInvites(groupInvites.length > 0);

                // Check for group mentions (group icon should pulse)
                const groupMentions = notifications.filter((n: any) => !n.read && n.type === 'GROUP_MENTION');
                setHasGroupMentions(groupMentions.length > 0);

                // Check for group messages (group icon should pulse)
                const groupMessages = notifications.filter((n: any) => !n.read && n.type === 'GROUP_MESSAGE');
                setHasGroupMessages(groupMessages.length > 0);

                // Check for new badges
                const newBadges = notifications.filter((n: any) => !n.read && n.type === 'BADGE');
                if (newBadges.length > 0) {
                    const latestBadge = newBadges[0];
                    showAchievement('Conquista Desbloqueada!', latestBadge.content);

                    // Mark all new badges as read to prevent loop
                    await Promise.all(newBadges.map((n: any) => api.put(`/notifications/${n.id}/read`)));
                }
            } catch (error) {
                console.error('Failed to check notifications', error);
            }
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 60000); // Reduced from 15s to 60s to save bandwidth
        return () => clearInterval(interval);
    }, [isVisitor, showAchievement]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        if (isMobileDrawerOpen) {
            const handleClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (!target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-button')) {
                    setIsMobileDrawerOpen(false);
                }
            };
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [isMobileDrawerOpen, setIsMobileDrawerOpen]);

    const isElite = user?.isElite && user?.eliteUntil && new Date(user.eliteUntil) > new Date();
    const { t } = useTranslation('common');
    const iconClass = accentGradient ? 'icon-gradient-accent' : '';
    
    const menuItems = [
        { icon: <Home className="w-5 h-5" />, label: t('nav.home'), path: '/feed' },
        { icon: <Star className="w-5 h-5" />, label: t('nav.rewards'), path: '/highlights' },
        { icon: <Gamepad2 className="w-5 h-5" />, label: 'StatForge', path: '/statforge' },
        { icon: <Swords className="w-5 h-5" />, label: 'Desafios 1v1', path: '/challenges', highlight: true },
        { icon: <ShoppingBag className="w-5 h-5" />, label: t('nav.shop'), path: '/store' },
        { icon: <Trophy className="w-5 h-5" />, label: t('nav.ranking'), path: '/ranking' },
        { icon: <Users className="w-5 h-5" />, label: 'Social', path: '/social' },
        { icon: <MessageCircle className="w-5 h-5" />, label: t('nav.groups'), path: '/groups' },
        { icon: <Store className="w-5 h-5" />, label: t('nav.market'), path: '/market' },
        { icon: <Ticket className="w-5 h-5" />, label: t('nav.rewards'), path: '/rewards' },
        { icon: <Crown className="w-5 h-5 text-amber-400" />, label: isElite ? 'ELITE' : 'ELITE ✨', path: '/elite', highlight: !isElite },
        { icon: <Rocket className="w-5 h-5" />, label: t('nav.roadmap'), path: '/roadmap' },
        { icon: <Bell className="w-5 h-5" />, label: t('nav.notifications'), path: '/notifications', badge: hasUnread },
        { icon: <Settings className="w-5 h-5" />, label: t('nav.settings'), path: '/settings' },
        ...(user?.role === 'ADMIN' ? [{ icon: <Settings className="w-5 h-5" />, label: t('nav.admin'), path: '/admin' }] : []),
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 glass-panel border-b ${headerBorder} bg-black/50 transition-colors duration-500 ${user?.liteMode ? '' : 'backdrop-blur-xl'}`}>
            {/* SVG gradient definition for icons */}
            {accentGradientColors && accentGradientColors.length >= 2 && (
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                        <linearGradient id="accentIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            {accentGradientColors.filter((_, i) => i < Math.ceil(accentGradientColors.length / (accentGradientColors[0] === accentGradientColors[accentGradientColors.length - 1] ? 2 : 1))).map((color, i, arr) => (
                                <stop key={i} offset={`${(i / Math.max(arr.length - 1, 1)) * 100}%`} stopColor={color} />
                            ))}
                        </linearGradient>
                    </defs>
                </svg>
            )}
            {/* Search Modal */}
            <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
            <WhatsNewModal isOpen={isWhatsNewModalOpen} onClose={() => setIsWhatsNewModalOpen(false)} />
            
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-4 shrink-0">
                    <Link to="/feed" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {isMGT ? (
                            <img 
                                src={logoUrl} 
                                alt={config.tierStdName || "MGT"} 
                                className={`h-10 w-auto object-contain ${theme === 'light' ? 'brightness-0' : ''}`} 
                            />
                        ) : (
                            <span 
                                className="text-2xl sm:text-3xl font-serif tracking-wider relative group select-none"
                                style={{ '--user-accent': accentColor || '#d4af37' } as React.CSSProperties}
                            >
                                {/* Glow layers - use CSS variable for custom accent */}
                                <span 
                                    className="absolute inset-0 blur-lg opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{ color: accentColor || '#d4af37' }}
                                >
                                    MAGAZINE
                                </span>
                                <span 
                                    className="absolute inset-0 blur-md opacity-70"
                                    style={{ color: accentColor || '#d4af37' }}
                                >
                                    MAGAZINE
                                </span>
                                {/* Main text with shimmer */}
                                <span 
                                    className="relative animate-text-shimmer"
                                    style={{ 
                                        color: accentColor || '#d4af37',
                                        filter: `drop-shadow(0 0 30px ${accentColor || 'rgba(218,165,32,0.8)'}) drop-shadow(0 0 60px ${accentColor || 'rgba(218,165,32,0.4)'})`
                                    }}
                                >
                                    MAGAZINE
                                </span>
                            </span>
                        )}
                    </Link>
                </div>

                {/* Desktop Search Bar */}
                <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative group">
                    <div 
                        className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                        style={{ background: `linear-gradient(to right, ${accentColor}1a, transparent, ${accentColor}1a)` }}
                    />
                    <Search className={`absolute left-3.5 ${theme === 'light' ? 'text-gray-700' : 'text-white/30'} group-hover:text-white/70 transition-colors w-4 h-4 z-10`} />
                    <input
                        type="text"
                        placeholder={t('actions.search') + '...'}
                        onClick={() => setIsSearchModalOpen(true)}
                        readOnly
                        className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-black placeholder-gray-600 shadow-sm' : 'bg-white/5 border-white/10 text-white placeholder-white/20'} backdrop-blur-md border hover:border-white/20 focus:border-white/30 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] relative z-0 cursor-pointer`}
                    />
                </div>

                {/* Mobile Search Overlay */}
                <AnimatePresence>
                    {isMobileSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 bg-black/95 flex items-center px-4 z-50 md:hidden backdrop-blur-xl"
                        >
                            <Search className={`absolute left-7 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'} w-4 h-4`} />
                            <input
                                type="text"
                                placeholder={t('actions.search') + '...'}
                                autoFocus
                                className={`w-full ${theme === 'light' ? 'bg-white text-gray-900 border-gray-200 placeholder-gray-500' : 'bg-white/10 text-white border-transparent placeholder-white/30'} border rounded-full py-2.5 pl-10 pr-10 text-sm focus:outline-none transition-all`}
                                style={{ boxShadow: `0 0 0 2px ${accentColor}80` }}
                            />
                            <button
                                onClick={() => setIsMobileSearchOpen(false)}
                                className={`absolute right-6 ${theme === 'light' ? 'text-gray-500 hover:text-gray-800' : 'text-gray-400 hover:text-white'} transition-colors`}
                                aria-label="Fechar busca"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2 md:gap-4">
                        {/* Shop Button - Always visible */}
                        <button
                            onClick={() => onOpenShop ? onOpenShop() : setIsShopOpen(true)}
                            className={`p-2 transition-all hover:scale-110 ${iconClass}`}
                            style={{ color: accentColor }}
                            aria-label="Loja"
                            title="Loja de Personalização"
                            data-tutorial="desktop-store"
                        >
                            <Store className="w-5 h-5" />
                        </button>

                        <Link 
                            to="/social" 
                            onClick={(e) => {
                                if (isVisitor) {
                                    e.preventDefault();
                                    setVisitorBlockFeature('acessar a área social');
                                    setShowVisitorBlock(true);
                                }
                            }}
                            className={`relative p-2 transition-all hover:scale-110 ${iconClass}`}
                            style={{ color: accentColor }}
                            aria-label="Social"
                            data-tutorial="desktop-explore"
                        >
                            <Users className="w-5 h-5" />
                        </Link>

                        <Link to="/groups" className={`relative p-2 transition-all hover:scale-110 ${iconClass}`} style={{ color: accentColor }} aria-label="Grupos" title="Grupos">
                            <MessageCircle className="w-5 h-5" />
                            {(hasGroupInvites || hasGroupMentions || hasGroupMessages) && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </Link>

                        <Link to="/roadmap" className={`p-2 transition-all hover:scale-110 ${iconClass}`} style={{ color: accentColor }} aria-label="Roadmap" title="Roadmap">
                            <Rocket className="w-5 h-5" />
                        </Link>

                        <div className="relative">
                            <button
                                onClick={() => {
                                    if (isVisitor) {
                                        setVisitorBlockFeature('acessar notificações');
                                        setShowVisitorBlock(true);
                                    } else {
                                        setShowNotifications(!showNotifications);
                                    }
                                }}
                                className={`p-2 transition-all hover:scale-110 relative ${iconClass}`}
                                style={{ color: accentColor }}
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {!isVisitor && hasUnread && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </button>
                            {showNotifications && !isVisitor && <Notifications />}
                        </div>

                        <button
                            onClick={() => {
                                if (isVisitor) {
                                    setVisitorBlockFeature('comprar Zions');
                                    setShowVisitorBlock(true);
                                } else {
                                    openZionsModal();
                                }
                            }}
                            className={`p-2 transition-all hover:scale-110 ${iconClass}`}
                            style={{ color: accentColor }}
                            title="Adquirir Zions"
                        >
                            <Coins className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsWhatsNewModalOpen(true)}
                            className={`p-2 transition-all hover:scale-110 ${iconClass}`}
                            style={{ color: accentColor }}
                            title="O que há de novo"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Profile Link - Both Mobile & Desktop */}
                    <div className="relative" data-tutorial="desktop-profile">
                        <Link to={isVisitor ? "/login" : "/profile"} className={`flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l ${headerBorder} hover:opacity-80 transition-opacity`}>
                        <div className="text-right hidden lg:block">
                            <div className="flex items-center gap-2 justify-end">
                                <p className={`text-xs font-medium tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{isVisitor ? 'Visitante' : (user?.name || 'Membro')}</p>
                                {!isVisitor && user?.id && <BadgeDisplay userId={user.id} isElite={user.isElite} eliteUntil={user.eliteUntil} size="sm" />}
                            </div>
                            <div className="h-4 relative overflow-hidden w-32 flex justify-end">
                                {isVisitor ? (
                                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold absolute right-0" style={{ color: accentColor }}>
                                        Faça seu login
                                    </p>
                                ) : (
                                    <AnimatePresence mode="wait">
                                        {displayMode === 'trophies' && (
                                            <motion.p
                                                key="trophies"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.5 }}
                                                className={`text-[10px] uppercase tracking-[0.15em] font-bold absolute right-0 ${theme === 'light' ? 'text-gray-700' : ''}`}
                                                style={{ color: theme === 'light' ? undefined : accentColor }}
                                            >
                                                {user?.trophies !== undefined ? `${user.trophies} Troféus` : '0 Troféus'}
                                            </motion.p>
                                        )}
                                        {displayMode === 'points' && (
                                            <motion.p
                                                key="points"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.5 }}
                                                className={`text-[10px] uppercase tracking-[0.15em] font-bold absolute right-0 ${theme === 'light' ? 'text-gray-700' : ''}`}
                                                style={{ color: theme === 'light' ? undefined : accentColor }}
                                            >
                                                {user?.zionsPoints ? `${user.zionsPoints.toLocaleString('pt-BR')} Points` : '0 Points'}
                                            </motion.p>
                                        )}
                                        {displayMode === 'cash' && (
                                            <motion.p
                                                key="cash"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.5 }}
                                                className={`text-[10px] uppercase tracking-[0.15em] font-bold absolute right-0 ${theme === 'light' ? 'text-gray-700' : ''}`}
                                                style={{ color: theme === 'light' ? undefined : accentColor }}
                                            >
                                                {user?.zionsCash ? `Z$ ${user.zionsCash.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Z$ 0,00'}
                                            </motion.p>
                                        )}
                                        {displayMode === 'membership' && (
                                            <motion.p
                                                key="membership"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.5 }}
                                                className={`text-[10px] uppercase tracking-[0.15em] font-bold absolute right-0 ${theme === 'light' ? 'text-gray-700' : ''}`}
                                                style={{ color: theme === 'light' ? undefined : accentColor }}
                                            >
                                                {isMGT ? `Membro ${config.tierStdName}` : `Membro ${config.tierVipName}`}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        <div className="relative flex-shrink-0">
                            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full p-[2px]`} style={{ background: getProfileBorderGradient(user?.equippedProfileBorder, isMGT) }}>
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 md:w-5 md:h-5" style={{ color: accentColor }} />
                                    )}
                                </div>
                            </div>
                            {/* Badge indicator */}
                            {getBadgeIcon() && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center" style={{ borderWidth: 1, borderColor: `${accentColor}80` }}>
                                    {getBadgeIcon()}
                                </div>
                            )}
                        </div>
                    </Link>
                    </div>

                    {/* Desktop Logout */}
                    {!isVisitor && (
                        <button
                            onClick={logout}
                            className={`hidden md:block p-2 transition-all hover:scale-110 border-l ${headerBorder} pl-2 md:pl-4 ml-1 md:ml-2`}
                            style={{ color: accentColor }}
                            title={t('nav.logout')}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}

                    {/* Mobile Hamburger Menu */}
                    <button
                        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                        className={`mobile-menu-button md:hidden p-2 transition-colors ${theme === 'light' ? 'text-black' : ''}`}
                        style={{ color: theme === 'light' ? undefined : accentColor }}
                        aria-label="Menu"
                    >
                        {isMobileDrawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer - Apple Vision Pro Style */}
            <AnimatePresence mode="wait">
                {isMobileDrawerOpen && (
                    <>
                        {/* Backdrop - dark overlay without blur for performance */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                            className="fixed inset-0 bg-black/80 z-40 md:hidden"
                            onClick={() => setIsMobileDrawerOpen(false)}
                        />
                        
                        {/* Drawer Panel */}
                        <motion.div
                            initial={{ x: '100%', opacity: 0.8 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.8 }}
                            transition={{ 
                                type: 'spring', 
                                damping: 30, 
                                stiffness: 350,
                                mass: 0.8
                            }}
                            className={`mobile-menu-container fixed top-0 right-0 bottom-0 h-screen w-80 z-[60] md:hidden flex flex-col overflow-hidden ${
                                user?.liteMode 
                                    ? (theme === 'light' ? 'bg-gray-100' : 'bg-zinc-950') 
                                    : (theme === 'light' ? 'bg-white/90 backdrop-blur-2xl' : 'bg-black/80 backdrop-blur-2xl')
                            } border-l ${theme === 'light' ? 'border-gray-200/50' : (isMGT ? 'border-tier-std-500/20' : 'border-white/10')} shadow-[-20px_0_60px_rgba(0,0,0,0.5)]`}
                        >
                            {/* Gradient Overlay */}
                            {!user?.liteMode && (
                                <div 
                                    className="absolute inset-0 pointer-events-none" 
                                    style={{ background: `linear-gradient(to bottom, ${accentColor}0d, transparent, ${accentColor}0d)` }}
                                />
                            )}

                            {/* Header with User Info */}
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`relative z-10 p-4 border-b ${theme === 'light' ? 'border-gray-200/50' : (isMGT ? 'border-tier-std-500/20' : 'border-white/10')}`}
                            >
                                {/* Top Bar with User + Actions */}
                                <div className="flex items-center gap-3">
                                    {/* User Profile - Compact */}
                                    {user && (
                                        <Link 
                                            to="/profile" 
                                            onClick={() => setIsMobileDrawerOpen(false)}
                                            className={`flex-1 flex items-center gap-3 p-2 pr-3 rounded-2xl transition-all ${
                                                theme === 'light' 
                                                    ? 'bg-gray-50 hover:bg-gray-100' 
                                                    : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-full p-[2px] shrink-0" style={{ background: getProfileBorderGradient(user.equippedProfileBorder, isMGT) }}>
                                                <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5" style={{ color: accentColor }} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-sm font-semibold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                    {user.displayName || user.name}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-medium" style={{ color: accentColor }}>
                                                        {user.zionsPoints || 0}
                                                    </span>
                                                    <span className={`text-[10px] ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>Points</span>
                                                    <span className={`text-[10px] ${theme === 'light' ? 'text-gray-300' : 'text-white/20'}`}>•</span>
                                                    <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
                                                        Z$ {(user.zionsCash || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )}
                                    
                                    {/* Actions - Stacked vertically */}
                                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                                        {!isVisitor && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setIsMobileDrawerOpen(false);
                                                    logout();
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                    theme === 'light' 
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                }`}
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                <span>{t('nav.logout')}</span>
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setIsMobileDrawerOpen(false)}
                                            className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'bg-white/5 hover:bg-white/10 text-white/60'} transition-colors`}
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Quick Actions Grid */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className={`relative z-10 p-4 border-b ${theme === 'light' ? 'border-gray-200/50' : (isMGT ? 'border-tier-std-500/20' : 'border-white/10')}`}
                            >
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { icon: Search, label: t('actions.search'), action: () => { setIsMobileDrawerOpen(false); setIsSearchModalOpen(true); } },
                                        { icon: Store, label: t('nav.shop'), action: () => { setIsMobileDrawerOpen(false); onOpenShop ? onOpenShop() : setIsShopOpen(true); } },
                                        { icon: Coins, label: 'Zions', action: () => { setIsMobileDrawerOpen(false); openZionsModal(); } },
                                    ].map((item, idx) => (
                                        <motion.button
                                            key={item.label}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + idx * 0.05 }}
                                            onClick={item.action}
                                            className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all ${
                                                theme === 'light'
                                                    ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200/50'
                                                    : (isMGT 
                                                        ? 'bg-tier-std-500/10 hover:bg-tier-std-500/20 border border-tier-std-500/20' 
                                                        : 'bg-white/5 hover:bg-white/10 border border-white/10')
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5" style={{ color: accentColor }} />
                                            <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>{item.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Scrollable Content */}
                            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                                {/* Feature Cards */}
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="flex flex-col gap-3 mb-5"
                                >
                                    <DailyLoginCard status={dailyLoginStatus} onClick={() => { setIsMobileDrawerOpen(false); openDailyLoginModal(); }} />
                                    <RadioCard />
                                    <OnlineFriendsCard />
                                    <div className="md:hidden">
                                        <GroupChatCard />
                                    </div>
                                </motion.div>

                                {/* Navigation Menu */}
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="space-y-1"
                                >
                                    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-3 px-2 ${theme === 'light' ? 'text-gray-400' : 'text-white/30'}`}>
                                        Navegação
                                    </p>
                                    {menuItems.map((item, idx) => (
                                        <motion.div
                                            key={item.path}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.35 + idx * 0.03 }}
                                        >
                                            <Link
                                                to={item.path}
                                                onClick={() => setIsMobileDrawerOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                    theme === 'light' 
                                                        ? 'hover:bg-gray-100 text-gray-700' 
                                                        : 'hover:bg-white/5 text-white/80'
                                                }`}
                                            >
                                                <span style={{ color: accentColor }}>{item.icon}</span>
                                                <span className="text-sm font-medium">{item.label}</span>
                                                {item.badge && (
                                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />
                                                )}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Footer */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className={`relative z-10 p-4 border-t ${theme === 'light' ? 'border-gray-200/50' : (isMGT ? 'border-tier-std-500/20' : 'border-white/10')}`}
                            >
                                <p className={`text-[10px] text-center ${theme === 'light' ? 'text-gray-400' : 'text-white/30'}`}>
                                    Powered by <span className="font-medium">Rovex</span>
                                </p>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Internal Shop Modal */}
            {isShopOpen && (
                <CustomizationShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
            )}

            {/* Visitor Block Popup */}
            <VisitorBlockPopup 
                isOpen={showVisitorBlock} 
                onClose={() => setShowVisitorBlock(false)} 
                featureName={visitorBlockFeature}
            />
        </header>
    );
}
