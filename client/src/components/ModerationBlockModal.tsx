import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Ban, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ModerationBlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'text' | 'image';
    reason?: string;
}

export default function ModerationBlockModal({ isOpen, onClose, type, reason }: ModerationBlockModalProps) {
    const { theme } = useAuth();
    const isLight = theme === 'light';

    const isImage = type === 'image';

    const title = isImage
        ? 'Imagem Bloqueada'
        : 'Conteúdo Bloqueado';

    const description = isImage
        ? 'A imagem que você tentou enviar foi detectada como conteúdo impróprio e não pode ser publicada.'
        : 'O texto que você tentou publicar contém conteúdo inadequado e foi bloqueado pela moderação automática.';

    const getReasonLabel = (r: string) => {
        const labels: Record<string, string> = {
            'Conteúdo tóxico detectado': 'Linguagem tóxica',
            'Toxicidade severa detectada': 'Toxicidade severa',
            'Ameaça detectada': 'Ameaças',
            'Ataque de identidade detectado': 'Ataque discriminatório',
            'Insulto detectado': 'Insultos',
            'Profanidade detectada': 'Profanidade',
            'Conteúdo contém palavras proibidas': 'Palavras proibidas',
        };
        // Check if reason contains any key
        for (const [key, label] of Object.entries(labels)) {
            if (r.includes(key)) return label;
        }
        return r;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={e => e.stopPropagation()}
                        className={`relative w-full max-w-md rounded-2xl overflow-hidden ${
                            isLight ? 'bg-white border border-gray-200' : 'bg-gray-900/95 border border-red-500/20'
                        }`}
                    >
                        {/* Red accent bar */}
                        <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-orange-500" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                        </button>

                        <div className="p-6 pt-8 text-center space-y-5">
                            {/* Shield icon with pulse animation */}
                            <div className="relative inline-flex">
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                                />
                                <div className={`relative p-5 rounded-full ${
                                    isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-500/30'
                                }`}>
                                    <ShieldAlert className="w-12 h-12 text-red-500" />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                    {title}
                                </h3>
                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    <Ban className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                                        Moderação Automática
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                {description}
                            </p>

                            {/* Reason tag */}
                            {reason && (
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
                                    isLight
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-red-500/10 text-red-300 border border-red-500/20'
                                }`}>
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium">{getReasonLabel(reason)}</span>
                                </div>
                            )}

                            {/* Warning box */}
                            <div className={`p-4 rounded-xl text-left text-xs space-y-2 ${
                                isLight
                                    ? 'bg-amber-50 border border-amber-200 text-amber-800'
                                    : 'bg-yellow-500/5 border border-yellow-500/15 text-yellow-300/80'
                            }`}>
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
                                    <div>
                                        <p className="font-semibold mb-1">Atenção</p>
                                        <p>
                                            Violações repetidas podem resultar em restrições na sua conta.
                                            Mantenha o respeito e siga as regras da comunidade.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                                    isLight
                                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                }`}
                            >
                                Entendi
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
