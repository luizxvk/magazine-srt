import { Plus, ChevronUp, Image, Hash, Type } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface CreatePostPillProps {
    onClick: () => void;
}

export default function CreatePostPill({ onClick }: CreatePostPillProps) {
    const { user, isMobileDrawerOpen } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const isMGT = user?.membershipType === 'MGT';
    
    const handleMainClick = () => {
        // No desktop, abre o modal direto
        if (window.innerWidth >= 768) {
            onClick();
        } else {
            // No mobile, expande as opções
            setIsExpanded(!isExpanded);
        }
    };

    const handleOptionClick = () => {
        onClick();
        setIsExpanded(false);
    };
    
    return (
        <>
            {/* Mobile: Opções Expandidas */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 md:hidden"
                    >
                        <motion.button
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: 20 }}
                            transition={{ delay: 0.05 }}
                            onClick={handleOptionClick}
                            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg backdrop-blur-xl ${
                                isMGT 
                                    ? 'bg-emerald-500/90 text-black border border-emerald-400/30'
                                    : 'bg-accent/90 text-black border border-gold-400/30'
                            }`}
                        >
                            <Image className="w-4 h-4" />
                            <span className="font-medium text-sm">Com Foto</span>
                        </motion.button>
                        
                        <motion.button
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: 20 }}
                            transition={{ delay: 0.1 }}
                            onClick={handleOptionClick}
                            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg backdrop-blur-xl ${
                                isMGT 
                                    ? 'bg-emerald-500/90 text-black border border-emerald-400/30'
                                    : 'bg-accent/90 text-black border border-gold-400/30'
                            }`}
                        >
                            <Type className="w-4 h-4" />
                            <span className="font-medium text-sm">Texto</span>
                        </motion.button>
                        
                        <motion.button
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: 20 }}
                            transition={{ delay: 0.15 }}
                            onClick={handleOptionClick}
                            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg backdrop-blur-xl ${
                                isMGT 
                                    ? 'bg-emerald-500/90 text-black border border-emerald-400/30'
                                    : 'bg-accent/90 text-black border border-gold-400/30'
                            }`}
                        >
                            <Hash className="w-4 h-4" />
                            <span className="font-medium text-sm">Com Tags</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botão Principal */}
            <motion.button
                onClick={handleMainClick}
                animate={{ 
                    y: isMobileDrawerOpen ? 100 : 0,
                    opacity: isMobileDrawerOpen ? 0 : 1,
                    rotate: isExpanded ? 45 : 0
                }}
                transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                }}
                className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full hover:scale-105 transition-all duration-300 group animate-fade-in-up ${
                    isMGT 
                        ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                        : 'bg-accent text-black shadow-accent hover:shadow-[0_0_30px_rgba(var(--accent-color-rgb),0.6)]'
                }`}
            >
                {/* Mobile: Apenas seta simples */}
                <ChevronUp className="w-5 h-5 md:hidden" />
                
                {/* Desktop: Plus icon + texto */}
                <Plus className="hidden md:block w-5 h-5 transition-transform duration-300" />
                <span className="hidden md:inline font-bold uppercase tracking-widest text-xs">Criar Post</span>
            </motion.button>
        </>
    );
}
