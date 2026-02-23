import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supportedLanguages, type LanguageCode } from '../i18n';
import { useAuth } from '../context/AuthContext';

interface LanguageSelectorProps {
    variant?: 'dropdown' | 'inline';
    className?: string;
}

export default function LanguageSelector({ variant = 'dropdown', className = '' }: LanguageSelectorProps) {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const currentLang = supportedLanguages.find(l => l.code === i18n.language) || supportedLanguages[0];

    const changeLanguage = (code: LanguageCode) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (variant === 'inline') {
        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                {supportedLanguages.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            i18n.language === lang.code
                                ? isMGT
                                    ? 'bg-tier-std-500/10 border border-tier-std-500/30 text-tier-std-400'
                                    : 'bg-gold-500/10 border border-gold-500/30 text-gold-400'
                                : 'bg-white/[0.03] border border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                        }`}
                    >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium flex-1 text-left">{lang.label}</span>
                        {i18n.language === lang.code && (
                            <Check size={16} className={isMGT ? 'text-tier-std-400' : 'text-gold-400'} />
                        )}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-200"
            >
                <Globe size={14} className="opacity-60" />
                <span className="text-xs font-medium">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                <ChevronDown size={12} className={`opacity-40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 py-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] shadow-xl z-50"
                    >
                        {supportedLanguages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    i18n.language === lang.code
                                        ? isMGT ? 'text-tier-std-400 bg-tier-std-500/10' : 'text-gold-400 bg-gold-500/10'
                                        : 'text-white/60 hover:text-white/90 hover:bg-white/[0.04]'
                                }`}
                            >
                                <span className="text-base">{lang.flag}</span>
                                <span className="flex-1 text-left font-medium">{lang.label}</span>
                                {i18n.language === lang.code && <Check size={14} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
