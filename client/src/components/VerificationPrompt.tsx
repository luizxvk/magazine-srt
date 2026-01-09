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
    
    const isMGT = user?.membershipType === 'MGT';
    
    // Theme-based colors
    const bgGradient = isMGT 
        ? 'from-emerald-900/95 to-emerald-800/95' 
        : 'from-gold-900/95 to-gold-800/95';
    const buttonBg = isMGT 
        ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
        : 'bg-gold-500 hover:bg-gold-400 text-black';

    useEffect(() => {
        // Show prompt if user is not verified and hasn't dismissed it
        if (user && !user.isVerified && !dismissed) {
            const dismissedUntil = localStorage.getItem('verificationPromptDismissed');
            if (!dismissedUntil || new Date(dismissedUntil) < new Date()) {
                setShow(true);
            }
        } else if (user && user.isVerified) {
            // Hide if user is verified
            setShow(false);
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

    const handleVerify = async () => {
        try {
            // Envia código de verificação antes de redirecionar
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        } catch (err) {
            console.error('Erro ao enviar código:', err);
        }
        navigate('/verify-email');
    };

    // Não mostrar se já verificado
    if (user?.isVerified || !show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
            >
                <div className={`bg-gradient-to-br ${bgGradient} backdrop-blur-xl rounded-xl shadow-2xl border ${isMGT ? 'border-emerald-500/30' : 'border-gold-500/30'} p-6`}>
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'} flex items-center justify-center flex-shrink-0`}>
                            <Shield className={`w-6 h-6 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-serif text-lg mb-1 text-white font-bold">Verifique seu Email</h3>
                            <p className="text-sm text-white/90 mb-4 font-sans">
                                Sua conta ainda não foi verificada. Você tem 3 dias para verificar ou sua conta será suspensa.
                            </p>
                            <button
                                onClick={handleVerify}
                                className={`w-full ${buttonBg} font-semibold py-2.5 px-4 rounded-lg transition-colors font-sans`}
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
