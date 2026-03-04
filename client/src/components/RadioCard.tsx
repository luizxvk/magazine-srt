import { Radio, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useRadio, RADIO_STATIONS } from '../context/RadioContext';
import Loader from './Loader';

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
};

export default function RadioCard() {
    const { user, accentColor: userAccentColor, accentGradient, theme } = useAuth();
    const { config } = useCommunity();
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
        if (user.equippedColor.startsWith('#')) return user.equippedColor;
        return COLOR_MAP[user.equippedColor] || null;
    };

    // Dynamic colors from community
    const stdColor = config.accentColor || config.backgroundColor || '#A78BFA';
    const vipColor = config.tierVipColor || '#d4af37';
    const defaultColor = isMGT ? stdColor : vipColor;
    const backgroundAccent = getUserAccentColor() || userAccentColor || currentStation.color || defaultColor;
    
    const themeBg = theme === 'light' ? 'bg-white/80' : (isMGT ? 'bg-tier-std-950/30' : 'bg-black/30');
    const themeBorder = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const themeGlow = isMGT
        ? 'shadow-[0_0_15px_rgba(var(--tier-std-color-rgb),0.15)] hover:shadow-[0_0_25px_rgba(var(--tier-std-color-rgb),0.25)]'
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]';
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };

    const handlePrevStation = () => {
        const currentIdx = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
        const prevIdx = currentIdx === 0 ? RADIO_STATIONS.length - 1 : currentIdx - 1;
        changeStation(RADIO_STATIONS[prevIdx]);
    };

    const handleNextStation = () => {
        const currentIdx = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
        const nextIdx = currentIdx === RADIO_STATIONS.length - 1 ? 0 : currentIdx + 1;
        changeStation(RADIO_STATIONS[nextIdx]);
    };

    // Short station names for grid
    const shortNames: Record<string, string> = {
        'synthwave': 'Synth',
        'chillwave': 'Chill',
        'darksynth': 'Dark',
        'spacesynth': 'Space',
        'lofi': 'Lo-Fi',
        'jazz': 'Jazz',
        'electronic': 'EDM',
        'rock': 'Rock'
    };

    return (
        <div 
            className={`${themeBg} backdrop-blur-xl rounded-xl p-5 ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} transition-all duration-300 group relative overflow-hidden`}
        >
            {/* Hover Overlay */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{ backgroundColor: backgroundAccent }}
            />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div 
                    className="p-2.5 rounded-xl shadow-lg"
                    style={{ background: accentGradient || `linear-gradient(135deg, ${backgroundAccent}, ${backgroundAccent}dd)` }}
                >
                    <Radio className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-bold ${textMain}`}>Rádio</h3>
                    <p className={`text-xs ${textSub}`}>{currentStation.name} • {currentStation.genre}</p>
                </div>
                {isPlaying && (
                    <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded bg-red-500 text-white animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        Live
                    </span>
                )}
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
                <button
                    onClick={handlePrevStation}
                    className={`p-2 rounded-lg transition-colors ${
                        theme === 'light' 
                            ? 'text-gray-700 hover:bg-gray-200/80' 
                            : 'text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg"
                    style={{ backgroundColor: backgroundAccent }}
                >
                    {isLoading ? (
                        <Loader size="sm" />
                    ) : isPlaying ? (
                        <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    )}
                </button>
                
                <button
                    onClick={handleNextStation}
                    className={`p-2 rounded-lg transition-colors ${
                        theme === 'light' 
                            ? 'text-gray-700 hover:bg-gray-200/80' 
                            : 'text-gray-300 hover:bg-white/10'
                    }`}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                
                <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors ${
                        theme === 'light' 
                            ? 'text-gray-700 hover:bg-gray-200/80' 
                            : 'text-gray-300 hover:bg-white/10'
                    }`}
                >
                    {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                    ) : (
                        <Volume2 className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Volume Control */}
            <div className="mb-4 relative z-10">
                <div className={`flex justify-between text-xs ${textSub} mb-1`}>
                    <span>Volume</span>
                    <span className="tabular-nums">{Math.round(volume * 100)}%</span>
                </div>
                <div 
                    className="relative h-1.5 w-full rounded-full overflow-hidden"
                    style={{ backgroundColor: theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}
                >
                    <div
                        className="h-full transition-all duration-200"
                        style={{ 
                            width: `${volume * 100}%`,
                            background: accentGradient || `linear-gradient(to right, ${backgroundAccent}, ${backgroundAccent}88)`
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
                    className="w-full h-4 -mt-2.5 opacity-0 cursor-pointer"
                />
            </div>

            {/* Stations Grid */}
            <div className="mb-4 relative z-10">
                <p className={`text-[10px] ${textSub} uppercase tracking-wider mb-2`}>Estações</p>
                <div className="grid grid-cols-4 gap-1.5">
                    {RADIO_STATIONS.map((station) => (
                        <button
                            key={station.id}
                            onClick={() => changeStation(station)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                                currentStation.id === station.id
                                    ? 'text-white shadow-md scale-105'
                                    : theme === 'light'
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : 'bg-black/40 text-gray-400 hover:bg-white/10 border border-white/10'
                            }`}
                            style={currentStation.id === station.id ? { backgroundColor: station.color } : {}}
                            title={station.name}
                        >
                            {shortNames[station.id] || station.name.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className={`pt-3 border-t text-center relative z-10`} style={{ borderColor: `${backgroundAccent}30` }}>
                <p className={`text-[9px] ${textSub} uppercase tracking-wider flex items-center justify-center gap-1`}>
                    <Radio className="w-3 h-3" />
                    Rádio 24/7 • Waves Music
                </p>
            </div>
        </div>
    );
}
