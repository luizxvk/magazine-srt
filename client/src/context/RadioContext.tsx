import { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface RadioStation {
    id: string;
    name: string;
    genre: string;
    streamUrl: string;
    color: string;
}

export const RADIO_STATIONS: RadioStation[] = [
    {
        id: 'synthwave',
        name: 'Synthwave FM',
        genre: 'Synthwave / Retrowave',
        streamUrl: 'https://stream.nightride.fm/nightride.m4a',
        color: '#FF6B9D'
    },
    {
        id: 'chillwave',
        name: 'Chillsynth',
        genre: 'Chillwave / Lo-Fi',
        streamUrl: 'https://stream.nightride.fm/chillsynth.m4a',
        color: '#00D9FF'
    },
    {
        id: 'darksynth',
        name: 'Darksynth',
        genre: 'Darksynth / Cyberpunk',
        streamUrl: 'https://stream.nightride.fm/darksynth.m4a',
        color: '#B026FF'
    },
    {
        id: 'spacesynth',
        name: 'Spacesynth',
        genre: 'Spacesynth / Cosmic',
        streamUrl: 'https://stream.nightride.fm/spacesynth.m4a',
        color: '#FFD700'
    },
    {
        id: 'lofi',
        name: 'Lo-Fi Hip Hop',
        genre: 'Lo-Fi / Chill Beats',
        streamUrl: 'https://stream.zeno.fm/0r0xa792kwzuv',
        color: '#98D8AA'
    },
    {
        id: 'jazz',
        name: 'Smooth Jazz',
        genre: 'Jazz / Relaxing',
        streamUrl: 'https://stream.zeno.fm/fyn8eh13hn8uv',
        color: '#F97316'
    },
    {
        id: 'electronic',
        name: 'Electronic',
        genre: 'EDM / House',
        streamUrl: 'https://stream.zeno.fm/0hq1sm8am0zuv',
        color: '#EC4899'
    },
    {
        id: 'rock',
        name: 'Classic Rock',
        genre: 'Rock / Classic',
        streamUrl: 'https://stream.zeno.fm/yn65fsaurfhvv',
        color: '#EF4444'
    }
];

interface RadioContextType {
    currentStation: RadioStation;
    isPlaying: boolean;
    isMuted: boolean;
    volume: number;
    isLoading: boolean;
    togglePlay: () => Promise<void>;
    toggleMute: () => void;
    setVolume: (volume: number) => void;
    changeStation: (station: RadioStation) => void;
    showMiniPlayer: boolean;
    setShowMiniPlayer: (show: boolean) => void;
}

const RadioContext = createContext<RadioContextType | null>(null);

export function useRadio() {
    const context = useContext(RadioContext);
    if (!context) {
        throw new Error('useRadio must be used within a RadioProvider');
    }
    return context;
}

export function RadioProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentStation, setCurrentStation] = useState<RadioStation>(RADIO_STATIONS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolumeState] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);
    const [showMiniPlayer, setShowMiniPlayer] = useState(false);

    // Create audio element only once
    useEffect(() => {
        const audio = new Audio();
        audio.volume = volume;
        audioRef.current = audio;

        audio.addEventListener('playing', () => {
            setIsPlaying(true);
            setIsLoading(false);
            setShowMiniPlayer(true);
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

        audio.addEventListener('error', () => {
            setIsLoading(false);
            setIsPlaying(false);
        });

        return () => {
            audio.pause();
            audio.remove();
        };
    }, []);

    // Update stream URL when station changes
    useEffect(() => {
        if (audioRef.current) {
            const wasPlaying = isPlaying;
            audioRef.current.pause();
            audioRef.current.src = currentStation.streamUrl;
            
            if (wasPlaying) {
                setIsLoading(true);
                audioRef.current.play().catch(() => {
                    setIsLoading(false);
                });
            }
        }
    }, [currentStation]);

    const togglePlay = async () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsLoading(true);
            audioRef.current.src = currentStation.streamUrl;
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

    const setVolume = (newVolume: number) => {
        setVolumeState(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
            if (newVolume > 0 && isMuted) {
                audioRef.current.muted = false;
                setIsMuted(false);
            }
        }
    };

    const changeStation = (station: RadioStation) => {
        setCurrentStation(station);
    };

    return (
        <RadioContext.Provider value={{
            currentStation,
            isPlaying,
            isMuted,
            volume,
            isLoading,
            togglePlay,
            toggleMute,
            setVolume,
            changeStation,
            showMiniPlayer,
            setShowMiniPlayer
        }}>
            {children}
        </RadioContext.Provider>
    );
}
