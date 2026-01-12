import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Store, Search, Palette, Zap, Image, MessageCircle, Trophy, Bell, VolumeX, Users, Package, AtSign, Move, BadgeCheck, ChevronUp, Wrench, Award, Menu, ScrollText, Shield, Coins, Wallet, ShoppingBag, Key, CreditCard, Gamepad2 } from 'lucide-react';
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

    // v0.4.0 - LOJA DE PRODUTOS & MONETIZAÇÃO!
    const updates: UpdateItem[] = [
        {
            icon: <ShoppingBag className="w-5 h-5" />,
            title: '🎮 LOJA DE PRODUTOS!',
            description: 'Nova loja para comprar keys de jogos, gift cards, assinaturas e muito mais usando Zions ou dinheiro real!',
            isNew: true
        },
        {
            icon: <Gamepad2 className="w-5 h-5" />,
            title: 'Keys de Jogos',
            description: 'Compre keys de Steam, Epic, Xbox, PlayStation e mais! A key é entregue instantaneamente após a compra.',
            isNew: true
        },
        {
            icon: <Wallet className="w-5 h-5" />,
            title: '💰 SACAR ZIONS EM PIX!',
            description: 'Agora você pode converter seus Zions em dinheiro real via PIX! Taxa: 100 Zions = R$ 1,00',
            isNew: true
        },
        {
            icon: <CreditCard className="w-5 h-5" />,
            title: 'Pagamento em Reais',
            description: 'Produtos agora podem ter preço em Zions E em Reais. Escolha como quer pagar!',
            isNew: true
        },
        {
            icon: <Key className="w-5 h-5" />,
            title: 'Sistema de Keys',
            description: 'Admin pode cadastrar keys de produtos que são entregues automaticamente ao comprador!',
            isNew: true
        },
        {
            icon: <ScrollText className="w-5 h-5" />,
            title: 'Termos de Serviço',
            description: 'Ao criar conta, agora você precisa ler e aceitar os Termos de Uso e Política de Privacidade (LGPD)!'
        },
        {
            icon: <Coins className="w-5 h-5" />,
            title: 'Taxa de Mercado para Admin',
            description: 'A taxa de 5% das vendas no mercado agora vai diretamente para a conta do administrador!'
        },
        {
            icon: <Shield className="w-5 h-5" />,
            title: 'Conformidade LGPD',
            description: 'Termos completos de privacidade, proteção de dados e direitos do usuário conforme legislação brasileira.'
        },
        {
            icon: <Store className="w-5 h-5" />,
            title: 'Botão Loja Sempre Visível',
            description: 'O botão de "Meu Estilo" agora aparece no header de todas as páginas!'
        },
        {
            icon: <ChevronUp className="w-5 h-5" />,
            title: 'PostPill Mobile Expansível',
            description: 'No mobile, clique na seta para mostrar/esconder os ícones de ação do widget de post!'
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: 'PostPill com Cor Destaque',
            description: 'O widget de criar post agora segue a cor de destaque personalizada!'
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Notificações com Fundo Sólido',
            description: 'O card de notificações agora tem fundo preto sólido para melhor legibilidade!'
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'Popup Convite Estilizado',
            description: 'Convites de grupo agora mostram popup bonito ao invés de alert do navegador!'
        },
        {
            icon: <BadgeCheck className="w-5 h-5" />,
            title: 'Selo Verificado Corrigido',
            description: 'O ícone de email verificado agora aparece corretamente com sua cor!'
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'Botão Criar Grupo Dinâmico',
            description: 'O botão "Criar Grupo" agora segue a cor de destaque do usuário!'
        },
        {
            icon: <Package className="w-5 h-5" />,
            title: 'Inventário no Mobile',
            description: 'O card de Inventário agora aparece no drawer de Recomendações para mobile!'
        },
        {
            icon: <Move className="w-5 h-5" />,
            title: 'Ajuste de Background do Perfil',
            description: 'Reposicione e ajuste o zoom da imagem de fundo do seu perfil!'
        },
        {
            icon: <AtSign className="w-5 h-5" />,
            title: 'Menções @usuario',
            description: 'Mencione usuários no widget de post e em grupos! Eles receberão notificação.'
        },
        {
            icon: <Store className="w-5 h-5" />,
            title: 'Mercado de Customizações',
            description: 'Compre e venda itens de customização com outros usuários!'
        },
        {
            icon: <Search className="w-5 h-5" />,
            title: 'Navegação e Filtros',
            description: 'Pesquise por nome, filtre por tipo (fundos, selos, cores) e ordene por preço ou data!'
        },
        {
            icon: <Trophy className="w-5 h-5" />,
            title: 'Histórico de Transações',
            description: 'Veja todas suas compras e vendas, quanto ganhou/gastou, e acompanhe suas negociações!'
        },
        {
            icon: <VolumeX className="w-5 h-5" />,
            title: 'Silenciar Grupos',
            description: 'Mute notificações de grupos individuais! Ícone aparece no título do grupo quando silenciado.'
        },
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'Sistema de GRUPOS Completo!',
            description: 'Crie grupos públicos/privados, convide amigos, chat em tempo real, envie imagens!'
        },
        {
            icon: <Award className="w-5 h-5" />,
            title: 'Selos nos Perfis e Amigos',
            description: 'Selos de admin agora aparecem nos amigos online e cards de perfil de usuários!',
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: 'Wallpapers Corrigidos',
            description: 'Todos os 8 novos fundos (Cyberpunk, Lava, Gelo, etc) agora funcionam corretamente!',
        },
        {
            icon: <Trophy className="w-5 h-5" />,
            title: 'Conquistas de Outros Usuários',
            description: 'Ao visitar perfis, agora você vê as conquistas reais daquele usuário!',
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: 'RGB Dinâmico Funcional',
            description: 'Cor RGB agora realmente alterna entre as cores ao invés de ficar travada no vermelho!',
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Editor Stories Apple Vision Pro',
            description: 'Interface glassmorphism com botão POSTAR redesenhado e loading visual!',
        },
        {
            icon: <Trophy className="w-5 h-5" />,
            title: 'Timeline de Níveis Corrigida',
            description: 'Números duplicados removidos - agora aparece apenas no círculo!',
        },
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'MGT Log no Drawer',
            description: 'Card do MGT Log agora aparece na barra lateral de recomendações!',
        },
        {
            icon: <Wrench className="w-5 h-5" />,
            title: 'Grid AdminDashboard',
            description: 'Dependências instaladas (react-grid-layout). Implementação completa em breve!',
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: '8 Novos Fundos Animados',
            description: 'Pôr do Sol, Cyberpunk, Lava, Gelo Ártico, Grade Neon e mais!',
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: 'Cor RGB Dinâmica',
            description: 'Cor especial que muda entre Red, Green e Blue automaticamente! (1000 Zions)',
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: 'Cores Personalizadas',
            description: 'Post pill, loading e todos elementos respeitam sua cor escolhida!',
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'MAGAZINE Animado',
            description: 'Logo com animação mais rápida e brilhante para maior exclusividade!',
        },
        {
            icon: <Wrench className="w-5 h-5" />,
            title: 'Textos Originais',
            description: 'Posts mantêm formatação original sem uppercase forçado.',
        },
        {
            icon: <Wrench className="w-5 h-5" />,
            title: 'Logout Corrigido',
            description: 'Cores voltam ao padrão Magazine ao deslogar.',
        },
        {
            icon: <Store className="w-5 h-5" />,
            title: 'Loja de Personalização',
            description: 'Compre fundos, badges e cores com Zions para customizar seu perfil!',
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: 'Temas Personalizados',
            description: 'Escolha cores de destaque e fundos únicos para sua experiência.',
        },
        {
            icon: <Search className="w-5 h-5" />,
            title: 'Busca Inteligente',
            description: 'Nova busca global: encontre páginas, usuários e posts facilmente.',
        },
        {
            icon: <Menu className="w-5 h-5" />,
            title: 'Menu Mobile Renovado',
            description: 'Header mais limpo com menu hambúrguer no celular.',
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Editor de Stories',
            description: 'Adicione textos e stickers aos seus stories antes de postar.',
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'Modo Lite',
            description: 'Desative animações para melhor performance em dispositivos mais lentos.',
        },
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'Chat Estilo Messenger',
            description: 'Mensagens aparecem no canto da tela como no Facebook.',
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
