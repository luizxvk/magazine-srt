import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Bell, Gift, MessageCircle, UserPlus, Trophy } from 'lucide-react';
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

// Individual notification component
function EdgeNotificationItem({ notification, onClose }: EdgeNotificationProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [progress, setProgress] = useState(100);
    const duration = notification.duration || 5000;

    // Type-specific styles and icons
    const typeConfig = {
        success: {
            icon: CheckCircle,
            gradient: isMGT 
                ? 'from-emerald-500/20 to-emerald-600/10' 
                : 'from-green-500/20 to-green-600/10',
            iconColor: isMGT ? 'text-emerald-400' : 'text-green-400',
            borderColor: isMGT ? 'border-emerald-500/30' : 'border-green-500/30',
            progressColor: isMGT ? 'bg-emerald-500' : 'bg-green-500'
        },
        error: {
            icon: XCircle,
            gradient: 'from-red-500/20 to-red-600/10',
            iconColor: 'text-red-400',
            borderColor: 'border-red-500/30',
            progressColor: 'bg-red-500'
        },
        warning: {
            icon: AlertTriangle,
            gradient: isMGT 
                ? 'from-amber-500/20 to-amber-600/10' 
                : 'from-yellow-500/20 to-yellow-600/10',
            iconColor: isMGT ? 'text-amber-400' : 'text-yellow-400',
            borderColor: isMGT ? 'border-amber-500/30' : 'border-yellow-500/30',
            progressColor: isMGT ? 'bg-amber-500' : 'bg-yellow-500'
        },
        info: {
            icon: Info,
            gradient: 'from-blue-500/20 to-blue-600/10',
            iconColor: 'text-blue-400',
            borderColor: 'border-blue-500/30',
            progressColor: 'bg-blue-500'
        },
        message: {
            icon: MessageCircle,
            gradient: isMGT 
                ? 'from-emerald-500/20 to-teal-600/10' 
                : 'from-gold-500/20 to-amber-600/10',
            iconColor: isMGT ? 'text-emerald-400' : 'text-gold-400',
            borderColor: isMGT ? 'border-emerald-500/30' : 'border-gold-500/30',
            progressColor: isMGT ? 'bg-emerald-500' : 'bg-gold-500'
        },
        friend: {
            icon: UserPlus,
            gradient: 'from-purple-500/20 to-pink-600/10',
            iconColor: 'text-purple-400',
            borderColor: 'border-purple-500/30',
            progressColor: 'bg-purple-500'
        },
        reward: {
            icon: Gift,
            gradient: isMGT 
                ? 'from-emerald-500/20 to-cyan-600/10' 
                : 'from-gold-500/20 to-orange-600/10',
            iconColor: isMGT ? 'text-emerald-400' : 'text-gold-400',
            borderColor: isMGT ? 'border-emerald-500/30' : 'border-gold-500/30',
            progressColor: isMGT ? 'bg-emerald-500' : 'bg-gold-500'
        },
        achievement: {
            icon: Trophy,
            gradient: 'from-yellow-500/20 to-orange-600/10',
            iconColor: 'text-yellow-400',
            borderColor: 'border-yellow-500/30',
            progressColor: 'bg-yellow-500'
        },
        system: {
            icon: Bell,
            gradient: theme === 'light' 
                ? 'from-gray-200/50 to-gray-300/30' 
                : 'from-white/10 to-white/5',
            iconColor: theme === 'light' ? 'text-gray-600' : 'text-gray-400',
            borderColor: theme === 'light' ? 'border-gray-300' : 'border-white/20',
            progressColor: theme === 'light' ? 'bg-gray-400' : 'bg-gray-500'
        }
    };

    const config = typeConfig[notification.type];
    const IconComponent = config.icon;

    useEffect(() => {
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
    }, [notification.id, duration, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full"
        >
            <div 
                className={`
                    relative overflow-hidden
                    w-full
                    ${theme === 'light' ? 'bg-white/95' : 'bg-[#1a1a1a]/95'}
                    backdrop-blur-xl
                    border ${config.borderColor}
                    rounded-2xl
                    shadow-2xl
                    ${theme === 'light' ? 'shadow-black/10' : 'shadow-black/50'}
                `}
            >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} pointer-events-none`} />

                {/* Content */}
                <div className="relative p-4 flex items-start gap-3">
                    {/* Avatar or Icon */}
                    {notification.avatar ? (
                        <img 
                            src={notification.avatar} 
                            alt="" 
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                        />
                    ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'}`}>
                            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                    )}

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'} truncate`}>
                            {notification.title}
                        </h4>
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} line-clamp-2 mt-0.5`}>
                            {notification.message}
                        </p>
                        
                        {/* Action Button */}
                        {notification.action && (
                            <button
                                onClick={() => {
                                    notification.action?.onClick();
                                    onClose(notification.id);
                                }}
                                className={`mt-2 text-xs font-medium ${config.iconColor} hover:underline`}
                            >
                                {notification.action.label}
                            </button>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => onClose(notification.id)}
                        className={`p-1 rounded-full ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'} transition-colors`}
                    >
                        <X className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                    <motion.div 
                        className={`h-full ${config.progressColor}`}
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.05 }}
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
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none px-4 pt-4 md:pt-6">
            <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
                <AnimatePresence mode="popLayout">
                    {notifications.map(notification => (
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
