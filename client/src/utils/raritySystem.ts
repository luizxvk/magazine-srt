// Rarity system configuration for all customization items
// Used in SupplyBox, CustomizationShop, and item displays

export type RarityTier = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface RarityConfig {
    name: RarityTier;
    label: string;
    labelPtBr: string;
    color: string;
    bgColor: string;
    borderColor: string;
    gradient: string;
    glow: string;
    chance: number; // Percentage chance in SupplyBox
    icon: string;
}

export const RARITY_CONFIG: Record<RarityTier, RarityConfig> = {
    COMMON: {
        name: 'COMMON',
        label: 'Common',
        labelPtBr: 'Comum',
        color: '#9ca3af',
        bgColor: 'rgba(156, 163, 175, 0.1)',
        borderColor: 'rgba(156, 163, 175, 0.3)',
        gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)',
        glow: '0 0 20px rgba(156, 163, 175, 0.3)',
        chance: 60,
        icon: '●'
    },
    RARE: {
        name: 'RARE',
        label: 'Rare',
        labelPtBr: 'Raro',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
        glow: '0 0 25px rgba(59, 130, 246, 0.4)',
        chance: 25,
        icon: '◆'
    },
    EPIC: {
        name: 'EPIC',
        label: 'Epic',
        labelPtBr: 'Épico',
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: 'rgba(168, 85, 247, 0.3)',
        gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        glow: '0 0 30px rgba(168, 85, 247, 0.5)',
        chance: 12,
        icon: '★'
    },
    LEGENDARY: {
        name: 'LEGENDARY',
        label: 'Legendary',
        labelPtBr: 'Lendário',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        gradient: 'linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)',
        glow: '0 0 40px rgba(245, 158, 11, 0.6)',
        chance: 3,
        icon: '♦'
    }
};

// Item rarity mappings by ID
// Backgrounds
export const BACKGROUND_RARITY: Record<string, RarityTier> = {
    // Common backgrounds
    'bg_default': 'COMMON',
    'bg_carbon': 'COMMON',
    'bg_city': 'COMMON',
    'bg_matrix': 'COMMON',
    
    // Rare backgrounds
    'bg_sunset': 'RARE',
    'bg_ocean': 'RARE',
    'bg_forest': 'RARE',
    'bg_ice': 'RARE',
    'bg_oceano': 'RARE',
    
    // Epic backgrounds
    'bg_aurora': 'EPIC',
    'bg_galaxy': 'EPIC',
    'bg_cyberpunk': 'EPIC',
    'bg_neon_grid': 'EPIC',
    'bg_emerald': 'EPIC',
    'bg_royal': 'EPIC',
    'bg_retrowave': 'EPIC',
    
    // Legendary backgrounds (animated)
    'bg_fire': 'LEGENDARY',
    'bg_lava': 'LEGENDARY',
    'bg_space': 'LEGENDARY',
    'anim-cosmic-triangles': 'LEGENDARY',
    'anim-gradient-waves': 'LEGENDARY',
    'anim-rainbow-skies': 'LEGENDARY',
    'anim-infinite-triangles': 'LEGENDARY',
    'anim-moonlit-sky': 'LEGENDARY',
};

// Colors
export const COLOR_RARITY: Record<string, RarityTier> = {
    // Common colors
    'color_gold': 'COMMON',
    'color_blue': 'COMMON',
    'color_red': 'COMMON',
    
    // Rare colors
    'color_cyan': 'RARE',
    'color_magenta': 'RARE',
    'color_lime': 'RARE',
    'color_orange': 'RARE',
    'color_purple': 'RARE',
    'color_pink': 'RARE',
    
    // Epic colors (pastels)
    'color_pastel_pink': 'EPIC',
    'color_pastel_lavender': 'EPIC',
    'color_pastel_mint': 'EPIC',
    'color_pastel_peach': 'EPIC',
    'color_pastel_sky': 'EPIC',
    'color_pastel_coral': 'EPIC',
    'color_pastel_lilac': 'EPIC',
    'color_pastel_sage': 'EPIC',
    'color_pastel_butter': 'EPIC',
    'color_pastel_periwinkle': 'EPIC',
    
    // Legendary colors
    'color_rgb': 'LEGENDARY',
};

