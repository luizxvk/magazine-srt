import { useState, useRef, useEffect } from 'react';
import { Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RadioStation {
    id: string;
    name: string;
    genre: string;
    streamUrl: string;
    color: string;
}

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

const RADIO_STATIONS: RadioStation[] = [
    {
        id: 'synthwave',
        name: 'Synthwave FM',
        genre: 'Synthwave / Retrowave',
        streamUrl: 'https://stream.nightride.fm/nightride.m4a', // Nightride FM - Synthwave 24/7
        color: '#FF6B9D'
    },
    {
        id: 'chillwave',
        name: 'Chillwave Radio',
        genre: 'Chillwave / Vaporwave',
        streamUrl: 'https://stream.nightride.fm/chillsynth.m4a', // Nightride FM - Chillsynth
        color: '#00D9FF'
    },
    {
        id: 'darksynth',
        name: 'Darksynth FM',
        genre: 'Darksynth / Cyberpunk',
        streamUrl: 'https://stream.nightride.fm/darksynth.m4a', // Nightride FM - Darksynth
        color: '#B026FF'
    },
    {
        id: 'spacesynth',
        name: 'Spacesynth Radio',
        genre: 'Spacesynth / Cosmic',
        streamUrl: 'https://stream.nightride.fm/spacesynth.m4a', // Nightride FM - Spacesynth
        color: '#FFD700'
    }
];

export default function RadioCard() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    const [currentStation, setCurrentStation] = useState<RadioStation>(RADIO_STATIONS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);

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

    useEffect(() => {
        const audio = new Audio(currentStation.streamUrl);
        audio.volume = volume;
        audioRef.current = audio;

        audio.addEventListener('playing', () => {
            setIsPlaying(true);
            setIsLoading(false);
        });

        audio.addEventListener('pause', () => {
            setIsPlaying(false);
        });

        audio.addEventListener('waiting', () => {
            setIsLoading(true);
        });

        audio.addEventListener('canplay', () => {
            setIsLoading(false);
        });

        return () => {
            audio.pause();
            audio.remove();
        };
    }, [currentStation, volume]);

    const togglePlay = async () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsLoading(true);
            try {
                await audioRef.current.play();
            } catch (error) {
                console.error('Failed to play radio:', error);
                setIsLoading(false);
            }
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const changeStation = (station: RadioStation) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setCurrentStation(station);
        setIsPlaying(false);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation(); // Prevent any bubbling that might stop playback
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
            // Unmute if volume is increased from 0
            if (newVolume > 0 && isMuted) {
                audioRef.current.muted = false;
                setIsMuted(false);
            }
        }
    };

    return (
        <div className={`w-full ${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} ${themeGlow} transition-all duration-300 overflow-hidden`}>
            {/* Header */}
            <div className="relative p-4">
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

                <div className="relative flex items-center gap-4">
                    {/* Radio Icon */}
                    <div 
                        className="relative w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm"
                        style={{ backgroundColor: `${accentColor}15` }}
                    >
                        <Radio 
                            className="w-7 h-7" 
                            style={{ color: accentColor }}
                        />
                        {isPlaying && (
                            <div className="absolute inset-0 rounded-xl animate-ping opacity-20" style={{ backgroundColor: accentColor }} />
                        )}
                    </div>

                    {/* Station Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base ${textMain} truncate`}>
                            {currentStation.name}
                        </h3>
                        <p className={`text-xs ${textSub} truncate`}>
                            {currentStation.genre}
                        </p>
                    </div>

                    {/* Badge "AO VIVO" no canto direito */}
                    {isPlaying && (
                        <div className="flex-shrink-0">
                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-red-500 text-white animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Ao Vivo
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Section */}
            <div className={`p-4 pt-0 border-t ${themeBorder}`}>
                {/* Station Selector */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                    {RADIO_STATIONS.map((station) => (
                        <button
                            key={station.id}
                            onClick={() => changeStation(station)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                currentStation.id === station.id
                                    ? 'text-white shadow-md'
                                    : theme === 'light'
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                            style={currentStation.id === station.id ? { backgroundColor: accentColor } : {}}
                        >
                            {station.name.split(' ')[0]}
                        </button>
                    ))}
                </div>

                {/* Play Controls & Volume */}
                <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlay}
                        disabled={isLoading}
                        className="relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: accentColor }}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="w-5 h-5 text-white" fill="white" />
                        ) : (
                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                        )}
                    </button>

                    {/* Volume Control */}
                    <div className="flex-1 flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            className={`p-2 rounded-lg transition-colors ${
                                theme === 'light' 
                                    ? 'hover:bg-gray-100 text-gray-700' 
                                    : 'hover:bg-white/5 text-gray-400'
                            }`}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} 100%)`
                            }}
                        />

                        <span className={`text-xs font-medium w-8 text-right ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                            {Math.round(volume * 100)}%
                        </span>
                    </div>
                </div>

                {/* Footer Info */}
                <div className={`mt-3 pt-3 border-t ${themeBorder}`}>
                    <p className={`text-[10px] ${textSub} text-center uppercase tracking-wider flex items-center justify-center gap-1`}>
                        <Radio className="w-3 h-3" />
                        Rádio 24/7 • Waves Music
                    </p>
                </div>
            </div>
        </div>
    );
}
