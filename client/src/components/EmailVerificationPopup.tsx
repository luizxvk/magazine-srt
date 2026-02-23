import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, ShieldCheck, AlertTriangle, ArrowRight, Send } from 'lucide-react';
import Loader from './Loader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { playSound } from '../utils/sounds';

interface EmailVerificationPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EmailVerificationPopup({ isOpen, onClose }: EmailVerificationPopupProps) {
    const { user, updateUser, theme } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';
    const isDarkMode = theme === 'dark';
    
    // Theme colors
    const themeColor = isMGT ? 'emerald' : 'gold';
    const gradientFrom = isMGT ? 'from-tier-std-500' : 'from-gold-500';
    const gradientTo = isMGT ? 'to-tier-std-600' : 'to-amber-600';
    const accentText = isMGT ? 'text-tier-std-400' : 'text-gold-400';
    const accentBorder = isMGT ? 'border-tier-std-500' : 'border-gold-500';
    const accentRing = isMGT ? 'ring-tier-std-500/20' : 'ring-gold-500/20';
    const cardBg = isMGT ? 'from-tier-std-950/90 to-gray-950' : 'from-gray-900 to-gray-950';
    const borderColor = isMGT ? 'border-tier-std-500/20' : 'border-white/10';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [codeSent, setCodeSent] = useState(false);

    // Play sound when popup opens
    useEffect(() => {
        if (isOpen) {
            playSound('wrong');
        }
    }, [isOpen]);

    const refreshUserData = async () => {
        try {
            const response = await api.get('/users/me');
            if (response.data) {
                updateUser(response.data);
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    };

    const sendCode = async () => {
        try {
            setResending(true);
            setError('');
            await api.post('/auth/resend-verification');
            setCodeSent(true);
        } catch (err: any) {
            if (err.response?.data?.error === 'Email already verified') {
                setSuccess(true);
                await refreshUserData();
                setTimeout(onClose, 1500);
            } else {
                setError(err.response?.data?.error || 'Erro ao enviar código. Tente novamente.');
            }
        } finally {
            setResending(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            const nextInput = document.getElementById(`popup-code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`popup-code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        if (pastedData.length === 6 && /^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split('');
            setCode(newCode);
            const lastInput = document.getElementById('popup-code-5');
            lastInput?.focus();
        }
    };

    const handleVerify = async () => {
        const verificationCode = code.join('');
        
        if (verificationCode.length !== 6) {
            setError('Por favor, insira o código completo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/verify-email', { code: verificationCode });
            setSuccess(true);
            await refreshUserData();
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Código inválido. Tente novamente.');
            setCode(['', '', '', '', '', '']);
            document.getElementById('popup-code-0')?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleGoToVerificationPage = () => {
        onClose();
        navigate('/verify-email');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-md bg-gradient-to-b ${cardBg} rounded-2xl border ${borderColor} shadow-2xl overflow-hidden`}
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4`}>
                                {success ? (
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                ) : (
                                    <Mail className="w-8 h-8 text-white" />
                                )}
                            </div>

                            <h2 className="text-xl font-bold text-white mb-2">
                                {success ? 'Email Verificado!' : 'Verifique seu Email'}
                            </h2>

                            {!success && !codeSent && (
                                <p className="text-gray-400 text-sm">
                                    Clique no botão abaixo para receber um código de verificação em<br />
                                    <span className={`${accentText} font-medium`}>{user?.email}</span>
                                </p>
                            )}

                            {!success && codeSent && (
                                <p className="text-gray-400 text-sm">
                                    Enviamos um código de 6 dígitos para<br />
                                    <span className={`${accentText} font-medium`}>{user?.email}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {success ? (
                        <div className="p-6 pt-2">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className={`w-20 h-20 rounded-full ${isMGT ? 'bg-tier-std-500/20' : 'bg-gold-500/20'} flex items-center justify-center`}>
                                    <ShieldCheck className={`w-10 h-10 ${accentText}`} />
                                </div>
                                <p className="text-gray-300 text-center">
                                    Sua conta está verificada e protegida!
                                </p>
                            </motion.div>
                        </div>
                    ) : !codeSent ? (
                        // Estado inicial - mostrar botão para enviar código
                        <div className="p-6 pt-2 space-y-4">
                            <button
                                onClick={sendCode}
                                disabled={resending}
                                className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-${themeColor}-500/25 transition-all`}
                            >
                                {resending ? (
                                    <>
                                        <Loader size="sm" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Enviar Código
                                    </>
                                )}
                            </button>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 text-red-400 text-sm"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                onClick={handleGoToVerificationPage}
                                className="w-full flex items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                Ver mais detalhes
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Code Input */}
                            <div className="px-6 pb-4">
                                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`popup-code-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`w-11 h-14 text-center text-xl font-bold ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} border border-white/20 rounded-xl text-white focus:${accentBorder} focus:ring-2 focus:${accentRing} outline-none transition-all`}
                                            disabled={loading}
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-center gap-2 mt-4 text-red-400 text-sm"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                    </motion.div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-2 space-y-3">
                                <button
                                    onClick={handleVerify}
                                    disabled={loading || code.some(d => !d)}
                                    className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-${themeColor}-500/25 transition-all`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader size="sm" />
                                            Verificando...
                                        </>
                                    ) : (
                                        'Verificar Código'
                                    )}
                                </button>

                                <div className="flex items-center justify-between text-sm">
                                    <button
                                        onClick={sendCode}
                                        disabled={resending}
                                        className={`${accentText} hover:opacity-80 disabled:opacity-50 transition-colors`}
                                    >
                                        {resending ? 'Enviando...' : 'Reenviar código'}
                                    </button>

                                    <button
                                        onClick={handleGoToVerificationPage}
                                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Ver mais detalhes
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Warning Banner */}
                    {!success && (
                        <div className={`${isMGT ? 'bg-tier-std-500/10 border-tier-std-500/20' : 'bg-amber-500/10 border-amber-500/20'} border-t px-6 py-4`}>
                            <p className={`${isMGT ? 'text-tier-std-400/80' : 'text-amber-400/80'} text-xs text-center`}>
                                ⚠️ Verifique seu email para manter sua conta ativa e ter acesso a todas as funcionalidades.
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
