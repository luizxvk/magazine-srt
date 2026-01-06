import { useState, useEffect } from 'react';
import { X, Sparkles, Shield, Heart, Trophy, Zap, Bell, Image, Users, Check, Smartphone, Layout, MessageCircle, Camera, CreditCard, Mail, Grid, Eye, Sun, Gamepad2, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const CURRENT_VERSION = '0.2.4';

interface UpdateItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    type: 'fix' | 'feature' | 'improvement';
    version?: string;
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

    // Todas as atualizações acumuladas (mais recentes primeiro)
    const updates: UpdateItem[] = [
        // v0.2.4 - Janeiro 2026
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'Popup de Mensagem Corrigido',
            description: 'O popup de notificação de mensagem agora aparece corretamente no canto inferior direito.',
            type: 'fix',
            version: '0.2.4'
        },
        {
            icon: <Sun className="w-5 h-5" />,
            title: 'Modo Claro Aprimorado',
            description: 'Correções visuais para o modo claro: catálogo, moedas Zions e botões de fechar.',
            type: 'fix',
            version: '0.2.4'
        },
        {
            icon: <Gamepad2 className="w-5 h-5" />,
            title: 'Roadmap: Gaming Social',
            description: 'Nova meta: transformar a plataforma na maior rede social de comunidades gamers!',
            type: 'feature',
            version: '0.2.4'
        },
        {
            icon: <Map className="w-5 h-5" />,
            title: 'Roadmap Atualizado',
            description: 'Novas metas incluem IA Magazine e integração Discord. Previsão para 2026.',
            type: 'improvement',
            version: '0.2.4'
        },
        // v0.2.3 - Janeiro 2026
        {
            icon: <CreditCard className="w-5 h-5" />,
            title: 'Pagamento PIX',
            description: 'Compre Zions com PIX! QR Code gerado automaticamente para pagamento rápido.',
            type: 'feature',
            version: '0.2.3'
        },
        {
            icon: <Mail className="w-5 h-5" />,
            title: 'Senha por Email',
            description: 'Novos membros aprovados recebem a senha diretamente por email.',
            type: 'feature',
            version: '0.2.3'
        },
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'Popup de Mensagem',
            description: 'Notificação estilo LinkedIn quando você recebe uma nova mensagem.',
            type: 'feature',
            version: '0.2.3'
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'Rate Limit de Mensagens',
            description: 'Proteção anti-spam: 2 segundos entre cada mensagem enviada.',
            type: 'improvement',
            version: '0.2.3'
        },
        {
            icon: <Grid className="w-5 h-5" />,
            title: 'Modos de Visualização',
            description: 'Catálogo agora tem 3 visualizações: masonry, grade e lista.',
            type: 'feature',
            version: '0.2.3'
        },
        {
            icon: <Smartphone className="w-5 h-5" />,
            title: 'Responsivo Melhorado',
            description: 'Margens e espaçamentos ajustados para todos os dispositivos.',
            type: 'improvement',
            version: '0.2.3'
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: 'Cores MGT Corrigidas',
            description: 'Card de bônus diário agora exibe cores corretas para membros MGT.',
            type: 'fix',
            version: '0.2.3'
        },
        // v0.2.2 - 06/01/2026
        {
            icon: <Camera className="w-5 h-5" />,
            title: 'Catálogo de Fotos Melhorado',
            description: 'Agora mostra quem postou cada foto e só o dono pode remover.',
            type: 'improvement',
            version: '0.2.2'
        },
        {
            icon: <MessageCircle className="w-5 h-5" />,
            title: 'Mensagens Estilo Facebook',
            description: 'Chat agora aparece no canto inferior direito da tela, mais acessível.',
            type: 'feature',
            version: '0.2.2'
        },
        {
            icon: <Shield className="w-5 h-5" />,
            title: 'Recuperação de Senha',
            description: 'Agora você pode recuperar sua senha via email caso a esqueça.',
            type: 'feature',
            version: '0.2.2'
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Redimensionar Avatar',
            description: 'Ao trocar de foto, você pode ajustar o zoom e posição da imagem.',
            type: 'improvement',
            version: '0.2.2'
        },
        // v0.2.1 - 06/01/2026
        {
            icon: <Smartphone className="w-5 h-5" />,
            title: 'Login Mobile Melhorado',
            description: 'Tela de login agora é vertical em dispositivos mobile para melhor usabilidade.',
            type: 'improvement',
            version: '0.2.1'
        },
        {
            icon: <Layout className="w-5 h-5" />,
            title: 'Responsividade Aprimorada',
            description: 'Correções de viewport para dispositivos mobile. Sem mais necessidade de zoom.',
            type: 'fix',
            version: '0.2.1'
        },
        {
            icon: <Shield className="w-5 h-5" />,
            title: 'Popup de Sessão Expirada',
            description: 'Novo popup estilizado quando a sessão é encerrada por login em outro dispositivo.',
            type: 'improvement',
            version: '0.2.1'
        },
        // v0.2.0 - 06/01/2026
        {
            icon: <Shield className="w-5 h-5" />,
            title: 'Login Único por Dispositivo',
            description: 'Agora sua conta só pode estar logada em um dispositivo por vez, aumentando a segurança.',
            type: 'feature',
            version: '0.2.0'
        },
        {
            icon: <Heart className="w-5 h-5" />,
            title: 'Curtidas Corrigidas',
            description: 'O problema das curtidas sumindo foi resolvido. Suas curtidas agora são salvas corretamente!',
            type: 'fix',
            version: '0.2.0'
        },
        {
            icon: <Trophy className="w-5 h-5" />,
            title: 'Novas Conquistas',
            description: 'Adicionamos 12 novas conquistas para você desbloquear. Confira na aba de conquistas!',
            type: 'feature',
            version: '0.2.0'
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: 'Sistema de Níveis Melhorado',
            description: 'Ganhe XP automaticamente ao postar e comentar. Level up agora gera notificação!',
            type: 'improvement',
            version: '0.2.0'
        },
        {
            icon: <Bell className="w-5 h-5" />,
            title: 'Bônus Diário Corrigido',
            description: 'O popup do bônus diário não aparece mais repetidamente após ser fechado.',
            type: 'fix',
            version: '0.2.0'
        },
        {
            icon: <Image className="w-5 h-5" />,
            title: 'Avatar GIF Premium',
            description: 'Membros nível 15+ agora podem usar GIFs animados como avatar (até 2MB).',
            type: 'feature',
            version: '0.2.0'
        },
        {
            icon: <Users className="w-5 h-5" />,
            title: 'Stories Modo Claro',
            description: 'Cores dos stories ajustadas para melhor visualização no modo claro (MGT).',
            type: 'improvement',
            version: '0.2.0'
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: 'Interface Aprimorada',
            description: 'Diversos ajustes visuais: loading centralizado, popups estilizados e mais.',
            type: 'improvement',
            version: '0.2.0'
        }
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

    const getTypeStyle = (type: UpdateItem['type']) => {
        switch (type) {
            case 'feature':
                return 'bg-blue-500/20 text-blue-400';
            case 'fix':
                return 'bg-green-500/20 text-green-400';
            case 'improvement':
                return 'bg-purple-500/20 text-purple-400';
        }
    };

    const getTypeLabel = (type: UpdateItem['type']) => {
        switch (type) {
            case 'feature':
                return 'Novo';
            case 'fix':
                return 'Correção';
            case 'improvement':
                return 'Melhoria';
        }
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
                            <h2 className="text-2xl font-bold text-white">Novidades! 🎉</h2>
                            <p className="text-white/80 text-sm">Versão {CURRENT_VERSION}</p>
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6 -mt-6">
                    <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        {updates.map((update, index) => (
                            <div 
                                key={index}
                                className={`flex gap-4 p-3 rounded-xl ${bgAccent} border ${borderAccent} transition-all hover:scale-[1.02]`}
                            >
                                <div className={`p-2 rounded-lg bg-zinc-800 ${accentColor} shrink-0`}>
                                    {update.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white text-sm">{update.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTypeStyle(update.type)}`}>
                                            {getTypeLabel(update.type)}
                                        </span>
                                    </div>
                                    <p className="text-zinc-400 text-xs leading-relaxed">{update.description}</p>
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
                        Entendi, vamos lá!
                    </button>
                    <p className="text-center text-zinc-500 text-xs mt-3">
                        Obrigado por fazer parte do {isMGT ? 'Clube MGT' : 'Clube Magazine'}!
                    </p>
                </div>
            </div>
        </div>
    );
}
