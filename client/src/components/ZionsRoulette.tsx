import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Gift, Sparkles, Trophy, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import api from '../services/api';
import confetti from 'canvas-confetti';

interface RouletteItem {
    id: string;
    name: string;
    type: 'zions' | 'badge' | 'background' | 'color' | 'xp' | 'empty';
    value?: number; // For zions/xp amounts
    itemId?: string; // For cosmetic items
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    color: string;
    icon: React.ReactNode;
}

interface ZionsRouletteProps {
    isOpen: boolean;
    onClose: () => void;
}

// Roulette items pool
const rouletteItems: RouletteItem[] = [
    { id: '1', name: '50 Zions', type: 'zions', value: 50, rarity: 'common', color: '#22c55e', icon: <Zap className="w-6 h-6" /> },
    { id: '2', name: '100 Zions', type: 'zions', value: 100, rarity: 'common', color: '#22c55e', icon: <Zap className="w-6 h-6" /> },
    { id: '3', name: '200 Zions', type: 'zions', value: 200, rarity: 'rare', color: '#3b82f6', icon: <Zap className="w-6 h-6" /> },
    { id: '4', name: '500 Zions', type: 'zions', value: 500, rarity: 'epic', color: '#a855f7', icon: <Zap className="w-6 h-6" /> },
    { id: '5', name: '1000 Zions', type: 'zions', value: 1000, rarity: 'legendary', color: '#f59e0b', icon: <Zap className="w-6 h-6" /> },
    { id: '6', name: '50 XP', type: 'xp', value: 50, rarity: 'common', color: '#06b6d4', icon: <Star className="w-6 h-6" /> },
    { id: '7', name: '100 XP', type: 'xp', value: 100, rarity: 'common', color: '#06b6d4', icon: <Star className="w-6 h-6" /> },
    { id: '8', name: '250 XP', type: 'xp', value: 250, rarity: 'rare', color: '#3b82f6', icon: <Star className="w-6 h-6" /> },
    { id: '9', name: 'Nada :(', type: 'empty', rarity: 'common', color: '#6b7280', icon: <Gift className="w-6 h-6" /> },
    { id: '10', name: 'Badge Sortudo', type: 'badge', itemId: 'badge_lucky', rarity: 'rare', color: '#3b82f6', icon: <Trophy className="w-6 h-6" /> },
];

const SPIN_COST = 100; // Cost in Zions Points
const SPIN_DURATION = 5000; // 5 seconds spin

