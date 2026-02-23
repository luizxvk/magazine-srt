import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';

interface TutorialStep {
    targetSelector: string;
    fallbackSelector?: string; // Fallback para desktop/mobile
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    fallbackPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        targetSelector: '[data-tutorial="stories"]',
        title: 'Stories',
        description: 'Aqui você pode ver e postar stories temporários, assim como seus amigos.',
        position: 'bottom',
    },
    {
        targetSelector: '[data-tutorial="create-post"]',
        title: 'Criar Post',
        description: 'Compartilhe momentos com a comunidade! Adicione texto, imagens e tags.',
        position: 'bottom',
    },
    {
        targetSelector: '[data-tutorial="feed-carousel"]',
        title: 'Destaques',
        description: 'Posts em destaque e lives da Twitch aparecem neste carousel.',
        position: 'bottom',
    },
    {
        targetSelector: '[data-tutorial="mobile-carousel"]',
        fallbackSelector: '[data-tutorial="sidebar-nav"]',
        title: 'Acesso Rápido',
        description: 'Bônus diário, Supply Box, eventos e mais — tudo ao alcance de um toque.',
        position: 'bottom',
        fallbackPosition: 'right',
    },
    {
        targetSelector: '[data-tutorial="nav-explore"]',
        fallbackSelector: '[data-tutorial="desktop-explore"]',
        title: 'Explorar',
        description: 'Descubra conteúdos, membros e ferramentas da comunidade.',
        position: 'top',
        fallbackPosition: 'bottom',
    },
    {
        targetSelector: '[data-tutorial="nav-store"]',
        fallbackSelector: '[data-tutorial="desktop-store"]',
        title: 'Loja',
        description: 'Troque seus Zions por recompensas reais, gift cards e itens exclusivos.',
        position: 'top',
        fallbackPosition: 'bottom',
    },
    {
        targetSelector: '[data-tutorial="nav-profile"]',
        fallbackSelector: '[data-tutorial="desktop-profile"]',
        title: 'Seu Perfil',
        description: 'Veja suas conquistas, nível, badges e personalize seu perfil.',
        position: 'top',
        fallbackPosition: 'left',
    },
];

interface GuidedTutorialProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GuidedTutorial({ isOpen, onClose }: GuidedTutorialProps) {
    const { user, theme } = useAuth();
    const { getAccentColor } = useTierColors();
    const isMGT = user?.membershipType === 'MGT';
    const isDark = theme === 'dark';
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [activePosition, setActivePosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

    const accentColor = getAccentColor(isMGT);
    const accentBorder = isMGT ? 'border-tier-std-500/50' : 'border-gold-500/50';

    // Check if element is actually visible in the viewport (not hidden by CSS)
    const isElementVisible = (el: Element): boolean => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        // Element is hidden if: display:none, visibility:hidden, zero size, or off-screen
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        if (rect.width === 0 && rect.height === 0) return false;
        // Check if the element or any parent has display:none (getBoundingClientRect returns 0,0,0,0)
        if (rect.width <= 0 || rect.height <= 0) return false;
        return true;
    };

