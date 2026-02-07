import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DailyLoginModal from '../components/DailyLoginModal';
import type { ToastType } from '../components/Toast';
import type { EdgeNotificationData, EdgeNotificationType } from '../components/EdgeNotification';

export interface ToastData {
    message: string;
    description?: string;
    type: ToastType;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    points: number;
    trophies: number;
    xp: number; // XP para cálculo de nível
    zions: number; // DEPRECATED - manter para compatibilidade
    zionsPoints: number; // Moeda para customizações (100 points = 1 cash)
    zionsCash: number; // Moeda real (1 cash = R$ 1,00)
    level: number;
    membershipType?: 'MAGAZINE' | 'MGT';
    avatarUrl?: string;
    displayName?: string;
    bio?: string;
    isVerified?: boolean;
    postCount?: number; // Total de posts do usuário
    // Elite subscription fields
    isElite?: boolean;
    eliteUntil?: string;
    eliteSince?: string;
    eliteStreak?: number;
    // Customization fields
    ownedCustomizations?: string[];
    equippedBackground?: string | null;
    equippedBadge?: string | null;
    equippedColor?: string | null;
    equippedProfileBorder?: string | null;
    liteMode?: boolean;
    // Profile card background
    profileBgUrl?: string | null;
    profileBgScale?: number | null;
    profileBgPosX?: number | null;
    profileBgPosY?: number | null;
    // Beta reward
    betaRewardClaimed?: boolean;
    // UI preferences
    showWelcomeCard?: boolean;
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
    updateUser: (user: Partial<User>) => void;
    updateUserZions: (amount: number) => void; // DEPRECATED - usa updateUserPoints ou updateUserCash
    updateUserPoints: (amount: number) => void; // Atualiza Zions Points
    updateUserCash: (amount: number) => void; // Atualiza Zions Cash
    loginAsVisitor: (membershipType?: 'MAGAZINE' | 'MGT') => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    isVisitor: boolean;
    showAchievement: (title: string, description: string) => void;
    clearAchievement: () => void;
    achievement: { title: string; description: string } | null;
    showToast: (message: string) => void;
    toast: string | null;
    // Typed toasts
    toastData: ToastData | null;
    showSuccess: (message: string, description?: string) => void;
    showError: (message: string, description?: string) => void;
    showWarning: (message: string, description?: string) => void;
    showInfo: (message: string, description?: string) => void;
    clearToast: () => void;
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
    accentGradient: string | null; // Gradient for backgrounds (null = use solid color)
    accentGradientColors: string[] | null; // Array of colors for animated GradientText
    backgroundStyle: string | null;
    equippedBadge: string | null;
    // Theme Preview Mode
    previewTheme: { background: string; color: string; packName: string; packId: string; price: number; badgeUrl?: string } | null;
    setPreviewTheme: (preview: { background: string; color: string; packName: string; packId: string; price: number; badgeUrl?: string } | null) => void;
    // Active Chat
    activeChatUserId: string | null;
    setActiveChatUserId: (userId: string | null) => void;
    // Mobile Drawer State
    isMobileDrawerOpen: boolean;
    setIsMobileDrawerOpen: (isOpen: boolean) => void;
    // Edge Notifications (Mobile-style)
    edgeNotifications: EdgeNotificationData[];
    showEdgeNotification: (type: EdgeNotificationType, title: string, message: string, options?: { avatar?: string; action?: { label: string; onClick: () => void }; duration?: number }) => void;
    closeEdgeNotification: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Background CSS configurations - with animation
const BACKGROUND_STYLES: Record<string, string> = {
    'bg_aurora': 'linear-gradient(125deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)',
    'bg_sunset': 'linear-gradient(125deg, #1a0a0a 0%, #2d1f1f 25%, #4a2020 50%, #2d1f1f 75%, #1a0a0a 100%)',
    'bg_forest': 'linear-gradient(125deg, #0a1a0a 0%, #0f2a0f 33%, #0a1a0a 66%, #0f2a0f 100%)',
    'bg_galaxy': 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 25%, #2d1b4e 50%, #1a0a2e 75%, #0c0c0c 100%)',
    'bg_fire': 'linear-gradient(135deg, #1a0a0a 0%, #2d1a0a 25%, #4a2a0a 50%, #2d1a0a 75%, #1a0a0a 100%)',
    'bg_city': 'linear-gradient(180deg, #0a0a0a 0%, #0f0f1a 33%, #1a1a2e 66%, #0f0f1a 100%)',
    'bg_space': 'linear-gradient(135deg, #000005 0%, #0a0a1a 33%, #000005 66%, #0a0a1a 100%)',
    // Novos backgrounds animados
    'bg_cyberpunk': 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)',
    'bg_lava': 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)',
    'bg_ice': 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)',
    'bg_emerald': 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)',
    'bg_royal': 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)',
    'bg_carbon': 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)',
};

// Class-based backgrounds (require CSS class instead of inline gradient)
const CLASS_BASED_BACKGROUNDS = [
    'bg_oceano',
    'bg_chuva_neon', 
    'bg_retrowave',
    'bg_emerald',
    'bg_ice',
    'bg_fire',
];