// Profile Borders
export const BORDER_RARITY: Record<string, RarityTier> = {
    // Common borders
    'border_gold': 'COMMON',
    'border_blue': 'COMMON',
    'border_green': 'COMMON',
    'border_red': 'COMMON',
    
    // Rare borders
    'border_emerald': 'RARE',
    'border_rose': 'RARE',
    'border_purple': 'RARE',
    'border_cyan': 'RARE',
    'border_orange': 'RARE',
    'border_midnight': 'RARE',
    'border_ocean': 'RARE',
    'border_forest': 'RARE',
    
    // Epic borders
    'border_cherry_blossom': 'EPIC',
    'border_autumn': 'EPIC',
    'border_cotton_candy': 'EPIC',
    'border_ice': 'EPIC',
    'border_sunset': 'EPIC',
    'border_fire': 'EPIC',
    'border_aurora': 'EPIC',
    'border_neon': 'EPIC',
    'border_lava': 'EPIC',
    'border_electric': 'EPIC',
    'border_mystic': 'EPIC',
    'border_pastel_pink': 'EPIC',
    'border_pastel_lavender': 'EPIC',
    'border_pastel_mint': 'EPIC',
    'border_pastel_peach': 'EPIC',
    'border_pastel_sky': 'EPIC',
    
    // Legendary borders
    'border_galaxy': 'LEGENDARY',
    'border_rainbow': 'LEGENDARY',
    'border_diamond': 'LEGENDARY',
    'border_platinum': 'LEGENDARY',
    'border_holographic': 'LEGENDARY',
    'border_cosmic': 'LEGENDARY',
    'border_phoenix': 'LEGENDARY',
};

// Badges
export const BADGE_RARITY: Record<string, RarityTier> = {
    // Common badges
    'badge_star': 'COMMON',
    'badge_heart': 'COMMON',
    
    // Rare badges
    'badge_fire': 'RARE',
    'badge_lightning': 'RARE',
    'badge_moon': 'RARE',
    'badge_sun': 'RARE',
    
    // Epic badges
    'badge_crown': 'EPIC',
    'badge_skull': 'EPIC',
    'badge_pony': 'EPIC',
    'badge_shark': 'EPIC',
    'badge_event_exclusive': 'EPIC',
    
    // Legendary badges
    'badge_diamond': 'LEGENDARY',
};

// Helper functions
export function getItemRarity(itemId: string, itemType: string): RarityTier {
    switch (itemType) {
        case 'background':
            return BACKGROUND_RARITY[itemId] || 'COMMON';
        case 'color':
            return COLOR_RARITY[itemId] || 'COMMON';
        case 'profileBorder':
            return BORDER_RARITY[itemId] || 'COMMON';
        case 'badge':
            return BADGE_RARITY[itemId] || 'COMMON';
        default:
            return 'COMMON';
    }
}

export function getRarityConfig(rarity: RarityTier): RarityConfig {
    return RARITY_CONFIG[rarity] || RARITY_CONFIG.COMMON;
}

export function getRarityLabel(rarity: RarityTier, locale: 'en' | 'pt' = 'pt'): string {
    const config = RARITY_CONFIG[rarity];
    return locale === 'pt' ? config.labelPtBr : config.label;
}

export function getRarityColor(rarity: RarityTier): string {
    return RARITY_CONFIG[rarity]?.color || '#9ca3af';
}

export function getRarityGradient(rarity: RarityTier): string {
    return RARITY_CONFIG[rarity]?.gradient || RARITY_CONFIG.COMMON.gradient;
}

// Sort items by rarity (legendary first)
export function sortByRarity<T extends { rarity?: RarityTier }>(items: T[]): T[] {
    const order: Record<RarityTier, number> = {
        LEGENDARY: 0,
        EPIC: 1,
        RARE: 2,
        COMMON: 3
    };
    return [...items].sort((a, b) => {
        const aOrder = order[a.rarity || 'COMMON'];
        const bOrder = order[b.rarity || 'COMMON'];
        return aOrder - bOrder;
    });
}
