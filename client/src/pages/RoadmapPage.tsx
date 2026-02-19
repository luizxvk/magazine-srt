import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import { CheckCircle2, Clock, Rocket, Sparkles, Shield, MessageSquare, Image, Users, Star, Zap, BrainCircuit, Palette, ShoppingBag, Crown, Gamepad2, Smartphone, Globe, Bot, Swords, Trophy, Video, Film, LayoutDashboard, TrendingUp } from 'lucide-react';

interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'planned';
    version?: string;
    icon: React.ReactNode;
    category: 'feature' | 'improvement' | 'security' | 'community';
}

const roadmapItems: RoadmapItem[] = [
    // ===== COMPLETED (v0.1.0 - v0.3.5) =====
    {
        id: '1',
        title: 'Sistema de Login e Autenticação',
        description: 'Login seguro com sessão única por dispositivo, recuperação de senha por email e verificação de conta.',
        status: 'completed',
        version: 'v0.1.0',
        icon: <Shield className="w-5 h-5" />,
        category: 'security'
    },
    {
        id: '2',
        title: 'Feed de Postagens com Carousel',
        description: 'Compartilhe fotos e vídeos com a comunidade. Crie carousels com múltiplas imagens e adicione tags personalizadas.',
        status: 'completed',
        version: 'v0.1.0',
        icon: <Image className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '3',
        title: 'Sistema de Amizades',
        description: 'Adicione amigos, aceite solicitações e veja quem está online em tempo real.',
        status: 'completed',
        version: 'v0.1.0',
        icon: <Users className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '4',
        title: 'Stories Temporários',
        description: 'Publique stories que desaparecem em 24 horas com visualizador estilo Instagram.',
        status: 'completed',
        version: 'v0.2.0',
        icon: <Sparkles className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '5',
        title: 'Chat Privado em Tempo Real',
        description: 'Converse com outros membros instantaneamente. Chat flutuante com notificações.',
        status: 'completed',
        version: 'v0.2.0',
        icon: <MessageSquare className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '6',
        title: 'Sistema de Níveis e XP',
        description: 'Ganhe XP ao interagir (posts, comments, likes) e suba de nível para desbloquear benefícios exclusivos.',
        status: 'completed',
        version: 'v0.2.0',
        icon: <Star className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '7',
        title: 'Catálogo de Fotos Exclusivo',
        description: 'Organize suas melhores fotos em um catálogo privado com sistema de compra via Zions.',
        status: 'completed',
        version: 'v0.2.1',
        icon: <Image className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '8',
        title: 'Sistema de Denúncias e Moderação',
        description: 'Denuncie conteúdo impróprio. Admin pode remover posts e banir usuários.',
        status: 'completed',
        version: 'v0.2.2',
        icon: <Shield className="w-5 h-5" />,
        category: 'security'
    },
    {
        id: '15',
        title: 'Loja de Zions (Moeda Virtual)',
        description: 'Sistema completo de moeda virtual. Compre Zions com PIX, cartão ou Mercado Pago.',
        status: 'completed',
        version: 'v0.2.3',
        icon: <Zap className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '16',
        title: 'Sistema de Conquistas (Achievements)',
        description: 'Desbloqueie conquistas ao completar desafios. Popup animado ao conquistar.',
        status: 'completed',
        version: 'v0.2.5',
        icon: <Star className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '17',
        title: 'Login Diário com Recompensas',
        description: 'Ganhe Zions ao fazer login todo dia. Sistema de sequência de 7 dias consecutivos.',
        status: 'completed',
        version: 'v0.2.8',
        icon: <Zap className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '18',
        title: 'Loja de Personalização',
        description: 'Compre wallpapers exclusivos, badges e cores de destaque usando Zions.',
        status: 'completed',
        version: 'v0.3.0',
        icon: <Palette className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '19',
        title: 'Sistema de Notificações',
        description: 'Receba notificações de likes, comments, mensagens e solicitações de amizade.',
        status: 'completed',
        version: 'v0.3.2',
        icon: <Zap className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '20',
        title: 'Modo Lite (Performance)',
        description: 'Desative animações e efeitos para melhor performance em dispositivos mais fracos.',
        status: 'completed',
        version: 'v0.3.5',
        icon: <Zap className="w-5 h-5" />,
        category: 'improvement'
    },
    {
        id: '21',
        title: 'Modo Não Perturbe (DND)',
        description: 'Ative DND para silenciar notificações e aparecer offline para outros usuários.',
        status: 'completed',
        version: 'v0.3.5',
        icon: <Shield className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '21',
        title: 'Verificação de Email Obrigatória',
        description: 'Sistema de verificação via Email com código de 6 dígitos. 3 dias para verificar ou conta suspensa.',
        status: 'completed',
        version: 'v0.3.5',
        icon: <Shield className="w-5 h-5" />,
        category: 'security'
    },
    {
        id: '22',
        title: 'Sistema de Selos Admin',
        description: 'Admin pode atribuir selos personalizados aos usuários (BETA, PRO, FOUNDER) com cores e ícones customizados.',
        status: 'completed',
        version: 'v0.3.5',
        icon: <Crown className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '23',
        title: 'Mobile Responsivo Premium',
        description: 'Interface totalmente otimizada para mobile com gestos e animações suaves.',
        status: 'completed',
        version: 'v0.3.5',
        icon: <Rocket className="w-5 h-5" />,
        category: 'improvement'
    },
    
    // ===== IN PROGRESS =====
    {
        id: '23',
        title: 'Dashboard Admin com Grid Arrastável',
        description: 'Dashboard administrativo com widgets arrastáveis usando @dnd-kit. Estatísticas em tempo real e reorganização personalizável.',
        status: 'completed',
        version: 'v0.3.6',
        icon: <Shield className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '24',
        title: 'Stories Avançados',
        description: 'Like, comentários, compartilhamento, redimensionamento de imagem, texto movível e animações estilo Apple Vision Pro.',
        status: 'completed',
        version: 'v0.3.6',
        icon: <Sparkles className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '25',
        title: 'Sistema de Grupos Completo v2.0',
        description: 'Convites via notificação, apelidos personalizados, backgrounds comprados, modo mudo, compartilhamento de imagens (10 Zions) e filtro de conteúdo +18.',
        status: 'completed',
        version: 'v0.3.6',
        icon: <Users className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '26',
        title: 'Mercado P2P de Customizações',
        description: 'Compre e venda itens de personalização (fundos, selos, cores) com outros usuários. Taxa de 5% vai para o admin.',
        status: 'completed',
        version: 'v0.3.20',
        icon: <ShoppingBag className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '27',
        title: 'Termos de Serviço e LGPD',
        description: 'Termos de uso e política de privacidade obrigatórios no cadastro, em conformidade com a legislação brasileira.',
        status: 'completed',
        version: 'v0.3.23',
        icon: <Shield className="w-5 h-5" />,
        category: 'security'
    },
    {
        id: '28',
        title: 'Loja de Produtos Digitais',
        description: 'Nova loja para comprar keys de jogos, gift cards, assinaturas usando Zions ou dinheiro real. Keys entregues automaticamente!',
        status: 'completed',
        version: 'v0.3.24',
        icon: <Gamepad2 className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '29',
        title: 'Sistema de Saque de Zions',
        description: 'Converta Zions em dinheiro real via PIX! Taxa: 100 Zions = R$ 1,00. Min R$10, Max R$1000.',
        status: 'completed',
        version: 'v0.3.24',
        icon: <Zap className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '29b',
        title: 'Sistema de Cores Personalizadas',
        description: 'Cores de destaque personalizadas integradas em todo perfil. Cores Básicas e Tom Pastel na loja de personalização.',
        status: 'completed',
        version: 'v0.4.0',
        icon: <Palette className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '29c',
        title: 'Integração com Discord',
        description: 'Sincronize sua conta e veja seus servidores Discord diretamente na plataforma.',
        status: 'completed',
        version: 'v0.4.5',
        icon: <MessageSquare className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '29d',
        title: 'Sistema de Toasts Personalizado',
        description: 'Notificações elegantes (sucesso, erro, aviso) seguindo o padrão visual do projeto.',
        status: 'completed',
        version: 'v0.4.9',
        icon: <Sparkles className="w-5 h-5" />,
        category: 'improvement'
    },
    {
        id: '29e',
        title: 'Reações e Replies nos Grupos',
        description: 'Reaja com emojis e responda diretamente às mensagens nos chats de grupo.',
        status: 'completed',
        version: 'v0.4.12',
        icon: <MessageSquare className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '29f',
        title: 'Fundos Animados Premium',
        description: 'Rainbow Skies (raios arco-íris com modo claro), Infinite Triangles (grid hexagonal com cor de destaque) e Moonlit Sky (céu noturno com lua e estrelas). Categoria Featured na loja!',
        status: 'completed',
        version: 'v0.4.14',
        icon: <Palette className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '29g',
        title: 'Cards Animados & Login Liquid Glass',
        description: 'Cards com animações canvas (DottedGlowBackground), login com efeito Apple Vision Pro liquid glass e shimmer nos botões.',
        status: 'completed',
        version: 'v0.5.0',
        icon: <Sparkles className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '29h',
        title: 'Loader Moderno (Aceternity)',
        description: 'Todos os 44 spinners do app substituídos por loader 3 pontos bouncing em estilo Aceternity. Performance mobile otimizada.',
        status: 'completed',
        version: 'v0.5.0',
        icon: <Zap className="w-5 h-5" />,
        category: 'improvement'
    },
    
    // ===== IN PROGRESS =====
    {
        id: '30',
        title: 'Hub de Comunidades Gamers (Rovex)',
        description: 'Expansão para maior rede social de comunidades gamers do Brasil com a Rovex. Torneios, clãs e eventos ao vivo.',
        status: 'in-progress',
        icon: <Gamepad2 className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '31',
        title: 'Transmissões ao Vivo',
        description: 'Faça lives para seus seguidores com chat integrado e sistema de doações em Zions. Aguardando aprovação da Twitch.',
        status: 'in-progress',
        icon: <Zap className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '31b',
        title: 'App Mobile Nativo',
        description: 'Aplicativo para Android via Capacitor com notificações push Firebase. Build APK funcionando, publicação na Play Store em breve.',
        status: 'in-progress',
        icon: <Smartphone className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '40',
        title: 'Desafios 1v1',
        description: 'Desafie amigos para competições 1v1, aposte Zions e compita por kills, wins e K/D. Integração StatForge.',
        status: 'in-progress',
        icon: <Swords className="w-5 h-5" />,
        category: 'feature'
    },
    
    // ===== PLANNED =====
    {
        id: '33',
        title: 'Revista Digital com IA',
        description: 'Gere revistas digitais automáticas usando IA com base nas fotos do seu catálogo. Layouts profissionais em minutos.',
        status: 'planned',
        icon: <BrainCircuit className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '35',
        title: 'Sistema de Prestígio',
        description: 'Ao atingir nível 30, faça prestígio: recomece do zero com badge exclusiva e bônus permanente de XP. 10 níveis de prestígio!',
        status: 'planned',
        icon: <Crown className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '41',
        title: 'Battle Pass Sazonal',
        description: 'Battle Pass com 100 níveis de recompensas exclusivas. Track gratuito + premium com cosméticos raros e Zions.',
        status: 'planned',
        icon: <Trophy className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '42',
        title: 'Watch Parties',
        description: 'Assista streams da Twitch/YouTube e videos juntos com amigos. Chat sincronizado e reações em tempo real.',
        status: 'planned',
        icon: <Video className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '43',
        title: 'Clips e Highlights',
        description: 'Crie e compartilhe clipes de 15-60s dos seus melhores momentos. Competições de clipes com premiação.',
        status: 'planned',
        icon: <Film className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '44',
        title: 'Creator Dashboard',
        description: 'Painel avançado para criadores: analytics detalhado, monetização e crescimento de seguidores.',
        status: 'planned',
        icon: <LayoutDashboard className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '45',
        title: 'Apostas Sociais',
        description: 'Aposte em partidas ao vivo de e-sports e jogos. Pools de apostas entre amigos com odds dinâmicas.',
        status: 'planned',
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '36',
        title: 'Torneios Competitivos',
        description: 'Brackets automáticos, rankings ao vivo, premiação em Zions e matchmaking. Solo, duo e equipes.',
        status: 'completed',
        icon: <Swords className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '37',
        title: 'Sistema de Idiomas (i18n)',
        description: 'Suporte a múltiplos idiomas: Português, English e Español. Detecção automática do navegador.',
        status: 'completed',
        icon: <Globe className="w-5 h-5" />,
        category: 'improvement'
    },
    {
        id: '38',
        title: 'Auto-Moderação com IA',
        description: 'Filtro automático de conteúdo impróprio (NSFW) e discurso de ódio usando Google Vision e Perspective API.',
        status: 'completed',
        icon: <Bot className="w-5 h-5" />,
        category: 'security'
    }
];

