import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LuxuriousBackground from '../components/LuxuriousBackground';

export default function VerificationPage() {
    const { user, showToast } = useAuth();
    const navigate = useNavigate();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resending, setResending] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        // Redirect if already verified
        if (user?.isVerified) {
            navigate('/feed');
            return;
        }

        // NÃO envia código automaticamente - o usuário pode já ter recebido um código
        // e enviar um novo automaticamente invalidaria o anterior
        // O usuário pode clicar em "Reenviar" se precisar de um novo código

        // Calculate time remaining (mock - in real app get from user data)
        const calculateTimeRemaining = () => {
            // This would come from user.verificationExpiry in real implementation
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 3);
            
            const now = new Date();
            const diff = expiryDate.getTime() - now.getTime();
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            setTimeRemaining(`${days} dias e ${hours} horas`);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [user, navigate]);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return; // Only allow single digit
        if (value && !/^\d$/.test(value)) return; // Only allow numbers

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        if (pastedData.length === 6 && /^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split('');
            setCode(newCode);
            
            // Focus last input
            const lastInput = document.getElementById('code-5');
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
            
            // Refresh user data and redirect
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error;
            // Se já verificado, considerar sucesso
            if (errorMsg === 'Email already verified') {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/feed');
                }, 1000);
            } else {
                setError(errorMsg || 'Código inválido. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');

        try {
            await api.post('/auth/resend-verification');
            showToast('Código reenviado! Verifique seu email.');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error;
            // Se já verificado, redireciona
            if (errorMsg === 'Email already verified') {
                navigate('/feed');
            } else {
                setError(errorMsg || 'Erro ao reenviar código.');
            }
        } finally {
            setResending(false);
        }
    };

    const isMGT = user?.membershipType === 'MGT';

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white relative">
                <LuxuriousBackground />
                <div className="relative z-10 text-center">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-4xl font-bold mb-4">Email Verificado!</h1>
                    <p className="text-gray-300">Redirecionando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center text-white relative p-4">
            <LuxuriousBackground />
            
            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                        <Shield className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Verificação de Email</h1>
                    <p className="text-gray-400">
                        Enviamos um código de 6 dígitos para <strong>{user?.email}</strong>
                    </p>
                </div>

                {/* Warning Box */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-red-500 mb-1">Tempo Restante</p>
                            <p className="text-sm text-gray-300">
                                Você tem <strong>{timeRemaining}</strong> para verificar seu email.
                                Após esse período, sua conta será suspensa.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Code Input */}
                <div className={`bg-gray-800/50 backdrop-blur-sm border ${isMGT ? 'border-emerald-500/30' : 'border-gold-500/30'} rounded-xl p-8`}>
                    <label className="block text-sm font-medium mb-4 text-center">
                        Insira o código de verificação
                    </label>
                    
                    <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                id={`code-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 ${
                                    isMGT 
                                        ? 'bg-gray-700 border-emerald-500/50 focus:border-emerald-500' 
                                        : 'bg-gray-700 border-gold-500/50 focus:border-gold-500'
                                } focus:outline-none transition-colors`}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={loading || code.some(d => !d)}
                        className={`w-full py-3 rounded-lg font-semibold transition-all ${
                            isMGT
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-gold-600 hover:bg-gold-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? 'Verificando...' : 'Verificar Email'}
                    </button>

                    {/* Resend Button */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400 mb-2">Não recebeu o código?</p>
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors underline disabled:opacity-50"
                        >
                            {resending ? 'Reenviando...' : 'Reenviar código'}
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-400">
                            Verifique sua caixa de entrada e também a pasta de spam.
                            O email pode levar alguns minutos para chegar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
