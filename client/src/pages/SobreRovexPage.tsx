import { motion } from 'framer-motion';
import { 
    Rocket, 
    Users, 
    Trophy, 
    Coins, 
    BarChart3, 
    Globe, 
    Zap,
    ArrowRight,
    ExternalLink,
    Mail,
    MessageCircle,
    Shield,
    Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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
            description: 'Sua comunidade com sua marca, cores e identidade visual exclusiva'
        },
        {
            icon: <Trophy className="w-6 h-6" />,
            title: 'Sistema de Gamificação',
            description: 'XP, níveis, conquistas e rankings automáticos que engajam seus membros'
        },
        {
            icon: <Coins className="w-6 h-6" />,
            title: 'Economia Virtual',
            description: 'Moeda virtual customizável para recompensas, trocas e incentivos'
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: 'Analytics Avançado',
            description: 'Métricas de engajamento, retenção e crescimento em tempo real'
        },
        {
            icon: <Globe className="w-6 h-6" />,
            title: 'Domínio Customizado',
            description: 'Use seu próprio domínio para uma experiência profissional'
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: 'API para Integrações',
            description: 'API REST completa para integrações com suas ferramentas favoritas'
        }
    ];

    const plans = [
        { name: 'FREE', users: 'Até 50', price: 'Grátis', period: '14 dias', highlight: 'Ideal para testar' },
        { name: 'STARTER', users: 'Até 500', price: 'R$ 247', period: '/mês', highlight: 'Para criadores iniciando' },
        { name: 'GROWTH', users: 'Até 2.000', price: 'R$ 597', period: '/mês', highlight: 'Domínio próprio + Analytics' },
        { name: 'ENTERPRISE', users: 'Ilimitado', price: 'R$ 1.497', period: '/mês', highlight: 'White-label completo' }
    ];

    const targetAudience = [
        { icon: '🎮', label: 'Criadores de conteúdo' },
        { icon: '📺', label: 'Streamers e influenciadores' },
        { icon: '🏢', label: 'Empresas e startups' },
        { icon: '📚', label: 'Educadores e mentores' },
        { icon: '🏷️', label: 'Marcas e agências' }
    ];

    const differentials = [
        { title: 'Infraestrutura completa', desc: 'Servidores, banco de dados e hospedagem gerenciados. Foque no que importa: sua comunidade.' },
        { title: 'Gamificação nativa', desc: 'Sistema de XP, tiers, moedas virtuais e rankings já prontos para engajar seus membros.' },
        { title: 'Customização total', desc: 'Cores, nomes dos níveis, moeda virtual e branding totalmente personalizáveis.' },
        { title: 'Escalabilidade garantida', desc: 'De 50 a milhões de usuários. A plataforma cresce junto com o seu sucesso.' }
    ];

    return (
        <div className={`min-h-screen relative ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
            {/* Animated Apple Vision Pro Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Main gradient orbs */}
                <motion.div 
                    className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30"
                    style={{ background: `radial-gradient(circle, ${rovexPurple} 0%, transparent 70%)` }}
                    animate={{
                        x: ['-20%', '10%', '-20%'],
                        y: ['-10%', '20%', '-10%'],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div 
                    className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20"
                    style={{ background: `radial-gradient(circle, ${rovexPurpleLight} 0%, transparent 70%)` }}
                    animate={{
                        x: ['20%', '-10%', '20%'],
                        y: ['10%', '-20%', '10%'],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div 
                    className="absolute left-1/2 top-1/2 w-[500px] h-[500px] rounded-full blur-[80px] opacity-15"
                    style={{ background: `radial-gradient(circle, ${rovexPurpleDark} 0%, transparent 70%)` }}
                    animate={{
                        x: ['-50%', '-30%', '-50%'],
                        y: ['-50%', '-70%', '-50%'],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                
                {/* Floating particles */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            background: i % 2 === 0 ? rovexPurple : rovexPurpleLight,
                            left: `${10 + (i * 7)}%`,
                            top: `${20 + (i * 5)}%`,
                            opacity: 0.4,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.3,
                        }}
                    />
                ))}

                {/* Grid overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(${rovexPurple} 1px, transparent 1px), linear-gradient(90deg, ${rovexPurple} 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="pt-20 pb-32 overflow-hidden">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center max-w-4xl mx-auto"
                        >
                            {/* Rovex Logo */}
                            <motion.div 
                                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-8 backdrop-blur-xl"
                                style={{ 
                                    background: `linear-gradient(135deg, ${rovexPurple}15, ${rovexPurpleDark}25)`, 
                                    border: `1px solid ${rovexPurple}30`,
                                    boxShadow: `0 0 40px ${rovexPurple}20`
                                }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <Rocket className="w-8 h-8" style={{ color: rovexPurple }} />
                                <span 
                                    className="text-3xl font-bold tracking-tight"
                                    style={{ color: rovexPurple }}
                                >
                                    Rovex
                                </span>
                            </motion.div>

                            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Transforme sua audiência em uma{' '}
                                <span 
                                    className="bg-clip-text text-transparent"
                                    style={{ backgroundImage: `linear-gradient(135deg, ${rovexPurple}, ${rovexPurpleLight})` }}
                                >
                                    comunidade engajada
                                </span>
                            </h1>

                            <p className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                A Rovex é a plataforma líder em comunidades gamificadas. Oferecemos toda a infraestrutura 
                                para você criar, personalizar e escalar sua comunidade com sistema de XP, moedas virtuais, 
                                rankings e recompensas. Tudo com a sua marca.
                            </p>

                            <motion.a
                                href="https://rovex.io?ref=magazine-srt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all"
                                style={{ 
                                    background: `linear-gradient(135deg, ${rovexPurple}, ${rovexPurpleDark})`,
                                    boxShadow: `0 10px 40px ${rovexPurple}40`
                                }}
                                whileHover={{ scale: 1.05, boxShadow: `0 15px 50px ${rovexPurple}50` }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Conheça a Rovex
                                <ExternalLink className="w-5 h-5" />
                            </motion.a>
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

                            <div 
                                className={`p-8 rounded-3xl backdrop-blur-xl ${theme === 'light' ? 'bg-white/80 shadow-xl' : 'bg-white/5 border border-white/10'}`}
                                style={{ boxShadow: theme !== 'light' ? `0 0 60px ${rovexPurple}10` : undefined }}
                            >
                                <p className={`text-lg leading-relaxed mb-6 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                    A <strong style={{ color: rovexPurple }}>Rovex</strong> é uma plataforma SaaS (Software as a Service) 
                                    especializada em criar e gerenciar comunidades gamificadas de forma completa e personalizada. 
                                    Oferecemos uma solução turnkey que permite a criadores, empresas e marcas lançarem suas próprias 
                                    comunidades digitais com sistemas de XP, economia virtual, rankings e recompensas.
                                </p>
                                <p className={`text-lg leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                    Nossa arquitetura multi-tenant garante que cada comunidade tenha seu próprio ambiente isolado, 
                                    com banco de dados dedicado, configurações personalizadas de branding e total controle sobre 
                                    a experiência dos seus membros. Tudo isso com a sua marca (white-label).
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Para quem é */}
                <section className={`py-20 ${theme === 'light' ? 'bg-gray-100/50' : 'bg-white/[0.02]'}`}>
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
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl cursor-default ${theme === 'light' ? 'bg-white/80 shadow-md' : 'bg-white/5 border border-white/10'}`}
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
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className={`p-6 rounded-2xl transition-all backdrop-blur-xl ${theme === 'light' ? 'bg-white/80 shadow-lg hover:shadow-xl' : 'bg-white/5 border border-white/10 hover:border-white/20'}`}
                                    style={{ boxShadow: theme !== 'light' ? `0 0 30px ${rovexPurple}05` : undefined }}
                                >
                                    <div 
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                        style={{ background: `linear-gradient(135deg, ${rovexPurple}20, ${rovexPurpleDark}30)`, color: rovexPurple }}
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
                <section className={`py-20 ${theme === 'light' ? 'bg-gray-100/50' : 'bg-white/[0.02]'}`}>
                    <div className="container mx-auto px-4">
                        <h2 className={`text-3xl md:text-4xl font-bold mb-12 text-center ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Por que escolher a Rovex?
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {differentials.map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-4"
                                >
                                    <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${rovexPurple}, ${rovexPurpleDark})` }}
                                    >
                                        <Check className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                            {item.title}
                                        </h3>
                                        <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
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
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className={`p-6 rounded-2xl text-center backdrop-blur-xl ${
                                        plan.name === 'GROWTH' 
                                            ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' 
                                            : ''
                                    } ${theme === 'light' ? 'bg-white/80 shadow-lg' : 'bg-white/5 border border-white/10'}`}
                                    style={plan.name === 'GROWTH' ? { boxShadow: `0 0 40px ${rovexPurple}30` } : undefined}
                                >
                                    {plan.name === 'GROWTH' && (
                                        <span 
                                            className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4"
                                            style={{ background: `linear-gradient(135deg, ${rovexPurple}, ${rovexPurpleDark})` }}
                                        >
                                            MAIS POPULAR
                                        </span>
                                    )}
                                    <h3 
                                        className="text-xl font-bold mb-2"
                                        style={{ color: rovexPurple }}
                                    >
                                        {plan.name}
                                    </h3>
                                    <p className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {plan.users} usuários
                                    </p>
                                    <p className={`text-2xl font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {plan.price}
                                        <span className="text-sm font-normal opacity-60">{plan.period}</span>
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
                    className="py-20 relative overflow-hidden"
                    style={{ 
                        background: `linear-gradient(135deg, ${rovexPurple}, ${rovexPurpleDark})` 
                    }}
                >
                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div 
                            className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        />
                        <motion.div 
                            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"
                            animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.1, 0.15] }}
                            transition={{ duration: 6, repeat: Infinity }}
                        />
                    </div>

                    <div className="container mx-auto px-4 text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Pronto para criar sua comunidade?
                            </h2>
                            <p className="text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
                                A Rovex é desenvolvida por uma equipe apaixonada por tecnologia e gamificação, 
                                com experiência comprovada em plataformas de alta escala.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <motion.a
                                    href="https://rovex.io?ref=magazine-srt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Acessar Rovex
                                    <ArrowRight className="w-5 h-5" />
                                </motion.a>
                                <motion.a
                                    href="mailto:contato@rovex.io"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-2xl font-semibold hover:bg-white/20 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Mail className="w-5 h-5" />
                                    Fale Conosco
                                </motion.a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <footer className={`py-12 ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
                    <div className="container mx-auto px-4">
                        {/* Links */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm mb-8">
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

                        {/* Divider */}
                        <div className={`w-full max-w-lg mx-auto h-px mb-8 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`} />

                        {/* Copyright */}
                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Shield className="w-4 h-4" style={{ color: rovexPurple }} />
                                <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                    Rovex é uma propriedade da <strong>FokusStudios</strong>
                                </span>
                            </div>
                            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                © {new Date().getFullYear()} FokusStudios. Todos os direitos reservados.
                            </p>
                            <p className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'}`}>
                                São Paulo, Brasil
                            </p>
                        </div>

                        {/* Back to Magazine */}
                        <div className="text-center mt-8">
                            <Link 
                                to="/feed" 
                                className={`text-sm ${theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-500 hover:text-gray-300'} transition-colors`}
                            >
                                ← Voltar para o Magazine SRT
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