// Import backgrounds CSS
import '../components/backgrounds/backgrounds.css';

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
    // Pastel colors
    'color_pastel_pink': '#ffb6c1',
    'color_pastel_lavender': '#e6e6fa',
    'color_pastel_mint': '#98fb98',
    'color_pastel_peach': '#ffdab9',
    'color_pastel_sky': '#87ceeb',
    'color_pastel_coral': '#ffb5a7',
    'color_pastel_lilac': '#dda0dd',
    'color_pastel_sage': '#9dc183',
    'color_pastel_butter': '#fffacd',
    'color_pastel_periwinkle': '#ccccff',
    // Gradient colors (use primary color for text fallback)
    'color_gradient_sunset': '#ff6b35',
    'color_gradient_ocean': '#0077b6',
    'color_gradient_aurora': '#7b4397',
    'color_gradient_fire': '#ff0000',
    'color_gradient_galaxy': '#7303c0',
    'color_gradient_neon': '#ff00ff',
    'color_gradient_forest': '#134e5e',
    'color_gradient_gold': '#d4af37',
    'color_gradient_midnight': '#302b63',
    'color_gradient_candy': '#ff9a9e',
};

// Gradient definitions for background usage
const ACCENT_GRADIENTS: Record<string, string> = {
    'color_gradient_sunset': 'linear-gradient(135deg, #ff6b35, #f72585)',
    'color_gradient_ocean': 'linear-gradient(135deg, #0077b6, #00f5d4)',
    'color_gradient_aurora': 'linear-gradient(135deg, #7b4397, #00d9ff)',
    'color_gradient_fire': 'linear-gradient(135deg, #ff0000, #ffc300)',
    'color_gradient_galaxy': 'linear-gradient(135deg, #1a0033, #7303c0, #ec38bc)',
    'color_gradient_neon': 'linear-gradient(135deg, #ff00ff, #00ffff)',
    'color_gradient_forest': 'linear-gradient(135deg, #134e5e, #71b280)',
    'color_gradient_gold': 'linear-gradient(135deg, #8b7335, #d4af37, #f4e4a6)',
    'color_gradient_midnight': 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    'color_gradient_candy': 'linear-gradient(135deg, #ff9a9e, #fecfef, #a18cd1)',
};

