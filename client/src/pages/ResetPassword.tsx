import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Check, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import logo from '../assets/logo-mgzn.png';
import logoMgt from '../assets/logo-mgt-full.png';
import api from '../services/api';
import Loader from '../components/Loader';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isMGT] = useState(localStorage.getItem('lastMembershipType') === 'MGT');

    useEffect(() => {
        if (!token) {
            setError('Token de redefinição não encontrado. Solicite um novo link.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        try {
            setLoading(true);
            await api.post('/auth/reset-password', {
                token,
                newPassword: password
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao redefinir senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans p-4">
            {/* Animated Background */}
            <div className={`fixed inset-0 transition-colors duration-1000 ${isMGT ? 'bg-emerald-950/10' : 'bg-gold-950/10'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000000_80%)]" />
                <div className={`absolute inset-0 opacity-20 ${isMGT ? 'bg-[radial-gradient(circle_at_30%_20%,_rgba(16,185,129,0.15)_0%,_transparent_50%)]' : 'bg-[radial-gradient(circle_at_70%_20%,_rgba(212,175,55,0.15)_0%,_transparent_50%)]'}`} />
            </div>

            {/* Back Button */}
            <Link
                to="/login"
                className={`absolute top-6 left-6 z-30 flex items-center gap-2 text-sm transition-colors ${isMGT ? 'text-emerald-500/70 hover:text-emerald-400' : 'text-gold-500/70 hover:text-gold-400'}`}
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar ao Login</span>
            </Link>

            {/* Main Card */}
            <div className={`relative w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border z-10 ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
                {/* Gradient top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isMGT ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' : 'bg-gradient-to-r from-transparent via-gold-500 to-transparent'}`} />

                <div className="p-8 sm:p-10">
                    {/* Header with Logo */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img
                                src={isMGT ? logoMgt : logo}
                                alt={isMGT ? "MGT" : "MAGAZINE"}
                                className={`${isMGT ? 'h-14' : 'h-20'} drop-shadow-lg`}
                            />
                        </div>
                        <h2 className={`text-xl font-bold tracking-wide ${isMGT ? 'text-white' : 'text-gradient-gold'}`}>
                            Redefinir Senha
                        </h2>
                        <p className={`text-xs mt-2 tracking-widest uppercase ${isMGT ? 'text-emerald-400/50' : 'text-gold-400/50'}`}>
                            Crie uma nova senha segura
                        </p>
                    </div>

                    {success ? (
                        /* Success State */
                        <div className="text-center py-8">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                                <Check className={`w-8 h-8 ${isMGT ? 'text-emerald-500' : 'text-gold-500'}`} />
                            </div>
                            <h3 className="text-white text-lg font-bold mb-2">Senha Redefinida!</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
                                    ${isMGT
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                                        : 'bg-gold-500 hover:bg-gold-400 text-black shadow-lg shadow-gold-900/30'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                Fazer Login
                            </button>
                        </div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error Display */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* New Password Field */}
                            <div className="space-y-1">
                                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/[0.02] transition-all duration-300
                                    ${isMGT
                                        ? 'border-white/10 focus-within:border-emerald-500/50 focus-within:bg-emerald-500/5'
                                        : 'border-white/10 focus-within:border-gold-500/50 focus-within:bg-gold-500/5'
                                    }`}>
                                    <Lock size={18} className="text-gray-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nova senha"
                                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                                        disabled={!token}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-1">
                                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/[0.02] transition-all duration-300
                                    ${isMGT
                                        ? 'border-white/10 focus-within:border-emerald-500/50 focus-within:bg-emerald-500/5'
                                        : 'border-white/10 focus-within:border-gold-500/50 focus-within:bg-gold-500/5'
                                    }`}>
                                    <Lock size={18} className="text-gray-500" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmar nova senha"
                                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                                        disabled={!token}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !token}
                                className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6 flex items-center justify-center gap-2
                                    ${isMGT
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                                        : 'bg-gold-500 hover:bg-gold-400 text-black shadow-lg shadow-gold-900/30'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? (
                                    <>
                                        <Loader size="sm" />
                                        Redefinindo...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        Redefinir Senha
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-xs">
                            Lembrou a senha?
                            <Link
                                to="/login"
                                className={`font-bold ml-1 transition-colors ${isMGT ? 'text-emerald-500 hover:text-emerald-400' : 'text-gold-400 hover:text-gold-300'}`}
                            >
                                Fazer Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
