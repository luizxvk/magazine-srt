import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Palette, BarChart3, Shield, Ticket, Star, Zap, PanelRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const CURRENT_VERSION = '0.5.0-rc.10';

interface UpdateItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    isNew?: boolean;
}

interface WhatsNewModalProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function WhatsNewModal({ isOpen: externalIsOpen, onClose: externalOnClose }: WhatsNewModalProps = {}) {
    const { user, accentColor: userAccentColor, accentGradient } = useAuth();
    const location = useLocation();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isMGT = user?.membershipType === 'MGT';

    // Use external state if provided, otherwise use internal state
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    // Theme-aware styling with user's custom accent gradient
    const hasCustomGradient = !!accentGradient;
    const gradientFrom = isMGT ? 'from-emerald-500' : 'from-yellow-500';
    const gradientTo = isMGT ? 'to-emerald-600' : 'to-yellow-600';
    const accentTextColor = isMGT ? 'text-emerald-400' : 'text-yellow-400';
    const bgAccent = isMGT ? 'bg-emerald-500/10' : 'bg-yellow-500/10';
    const borderAccent = isMGT ? 'border-emerald-500/30' : 'border-yellow-500/30';

    // Compute dynamic gradient styles for buttons and icons
    const gradientStyle = hasCustomGradient 
        ? { background: accentGradient } 
        : undefined;
    const iconStyle = hasCustomGradient 
        ? { color: userAccentColor } 
        : undefined;

    // v0.5.0-rc.10 - Feed Cards Customization, StatForge Accent Icons, i18n
    const updates: UpdateItem[] = [
        {
            icon: <PanelRight className="w-5 h-5 text-blue-400" />,
            title: 'Personalização dos Cards do Feed',
            description: 'Agora você pode mostrar/ocultar e reordenar os cards da sidebar do feed nas configurações!',
            isNew: true
        },
        {
            icon: <Palette className="w-5 h-5 text-pink-400" />,
            title: 'StatForge — Ícones Coloridos',
            description: 'Ícones dos jogos no StatForge agora seguem sua cor de destaque personalizada com efeito glow!',
            isNew: true
        },
        {
            icon: <Globe className="w-5 h-5 text-cyan-400" />,
            title: 'Traduções Expandidas',
            description: 'Novas traduções para StatForge, moderação e cards do feed em português, inglês e espanhol.',
            isNew: true
        },
        {
            icon: <Star className="w-5 h-5 text-yellow-400" />,
            title: 'Sistema de Prestígio — Guia Completo',
            description: 'Modal explicando como funciona o prestígio, recompensas e tabela de bônus de XP!',
        },
        {
            icon: <Zap className="w-5 h-5 text-purple-400" />,
            title: 'Cards com Brilho Animado',
            description: 'Cards de Market, Feedback, Jogos Grátis e Grupos com bordas brilhantes sincronizadas!',
        },
        {
            icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
            title: 'StatForge — Melhorias',
            description: 'Logo maior, card de notificações e correções no rastreador de stats.',
        },
        {
            icon: <Ticket className="w-5 h-5 text-green-400" />,
            title: 'Sistema de Cupons na Loja',
            description: 'Cupons de desconto (fixo ou %). Membros Elite ganham cupom mensal de R$10!',
        },
        {
            icon: <Shield className="w-5 h-5 text-emerald-400" />,
            title: 'RovexShield — Moderação Automática',
            description: 'Sistema de moderação com IA (Perspective API + NSFWJS) + blacklist customizada.',
        },
    ];

    useEffect(() => {
        // Only auto-show if using internal state (no external control)
        if (externalIsOpen !== undefined) return;

        // Só mostrar se: usuário logado E NÃO está na tela de login/register
        const isAuthPage = ['/', '/login', '/register', '/request-invite'].includes(location.pathname);

        if (user && !isAuthPage) {
            const lastSeenVersion = localStorage.getItem('whatsNewVersion');
            if (lastSeenVersion !== CURRENT_VERSION) {
                // Delay para não conflitar com outros modais
                const timer = setTimeout(() => setInternalIsOpen(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, location.pathname, externalIsOpen]);

    const handleClose = () => {
        localStorage.setItem('whatsNewVersion', CURRENT_VERSION);
        if (externalOnClose) {
            externalOnClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header com gradiente - usa gradient customizado se disponível */}
                <div 
                    className={`relative p-6 pb-12 ${!hasCustomGradient ? `bg-gradient-to-r ${gradientFrom} ${gradientTo}` : ''}`}
                    style={hasCustomGradient ? { background: accentGradient } : undefined}
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-white">Novidades v{CURRENT_VERSION}</h2>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold uppercase">BETA</span>
                            </div>
                            <p className="text-white/80 text-sm">Confira o que há de novo!</p>
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6 -mt-6">
                    <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        {updates.map((update, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-3 p-3 rounded-xl ${bgAccent} border ${borderAccent}`}
                            >
                                <div 
                                className={`p-2 rounded-lg bg-zinc-800 shrink-0 ${!hasCustomGradient ? accentTextColor : ''}`}
                                style={iconStyle}
                            >
                                    {update.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-white text-sm">{update.title}</h3>
                                        {update.isNew && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                                                NOVO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-zinc-400 text-xs">{update.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer - botão com gradient customizado */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleClose}
                        className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${!hasCustomGradient ? `bg-gradient-to-r ${gradientFrom} ${gradientTo}` : ''}`}
                        style={gradientStyle}
                    >
                        <Check className="w-5 h-5" />
                        Vamos lá!
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
