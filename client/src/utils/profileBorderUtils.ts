// Profile border gradients mapping
export const PROFILE_BORDERS: Record<string, string> = {
    // Default borders
    'border_gold': 'linear-gradient(135deg, #d4af37 0%, #f4e4a6 50%, #d4af37 100%)',
    'border_emerald': 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
    
    // Basic borders (400-500 Zions)
    'border_rose': 'linear-gradient(135deg, #ff69b4 0%, #ff1493 50%, #ff69b4 100%)',
    'border_blue': 'linear-gradient(135deg, #00bfff 0%, #1e90ff 50%, #00bfff 100%)',
    'border_purple': 'linear-gradient(135deg, #9933ff 0%, #cc66ff 50%, #9933ff 100%)',
    'border_green': 'linear-gradient(135deg, #00ff7f 0%, #32cd32 50%, #00ff7f 100%)',
    'border_red': 'linear-gradient(135deg, #ff4444 0%, #ff0000 50%, #ff4444 100%)',
    'border_cyan': 'linear-gradient(135deg, #00ffff 0%, #00ced1 50%, #00ffff 100%)',
    'border_orange': 'linear-gradient(135deg, #ff8c00 0%, #ff6600 50%, #ff8c00 100%)',
    'border_pastel_pink': 'linear-gradient(135deg, #ffb6c1 0%, #ffc0cb 50%, #ffb6c1 100%)',
    'border_pastel_lavender': 'linear-gradient(135deg, #e6e6fa 0%, #dda0dd 50%, #e6e6fa 100%)',
    'border_pastel_mint': 'linear-gradient(135deg, #98fb98 0%, #90ee90 50%, #98fb98 100%)',
    'border_pastel_peach': 'linear-gradient(135deg, #ffdab9 0%, #ffefd5 50%, #ffdab9 100%)',
    'border_pastel_sky': 'linear-gradient(135deg, #87ceeb 0%, #add8e6 50%, #87ceeb 100%)',
    
    // Mid-tier borders (600-900 Zions)
    'border_midnight': 'linear-gradient(135deg, #191970 0%, #000080 50%, #191970 100%)',
    'border_ice': 'linear-gradient(135deg, #e0ffff 0%, #87ceeb 25%, #00bfff 50%, #87ceeb 75%, #e0ffff 100%)',
    'border_sunset': 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 25%, #ff6b6b 50%, #feb47b 75%, #ff7e5f 100%)',
    'border_ocean': 'linear-gradient(135deg, #006994 0%, #0077be 25%, #00a9e0 50%, #0077be 75%, #006994 100%)',
    'border_forest': 'linear-gradient(135deg, #228b22 0%, #32cd32 25%, #90ee90 50%, #32cd32 75%, #228b22 100%)',
    'border_cherry_blossom': 'linear-gradient(135deg, #ffb7c5 0%, #ff69b4 25%, #ffc0cb 50%, #ff69b4 75%, #ffb7c5 100%)',
    'border_autumn': 'linear-gradient(135deg, #8b4513 0%, #d2691e 25%, #ff8c00 50%, #d2691e 75%, #8b4513 100%)',
    'border_cotton_candy': 'linear-gradient(135deg, #ffb3de 0%, #89cff0 50%, #ffb3de 100%)',
    
    // Premium borders (1000-1500 Zions)
    'border_fire': 'linear-gradient(135deg, #ff4500 0%, #ff6600 25%, #ffcc00 50%, #ff6600 75%, #ff4500 100%)',
    'border_galaxy': 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 25%, #4b0082 50%, #1a0a2e 75%, #0c0c0c 100%)',
    'border_rainbow': 'linear-gradient(135deg, #ff0000 0%, #ff8000 17%, #ffff00 33%, #00ff00 50%, #0080ff 67%, #8000ff 83%, #ff0080 100%)',
    'border_aurora': 'linear-gradient(135deg, #00ff87 0%, #60efff 25%, #00ff87 50%, #60efff 75%, #00ff87 100%)',
    'border_neon': 'linear-gradient(135deg, #ff00ff 0%, #00ffff 25%, #ff00ff 50%, #00ffff 75%, #ff00ff 100%)',
    'border_lava': 'linear-gradient(135deg, #8b0000 0%, #ff4500 25%, #ffd700 50%, #ff4500 75%, #8b0000 100%)',
    'border_electric': 'linear-gradient(135deg, #fff700 0%, #00ff00 25%, #00ffff 50%, #00ff00 75%, #fff700 100%)',
    'border_mystic': 'linear-gradient(135deg, #4b0082 0%, #9400d3 25%, #ff1493 50%, #9400d3 75%, #4b0082 100%)',
    
    // Ultra Premium borders (2000+ Zions)
    'border_diamond': 'linear-gradient(135deg, #b9f2ff 0%, #e0ffff 20%, #ffffff 40%, #e0ffff 60%, #b9f2ff 80%, #ffffff 100%)',
    'border_platinum': 'linear-gradient(135deg, #e5e4e2 0%, #c0c0c0 25%, #ffffff 50%, #c0c0c0 75%, #e5e4e2 100%)',
    'border_holographic': 'linear-gradient(135deg, #ff0000 0%, #ff8000 12.5%, #ffff00 25%, #80ff00 37.5%, #00ff00 50%, #00ff80 62.5%, #00ffff 75%, #0080ff 87.5%, #ff00ff 100%)',
    'border_cosmic': 'linear-gradient(135deg, #000033 0%, #4b0082 20%, #8b008b 40%, #ff1493 60%, #ff69b4 80%, #ffffff 100%)',
    'border_phoenix': 'linear-gradient(135deg, #8b0000 0%, #ff0000 20%, #ff4500 40%, #ffa500 60%, #ffd700 80%, #ffffff 100%)',
};