// Gradient colors as arrays for animated GradientText component
const ACCENT_GRADIENT_COLORS: Record<string, string[]> = {
    'color_gradient_sunset': ['#ff6b35', '#f72585', '#ff6b35'],
    'color_gradient_ocean': ['#0077b6', '#00f5d4', '#0077b6'],
    'color_gradient_aurora': ['#7b4397', '#00d9ff', '#7b4397'],
    'color_gradient_fire': ['#ff0000', '#ffc300', '#ff0000'],
    'color_gradient_galaxy': ['#1a0033', '#7303c0', '#ec38bc', '#1a0033'],
    'color_gradient_neon': ['#ff00ff', '#00ffff', '#ff00ff'],
    'color_gradient_forest': ['#134e5e', '#71b280', '#134e5e'],
    'color_gradient_gold': ['#8b7335', '#d4af37', '#f4e4a6', '#d4af37', '#8b7335'],
    'color_gradient_midnight': ['#0f0c29', '#302b63', '#24243e', '#302b63', '#0f0c29'],
    'color_gradient_candy': ['#ff9a9e', '#fecfef', '#a18cd1', '#fecfef', '#ff9a9e'],
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
    const [toast] = useState<string | null>(null); // Legacy - kept for compatibility
    const [toastData, setToastData] = useState<ToastData | null>(null);
    const [dailyLoginStatus, setDailyLoginStatus] = useState<DailyLoginStatus | null>(null);
    const [isDailyLoginModalOpen, setIsDailyLoginModalOpen] = useState(false);
    const [isZionsModalOpen, setIsZionsModalOpen] = useState(false);
    const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [edgeNotifications, setEdgeNotifications] = useState<EdgeNotificationData[]>([]);
    const [previewTheme, setPreviewTheme] = useState<{ background: string; color: string; packName: string; packId: string; price: number; badgeUrl?: string } | null>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (!token) return 'dark'; // Force dark if not logged in

            const saved = localStorage.getItem('theme');
            return (saved === 'light' || saved === 'dark') ? saved : 'dark';
        }
        return 'dark';
    });

    // Compute accent color from user's equipped customization (or preview)
    const accentColor = React.useMemo(() => {
        // If preview is active, use preview color
        if (previewTheme?.color) {
            return previewTheme.color;
        }
        if (user?.equippedColor) {
            // Check if it's a direct HEX value (from theme packs)
            if (user.equippedColor.startsWith('#')) {
                return user.equippedColor;
            }
            // Check if it's a color ID from the shop
            if (ACCENT_COLORS[user.equippedColor]) {
                const colorValue = ACCENT_COLORS[user.equippedColor];
                // If RGB dynamic, return default color for CSS variables (animation handled separately)
                if (colorValue === 'rgb-dynamic') {
                    return '#ff0000'; // Red as default for RGB cycle
                }
                return colorValue;
            }
        }
        // Default colors based on membership
        return user?.membershipType === 'MGT' ? '#50c878' : '#d4af37';
    }, [user?.equippedColor, user?.membershipType, previewTheme?.color]);

    // Compute accent gradient (for background usage)
    const accentGradient = React.useMemo(() => {
        if (user?.equippedColor && ACCENT_GRADIENTS[user.equippedColor]) {
            return ACCENT_GRADIENTS[user.equippedColor];
        }
        return null; // No gradient, use solid color
    }, [user?.equippedColor]);

    // Compute accent gradient colors array (for animated GradientText)
    const accentGradientColors = React.useMemo(() => {
        if (user?.equippedColor && ACCENT_GRADIENT_COLORS[user.equippedColor]) {
            return ACCENT_GRADIENT_COLORS[user.equippedColor];
        }
        return null; // No gradient colors, use solid color
    }, [user?.equippedColor]);

    // Compute background style from user's equipped customization (or preview)
    const backgroundStyle = React.useMemo(() => {
        // If preview is active, use preview background
        if (previewTheme?.background) {
            // Check if it's an animated class-based background (starts with anim-)
            if (previewTheme.background.startsWith('anim-')) {
                return `class:${previewTheme.background}`;
            }
            // Check if it's one of the new class-based backgrounds
            if (CLASS_BASED_BACKGROUNDS.includes(previewTheme.background)) {
                return `class:${previewTheme.background}`;
            }
            // Otherwise it's a gradient CSS value, return as-is
            return previewTheme.background;
        }
        // Check if it's an animated background (class-based)
        if (user?.equippedBackground?.startsWith('anim-')) {
            return `class:${user.equippedBackground}`; // Special marker for class-based
        }
        // Check if it's one of the new class-based backgrounds
        if (user?.equippedBackground && CLASS_BASED_BACKGROUNDS.includes(user.equippedBackground)) {
            return `class:${user.equippedBackground}`;
        }
        // Traditional gradient backgrounds
        if (user?.equippedBackground && BACKGROUND_STYLES[user.equippedBackground]) {
            return BACKGROUND_STYLES[user.equippedBackground];
        }
        return null; // Use default background
    }, [user?.equippedBackground, previewTheme?.background]);

    // Helper function to immediately apply accent color styles (used on login AND page load)
    const applyAccentStyles = (userData: User) => {
        const root = document.documentElement;

        // Determine accent color
        let colorValue = userData.membershipType === 'MGT' ? '#50c878' : '#d4af37'; // defaults
        if (userData.equippedColor) {
            // Check if it's a direct HEX value (from theme packs)
            if (userData.equippedColor.startsWith('#')) {
                colorValue = userData.equippedColor;
            } else if (ACCENT_COLORS[userData.equippedColor]) {
                // It's a color ID from the shop
                const mapped = ACCENT_COLORS[userData.equippedColor];
                if (mapped !== 'rgb-dynamic') {
                    colorValue = mapped;
                }
            }
        }

        const mixHex = (hexA: string, hexB: string, weightA: number) => {
            const normalize = (hex: string) => hex.replace('#', '');
            const a = normalize(hexA);
            const b = normalize(hexB);
            const aRgb = { r: parseInt(a.slice(0, 2), 16), g: parseInt(a.slice(2, 4), 16), b: parseInt(a.slice(4, 6), 16) };
            const bRgb = { r: parseInt(b.slice(0, 2), 16), g: parseInt(b.slice(2, 4), 16), b: parseInt(b.slice(4, 6), 16) };
            const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
            const r = clamp(aRgb.r * weightA + bRgb.r * (1 - weightA));
            const g = clamp(aRgb.g * weightA + bRgb.g * (1 - weightA));
            const bCh = clamp(aRgb.b * weightA + bRgb.b * (1 - weightA));
            const toHex2 = (n: number) => n.toString(16).padStart(2, '0');
            return `#${toHex2(r)}${toHex2(g)}${toHex2(bCh)}`;
        };

        // Apply CSS variables immediately
        root.style.setProperty('--accent-color', colorValue);
        root.style.setProperty('--accent-color-rgb', hexToRgb(colorValue));
        root.style.setProperty('--accent-50', mixHex(colorValue, '#ffffff', 0.10));
        root.style.setProperty('--accent-100', mixHex(colorValue, '#ffffff', 0.20));
        root.style.setProperty('--accent-200', mixHex(colorValue, '#ffffff', 0.40));
        root.style.setProperty('--accent-300', mixHex(colorValue, '#ffffff', 0.60));
        root.style.setProperty('--accent-400', colorValue);
        root.style.setProperty('--accent-500', colorValue);
        root.style.setProperty('--accent-600', mixHex(colorValue, '#000000', 0.80));
        root.style.setProperty('--accent-700', mixHex(colorValue, '#000000', 0.60));

        // Apply classes
        if (userData.equippedColor) {
            root.classList.add('custom-accent');
            if (userData.equippedColor === 'color_rgb') {
                root.classList.add('rgb-dynamic');
            } else {
                root.classList.remove('rgb-dynamic');
            }
        }


        // Helper function to clean up rainbow elements
        const cleanupRainbowElements = () => {
            const existingRainbow = document.getElementById('rainbow-skies-container');
            if (existingRainbow) {
                existingRainbow.remove();
            }
        };

        // Helper function to create rainbow elements
        const createRainbowElements = () => {
            cleanupRainbowElements();
            
            const container = document.createElement('div');
            container.id = 'rainbow-skies-container';
            
            // Create rainbow rays container
            const raysContainer = document.createElement('div');
            raysContainer.className = 'rainbow-rays';
            
            // Create 25 rainbow rays
            for (let i = 0; i < 25; i++) {
                const ray = document.createElement('div');
                ray.className = 'rainbow-ray';
                raysContainer.appendChild(ray);
            }
            
            // Create horizontal glow
            const hGlow = document.createElement('div');
            hGlow.className = 'rainbow-h';
            
            // Create vertical glow
            const vGlow = document.createElement('div');
            vGlow.className = 'rainbow-v';
            
            container.appendChild(raysContainer);
            container.appendChild(hGlow);
            container.appendChild(vGlow);
            
            document.body.appendChild(container);
        };

        // Apply background immediately OR clear if none equipped
        if (userData.equippedBackground) {
            // Check if it's an animated background (class-based)
            if (userData.equippedBackground.startsWith('anim-')) {
                // Remove any previous animation classes
                const existingAnimClasses = Array.from(document.body.classList).filter(cls => cls.startsWith('anim-'));
                existingAnimClasses.forEach(cls => document.body.classList.remove(cls));

                // Add the new animation class
                document.body.classList.add(userData.equippedBackground);

                // Special handling for Rainbow Skies - create HTML elements and switch to light theme
                if (userData.equippedBackground === 'anim-rainbow-skies') {
                    createRainbowElements();
                    
                    // Save current theme for MGT before switching to light
                    if (userData.membershipType === 'MGT') {
                        const currentTheme = localStorage.getItem('theme') || 'dark';
                        localStorage.setItem('mgt-theme-before-rainbow', currentTheme);
                    }
                    
                    // Rainbow Skies activates light mode for everyone
                    localStorage.setItem('theme', 'light');
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                } else {
                    cleanupRainbowElements();
                }

                // Clear inline styles that might conflict
                document.body.style.background = '';
                document.body.style.backgroundSize = '';
                document.body.style.backgroundAttachment = '';
                document.body.style.animation = '';
            } else if (BACKGROUND_STYLES[userData.equippedBackground]) {
                // Traditional gradient background (inline style)
                // Remove any animation classes
                const existingAnimClasses = Array.from(document.body.classList).filter(cls => cls.startsWith('anim-'));
                existingAnimClasses.forEach(cls => document.body.classList.remove(cls));

                document.body.style.background = BACKGROUND_STYLES[userData.equippedBackground];
                document.body.style.backgroundSize = '200% 200%';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.style.animation = 'wave-bg 8s ease-in-out infinite';
            }
        } else {
            // Clear any previously applied background (both classes and styles)
            const existingAnimClasses = Array.from(document.body.classList).filter(cls => cls.startsWith('anim-'));
            existingAnimClasses.forEach(cls => document.body.classList.remove(cls));

            // Clean up rainbow elements if any
            const existingRainbow = document.getElementById('rainbow-skies-container');
            if (existingRainbow) {
                existingRainbow.remove();
            }

            document.body.style.background = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.animation = '';
        }
    };

    // Apply accent color as CSS variable
    useEffect(() => {
        const root = document.documentElement;

        // Only apply custom colors if user is authenticated (not null, not visitor)
        const isAuthenticated = user && user.role !== 'VISITOR';

        if (!isAuthenticated) {
            // Reset to default colors when not authenticated
            root.classList.remove('custom-accent');
            root.classList.remove('rgb-dynamic');

            // Don't set any CSS variables - let the page use its own colors
            root.style.removeProperty('--accent-color');
            root.style.removeProperty('--accent-color-rgb');
            root.style.removeProperty('--accent-50');
            root.style.removeProperty('--accent-100');
            root.style.removeProperty('--accent-200');
            root.style.removeProperty('--accent-300');
            root.style.removeProperty('--accent-400');
            root.style.removeProperty('--accent-500');
            root.style.removeProperty('--accent-600');
            root.style.removeProperty('--accent-700');
            return;
        }

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

        // Set gradient variable (for background usage)
        if (accentGradient) {
            root.style.setProperty('--accent-gradient', accentGradient);
            root.classList.add('has-gradient-accent');
        } else {
            root.style.setProperty('--accent-gradient', accentColor);
            root.classList.remove('has-gradient-accent');
        }

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
    }, [accentColor, accentGradient, user?.equippedColor, user]);

    // Apply custom background
    useEffect(() => {
        // Only apply custom background if user is authenticated (not null, not visitor)
        const isAuthenticated = user && user.role !== 'VISITOR';

        // First, remove any existing animation classes from body
        const existingAnimClasses = Array.from(document.body.classList).filter(cls => cls.startsWith('anim-') || cls.startsWith('bg_'));
        existingAnimClasses.forEach(cls => document.body.classList.remove(cls));

        // Helper function to clean up rainbow elements
        const cleanupRainbowElements = () => {
            const existingRainbow = document.getElementById('rainbow-skies-container');
            if (existingRainbow) {
                existingRainbow.remove();
            }
        };

        // Helper function to create rainbow elements
        const createRainbowElements = () => {
            cleanupRainbowElements();
            
            const container = document.createElement('div');
            container.id = 'rainbow-skies-container';
            
            // Create rainbow rays container
            const raysContainer = document.createElement('div');
            raysContainer.className = 'rainbow-rays';
            
            // Create 25 rainbow rays
            for (let i = 0; i < 25; i++) {
                const ray = document.createElement('div');
                ray.className = 'rainbow-ray';
                raysContainer.appendChild(ray);
            }
            
            // Create horizontal glow
            const hGlow = document.createElement('div');
            hGlow.className = 'rainbow-h';
            
            // Create vertical glow
            const vGlow = document.createElement('div');
            vGlow.className = 'rainbow-v';
            
            container.appendChild(raysContainer);
            container.appendChild(hGlow);
            container.appendChild(vGlow);
            
            document.body.appendChild(container);
        };
        
        // Helper function to clean up infinite triangles elements
        const cleanupInfiniteTrianglesElements = () => {
            const existingContainer = document.getElementById('infinite-triangles-container');
            if (existingContainer) {
                existingContainer.remove();
            }
        };

        // Cleanup functions for new backgrounds
        const cleanupOrientalMatrixElements = () => {
            const existingContainer = document.getElementById('oriental-matrix-container');
            if (existingContainer) {
                existingContainer.remove();
            }
        };
        
        const cleanupConstellationElements = () => {
            const existingContainer = document.getElementById('constellation-container');
            if (existingContainer) {
                existingContainer.remove();
            }
        };
        
        const cleanupFireRainElements = () => {
            const existingContainer = document.getElementById('fire-rain-container');
            if (existingContainer) {
                existingContainer.remove();
            }
        };
        
        const cleanupNeonRainElements = () => {
            const existingContainer = document.getElementById('neon-rain-container');
            if (existingContainer) {
                existingContainer.remove();
            }
        };

        if (!isAuthenticated || !backgroundStyle) {
            // Reset to default when not authenticated or no custom background
            cleanupRainbowElements();
            cleanupInfiniteTrianglesElements();
            cleanupMoonlitElements();
            cleanupOrientalMatrixElements();
            cleanupConstellationElements();
            cleanupFireRainElements();
            cleanupNeonRainElements();
            document.body.style.background = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.animation = '';
            
            // Reset theme when background is unequipped
            // Magazine: always dark (can't use light mode)
            // MGT: restore previous theme from localStorage
            if (user?.membershipType === 'MGT') {
                const savedTheme = localStorage.getItem('mgt-theme-before-rainbow') || localStorage.getItem('theme') || 'dark';
                // Only restore if it was saved before applying rainbow
                if (localStorage.getItem('mgt-theme-before-rainbow')) {
                    setTheme(savedTheme as 'dark' | 'light');
                    localStorage.removeItem('mgt-theme-before-rainbow');
                }
            } else {
                // Magazine always goes back to dark
                setTheme('dark');
            }
        } else if (backgroundStyle.startsWith('class:')) {
            // Class-based animated background (from theme packs)
            const className = backgroundStyle.replace('class:', '');
            document.body.classList.add(className);
            
            // Special handling for Rainbow Skies
            if (className === 'anim-rainbow-skies') {
                createRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupMoonlitElements();
                cleanupOrientalMatrixElements();
                cleanupConstellationElements();
                cleanupFireRainElements();
                cleanupNeonRainElements();
                
                // Save current theme for MGT before switching to light
                if (user?.membershipType === 'MGT' && !localStorage.getItem('mgt-theme-before-rainbow')) {
                    localStorage.setItem('mgt-theme-before-rainbow', theme);
                }
                
                // Rainbow Skies activates light mode for everyone
                setTheme('light');
            } else if (className === 'anim-infinite-triangles') {
                cleanupRainbowElements();
                cleanupMoonlitElements();
                cleanupOrientalMatrixElements();
                cleanupConstellationElements();
                cleanupFireRainElements();
                cleanupNeonRainElements();
                createInfiniteTrianglesElements();
            } else if (className === 'anim-moonlit-sky') {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupOrientalMatrixElements();
                cleanupConstellationElements();
                cleanupFireRainElements();
                cleanupNeonRainElements();
                createMoonlitElements();
            } else if (className === 'bg_emerald') {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupMoonlitElements();
                cleanupConstellationElements();
                cleanupFireRainElements();
                cleanupNeonRainElements();
                createOrientalMatrixElements();
            } else if (className === 'bg_ice') {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupMoonlitElements();
                cleanupOrientalMatrixElements();
                cleanupFireRainElements();
                cleanupNeonRainElements();
                createConstellationElements();
            } else if (className === 'bg_fire') {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupMoonlitElements();
                cleanupOrientalMatrixElements();
                cleanupConstellationElements();
                cleanupNeonRainElements();
                createFireRainElements();
            } else if (className === 'bg_chuva_neon') {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupMoonlitElements();
                cleanupOrientalMatrixElements();
                cleanupConstellationElements();
                cleanupFireRainElements();
                createNeonRainElements();
            } else {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupMoonlitElements();
                cleanupOrientalMatrixElements();
                cleanupConstellationElements();
                cleanupFireRainElements();
                cleanupNeonRainElements();
            }
            
            // Clear inline styles
            document.body.style.background = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.animation = '';
        } else {
            // Traditional gradient (inline style)
            cleanupRainbowElements();
            cleanupInfiniteTrianglesElements();
            cleanupMoonlitElements();
            cleanupOrientalMatrixElements();
            cleanupConstellationElements();
            cleanupFireRainElements();
            cleanupNeonRainElements();
            document.body.style.background = backgroundStyle;
            document.body.style.backgroundSize = '200% 200%';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.animation = 'wave-bg 8s ease-in-out infinite';
        }
        
        // Helper function to create infinite triangles elements
        function createInfiniteTrianglesElements() {
            // Clean up any existing elements first
            const existingContainer = document.getElementById('infinite-triangles-container');
            if (existingContainer) {
                existingContainer.remove();
            }
            
            const container = document.createElement('div');
            container.id = 'infinite-triangles-container';
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'triangles-overlay';
            container.appendChild(overlay);
            
            // Create triangles container
            const trianglesContainer = document.createElement('div');
            trianglesContainer.className = 'triangles-container';
            
            // Create 240 shape elements (20 cols * 12 rows) to cover all screen sizes
            for (let i = 0; i < 240; i++) {
                const shape = document.createElement('div');
                shape.className = 'triangle-shape';
                
                // Create SVG with animated polygons
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 100 115');
                svg.setAttribute('preserveAspectRatio', 'xMidYMin slice');
                
                // Create 4 animated polygons with different delays
                const classes = ['tri-accent', 'tri-secondary', 'tri-tertiary', 'tri-quaternary'];
                classes.forEach((cls, index) => {
                    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    polygon.classList.add(cls);
                    polygon.setAttribute('points', '50 57.5, 50 57.5, 50 57.5');
                    
                    // Create animation
                    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                    animate.setAttribute('attributeName', 'points');
                    animate.setAttribute('repeatCount', 'indefinite');
                    animate.setAttribute('dur', '4s');
                    animate.setAttribute('begin', `${index}s`);
                    animate.setAttribute('from', '50 57.5, 50 57.5, 50 57.5');
                    animate.setAttribute('to', '50 -75, 175 126, -75 126');
                    
                    polygon.appendChild(animate);
                    svg.appendChild(polygon);
                });
                
                shape.appendChild(svg);
                trianglesContainer.appendChild(shape);
            }
            
            container.appendChild(trianglesContainer);
            document.body.appendChild(container);
        }
        
        // Cleanup function for Moonlit Sky elements
        function cleanupMoonlitElements() {
            const existingContainer = document.getElementById('moonlit-sky-container');
            if (existingContainer) {
                existingContainer.remove();
            }
        }
        
        // Helper function to create Moonlit Sky elements
        function createMoonlitElements() {
            // Clean up any existing elements first
            cleanupMoonlitElements();
            
            const container = document.createElement('div');
            container.id = 'moonlit-sky-container';
            container.className = 'moonlit-container';
            
            // Create moon image
            const moon = document.createElement('img');
            moon.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png';
            moon.alt = 'Moon';
            moon.className = 'moonlit-moon';
            container.appendChild(moon);
            
            // Create stars layer
            const stars = document.createElement('div');
            stars.className = 'moonlit-stars';
            container.appendChild(stars);
            
            // Create twinkling layer
            const twinkling = document.createElement('div');
            twinkling.className = 'moonlit-twinkling';
            container.appendChild(twinkling);
            
            // Create clouds layer
            const clouds = document.createElement('div');
            clouds.className = 'moonlit-clouds';
            container.appendChild(clouds);
            
            // Create blur overlay for content readability
            const blurOverlay = document.createElement('div');
            blurOverlay.className = 'moonlit-blur-overlay';
            container.appendChild(blurOverlay);
            
            document.body.appendChild(container);
        }
        
        // Helper function to create Oriental Matrix elements
        function createOrientalMatrixElements() {
            cleanupOrientalMatrixElements();
            
            const container = document.createElement('div');
            container.id = 'oriental-matrix-container';
            container.className = 'jp-matrix';
            
            // Japanese katakana characters
            const chars = [
                'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ',
                'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト',
                'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
                'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ',
                'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン', 'ガ', 'ギ', 'グ', 'ゲ',
                'ゴ', 'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ',
                'ド', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ'
            ];
            
            // Create 600 character spans for full screen coverage
            for (let i = 0; i < 600; i++) {
                const span = document.createElement('span');
                span.textContent = chars[i % chars.length];
                container.appendChild(span);
            }
            
            document.body.appendChild(container);
        }
        
        // Helper function to create Constellation elements
        function createConstellationElements() {
            cleanupConstellationElements();
            
            const container = document.createElement('div');
            container.id = 'constellation-container';
            container.className = 'constellation-container';
            
            // Create 3 star layers
            const stars1 = document.createElement('div');
            stars1.id = 'stars';
            container.appendChild(stars1);
            
            const stars2 = document.createElement('div');
            stars2.id = 'stars2';
            container.appendChild(stars2);
            
            const stars3 = document.createElement('div');
            stars3.id = 'stars3';
            container.appendChild(stars3);
            
            document.body.appendChild(container);
        }
        
        // Helper function to create Fire Rain elements
        function createFireRainElements() {
            cleanupFireRainElements();
            
            const container = document.createElement('div');
            container.id = 'fire-rain-container';
            container.className = 'fire-rain-container';
            
            const effect = document.createElement('div');
            effect.className = 'fire-rain-effect';
            container.appendChild(effect);
            
            document.body.appendChild(container);
        }
        
        // Helper function to create Neon Rain elements
        function createNeonRainElements() {
            cleanupNeonRainElements();
            
            const container = document.createElement('div');
            container.id = 'neon-rain-container';
            container.className = 'neon-rain-container';
            
            const effect = document.createElement('div');
            effect.className = 'neon-rain-effect';
            container.appendChild(effect);
            
            document.body.appendChild(container);
        }
    }, [backgroundStyle, user]);

    useEffect(() => {
        // Apply theme class to html element
        const root = window.document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const loadUser = async () => {
            // Check localStorage first (remember me), then sessionStorage (session only)
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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

                    // Apply styles IMMEDIATELY before setting user state (same as login)
                    applyAccentStyles(userData);

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
                        // Set fallback status without claimed flag to avoid issues
                        setDailyLoginStatus({
                            claimed: false,
                            streak: 0,
                            nextReward: 50,
                            rewards: []
                        });
                    }
                } catch (error) {
                    console.error('Failed to load user', error);
                    // Clear both storages on error
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
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

    // Edge Notification functions (Samsung Edge / Apple Vision Pro style)
    const showEdgeNotification = useCallback((
        type: EdgeNotificationType,
        title: string,
        message: string,
        options?: { avatar?: string; action?: { label: string; onClick: () => void }; duration?: number }
    ) => {
        const id = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification: EdgeNotificationData = {
            id,
            type,
            title,
            message,
            avatar: options?.avatar,
            action: options?.action,
            duration: options?.duration || 5000
        };
        setEdgeNotifications(prev => [...prev, notification]);
    }, []);

    const closeEdgeNotification = useCallback((id: string) => {
        setEdgeNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Friend request notifications polling
    useEffect(() => {
        if (!user) return;

        let lastKnownRequestIds: Set<string> = new Set();
        let isFirstCheck = true;

        const checkFriendRequests = async () => {
            try {
                const { data } = await api.get('/social/requests');
                const currentIds = new Set<string>(data.map((r: { id: string }) => r.id));

                // Skip notification on first check (page load)
                if (isFirstCheck) {
                    lastKnownRequestIds = currentIds;
                    isFirstCheck = false;
                    return;
                }

                // Find new requests (ids that weren't in last check)
                data.forEach((request: { id: string; requester: { displayName?: string; name: string; avatarUrl?: string } }) => {
                    if (!lastKnownRequestIds.has(request.id)) {
                        const senderName = request.requester.displayName || request.requester.name;
                        showEdgeNotification(
                            'friend',
                            'Solicitação de amizade',
                            `${senderName} quer ser seu amigo!`,
                            {
                                avatar: request.requester.avatarUrl,
                                action: {
                                    label: 'Ver',
                                    onClick: () => {
                                        window.location.href = '/social?tab=requests';
                                    }
                                },
                                duration: 8000
                            }
                        );
                    }
                });

                lastKnownRequestIds = currentIds;
            } catch (error) {
                console.debug('Friend request check failed:', error);
            }
        };

        // Initial check after 3 seconds
        const initialTimeout = setTimeout(checkFriendRequests, 3000);
        // Poll every 30 seconds
        const interval = setInterval(checkFriendRequests, 30000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [user, showEdgeNotification]);

    // Achievement popup - NOW USES EDGE NOTIFICATION
    const showAchievement = useCallback((title: string, description: string) => {
        showEdgeNotification('achievement', title, description, { duration: 6000 });
    }, [showEdgeNotification]);

    const clearAchievement = () => {
        setAchievement(null);
    };

    // Legacy toast - NOW USES EDGE NOTIFICATION  
    const showToast = useCallback((message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
        const notifType = type || 'info';
        showEdgeNotification(notifType, message, '');
    }, [showEdgeNotification]);

    // Typed toast functions - NOW USE EDGE NOTIFICATIONS
    const showSuccess = useCallback((message: string, description?: string) => {
        showEdgeNotification('success', message, description || '');
    }, [showEdgeNotification]);

    const showError = useCallback((message: string, description?: string) => {
        showEdgeNotification('error', message, description || '');
    }, [showEdgeNotification]);

    const showWarning = useCallback((message: string, description?: string) => {
        showEdgeNotification('warning', message, description || '');
    }, [showEdgeNotification]);

    const showInfo = useCallback((message: string, description?: string) => {
        showEdgeNotification('info', message, description || '');
    }, [showEdgeNotification]);

    const clearToast = () => {
        setToastData(null);
    };

    const login = (token: string, userData: User, membershipContext?: 'MAGAZINE' | 'MGT') => {
        // Limpar flags de onboarding para mostrar WelcomeTour ao fazer novo login
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('welcome_shown_')) {
                sessionStorage.removeItem(key);
            }
        });
        
        // Check rememberMe preference - if true, use localStorage (persists), else sessionStorage (clears on close)
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        // Clear both first to avoid conflicts
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        if (rememberMe) {
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('token', token);
        }

        if (membershipContext) {
            localStorage.setItem('sessionMembershipType', membershipContext);
            userData.membershipType = membershipContext;
        }

        // Apply styles IMMEDIATELY before setting user state
        applyAccentStyles(userData);

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
        // DEPRECATED - mantido para compatibilidade, atualiza zionsPoints
        if (user) {
            setUser({
                ...user,
                zions: (user.zions || 0) + amount,
                zionsPoints: (user.zionsPoints || 0) + amount
            });
        }
    };

    const updateUserPoints = (amount: number) => {
        if (user) {
            setUser({
                ...user,
                zionsPoints: (user.zionsPoints || 0) + amount
            });
        }
    };

    const updateUserCash = (amount: number) => {
        if (user) {
            setUser({
                ...user,
                zionsCash: (user.zionsCash || 0) + amount
            });
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
            zionsPoints: 0,
            zionsCash: 0,
            level: 0,
            xp: 0,
            membershipType: membershipType,
            displayName: 'Visitante',
            bio: 'Explorando o Clube Magazine'
        });
        setTheme('dark');
        // Don't show any modals for visitors
        setDailyLoginStatus(null);
    };

    const logout = () => {
        // Only save membership type if NOT a visitor
        if (user?.membershipType && user.role !== 'VISITOR') {
            localStorage.setItem('lastMembershipType', user.membershipType);
        } else {
            // If visitor, clear it or set to default to avoid "mixed" screen
            localStorage.removeItem('lastMembershipType');
        }

        // Clear token from both storages
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('sessionMembershipType');
        
        // Clear user state FIRST to prevent any API calls
        setUser(null);

        // Force Dark Mode immediately and persist it
        setTheme('dark');
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        
        // Unsubscribe from push notifications (async, don't block logout)
        import('../services/pushNotificationService').then(module => {
            module.default.unsubscribe().catch(() => {
                console.log('[Logout] Could not unsubscribe from push');
            });
        }).catch(() => {});

        window.location.href = '/login';
    };

    const handleClaimDailyLogin = async () => {
        try {
            const response = await api.post('/gamification/daily-login');
            if (response.data.awarded > 0) {
                // Update user zions (Points para daily login)
                if (user) {
                    setUser({
                        ...user,
                        zions: (user.zions || 0) + response.data.awarded,
                        zionsPoints: (user.zionsPoints || 0) + response.data.awarded
                    });
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
            updateUserPoints,
            updateUserCash,
            loginAsVisitor,
            logout,
            isAuthenticated: !!user,
            loading,
            isVisitor: user?.role === 'VISITOR',
            showAchievement,
            clearAchievement,
            achievement,
            showToast,
            toast,
            toastData,
            showSuccess,
            showError,
            showWarning,
            showInfo,
            clearToast,
            dailyLoginStatus,
            openDailyLoginModal: () => setIsDailyLoginModalOpen(true),
            isZionsModalOpen,
            openZionsModal: () => setIsZionsModalOpen(true),
            closeZionsModal: () => setIsZionsModalOpen(false),
            theme,
            toggleTheme,
            // Customization values
            accentColor,
            accentGradient,
            accentGradientColors,
            backgroundStyle,
            equippedBadge: user?.equippedBadge || null,
            // Theme Preview Mode
            previewTheme,
            setPreviewTheme,
            // Active Chat
            activeChatUserId,
            setActiveChatUserId,
            // Mobile Drawer State
            isMobileDrawerOpen,
            setIsMobileDrawerOpen,
            // Edge Notifications (Mobile-style)
            edgeNotifications,
            showEdgeNotification,
            closeEdgeNotification,
        }}>
            {children}
            <DailyLoginModal
                isOpen={isDailyLoginModalOpen}
                onClose={() => setIsDailyLoginModalOpen(false)}
                status={dailyLoginStatus}
                onClaim={handleClaimDailyLogin}
            />
            {/* Theme Preview Bar */}
            {previewTheme && (
                <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
                    <div className="max-w-lg mx-auto">
                        <div className="text-center mb-3">
                            <span 
                                className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-2"
                                style={{ backgroundColor: previewTheme.color }}
                            >
                                PRÉVIA
                            </span>
                            <h3 className="text-white font-bold text-lg">{previewTheme.packName}</h3>
                            {previewTheme.price > 0 ? (
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <img 
                                        src="/assets/zions/zion-50.png" 
                                        alt="Zions" 
                                        className="w-4 h-4"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    <span className="text-white font-semibold">{previewTheme.price.toLocaleString('pt-BR')}</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="text-amber-400 font-semibold text-sm">Exclusivo Supply Box</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPreviewTheme(null)}
                                className={`${previewTheme.price > 0 ? 'flex-1' : 'w-full'} py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 transition-all`}
                            >
                                ← Cancelar
                            </button>
                            {previewTheme.price > 0 && (
                                <button
                                    onClick={() => {
                                        // Dispatch custom event to trigger purchase
                                        window.dispatchEvent(new CustomEvent('purchasePreviewPack', { detail: previewTheme.packId }));
                                    }}
                                    className="flex-1 py-3 rounded-xl font-semibold text-black transition-all"
                                    style={{ backgroundColor: previewTheme.color }}
                                >
                                    🛒 Comprar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {toast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
                    <div className="bg-black/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 font-medium">
                        {toast}
                    </div>
                </div>
            )}
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
