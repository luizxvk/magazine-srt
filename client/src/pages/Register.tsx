import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, X, AlertCircle } from 'lucide-react';
import logo from '../assets/logo-mgzn.png';
import logoMgt from '../assets/logo-mgt-full.png';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [errorPopup, setErrorPopup] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const membershipType = location.state?.membershipType || 'MAGAZINE';
    const isMGT = membershipType === 'MGT';

    const onSubmit = async (data: RegisterForm) => {
        try {
            const response = await api.post('/auth/register', {
                ...data,
                membershipType
            });
            login(response.data.token, response.data.user, membershipType);
            navigate('/feed');
        } catch (error: any) {
            console.error('Registration failed', error);
            const errorMessage = error.response?.data?.error || 'Falha ao criar conta. Tente novamente.';
            
            // Show styled popup for email already exists error
            if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('já existe') || errorMessage.toLowerCase().includes('already')) {
                setErrorPopup(errorMessage);
            } else {
                setError('root', { message: errorMessage });
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans">
            {/* Error Popup Modal */}
            {errorPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setErrorPopup(null)} />
                    <div className={`relative w-full max-w-sm bg-neutral-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border p-6 animate-fade-in-up ${isMGT ? 'border-red-500/30' : 'border-red-500/30'}`}>
                        <button 
                            onClick={() => setErrorPopup(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className={`p-3 rounded-full mb-4 ${isMGT ? 'bg-red-500/20' : 'bg-red-500/20'}`}>
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Erro no Cadastro</h3>
                            <p className="text-gray-300 text-sm mb-4">{errorPopup}</p>
                            <button
                                onClick={() => setErrorPopup(null)}
                                className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${isMGT ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gold-500 hover:bg-gold-400 text-black'}`}
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Background */}
            <div className={`fixed inset-0 transition-colors duration-1000 ease-in-out ${isMGT ? 'bg-emerald-950/20' : 'bg-gold-950/20'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,0,0,0)_0%,_#000000_100%)]" />
                <div className={`absolute top-0 left-0 w-full h-full opacity-30 transition-opacity duration-1000 ${isMGT ? 'bg-[url("/patterns/grid.svg")]' : 'gold-flow'}`} />
                <div className="animated-fog opacity-30" />
            </div>

            {/* Logo Top Center */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center animate-fade-in-down">
                <img
                    src={logo}
                    alt="Logo"
                    className={`h-28 w-auto drop-shadow-[0_0_15px_${isMGT ? 'rgba(16,185,129,0.5)' : 'rgba(212,175,55,0.5)'}] transition-all duration-500`}
                />
            </div>

            {/* Main Card Container */}
            <div className={`relative w-full max-w-md bg-neutral-950/60 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border p-10 z-10 ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${isMGT ? 'from-emerald-900/10' : 'from-gold-900/10'} to-transparent pointer-events-none`} />

                {/* Header */}
                <div className="text-center mb-10 relative z-10">
                    <img
                        src={isMGT ? logoMgt : logo}
                        alt={isMGT ? "MGT" : "MAGAZINE"}
                        className={`mx-auto mb-6 ${isMGT ? 'h-16 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'h-28 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]'}`}
                    />
                    <h2 className={`text-2xl font-bold tracking-wide ${isMGT ? 'text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'text-gradient-gold'}`}>
                        {isMGT ? 'CRIAR CONTA MGT' : 'CRIAR CONTA'}
                    </h2>
                    <p className={`text-sm mt-3 font-light tracking-widest uppercase ${isMGT ? 'text-emerald-400/60' : 'text-gold-400/60'}`}>
                        {isMGT ? 'Velocidade e Poder' : 'A Elite do Sucesso'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                    {/* Name Field */}
                    <div className="space-y-1">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-neutral-900/60 transition-all duration-300
                            ${isMGT
                                ? 'border-emerald-500/20 focus-within:border-emerald-500/60 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                : 'border-gold-500/20 focus-within:border-gold-500/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                            }`}>
                            <User size={18} className={isMGT ? 'text-emerald-500/70' : 'text-gold-500/70'} />
                            <input
                                {...register('name')}
                                type="text"
                                placeholder="Seu nome completo"
                                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                            />
                        </div>
                        {errors.name && <p className="text-red-400 text-[10px] pl-2">{errors.name.message}</p>}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-neutral-900/60 transition-all duration-300
                            ${isMGT
                                ? 'border-emerald-500/20 focus-within:border-emerald-500/60 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                : 'border-gold-500/20 focus-within:border-gold-500/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                            }`}>
                            <Mail size={18} className={isMGT ? 'text-emerald-500/70' : 'text-gold-500/70'} />
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="seu@email.com"
                                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                            />
                        </div>
                        {errors.email && <p className="text-red-400 text-[10px] pl-2">{errors.email.message}</p>}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-neutral-900/60 transition-all duration-300
                            ${isMGT
                                ? 'border-emerald-500/20 focus-within:border-emerald-500/60 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                : 'border-gold-500/20 focus-within:border-gold-500/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                            }`}>
                            <Lock size={18} className={isMGT ? 'text-emerald-500/70' : 'text-gold-500/70'} />
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="Senha (mínimo 6 caracteres)"
                                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                            />
                        </div>
                        {errors.password && <p className="text-red-400 text-[10px] pl-2">{errors.password.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg mt-4
                            ${isMGT
                                ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-emerald-900/30 hover:shadow-emerald-600/40'
                                : 'bg-gradient-to-r from-gold-600 to-gold-500 text-black shadow-gold-900/30 hover:shadow-gold-500/40'
                            }`}
                    >
                        {isSubmitting ? 'Criando...' : 'Criar Conta'}
                    </button>

                    {errors.root && <p className="text-red-400 text-xs text-center">{errors.root.message}</p>}
                </form>

                {/* Footer Link */}
                <div className="mt-8 text-center relative z-10">
                    <p className="text-gray-500 text-xs">
                        Já tem conta?
                        <Link
                            to="/login"
                            state={{ membershipType }}
                            className={`font-bold ml-1 transition-colors ${isMGT ? 'text-emerald-500 hover:text-emerald-400' : 'text-gold-400 hover:text-gold-300'}`}
                        >
                            Fazer Login
                        </Link>
                    </p>
                </div>
            </div>

            {/* Visitor Access - Bottom */}
            <button
                onClick={() => navigate('/login')}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 hover:text-white text-xs uppercase tracking-widest transition-colors opacity-60 hover:opacity-100 z-20"
            >
                Voltar para Login
            </button>
        </div>
    );
}
