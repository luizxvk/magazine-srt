import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Headphones, 
    X, 
    MessageCircle, 
    Mail, 
    ExternalLink,
    Sparkles,
    Clock,
    CheckCircle2,
    Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ChatWindow from './ChatWindow';

// WhatsApp number for support
const SUPPORT_WHATSAPP = '+551999269715';
const SUPPORT_EMAIL = 'suporte@magazinemgt.com';

// Admin info for internal chat
interface AdminInfo {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    membershipType?: string;
    equippedProfileBorder?: string | null;
}

export default function SupportButton() {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [isOpen, setIsOpen] = useState(false);
    const [isAdminOnline, setIsAdminOnline] = useState(false);
    const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
    const [showChat, setShowChat] = useState(false);

    // Calculate position based on window width
    const [bottomPosition, setBottomPosition] = useState('24px');
    
    useEffect(() => {
        const updatePosition = () => {
            // If mobile (less than 1024px), position above bottom nav
            setBottomPosition(window.innerWidth < 1024 ? '100px' : '24px');
        };
        
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, []);

    // Check if any admin is online (with error handling)
    useEffect(() => {
        let mounted = true;
        
        const checkAdminOnline = async () => {
            try {
                const { data } = await api.get('/users/admin-online');
                if (mounted) {
                    setIsAdminOnline(data?.isOnline || false);
                    if (data?.admin) {
                        setAdminInfo(data.admin);
                    }
                }
            } catch (error) {
                // Silently fail - don't crash the component
                console.log('Could not check admin status');
            }
        };

        // Delay initial check to not block render
        const timeout = setTimeout(checkAdminOnline, 1000);
        const interval = setInterval(checkAdminOnline, 30000);
        
        return () => {
            mounted = false;
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    // Theme colors
    const accentColorHex = isMGT ? '#10b981' : '#D4AF37';
    const gradientFrom = isMGT ? '#10b981' : '#f59e0b';
    const gradientTo = isMGT ? '#0d9488' : '#ca8a04';

    // Support options
    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            `Olá! Preciso de suporte.\n\nUsuário: ${user?.displayName || user?.name || 'Visitante'}\nEmail: ${user?.email || 'Não logado'}`
        );
        window.open(`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=${message}`, '_blank');
        setIsOpen(false);
    };

    const handleEmail = () => {
        const subject = encodeURIComponent('Suporte Magazine MGT');
        const body = encodeURIComponent(
            `Olá, equipe de suporte!\n\nUsuário: ${user?.displayName || user?.name || 'Visitante'}\nEmail: ${user?.email || 'Não informado'}\n\nDescreva seu problema:\n\n`
        );
        window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
        setIsOpen(false);
    };

    const handleChat = () => {
        if (adminInfo) {
            setShowChat(true);
            setIsOpen(false);
        }
    };

    const panelBottom = window.innerWidth < 1024 ? '170px' : '90px';

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                        style={{ zIndex: 10000 }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Support Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{
                            position: 'fixed',
                            bottom: panelBottom,
                            right: '16px',
                            zIndex: 10001,
                            width: 'min(calc(100vw - 32px), 320px)',
                        }}
                        className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div 
                            className="px-5 py-4 border-b border-white/5"
                            style={{ background: `linear-gradient(135deg, ${accentColorHex}20, transparent)` }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                                        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                                    >
                                        <Headphones className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">Suporte</h3>
                                        <p className="text-white/50 text-xs flex items-center gap-1">
                                            <span 
                                                className={`w-1.5 h-1.5 rounded-full ${isAdminOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} 
                                            />
                                            {isAdminOnline ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="p-3 space-y-2">
                            {/* WhatsApp - Recommended */}
                            <button
                                onClick={handleWhatsApp}
                                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group relative"
                            >
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
                                    style={{ 
                                        background: `linear-gradient(135deg, ${accentColorHex}30, transparent)`,
                                        color: accentColorHex,
                                        border: `1px solid ${accentColorHex}40`
                                    }}
                                >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Recomendado
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5" style={{ color: accentColorHex }} />
                                    </div>
                                    <div>
                                        <span className="text-white font-medium text-sm">WhatsApp</span>
                                        <p className="text-white/40 text-xs">Resposta rápida em minutos</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-white/20 ml-auto" />
                                </div>
                            </button>

                            {/* Email */}
                            <button
                                onClick={handleEmail}
                                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Mail className="w-5 h-5" style={{ color: accentColorHex }} />
                                    </div>
                                    <div>
                                        <span className="text-white font-medium text-sm">E-mail</span>
                                        <p className="text-white/40 text-xs">Para assuntos detalhados</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-white/20 ml-auto" />
                                </div>
                            </button>

                            {/* Chat Interno */}
                            <button
                                onClick={handleChat}
                                disabled={!adminInfo}
                                className={`w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left ${!adminInfo ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Send className="w-5 h-5" style={{ color: accentColorHex }} />
                                    </div>
                                    <div>
                                        <span className="text-white font-medium text-sm">Chat</span>
                                        <p className="text-white/40 text-xs">
                                            {adminInfo ? 'Fale direto com a equipe' : 'Admin offline'}
                                        </p>
                                    </div>
                                    {isAdminOnline && (
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto" />
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Footer */}
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

            {/* Floating Button - Always visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: bottomPosition,
                    right: '16px',
                    zIndex: 10001,
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                    boxShadow: `0 8px 32px ${accentColorHex}40, 0 4px 16px rgba(0,0,0,0.3)`,
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                aria-label="Abrir suporte"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <Headphones className="w-6 h-6 text-white" />
                )}
                
                {/* Online indicator */}
                {isAdminOnline && !isOpen && (
                    <span 
                        style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '12px',
                            height: '12px',
                            background: '#22c55e',
                            borderRadius: '50%',
                            border: '2px solid #171717',
                        }}
                        className="animate-pulse"
                    />
                )}
            </button>

            {/* Support Chat Window */}
            {showChat && adminInfo && (
                <ChatWindow
                    otherUserId={adminInfo.id}
                    otherUserName={adminInfo.displayName || adminInfo.name}
                    otherUserAvatar={adminInfo.avatarUrl}
                    otherUserMembershipType={adminInfo.membershipType}
                    otherUserProfileBorder={adminInfo.equippedProfileBorder}
                    onClose={() => setShowChat(false)}
                    isSupport={true}
                />
            )}
        </>
    );
}
