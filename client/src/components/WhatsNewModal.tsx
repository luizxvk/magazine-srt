import { useState, useEffect } from 'react';
import { X, Sparkles, Check, Store, Search, Menu, Palette, Zap, Image, MessageCircle, Shield, Heart, Trophy, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const CURRENT_VERSION = '0.3.0';

interface UpdateItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    isNew?: boolean;
}

export default function WhatsNewModal() {
    const { user } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const isMGT = user?.membershipType === 'MGT';

    const gradientFrom = isMGT ? 'from-emerald-500' : 'from-yellow-500';
    const gradientTo = isMGT ? 'to-emerald-600' : 'to-yellow-600';
    const accentColor = isMGT ? 'text-emerald-400' : 'text-yellow-400';
    const bgAccent = isMGT ? 'bg-emerald-500/10' : 'bg-yellow-500/10';
    const borderAccent = isMGT ? 'border-emerald-500/30' : 'border-yellow-500/30';

    // v0.3.0 - Principais novidades
    const updates: UpdateItem[] = [
        {
            icon: <Store className="w-5 h-5" />,
            title: 'Loja de Personalização',
            description: 'Compre fundos, badges e cores com Zions para customizar seu perfil!',
            isNew: true
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: 'Temas Personalizados',
            description: 'Escolha cores de destaque e fundos únicos para sua experiência.',
            isNew: true
        },
        {
            icon: <Search className="w-5 h-5" />,
            title: 'Busca Inteligente',
            description: 'Nova busca global: encontre páginas, usuários e posts facilmente.',
            isNew: true
        },
        {
            icon: <Menu className="w-5 h-5" />,
            title: 'Menu Mobile Renovado',
            description: 'Header mais limpo com menu hambúrguer no celular.',
            isNew: true
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Editor de Stories',
            description: 'Adicione textos e stickers aos seus stories antes de postar.',
            isNew: true
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'Modo Lite',
            description: 'Desative animações para melhor performance em dispositivos mais lentos.',
            isNew: true
        },
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'Chat Estilo Messenger',
            description: 'Mensagens aparecem no canto da tela como no Facebook.',
        },
        {
            icon: <Shield className="w-5 h-5" />,
            title: 'Login Único',
            description: 'Sua conta só pode estar logada em um dispositivo por vez.',
        },
        {
            icon: <Heart className="w-5 h-5" />,
            title: 'Curtidas Persistentes',
            description: 'Suas curtidas agora são salvas corretamente.',
        },
        {
            icon: <Trophy className="w-5 h-5" />,
            title: '12 Conquistas',
            description: 'Novas conquistas para desbloquear conforme você usa o app.',
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Bônus Diário',
            description: 'Ganhe Zions todos os dias ao fazer login.',
        },
    ];

    useEffect(() => {
        // Só mostrar se: usuário logado E NÃO está na tela de login/register
        const isAuthPage = ['/', '/login', '/register', '/request-invite'].includes(location.pathname);
        
        if (user && !isAuthPage) {
            const lastSeenVersion = localStorage.getItem('whatsNewVersion');
            if (lastSeenVersion !== CURRENT_VERSION) {
                // Delay para não conflitar com outros modais
                const timer = setTimeout(() => setIsOpen(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, location.pathname]);

    const handleClose = () => {
        localStorage.setItem('whatsNewVersion', CURRENT_VERSION);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                            <h2 className="text-2xl font-bold text-white">Novidades v{CURRENT_VERSION} 🎉</h2>
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
}
