import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Eye } from 'lucide-react';

// Import animated backgrounds
import ConstellationBackground from './backgrounds/ConstellationBackground';
import NeonRainBackground from './backgrounds/NeonRainBackground';
import FireRainBackground from './backgrounds/FireRainBackground';
import OrientalMatrixBackground from './backgrounds/OrientalMatrixBackground';
import DarkVeilBackground from './backgrounds/DarkVeilBackground';
import IridescenceBackground from './backgrounds/IridescenceBackground';

interface BackgroundPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    backgroundId: string;
    backgroundName: string;
    backgroundPreview: string;
}

// Map background IDs to their animated components
const animatedBackgroundMap: Record<string, React.ComponentType> = {
    'bg_ice': ConstellationBackground,
    'bg_chuva_neon': NeonRainBackground,
    'bg_fire': FireRainBackground,
    'bg_emerald': OrientalMatrixBackground,
    'anim-dark-veil': DarkVeilBackground,
    'anim-iridescence': IridescenceBackground,
};

export default function BackgroundPreviewModal({ 
    isOpen, 
    onClose, 
    backgroundId, 
    backgroundName,
    backgroundPreview 
}: BackgroundPreviewModalProps) {
    const [isPlaying, setIsPlaying] = useState(true);
    
    const AnimatedComponent = animatedBackgroundMap[backgroundId];
    const hasAnimatedPreview = !!AnimatedComponent;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

                {/* Preview Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Animated Background Preview */}
                    {hasAnimatedPreview && isPlaying ? (
                        <div className="absolute inset-0">
                            <AnimatedComponent />
                        </div>
                    ) : (
                        <div 
                            className="absolute inset-0 animate-wave-bg"
                            style={{ 
                                background: backgroundPreview, 
                                backgroundSize: '200% 200%' 
                            }}
                        />
                    )}

                    {/* Overlay Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-white/80" />
                            <span className="text-white font-medium">Preview</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h2 className="text-2xl font-bold text-white mb-2">{backgroundName}</h2>
                        
                        {hasAnimatedPreview && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    {isPlaying ? (
                                        <>
                                            <Pause className="w-4 h-4 text-white" />
                                            <span className="text-white text-sm">Pausar</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 text-white" />
                                            <span className="text-white text-sm">Play</span>
                                        </>
                                    )}
                                </button>
                                <span className="text-white/60 text-sm">
                                    Animação em tempo real
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
