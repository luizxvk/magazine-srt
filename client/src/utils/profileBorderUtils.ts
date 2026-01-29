// Profile border gradients mapping
export const PROFILE_BORDERS: Record<string, string> = {
    // Default borders
    'border_gold': 'linear-gradient(135deg, #d4af37 0%, #f4e4a6 50%, #d4af37 100%)',
    'border_emerald': 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
    
    // Basic borders
    'border_rose': 'linear-gradient(135deg, #ff69b4 0%, #ff1493 50%, #ff69b4 100%)',
    'border_blue': 'linear-gradient(135deg, #00bfff 0%, #1e90ff 50%, #00bfff 100%)',
    'border_purple': 'linear-gradient(135deg, #9933ff 0%, #cc66ff 50%, #9933ff 100%)',
    'border_green': 'linear-gradient(135deg, #00ff7f 0%, #32cd32 50%, #00ff7f 100%)',
    'border_red': 'linear-gradient(135deg, #ff4444 0%, #ff0000 50%, #ff4444 100%)',
    'border_cyan': 'linear-gradient(135deg, #00ffff 0%, #00ced1 50%, #00ffff 100%)',
    'border_orange': 'linear-gradient(135deg, #ff8c00 0%, #ff6600 50%, #ff8c00 100%)',
    
    // Premium borders
    'border_rainbow': 'linear-gradient(135deg, #ff0000 0%, #ff8000 17%, #ffff00 33%, #00ff00 50%, #0080ff 67%, #8000ff 83%, #ff0080 100%)',
    'border_galaxy': 'linear-gradient(135deg, #0c0c0c 0%, #1a0a2e 25%, #4b0082 50%, #1a0a2e 75%, #0c0c0c 100%)',
    'border_fire': 'linear-gradient(135deg, #ff4500 0%, #ff6600 25%, #ffcc00 50%, #ff6600 75%, #ff4500 100%)',
    'border_ice': 'linear-gradient(135deg, #e0ffff 0%, #87ceeb 25%, #00bfff 50%, #87ceeb 75%, #e0ffff 100%)',
    'border_pastel_pink': 'linear-gradient(135deg, #ffb6c1 0%, #ffc0cb 50%, #ffb6c1 100%)',
    'border_pastel_lavender': 'linear-gradient(135deg, #e6e6fa 0%, #dda0dd 50%, #e6e6fa 100%)',
    'border_midnight': 'linear-gradient(135deg, #191970 0%, #000080 50%, #191970 100%)',
    'border_sunset': 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 25%, #ff6b6b 50%, #feb47b 75%, #ff7e5f 100%)',
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
        'border_rainbow': 'shadow-[0_0_30px_rgba(255,0,128,0.3)]',
        'border_galaxy': 'shadow-[0_0_30px_rgba(75,0,130,0.3)]',
        'border_fire': 'shadow-[0_0_30px_rgba(255,69,0,0.3)]',
        'border_ice': 'shadow-[0_0_30px_rgba(135,206,235,0.3)]',
        'border_pastel_pink': 'shadow-[0_0_30px_rgba(255,182,193,0.3)]',
        'border_pastel_lavender': 'shadow-[0_0_30px_rgba(230,230,250,0.3)]',
        'border_midnight': 'shadow-[0_0_30px_rgba(25,25,112,0.3)]',
        'border_sunset': 'shadow-[0_0_30px_rgba(255,126,95,0.3)]',
    };
    
    return shadowMap[borderId] || (isMGT 
        ? 'shadow-[0_0_30px_rgba(16,185,129,0.3)]'
        : 'shadow-[0_0_30px_rgba(212,175,55,0.3)]');
}
