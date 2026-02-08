import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RadioCard from './RadioCard';
import DiscordCard from './DiscordCard';
import SteamCard from './SteamCard';
import TwitchCard from './TwitchCard';

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
    { id: 'radio', label: 'Rádio' },
    { id: 'discord', label: 'Discord' },
    { id: 'steam', label: 'Steam' },
    { id: 'twitch', label: 'Twitch' },
];

export default function ToolsCarousel() {
    const { user, theme, accentGradient } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Get the actual color hex from user's equipped color ID
    const getUserAccentColor = () => {
        if (!user?.equippedColor) return null;
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        return COLOR_MAP[user.equippedColor] || null;
    };

    const accentColor = getUserAccentColor() || (isMGT ? '#10b981' : '#d4af37');

    // Theme styles
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex(prev => (prev === 0 ? tools.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex(prev => (prev === tools.length - 1 ? 0 : prev + 1));
    };

    // Handle swipe gestures
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        }
    };

    const renderCurrentTool = () => {
        switch (tools[currentIndex].id) {
            case 'radio':
                return <RadioCard />;
            case 'discord':
                return <DiscordCard />;
            case 'steam':
                return <SteamCard />;
            case 'twitch':
                return <TwitchCard usernames={['gaules', 'alanzoka', 'loud_coringa', 'nobru']} />;
            default:
                return null;
        }
    };

    return (
        <div className={`${themeBg} backdrop-blur-xl rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} p-4 transition-all duration-300`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ 
                            backgroundColor: hexToRgba(accentColor, 0.2),
                            borderColor: hexToRgba(accentColor, 0.3),
                            borderWidth: '1px'
                        }}
                    >
                        <Wrench className="w-4 h-4" style={{ color: accentColor }} />
                    </div>
                    <h3 className={`text-lg font-bold ${textMain}`}>Ferramentas</h3>
                </div>

                {/* Navigation Arrows */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevious}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                        style={{ color: accentColor }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToNext}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                        style={{ color: accentColor }}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tab Indicator */}
            <div className="flex items-center gap-2 mb-4">
                {tools.map((tool, index) => (
                    <button
                        key={tool.id}
                        onClick={() => goToSlide(index)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            currentIndex === index
                                ? ''
                                : `${textSub} ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`
                        }`}
                        style={currentIndex === index ? {
                            backgroundColor: hexToRgba(accentColor, 0.2),
                            color: accentColor,
                            borderColor: hexToRgba(accentColor, 0.3),
                            borderWidth: '1px'
                        } : undefined}
                    >
                        {tool.label}
                    </button>
                ))}
            </div>

            {/* Carousel Content */}
            <div
                ref={carouselRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative overflow-hidden"
            >
                <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {renderCurrentTool()}
                </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
                {tools.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            currentIndex === index 
                                ? 'w-6' 
                                : `${theme === 'light' ? 'bg-gray-300' : 'bg-white/20'}`
                        }`}
                        style={currentIndex === index ? { backgroundColor: accentColor } : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
