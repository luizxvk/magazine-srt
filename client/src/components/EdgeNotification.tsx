import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Bell, MessageCircle, UserPlus, Trophy, Sparkles, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type EdgeNotificationType = 'success' | 'error' | 'warning' | 'info' | 'message' | 'friend' | 'reward' | 'achievement' | 'system';

export interface EdgeNotificationData {
    id: string;
    type: EdgeNotificationType;
    title: string;
    message: string;
    avatar?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    duration?: number;
}

interface EdgeNotificationProps {
    notification: EdgeNotificationData;
    onClose: (id: string) => void;
}

// Apple Vision Pro inspired spring config
const visionProSpring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
};

// Individual notification component with Vision Pro aesthetics
function EdgeNotificationItem({ notification, onClose }: EdgeNotificationProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [progress, setProgress] = useState(100);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const duration = notification.duration || 5000;

    // Mouse parallax effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-50, 50], [2, -2]);
    const rotateY = useTransform(mouseX, [-100, 100], [-2, 2]);
    const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
    const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

    // Drag to dismiss
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);

    // Type-specific styles and icons - Apple Vision Pro style
    const typeConfig = {
        success: {
            icon: CheckCircle,
            gradient: isMGT 
                ? 'from-emerald-400/30 via-emerald-500/20 to-teal-600/10' 
                : 'from-green-400/30 via-green-500/20 to-emerald-600/10',
            iconColor: isMGT ? 'text-emerald-400' : 'text-green-400',
            glowColor: isMGT ? 'shadow-emerald-500/30' : 'shadow-green-500/30',
            borderColor: isMGT ? 'border-emerald-400/40' : 'border-green-400/40',
            progressColor: isMGT ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-green-400 to-emerald-500',
            ringColor: isMGT ? 'ring-emerald-400/20' : 'ring-green-400/20'
        },
        error: {
            icon: XCircle,
            gradient: 'from-red-400/30 via-red-500/20 to-rose-600/10',
            iconColor: 'text-red-400',
            glowColor: 'shadow-red-500/30',
            borderColor: 'border-red-400/40',
            progressColor: 'bg-gradient-to-r from-red-400 to-rose-500',
            ringColor: 'ring-red-400/20'
        },
        warning: {
            icon: AlertTriangle,
            gradient: isMGT 
                ? 'from-amber-400/30 via-amber-500/20 to-orange-600/10' 
                : 'from-yellow-400/30 via-yellow-500/20 to-amber-600/10',
            iconColor: isMGT ? 'text-amber-400' : 'text-yellow-400',
            glowColor: isMGT ? 'shadow-amber-500/30' : 'shadow-yellow-500/30',
            borderColor: isMGT ? 'border-amber-400/40' : 'border-yellow-400/40',
            progressColor: isMGT ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-yellow-400 to-amber-500',
            ringColor: isMGT ? 'ring-amber-400/20' : 'ring-yellow-400/20'
        },
        info: {
            icon: Info,
            gradient: 'from-blue-400/30 via-blue-500/20 to-indigo-600/10',
            iconColor: 'text-blue-400',
            glowColor: 'shadow-blue-500/30',
            borderColor: 'border-blue-400/40',
            progressColor: 'bg-gradient-to-r from-blue-400 to-indigo-500',
            ringColor: 'ring-blue-400/20'
        },
        message: {
            icon: MessageCircle,
            gradient: isMGT 
                ? 'from-emerald-400/30 via-teal-500/20 to-cyan-600/10' 
                : 'from-amber-400/30 via-yellow-500/20 to-orange-600/10',
            iconColor: isMGT ? 'text-emerald-400' : 'text-amber-400',
            glowColor: isMGT ? 'shadow-emerald-500/30' : 'shadow-amber-500/30',
            borderColor: isMGT ? 'border-emerald-400/40' : 'border-amber-400/40',
            progressColor: isMGT ? 'bg-gradient-to-r from-emerald-400 to-cyan-500' : 'bg-gradient-to-r from-amber-400 to-orange-500',
            ringColor: isMGT ? 'ring-emerald-400/20' : 'ring-amber-400/20'
        },
        friend: {
            icon: UserPlus,
            gradient: 'from-purple-400/30 via-violet-500/20 to-pink-600/10',
            iconColor: 'text-purple-400',
            glowColor: 'shadow-purple-500/30',
            borderColor: 'border-purple-400/40',
            progressColor: 'bg-gradient-to-r from-purple-400 to-pink-500',
            ringColor: 'ring-purple-400/20'
        },
        reward: {
            icon: Coins,
            gradient: isMGT 
                ? 'from-emerald-400/30 via-teal-500/20 to-cyan-600/10' 
                : 'from-amber-400/30 via-yellow-500/20 to-orange-600/10',
            iconColor: isMGT ? 'text-emerald-400' : 'text-amber-400',
            glowColor: isMGT ? 'shadow-emerald-500/30' : 'shadow-amber-500/30',
            borderColor: isMGT ? 'border-emerald-400/40' : 'border-amber-400/40',
            progressColor: isMGT ? 'bg-gradient-to-r from-emerald-400 to-cyan-500' : 'bg-gradient-to-r from-amber-400 to-orange-500',
            ringColor: isMGT ? 'ring-emerald-400/20' : 'ring-amber-400/20'
        },
        achievement: {
            icon: Trophy,
            gradient: 'from-yellow-400/30 via-amber-500/20 to-orange-600/10',
            iconColor: 'text-yellow-400',
            glowColor: 'shadow-yellow-500/40',
            borderColor: 'border-yellow-400/50',
            progressColor: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500',
            ringColor: 'ring-yellow-400/30'
        },
        system: {
            icon: Bell,
            gradient: theme === 'light' 
                ? 'from-gray-300/50 via-gray-200/30 to-gray-100/20' 
                : 'from-white/15 via-white/10 to-white/5',
            iconColor: theme === 'light' ? 'text-gray-600' : 'text-gray-300',
            glowColor: theme === 'light' ? 'shadow-gray-400/20' : 'shadow-white/10',
            borderColor: theme === 'light' ? 'border-gray-300/50' : 'border-white/30',
            progressColor: theme === 'light' ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 'bg-gradient-to-r from-gray-400 to-gray-300',
            ringColor: theme === 'light' ? 'ring-gray-300/30' : 'ring-white/10'
        }
    };

    const config = typeConfig[notification.type];
    const IconComponent = config.icon;

    // Handle mouse move for parallax
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    }, [mouseX, mouseY, isDragging]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0);
        mouseY.set(0);
    }, [mouseX, mouseY]);

    useEffect(() => {
        if (isHovered) return; // Pause countdown on hover

        // Progress bar animation
        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev - (100 / (duration / 50));
                if (newProgress <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return newProgress;
            });
        }, 50);

        // Auto close
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [notification.id, duration, onClose, isHovered]);

    // Handle drag end
    const handleDragEnd = () => {
        setIsDragging(false);
        const currentX = x.get();
        if (Math.abs(currentX) > 100) {
            onClose(notification.id);
        }
    };

    const isAchievement = notification.type === 'achievement' || notification.type === 'reward';

    return (
        <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.8, rotateX: -15 }}
            animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1, 
                rotateX: 0,
            }}
            exit={{ 
                opacity: 0, 
                y: -30, 
                scale: 0.9, 
                rotateX: 10,
                transition: { duration: 0.2, ease: "easeIn" }
            }}
            transition={visionProSpring}
            style={{ x, opacity, rotateX: springRotateX, rotateY: springRotateY }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="w-full cursor-grab active:cursor-grabbing"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div 
                className={`
                    relative overflow-hidden
                    w-full
                    ${theme === 'light' 
                        ? 'bg-white/80' 
                        : 'bg-black/60'
                    }
                    backdrop-blur-2xl backdrop-saturate-150
                    border ${config.borderColor}
                    rounded-3xl
                    shadow-2xl ${config.glowColor}
                    ring-1 ${config.ringColor}
                    transition-shadow duration-300
                    ${isHovered ? 'shadow-3xl' : ''}
                `}
                style={{
                    perspective: '1000px',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Animated gradient background */}
                <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`}
                    animate={{
                        opacity: isHovered ? 1 : 0.8,
                    }}
                    transition={{ duration: 0.3 }}
                />

                {/* Glass reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl" />

                {/* Sparkle effect for achievements */}
                {isAchievement && (
                    <motion.div 
                        className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                                style={{
                                    left: `${15 + i * 15}%`,
                                    top: '50%',
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1.2, 0.5],
                                }}
                                transition={{
                                    duration: 1.5,
                                    delay: i * 0.15,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* Content */}
                <div className="relative p-4 flex items-start gap-3.5">
                    {/* Avatar or Icon with Vision Pro glow */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...visionProSpring, delay: 0.1 }}
                    >
                        {notification.avatar ? (
                            <div className="relative">
                                <div className={`absolute -inset-1 rounded-full blur-md ${config.progressColor} opacity-40`} />
                                <img 
                                    src={notification.avatar} 
                                    alt="" 
                                    className="relative w-11 h-11 rounded-full object-cover ring-2 ring-white/30"
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <div className={`absolute -inset-1 rounded-2xl blur-md ${config.progressColor} opacity-30`} />
                                <div className={`
                                    relative w-11 h-11 rounded-2xl flex items-center justify-center 
                                    ${theme === 'light' ? 'bg-white/60' : 'bg-white/10'}
                                    backdrop-blur-sm
                                    ring-1 ${config.ringColor}
                                `}>
                                    <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Text Content */}
                    <motion.div 
                        className="flex-1 min-w-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...visionProSpring, delay: 0.15 }}
                    >
                        <div className="flex items-center gap-2">
                            <h4 className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'} truncate`}>
                                {notification.title}
                            </h4>
                            {isAchievement && (
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    <Sparkles className="w-4 h-4 text-yellow-400" />
                                </motion.div>
                            )}
                        </div>
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-white/70'} line-clamp-2 mt-0.5 leading-relaxed`}>
                            {notification.message}
                        </p>
                        
                        {/* Action Button */}
                        {notification.action && (
                            <motion.button
                                onClick={() => {
                                    notification.action?.onClick();
                                    onClose(notification.id);
                                }}
                                className={`
                                    mt-2.5 px-3 py-1.5 text-xs font-medium rounded-full
                                    ${config.progressColor} text-white
                                    shadow-lg ${config.glowColor}
                                    hover:shadow-xl hover:scale-105
                                    active:scale-95
                                    transition-all duration-200
                                `}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {notification.action.label}
                            </motion.button>
                        )}
                    </motion.div>

                    {/* Close Button */}
                    <motion.button
                        onClick={() => onClose(notification.id)}
                        className={`
                            p-1.5 rounded-full 
                            ${theme === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/10'} 
                            transition-all duration-200
                            opacity-50 hover:opacity-100
                        `}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <X className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`} />
                    </motion.button>
                </div>

                {/* Progress Bar - Vision Pro style */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                    <motion.div 
                        className={`h-full ${config.progressColor}`}
                        style={{ width: `${progress}%` }}
                        initial={{ width: '100%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.05, ease: 'linear' }}
                    />
                    {/* Glow effect on progress bar */}
                    <motion.div 
                        className={`absolute top-0 right-0 w-8 h-full ${config.progressColor} blur-md opacity-60`}
                        style={{ right: `${100 - progress}%` }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

// Container component that manages multiple notifications with stacking
interface EdgeNotificationContainerProps {
    notifications: EdgeNotificationData[];
    onClose: (id: string) => void;
}

export function EdgeNotificationContainer({ notifications, onClose }: EdgeNotificationContainerProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none px-4 pt-4 md:pt-6 safe-area-inset-top">
            <div className="max-w-sm mx-auto space-y-3 pointer-events-auto">
                <AnimatePresence mode="popLayout">
                    {notifications.slice(0, 3).map((notification) => (
                        <EdgeNotificationItem
                            key={notification.id}
                            notification={notification}
                            onClose={onClose}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default EdgeNotificationItem;
