import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Store, Search, Menu, Palette, Zap, Image, MessageCircle, Trophy, Bell, Wrench, Award, Settings, Eye, VolumeX, Users, Gift, Coins, Package, AtSign, Mail, RefreshCw, Move } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const CURRENT_VERSION = '0.3.20';

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

    // v0.3.20 - Mentions, Inventory, Background Crop, Accent Colors
    const updates: UpdateItem[] = [
        {
            icon: <AtSign className="w-5 h-5" />,
            title: 'Menções no Widget de Post',
            description: 'Agora você pode mencionar usuários @nome diretamente no widget de criar post do feed!',
            isNew: true
        },
        {
            icon: <Package className="w-5 h-5" />,
            title: 'Inventário Corrigido',
            description: 'O inventário agora mostra corretamente todos os itens (fundos, selos, cores) que você já comprou!',
            isNew: true
        },
        {
            icon: <Move className="w-5 h-5" />,
            title: 'Ajuste de Background do Perfil',
            description: 'Reposicione e ajuste o zoom da imagem de fundo do seu perfil! Clique no botão de ajuste ao editar.',
            isNew: true
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: 'Botão Criar Post com Cor Destaque',
            description: 'O botão flutuante "Criar Post" agora segue sua cor de destaque personalizada!',
            isNew: true
        },
        {
            icon: <RefreshCw className="w-5 h-5" />,
            title: 'Background Limpo ao Atualizar',
            description: 'Corrigido bug onde o fundo da página persistia após atualizar, mesmo sem estar equipado.'
        },
        {
            icon: <Mail className="w-5 h-5" />,
            title: 'Email de Boas-vindas',
            description: 'Novos membros Magazine agora recebem email de boas-vindas com credenciais corretas.'
        },
        {
            icon: <AtSign className="w-5 h-5" />,
            title: 'Menções em Grupos @usuario',
            description: 'Mencione membros nos grupos digitando @nome! Eles receberão notificação.'
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'Amigos Online Atualizado',
            description: 'Timeout de AFK aumentado para 1h. Status online mais preciso.'
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Indicadores de Convite/Menção',
            description: 'Convites de grupo e menções fazem os ícones pulsarem vermelho para notificá-lo.'
        },
        {
            icon: <Gift className="w-5 h-5" />,
            title: 'Recompensas Gratuitas!',
            description: 'Admins podem criar recompensas com custo 0 (Gratuito) e dar Zions como prêmio!',
        },
        {
            icon: <Store className="w-5 h-5" />,
            title: 'Mercado de Customizações',
            description: 'Compre e venda itens de customização com outros usuários! Acesse pelo menu "Mercado".',
        },
        {
            icon: <Search className="w-5 h-5" />,
            title: 'Navegação e Filtros',
            description: 'Pesquise por nome, filtre por tipo (fundos, selos, cores) e ordene por preço ou data!',
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'Taxa de 5% nas Vendas',
            description: 'Venda qualquer item não-padrão! O sistema cobra 5% de taxa e você recebe o resto em Zions.',
        },
        {
            icon: <Trophy className="w-5 h-5" />,
            title: 'Histórico de Transações',
            description: 'Veja todas suas compras e vendas, quanto ganhou/gastou, e acompanhe suas negociações!',
        },
        {
            icon: <VolumeX className="w-5 h-5" />,
            title: 'Silenciar Grupos',
            description: 'Mute notificações de grupos individuais! Ícone aparece no título do grupo quando silenciado.',
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Fundos de Chat em Grupos',
            description: 'Admins podem aplicar fundos da loja ao chat do grupo! Todos os membros veem o novo visual.',
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'Gerenciamento de Membros',
            description: 'Modal de configurações do grupo com abas: Geral, Fundo e Membros. Admins podem promover/remover.',
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: '10 Novas Cores Pastel!',
            description: 'Rosa, Lavanda, Menta, Pêssego, Céu, Coral, Lilás, Sálvia, Manteiga e Pervinca! Tons suaves para seu perfil.'
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: 'Visualizadores de Stories',
            description: 'Novo popup moderno mostra quem viu seus stories com animação slide-up e design temático!'
        },
        {
            icon: <Award className="w-5 h-5" />,
            title: 'Cor de Texto nos Selos',
            description: 'Admins agora podem definir a cor do texto dos selos, não apenas o fundo!'
        },
        {
            icon: <Settings className="w-5 h-5" />,
            title: 'Botão Config no Feed',
            description: 'Acesse configurações rapidamente pelo ícone no cabeçalho do feed!'
        },
        {
            icon: <Wrench className="w-5 h-5" />,
            title: 'Switches Corrigidos',
            description: 'Botões toggle das configurações com alinhamento e animação melhorados!'
        },
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'Sistema de GRUPOS Completo!',
            description: 'Crie grupos públicos/privados, convide amigos via notificação, chat em tempo real, envie imagens (10 Zions), apelidos personalizados por grupo!',
        },
        {
            icon: <Wrench className="w-5 h-5" />,
            title: 'Múltiplas Correções de Bugs',
            description: 'Corrigido erro de CORS no upload de imagens, botão de fechar stories reposicionado, botão configurações adicionado no header desktop.',
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Convites de Grupo via Notificação',
            description: 'Receba e responda convites de grupo direto pelo sistema de notificações! Aceite ou recuse com um clique.',
        },
        {
            icon: <Palette className="w-5 h-5" />,
            title: 'Backgrounds Customizáveis',
            description: 'Admins podem mudar o fundo do grupo usando wallpapers comprados da loja!',
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Enviar Imagens no Chat',
            description: 'Compartilhe imagens dentro dos grupos! Custa 10 Zions por imagem enviada.',
        },
        {
            icon: <Award className="w-5 h-5" />,
            title: 'Apelidos Personalizados',
            description: 'Defina um apelido único para cada grupo que você participa! Apareça com nomes diferentes em cada comunidade.',
        },
        {
            icon: <Menu className="w-5 h-5" />,
            title: 'Filtro de Conteúdo +18',
            description: 'Marque conteúdo sensível nos grupos e ative/desative visualização com o botão de olhinho no chat!',
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: 'Modo Silencioso Individual',
            description: 'Silencie grupos específicos sem sair! Você não receberá popups de notificação daquele grupo.',
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Stories - IDs Corrigidos',
            description: 'Stories agora salvam ID real do backend após criação! Não mais erros 404.',
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Sistema Não Perturbe',
            description: 'Ative para bloquear popups de notificações e exibir ícone vermelho de "Ocupado" para amigos!',
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
