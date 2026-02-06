import React from 'react';
import { Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRadio, RADIO_STATIONS } from '../context/RadioContext';

// Liquid Glass Effect Constants
const GLASS_SHADOW_LIGHT =
    "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]";

const GLASS_SHADOW_DARK =
    "dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]";

const DEFAULT_GLASS_FILTER_SCALE = 30;

// Glass Filter SVG Component
const GlassFilter = React.memo(({ id, scale = DEFAULT_GLASS_FILTER_SCALE }: { id: string; scale?: number }) => (
    <svg className="hidden">
        <title>Glass Effect Filter</title>
        <defs>
            <filter
                colorInterpolationFilters="sRGB"
                height="200%"
                id={id}
                width="200%"
                x="-50%"
                y="-50%"
            >
                <feTurbulence
                    baseFrequency="0.05 0.05"
                    numOctaves={1}
                    result="turbulence"
                    seed={1}
                    type="fractalNoise"
                />
                <feGaussianBlur
                    in="turbulence"
                    result="blurredNoise"
                    stdDeviation={2}
                />
                <feDisplacementMap
                    in="SourceGraphic"
                    in2="blurredNoise"
                    result="displaced"
                    scale={scale}
                    xChannelSelector="R"
                    yChannelSelector="B"
                />
                <feGaussianBlur in="displaced" result="finalBlur" stdDeviation={4} />
                <feComposite in="finalBlur" in2="finalBlur" operator="over" />
            </filter>
        </defs>
    </svg>
));
GlassFilter.displayName = "GlassFilter";

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

// Volume Bars Animation Component
const VolumeBars = React.memo(({ isPlaying, color }: { isPlaying: boolean; color: string }) => {
    const bars = Array.from({ length: 8 }, (_, i) => ({
        id: `bar-${i}`,
        delay: i * 0.1,
    }));

    return (
        <div className="pointer-events-none flex h-8 w-10 items-end gap-0.5">
            {bars.map((bar) => (
                <div
                    className={`w-[3px] rounded-sm transition-all duration-200 ${isPlaying ? 'animate-[bounce-music_0.5s_ease-in-out_infinite_alternate]' : ''}`}
                    key={bar.id}
                    style={{
                        height: isPlaying ? `${Math.random() * 100}%` : '6px',
                        animationDelay: `${bar.delay}s`,
                        background: `linear-gradient(to top, ${color}, ${color}88)`,
                    }}
                />
            ))}
        </div>
    );
});
VolumeBars.displayName = "VolumeBars";

