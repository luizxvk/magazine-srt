import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Smile, Trash2, RotateCcw, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TextOverlay {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontWeight: 'normal' | 'bold';
    rotation: number;
}

interface StickerOverlay {
    id: string;
    emoji: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
}

interface StoryEditorProps {
    imageUrl: string;
    onPublish: (editedImageUrl: string) => void;
    onClose: () => void;
}

const STICKERS = ['🔥', '❤️', '😂', '🎉', '✨', '💯', '🚀', '💪', '🏆', '⚡', '🌟', '💎', '👑', '🎯', '💀', '👻'];
const TEXT_COLORS = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#9933ff'];

export default function StoryEditor({ imageUrl, onPublish, onClose }: StoryEditorProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
    const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
    const [activeMode, setActiveMode] = useState<'none' | 'text' | 'sticker'>('none');
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [newText, setNewText] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [dragging, setDragging] = useState<{ type: 'text' | 'sticker'; id: string } | null>(null);
    const [showStickerPicker, setShowStickerPicker] = useState(false);

    // Add text overlay
    const addText = () => {
        if (!newText.trim()) return;
        
        const newOverlay: TextOverlay = {
            id: `text-${Date.now()}`,
            text: newText,
            x: 50,
            y: 50,
            fontSize: 24,
            color: textColor,
            fontWeight: 'bold',
            rotation: 0,
        };
        
        setTextOverlays(prev => [...prev, newOverlay]);
        setNewText('');
        setActiveMode('none');
    };

    // Add sticker overlay
    const addSticker = (emoji: string) => {
        const newSticker: StickerOverlay = {
            id: `sticker-${Date.now()}`,
            emoji,
            x: 50,
            y: 50,
            size: 48,
            rotation: 0,
        };
        
        setStickerOverlays(prev => [...prev, newSticker]);
        setShowStickerPicker(false);
    };

    // Handle drag
    const handleDragStart = (type: 'text' | 'sticker', id: string) => {
        setDragging({ type, id });
    };

    const handleDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (!dragging || !containerRef.current) return;

        const container = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - container.left) / container.width) * 100;
        const y = ((clientY - container.top) / container.height) * 100;

        if (dragging.type === 'text') {
            setTextOverlays(prev => prev.map(t => 
                t.id === dragging.id ? { ...t, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : t
            ));
        } else {
            setStickerOverlays(prev => prev.map(s => 
                s.id === dragging.id ? { ...s, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : s
            ));
        }
    }, [dragging]);

    const handleDragEnd = () => {
        setDragging(null);
    };

    // Delete overlay
    const deleteText = (id: string) => {
        setTextOverlays(prev => prev.filter(t => t.id !== id));
        setSelectedTextId(null);
    };

    const deleteSticker = (id: string) => {
        setStickerOverlays(prev => prev.filter(s => s.id !== id));
    };

    // Generate final image
    const saveImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load background image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw background
            ctx.drawImage(img, 0, 0);

            // Draw text overlays
            textOverlays.forEach(overlay => {
                ctx.save();
                const x = (overlay.x / 100) * canvas.width;
                const y = (overlay.y / 100) * canvas.height;
                
                ctx.translate(x, y);
                ctx.rotate((overlay.rotation * Math.PI) / 180);
                
                ctx.font = `${overlay.fontWeight} ${overlay.fontSize * (canvas.width / 400)}px Arial`;
                ctx.fillStyle = overlay.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Text shadow for readability
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                ctx.fillText(overlay.text, 0, 0);
                ctx.restore();
            });

            // Draw stickers
            stickerOverlays.forEach(overlay => {
                ctx.save();
                const x = (overlay.x / 100) * canvas.width;
                const y = (overlay.y / 100) * canvas.height;
                
                ctx.translate(x, y);
                ctx.rotate((overlay.rotation * Math.PI) / 180);
                
                ctx.font = `${overlay.size * (canvas.width / 400)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(overlay.emoji, 0, 0);
                ctx.restore();
            });

            // Export with maximum quality
            const editedUrl = canvas.toDataURL('image/jpeg', 1.0);
            onPublish(editedUrl);
        };

        img.src = imageUrl;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black flex flex-col"
        >
            {/* Hidden canvas for export */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-50 shrink-0">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6 text-white" />
                </button>
                <h3 className="text-white font-medium drop-shadow-lg hidden sm:block">Sua Story</h3>
                <button 
                    onClick={saveImage}
                    className={`shrink-0 px-5 sm:px-6 py-2.5 rounded-full ${isMGT ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600'} text-white font-bold flex items-center gap-2 hover:scale-105 transition-all duration-200 shadow-lg shadow-black/50`}
                >
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">Enviar</span>
                </button>
            </div>

            {/* Editor Area - Fixed aspect ratio container for web */}
            <div 
                ref={containerRef}
                className="flex-1 relative overflow-hidden flex items-center justify-center pt-20"
                onMouseMove={dragging ? handleDrag : undefined}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchMove={dragging ? handleDrag : undefined}
                onTouchEnd={handleDragEnd}
            >
                {/* Background Image - Contained with max dimensions for web */}
                <div className="relative w-full h-full max-w-[500px] max-h-[calc(100vh-180px)] mx-auto">
                    <img 
                        src={imageUrl} 
                        alt="Story" 
                        className="w-full h-full object-contain"
                        draggable={false}
                    />

                    {/* Text Overlays - Inside the image container */}
                    {textOverlays.map(overlay => (
                        <div
                            key={overlay.id}
                            className={`absolute cursor-move select-none ${selectedTextId === overlay.id ? 'ring-2 ring-white' : ''}`}
                            style={{
                                left: `${overlay.x}%`,
                                top: `${overlay.y}%`,
                                transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
                                fontSize: overlay.fontSize,
                                color: overlay.color,
                                fontWeight: overlay.fontWeight,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            }}
                            onMouseDown={() => handleDragStart('text', overlay.id)}
                            onTouchStart={() => handleDragStart('text', overlay.id)}
                            onClick={() => setSelectedTextId(overlay.id)}
                        >
                            {overlay.text}
                            {selectedTextId === overlay.id && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteText(overlay.id); }}
                                    className="absolute -top-6 -right-6 p-1 bg-red-500 rounded-full"
                                >
                                    <Trash2 className="w-3 h-3 text-white" />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Sticker Overlays - Inside the image container */}
                    {stickerOverlays.map(overlay => (
                        <div
                            key={overlay.id}
                            className="absolute cursor-move select-none group"
                            style={{
                                left: `${overlay.x}%`,
                                top: `${overlay.y}%`,
                                transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
                                fontSize: overlay.size,
                            }}
                            onMouseDown={() => handleDragStart('sticker', overlay.id)}
                            onTouchStart={() => handleDragStart('sticker', overlay.id)}
                            onDoubleClick={() => deleteSticker(overlay.id)}
                        >
                            {overlay.emoji}
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                Duplo-clique para remover
                            </span>
                        </div>
                    ))}
                </div>

                {/* Sticker Picker - Outside the image container */}
                <AnimatePresence>
                    {showStickerPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 mx-4"
                        >
                            <div className="grid grid-cols-8 gap-2">
                                {STICKERS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => addSticker(emoji)}
                                        className="text-2xl p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Text Input - Outside the image container */}
                <AnimatePresence>
                    {activeMode === 'text' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 mx-4"
                        >
                            <input
                                type="text"
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                                placeholder="Digite seu texto..."
                                autoFocus
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 mb-3"
                                onKeyDown={(e) => e.key === 'Enter' && addText()}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 flex-wrap">
                                    {TEXT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setTextColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 ${textColor === color ? 'border-white' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={addText}
                                    disabled={!newText.trim()}
                                    className={`px-4 py-2 rounded-lg ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'} text-black font-medium disabled:opacity-50`}
                                >
                                    Adicionar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-center gap-6 p-4 border-t border-white/10 bg-black/80 shrink-0">
                <button
                    onClick={() => { setActiveMode(activeMode === 'text' ? 'none' : 'text'); setShowStickerPicker(false); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${activeMode === 'text' ? (isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400') : 'text-white hover:bg-white/10'}`}
                >
                    <Type className="w-6 h-6" />
                    <span className="text-[10px]">Texto</span>
                </button>
                <button
                    onClick={() => { setShowStickerPicker(!showStickerPicker); setActiveMode('none'); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${showStickerPicker ? (isMGT ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400') : 'text-white hover:bg-white/10'}`}
                >
                    <Smile className="w-6 h-6" />
                    <span className="text-[10px]">Stickers</span>
                </button>
                <button
                    onClick={() => { setTextOverlays([]); setStickerOverlays([]); }}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl text-white hover:bg-white/10 transition-colors"
                >
                    <RotateCcw className="w-6 h-6" />
                    <span className="text-[10px]">Limpar</span>
                </button>
            </div>
        </motion.div>
    );
}
