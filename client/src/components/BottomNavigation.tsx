import { useState, useEffect, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import { useTranslation } from 'react-i18next';

interface NavItem {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
    path: string;
}

const navItems: NavItem[] = [
    { id: 'home', icon: Home, labelKey: 'common:nav.home', path: '/feed' },
    { id: 'explore', icon: Search, labelKey: 'common:nav.explore', path: '/explore' },
    { id: 'store', icon: ShoppingBag, labelKey: 'common:nav.shop', path: '/loja' },
    { id: 'profile', icon: User, labelKey: 'common:nav.profile', path: '/profile' },
];

// Memoized nav item for better performance
const NavItemButton = memo(({ 
    item, 
    label,
    isActive, 
    activeTextColor, 
    activeBgColor,
    glowColor,
    onClick 
}: { 
    item: NavItem; 
    label: string;
    isActive: boolean; 
    activeTextColor: string;
    activeBgColor: string;
    glowColor: string;
    onClick: () => void;
}) => {
    const Icon = item.icon;
    
    return (
        <button
            onClick={onClick}
            data-tutorial={`nav-${item.id}`}
            className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-transform active:scale-90`}
        >
            {/* Active background */}
            {isActive && (
                <div 
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: activeBgColor, boxShadow: `0 0 15px ${glowColor}` }}
                />
            )}

            {/* Icon */}
            <div 
                className={`relative z-10 transition-transform ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}
                style={{ color: isActive ? activeTextColor : 'rgba(255,255,255,0.6)' }}
            >
                <Icon className="w-6 h-6 transition-colors" />
            </div>

            {/* Label */}
            <span
                className="relative z-10 text-[10px] font-medium mt-1 transition-colors"
                style={{ color: isActive ? activeTextColor : 'rgba(255,255,255,0.6)' }}
            >
                {label}
            </span>
        </button>
    );
});

NavItemButton.displayName = 'NavItemButton';

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function BottomNavigation() {
    const { user, isMobileDrawerOpen, activeChatUserId, accentColor } = useAuth();
    const { getUserAccent } = useTierColors();
    const { t } = useTranslation('common');
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [activeId, setActiveId] = useState('home');
    const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const liteMode = user?.liteMode ?? false;
    
    // Use user's accent color for navbar (dynamic per community)
    const userColor = accentColor || getUserAccent();

    // Theme colors - use accent color
    const glowColor = hexToRgba(userColor, 0.3);
    const activeTextColor = userColor; // Pass as hex for inline styles
    const activeBgColor = hexToRgba(userColor, 0.2);
    const borderGlow = 'border-white/10';

    // Listen for story viewer state changes
    useEffect(() => {
        const handleStoryViewerState = (e: CustomEvent<{ isOpen: boolean }>) => {
            setIsStoryViewerOpen(e.detail.isOpen);
        };

        window.addEventListener('storyViewerStateChange', handleStoryViewerState as EventListener);
        return () => {
            window.removeEventListener('storyViewerStateChange', handleStoryViewerState as EventListener);
        };
    }, []);

    // Listen for comments modal state changes
    useEffect(() => {
        const handleCommentsState = (e: CustomEvent<{ isOpen: boolean }>) => {
            setIsCommentsOpen(e.detail.isOpen);
        };

        window.addEventListener('commentsModalStateChange', handleCommentsState as EventListener);
        return () => {
            window.removeEventListener('commentsModalStateChange', handleCommentsState as EventListener);
        };
    }, []);

    // Don't show on auth pages, Connect page, or desktop
    const hiddenPaths = ['/', '/login', '/register', '/request-invite', '/reset-password'];
    const isConnectPage = location.pathname.startsWith('/connect');
    const shouldHide = hiddenPaths.includes(location.pathname) || isConnectPage;

    // Update active based on current path
    useEffect(() => {
        const currentItem = navItems.find(item => location.pathname.startsWith(item.path));
        if (currentItem) {
            setActiveId(currentItem.id);
        }
    }, [location.pathname]);

    // Optimized scroll handler with requestAnimationFrame throttling
    useEffect(() => {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const scrollingDown = currentScrollY > lastScrollY;
                    const scrollThreshold = 20;

                    if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
                        setIsVisible(!scrollingDown || currentScrollY < 100);
                        setLastScrollY(currentScrollY);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Memoized click handler
    const handleItemClick = useCallback((item: NavItem) => {
        setActiveId(item.id);
        navigate(item.path);
    }, [navigate]);

    // Hide when drawer/modal is open, story viewer is open, or should be hidden
    // Hide navbar when chat popup is open or other conditions
    if (shouldHide || !user || isMobileDrawerOpen || isStoryViewerOpen || isCommentsOpen || activeChatUserId) return null;

    return (
        <>
            {/* Spacer for content */}
            <div className="h-20 lg:hidden" />

            {/* Bottom Navigation - Only visible on mobile/tablet */}
            <nav
                className={`fixed bottom-0 left-0 right-0 z-[100] lg:hidden transition-transform duration-200 ${
                    isVisible ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                {/* Glassmorphism container - optimized */}
                <div className="mx-3 mb-3">
                    <div 
                        className={`relative rounded-2xl overflow-hidden border ${borderGlow}`}
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            ...(liteMode ? {} : {
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                            }),
                        }}
                    >
                        {/* Navigation items */}
                        <div className="relative flex items-center justify-around px-2 py-2">
                            {navItems.map((item) => (
                                <NavItemButton
                                    key={item.id}
                                    item={item}
                                    label={t(item.labelKey)}
                                    isActive={activeId === item.id}
                                    activeTextColor={activeTextColor}
                                    activeBgColor={activeBgColor}
                                    glowColor={glowColor}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