    const findAndHighlight = useCallback((stepIndex: number) => {
        const step = TUTORIAL_STEPS[stepIndex];
        if (!step) return;

        // Try primary selector first
        let el = document.querySelector(step.targetSelector);
        let position = step.position;

        // If primary not found or not visible, try fallback
        if ((!el || !isElementVisible(el)) && step.fallbackSelector) {
            const fallbackEl = document.querySelector(step.fallbackSelector);
            if (fallbackEl && isElementVisible(fallbackEl)) {
                el = fallbackEl;
                position = step.fallbackPosition || step.position;
            }
        }

        if (el && isElementVisible(el)) {
            setActivePosition(position);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Small delay for scroll to complete
            setTimeout(() => {
                const rect = el.getBoundingClientRect();
                setTargetRect(rect);
                setIsVisible(true);
            }, 400);
        } else {
            // Skip to next step if element not found or not visible
            if (stepIndex < TUTORIAL_STEPS.length - 1) {
                setCurrentStep(stepIndex + 1);
            } else {
                handleClose();
            }
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setCurrentStep(0);
        setIsVisible(false);
        // Small delay to let page render
        setTimeout(() => findAndHighlight(0), 600);
    }, [isOpen, findAndHighlight]);

    useEffect(() => {
        if (isOpen) {
            findAndHighlight(currentStep);
        }
    }, [currentStep, isOpen, findAndHighlight]);

    // Recalculate position on resize
    useEffect(() => {
        if (!isOpen || !isVisible) return;
        const handleResize = () => findAndHighlight(currentStep);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen, isVisible, currentStep, findAndHighlight]);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('tutorial_completed', 'true');
        onClose();
    };

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setIsVisible(false);
            setTimeout(() => setCurrentStep(currentStep + 1), 200);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setIsVisible(false);
            setTimeout(() => setCurrentStep(currentStep - 1), 200);
        }
    };

    if (!isOpen) return null;

    const step = TUTORIAL_STEPS[currentStep];

    // Calculate tooltip position relative to target element
    const getTooltipStyle = (): React.CSSProperties => {
        if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const padding = 16;
        const tooltipWidth = 280;

        switch (activePosition) {
            case 'bottom':
                return {
                    top: targetRect.bottom + padding,
                    left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
                };
            case 'top':
                return {
                    bottom: window.innerHeight - targetRect.top + padding,
                    left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
                };
            case 'left':
                return {
                    top: targetRect.top + targetRect.height / 2 - 40,
                    right: window.innerWidth - targetRect.left + padding,
                };
            case 'right':
                return {
                    top: targetRect.top + targetRect.height / 2 - 40,
                    left: targetRect.right + padding,
                };
            default:
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
    };

    // Arrow pointing to target
    const getArrowStyle = (): React.CSSProperties & { arrowClass: string } => {
        if (!targetRect) return { arrowClass: '' };

        switch (activePosition) {
            case 'bottom':
                return {
                    arrowClass: 'before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:w-4 before:h-4 before:rotate-45',
                };
            case 'top':
                return {
                    arrowClass: 'before:absolute before:-bottom-2 before:left-1/2 before:-translate-x-1/2 before:w-4 before:h-4 before:rotate-45',
                };
            case 'left':
                return {
                    arrowClass: 'before:absolute before:top-1/2 before:-right-2 before:-translate-y-1/2 before:w-4 before:h-4 before:rotate-45',
                };
            case 'right':
                return {
                    arrowClass: 'before:absolute before:top-1/2 before:-left-2 before:-translate-y-1/2 before:w-4 before:h-4 before:rotate-45',
                };
            default:
                return { arrowClass: '' };
        }
    };

    const { arrowClass } = getArrowStyle();

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Overlay with cutout */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9998]"
                        onClick={handleClose}
                    >
                        {/* Dark overlay using box-shadow trick to create spotlight cutout */}
                        {targetRect && (
                            <div
                                className="absolute transition-all duration-300"
                                style={{
                                    top: targetRect.top - 6,
                                    left: targetRect.left - 6,
                                    width: targetRect.width + 12,
                                    height: targetRect.height + 12,
                                    borderRadius: '12px',
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                                    border: `2px solid ${accentColor}`,
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                    </motion.div>

                    {/* Pulsing ring around target */}
                    {targetRect && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed z-[9998] pointer-events-none"
                            style={{
                                top: targetRect.top - 10,
                                left: targetRect.left - 10,
                                width: targetRect.width + 20,
                                height: targetRect.height + 20,
                                borderRadius: '16px',
                                border: `2px solid ${accentColor}`,
                                animation: 'pulse 2s infinite',
                            }}
                        />
                    )}

                    {/* Tooltip */}
                    <motion.div
                        initial={{ opacity: 0, y: activePosition === 'top' ? 10 : -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`fixed z-[9999] w-[280px] ${arrowClass}`}
                        style={getTooltipStyle()}
                        onClick={e => e.stopPropagation()}
                    >
                        <div 
                            className={`relative p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${
                                isDark 
                                    ? `bg-gray-900/95 ${accentBorder} text-white` 
                                    : `bg-white/95 border-gray-200 text-gray-900`
                            }`}
                            style={{
                                boxShadow: `0 0 30px ${accentColor}30`,
                            }}
                        >
                            {/* Arrow indicator */}
                            <div
                                className={`absolute w-3 h-3 rotate-45 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'}`}
                                style={{
                                    borderColor: isDark ? `${accentColor}50` : '#e5e7eb',
                                    ...(activePosition === 'bottom' ? { top: -6, left: '50%', marginLeft: -6, borderTop: '1px solid', borderLeft: '1px solid' } : {}),
                                    ...(activePosition === 'top' ? { bottom: -6, left: '50%', marginLeft: -6, borderBottom: '1px solid', borderRight: '1px solid' } : {}),
                                    ...(activePosition === 'right' ? { left: -6, top: '50%', marginTop: -6, borderTop: '1px solid', borderLeft: '1px solid' } : {}),
                                    ...(activePosition === 'left' ? { right: -6, top: '50%', marginTop: -6, borderBottom: '1px solid', borderRight: '1px solid' } : {}),
                                }}
                            />

                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                                    isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Step counter */}
                            <div className="text-xs font-medium mb-2" style={{ color: accentColor }}>
                                {currentStep + 1} / {TUTORIAL_STEPS.length}
                            </div>

                            <h3 className="text-base font-bold mb-1">{step.title}</h3>
                            <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {step.description}
                            </p>

                            {/* Navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentStep === 0}
                                    className={`flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-30 ${
                                        isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Anterior
                                </button>

                                <div className="flex gap-1">
                                    {TUTORIAL_STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            className="rounded-full transition-all duration-300"
                                            style={{
                                                width: i === currentStep ? 16 : 6,
                                                height: 6,
                                                backgroundColor: i === currentStep ? accentColor : (isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db'),
                                            }}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={handleNext}
                                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:brightness-110`}
                                    style={{
                                        backgroundColor: accentColor,
                                        color: '#000',
                                    }}
                                >
                                    {currentStep === TUTORIAL_STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
