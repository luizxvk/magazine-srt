import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Swords, ChevronLeft, ChevronRight, Video, Film, LayoutDashboard, PanelRight, Users, Dices, Eye, Megaphone, Palette, Volume2, Smartphone, Bell, MessageSquareText, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import { useLocation } from 'react-router-dom';

const CURRENT_VERSION = '0.5.0-rc.17';

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
    const { user, accentColor: userAccentColor, accentGradient, theme } = useAuth();
    const { getAccentColor } = useTierColors();
    const location = useLocation();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const isMGT = user?.membershipType === 'MGT';

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    // Apple Vision Pro styling
    const isLight = theme === 'light';
    const defaultAccent = getAccentColor(isMGT);
    const accentColor = userAccentColor || defaultAccent;
    const cardBg = isLight ? 'bg-white/95' : 'bg-[#1c1c1e]/95';
    const textMain = isLight ? 'text-gray-900' : 'text-white';
    const textSub = isLight ? 'text-gray-600' : 'text-gray-400';
    const borderColor = isLight ? 'border-gray-200' : 'border-white/10';
    const itemBg = isLight ? 'bg-gray-50' : 'bg-white/[0.03]';
    const itemBorder = isLight ? 'border-gray-100' : 'border-white/5';

    // Page 1 - Main Features
    const page1Updates: UpdateItem[] = [
        {
            icon: <Wifi className="w-5 h-5" />,
            title: 'Rovex Connect Aprimorado',
            description: 'Título com fonte Social, bordas e badges nos perfis de membros do Connect.',
            isNew: true
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'Status Online Corrigido',
            description: 'Detecção precisa online/offline baseada em lastSeenAt (5 min) no Connect.',
            isNew: true
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'Convites Unificados',
            description: 'Aba Convites removida! Convites de grupos Rovex Connect agora em Solicitações.',
            isNew: false
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: 'Tema Roxo Claro',
            description: 'Nova cor de destaque roxo claro (#A78BFA) no template base Rovex Communities.',
            isNew: true
        },
        {
            icon: <Volume2 className="w-5 h-5" />,
            title: 'Audio Settings Centralizado',
            description: 'Card de configurações de áudio agora centralizado na tela corretamente.',
            isNew: true
        },
        {
            icon: <Smartphone className="w-5 h-5" />,
            title: 'RichPresence Mobile',
            description: 'Card de Rich Presence agora centralizado no modo mobile.',
            isNew: true
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Badge NEW Corrigido',
            description: 'Badge NEW nos cards de acesso rápido não corta mais no canto superior.',
            isNew: true
        },
        {
            icon: <MessageSquareText className="w-5 h-5" />,
            title: 'Textbox Escuro',
            description: 'Campo de postagem agora com fundo escuro (bg-zinc-900/80).',
            isNew: true
        },
        {
            icon: <Wifi className="w-5 h-5" />,
            title: 'Online Count API',
            description: 'Endpoint /users/online-count corrigido - sem mais erro 404!',
            isNew: true
        },
        {
            icon: <Dices className="w-5 h-5" />,
            title: 'Roleta da Sorte',
            description: 'Gire a roleta e ganhe Zions, XP e itens exclusivos! Limite diário de 3 giros.',
            isNew: false
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: 'Preview de Fundos',
            description: 'Visualize fundos animados em tela cheia antes de comprar!',
            isNew: true
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'Multi-Tenant Rovex Ready',
            description: 'Integração completa com Rovex Platform para provisionamento automático!',
        },
        {
            icon: <Swords className="w-5 h-5" />,
            title: 'Desafios 1v1',
            description: 'Desafie amigos, aposte Zions e compete por kills, wins e K/D!',
        },
        {
            icon: <PanelRight className="w-5 h-5" />,
            title: 'Cards do Feed Personalizáveis',
            description: 'Mostrar/ocultar e reordenar cards nas configurações!',
        },
    ];

    // Page 2 - Coming Soon Features
    const page2Updates: UpdateItem[] = [
        {
            icon: <Megaphone className="w-5 h-5" />,
            title: 'Posts Patrocinados',
            description: 'Promova seu conteúdo para mais visibilidade! Sistema de boost pago.',
            isNew: true
        },
        {
            icon: <Video className="w-5 h-5" />,
            title: 'Reels & Vídeos Curtos',
            description: 'Upload de vídeos curtos com músicas royalty-free da biblioteca!',
            isNew: true
        },
        {
            icon: <Film className="w-5 h-5" />,
            title: 'Mini-Games HTML5',
            description: 'Jogos web integrados com sistema de XP e recompensas!',
            isNew: true
        },
        {
            icon: <LayoutDashboard className="w-5 h-5" />,
            title: 'Creator Dashboard',
            description: 'Painel avançado: analytics, monetização e crescimento!',
            isNew: true
        },
    ];

    const pages = [page1Updates, page2Updates];
    const pageTitles = ['Novidades', 'Em Breve'];

    useEffect(() => {
        if (externalIsOpen !== undefined) return;
        const isAuthPage = ['/', '/login', '/register', '/request-invite'].includes(location.pathname);
        if (user && !isAuthPage) {
            const lastSeenVersion = localStorage.getItem('whatsNewVersion');
            if (lastSeenVersion !== CURRENT_VERSION) {
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
        setCurrentPage(0);
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                onClick={handleClose}
            />

            {/* Modal - Apple Vision Pro Style */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`relative w-full max-w-md ${cardBg} rounded-3xl shadow-2xl border ${borderColor} overflow-hidden backdrop-blur-2xl`}
                style={{
                    boxShadow: isLight 
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)' 
                        : `0 0 80px -20px ${accentColor}30`
                }}
            >
                {/* Ambient glow */}
                <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-3xl opacity-20 pointer-events-none"
                    style={{ background: accentGradient || accentColor }}
                />

                {/* Header */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={handleClose}
                        className={`absolute top-4 right-4 p-2 rounded-full ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'} transition-colors`}
                    >
                        <X className={`w-5 h-5 ${textSub}`} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div 
                            className="p-3 rounded-2xl"
                            style={{ 
                                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                                boxShadow: `0 0 20px ${accentColor}20`
                            }}
                        >
                            <Sparkles className="w-7 h-7" style={{ color: accentColor }} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-xl font-bold ${textMain}`}>
                                    {pageTitles[currentPage]} v{CURRENT_VERSION}
                                </h2>
                                <span 
                                    className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                >
                                    BETA
                                </span>
                            </div>
                            <p className={`text-sm ${textSub}`}>
                                {currentPage === 0 ? 'Confira o que há de novo!' : 'O que está por vir!'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Page indicator */}
                <div className="flex justify-center gap-2 px-6 pb-3">
                    {pages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentPage(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentPage ? 'w-6' : 'w-1.5'
                            }`}
                            style={{ 
                                backgroundColor: idx === currentPage ? accentColor : (isLight ? '#d1d5db' : '#3f3f46')
                            }}
                        />
                    ))}
                </div>

                {/* Content with slide animation */}
                <div className="relative px-6 pb-4 overflow-hidden max-h-[55vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, x: currentPage === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: currentPage === 0 ? 20 : -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                        >
                            {pages[currentPage].map((update, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-start gap-3 p-3 rounded-xl ${itemBg} border ${itemBorder} transition-all hover:scale-[1.01]`}
                                >
                                    <div 
                                        className="p-2 rounded-lg shrink-0"
                                        style={{ backgroundColor: `${accentColor}15` }}
                                    >
                                        <span style={{ color: accentColor }}>{update.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-medium text-sm ${textMain}`}>{update.title}</h3>
                                            {update.isNew && (
                                                <span 
                                                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                                >
                                                    NOVO
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs ${textSub} mt-0.5`}>{update.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer with navigation */}
                <div className="p-6 pt-3 flex items-center gap-3">
                    {/* Navigation buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className={`p-2 rounded-xl transition-all ${
                                currentPage === 0 
                                    ? 'opacity-30 cursor-not-allowed' 
                                    : isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                            }`}
                        >
                            <ChevronLeft className={`w-5 h-5 ${textSub}`} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                            disabled={currentPage === pages.length - 1}
                            className={`p-2 rounded-xl transition-all ${
                                currentPage === pages.length - 1 
                                    ? 'opacity-30 cursor-not-allowed' 
                                    : isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                            }`}
                        >
                            <ChevronRight className={`w-5 h-5 ${textSub}`} />
                        </button>
                    </div>

                    {/* Confirm button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                        style={{ background: accentGradient || accentColor }}
                    >
                        <Check className="w-5 h-5" />
                        Vamos lá!
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
