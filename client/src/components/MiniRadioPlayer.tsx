import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Radio, ChevronUp, ChevronDown } from 'lucide-react';
import { useRadio, RADIO_STATIONS } from '../context/RadioContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
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

    const isMGT = user?.membershipType === 'MGT';
    
    // Hide on auth pages
    const isAuthPage = ['/', '/login', '/register', '/request-invite', '/reset-password'].includes(location.pathname);
    
    // Don't show if not playing or on auth pages
    if (!showMiniPlayer || !isPlaying || isAuthPage) return null;

    const accentColor = currentStation.color || (isMGT ? '#10b981' : '#d4af37');
    
    const themeBg = theme === 'light' 
        ? 'bg-white/95' 
        : (isMGT ? 'bg-emerald-950/95' : 'bg-black/95');
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 ${themeBg} backdrop-blur-xl rounded-2xl border ${themeBorder} shadow-2xl overflow-hidden`}
                style={{ 
                    boxShadow: `0 0 30px ${accentColor}30`,
                    maxWidth: isExpanded ? '320px' : '280px'
                }}
            >
                {/* Animated glow effect */}
                <div 
                    className="absolute inset-0 opacity-20 pointer-events-none animate-pulse"
                    style={{
                        background: `radial-gradient(circle at 30% 50%, ${accentColor}40 0%, transparent 60%)`
                    }}
                />
                
                {/* Main Content */}
                <div className="relative p-3">
                    <div className="flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                            style={{ backgroundColor: `${accentColor}20` }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div 
                                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                                    style={{ borderColor: `${accentColor}`, borderTopColor: 'transparent' }}
                                />
                            ) : isPlaying ? (
                                <Pause size={18} style={{ color: accentColor }} />
                            ) : (
                                <Play size={18} style={{ color: accentColor }} className="ml-0.5" />
                            )}
                        </button>

                        {/* Station Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium ${textMain} truncate`}>
                                    {currentStation.name}
                                </p>
                                {isPlaying && (
                                    <span 
                                        className="px-1.5 py-0.5 text-[10px] font-bold rounded animate-pulse"
                                        style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                                    >
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <p className={`text-xs ${textSub} truncate`}>
                                {currentStation.genre}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                            {/* Volume */}
                            <button
                                onClick={toggleMute}
                                className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX size={16} className={textSub} />
                                ) : (
                                    <Volume2 size={16} style={{ color: accentColor }} />
                                )}
                            </button>

                            {/* Expand/Collapse */}
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                            >
                                {isExpanded ? (
                                    <ChevronDown size={16} className={textSub} />
                                ) : (
                                    <ChevronUp size={16} className={textSub} />
                                )}
                            </button>

                            {/* Close */}
                            <button
                                onClick={() => {
                                    setShowMiniPlayer(false);
                                    togglePlay(); // Stop playing
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                            >
                                <X size={16} className={textSub} />
                            </button>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                {/* Volume Slider */}
                                <div className="mt-3 flex items-center gap-2">
                                    <Volume2 size={14} className={textSub} />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, ${accentColor} ${volume * 100}%, ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} ${volume * 100}%)`
                                        }}
                                    />
                                    <span className={`text-xs ${textSub} w-8 text-right`}>
                                        {Math.round(volume * 100)}%
                                    </span>
                                </div>

                                {/* Station Selector */}
                                <div className="mt-3 grid grid-cols-4 gap-1.5">
                                    {RADIO_STATIONS.slice(0, 8).map((station) => (
                                        <button
                                            key={station.id}
                                            onClick={() => changeStation(station)}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-medium truncate transition-all ${
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

                                {/* Footer */}
                                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px]" style={{ color: accentColor }}>
                                    <Radio size={10} />
                                    <span>RÁDIO 24/7 • WAVES MUSIC</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
