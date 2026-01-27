import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Radio, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRadio, RADIO_STATIONS } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function MiniRadioPlayer() {
    const { 
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
    } = useRadio();
    const { user, theme } = useAuth();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);
    const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isMGT = user?.membershipType === 'MGT';
    
    // Hide on auth pages
    const isAuthPage = ['/', '/login', '/register', '/request-invite', '/reset-password'].includes(location.pathname);
    
    // Auto-close after 5 seconds of inactivity when expanded
    useEffect(() => {
        if (isExpanded) {
            autoCloseTimerRef.current = setTimeout(() => {
                setIsExpanded(false);
            }, 5000);
        }
        return () => {
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current);
            }
        };
    }, [isExpanded]);

    // Reset timer on any interaction
    const handleInteraction = () => {
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
        }
        if (isExpanded) {
            autoCloseTimerRef.current = setTimeout(() => {
                setIsExpanded(false);
            }, 5000);
        }
    };
    
    // Don't show if not playing or on auth pages
    if (!showMiniPlayer || !isPlaying || isAuthPage) return null;

    const accentColor = currentStation.color || (isMGT ? '#10b981' : '#d4af37');
    
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
                onClick={handleInteraction}
            >
                {/* Edge Handle - Always visible (collapsed state) */}
                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        <motion.button
                            key="collapsed"
                            initial={{ x: 20 }}
                            animate={{ x: 0 }}
                            exit={{ x: 20, opacity: 0 }}
                            onClick={() => setIsExpanded(true)}
                            className="relative flex items-center justify-center rounded-l-2xl overflow-hidden shadow-2xl"
                            style={{ 
                                background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor}99)`,
                                width: '48px',
                                height: '80px',
                                boxShadow: `0 0 30px ${accentColor}50`
                            }}
                        >
                            {/* Pulsing glow effect */}
                            <div 
                                className="absolute inset-0 animate-pulse opacity-50"
                                style={{ background: `radial-gradient(circle at center, white 0%, transparent 70%)` }}
                            />
                            
                            {/* Music wave animation */}
                            <div className="relative flex items-end gap-0.5 h-6">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 bg-white rounded-full"
                                        animate={{ 
                                            height: ['8px', '20px', '12px', '24px', '8px']
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                            ease: 'easeInOut'
                                        }}
                                    />
                                ))}
                            </div>
                            
                            {/* Arrow indicator */}
                            <ChevronLeft className="absolute right-1 w-4 h-4 text-white/70" />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ x: 200, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 200, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="rounded-l-2xl overflow-hidden shadow-2xl"
                            style={{ 
                                background: theme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(10,10,10,0.98)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                boxShadow: `0 0 40px ${accentColor}40`,
                                width: '280px'
                            }}
                        >
                            {/* Accent border */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-1"
                                style={{ background: accentColor }}
                            />
                            
                            {/* Header */}
                            <div className="p-4 pb-3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Radio size={16} style={{ color: accentColor }} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
                                            Rádio Live
                                        </span>
                                        <span 
                                            className="px-1.5 py-0.5 text-[9px] font-bold rounded animate-pulse"
                                            style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                                        >
                                            LIVE
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setIsExpanded(false)}
                                            className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                                        >
                                            <ChevronRight size={16} className={textSub} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMiniPlayer(false);
                                                togglePlay();
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                                        >
                                            <X size={16} className={textSub} />
                                        </button>
                                    </div>
                                </div>

                                {/* Current Station */}
                                <div className="flex items-center gap-3 mb-4">
                                    <button
                                        onClick={togglePlay}
                                        className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                                        style={{ backgroundColor: `${accentColor}20` }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div 
                                                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                                                style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
                                            />
                                        ) : isPlaying ? (
                                            <Pause size={20} style={{ color: accentColor }} />
                                        ) : (
                                            <Play size={20} style={{ color: accentColor }} className="ml-0.5" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold ${textMain} truncate`}>
                                            {currentStation.name}
                                        </p>
                                        <p className={`text-xs ${textSub} truncate`}>
                                            {currentStation.genre}
                                        </p>
                                    </div>
                                    <button
                                        onClick={toggleMute}
                                        className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                                    >
                                        {isMuted || volume === 0 ? (
                                            <VolumeX size={18} className={textSub} />
                                        ) : (
                                            <Volume2 size={18} style={{ color: accentColor }} />
                                        )}
                                    </button>
                                </div>

                                {/* Volume Slider */}
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => {
                                            setVolume(parseFloat(e.target.value));
                                            handleInteraction();
                                        }}
                                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, ${accentColor} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.15)'} ${volume * 100}%)`
                                        }}
                                    />
                                    <span className={`text-xs ${textSub} w-8 text-right`}>
                                        {Math.round(volume * 100)}%
                                    </span>
                                </div>

                                {/* Station Selector */}
                                <div className="grid grid-cols-4 gap-1.5">
                                    {RADIO_STATIONS.slice(0, 8).map((station) => (
                                        <button
                                            key={station.id}
                                            onClick={() => {
                                                changeStation(station);
                                                handleInteraction();
                                            }}
                                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium truncate transition-all ${
                                                currentStation.id === station.id
                                                    ? 'text-white'
                                                    : `${textSub} ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`
                                            }`}
                                            style={{
                                                backgroundColor: currentStation.id === station.id ? station.color : undefined
                                            }}
                                        >
                                            {station.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
