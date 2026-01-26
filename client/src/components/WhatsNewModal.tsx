import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Gamepad2, Image, Tag, Lock, Smartphone, History, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const CURRENT_VERSION = '0.4.7';

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
    const { user } = useAuth();
    const location = useLocation();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isMGT = user?.membershipType === 'MGT';

    // Use external state if provided, otherwise use internal state
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    const gradientFrom = isMGT ? 'from-emerald-500' : 'from-yellow-500';
    const gradientTo = isMGT ? 'to-emerald-600' : 'to-yellow-600';
    const accentColor = isMGT ? 'text-emerald-400' : 'text-yellow-400';
    const bgAccent = isMGT ? 'bg-emerald-500/10' : 'bg-yellow-500/10';
    const borderAccent = isMGT ? 'border-emerald-500/30' : 'border-yellow-500/30';

    // v0.4.7 - MULTIPLE FIXES & HISTORY
    const updates: UpdateItem[] = [
        {
            icon: <History className="w-5 h-5 text-blue-500" />,
            title: '📊 Histórico de Zions Points',
            description: 'Nova aba nos Prêmios mostrando todo o histórico de transações: compras, resgates, bônus e mais!',
            isNew: true
        },
        {
            icon: <Filter className="w-5 h-5 text-purple-500" />,
            title: '🎯 Destaques Filtrados',
            description: 'Página de Destaques e Carrossel agora mostram apenas posts de usuários, sem produtos da loja.',
            isNew: true
        },
        {
            icon: <Smartphone className="w-5 h-5 text-emerald-500" />,
            title: '📱 Bottom Navigation Mobile',
            description: 'Barra de navegação estilo Apple Vision Pro! Acesso rápido a Home, Explorar, Loja e Perfil.',
            isNew: false
        },
        {
            icon: <Lock className="w-5 h-5 text-amber-500" />,
            title: '🔐 Sistema Feature Gates',
            description: 'Novo sistema de controle de features por plano. Features premium agora mostram cadeado e modal de upgrade!',
            isNew: false
        },
        // v0.4.2 - STEAM-STYLE PRODUCT DETAILS
        {
            icon: <Gamepad2 className="w-5 h-5 text-blue-500" />,
            title: '🎮 Página de Produto Estilo Steam',
            description: 'Clique em qualquer produto para ver detalhes completos: galeria de imagens, informações do jogo, tags e muito mais!',
            isNew: false
        },
        {
            icon: <Image className="w-5 h-5 text-purple-500" />,
            title: '📸 Galeria de Screenshots',
            description: 'Produtos agora suportam múltiplas screenshots! Navegue pelo carrossel ou expanda em tela cheia.',
            isNew: false
        },
        {
            icon: <Tag className="w-5 h-5 text-emerald-500" />,
            title: '🏷️ Tags e Info do Jogo',
            description: 'Desenvolvedor, plataforma, tamanho em GB, data de lançamento e tags personalizadas (#FPS, #Action, etc).',
            isNew: false
        }
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
                {/* Header com gradiente */}
                <div className={`relative bg-gradient-to-r ${gradientFrom} ${gradientTo} p-6 pb-12`}>
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
                                <div className={`p-2 rounded-lg bg-zinc-800 ${accentColor} shrink-0`}>
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

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleClose}
                        className={`w-full py-3 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
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