const statusConfig = {
    completed: {
        icon: <CheckCircle2 className="w-5 h-5" />,
        label: 'Concluído',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-400',
        dotColor: 'bg-green-500'
    },
    'in-progress': {
        icon: <Clock className="w-5 h-5" />,
        label: 'Em Desenvolvimento',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        dotColor: 'bg-amber-500'
    },
    planned: {
        icon: <Rocket className="w-5 h-5" />,
        label: 'Planejado',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        dotColor: 'bg-blue-500'
    }
};

const categoryConfig = {
    feature: { label: 'Funcionalidade', color: 'text-purple-400 bg-purple-500/10' },
    improvement: { label: 'Melhoria', color: 'text-cyan-400 bg-cyan-500/10' },
    security: { label: 'Segurança', color: 'text-red-400 bg-red-500/10' },
    community: { label: 'Comunidade', color: 'text-emerald-400 bg-emerald-500/10' }
};

export default function RoadmapPage() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const themeAccent = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeBg = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';

    const completedItems = roadmapItems.filter(item => item.status === 'completed');
    const inProgressItems = roadmapItems.filter(item => item.status === 'in-progress');
    const plannedItems = roadmapItems.filter(item => item.status === 'planned');

    const renderRoadmapItem = (item: RoadmapItem) => {
        const status = statusConfig[item.status];
        const category = categoryConfig[item.category];

        return (
            <div
                key={item.id}
                className={`p-5 rounded-2xl border ${status.borderColor} ${status.bgColor} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${status.bgColor} ${status.textColor}`}>
                        {item.icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className={`font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                {item.title}
                            </h3>
                            {item.version && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${themeBg} ${themeAccent} font-bold`}>
                                    {item.version}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${category.color} font-medium`}>
                                {category.label}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${status.textColor}`}>
                                {status.icon}
                                {status.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30">
            <LuxuriousBackground />
            <Header />

            <div className="pt-40 pb-20 px-4 max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${themeBg} ${themeBorder} border mb-4`}>
                        <Rocket className={`w-4 h-4 ${themeAccent}`} />
                        <span className={`text-sm font-medium ${themeAccent}`}>Roadmap 2026</span>
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-serif mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        O Futuro da Plataforma
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Acompanhe o desenvolvimento da plataforma e veja o que estamos construindo para você.
                        Sua opinião importa - envie sugestões pelo chat!
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-12">
                    <div className={`p-4 rounded-2xl border ${themeBorder} ${themeBg} backdrop-blur-sm text-center`}>
                        <div className={`text-3xl font-bold ${themeAccent}`}>{completedItems.length}</div>
                        <div className="text-gray-400 text-sm">Concluídos</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm text-center">
                        <div className="text-3xl font-bold text-amber-400">{inProgressItems.length}</div>
                        <div className="text-gray-400 text-sm">Em Progresso</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm text-center">
                        <div className="text-3xl font-bold text-blue-400">{plannedItems.length}</div>
                        <div className="text-gray-400 text-sm">Planejados</div>
                    </div>
                </div>

                {/* In Progress Section */}
                {inProgressItems.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                            <h2 className={`text-2xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Em Desenvolvimento
                            </h2>
                        </div>
                        <div className="grid gap-4">
                            {inProgressItems.map(renderRoadmapItem)}
                        </div>
                    </div>
                )}

                {/* Planned Section */}
                {plannedItems.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <h2 className={`text-2xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Próximas Funcionalidades
                            </h2>
                        </div>
                        <div className="grid gap-4">
                            {plannedItems.map(renderRoadmapItem)}
                        </div>
                    </div>
                )}

                {/* Completed Section */}
                {completedItems.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <h2 className={`text-2xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Já Implementados
                            </h2>
                        </div>
                        <div className="grid gap-4">
                            {completedItems.map(renderRoadmapItem)}
                        </div>
                    </div>
                )}

                {/* Footer Note */}
                <div className={`mt-12 p-6 rounded-2xl border ${themeBorder} ${themeBg} backdrop-blur-sm text-center`}>
                    <Sparkles className={`w-8 h-8 ${themeAccent} mx-auto mb-3`} />
                    <h3 className={`font-serif text-lg mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Tem uma sugestão?
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Adoramos ouvir ideias da comunidade! Entre em contato pelo chat ou redes sociais 
                        para sugerir novas funcionalidades.
                    </p>
                </div>
            </div>
        </div>
    );
}
