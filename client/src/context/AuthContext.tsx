import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import DailyLoginModal from '../components/DailyLoginModal';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    points: number;
    trophies: number;
    zions: number;
    level: number;
    membershipType?: 'MAGAZINE' | 'MGT';
    avatarUrl?: string;
    displayName?: string;
    bio?: string;
    // Customization fields
    ownedCustomizations?: string[];
    equippedBackground?: string | null;
    equippedBadge?: string | null;
    equippedColor?: string | null;
    liteMode?: boolean;
}

export interface DailyLoginStatus {
    claimed: boolean;
    streak: number;
    nextReward: number;
    rewards: number[];
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User, membershipContext?: 'MAGAZINE' | 'MGT') => void;
    updateUser: (user: User) => void;
    updateUserZions: (amount: number) => void;
    loginAsVisitor: (membershipType?: 'MAGAZINE' | 'MGT') => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    isVisitor: boolean;
    showAchievement: (title: string, description: string) => void;
    clearAchievement: () => void;
    achievement: { title: string; description: string } | null;
    dailyLoginStatus: DailyLoginStatus | null;
    openDailyLoginModal: () => void;
    // Zions Modal
    isZionsModalOpen: boolean;
    openZionsModal: () => void;
    closeZionsModal: () => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    // Customization
    accentColor: string;
    backgroundStyle: string | null;
    equippedBadge: string | null;
    // Active Chat
    activeChatUserId: string | null;
    setActiveChatUserId: (userId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Background CSS configurations - with animation
const BACKGROUND_STYLES: Record<string, string> = {
    'bg_aurora': 'linear-gradient(125deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)',
    'bg_sunset': 'linear-gradient(125deg, #1a0a0a 0%, #2d1f1f 25%, #4a2020 50%, #2d1f1f 75%, #1a0a0a 100%)',
    'bg_ocean': 'linear-gradient(125deg, #0a1628 0%, #0c2340 33%, #0a1628 66%, #0c2340 100%)',
    'bg_forest': 'linear-gradient(125deg, #0a1a0a 0%, #0f2a0f 33%, #0a1a0a 66%, #0f2a0f 100%)',
    'bg_galaxy': 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 25%, #2d1b4e 50%, #1a0a2e 75%, #0c0c0c 100%)',
    'bg_matrix': 'linear-gradient(180deg, #0a0f0a 0%, #0a1a0a 33%, #0a0f0a 66%, #0a1a0a 100%)',
    'bg_fire': 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 25%, #4a2a0a 50%, #2d1a0a 75%, #1a0a0a 100%)',
    'bg_city': 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 33%, #1a1a2e 66%, #0f0f1a 100%)',
    'bg_space': 'linear-gradient(135deg, #000005 0%, #0a0a1a 33%, #000005 66%, #0a0a1a 100%)',
};

// Accent color configurations
const ACCENT_COLORS: Record<string, string> = {
    'color_gold': '#d4af37',
    'color_rgb': 'rgb-dynamic', // Special case for RGB animation
    'color_cyan': '#00ffff',
    'color_magenta': '#ff00ff',
    'color_lime': '#00ff00',
    'color_orange': '#ff6600',
    'color_purple': '#9933ff',
    'color_pink': '#ff69b4',
    'color_blue': '#0066ff',
    'color_red': '#ff0033',
};

// Helper to convert hex to rgb
const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '212, 175, 55';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [achievement, setAchievement] = useState<{ title: string; description: string } | null>(null);
    const [dailyLoginStatus, setDailyLoginStatus] = useState<DailyLoginStatus | null>(null);
    const [isDailyLoginModalOpen, setIsDailyLoginModalOpen] = useState(false);
    const [isZionsModalOpen, setIsZionsModalOpen] = useState(false);
    const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (!token) return 'dark'; // Force dark if not logged in

            const saved = localStorage.getItem('theme');
            return (saved === 'light' || saved === 'dark') ? saved : 'dark';
        }
        return 'dark';
    });

    // Compute accent color from user's equipped customization
    const accentColor = React.useMemo(() => {
        if (user?.equippedColor && ACCENT_COLORS[user.equippedColor]) {
            const colorValue = ACCENT_COLORS[user.equippedColor];
            // If RGB dynamic, return default color for CSS variables (animation handled separately)
            if (colorValue === 'rgb-dynamic') {
                return '#ff0000'; // Red as default for RGB cycle
            }
            return colorValue;
        }
        // Default colors based on membership
        return user?.membershipType === 'MGT' ? '#50c878' : '#d4af37';
    }, [user?.equippedColor, user?.membershipType]);

    // Compute background style from user's equipped customization
    const backgroundStyle = React.useMemo(() => {
        if (user?.equippedBackground && BACKGROUND_STYLES[user.equippedBackground]) {
            return BACKGROUND_STYLES[user.equippedBackground];
        }
        return null; // Use default background
    }, [user?.equippedBackground]);

    // Apply accent color as CSS variable
    useEffect(() => {
        const mixHex = (hexA: string, hexB: string, weightA: number) => {
            const normalize = (hex: string) => hex.replace('#', '');
            const a = normalize(hexA);
            const b = normalize(hexB);
            const aRgb = {
                r: parseInt(a.slice(0, 2), 16),
                g: parseInt(a.slice(2, 4), 16),
                b: parseInt(a.slice(4, 6), 16),
            };
            const bRgb = {
                r: parseInt(b.slice(0, 2), 16),
                g: parseInt(b.slice(2, 4), 16),
                b: parseInt(b.slice(4, 6), 16),
            };
            const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
            const r = clamp(aRgb.r * weightA + bRgb.r * (1 - weightA));
            const g = clamp(aRgb.g * weightA + bRgb.g * (1 - weightA));
            const bCh = clamp(aRgb.b * weightA + bRgb.b * (1 - weightA));
            const toHex2 = (n: number) => n.toString(16).padStart(2, '0');
            return `#${toHex2(r)}${toHex2(g)}${toHex2(bCh)}`;
        };

        const root = document.documentElement;
        root.style.setProperty('--accent-color', accentColor);
        root.style.setProperty('--accent-color-rgb', hexToRgb(accentColor));
        // Precompute accent shades in JS (avoids relying on CSS color-mix support)
        root.style.setProperty('--accent-50', mixHex(accentColor, '#ffffff', 0.10));
        root.style.setProperty('--accent-100', mixHex(accentColor, '#ffffff', 0.20));
        root.style.setProperty('--accent-200', mixHex(accentColor, '#ffffff', 0.40));
        root.style.setProperty('--accent-300', mixHex(accentColor, '#ffffff', 0.60));
        root.style.setProperty('--accent-400', accentColor);
        root.style.setProperty('--accent-500', accentColor);
        root.style.setProperty('--accent-600', mixHex(accentColor, '#000000', 0.80));
        root.style.setProperty('--accent-700', mixHex(accentColor, '#000000', 0.60));
        
        // Add class when custom color is equipped to enable global color replacement
        if (user?.equippedColor) {
            root.classList.add('custom-accent');
            // Add rgb-dynamic class for RGB animation
            if (user.equippedColor === 'color_rgb') {
                console.log('[AuthContext] Aplicando RGB dinâmico - classe rgb-dynamic adicionada');
                root.classList.add('rgb-dynamic');
            } else {
                console.log('[AuthContext] Cor customizada, mas não RGB');
                root.classList.remove('rgb-dynamic');
            }
        } else {
            root.classList.remove('custom-accent');
            root.classList.remove('rgb-dynamic');
        }
    }, [accentColor, user?.equippedColor]);

    // Apply custom background
    useEffect(() => {
        if (backgroundStyle) {
            document.body.style.background = backgroundStyle;
            document.body.style.backgroundSize = '200% 200%';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.animation = 'wave-bg 8s ease-in-out infinite';
        } else {
            document.body.style.background = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.animation = '';
        }
    }, [backgroundStyle]);

    useEffect(() => {
        // Apply theme class to html element
        const root = window.document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // 1. Load User
                    const userRes = await api.get('/users/me');
                    let userData = userRes.data;

                    // Update localStorage with server's membership type (server is source of truth)
                    // This ensures when membership changes (e.g., MGT to MAGAZINE), it's reflected
                    if (userData.membershipType) {
                        localStorage.setItem('sessionMembershipType', userData.membershipType);
                    }

                    setUser(userData);


                    // 2. Check Daily Login Status
                    try {
                        const statusRes = await Promise.race([
                            api.get('/gamification/daily-login/status', {
                                headers: { Authorization: `Bearer ${token}` }
                            }),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Timeout')), 5000)
                            )
                        ]);
                        setDailyLoginStatus((statusRes as any).data);

                        // Auto-open modal if not claimed AND not already shown this session
                        const today = new Date().toDateString();
                        const lastModalShown = localStorage.getItem('dailyLoginModalShown');
                        
                        if (!(statusRes as any).data.claimed && lastModalShown !== today) {
                            localStorage.setItem('dailyLoginModalShown', today);
                            setTimeout(() => setIsDailyLoginModalOpen(true), 1500);
                        }
                    } catch (loginError) {
                        console.error('Daily login status check failed', loginError);
                        // Set fallback status to stop loading animation
                        setDailyLoginStatus({
                            claimed: true,
                            streak: 0,
                            nextReward: 0,
                            rewards: []
                        });
                    }
                } catch (error) {
                    console.error('Failed to load user', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []); // Removed theme dependency to avoid infinite loop, logic handled inside

    const toggleTheme = () => {
        if (user?.membershipType === 'MGT') {
            setTheme(prev => prev === 'dark' ? 'light' : 'dark');
        }
    };

    const showAchievement = (title: string, description: string) => {
        setAchievement({ title, description });
    };

    const clearAchievement = () => {
        setAchievement(null);
    };

    const login = (token: string, userData: User, membershipContext?: 'MAGAZINE' | 'MGT') => {
        localStorage.setItem('token', token);

        if (membershipContext) {
            localStorage.setItem('sessionMembershipType', membershipContext);
            userData.membershipType = membershipContext;
        }

        setUser(userData);
    };

    const updateUser = (userData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return userData as User;
            // Preserve membershipType from session if not in new data
            const sessionMembership = localStorage.getItem('sessionMembershipType') as 'MAGAZINE' | 'MGT' | null;
            return {
                ...prev,
                ...userData,
                membershipType: userData.membershipType || sessionMembership || prev.membershipType
            };
        });
    };

    const updateUserZions = (amount: number) => {
        if (user) {
            setUser({ ...user, zions: (user.zions || 0) + amount });
        }
    };

    const loginAsVisitor = (membershipType: 'MAGAZINE' | 'MGT' = 'MAGAZINE') => {
        setUser({
            id: 'visitor',
            name: 'Visitante',
            email: '',
            role: 'VISITOR',
            points: 0,
            trophies: 0,
            zions: 0,
            level: 0,
            membershipType: membershipType,
            displayName: 'Visitante',
            bio: 'Explorando o Clube Magazine'
        });
        setTheme('dark');
        // Mock Daily Login for Visitor
        setDailyLoginStatus({
            claimed: false,
            streak: 1,
            nextReward: 100,
            rewards: [100, 200, 300, 400, 500, 1000, 2000]
        });
        setTimeout(() => setIsDailyLoginModalOpen(true), 1500);
    };

    const logout = () => {
        // Only save membership type if NOT a visitor
        if (user?.membershipType && user.role !== 'VISITOR') {
            localStorage.setItem('lastMembershipType', user.membershipType);
        } else {
            // If visitor, clear it or set to default to avoid "mixed" screen
            localStorage.removeItem('lastMembershipType');
        }

        localStorage.removeItem('token');
        localStorage.removeItem('sessionMembershipType');
        setUser(null);

        // Reset custom colors to default (gold for Magazine)
        const root = document.documentElement;
        root.style.setProperty('--accent-color', '#d4af37');
        root.style.setProperty('--accent-color-rgb', '212, 175, 55');
        root.classList.remove('custom-accent');

        // Force Dark Mode immediately and persist it
        setTheme('dark');
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');

        window.location.href = '/login';
    };

    const handleClaimDailyLogin = async () => {
        try {
            const response = await api.post('/gamification/daily-login');
            if (response.data.awarded > 0) {
                // Update user zions
                if (user) {
                    setUser({ ...user, zions: (user.zions || 0) + response.data.awarded });
                }
                // Update status with new streak from backend
                setDailyLoginStatus(prev => prev ? { 
                    ...prev, 
                    claimed: true,
                    streak: response.data.streak || prev.streak
                } : null);

                // Mark as claimed for today so modal won't reopen
                localStorage.setItem('dailyLoginModalShown', new Date().toDateString());

                // Close modal after delay
                setTimeout(() => setIsDailyLoginModalOpen(false), 2000);
            }
        } catch (error) {
            console.error('Failed to claim daily login', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            updateUser,
            updateUserZions,
            loginAsVisitor,
            logout,
            isAuthenticated: !!user,
            loading,
            isVisitor: user?.role === 'VISITOR',
            showAchievement,
            clearAchievement,
            achievement,
            dailyLoginStatus,
            openDailyLoginModal: () => setIsDailyLoginModalOpen(true),
            isZionsModalOpen,
            openZionsModal: () => setIsZionsModalOpen(true),
            closeZionsModal: () => setIsZionsModalOpen(false),
            theme,
            toggleTheme,
            // Customization values
            accentColor,
            backgroundStyle,
            equippedBadge: user?.equippedBadge || null,
            // Active Chat
            activeChatUserId,
            setActiveChatUserId,
        }}>
            {children}
            <DailyLoginModal
                isOpen={isDailyLoginModalOpen}
                onClose={() => setIsDailyLoginModalOpen(false)}
                status={dailyLoginStatus}
                onClaim={handleClaimDailyLogin}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