/**
 * Get the gradient for a profile border
 * @param borderId - The ID of the border
 * @param isMGT - Whether the user is MGT
 * @returns The CSS gradient string
 */
export function getProfileBorderGradient(borderId: string | null | undefined, isMGT: boolean): string {
    if (borderId && PROFILE_BORDERS[borderId]) {
        return PROFILE_BORDERS[borderId];
    }
    
    // Default fallback based on membership
    return isMGT 
        ? PROFILE_BORDERS['border_emerald']
        : PROFILE_BORDERS['border_gold'];
}

/**
 * Get Tailwind shadow class for a profile border
 * @param borderId - The ID of the border
 * @param isMGT - Whether the user is MGT
 * @returns The Tailwind shadow class
 */
export function getProfileBorderShadow(borderId: string | null | undefined, isMGT: boolean): string {
    if (!borderId) {
        return isMGT 
            ? 'shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            : 'shadow-[0_0_30px_rgba(212,175,55,0.3)]';
    }
    
    // Map border colors to shadow colors
    const shadowMap: Record<string, string> = {
        'border_gold': 'shadow-[0_0_30px_rgba(212,175,55,0.3)]',
        'border_emerald': 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
        'border_rose': 'shadow-[0_0_30px_rgba(255,105,180,0.3)]',
        'border_blue': 'shadow-[0_0_30px_rgba(0,191,255,0.3)]',
        'border_purple': 'shadow-[0_0_30px_rgba(153,51,255,0.3)]',
        'border_green': 'shadow-[0_0_30px_rgba(0,255,127,0.3)]',
        'border_red': 'shadow-[0_0_30px_rgba(255,68,68,0.3)]',
        'border_cyan': 'shadow-[0_0_30px_rgba(0,255,255,0.3)]',
        'border_orange': 'shadow-[0_0_30px_rgba(255,140,0,0.3)]',
        'border_pastel_pink': 'shadow-[0_0_30px_rgba(255,182,193,0.3)]',
        'border_pastel_lavender': 'shadow-[0_0_30px_rgba(230,230,250,0.3)]',
        'border_pastel_mint': 'shadow-[0_0_30px_rgba(152,251,152,0.3)]',
        'border_pastel_peach': 'shadow-[0_0_30px_rgba(255,218,185,0.3)]',
        'border_pastel_sky': 'shadow-[0_0_30px_rgba(135,206,235,0.3)]',
        'border_midnight': 'shadow-[0_0_30px_rgba(25,25,112,0.3)]',
        'border_ice': 'shadow-[0_0_30px_rgba(135,206,235,0.3)]',
        'border_sunset': 'shadow-[0_0_30px_rgba(255,126,95,0.3)]',
        'border_ocean': 'shadow-[0_0_30px_rgba(0,119,190,0.3)]',
        'border_forest': 'shadow-[0_0_30px_rgba(34,139,34,0.3)]',
        'border_cherry_blossom': 'shadow-[0_0_30px_rgba(255,183,197,0.3)]',
        'border_autumn': 'shadow-[0_0_30px_rgba(210,105,30,0.3)]',
        'border_cotton_candy': 'shadow-[0_0_30px_rgba(255,179,222,0.3)]',
        'border_fire': 'shadow-[0_0_30px_rgba(255,69,0,0.3)]',
        'border_galaxy': 'shadow-[0_0_30px_rgba(75,0,130,0.3)]',
        'border_rainbow': 'shadow-[0_0_30px_rgba(255,0,128,0.3)]',
        'border_aurora': 'shadow-[0_0_30px_rgba(0,255,135,0.3)]',
        'border_neon': 'shadow-[0_0_30px_rgba(255,0,255,0.3)]',
        'border_lava': 'shadow-[0_0_30px_rgba(255,69,0,0.3)]',
        'border_electric': 'shadow-[0_0_30px_rgba(255,247,0,0.3)]',
        'border_mystic': 'shadow-[0_0_30px_rgba(148,0,211,0.3)]',
        'border_diamond': 'shadow-[0_0_30px_rgba(185,242,255,0.4)]',
        'border_platinum': 'shadow-[0_0_30px_rgba(229,228,226,0.4)]',
        'border_holographic': 'shadow-[0_0_30px_rgba(255,0,255,0.4)]',
        'border_cosmic': 'shadow-[0_0_30px_rgba(139,0,139,0.4)]',
        'border_phoenix': 'shadow-[0_0_30px_rgba(255,69,0,0.4)]',
    };
    
    return shadowMap[borderId] || (isMGT 
        ? 'shadow-[0_0_30px_rgba(16,185,129,0.3)]'
        : 'shadow-[0_0_30px_rgba(212,175,55,0.3)]');
}
