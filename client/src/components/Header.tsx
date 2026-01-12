import { Search, Bell, User, LogOut, X, Users, Coins, Rocket, Store, Menu, Star, Home, Trophy, Settings, Ticket, MessageCircle, Sparkles, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
import api from '../services/api';
import logoSrt from '../assets/logo-mgt.png';
import { getContrastColor } from '../utils/colorUtils';

interface HeaderProps {
    onOpenShop?: () => void;
}

// Badge icons based on equipped badge
const BADGE_ICONS: Record<string, React.ReactNode> = {
    'badge_crown': <span className="text-xs">👑</span>,
    'badge_skull': <span className="text-xs">💀</span>,
    'badge_fire': <span className="text-xs">🔥</span>,
    'badge_diamond': <span className="text-xs">💎</span>,
    'badge_star': <span className="text-xs">⭐</span>,
    'badge_lightning': <span className="text-xs">⚡</span>,
    'badge_pony': <span className="text-xs">🦄</span>,
    'badge_heart': <span className="text-xs">❤️</span>,
    'badge_moon': <span className="text-xs">🌙</span>,
    'badge_sun': <span className="text-xs">☀️</span>,
};

export default function Header({ onOpenShop }: HeaderProps) {
    const { user, isVisitor, logout, showAchievement, theme, openZionsModal, equippedBadge, dailyLoginStatus, openDailyLoginModal, isMobileDrawerOpen, setIsMobileDrawerOpen, accentColor } = useAuth();
    const navigate = useNavigate();
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

    // Get badge icon - default crown for Magazine
    const getBadgeIcon = () => {
        // Visitors don't get badges
        if (isVisitor) return null;
        
        if (equippedBadge && BADGE_ICONS[equippedBadge]) {
            return BADGE_ICONS[equippedBadge];
        }
        // Default: crown for Magazine, nothing for MGT
        return user?.membershipType === 'MAGAZINE' ? <span className="text-xs">👑</span> : null;
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

    const menuItems = [
        { icon: <Home className="w-5 h-5" />, label: 'Feed', path: '/feed' },
        { icon: <Star className="w-5 h-5" />, label: 'Destaques', path: '/highlights' },
        { icon: <ShoppingBag className="w-5 h-5" />, label: 'Loja de Produtos', path: '/store' },
        { icon: <Trophy className="w-5 h-5" />, label: 'Ranking', path: '/ranking' },
        { icon: <Users className="w-5 h-5" />, label: 'Social', path: '/social' },
        { icon: <MessageCircle className="w-5 h-5" />, label: 'Grupos', path: '/groups' },
        { icon: <Store className="w-5 h-5" />, label: 'Mercado', path: '/market' },
        { icon: <Ticket className="w-5 h-5" />, label: 'Recompensas', path: '/rewards' },
        { icon: <Rocket className="w-5 h-5" />, label: 'Roadmap', path: '/roadmap' },
        { icon: <Bell className="w-5 h-5" />, label: 'Notificações', path: '/notifications', badge: hasUnread },
        { icon: <Settings className="w-5 h-5" />, label: 'Configurações', path: '/settings' },
        ...(user?.role === 'ADMIN' ? [{ icon: <Settings className="w-5 h-5" />, label: 'Admin', path: '/admin' }] : []),
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 glass-panel border-b ${headerBorder} bg-black/50 backdrop-blur-xl transition-colors duration-500`}>
            {/* Search Modal */}
            <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
            <WhatsNewModal isOpen={isWhatsNewModalOpen} onClose={() => setIsWhatsNewModalOpen(false)} />
            
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-4 shrink-0">
                    <Link to="/feed" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {isMGT ? (
                            <img 
                                src={logoSrt} 
                                alt="MGT Logo" 
                                className={`h-12 sm:h-14 md:h-16 object-contain ${theme === 'light' ? 'brightness-0' : ''}`} 
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
                    <div className={`absolute inset-0 bg-gradient-to-r ${isMGT ? 'from-red-500/10 via-transparent to-red-500/10' : 'from-gold-500/10 via-transparent to-gold-500/10'} rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <Search className={`absolute left-3.5 ${theme === 'light' ? 'text-gray-700' : 'text-white/30'} group-hover:text-white/70 transition-colors w-4 h-4 z-10`} />
                    <input
                        type="text"
                        placeholder="Buscar..."
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
                                placeholder="Buscar..."
                                autoFocus
                                className={`w-full ${theme === 'light' ? 'bg-white text-gray-900 border-gray-200 placeholder-gray-500' : 'bg-white/10 text-white border-transparent placeholder-white/30'} border rounded-full py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 ${isMGT ? 'focus:ring-red-500/50' : 'focus:ring-gold-500/50'} transition-all`}
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
                            className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-emerald-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`}
                            aria-label="Loja"
                            title="Loja de Personalização"
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
                            className={`relative p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-red-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`} 
                            aria-label="Social"
                        >
                            <Users className="w-5 h-5" />
                        </Link>

                        <Link to="/groups" className={`relative p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-red-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`} aria-label="Grupos" title="Grupos">
                            <MessageCircle className="w-5 h-5" />
                            {(hasGroupInvites || hasGroupMentions || hasGroupMessages) && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </Link>

                        <Link to="/roadmap" className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-red-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`} aria-label="Roadmap" title="Roadmap">
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
                                className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-red-400' : 'text-gold-400 hover:text-gold-300')} transition-colors relative`}
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
                            className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-emerald-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`}
                            title="Adquirir Zions"
                        >
                            <Coins className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsWhatsNewModalOpen(true)}
                            className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-emerald-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`}
                            title="O que há de novo"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Profile Link - Both Mobile & Desktop */}
                    <div className="relative">
                        <Link to={isVisitor ? "/login" : "/profile"} className={`flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l ${headerBorder} hover:opacity-80 transition-opacity`}>
                        <div className="text-right hidden lg:block">
                            <div className="flex items-center gap-2 justify-end">
                                <p className={`text-xs ${theme === 'light' ? 'text-gray-900' : (isMGT ? 'text-white' : 'text-gold-200')} font-medium tracking-wide`}>{isVisitor ? 'Visitante' : (user?.name || 'Membro')}</p>
                                {!isVisitor && user?.id && <BadgeDisplay userId={user.id} />}
                            </div>
                            <div className="h-4 relative overflow-hidden w-32 flex justify-end">
                                {isVisitor ? (
                                    <p className="text-[10px] text-gold-500 uppercase tracking-[0.15em] font-bold absolute right-0">
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
                                                className={`text-[10px] ${theme === 'light' ? 'text-gray-700' : (isMGT ? 'text-white text-shine-white' : 'text-gold-500 text-shine-gold')} uppercase tracking-[0.15em] font-bold absolute right-0`}
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
                                                className={`text-[10px] ${theme === 'light' ? 'text-gray-700' : (isMGT ? 'text-white text-shine-white' : 'text-gold-500 text-shine-gold')} uppercase tracking-[0.15em] font-bold absolute right-0`}
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
                                                className={`text-[10px] ${theme === 'light' ? 'text-gray-700' : (isMGT ? 'text-white text-shine-white' : 'text-gold-500 text-shine-gold')} uppercase tracking-[0.15em] font-bold absolute right-0`}
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
                                                className={`text-[10px] ${theme === 'light' ? 'text-gray-700' : (isMGT ? 'text-white' : 'text-gold-500')} uppercase tracking-[0.15em] font-bold absolute right-0`}
                                            >
                                                {isMGT ? 'Membro MGT' : 'Membro Magazine'}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        <div className="relative flex-shrink-0">
                            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full p-[1px]`} style={{ background: user?.equippedColor ? `linear-gradient(135deg, ${user.equippedColor}, ${user.equippedColor}dd)` : (isMGT ? 'linear-gradient(135deg, #10b981, #047857)' : 'linear-gradient(135deg, #d4af37, #b8941e)') }}>
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className={`w-4 h-4 md:w-5 md:h-5 ${isMGT ? 'text-emerald-200' : 'text-gold-200'}`} />
                                    )}
                                </div>
                            </div>
                            {/* Badge indicator */}
                            {getBadgeIcon() && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center border border-gold-500/50">
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
                            className={`hidden md:block p-2 transition-colors border-l ${headerBorder} pl-2 md:pl-4 ml-1 md:ml-2`}
                            style={{ color: user?.equippedColor ? getContrastColor(user.equippedColor) : (isMGT ? '#10b981' : '#d4af37') }}
                            title="Sair"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}

                    {/* Mobile Hamburger Menu */}
                    <button
                        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                        className={`mobile-menu-button md:hidden p-2 ${theme === 'light' ? 'text-black' : (isMGT ? 'text-emerald-500' : 'text-gold-400')} transition-colors`}
                        aria-label="Menu"
                    >
                        {isMobileDrawerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsMobileDrawerOpen(false)}
                        />
                        
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={`mobile-menu-container fixed top-0 right-0 bottom-0 h-screen w-72 ${theme === 'light' ? 'bg-white/95' : 'bg-zinc-900/95'} backdrop-blur-xl z-[60] md:hidden shadow-2xl border-l ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'} flex flex-col overflow-y-auto`}
                        >
                            {/* Drawer Header */}
                            <div className={`p-4 border-b ${headerBorder} ${theme === 'light' ? 'bg-gray-50' : 'bg-black/50'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`font-bold text-lg ${isMGT ? 'text-emerald-500' : 'text-gold-400'}`}>
                                        Menu
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {!isVisitor && (
                                            <button
                                                onClick={() => {
                                                    setIsMobileDrawerOpen(false);
                                                    logout();
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                                style={{ 
                                                    backgroundColor: user?.equippedColor ? `${user.equippedColor}20` : (isMGT ? '#10b98120' : '#d4af3720'),
                                                    color: user?.equippedColor || (isMGT ? '#10b981' : '#d4af37')
                                                }}
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Sair</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsMobileDrawerOpen(false)}
                                            className={`p-2 rounded-lg ${theme === 'light' ? 'text-gray-500 hover:bg-gray-200' : 'text-white/50 hover:bg-white/10'} transition-colors`}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* User Info */}
                                {user && (
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setIsMobileDrawerOpen(false)}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10'} transition-colors`}
                                    >
                                        <div className={`w-12 h-12 rounded-full p-[1px]`} style={{ background: user.equippedColor ? `linear-gradient(135deg, ${user.equippedColor}, ${user.equippedColor}dd)` : (isMGT ? 'linear-gradient(135deg, #10b981, #047857)' : 'linear-gradient(135deg, #d4af37, #b8941e)') }}>
                                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className={`w-6 h-6 ${isMGT ? 'text-emerald-200' : 'text-gold-200'}`} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: user.equippedColor ? getContrastColor(user.equippedColor) : (isMGT ? '#10b981' : '#d4af37') }}>{user.displayName || user.name}</p>
                                            <p className="text-xs" style={{ color: user.equippedColor ? getContrastColor(user.equippedColor) : (isMGT ? '#34d399' : '#e5c86d') }}>
                                                {user.zionsPoints || 0} Points • Z$ {(user.zionsCash || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </Link>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className={`p-4 border-b ${headerBorder} flex gap-2`}>
                                <button
                                    onClick={() => {
                                        setIsMobileDrawerOpen(false);
                                        setIsSearchModalOpen(true);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'} transition-colors`}
                                >
                                    <Search className="w-4 h-4" />
                                    <span className="text-sm">Buscar</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMobileDrawerOpen(false);
                                        onOpenShop ? onOpenShop() : setIsShopOpen(true);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'} transition-colors`}
                                >
                                    <Store className="w-4 h-4" />
                                    <span className="text-sm">Loja</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMobileDrawerOpen(false);
                                        openZionsModal();
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg ${isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'} transition-colors`}
                                >
                                    <Coins className="w-4 h-4" />
                                    <span className="text-sm">Zions Cash</span>
                                </button>
                            </div>

                            {/* Cards Section + Menu Items */}
                            <div className="flex-1 overflow-y-auto px-4 py-2">
                                <div className="flex flex-col gap-4 mb-4">
                                    <DailyLoginCard status={dailyLoginStatus} onClick={() => { setIsMobileDrawerOpen(false); openDailyLoginModal(); }} />
                                    <OnlineFriendsCard />
                                    <div className="md:hidden">
                                        <GroupChatCard />
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="space-y-1">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileDrawerOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${theme === 'light' ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/5 text-white/80'} transition-colors`}
                                    >
                                        <span className={isMGT ? 'text-emerald-500' : 'text-gold-400'}>{item.icon}</span>
                                        <span className="text-sm">{item.label}</span>
                                        {item.badge && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />
                                        )}
                                    </Link>
                                ))}
                                </div>
                            </div>
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