export default function ZionsRoulette({ isOpen, onClose }: ZionsRouletteProps) {
    const { user, theme, updateUserZions } = useAuth();
    const { getAccentColor } = useTierColors();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<RouletteItem | null>(null);
    const [rotation, setRotation] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wheelRef = useRef<HTMLDivElement>(null);

    const isMGT = user?.membershipType === 'MGT';
    getAccentColor(isMGT); // Call to avoid unused warning
    const isDarkMode = theme === 'dark';
    const canSpin = (user?.zionsPoints || 0) >= SPIN_COST;

    const handleSpin = async () => {
        if (isSpinning || !canSpin) return;

        setIsSpinning(true);
        setResult(null);
        setShowResult(false);
        setError(null);

        try {
            // Call API to spin
            const response = await api.post('/roulette/spin');
            const prize = response.data.prize;

            // Find matching item from pool
            const wonItem = rouletteItems.find(item => 
                (item.type === prize.type && item.value === prize.value) ||
                (item.type === prize.type && item.itemId === prize.itemId)
            ) || rouletteItems[8]; // Default to "nothing" if not found

            // Calculate rotation
            const itemIndex = rouletteItems.indexOf(wonItem);
            const segmentAngle = 360 / rouletteItems.length;
            const targetRotation = 360 * 5 + (itemIndex * segmentAngle) + (segmentAngle / 2);
            
            setRotation(prev => prev + targetRotation);

            // Wait for spin animation
            setTimeout(() => {
                setResult(wonItem);
                setShowResult(true);
                setIsSpinning(false);

                // Update user zions (deduct cost + add prize)
                updateUserZions(-SPIN_COST + (prize.zionsWon || 0));

                // Confetti for rare+ items
                if (wonItem.rarity !== 'common') {
                    confetti({
                        particleCount: wonItem.rarity === 'legendary' ? 150 : wonItem.rarity === 'epic' ? 100 : 50,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: [wonItem.color, '#ffffff', '#ffd700']
                    });
                }
            }, SPIN_DURATION);

        } catch (err: any) {
            setIsSpinning(false);
            setError(err.response?.data?.error || 'Erro ao girar a roleta');
        }
    };

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

    const segmentAngle = 360 / rouletteItems.length;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full max-w-lg ${isDarkMode ? 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-black' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} shadow-2xl overflow-hidden`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/10`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Roleta da Sorte
                                </h2>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Gire e ganhe prêmios!
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                        >
                            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col items-center">
                        {/* Roulette Wheel */}
                        <div className="relative w-72 h-72 mb-6">
                            {/* Pointer */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 drop-shadow-lg" />
                            </div>

                            {/* Wheel */}
                            <motion.div
                                ref={wheelRef}
                                className="w-full h-full rounded-full border-4 border-yellow-400 shadow-xl overflow-hidden"
                                style={{ 
                                    transform: `rotate(${rotation}deg)`,
                                    transition: isSpinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none'
                                }}
                            >
                                {/* Segments */}
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {rouletteItems.map((item, index) => {
                                        const startAngle = index * segmentAngle - 90;
                                        const endAngle = (index + 1) * segmentAngle - 90;
                                        const startRad = (startAngle * Math.PI) / 180;
                                        const endRad = (endAngle * Math.PI) / 180;
                                        
                                        const x1 = 50 + 45 * Math.cos(startRad);
                                        const y1 = 50 + 45 * Math.sin(startRad);
                                        const x2 = 50 + 45 * Math.cos(endRad);
                                        const y2 = 50 + 45 * Math.sin(endRad);
                                        
                                        const largeArc = segmentAngle > 180 ? 1 : 0;
                                        
                                        const midAngle = (startAngle + endAngle) / 2;
                                        const midRad = (midAngle * Math.PI) / 180;
                                        const textX = 50 + 30 * Math.cos(midRad);
                                        const textY = 50 + 30 * Math.sin(midRad);
                                        
                                        return (
                                            <g key={item.id}>
                                                <path
                                                    d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                                    fill={item.color}
                                                    stroke="#000"
                                                    strokeWidth="0.5"
                                                />
                                                <text
                                                    x={textX}
                                                    y={textY}
                                                    fill="white"
                                                    fontSize="3"
                                                    fontWeight="bold"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                                                    className="drop-shadow-sm"
                                                >
                                                    {item.name.length > 10 ? item.name.slice(0, 8) + '..' : item.name}
                                                </text>
                                            </g>
                                        );
                                    })}
                                    {/* Center circle */}
                                    <circle cx="50" cy="50" r="10" fill="#1a1a2e" stroke="#ffd700" strokeWidth="1" />
                                    <text x="50" y="51" fill="#ffd700" fontSize="5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                                        Z$
                                    </text>
                                </svg>
                            </motion.div>
                        </div>

                        {/* Result Display */}
                        <AnimatePresence>
                            {showResult && result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`mb-4 p-4 rounded-xl text-center ${
                                        result.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30' :
                                        result.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' :
                                        result.rarity === 'rare' ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30' :
                                        'bg-white/5 border border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2 mb-2" style={{ color: result.color }}>
                                        {result.icon}
                                        <span className="text-lg font-bold">{result.name}</span>
                                    </div>
                                    {result.type !== 'empty' && (
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {result.type === 'zions' && `+${result.value} Zions adicionados!`}
                                            {result.type === 'xp' && `+${result.value} XP ganhos!`}
                                            {result.type === 'badge' && 'Badge desbloqueado!'}
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Spin Button */}
                        <button
                            onClick={handleSpin}
                            disabled={isSpinning || !canSpin}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                                isSpinning 
                                    ? 'bg-gray-500 cursor-not-allowed' 
                                    : canSpin
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-purple-500/25'
                                        : 'bg-red-500/50 cursor-not-allowed'
                            }`}
                        >
                            {isSpinning ? (
                                <>
                                    <span className="animate-spin">⚡</span>
                                    Girando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Girar por {SPIN_COST} Zions
                                </>
                            )}
                        </button>

                        {/* Balance Info */}
                        <div className={`mt-4 flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span>Saldo: <strong className="text-yellow-400">{user?.zionsPoints?.toLocaleString() || 0}</strong> Zions</span>
                        </div>

                        {!canSpin && (
                            <p className="mt-2 text-xs text-red-400">
                                Zions insuficientes para girar
                            </p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
