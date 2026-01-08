import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import WhatsNewModal from './WhatsNewModal';

export default function WhatsNewCard() {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [showModal, setShowModal] = useState(false);

    const themeBg = theme === 'light' ? 'bg-white' : 'bg-neutral-900/50';
    const themeBorder = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeIconBg = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';
    const themeIconColor = isMGT ? 'text-emerald-400' : 'text-gold-400';
    const themeGradient = isMGT 
        ? 'from-emerald-500/10 to-transparent' 
        : 'from-gold-500/10 to-transparent';

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowModal(true)}
                className={`${themeBg} ${themeBorder} border rounded-2xl p-6 cursor-pointer group transition-all hover:shadow-lg backdrop-blur-xl`}
            >
                <div className="flex items-start gap-4">
                    <div className={`${themeIconBg} p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Sparkles className={`w-6 h-6 ${themeIconColor}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold ${themeText} mb-1`}>
                            O Que Há de Novo
                        </h3>
                        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            Confira as últimas novidades e atualizações da plataforma
                        </p>
                    </div>
                </div>

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none`} />
            </motion.div>

            <WhatsNewModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}
