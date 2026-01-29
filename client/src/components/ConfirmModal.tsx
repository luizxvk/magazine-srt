import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = false
}: ConfirmModalProps) {
    const { theme } = useAuth();
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] w-screen h-screen flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className={`relative w-full max-w-md ${theme === 'light' ? 'bg-white/90 border-gray-200' : 'bg-[#0a0a0a]/80 border-white/10'} backdrop-blur-2xl border rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5`}
                    >
                        {/* Header */}
                        <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/5 bg-white/5'} flex items-center justify-between`}>
                            <h3 className={`text-lg font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'} flex items-center gap-3 tracking-wide font-serif`}>
                                {isDestructive && <AlertTriangle className="w-5 h-5 text-red-400" />}
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className={`${theme === 'light' ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-white/10'} transition-colors p-1 rounded-full`}
                                aria-label="Fechar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 text-center">
                            <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} leading-relaxed text-base font-light`}>
                                {message}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 flex justify-center gap-4 bg-black/20">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`px-8 py-2.5 rounded-full text-sm font-medium text-black transition-all shadow-lg hover:scale-105 active:scale-95 ${isDestructive
                                    ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
                                    : 'bg-gold-500 hover:bg-gold-400 shadow-gold-500/20'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
