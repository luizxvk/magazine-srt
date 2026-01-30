import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Bell, MessageCircle, UserPlus, Trophy, Coins } from 'lucide-react';
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

// Individual notification component - Clean Apple Vision Pro style
function EdgeNotificationItem({ notification, onClose }: EdgeNotificationProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [progress, setProgress] = useState(100);
    const [isHovered, setIsHovered] = useState(false);
    const duration = notification.duration || 5000;

    // Drag to dismiss
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);

    // Type-specific styles - Clean and minimal
    const typeConfig = {
        success: {
            icon: CheckCircle,
            iconColor: isMGT ? 'text-emerald-400' : 'text-green-400',
            progressColor: isMGT ? 'bg-emerald-500' : 'bg-green-500',
        },
        error: {
            icon: XCircle,
            iconColor: 'text-red-400',
            progressColor: 'bg-red-500',
        },
        warning: {
            icon: AlertTriangle,
            iconColor: isMGT ? 'text-amber-400' : 'text-yellow-400',
            progressColor: isMGT ? 'bg-amber-500' : 'bg-yellow-500',
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-400',
            progressColor: 'bg-blue-500',
        },
        message: {
            icon: MessageCircle,
            iconColor: isMGT ? 'text-emerald-400' : 'text-amber-400',
            progressColor: isMGT ? 'bg-emerald-500' : 'bg-amber-500',
        },
        friend: {
            icon: UserPlus,
            iconColor: 'text-purple-400',
            progressColor: 'bg-purple-500',
        },
        reward: {
            icon: Coins,
            iconColor: isMGT ? 'text-emerald-400' : 'text-amber-400',
            progressColor: isMGT ? 'bg-emerald-500' : 'bg-amber-500',
        },
        achievement: {
            icon: Trophy,
            iconColor: isMGT ? 'text-emerald-400' : 'text-amber-400',
            progressColor: isMGT ? 'bg-emerald-500' : 'bg-amber-500',
        },
        system: {
            icon: Bell,
            iconColor: theme === 'light' ? 'text-gray-600' : 'text-gray-300',
            progressColor: 'bg-gray-500',
        }
    };

    const config = typeConfig[notification.type];
    const IconComponent = config.icon;

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

    return (
        <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.95, 
                transition: { duration: 0.15, ease: "easeOut" }
            }}
            transition={visionProSpring}
            style={{ x, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full cursor-grab active:cursor-grabbing"
        >
            {/* Apple Vision Pro Dark Glass Card */}
            <div 
                className={`
                    relative overflow-hidden w-full
                    ${theme === 'light' 
                        ? 'bg-white/90 border-gray-200/50' 
                        : 'bg-[#1c1c1e]/90 border-white/10'
                    }
                    backdrop-blur-2xl
                    border
                    rounded-2xl
                    shadow-xl
                    ${theme === 'light' ? 'shadow-black/5' : 'shadow-black/40'}
                `}
            >
                {/* Content */}
                <div className="relative p-3.5 flex items-center gap-3">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ ...visionProSpring, delay: 0.05 }}
                    >
                        {notification.avatar ? (
                            <img 
                                src={notification.avatar} 
                                alt="" 
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center 
                                ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'}
                            `}>
                                <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                            </div>
                        )}
                    </motion.div>

                    {/* Text Content */}
                    <motion.div 
                        className="flex-1 min-w-0"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...visionProSpring, delay: 0.1 }}
                    >
                        <h4 className={`font-medium text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'} truncate`}>
                            {notification.title}
                        </h4>
                        {notification.message && (
                            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/60'} line-clamp-1 mt-0.5`}>
                                {notification.message}
                            </p>
                        )}
                    </motion.div>

                    {/* Action Button */}
                    {notification.action && (
                        <motion.button
                            onClick={() => {
                                notification.action?.onClick();
                                onClose(notification.id);
                            }}
                            className={`
                                px-3 py-1.5 text-xs font-medium rounded-lg
                                ${theme === 'light' 
                                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                                    : 'bg-white/15 text-white hover:bg-white/20'
                                }
                                transition-colors duration-150
                            `}
                            whileTap={{ scale: 0.95 }}
                        >
                            {notification.action.label}
                        </motion.button>
                    )}

                    {/* Close Button */}
                    <motion.button
                        onClick={() => onClose(notification.id)}
                        className={`
                            p-1.5 rounded-full 
                            ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'} 
                            transition-colors duration-150
                        `}
                        whileTap={{ scale: 0.9 }}
                    >
                        <X className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`} />
                    </motion.button>
                </div>

                {/* Progress Bar - Subtle */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                    <motion.div 
                        className={`h-full ${config.progressColor}`}
                        style={{ width: `${progress}%` }}
                        initial={{ width: '100%' }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

// Container component that manages multiple notifications
interface EdgeNotificationContainerProps {
    notifications: EdgeNotificationData[];
    onClose: (id: string) => void;
}

export function EdgeNotificationContainer({ notifications, onClose }: EdgeNotificationContainerProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none px-4 pt-4 md:pt-6 safe-area-inset-top">
            <div className="max-w-sm mx-auto space-y-2 pointer-events-auto">
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
