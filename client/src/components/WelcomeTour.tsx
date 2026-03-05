import { useState, useEffect } from 'react';
import { X, ChevronRight, Sparkles, Trophy, Coins, Users, ShoppingBag, Palette, Crown, Zap, Gift, Target, TrendingUp, Video, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_VERSION = '0.5.0-rc.20';

interface WelcomeTourProps {
    isOpen?: boolean;
    onClose?: () => void;
    onStartTutorial?: () => void;
}

export default function WelcomeTour({ isOpen: externalIsOpen, onClose: externalOnClose, onStartTutorial }: WelcomeTourProps = {}) {
    const { theme, user, accentColor: userAccentColor, accentGradient } = useAuth();
    const { config, tierStdName, tierVipName } = useCommunity();
    const [step, setStep] = useState(0);
    const [internalIsVisible, setInternalIsVisible] = useState(false);
    const [wantsTutorial, setWantsTutorial] = useState(true);
    const isMGT = user?.membershipType === 'MGT';
    const isDark = theme === 'dark';
    const hasCustomGradient = !!accentGradient;

    // Use external state if provided, otherwise use internal state
    const isVisible = externalIsOpen !== undefined ? externalIsOpen : internalIsVisible;

    // Dispatch event to hide BottomNavigation when WelcomeTour is open
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('welcomeTourStateChange', { detail: { isOpen: isVisible } }));
        return () => {
            // Cleanup: ensure navbar is shown when component unmounts
            window.dispatchEvent(new CustomEvent('welcomeTourStateChange', { detail: { isOpen: false } }));
        };
    }, [isVisible]);

    useEffect(() => {
        // Only auto-show if using internal state (no external control)
        if (externalIsOpen !== undefined) return;
        
        const seenTourVersion = localStorage.getItem('tour_version');
        if (seenTourVersion !== TOUR_VERSION) {
            setInternalIsVisible(true);
        }
    }, [externalIsOpen]);

    const handleClose = () => {
        setStep(0);
        localStorage.setItem('tour_version', TOUR_VERSION);
        
        // Check if user wants the guided tutorial
        if (wantsTutorial && !localStorage.getItem('tutorial_completed')) {
            localStorage.setItem('tutorial_requested', 'true');
            if (onStartTutorial) {
                onStartTutorial();
            }
        }
        
        if (externalOnClose) {
            externalOnClose();
        } else {
            setInternalIsVisible(false);
        }
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    // Features for the welcome screen
    const welcomeFeatures = [
        { icon: Users, label: 'Comunidade', desc: 'Conecte-se com outros membros' },
        { icon: Coins, label: 'Zions', desc: 'Ganhe moedas virtuais' },
        { icon: Trophy, label: 'Battle Pass', desc: 'Missões e recompensas' },
        { icon: Gift, label: 'Recompensas', desc: 'Troque por prêmios reais' },
        { icon: Swords, label: 'Desafios 1v1', desc: 'Aposte e vença amigos' },
        { icon: Video, label: 'Lives', desc: 'Transmissões ao vivo' },
        { icon: Palette, label: 'Customização', desc: 'Personalize seu perfil' },
        { icon: ShoppingBag, label: 'Loja', desc: 'Itens exclusivos' },
    ];

    const steps = [
        // Step 0: Welcome Hero Screen (NEW)
        {
            type: 'welcome-hero',
            title: isMGT ? `Bem-vindo à ${tierStdName}` : `Bem-vindo ao ${tierVipName}`,
            subtitle: isMGT 
                ? config.tierStdSlogan 
                : config.tierVipSlogan,
            description: "Uma experiência social premium com gamificação, recompensas reais e uma comunidade exclusiva.",
        },
        // Regular steps
        ...(isMGT ? [
            {
                title: "Sua Comunidade Exclusiva",
                description: "Você faz parte de uma comunidade exclusiva! Aqui você terá acesso a funcionalidades únicas, recompensas especiais e muito mais.",
                emoji: "🌟",
                features: [`Acesso exclusivo ${tierStdName}`, "Tema personalizado", "Benefícios VIP"]
            },
            {
                title: "Feed & Comunidade",
                description: "Compartilhe momentos, crie posts com imagens, interaja com curtidas e comentários. Conecte-se com outros membros!",
                emoji: "📱",
                features: ["Posts com mídia", "Curtidas e comentários", "Stories temporários"]
            },
            {
                title: "Sistema de Zions",
                description: "Nossa moeda virtual! Ganhe Zions por engajamento: posts, curtidas, comentários e login diário.",
                emoji: "⚡",
                features: ["Recompensas diárias", "Bônus por engajamento", "Multiplicadores"]
            },
            {
                title: "Loja & Recompensas",
                description: "Troque seus Zions por recompensas reais! Gift cards, itens exclusivos e muito mais.",
                emoji: "🛒",
                features: ["Gift Cards", "Itens exclusivos", "Recompensas rotativas"]
            },
            {
                title: "Ranking & Conquistas",
                description: "Suba de nível, desbloqueie badges exclusivos e dispute posições no ranking global!",
                emoji: "🏆",
                features: ["Sistema de níveis", "Badges colecionáveis", "Ranking semanal"]
            },
            {
                title: "Eventos & Mais",
                description: "Transmissões ao vivo, torneios, seletor de idiomas, rádio integrada, grupos e eventos exclusivos!",
                emoji: "📅",
                features: ["Lives integradas", "Torneios", "Multi-idiomas"]
            }
        ] : [
            {
                title: "Sua Comunidade Premium",
                description: "Uma plataforma exclusiva que combina rede social, gamificação e recompensas reais. Explore tudo o que preparamos para você!",
                emoji: "🌟",
                features: ["Rede social premium", "Sistema de recompensas", "Comunidade exclusiva"]
            },
            {
                title: "Feed & Posts",
                description: "Compartilhe seus momentos com posts, imagens e interaja com a comunidade através de curtidas e comentários.",
                emoji: "📱",
                features: ["Posts com mídia", "Curtidas e comentários", "Stories 24h"]
            },
            {
                title: "Sistema de Zions",
                description: "Ganhe Zions (nossa moeda virtual) por tudo que você faz: posts, curtidas, comentários, login diário e mais!",
                emoji: "⚡",
                features: ["Moeda virtual", "Recompensas diárias", "Bônus de engajamento"]
            },
            {
                title: "Loja Premium",
                description: "Use seus Zions para resgatar recompensas reais! Gift cards, itens exclusivos e muito mais.",
                emoji: "🛒",
                features: ["Gift Cards", "Itens exclusivos", "Recompensas rotativas"]
            },
            {
                title: "Ranking & Níveis",
                description: "Suba de nível com sua atividade, colecione badges exclusivos e dispute posições no ranking!",
                emoji: "🏆",
                features: ["15 níveis", "Badges únicos", "Ranking global"]
            },
            {
                title: "Recursos Extras",
                description: "Transmissões ao vivo, torneios, seletor de idiomas, rádio integrada, eventos e muito mais funcionalidades!",
                emoji: "✨",
                features: ["Lives integradas", "Torneios", "Multi-idiomas"]
            }
        ])
    ];

    const currentStep = steps[step];
    const isWelcomeHero = currentStep.type === 'welcome-hero';

    if (!isVisible) return null;

    // Accent colors based on membership (with custom gradient support)
    const accentBg = isMGT ? 'bg-tier-std-500' : 'bg-gold-500';
    const accentText = isMGT ? 'text-tier-std-400' : 'text-gold-400';
    const accentBorder = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const accentGlow = isMGT ? 'shadow-[0_0_60px_rgba(var(--tier-std-color-rgb),0.3)]' : 'shadow-[0_0_60px_rgba(212,175,55,0.3)]';

    // Custom gradient styles for buttons and icons
    const buttonGradientStyle = hasCustomGradient 
        ? { background: accentGradient } 
        : undefined;
    const iconColorStyle = hasCustomGradient 
        ? { color: userAccentColor } 
        : undefined;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-0 sm:p-4"
            >
                {isWelcomeHero ? (
                    // =============================================
                    // WELCOME HERO SCREEN - Apple Vision Pro Style
                    // =============================================
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`relative w-full h-full sm:h-auto sm:max-w-2xl sm:w-full sm:mx-auto ${isDark ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02]' : 'bg-white/95'} backdrop-blur-2xl sm:rounded-[2rem] border-0 sm:border ${accentBorder} ${accentGlow} overflow-hidden flex flex-col justify-center`}
                    >
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className={`absolute -top-1/2 -left-1/2 w-full h-full ${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'} rounded-full blur-3xl animate-pulse`} />
                            <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full ${isMGT ? 'bg-tier-std-600/5' : 'bg-amber-500/5'} rounded-full blur-3xl animate-pulse delay-1000`} />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className={`absolute top-5 right-5 z-20 p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20 text-white/60' : 'bg-black/5 hover:bg-black/10 text-black/40'} transition-all`}
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative z-10 p-5 sm:p-8 md:p-10">
                            {/* BETA Badge */}
                            <motion.div 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex justify-center mb-6"
                            >
                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${isDark ? `${isMGT ? 'bg-tier-std-500/20 text-tier-std-400 border-tier-std-500/30' : 'bg-gold-500/20 text-gold-400 border-gold-500/30'}` : `${isMGT ? 'bg-tier-std-100 text-tier-std-700' : 'bg-gold-100 text-gold-700'}`} border backdrop-blur-sm`}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    BETA v{TOUR_VERSION}
                                </span>
                            </motion.div>

                            {/* Logo/Icon - with custom color support */}
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                                className="flex justify-center mb-6"
                            >
                                <div 
                                    className={`relative w-24 h-24 rounded-3xl flex items-center justify-center border ${accentBorder} ${isDark ? `${isMGT ? 'bg-tier-std-500/20' : 'bg-gold-500/20'}` : `${isMGT ? 'bg-tier-std-100' : 'bg-gold-100'}`}`}
                                    style={hasCustomGradient ? { backgroundColor: `${userAccentColor}20` } : undefined}
                                >
                                    <Crown 
                                        className={`w-12 h-12 ${!hasCustomGradient ? accentText : ''}`} 
                                        style={iconColorStyle}
                                    />
                                    {/* Glow effect */}
                                    <div 
                                        className={`absolute inset-0 rounded-3xl blur-xl animate-pulse ${isMGT ? 'bg-tier-std-500/20' : 'bg-gold-500/20'}`} 
                                        style={hasCustomGradient ? { backgroundColor: `${userAccentColor}20` } : undefined}
                                    />
                                </div>
                            </motion.div>

                            {/* Title */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-center mb-2"
                            >
                                <h1 className={`text-3xl sm:text-4xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {currentStep.title}
                                </h1>
                            </motion.div>

                            {/* Subtitle - with custom color support */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-center mb-4"
                            >
                                <span 
                                    className={`text-lg font-medium ${!hasCustomGradient ? accentText : ''}`}
                                    style={iconColorStyle}
                                >
                                    {currentStep.subtitle}
                                </span>
                            </motion.div>

                            {/* Description */}
                            <motion.p 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8 max-w-md mx-auto`}
                            >
                                {currentStep.description}
                            </motion.p>

                            {/* Features Grid - Apple Vision Pro style with custom colors */}
                            <motion.div 
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
                            >
                                {welcomeFeatures.map((feature, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.8 + idx * 0.05 }}
                                        className={`group relative flex flex-col items-center p-3 rounded-2xl ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'bg-gray-100/80 hover:bg-gray-200/80'} border ${isDark ? 'border-white/[0.06]' : 'border-gray-200'} transition-all cursor-default`}
                                    >
                                        <div 
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${isDark ? `${isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10'}` : `${isMGT ? 'bg-tier-std-100' : 'bg-gold-100'}`}`}
                                            style={hasCustomGradient ? { backgroundColor: `${userAccentColor}15` } : undefined}
                                        >
                                            <feature.icon 
                                                className={`w-5 h-5 ${!hasCustomGradient ? accentText : ''}`} 
                                                style={iconColorStyle}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'} text-center`}>
                                            {feature.label}
                                        </span>
                                        {/* Tooltip on hover */}
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            <div className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap ${isDark ? 'bg-white/10 text-white' : 'bg-black/80 text-white'} backdrop-blur-sm`}>
                                                {feature.desc}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Highlights row */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 sm:mb-8"
                            >
                                <div className="flex items-center gap-2">
                                    <Target className={`w-4 h-4 ${!hasCustomGradient ? accentText : ''}`} style={iconColorStyle} />
                                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>15 Níveis</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className={`w-4 h-4 ${!hasCustomGradient ? accentText : ''}`} style={iconColorStyle} />
                                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>30+ Badges</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className={`w-4 h-4 ${!hasCustomGradient ? accentText : ''}`} style={iconColorStyle} />
                                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bônus Diário</span>
                                </div>
                            </motion.div>

                            {/* CTA Button - with custom gradient support */}
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.3 }}
                                className="flex flex-col items-center gap-4"
                            >
                                {/* Tutorial Checkbox */}
                                {!localStorage.getItem('tutorial_completed') && (
                                    <motion.label
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.4 }}
                                        className={`flex items-center gap-3 cursor-pointer select-none px-4 py-2.5 rounded-xl border transition-all ${
                                            wantsTutorial
                                                ? (isDark 
                                                    ? `${isMGT ? 'bg-tier-std-500/10 border-tier-std-500/30' : 'bg-gold-500/10 border-gold-500/30'}` 
                                                    : `${isMGT ? 'bg-tier-std-50 border-tier-std-200' : 'bg-gold-50 border-gold-200'}`)
                                                : (isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200')
                                        }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                wantsTutorial
                                                    ? `${isMGT ? 'bg-tier-std-500 border-tier-std-500' : 'bg-gold-500 border-gold-500'}` 
                                                    : (isDark ? 'border-gray-600' : 'border-gray-300')
                                            }`}
                                            onClick={() => setWantsTutorial(!wantsTutorial)}
                                        >
                                            {wantsTutorial && (
                                                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Quero fazer o tutorial guiado
                                        </span>
                                    </motion.label>
                                )}

                                <button
                                    onClick={handleNext}
                                    className={`group relative px-8 py-4 hover:brightness-110 text-black font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg ${!hasCustomGradient ? `${accentBg} ${isMGT ? 'shadow-tier-std-500/25' : 'shadow-gold-500/25'}` : ''}`}
                                    style={buttonGradientStyle}
                                >
                                    <span className="flex items-center gap-2">
                                        Explorar Recursos
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>

                                <button 
                                    onClick={handleClose}
                                    className={`text-sm ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                                >
                                    Pular introdução
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    // =============================================
                    // REGULAR STEP CARDS - Features Detail
                    // =============================================
                    <motion.div
                        key={step}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`${isDark ? (isMGT ? 'bg-tier-std-950/90' : 'bg-[#0a0a0a]') : 'bg-white'} border-0 sm:border ${isDark ? (isMGT ? 'sm:border-tier-std-500/30' : 'sm:border-gold-500/30') : (isMGT ? 'sm:border-tier-std-500/20' : 'sm:border-gold-500/20')} sm:rounded-2xl p-6 sm:p-8 w-full h-full sm:h-auto sm:max-w-lg flex flex-col justify-center items-center text-center relative ${accentGlow}`}
                    >
                        {/* BETA Badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${isMGT ? 'bg-tier-std-500/20 text-tier-std-400 border border-tier-std-500/30' : 'bg-gold-500/20 text-gold-400 border border-gold-500/30'} backdrop-blur-sm shadow-lg`}>
                                BETA v{TOUR_VERSION}
                            </span>
                        </div>

                        <button
                            onClick={handleClose}
                            className={`absolute top-4 right-4 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors z-10`}
                            aria-label="Fechar tour"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Emoji centered in card */}
                        <div className="pt-6 pb-4">
                            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                                <div className={`w-full h-full ${isDark ? (isMGT ? 'bg-tier-std-500/10' : 'bg-gold-500/10') : (isMGT ? 'bg-tier-std-50' : 'bg-gold-50')} rounded-full flex items-center justify-center border ${isMGT ? 'border-tier-std-500/20' : 'border-gold-500/20'}`}>
                                    <span className="text-4xl sm:text-5xl">{currentStep.emoji}</span>
                                </div>
                            </div>
                        </div>

                        <h2 className={`text-xl sm:text-2xl font-serif ${isDark ? (isMGT ? 'text-tier-std-300' : 'text-gold-300') : 'text-gray-900'} mb-2`}>
                            {currentStep.title}
                        </h2>
                        
                        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4 leading-relaxed text-sm sm:text-base`}>
                            {currentStep.description}
                        </p>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {currentStep.features?.map((feature: string, i: number) => (
                                <span 
                                    key={i}
                                    className={`px-3 py-1 text-xs rounded-full ${isDark 
                                        ? (isMGT ? 'bg-tier-std-500/10 text-tier-std-400 border border-tier-std-500/20' : 'bg-gold-500/10 text-gold-400 border border-gold-500/20')
                                        : (isMGT ? 'bg-tier-std-100 text-tier-std-700' : 'bg-gold-100 text-gold-700')
                                    }`}
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>

                        {/* Progress & Navigation - with custom gradient support */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {steps.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setStep(i)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step 
                                            ? (!hasCustomGradient ? (isMGT ? 'bg-tier-std-500 w-6' : 'bg-gold-500 w-6') : 'w-6') 
                                            : (isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400')
                                        }`}
                                        style={i === step && hasCustomGradient ? { backgroundColor: userAccentColor } : undefined}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleNext}
                                className={`flex items-center gap-2 text-black px-5 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:brightness-110 ${!hasCustomGradient ? (isMGT ? 'bg-tier-std-500 hover:bg-tier-std-400' : 'bg-gold-500 hover:bg-gold-400') : ''}`}
                                style={buttonGradientStyle}
                            >
                                {step === steps.length - 1 ? 'Começar!' : 'Próximo'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Skip link */}
                        <button 
                            onClick={handleClose}
                            className={`mt-4 text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                        >
                            Pular introdução
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
