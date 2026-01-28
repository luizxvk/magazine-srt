import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File;
    onCropComplete: (croppedImageUrl: string) => void;
}

export default function ImageCropModal({ isOpen, onClose, imageFile, onCropComplete }: ImageCropModalProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    // Theme colors
    const modalBg = theme === 'light' ? 'bg-white/95' : 'bg-[#0a0a0a]/95';
    const borderColor = theme === 'light' ? 'border-gray-200' : 'border-white/10';
    const headerBorderColor = theme === 'light' ? 'border-gray-200' : 'border-white/5';
    const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textColor = theme === 'light' ? 'text-gray-600' : 'text-gray-500';
    const iconColor = theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white';
    const buttonBg = theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10';
    const buttonText = theme === 'light' ? 'text-gray-700' : 'text-white';
    const canvasBorder = theme === 'light' ? 'border-gray-300' : 'border-white/20';
    const guideBorder = theme === 'light' ? 'border-gray-400/50' : 'border-white/30';
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    
    const [imageUrl, setImageUrl] = useState<string>('');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const cropSize = 200; // Final cropped image size
    const viewSize = 280; // Display area size
    
    // Load image when file changes
    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImageUrl(url);
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setImageLoaded(false);
            
            return () => URL.revokeObjectURL(url);
        }
    }, [imageFile]);
    
    // Draw image on canvas
    const drawImage = useCallback(() => {
        if (!canvasRef.current || !imageRef.current || !imageLoaded) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = imageRef.current;
        
        // Clear canvas
        ctx.clearRect(0, 0, viewSize, viewSize);
        
        // Fill with background color based on theme
        ctx.fillStyle = theme === 'light' ? '#f5f5f5' : '#0a0a0a';
        ctx.fillRect(0, 0, viewSize, viewSize);
        
        // Calculate scaled dimensions
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;
        
        // Center the image
        const x = (viewSize - scaledWidth) / 2 + position.x;
        const y = (viewSize - scaledHeight) / 2 + position.y;
        
        // Draw image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Draw circular mask overlay
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(viewSize / 2, viewSize / 2, viewSize / 2 - 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }, [scale, position, imageLoaded, viewSize, theme]);
    
    useEffect(() => {
        drawImage();
    }, [drawImage]);
    
    const handleImageLoad = () => {
        setImageLoaded(true);
        
        // Auto-ajustar zoom para fotos paisagem/retrato cobrirem o círculo
        if (imageRef.current) {
            const img = imageRef.current;
            const circleSize = viewSize - 40; // tamanho do círculo de crop
            const minDimension = Math.min(img.naturalWidth, img.naturalHeight);
            
            // Calcular escala necessária para cobrir o círculo
            const neededScale = circleSize / minDimension;
            
            // Se a imagem é muito grande, começar com escala menor
            // Se é muito pequena para cobrir o círculo, aumentar
            if (neededScale > 1) {
                setScale(neededScale);
            } else if (neededScale < 0.5) {
                setScale(0.5);
            } else {
                setScale(1);
            }
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y
        });
    };
    
    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.1, 5));
    };
    
    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.1, 0.1));
    };
    
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };
    
    const handleCrop = () => {
        if (!canvasRef.current || !imageRef.current || !imageLoaded) return;
        
        // Create output canvas for final cropped image
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = cropSize;
        outputCanvas.height = cropSize;
        const outputCtx = outputCanvas.getContext('2d');
        if (!outputCtx) return;
        
        const img = imageRef.current;
        
        // Calculate scaled dimensions
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;
        
        // Calculate crop region
        const scaleFactor = cropSize / (viewSize - 40);
        const cropX = (viewSize - scaledWidth) / 2 + position.x - 20;
        const cropY = (viewSize - scaledHeight) / 2 + position.y - 20;
        
        // Fill with transparent background
        outputCtx.clearRect(0, 0, cropSize, cropSize);
        
        // Draw image to output canvas
        outputCtx.drawImage(
            img,
            cropX * scaleFactor,
            cropY * scaleFactor,
            scaledWidth * scaleFactor,
            scaledHeight * scaleFactor
        );
        
        // Apply circular mask
        outputCtx.globalCompositeOperation = 'destination-in';
        outputCtx.beginPath();
        outputCtx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
        outputCtx.fill();
        outputCtx.globalCompositeOperation = 'source-over';
        
        // Convert to data URL
        const croppedUrl = outputCanvas.toDataURL('image/png', 0.9);
        onCropComplete(croppedUrl);
        onClose();
    };
    
    if (typeof document === 'undefined') return null;
    
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={`relative w-full max-w-sm ${modalBg} border ${borderColor} rounded-2xl shadow-2xl overflow-hidden`}
                    >
                        {/* Header */}
                        <div className={`p-4 border-b ${headerBorderColor} flex justify-between items-center`}>
                            <h3 className={`${titleColor} font-serif text-lg`}>Ajustar Foto</h3>
                            <button
                                onClick={onClose}
                                className={`${iconColor} transition-colors p-1`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Hidden image for loading */}
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Preview"
                            onLoad={handleImageLoad}
                            className="hidden"
                        />
                        
                        {/* Canvas Area */}
                        <div className="p-6 flex flex-col items-center">
                            <div 
                                className="relative cursor-move"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleMouseUp}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={viewSize}
                                    height={viewSize}
                                    className={`rounded-full border-2 ${canvasBorder}`}
                                />
                                {/* Circular guide overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className={`w-full h-full rounded-full border-2 border-dashed ${guideBorder}`} />
                                </div>
                            </div>
                            
                            <p className={`${textColor} text-xs mt-3 text-center`}>
                                Arraste para mover • Use os controles para ajustar
                            </p>
                        </div>
                        
                        {/* Controls */}
                        <div className="px-6 pb-4 flex justify-center gap-3">
                            <button
                                onClick={handleZoomOut}
                                className={`p-2.5 ${buttonBg} rounded-full ${buttonText} transition-colors border ${borderColor}`}
                                title="Diminuir"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleReset}
                                className={`p-2.5 ${buttonBg} rounded-full ${buttonText} transition-colors border ${borderColor}`}
                                title="Resetar"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleZoomIn}
                                className={`p-2.5 ${buttonBg} rounded-full ${buttonText} transition-colors border ${borderColor}`}
                                title="Aumentar"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Footer */}
                        <div className={`p-4 border-t ${headerBorderColor} flex justify-end gap-3 ${theme === 'light' ? 'bg-gray-50' : 'bg-black/20'}`}>
                            <button
                                onClick={onClose}
                                className={`px-5 py-2 rounded-full text-sm font-medium ${buttonText} ${buttonBg} transition-colors border ${borderColor}`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCrop}
                                disabled={!imageLoaded}
                                className={`px-6 py-2 rounded-full text-sm font-medium text-black transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isMGT 
                                        ? 'bg-emerald-500 hover:bg-emerald-400' 
                                        : 'bg-gold-500 hover:bg-gold-400'
                                }`}
                            >
                                <Check className="w-4 h-4" />
                                Aplicar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
