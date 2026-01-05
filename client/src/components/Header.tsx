import { Search, Bell, User, LogOut, X, Users, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Notifications from './Notifications';
import api from '../services/api';
import logoSrt from '../assets/logo-mgt.png';

interface HeaderProps {
    onOpenRecommendations?: () => void;
}

export default function Header({ onOpenRecommendations }: HeaderProps) {
    const { user, isVisitor, logout, showAchievement, theme, openZionsModal } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [displayMode, setDisplayMode] = useState<'trophies' | 'zions' | 'membership'>('trophies');

    const isMGT = user?.membershipType === 'MGT';
    const themeBorder = isMGT ? 'border-emerald-600/30' : 'border-gold-500/20';

    useEffect(() => {
        if (isVisitor) return;
        const interval = setInterval(() => {
            setDisplayMode(prev => {
                if (prev === 'trophies') return 'zions';
                if (prev === 'zions') return 'membership';
                return 'trophies';
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [isVisitor]);

    useEffect(() => {
        if (isVisitor) return;

        const checkNotifications = async () => {
            try {
                const response = await api.get('/notifications');
                const notifications = response.data;
                const unread = notifications.some((n: any) => !n.read);
                setHasUnread(unread);

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
        const interval = setInterval(checkNotifications, 15000);
        return () => clearInterval(interval);
    }, [isVisitor, showAchievement]);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 glass-panel border-b ${themeBorder} bg-black/50 backdrop-blur-xl transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-4 shrink-0">
                    <Link to="/feed" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {isMGT ? (
                            <img src={logoSrt} alt="SRT Logo" className={`h-20 md:h-28 object-contain ${theme === 'light' ? 'brightness-0' : ''}`} />
                        ) : (
                            <span className="text-xl md:text-2xl font-bold animate-gold-shimmer tracking-widest font-serif">MAGAZINE</span>
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
                        className={`w-full ${theme === 'light' ? 'bg-white border-gray-300 text-black placeholder-gray-600 shadow-sm' : 'bg-white/5 border-white/10 text-white placeholder-white/20'} backdrop-blur-md border hover:border-white/20 focus:border-white/30 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] relative z-0`}
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
                    {/* Mobile Recommendations Toggle */}
                    {onOpenRecommendations && (
                        <button
                            onClick={onOpenRecommendations}
                            className={`md:hidden p-2 ${theme === 'light' ? 'text-black' : (isMGT ? 'text-emerald-500' : 'text-gold-400')}`}
                            aria-label="Recomendações"
                        >
                            <Zap className="w-5 h-5" />
                        </button>
                    )}

                    {/* Mobile Search Toggle */}
                    <button
                        onClick={() => setIsMobileSearchOpen(true)}
                        className={`md:hidden p-2 ${theme === 'light' ? 'text-black' : (isMGT ? 'text-emerald-500' : 'text-gold-400')}`}
                        aria-label="Abrir busca"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <Link to="/social" className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-red-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`} aria-label="Social">
                        <Users className="w-5 h-5" />
                    </Link>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-red-400' : 'text-gold-400 hover:text-gold-300')} transition-colors relative`}
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {hasUnread && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </button>
                        {showNotifications && <Notifications />}
                        {showNotifications && <Notifications />}
                    </div>

                    <button
                        onClick={openZionsModal}
                        className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500 hover:text-emerald-400' : 'text-gold-400 hover:text-gold-300')} transition-colors`}
                        title="Adquirir Zions"
                    >
                        <Sparkles className="w-5 h-5" />
                    </button>

                    <Link to={isVisitor ? "/login" : "/profile"} className={`flex items-center gap-3 pl-2 md:pl-4 border-l ${theme === 'light' ? 'border-black/10' : (isMGT ? 'border-emerald-500/20' : 'border-gold-500/10')} hover:opacity-80 transition-opacity`}>
                        <div className="text-right hidden lg:block">
                            <p className={`text-xs ${theme === 'light' ? 'text-gray-900' : (isMGT ? 'text-white' : 'text-gold-200')} font-medium tracking-wide`}>{isVisitor ? 'Visitante' : (user?.name || 'Membro')}</p>
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
                                        {displayMode === 'zions' && (
                                            <motion.p
                                                key="zions"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.5 }}
                                                className={`text-[10px] ${theme === 'light' ? 'text-gray-700' : (isMGT ? 'text-white text-shine-white' : 'text-gold-500 text-shine-gold')} uppercase tracking-[0.15em] font-bold absolute right-0`}
                                            >
                                                {user?.zions ? `${user.zions} Zions` : '0 Zions'}
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

                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br ${isMGT ? 'from-emerald-600 to-black border border-emerald-500' : 'from-gold-400 to-gold-700'} p-[1px]`}>
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className={`w-4 h-4 md:w-5 md:h-5 ${isMGT ? 'text-emerald-200' : 'text-gold-200'}`} />
                                )}
                            </div>
                        </div>
                    </Link>

                    {!isVisitor && (
                        <button
                            onClick={logout}
                            className={`p-2 ${theme === 'light' ? 'text-black hover:text-gray-700' : (isMGT ? 'text-emerald-500/50 hover:text-red-500' : 'text-gold-500/50 hover:text-red-500')} transition-colors border-l ${theme === 'light' ? 'border-black/10' : (isMGT ? 'border-emerald-500/20' : 'border-gold-500/10')} pl-2 md:pl-4 ml-1 md:ml-2`}
                            title="Sair"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div >
        </header >
    );
}
