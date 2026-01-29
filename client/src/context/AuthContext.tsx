import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import DailyLoginModal from '../components/DailyLoginModal';
import type { ToastType } from '../components/Toast';

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
    // Novos backgrounds animados
    'bg_cyberpunk': 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 25%, #2a0a3a 50%, #1a0a2a 75%, #0a0a1a 100%)',
    'bg_lava': 'linear-gradient(135deg, #2a0a00 0%, #4a1500 25%, #6a2000 50%, #4a1500 75%, #2a0a00 100%)',
    'bg_ice': 'linear-gradient(135deg, #0a1a2a 0%, #0f2535 25%, #143040 50%, #0f2535 75%, #0a1a2a 100%)',
    'bg_neon_grid': 'linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 25%, #2a0d2a 50%, #1a0d1a 75%, #0d0d0d 100%)',
    'bg_emerald': 'linear-gradient(135deg, #0a1a0f 0%, #0f2a1a 25%, #143a25 50%, #0f2a1a 75%, #0a1a0f 100%)',
    'bg_royal': 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2a 25%, #25143a 50%, #1a0f2a 75%, #0f0a1a 100%)',
    'bg_carbon': 'linear-gradient(135deg, #0a0a0a 0%, #151515 25%, #202020 50%, #151515 75%, #0a0a0a 100%)',
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
    const [toast, setToast] = useState<string | null>(null);
    const [toastData, setToastData] = useState<ToastData | null>(null);
    const [dailyLoginStatus, setDailyLoginStatus] = useState<DailyLoginStatus | null>(null);
    const [isDailyLoginModalOpen, setIsDailyLoginModalOpen] = useState(false);
    const [isZionsModalOpen, setIsZionsModalOpen] = useState(false);
    const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
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

    // Compute background style from user's equipped customization (or preview)
    const backgroundStyle = React.useMemo(() => {
        // If preview is active, use preview background
        if (previewTheme?.background) {
            // Check if it's an animated class-based background (starts with anim-)
            if (previewTheme.background.startsWith('anim-')) {
                return `class:${previewTheme.background}`;
            }
            // Otherwise it's a gradient CSS value, return as-is
            return previewTheme.background;
        }
        // Check if it's an animated background (class-based)
        if (user?.equippedBackground?.startsWith('anim-')) {
            return `class:${user.equippedBackground}`; // Special marker for class-based
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
    }, [accentColor, user?.equippedColor, user]);

    // Apply custom background
    useEffect(() => {
        // Only apply custom background if user is authenticated (not null, not visitor)
        const isAuthenticated = user && user.role !== 'VISITOR';

        // First, remove any existing animation classes from body
        const existingAnimClasses = Array.from(document.body.classList).filter(cls => cls.startsWith('anim-'));
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

        if (!isAuthenticated || !backgroundStyle) {
            // Reset to default when not authenticated or no custom background
            cleanupRainbowElements();
            cleanupInfiniteTrianglesElements();
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
                
                // Save current theme for MGT before switching to light
                if (user?.membershipType === 'MGT' && !localStorage.getItem('mgt-theme-before-rainbow')) {
                    localStorage.setItem('mgt-theme-before-rainbow', theme);
                }
                
                // Rainbow Skies activates light mode for everyone
                setTheme('light');
            } else if (className === 'anim-infinite-triangles') {
                cleanupRainbowElements();
                cleanupMoonlitElements();
                createInfiniteTrianglesElements();
            } else if (className === 'anim-moonlit-sky') {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                createMoonlitElements();
            } else {
                cleanupRainbowElements();
                cleanupInfiniteTrianglesElements();
                cleanupMoonlitElements();
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

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    };

    // Typed toast functions
    const showSuccess = (message: string, description?: string) => {
        setToastData({ message, description, type: 'success' });
    };

    const showError = (message: string, description?: string) => {
        setToastData({ message, description, type: 'error' });
    };

    const showWarning = (message: string, description?: string) => {
        setToastData({ message, description, type: 'warning' });
    };

    const showInfo = (message: string, description?: string) => {
        setToastData({ message, description, type: 'info' });
    };

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
        
        localStorage.setItem('token', token);

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

        localStorage.removeItem('token');
        localStorage.removeItem('sessionMembershipType');
        setUser(null);

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
