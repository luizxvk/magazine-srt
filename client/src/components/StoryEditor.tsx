import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Type, Send, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StoryEditorProps {
    imageUrl: string;
    onClose: () => void;
    onPublish: (finalImageUrl: string) => void;
}

export default function StoryEditor({ imageUrl, onClose, onPublish }: StoryEditorProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [text, setText] = useState('');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [bgOpacity, setBgOpacity] = useState(0.5);
    const [isPublishing, setIsPublishing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const colors = [
        '#FFFFFF', // White
        '#000000', // Black
        isMGT ? '#10b981' : '#d4af37', // Accent color
        '#ef4444', // Red
        '#3b82f6', // Blue
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#f59e0b', // Yellow
    ];

    const saveImage = async () => {
        if (!canvasRef.current) return;

        setIsPublishing(true);

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas size to story dimensions (9:16)
            canvas.width = 1080;
            canvas.height = 1920;

            // Draw background image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Draw text if present
            if (text.trim()) {
                ctx.font = 'bold 72px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const lines = text.split('\n');
                const lineHeight = 90;
                const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

                lines.forEach((line, index) => {
                    const y = startY + index * lineHeight;
                    
                    // Draw background
                    if (bgOpacity > 0) {
                        ctx.fillStyle = `rgba(0, 0, 0, ${bgOpacity})`;
                        const metrics = ctx.measureText(line);
                        const padding = 40;
                        ctx.fillRect(
                            canvas.width / 2 - metrics.width / 2 - padding,
                            y - 45,
                            metrics.width + padding * 2,
                            90
                        );
                    }

                    // Draw text
                    ctx.fillStyle = textColor;
                    ctx.fillText(line, canvas.width / 2, y);
                });
            }

            // Convert to blob
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                onPublish(url);
                setIsPublishing(false);
            }, 'image/jpeg', 0.92);

        } catch (error) {
            console.error('Error saving story:', error);
            setIsPublishing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black overflow-y-auto"
        >
            <canvas ref={canvasRef} className="hidden" />

            <div className="min-h-screen flex flex-col">
                {/* Header - FIXO NO TOPO COM SOMBRA */}
                <div className="relative z-[60] bg-gradient-to-b from-black via-black/80 to-transparent p-4 pb-6 flex-shrink-0">
                    <div className="flex items-center justify-between max-w-lg mx-auto">
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors shadow-lg"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        <motion.button
                            onClick={saveImage}
                            disabled={isPublishing}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-full font-bold text-white shadow-2xl transition-all text-lg ${
                                isPublishing 
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                                    : isMGT 
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 hover:shadow-emerald-500/50 hover:scale-105' 
                                        : 'bg-gradient-to-r from-gold-600 to-gold-400 hover:shadow-gold-500/50 hover:scale-105'
                            }`}
                        >
                            <Send className="w-6 h-6" />
                            <span>{isPublishing ? 'Publicando...' : 'POSTAR'}</span>
                        </motion.button>
                    </div>
                </div>

                {/* Story Preview - CENTRALIZED */}
                <div className="flex-1 flex items-center justify-center px-4 py-8">
                    <div className="relative w-full max-w-md" style={{ maxHeight: '50vh' }}>
                        <img
                            src={imageUrl}
                            alt="Story preview"
                            className="w-full h-full object-contain rounded-2xl"
                        />
                    
                    {/* Text Overlay */}
                    {text && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center px-8">
                                {text.split('\n').map((line, index) => (
                                    <div key={index} className="relative inline-block my-1">
                                        {bgOpacity > 0 && (
                                            <div
                                                className="absolute inset-0 -mx-6 -my-1 rounded-lg"
                                                style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity})` }}
                                            />
                                        )}
                                        <p
                                            className="relative text-4xl md:text-5xl font-bold px-6"
                                            style={{ color: textColor }}
                                        >
                                            {line}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

                {/* Bottom Toolbar - SEMPRE VISÍVEL COM SCROLL GARANTIDO */}
                <div className="relative z-[60] bg-black pt-8 pb-8 flex-shrink-0">
                    <div className="max-w-lg mx-auto px-6 space-y-4">
                        {/* Text Input */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Adicione um texto..."
                                    rows={2}
                                    maxLength={100}
                                    className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-white/40 transition-colors text-base sm:text-lg"
                                />
                                <Type className="absolute right-3 top-3 w-5 h-5 text-white/50" />
                            </div>
                        </div>

                        {/* Color Palette - SEMPRE VISÍVEL */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            {/* Label */}
                            <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-white/70" />
                                <span className="text-white/70 text-sm font-medium">Cor do Texto</span>
                            </div>

                            {/* Color Options - COM PADDING PARA NÃO CORTAR */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setTextColor(color)}
                                        className={`min-w-[48px] w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all flex-shrink-0 ${
                                            textColor === color 
                                                ? 'scale-110 ring-4 ring-white/60 shadow-xl' 
                                                : 'scale-100 ring-2 ring-white/20 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>

                            {/* Background Opacity Slider */}
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white/70 text-sm font-medium">Fundo do Texto</span>
                                    <span className="text-white text-sm font-bold min-w-[50px] text-right">
                                        {Math.round(bgOpacity * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={bgOpacity}
                                    onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-thumb"
                                    style={{
                                        background: `linear-gradient(to right, ${isMGT ? '#10b981' : '#d4af37'} 0%, ${isMGT ? '#10b981' : '#d4af37'} ${bgOpacity * 100}%, rgba(255,255,255,0.2) ${bgOpacity * 100}%, rgba(255,255,255,0.2) 100%)`
                                    }}
                                />
                            </div>
                        </motion.div>

                        {/* BOTÃO POSTAR GRANDE - SEMPRE VISÍVEL */}
                        <motion.button
                            onClick={saveImage}
                            disabled={isPublishing}
                            whileTap={{ scale: 0.95 }}
                            className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold text-white shadow-2xl transition-all text-xl ${
                                isPublishing 
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                                    : isMGT 
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 hover:shadow-emerald-500/50 hover:scale-[1.02]' 
                                        : 'bg-gradient-to-r from-gold-600 to-gold-400 hover:shadow-gold-500/50 hover:scale-[1.02]'
                            }`}
                        >
                            <Send className="w-7 h-7" />
                            <span>{isPublishing ? 'PUBLICANDO...' : 'PUBLICAR STORY'}</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
