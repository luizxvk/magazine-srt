import { useState, useEffect } from 'react';
import { Radio, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RadioCard from './RadioCard';
import DiscordCard from './DiscordCard';
import TwitchCard from './TwitchCard';
import api from '../services/api';

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

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const tools = [
    { id: 'radio', label: 'Rádio', icon: Radio },
    { id: 'discord', label: 'Discord', icon: MessageCircle },
];

export default function ToolsCarousel() {
    const { user, theme, accentColor: contextAccentColor } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [currentTool, setCurrentTool] = useState('radio');
    const [twitchChannels, setTwitchChannels] = useState<string[]>(['gaules', 'alanzoka', 'loud_coringa', 'nobru']);

    useEffect(() => {
        api.get('/social/twitch/config')
            .then(({ data }) => {
                if (data.config?.channels?.length > 0) {
                    setTwitchChannels(data.config.channels);
                }
            })
            .catch(() => {});
    }, []);

    // Get the actual color hex from user's equipped color ID
    const getUserAccentColor = () => {
        if (contextAccentColor) return contextAccentColor;
        if (!user?.equippedColor) return null;
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        return COLOR_MAP[user.equippedColor] || null;
    };

    const accentColor = getUserAccentColor() || (isMGT ? '#10b981' : '#d4af37');

    const renderCurrentTool = () => {
        switch (currentTool) {
            case 'radio':
                return <RadioCard />;
            case 'discord':
                return <DiscordCard />;
            case 'twitch':
                return <TwitchCard usernames={twitchChannels} />;
            default:
                return null;
        }
    };

    return (
        <div className="rounded-2xl bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/10 overflow-hidden">
            {/* Minimal Tab Header */}
            <div className="flex border-b border-white/5">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = currentTool === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => setCurrentTool(tool.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative ${
                                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <Icon 
                                className="w-4 h-4" 
                                style={{ color: isActive ? accentColor : undefined }} 
                            />
                            <span>{tool.label}</span>
                            {isActive && (
                                <div 
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full"
                                    style={{ backgroundColor: accentColor }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tool Content */}
            <div className="p-4 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {renderCurrentTool()}
            </div>
        </div>
    );
}
    );
}
