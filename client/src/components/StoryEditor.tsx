import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Send, Palette, ChevronDown, ChevronUp, Smile, Move, ZoomIn, ZoomOut } from 'lucide-react';
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
    const [showControls, setShowControls] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [imageScale, setImageScale] = useState(1);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [isDraggingText, setIsDraggingText] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const emojis = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🔥', '💯', '❤️', '💙', '💚', '💛', '🎉', '✨', '⚡', '🌟', '👍', '👏', '🙌', '💪', '🎂', '🎈', '🎁', '🌈', '☀️', '🌙', '⭐', '💫'];

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
                // Apply text position offset (convert from percentage to pixels)
                const startY = canvas.height / 2 + (textPosition.y * canvas.height / 100) - ((lines.length - 1) * lineHeight) / 2;
                const centerX = canvas.width / 2 + (textPosition.x * canvas.width / 100);

                lines.forEach((line, index) => {
                    const y = startY + index * lineHeight;
                    
                    // Draw background
                    if (bgOpacity > 0) {
                        ctx.fillStyle = `rgba(0, 0, 0, ${bgOpacity})`;
                        const metrics = ctx.measureText(line);
                        const padding = 40;
                        ctx.fillRect(
                            centerX - metrics.width / 2 - padding,
                            y - 45,
                            metrics.width + padding * 2,
                            90
                        );
                    }

                    // Draw text
                    ctx.fillStyle = textColor;
                    ctx.fillText(line, centerX, y);
                });
            }

            // Convert to blob with Apple Vision Pro closing animation
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                
                // Apple Vision Pro style animation before closing
                setTimeout(() => {
                    onPublish(url);
                    setIsPublishing(false);
                }, 800); // Wait for animation
            }, 'image/jpeg', 0.92);

        } catch (error) {
            console.error('Error saving story:', error);
            setIsPublishing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ 
                opacity: 0, 
                scale: 0.8,
                transition: { 
                    duration: 0.6,
                    ease: [0.32, 0.72, 0, 1] // Apple Vision Pro easing
                }
            }}
            className="fixed inset-0 z-[10000] bg-black overflow-y-auto"
        >
            <canvas ref={canvasRef} className="hidden" />

            {/* Botão Fechar - Fixo no topo direito, abaixo do header */}
            <button
                onClick={onClose}
                className="fixed top-20 right-4 z-[70] p-3 bg-red-500 hover:bg-red-600 rounded-full shadow-xl transition-colors"
            >
                <X className="w-6 h-6 text-white" />
            </button>

            <div className="min-h-screen flex flex-col p-4 pt-24">
                {/* Story Preview - CENTRALIZADO */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full max-w-md mx-auto">
                        {/* Controles de Zoom da Imagem */}
                        <div className="flex items-center justify-center gap-2 bg-black/50 backdrop-blur-md rounded-full p-1 mb-4 w-fit mx-auto">
                            <button
                                onClick={() => setImageScale(Math.max(0.5, imageScale - 0.1))}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ZoomOut className="w-4 h-4 text-white" />
                            </button>
                            <span className="text-white text-xs px-2 min-w-[50px] text-center">
                                {Math.round(imageScale * 100)}%
                            </span>
                            <button
                                onClick={() => setImageScale(Math.min(2, imageScale + 0.1))}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ZoomIn className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <motion.div
                            style={{ scale: imageScale }}
                            className="relative w-full"
                        >
                            <img
                                src={imageUrl}
                                alt="Story preview"
                                className="w-full h-full object-contain rounded-2xl"
                            />
                        </motion.div>
                    
                        {/* Text Overlay - DRAGGABLE */}
                        {text && (
                            <motion.div
                                drag
                                dragMomentum={false}
                                dragElastic={0.1}
                                onDragStart={() => setIsDraggingText(true)}
                                onDragEnd={(_, info) => {
                                    setIsDraggingText(false);
                                    // Convert pixels to percentage for canvas rendering
                                    const containerRect = (info.point.x && info.point.y) ? { width: 384, height: 682 } : { width: 384, height: 682 };
                                    setTextPosition({
                                        x: textPosition.x + (info.offset.x / containerRect.width) * 100,
                                        y: textPosition.y + (info.offset.y / containerRect.height) * 100
                                    });
                                }}
                                style={{
                                    x: 0,
                                    y: 0,
                                }}
                                className={`absolute inset-0 flex items-center justify-center ${isDraggingText ? 'cursor-grabbing' : 'cursor-grab'}`}
                            >
                                <div className="text-center px-8 select-none">
                                    <div className="flex items-center justify-center gap-2 mb-2 opacity-70">
                                        <Move className="w-4 h-4 text-white" />
                                        <span className="text-white text-xs">Arraste para mover</span>
                                    </div>
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
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Controles - EMBAIXO CENTRALIZADO */}
                <div className="w-full max-w-md mx-auto pb-6">
                    <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <h2 className={`text-2xl font-bold mb-6 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                            Editar Story
                        </h2>

                    <div className="space-y-4">
                        {/* Text Input */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Adicione um texto..."
                                    rows={2}
                                    maxLength={100}
                                    className="w-full px-4 py-3 pr-24 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-white/40 transition-colors text-base sm:text-lg"
                                />
                                <div className="absolute right-3 top-3 flex items-center gap-2">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <Smile className="w-5 h-5 text-white/50 hover:text-white/80" />
                                    </button>
                                    <Type className="w-5 h-5 text-white/50" />
                                </div>
                            </div>
                        </div>

                        {/* Emoji Picker */}
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 overflow-hidden"
                                >
                                    <div className="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto">
                                        {emojis.map((emoji, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setText(text + emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-white/10 rounded-lg"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Collapse/Expand Button */}
                        <button
                            onClick={() => setShowControls(!showControls)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            <span className="text-sm font-medium">
                                {showControls ? 'Ocultar Controles' : 'Mostrar Controles'}
                            </span>
                            {showControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {/* Color Palette - COLAPSÁVEL */}
                        <AnimatePresence>
                            {showControls && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 overflow-hidden"
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
                        )}
                        </AnimatePresence>

                        {/* BOTÃO POSTAR GRANDE - SEMPRE VISÍVEL COM ANIMAÇÃO */}
                        <motion.button
                            onClick={saveImage}
                            disabled={isPublishing}
                            whileTap={{ scale: 0.95 }}
                            animate={isPublishing ? {
                                scale: [1, 0.95, 1],
                                opacity: [1, 0.8, 1],
                            } : {}}
                            transition={{
                                duration: 1.5,
                                repeat: isPublishing ? Infinity : 0,
                                ease: "easeInOut"
                            }}
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
            </div>
        </motion.div>
    );
}