export default function RadioCard() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const filterId = React.useId();
    
    const {
        currentStation,
        isPlaying,
        isMuted,
        volume,
        isLoading,
        togglePlay,
        toggleMute,
        setVolume,
        changeStation
    } = useRadio();

    // Get the actual color hex from user's equipped color ID
    const getUserAccentColor = () => {
        if (!user?.equippedColor) return null;
        // If it's already a hex color (from theme pack), use it
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        // Otherwise lookup from color map
        return COLOR_MAP[user.equippedColor] || null;
    };

    // Use user's equipped color or fallback to station color
    const accentColor = getUserAccentColor() || currentStation.color || (isMGT ? '#10b981' : '#d4af37');

    // Theme colors - consistent with other cards
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeBg = theme === 'light' 
        ? 'bg-gradient-to-br from-zinc-50 to-zinc-100' 
        : (isMGT ? 'bg-gradient-to-br from-emerald-950/50 to-black' : 'bg-gradient-to-br from-zinc-900 to-black');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };

    return (
        <>
            <div className={`group relative w-full ${themeBg} backdrop-blur-[2px] rounded-3xl border ${themeBorder} transition-all duration-300 overflow-hidden`}>
                {/* Liquid Glass Shadow Layer */}
                <div className={`pointer-events-none absolute inset-0 rounded-3xl transition-all ${theme === 'light' ? GLASS_SHADOW_LIGHT : GLASS_SHADOW_DARK}`} />
                
                {/* Liquid Glass Distortion Layer */}
                <div
                    className="-z-10 pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
                    style={{ backdropFilter: `url("#${filterId}")` }}
                />

                {/* Hover Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:via-white/5" />

                {/* Content Container */}
                <div className="relative z-10">
                    {/* Header with Station Info */}
                    <div className="relative p-4 pb-3">
                        {/* Animated Background Effect */}
                        {isPlaying && (
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div 
                                    className="absolute inset-0 animate-pulse"
                                    style={{
                                        background: `radial-gradient(circle at 30% 50%, ${accentColor}40 0%, transparent 50%)`
                                    }}
                                />
                            </div>
                        )}

                        <div className="relative flex items-center gap-3">
                            {/* Radio Icon with Play Button */}
                            <button
                                onClick={togglePlay}
                                disabled={isLoading}
                                className="relative w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg ring-1 ring-black/5"
                                style={{ backgroundColor: accentColor }}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="w-6 h-6 text-white" fill="white" />
                                ) : (
                                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                                )}
                                {isPlaying && (
                                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ backgroundColor: accentColor }} />
                                )}
                            </button>

                            {/* Station Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold text-base ${textMain} truncate`}>
                                        {currentStation.name}
                                    </h3>
                                    {isPlaying && (
                                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-red-500 text-white animate-pulse flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-white" />
                                            Live
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm ${textSub} truncate mt-0.5`}>
                                    {currentStation.genre}
                                </p>
                            </div>

                            {/* Volume Bars Animation */}
                            <VolumeBars isPlaying={isPlaying} color={accentColor} />
                        </div>
                    </div>

                    {/* Progress/Volume Section */}
                    <div className="px-4 pb-3 flex flex-col gap-2">
                        {/* Volume Display */}
                        <div className={`flex justify-between font-medium text-xs ${textSub}`}>
                            <span>Volume</span>
                            <span className="tabular-nums">{Math.round(volume * 100)}%</span>
                        </div>
                        
                        {/* Volume Slider */}
                        <div 
                            className="relative z-10 h-1 w-full cursor-pointer overflow-hidden rounded-full"
                            style={{ backgroundColor: theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}
                        >
                            <div
                                className="h-full transition-all duration-200"
                                style={{ 
                                    width: `${volume * 100}%`,
                                    background: `linear-gradient(to right, ${accentColor}, ${accentColor}88)`
                                }}
                            />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="w-full h-4 -mt-3 opacity-0 cursor-pointer"
                        />
                    </div>

                    {/* Control Buttons */}
                    <div className="px-4 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const currentIdx = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
                                    const prevIdx = currentIdx === 0 ? RADIO_STATIONS.length - 1 : currentIdx - 1;
                                    changeStation(RADIO_STATIONS[prevIdx]);
                                }}
                                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                                    theme === 'light' 
                                        ? 'text-gray-700 hover:bg-gray-200/80' 
                                        : 'text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={togglePlay}
                                disabled={isLoading}
                                className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
                                    theme === 'light' 
                                        ? 'text-gray-700 hover:bg-gray-200/80' 
                                        : 'text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="w-5 h-5" />
                                ) : (
                                    <Play className="w-5 h-5" />
                                )}
                            </button>
                            
                            <button
                                onClick={() => {
                                    const currentIdx = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
                                    const nextIdx = currentIdx === RADIO_STATIONS.length - 1 ? 0 : currentIdx + 1;
                                    changeStation(RADIO_STATIONS[nextIdx]);
                                }}
                                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                                    theme === 'light' 
                                        ? 'text-gray-700 hover:bg-gray-200/80' 
                                        : 'text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <button
                            onClick={toggleMute}
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                                theme === 'light' 
                                    ? 'text-gray-700 hover:bg-gray-200/80' 
                                    : 'text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Station Selector - Grid Layout */}
                    <div className={`px-4 pb-4 pt-2 border-t ${themeBorder}`}>
                        <p className={`text-[10px] ${textSub} uppercase tracking-wider mb-2`}>Estações</p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {RADIO_STATIONS.map((station) => (
                                <button
                                    key={station.id}
                                    onClick={() => changeStation(station)}
                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 truncate ${
                                        currentStation.id === station.id
                                            ? 'text-white shadow-md scale-105'
                                            : theme === 'light'
                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                    style={currentStation.id === station.id ? { backgroundColor: station.color } : {}}
                                    title={station.name}
                                >
                                    {station.name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`px-4 py-2 border-t ${themeBorder} bg-black/10`}>
                        <p className={`text-[9px] ${textSub} text-center uppercase tracking-wider flex items-center justify-center gap-1`}>
                            <Radio className="w-3 h-3" />
                            Rádio 24/7 • Waves Music
                        </p>
                    </div>
                </div>
            </div>
            <GlassFilter id={filterId} />
        </>
    );
}
