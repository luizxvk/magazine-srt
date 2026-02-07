import { motion } from 'framer-motion';
import { 
    Rocket, 
    Users, 
    Sparkles, 
    Trophy, 
    Coins, 
    BarChart3, 
    Globe, 
    Zap,
    ArrowRight,
    ExternalLink,
    Mail,
    MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SobreRovexPage() {
    const { theme } = useAuth();

    // Rovex brand colors
    const rovexPurple = '#8B5CF6';
    const rovexPurpleDark = '#7C3AED';
    const rovexPurpleLight = '#A78BFA';

    const features = [
        {
            icon: <Users className="w-6 h-6" />,
            title: 'Comunidades White-label',
            description: 'Sua comunidade com sua marca, cores e identidade visual'
        },
        {
            icon: <Trophy className="w-6 h-6" />,
            title: 'Sistema de Gamificação',
            description: 'XP, níveis (tiers), conquistas e rankings automáticos'
        },
        {
            icon: <Coins className="w-6 h-6" />,
            title: 'Economia Virtual',
            description: 'Moeda virtual customizável para recompensas e trocas'
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: 'Analytics Avançado',
            description: 'Métricas de engajamento, retenção e crescimento'
        },
        {
            icon: <Globe className="w-6 h-6" />,
            title: 'Domínio Customizado',
            description: 'Use seu próprio domínio (ex: comunidade.suamarca.com)'
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: 'API para Integrações',
            description: 'API REST completa para integrações customizadas'
        }
    ];

    const plans = [
        { name: 'FREE', users: 'Até 50', price: 'Grátis (14 dias)', highlight: 'Ideal para testar' },
        { name: 'STARTER', users: 'Até 500', price: 'R$ 247/mês', highlight: 'Para criadores iniciando' },
        { name: 'GROWTH', users: 'Até 2.000', price: 'R$ 597/mês', highlight: 'Domínio próprio + Analytics' },
        { name: 'ENTERPRISE', users: 'Ilimitado', price: 'R$ 1.497/mês', highlight: 'White-label completo' }
    ];

    const targetAudience = [
        { icon: '🎮', label: 'Criadores de conteúdo' },
        { icon: '📺', label: 'Streamers e influenciadores' },
        { icon: '🏢', label: 'Empresas' },
        { icon: '📚', label: 'Educadores' },
        { icon: '🏷️', label: 'Marcas' }
    ];

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
            {/* Hero Section */}
            <section 
                className="relative pt-20 pb-32 overflow-hidden"
                style={{ 
                    background: `linear-gradient(135deg, ${rovexPurple}15, ${rovexPurpleDark}30, transparent)` 
                }}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div 
                        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30"
                        style={{ background: rovexPurple }}
                    />
                    <div 
                        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20"
                        style={{ background: rovexPurpleLight }}
                    />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        {/* Rovex Logo placeholder */}
                        <div 
                            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-8"
                            style={{ background: `${rovexPurple}20`, border: `1px solid ${rovexPurple}30` }}
                        >
                            <Rocket className="w-8 h-8" style={{ color: rovexPurple }} />
                            <span 
                                className="text-3xl font-bold tracking-tight"
                                style={{ color: rovexPurple }}
                            >
                                Rovex
                            </span>
                        </div>

                        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Transforme sua audiência em uma{' '}
                            <span style={{ color: rovexPurple }}>comunidade engajada</span>
                        </h1>

                        <p className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            A Rovex é a plataforma que potencializa comunidades digitais com gamificação inteligente. 
                            Oferecemos toda a infraestrutura para você criar, personalizar e escalar sua comunidade — 
                            com sistema de XP, moedas virtuais, rankings e recompensas. Tudo com a sua marca.
                        </p>

                        <a
                            href="https://rovex.io?ref=magazine-srt"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-xl"
                            style={{ 
                                background: `linear-gradient(135deg, ${rovexPurple}, ${rovexPurpleDark})`,
                                boxShadow: `0 10px 40px ${rovexPurple}40`
                            }}
                        >
                            Conheça a Rovex
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* O que é a Rovex */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <h2 className={`text-3xl md:text-4xl font-bold mb-8 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            O que é a <span style={{ color: rovexPurple }}>Rovex</span>?
                        </h2>

                        <div className={`p-8 rounded-3xl ${theme === 'light' ? 'bg-white shadow-xl' : 'bg-white/5 border border-white/10'}`}>
                            <p className={`text-lg leading-relaxed mb-6 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                A <strong style={{ color: rovexPurple }}>Rovex</strong> é uma plataforma SaaS (Software as a Service) 
                                especializada em criar e gerenciar <strong>comunidades gamificadas</strong> de forma completa e personalizada. 
                                Oferecemos uma solução turnkey que permite a criadores, empresas e marcas lançarem suas próprias 
                                comunidades digitais com sistemas de XP, economia virtual, rankings e recompensas — tudo isso com a sua marca (white-label).
                            </p>
                            <p className={`text-lg leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                Nossa arquitetura multi-tenant garante que cada comunidade tenha seu próprio ambiente isolado, 
                                com banco de dados dedicado, configurações personalizadas de branding e total controle sobre a experiência dos usuários.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Para quem é */}
            <section className={`py-20 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                <div className="container mx-auto px-4">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-12 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Para quem é a Rovex?
                    </h2>

                    <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
                        {targetAudience.map((item, index) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl ${theme === 'light' ? 'bg-white shadow-md' : 'bg-white/10 border border-white/10'}`}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className={`font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                    {item.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-4 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        O que a Rovex oferece
                    </h2>
                    <p className={`text-center mb-12 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Tudo que você precisa para criar uma comunidade de sucesso
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-6 rounded-2xl transition-all hover:scale-[1.02] ${theme === 'light' ? 'bg-white shadow-lg hover:shadow-xl' : 'bg-white/5 border border-white/10 hover:border-white/20'}`}
                            >
                                <div 
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                    style={{ background: `${rovexPurple}20`, color: rovexPurple }}
                                >
                                    {feature.icon}
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    {feature.title}
                                </h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Diferenciais */}
            <section className={`py-20 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                <div className="container mx-auto px-4">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-12 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Por que escolher a Rovex?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {[
                            { title: 'Infraestrutura completa', desc: 'Você não precisa se preocupar com servidores, banco de dados ou hospedagem — a Rovex cuida de tudo.' },
                            { title: 'Gamificação nativa', desc: 'Sistema de XP, tiers, moedas virtuais e rankings já integrados.' },
                            { title: 'Customização total', desc: 'Cores, nomes dos níveis, moeda virtual e branding personalizáveis.' },
                            { title: 'Escalabilidade', desc: 'De 50 a milhões de usuários, a plataforma cresce com você.' }
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex items-start gap-4"
                            >
                                <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: rovexPurple }}
                                >
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {item.title}
                                    </h3>
                                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Planos */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-4 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Planos flexíveis
                    </h2>
                    <p className={`text-center mb-12 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        15% de desconto no plano anual
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-6 rounded-2xl text-center ${
                                    plan.name === 'GROWTH' 
                                        ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' 
                                        : ''
                                } ${theme === 'light' ? 'bg-white shadow-lg' : 'bg-white/5 border border-white/10'}`}
                            >
                                {plan.name === 'GROWTH' && (
                                    <span 
                                        className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4"
                                        style={{ background: rovexPurple }}
                                    >
                                        POPULAR
                                    </span>
                                )}
                                <h3 
                                    className="text-xl font-bold mb-2"
                                    style={{ color: rovexPurple }}
                                >
                                    {plan.name}
                                </h3>
                                <p className={`text-sm mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {plan.users} usuários
                                </p>
                                <p className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    {plan.price}
                                </p>
                                <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {plan.highlight}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section 
                className="py-20"
                style={{ 
                    background: `linear-gradient(135deg, ${rovexPurple}, ${rovexPurpleDark})` 
                }}
            >
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Pronto para criar sua comunidade?
                        </h2>
                        <p className="text-white/80 mb-8 max-w-lg mx-auto">
                            A Rovex é desenvolvida por uma equipe apaixonada por tecnologia e gamificação, 
                            com experiência em plataformas de alta escala.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://rovex.io?ref=magazine-srt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Acessar Rovex
                                <ArrowRight className="w-5 h-5" />
                            </a>
                            <a
                                href="mailto:contato@rovex.io"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-2xl font-semibold hover:bg-white/20 transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                                Fale Conosco
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Contato */}
            <section className={`py-16 ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <a 
                            href="https://rovex.io" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'} transition-colors`}
                        >
                            <Globe className="w-4 h-4" />
                            rovex.io
                        </a>
                        <a 
                            href="mailto:contato@rovex.io"
                            className={`flex items-center gap-2 ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'} transition-colors`}
                        >
                            <Mail className="w-4 h-4" />
                            contato@rovex.io
                        </a>
                        <a 
                            href="https://discord.gg/rovex" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'} transition-colors`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Discord
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
