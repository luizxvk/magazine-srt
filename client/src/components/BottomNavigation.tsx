import { useState, useEffect, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

// Memoized nav item for better performance
const NavItemButton = memo(({ 
    item, 
    isActive, 
    activeTextColor, 
    activeBgColor,
    glowColor,
    onClick 
}: { 
    item: NavItem; 
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
            className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-transform active:scale-90`}
        >
            {/* Active background */}
            {isActive && (
                <div 
                    className={`absolute inset-0 ${activeBgColor} rounded-xl`}
                    style={{ boxShadow: `0 0 15px ${glowColor}` }}
                />
            )}

            {/* Icon */}
            <div className={`relative z-10 transition-transform ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon 
                    className={`w-6 h-6 transition-colors ${
                        isActive ? activeTextColor : 'text-white/60'
                    }`} 
                />
            </div>

            {/* Label */}
            <span
                className={`relative z-10 text-[10px] font-medium mt-1 transition-colors ${
                    isActive ? activeTextColor : 'text-white/60'
                }`}
            >
                {item.label}
            </span>
        </button>
    );
});

NavItemButton.displayName = 'NavItemButton';

export default function BottomNavigation() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [activeId, setActiveId] = useState('home');

    const isMGT = user?.membershipType === 'MGT';

    // Theme colors - simplified
    const glowColor = isMGT ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)';
    const activeTextColor = isMGT ? 'text-emerald-400' : 'text-amber-400';
    const activeBgColor = isMGT ? 'bg-emerald-500/20' : 'bg-amber-500/20';
    const borderGlow = isMGT ? 'border-emerald-500/20' : 'border-amber-500/20';

    // Don't show on auth pages or desktop
    const hiddenPaths = ['/', '/login', '/register', '/request-invite', '/reset-password'];
    const shouldHide = hiddenPaths.includes(location.pathname);

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

    // Hide when drawer/modal is open or should be hidden
    if (shouldHide || !user) return null;

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
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                        }}
                    >
                        {/* Navigation items */}
                        <div className="relative flex items-center justify-around px-2 py-2">
                            {navItems.map((item) => (
                                <NavItemButton
                                    key={item.id}
                                    item={item}
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
