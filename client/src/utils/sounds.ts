// Sound utility for notification sounds
// Sound files should be placed in /public/sounds/ folder

type SoundType = 'error' | 'wrong' | 'notification' | 'interface' | 'levelUp';

const soundMap: Record<SoundType, string> = {
    error: '/sounds/error-08-206492.mp3',
    wrong: '/sounds/wrong-answer-129254.mp3',
    notification: '/sounds/notification-beep-229154.mp3',
    interface: '/sounds/interface-124464.mp3',
    levelUp: '/sounds/level-up-191997.mp3'
};

// Cache for audio instances
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Play a notification sound
 * @param type - Type of sound to play
 * @param volume - Volume from 0 to 1 (default: 0.5)
 */
export function playSound(type: SoundType, volume: number = 0.5): void {
    try {
        // Check if sounds are enabled in localStorage
        const soundsEnabled = localStorage.getItem('soundsEnabled');
        if (soundsEnabled === 'false') return;

        const soundUrl = soundMap[type];
        if (!soundUrl) {
            console.warn(`[Sound] Unknown sound type: ${type}`);
            return;
        }

        // Get or create audio element
        let audio = audioCache[type];
        if (!audio) {
            audio = new Audio(soundUrl);
            audioCache[type] = audio;
        }

        // Reset and play
        audio.currentTime = 0;
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play().catch(err => {
            // Silently fail - user probably hasn't interacted with page yet
            console.debug('[Sound] Could not play sound:', err.message);
        });
    } catch (error) {
        console.debug('[Sound] Error playing sound:', error);
    }
}

/**
 * Preload sounds for faster playback
 */
export function preloadSounds(): void {
    Object.entries(soundMap).forEach(([type, url]) => {
        if (!audioCache[type as SoundType]) {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audioCache[type as SoundType] = audio;
        }
    });
}

/**
 * Toggle sounds on/off
 */
export function toggleSounds(enabled: boolean): void {
    localStorage.setItem('soundsEnabled', enabled.toString());
}

/**
 * Check if sounds are enabled
 */
export function areSoundsEnabled(): boolean {
    const value = localStorage.getItem('soundsEnabled');
    // Default to true if not set
    return value !== 'false';
}

// Sound type exports for type safety
export type { SoundType };
