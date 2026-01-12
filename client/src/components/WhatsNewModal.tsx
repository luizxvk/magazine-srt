import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Store, PackageOpen, Coins, Star, ShieldCheck, Sun, Radio, Trophy, Palette, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const CURRENT_VERSION = '0.4.0';

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

    // v0.4.0 - MAJOR FIXES & IMPROVEMENTS
    const updates: UpdateItem[] = [
        {
            icon: <ShieldCheck className="w-5 h-5 text-purple-500" />,
            title: '🔒 Sessão Visitante Aprimorada',
            description: 'Visitantes agora têm bloqueios adequados: sem popups intrusivos, sem acesso a notificações/mercado/social. Experiência mais limpa!',
            isNew: true
        },
        {
            icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
            title: '🎨 Header Modernizado',
            description: 'Logo MAGAZINE agora segue sua cor personalizada! Logo MGT aumentado, pulse de notificação movido para Grupos, configurações removidas do header.',
            isNew: true
        },
        {
            icon: <Sun className="w-5 h-5 text-yellow-500" />,
            title: '☀️ Modo Claro Corrigido',
            description: 'Títulos do carrossel, ranking e ícone verificado agora têm contraste perfeito em modo claro!',
            isNew: true
        },
        {
            icon: <Radio className="w-5 h-5 text-pink-500" />,
            title: '📻 Rádio 100% Funcional',
            description: 'Badge "AO VIVO" à direita, volume automático, busca redireciona e scroll animado ao clicar!',
            isNew: true
        },
        {
            icon: <Trophy className="w-5 h-5 text-amber-500" />,
            title: '🏆 Conquistas Expandidas',
            description: '7 novas conquistas implementadas! Agora temos 12 com lógica funcional (Blogueiro, Editor Chefe, Ícone, Viral e mais).',
            isNew: true
        },
        {
            icon: <Palette className="w-5 h-5 text-blue-500" />,
            title: '🎭 Desequipar Theme Packs',
            description: 'Agora você pode remover packs equipados e voltar ao tema padrão com um clique!',
            isNew: true
        },
        {
            icon: <Navigation className="w-5 h-5 text-cyan-500" />,
            title: '🔧 Correções Gerais',
            description: 'Contador do carrossel corrigido, ícone verificado com mais contraste. Mais de 30 bugs resolvidos!',
            isNew: true
        },
        // v0.3.39 - QUICK ACCESS IMPROVEMENTS
        {
            icon: <Star className="w-5 h-5 text-blue-500" />,
            title: '⭐ Acesso Rápido Aprimorado',
            description: 'Novo card "O Que Há de Novo" no carrossel para você ficar por dentro de tudo!',
            isNew: false
        },
        // v0.3.38 - PROGRESSIVE PRICING & ACHIEVEMENTS
        {
            icon: <PackageOpen className="w-5 h-5 text-blue-500" />,
            title: '🎁 Supply Box Progressivo',
            description: '1º do dia é GRÁTIS! Depois: 500, 1000, 2500... Reseta à meia-noite.',
            isNew: false
        },
        {
            icon: <Sparkles className="w-5 h-5 text-amber-500" />,
            title: '🏆 Nova Conquista',
            description: 'Identidade Revelada: Atualize seu perfil para desbloquear uma nova medalha!',
            isNew: false
        },
        {
            icon: <Coins className="w-5 h-5 text-green-500" />,
            title: '💰 Zions Cash',
            description: 'Melhoria na exibição e uso do seu saldo de Cash ao comprar itens.',
            isNew: false
        },
        // v0.3.37 - RARITY & SUPPLY BOX
        {
            icon: <Sparkles className="w-5 h-5 text-amber-500" />,
            title: '✨ Sistema de Raridades',
            description: 'Theme Packs agora têm raridades: Comum, Raro, Épico e Lendário!',
            // isNew: false
        },
        {
            icon: <PackageOpen className="w-5 h-5 text-blue-500" />,
            title: '🎁 Supply Box Diário',
            description: 'Abra sua caixa diária na Loja de Personalização.',
            // isNew: false
        },
        // v0.3.36 - THEME PACKS OVERHAUL
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: '🎨 Theme Packs Renovados!',
            description: 'Novos nomes, paletas de 5 cores autênticas e animações suaves.',
            // isNew: false
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: '⚡ Chat Ultra Rápido',
            description: 'Novo sistema otimizado está live!',
            // isNew: false
        },
        {
            icon: <Coins className="w-5 h-5" />,
            title: '💰 Sistema de Moeda Dual!',
            description: 'Zions Cash para produtos reais e Zions Points para customizações.',
            // isNew: false
        },
        {
            icon: <Store className="w-5 h-5" />,
            title: '📦 Mercado de Packs',
            description: 'Agora você pode VENDER e COMPRAR Theme Packs de outros jogadores!',
            // isNew: false
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
