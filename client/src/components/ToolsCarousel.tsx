import { Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import RadioCard from './RadioCard';

// Color mapping from CustomizationShop
const COLOR_MAP: Record<string, string> = {
    'color_gold': '#d4af37',
    'color_rgb': 'rgb-dynamic',
    'color_cyan': '#00ffff',
    'color_magenta': '#ff00ff',
    'color_lime': '#00ff00',
    'color_orange': '#ff6600',
    'color_purple': '#9933ff',
    'color_pink': '#ff69b4',
    'color_blue': '#0066ff',
    'color_red': '#ff0033',
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

export default function ToolsCarousel() {
    const { user, accentColor: contextAccentColor } = useAuth();
    const { getAccentColor } = useTierColors();
    const isMGT = user?.membershipType === 'MGT';

    // Get the actual color hex from user's equipped color ID
    const getUserAccentColor = () => {
        if (contextAccentColor) return contextAccentColor;
        if (!user?.equippedColor) return null;
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        return COLOR_MAP[user.equippedColor] || null;
    };

    const accentColor = getUserAccentColor() || getAccentColor(isMGT);

    const themeBorder = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT
        ? 'shadow-[0_0_15px_rgba(var(--tier-std-color-rgb),0.15)] hover:shadow-[0_0_25px_rgba(var(--tier-std-color-rgb),0.25)]'
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]';

    return (
        <div className={`rounded-2xl bg-[#1c1c1e]/80 backdrop-blur-xl border ${themeBorder} ${themeGlow} overflow-hidden transition-all duration-300`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Radio className="w-4 h-4" style={{ color: accentColor }} />
                <span className="text-sm font-medium text-white">Rádio</span>
            </div>

            {/* Radio Content */}
            <div className="p-4">
                <RadioCard />
            </div>
        </div>
    );
}
