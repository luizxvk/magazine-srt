import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
}

const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', path: '/feed' },
    { id: 'explore', icon: Search, label: 'Explorar', path: '/explore' },
    { id: 'store', icon: ShoppingBag, label: 'Loja', path: '/loja' },
    { id: 'profile', icon: User, label: 'Perfil', path: '/profile' },
];

export default function BottomNavigation() {
    const { user, isMobileDrawerOpen } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [activeId, setActiveId] = useState('home');

    const isMGT = user?.membershipType === 'MGT';

    // Theme colors
    const accentColor = isMGT ? 'emerald' : 'amber';
    const glowColor = isMGT ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)';
    const activeTextColor = isMGT ? 'text-emerald-400' : 'text-amber-400';
    const activeBgColor = isMGT ? 'bg-emerald-500/20' : 'bg-amber-500/20';

    // Don't show on auth pages or desktop
    const hiddenPaths = ['/', '/login', '/register', '/request-invite', '/reset-password'];
    const shouldHide = hiddenPaths.includes(location.pathname);

    // Detect if any modal/popup is open by checking common modal classes in DOM
    const [hasOpenModal, setHasOpenModal] = useState(false);
    
    useEffect(() => {
        const checkForModals = () => {
            // Check for common modal indicators
            const modalOverlays = document.querySelectorAll('[role="dialog"], .fixed.inset-0, [data-modal="true"]');
            const hasVisibleModal = Array.from(modalOverlays).some(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });
            setHasOpenModal(hasVisibleModal);
        };
        
        // Use MutationObserver to detect DOM changes
        const observer = new MutationObserver(checkForModals);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        
        // Initial check
        checkForModals();
        
        return () => observer.disconnect();
    }, []);

    // Update active based on current path
    useEffect(() => {
        const currentItem = navItems.find(item => location.pathname.startsWith(item.path));
        if (currentItem) {
            setActiveId(currentItem.id);
        }
    }, [location.pathname]);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollY;
            const scrollThreshold = 10;

            if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
                setIsVisible(!scrollingDown || currentScrollY < 100);
                setLastScrollY(currentScrollY);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Hide when drawer/modal is open or should be hidden
    if (shouldHide || !user || isMobileDrawerOpen || hasOpenModal) return null;

    return (
        <>
            {/* Spacer for content */}
            <div className="h-20 lg:hidden" />

            {/* Bottom Navigation - Only visible on mobile/tablet */}
            <AnimatePresence>
                {isVisible && (
                    <motion.nav
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ 
                            type: 'spring', 
                            stiffness: 400, 
                            damping: 30,
                            mass: 0.8
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden"
                    >
                        {/* Apple Vision Pro style glassmorphism container */}
                        <div className="mx-3 mb-3">
                            <div 
                                className="relative rounded-2xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                    backdropFilter: 'blur(40px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                                    boxShadow: `
                                        0 8px 32px rgba(0, 0, 0, 0.4),
                                        0 0 0 1px rgba(255, 255, 255, 0.1),
                                        inset 0 1px 0 rgba(255, 255, 255, 0.15),
                                        0 0 80px ${glowColor}
                                    `,
                                }}
                            >
                                {/* Subtle gradient overlay */}
                                <div 
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
                                    }}
                                />

                                {/* Navigation items */}
                                <div className="relative flex items-center justify-around px-2 py-2">
                                    {navItems.map((item) => {
                                        const isActive = activeId === item.id;
                                        const Icon = item.icon;

                                        return (
                                            <motion.button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveId(item.id);
                                                    navigate(item.path);
                                                }}
                                                className="relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-300"
                                                whileTap={{ scale: 0.9 }}
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                {/* Active background glow */}
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeTab"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                            transition={{ 
                                                                type: 'spring', 
                                                                stiffness: 500, 
                                                                damping: 30 
                                                            }}
                                                            className={`absolute inset-0 ${activeBgColor} rounded-xl`}
                                                            style={{
                                                                boxShadow: `0 0 20px ${glowColor}`,
                                                            }}
                                                        />
                                                    )}
                                                </AnimatePresence>

                                                {/* Icon */}
                                                <motion.div
                                                    animate={{ 
                                                        scale: isActive ? 1.1 : 1,
                                                        y: isActive ? -2 : 0
                                                    }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                    className="relative z-10"
                                                >
                                                    <Icon 
                                                        className={`w-6 h-6 transition-colors duration-300 ${
                                                            isActive 
                                                                ? activeTextColor
                                                                : 'text-white/60'
                                                        }`} 
                                                    />
                                                    
                                                    {/* Active indicator dot */}
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-${accentColor}-400`}
                                                            style={{
                                                                boxShadow: `0 0 8px ${glowColor}`,
                                                            }}
                                                        />
                                                    )}
                                                </motion.div>

                                                {/* Label */}
                                                <motion.span
                                                    animate={{ 
                                                        opacity: isActive ? 1 : 0.6,
                                                        y: isActive ? 0 : 2
                                                    }}
                                                    className={`relative z-10 text-[10px] font-medium mt-1 transition-colors duration-300 ${
                                                        isActive 
                                                            ? activeTextColor
                                                            : 'text-white/60'
                                                    }`}
                                                >
                                                    {item.label}
                                                </motion.span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </>
    );
}
