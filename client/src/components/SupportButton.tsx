import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Headphones, 
    X, 
    MessageCircle, 
    Mail, 
    Phone, 
    ExternalLink,
    Sparkles,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Apple Vision Pro spring animation config
const visionProSpring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
};

// WhatsApp number for support
const SUPPORT_WHATSAPP = '+551999269715';
const SUPPORT_EMAIL = 'suporte@magazinemgt.com';

interface SupportOption {
    id: string;
    label: string;
    description: string;
    icon: typeof MessageCircle;
    action: () => void;
    badge?: string;
    recommended?: boolean;
}

export default function SupportButton() {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [hasNewMessage] = useState(false);

    // Hide button when scrolling down, show when scrolling up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Theme colors
    const accentColor = isMGT ? 'emerald' : 'amber';
    const accentColorHex = isMGT ? '#10b981' : '#D4AF37';

    // Support options
    const supportOptions: SupportOption[] = [
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            description: 'Resposta rápida em minutos',
            icon: MessageCircle,
            action: () => {
                const message = encodeURIComponent(
                    `Olá! Preciso de suporte.\n\nUsuário: ${user?.displayName || user?.name || 'Visitante'}\nEmail: ${user?.email || 'Não logado'}`
                );
                window.open(`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=${message}`, '_blank');
                setIsOpen(false);
            },
            badge: 'Mais rápido',
            recommended: true,
        },
        {
            id: 'email',
            label: 'E-mail',
            description: 'Para assuntos detalhados',
            icon: Mail,
            action: () => {
                const subject = encodeURIComponent('Suporte Magazine MGT');
                const body = encodeURIComponent(
                    `Olá, equipe de suporte!\n\nUsuário: ${user?.displayName || user?.name || 'Visitante'}\nEmail: ${user?.email || 'Não informado'}\n\nDescreva seu problema:\n\n`
                );
                window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
                setIsOpen(false);
            },
        },
        {
            id: 'call',
            label: 'Ligar',
            description: 'Atendimento por voz',
            icon: Phone,
            action: () => {
                window.open(`tel:${SUPPORT_WHATSAPP}`, '_blank');
                setIsOpen(false);
            },
        },
    ];

    // Glassmorphism classes - Apple Vision Pro style
    const glassPanel = `
        bg-black/40 
        backdrop-blur-2xl 
        border border-white/10 
        shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
    `;

    const glassButton = `
        bg-white/5 
        hover:bg-white/10 
        backdrop-blur-xl 
        border border-white/10 
        hover:border-white/20
        transition-all duration-300
    `;

    return (
        <>
            {/* Backdrop when menu is open */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Support Menu Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={visionProSpring}
                        className={`
                            fixed bottom-24 right-4 sm:right-6 z-[9999]
                            w-[calc(100vw-2rem)] sm:w-80
                            ${glassPanel}
                            rounded-3xl overflow-hidden
                        `}
                    >
                        {/* Header with gradient accent */}
                        <div className={`
                            relative px-5 py-4 
                            bg-gradient-to-r ${isMGT ? 'from-emerald-500/20 to-teal-500/10' : 'from-amber-500/20 to-yellow-500/10'}
                            border-b border-white/5
                        `}>
                            {/* Decorative glow */}
                            <div 
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full blur-sm"
                                style={{ backgroundColor: accentColorHex, opacity: 0.5 }}
                            />
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-10 h-10 rounded-2xl 
                                        bg-gradient-to-br ${isMGT ? 'from-emerald-500 to-teal-600' : 'from-amber-500 to-yellow-600'}
                                        flex items-center justify-center
                                        shadow-lg
                                    `}>
                                        <Headphones className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-base">Suporte</h3>
                                        <p className="text-white/50 text-xs flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                            Online agora
                                        </p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>
                        </div>

                        {/* Support Options */}
                        <div className="p-3 space-y-2">
                            {supportOptions.map((option, index) => {
                                const Icon = option.icon;
                                
                                return (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, ...visionProSpring }}
                                        onClick={option.action}
                                        className={`
                                            w-full p-3 rounded-2xl text-left
                                            ${glassButton}
                                            group relative overflow-hidden
                                            ${option.recommended ? `ring-1 ring-${accentColor}-500/30` : ''}
                                        `}
                                    >
                                        {/* Recommended badge */}
                                        {option.recommended && (
                                            <div className={`
                                                absolute top-2 right-2
                                                px-2 py-0.5 rounded-full
                                                bg-gradient-to-r ${isMGT ? 'from-emerald-500/20 to-teal-500/20' : 'from-amber-500/20 to-yellow-500/20'}
                                                border border-${accentColor}-500/30
                                                text-[10px] font-medium ${isMGT ? 'text-emerald-400' : 'text-amber-400'}
                                                flex items-center gap-1
                                            `}>
                                                <Sparkles className="w-2.5 h-2.5" />
                                                Recomendado
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                w-10 h-10 rounded-xl 
                                                bg-white/5 group-hover:bg-white/10
                                                flex items-center justify-center
                                                transition-colors
                                            `}>
                                                <Icon className={`w-5 h-5 ${isMGT ? 'text-emerald-400' : 'text-amber-400'}`} />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium text-sm">
                                                        {option.label}
                                                    </span>
                                                    {option.badge && !option.recommended && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] text-white/50">
                                                            {option.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-white/40 text-xs truncate">
                                                    {option.description}
                                                </p>
                                            </div>

                                            <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Footer info */}
                        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between text-xs text-white/30">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    <span>Seg-Sex: 9h às 18h</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                                    <span>~5min resposta</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Support Button */}
            <AnimatePresence>
                {isVisible && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={visionProSpring}
                        onClick={() => setIsOpen(!isOpen)}
                        className={`
                            fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999]
                            w-14 h-14 rounded-2xl
                            bg-gradient-to-br ${isMGT ? 'from-emerald-500 to-teal-600' : 'from-amber-500 to-yellow-600'}
                            shadow-[0_8px_24px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]
                            flex items-center justify-center
                            group relative overflow-hidden
                            border border-white/20
                        `}
                        style={{
                            boxShadow: `0 8px 32px ${accentColorHex}40, 0 4px 16px rgba(0,0,0,0.3)`,
                        }}
                        aria-label="Abrir suporte"
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Pulse ring */}
                        <div 
                            className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                            style={{ backgroundColor: accentColorHex }}
                        />
                        
                        {/* Icon with rotation animation on open */}
                        <motion.div
                            animate={{ rotate: isOpen ? 135 : 0 }}
                            transition={visionProSpring}
                        >
                            {isOpen ? (
                                <X className="w-6 h-6 text-white" />
                            ) : (
                                <Headphones className="w-6 h-6 text-white" />
                            )}
                        </motion.div>

                        {/* Notification badge */}
                        {hasNewMessage && !isOpen && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-neutral-900"
                            >
                                <span className="text-[10px] font-bold text-white">1</span>
                            </motion.div>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}
