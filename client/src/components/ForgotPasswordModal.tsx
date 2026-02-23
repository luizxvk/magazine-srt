import { useState } from 'react';
import { X, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import api from '../services/api';
import { sendPasswordResetEmail, isEmailJSConfigured } from '../services/emailjs';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMGT: boolean;
}

export default function ForgotPasswordModal({ isOpen, onClose, isMGT }: ForgotPasswordModalProps) {
    const [step, setStep] = useState<'EMAIL' | 'RESET'>('EMAIL');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            // 1. Request reset token from backend
            const response = await api.post('/auth/request-reset', { email });
            
            // If user doesn't exist, show generic message
            if (!response.data.exists) {
                setMessage('Se uma conta existir com este email, você receberá instruções.');
                return;
            }

            // 2. Send email via EmailJS
            const { emailData } = response.data;
            
            if (isEmailJSConfigured()) {
                const emailSent = await sendPasswordResetEmail(emailData);
                
                if (emailSent) {
                    setMessage('Email enviado com sucesso! Verifique sua caixa de entrada (e spam).');
                } else {
                    // EmailJS failed - show link directly for now
                    setError('Falha ao enviar email. Use o link abaixo:');
                    setMessage(emailData.reset_link);
                }
            } else {
                // EmailJS not configured - show link directly
                setMessage('Copie o link abaixo para redefinir sua senha:');
                setToken(emailData.reset_link);
                // Auto navigate to reset step
                setTimeout(() => setStep('RESET'), 500);
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
            } else {
                setError(err.response?.data?.error || 'Falha ao solicitar redefinição.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setMessage('Senha redefinida com sucesso! Redirecionando...');
            setTimeout(() => {
                onClose();
                setStep('EMAIL');
                setEmail('');
                setToken('');
                setNewPassword('');
                setMessage('');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao redefinir senha.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const themeBorder = isMGT ? 'border-tier-std-500/30' : 'border-gold-500/30';
    const themeButton = isMGT ? 'bg-tier-std-600 hover:bg-tier-std-500' : 'bg-gold-500 hover:bg-gold-400';
    const themeInputFocus = isMGT ? 'focus:border-tier-std-500/50' : 'focus:border-gold-500/50';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-md bg-black/90 border ${themeBorder} rounded-2xl p-8 shadow-2xl animate-fade-in-up`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-serif text-white mb-2">Recuperar Acesso</h2>
                    <p className="text-gray-400 text-sm">
                        {step === 'EMAIL'
                            ? 'Informe seu email para receber o link de redefinição.'
                            : 'Defina sua nova senha de acesso.'}
                    </p>
                </div>

                {message && (
                    <div className={`mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center flex items-center justify-center gap-2`}>
                        <Check className="w-4 h-4" />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {step === 'EMAIL' ? (
                    <form onSubmit={handleRequestReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none ${themeInputFocus} transition-all`}
                                    placeholder="seu@email.com"
                                    required
                                    aria-label="Email"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-black uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] ${themeButton} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {loading ? 'Enviando...' : (
                                <>
                                    Enviar Link <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Código (Token)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none ${themeInputFocus} transition-all`}
                                    placeholder="Código recebido"
                                    required
                                    aria-label="Código de verificação"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none ${themeInputFocus} transition-all`}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    aria-label="Nova senha"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-black uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] ${themeButton} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
