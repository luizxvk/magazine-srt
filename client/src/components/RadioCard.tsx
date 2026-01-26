import { Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRadio, RADIO_STATIONS } from '../context/RadioContext';

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

export default function RadioCard() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
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
    const themeGlow = isMGT 
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]';
    const themeBg = theme === 'light' 
        ? 'bg-white/80' 
        : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };

    return (
        <div className={`w-full ${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} transition-all duration-300 overflow-hidden`}>
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
                        className="relative w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: accentColor }}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="w-5 h-5 text-white" fill="white" />
                        ) : (
                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                        )}
                        {isPlaying && (
                            <div className="absolute inset-0 rounded-xl animate-ping opacity-20" style={{ backgroundColor: accentColor }} />
                        )}
                    </button>

                    {/* Station Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-sm ${textMain} truncate`}>
                                {currentStation.name}
                            </h3>
                            {isPlaying && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-red-500 text-white animate-pulse flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-white" />
                                    Live
                                </span>
                            )}
                        </div>
                        <p className={`text-xs ${textSub} truncate`}>
                            {currentStation.genre}
                        </p>
                    </div>

                    {/* Volume Control Compact */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleMute}
                            className={`p-1.5 rounded-lg transition-colors ${
                                theme === 'light' 
                                    ? 'hover:bg-gray-100 text-gray-600' 
                                    : 'hover:bg-white/5 text-gray-400'
                            }`}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>
                        <span className={`text-[10px] font-medium w-6 ${textSub}`}>
                            {Math.round(volume * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Volume Slider */}
            <div className="px-4 pb-3">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} 100%)`
                    }}
                />
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
    );
}
