import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    description?: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, description, type, onClose, duration = 4000 }: ToastProps) {
    const [visible, setVisible] = useState(false);
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    // Base styles
    const baseBg = theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]';
    const baseBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
    const baseText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const baseSubtext = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    // Type-specific styles
    const typeStyles = {
        success: {
            iconBg: isMGT ? 'bg-emerald-500/20' : 'bg-green-500/20',
            iconColor: isMGT ? 'text-emerald-500' : 'text-green-500',
            borderAccent: isMGT ? 'border-l-emerald-500' : 'border-l-green-500',
            shadow: isMGT ? 'shadow-emerald-500/10' : 'shadow-green-500/10',
            Icon: CheckCircle
        },
        error: {
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-500',
            borderAccent: 'border-l-red-500',
            shadow: 'shadow-red-500/10',
            Icon: XCircle
        },
        warning: {
            iconBg: isMGT ? 'bg-amber-500/20' : 'bg-gold-500/20',
            iconColor: isMGT ? 'text-amber-500' : 'text-gold-500',
            borderAccent: isMGT ? 'border-l-amber-500' : 'border-l-gold-500',
            shadow: isMGT ? 'shadow-amber-500/10' : 'shadow-gold-500/10',
            Icon: AlertTriangle
        },
        info: {
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-500',
            borderAccent: 'border-l-blue-500',
            shadow: 'shadow-blue-500/10',
            Icon: Info
        }
    };

    const style = typeStyles[type];
    const IconComponent = style.Icon;

    useEffect(() => {
        // Animate in
        const showTimer = setTimeout(() => setVisible(true), 50);

        // Auto close
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [onClose, duration]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div 
            className={`fixed top-6 right-6 z-[200] transition-all duration-300 transform ${
                visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
        >
            <div 
                className={`
                    flex items-start gap-3 
                    ${baseBg} 
                    border ${baseBorder} border-l-4 ${style.borderAccent}
                    rounded-lg 
                    p-4 
                    shadow-lg ${style.shadow}
                    backdrop-blur-sm
                    min-w-[320px] max-w-[420px]
                `}
            >
                {/* Icon */}
                <div className={`${style.iconBg} p-2 rounded-full shrink-0`}>
                    <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`font-medium ${baseText} text-sm`}>{message}</p>
                    {description && (
                        <p className={`${baseSubtext} text-xs mt-1 line-clamp-2`}>{description}</p>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className={`${baseSubtext} hover:${baseText} transition-colors p-1 rounded shrink-0`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
