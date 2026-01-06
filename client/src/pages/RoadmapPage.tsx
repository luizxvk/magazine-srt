import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import { CheckCircle2, Clock, Rocket, Sparkles, Code2, Shield, MessageSquare, Image, Users, Star, Zap, Globe, BrainCircuit } from 'lucide-react';

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
    // Completed
    {
        id: '1',
        title: 'Sistema de Login e Autenticação',
        description: 'Login seguro com sessão única por dispositivo e recuperação de senha.',
        status: 'completed',
        version: 'v0.1.0',
        icon: <Shield className="w-5 h-5" />,
        category: 'security'
    },
    {
        id: '2',
        title: 'Feed de Postagens',
        description: 'Compartilhe fotos e vídeos com a comunidade, curta e comente.',
        status: 'completed',
        version: 'v0.1.0',
        icon: <Image className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '3',
        title: 'Sistema de Amizades',
        description: 'Adicione amigos, aceite solicitações e veja quem faz parte da sua rede.',
        status: 'completed',
        version: 'v0.1.0',
        icon: <Users className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '4',
        title: 'Stories Temporários',
        description: 'Publique stories que desaparecem em 24 horas.',
        status: 'completed',
        version: 'v0.2.0',
        icon: <Sparkles className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '5',
        title: 'Chat Privado',
        description: 'Converse com outros membros em tempo real com mensagens diretas.',
        status: 'completed',
        version: 'v0.2.0',
        icon: <MessageSquare className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '6',
        title: 'Sistema de Níveis e XP',
        description: 'Ganhe XP ao interagir e suba de nível para desbloquear benefícios.',
        status: 'completed',
        version: 'v0.2.0',
        icon: <Star className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '7',
        title: 'Catálogo de Fotos',
        description: 'Organize suas melhores fotos em um catálogo pessoal com filtros.',
        status: 'completed',
        version: 'v0.2.1',
        icon: <Image className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '8',
        title: 'Sistema de Denúncias',
        description: 'Denuncie conteúdo impróprio para manter a comunidade segura.',
        status: 'completed',
        version: 'v0.2.2',
        icon: <Shield className="w-5 h-5" />,
        category: 'security'
    },
    // In Progress
    {
        id: '9',
        title: 'Amigos Online',
        description: 'Veja quem está online e envie mensagens rapidamente.',
        status: 'in-progress',
        icon: <Zap className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '10',
        title: 'Moderação de Conteúdo',
        description: 'Filtros inteligentes para detectar conteúdo impróprio automaticamente.',
        status: 'in-progress',
        icon: <Shield className="w-5 h-5" />,
        category: 'security'
    },
    // Planned
    {
        id: '11',
        title: 'Grupos e Comunidades',
        description: 'Crie ou participe de grupos temáticos com outros membros.',
        status: 'planned',
        icon: <Users className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '12',
        title: 'Eventos e Meetups',
        description: 'Agende e participe de eventos presenciais e online.',
        status: 'planned',
        icon: <Globe className="w-5 h-5" />,
        category: 'community'
    },
    {
        id: '13',
        title: 'Marketplace de Peças',
        description: 'Compre e venda peças e acessórios com outros membros.',
        status: 'planned',
        icon: <Code2 className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '14',
        title: 'App Mobile Nativo',
        description: 'Aplicativo nativo para iOS e Android com notificações push.',
        status: 'planned',
        icon: <Rocket className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '15',
        title: 'Integração com Discord',
        description: 'Sincronize seu perfil e notificações com o Discord da comunidade.',
        status: 'planned',
        icon: <MessageSquare className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '16',
        title: 'Revista Digital com IA',
        description: 'Gere revistas digitais exclusivas usando IA com base nas fotos do seu catálogo. Crie layouts profissionais automaticamente.',
        status: 'planned',
        icon: <BrainCircuit className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '17',
        title: 'Sistema de Pagamentos PIX',
        description: 'Compre Zions e produtos diretamente com PIX via QR Code.',
        status: 'completed',
        version: 'v0.2.3',
        icon: <Zap className="w-5 h-5" />,
        category: 'feature'
    },
    {
        id: '18',
        title: 'Recuperação de Senha por Email',
        description: 'Sistema seguro de recuperação de senha com link enviado por email.',
        status: 'completed',
        version: 'v0.2.3',
        icon: <Shield className="w-5 h-5" />,
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
                        <span className={`text-sm font-medium ${themeAccent}`}>Roadmap 2025</span>
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
