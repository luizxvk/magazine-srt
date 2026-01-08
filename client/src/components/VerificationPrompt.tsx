import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerificationPrompt() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Show prompt if user is not verified and hasn't dismissed it
        if (user && !user.isVerified && !dismissed) {
            const dismissedUntil = localStorage.getItem('verificationPromptDismissed');
            if (!dismissedUntil || new Date(dismissedUntil) < new Date()) {
                setShow(true);
            }
        }
    }, [user, dismissed]);

    const handleDismiss = () => {
        setShow(false);
        setDismissed(true);
        // Dismiss for 1 hour
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        localStorage.setItem('verificationPromptDismissed', oneHourFromNow.toISOString());
    };

    const handleVerify = () => {
        navigate('/verify-email');
    };

    if (!show || user?.isVerified) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
            >
                <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 p-6">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">Verifique seu Email</h3>
                            <p className="text-sm text-white/90 mb-4">
                                Sua conta ainda não foi verificada. Você tem 3 dias para verificar ou sua conta será suspensa.
                            </p>
                            <button
                                onClick={handleVerify}
                                className="w-full bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
                            >
                                Verificar Agora
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
