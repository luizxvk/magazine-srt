import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface VisitorBlockPopupProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export default function VisitorBlockPopup({ isOpen, onClose, featureName = 'este recurso' }: VisitorBlockPopupProps) {
    const navigate = useNavigate();
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const gradientFrom = isMGT ? 'from-emerald-500' : 'from-yellow-500';
    const gradientTo = isMGT ? 'to-emerald-600' : 'to-yellow-600';
    const bgColor = theme === 'light' ? 'bg-white' : 'bg-zinc-900';
    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    const subTextColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    const handleCreateAccount = () => {
        onClose();
        navigate('/register');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative w-full max-w-sm ${bgColor} rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden`}
                    >
                        {/* Header com gradiente */}
                        <div className={`relative bg-gradient-to-r ${gradientFrom} ${gradientTo} p-6`}>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-start gap-3 mb-6">
                                <Sparkles className={`w-5 h-5 ${isMGT ? 'text-emerald-400' : 'text-yellow-400'} mt-1 flex-shrink-0`} />
                                <div>
                                    <p className={`${textColor} font-medium mb-2`}>
                                        Para acessar {featureName}, você precisa criar uma conta!
                                    </p>
                                    <p className={`${subTextColor} text-sm`}>
                                        Crie sua conta gratuitamente e tenha acesso completo a todas as funcionalidades da plataforma.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleCreateAccount}
                                    className={`w-full py-3 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-semibold hover:opacity-90 transition-opacity`}
                                >
                                    Criar Conta Grátis
                                </button>
                                <button
                                    onClick={onClose}
                                    className={`w-full py-3 rounded-xl ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'} font-medium transition-colors`}
                                >
                                    Continuar Explorando
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
