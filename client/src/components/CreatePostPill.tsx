import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface CreatePostPillProps {
    onClick: () => void;
}

export default function CreatePostPill({ onClick }: CreatePostPillProps) {
    const { user, isMobileDrawerOpen } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    return (
        <motion.button
            onClick={onClick}
            animate={{ 
                y: isMobileDrawerOpen ? 100 : 0,
                opacity: isMobileDrawerOpen ? 0 : 1
            }}
            transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 30
            }}
            className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-6 md:px-6 py-2.5 md:py-3 rounded-full hover:scale-105 transition-all duration-300 group animate-fade-in-up ${
                isMGT 
                    ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                    : 'bg-accent text-black shadow-accent hover:shadow-[0_0_30px_rgba(var(--accent-color-rgb),0.6)]'
            }`}
        >
            <Plus className="w-5 h-5 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline font-bold uppercase tracking-widest text-xs">Criar Post</span>
        </motion.button>
    );
}
