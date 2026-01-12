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
    const { theme } = useAuth();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    const [currentStation, setCurrentStation] = useState<RadioStation>(RADIO_STATIONS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);

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
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    return (
        <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
            theme === 'light' 
                ? 'bg-white border-gray-200 shadow-lg' 
                : 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/10'
        }`}>
            {/* Header com visualizador */}
            <div 
                className="relative p-6 overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${currentStation.color}15 0%, transparent 100%)`
                }}
            >
                {/* Animated Background */}
                {isPlaying && (
                    <div className="absolute inset-0 opacity-20">
                        <div 
                            className="absolute inset-0 animate-pulse"
                            style={{
                                background: `radial-gradient(circle at 30% 50%, ${currentStation.color}40 0%, transparent 50%)`
                            }}
                        />
                    </div>
                )}

                <div className="relative flex items-center gap-4">
                    {/* Radio Icon */}
                    <div 
                        className="relative w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${currentStation.color}20` }}
                    >
                        <Radio 
                            className="w-8 h-8" 
                            style={{ color: currentStation.color }}
                        />
                        {isPlaying && (
                            <div className="absolute inset-0 rounded-xl animate-ping opacity-20" style={{ backgroundColor: currentStation.color }} />
                        )}
                    </div>

                    {/* Station Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                {currentStation.name}
                            </h3>
                            {isPlaying && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-500 text-white animate-pulse">
                                    AO VIVO
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                            {currentStation.genre}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className={`p-4 border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-black/20'}`}>
                {/* Station Selector */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                    {RADIO_STATIONS.map((station) => (
                        <button
                            key={station.id}
                            onClick={() => changeStation(station)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                currentStation.id === station.id
                                    ? 'text-white'
                                    : theme === 'light'
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                            style={currentStation.id === station.id ? { backgroundColor: station.color } : {}}
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
                        className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: currentStation.color }}
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
                                    ? 'hover:bg-gray-200 text-gray-700' 
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
                            className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, ${currentStation.color} 0%, ${currentStation.color} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : '#ffffff10'} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : '#ffffff10'} 100%)`
                            }}
                        />

                        <span className={`text-xs font-medium w-8 text-right ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                            {Math.round(volume * 100)}%
                        </span>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider">
                        🎵 Rádio 24/7 • Waves Music
                    </p>
                </div>
            </div>
        </div>
    );
}
