import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRightLeft, User, Lock } from 'lucide-react';
import logo from '../assets/logo-mgzn.png';
import logoSrt from '../assets/logo-srt.png';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const loginSchema = z.object({
    email: z.string().trim().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ModernLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginAsVisitor } = useAuth();

    // Determine initial state based on navigation or storage
    const initialMembership = location.state?.membershipType || localStorage.getItem('lastMembershipType') || 'MAGAZINE';
    const [isSRT, setIsSRT] = useState(initialMembership === 'SRT');

    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Form hooks - Separate forms to avoid input registration conflicts
    const magazineForm = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const srtForm = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    // Update form context/theme when toggling
    const toggleMembership = () => {
        setIsSRT(!isSRT);
    };

    const onMagazineSubmit = async (data: LoginForm) => {
        console.log('Magazine Form Submitted:', data);
        await handleLogin(data, magazineForm.setError);
    };

    const onSrtSubmit = async (data: LoginForm) => {
        console.log('SRT Form Submitted:', data);
        await handleLogin(data, srtForm.setError);
    };

    const handleLogin = async (data: LoginForm, setError: any) => {
        try {
            console.log('Sending login request to server...');
            const response = await api.post('/auth/login', data);
            console.log('Login success:', response.data);
            login(response.data.token, response.data.user);
            navigate('/feed');
        } catch (error: any) {
            console.error('Login failed', error);
            const errorMessage = error.response?.data?.error || 'Falha ao entrar. Verifique suas credenciais.';
            setError('root', { message: errorMessage });
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans">
            {/* Dynamic Background */}
            <div className={`fixed inset-0 transition-colors duration-1000 ease-in-out ${isSRT ? 'bg-red-950/20' : 'bg-gold-950/20'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,0,0,0)_0%,_#000000_100%)]" />
                <div className={`absolute top-0 left-0 w-full h-full opacity-30 transition-opacity duration-1000 ${isSRT ? 'bg-[url("/patterns/grid.svg")]' : 'gold-flow'}`} />
                <div className="animated-fog opacity-30" />
            </div>

            {/* Main Card Container */}
            <div className="relative w-full max-w-[1000px] min-h-[600px] bg-black/40 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/5 flex z-10">

                {/* LEFT PANEL (Magazine Form) - Visible when !isSRT */}
                <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center p-12 transition-all duration-700 ease-in-out ${isSRT ? 'opacity-0 -translate-x-20 pointer-events-none' : 'opacity-100 translate-x-0 z-10'}`}>
                    <div className="text-center mb-8">
                        <img src={logo} alt="Magazine" className="h-48 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                        <h2 className="text-3xl font-bold text-gradient-gold mb-2">BEM VINDO</h2>
                        <p className="text-gold-400/60 text-xs uppercase tracking-widest">A Elite do Sucesso</p>
                    </div>

                    <LoginForm
                        register={magazineForm.register}
                        errors={magazineForm.formState.errors}
                        isSubmitting={magazineForm.formState.isSubmitting}
                        onSubmit={magazineForm.handleSubmit(onMagazineSubmit)}
                        isSRT={false}
                        onForgotPassword={() => setIsForgotPasswordOpen(true)}
                    />

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-xs">
                            Deseja fazer parte?
                            <Link to="/request-invite" className="text-gold-400 hover:text-gold-300 font-bold ml-1 transition-colors">
                                Solicitar Convite
                            </Link>
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL (SRT Form) - Visible when isSRT */}
                <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center p-12 transition-all duration-700 ease-in-out ${!isSRT ? 'opacity-0 translate-x-20 pointer-events-none' : 'opacity-100 translate-x-0 z-10'}`}>
                    <div className="text-center mb-8">
                        <img src={logoSrt} alt="SRT" className="h-20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(220,20,60,0.5)]" />
                        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(220,20,60,0.8)]">ACESSO MEMBRO</h2>
                        <p className="text-red-500/80 text-xs uppercase tracking-widest">Velocidade e Poder</p>
                    </div>

                    <LoginForm
                        register={srtForm.register}
                        errors={srtForm.formState.errors}
                        isSubmitting={srtForm.formState.isSubmitting}
                        onSubmit={srtForm.handleSubmit(onSrtSubmit)}
                        isSRT={true}
                        onForgotPassword={() => setIsForgotPasswordOpen(true)}
                    />

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-xs">
                            Ainda não é membro?
                            <Link to="/register" state={{ membershipType: 'SRT' }} className="text-red-500 hover:text-red-400 font-bold ml-1 transition-colors">
                                Criar Conta
                            </Link>
                        </p>
                    </div>
                </div>

                {/* OVERLAY / SLIDER */}
                {/* If isSRT is TRUE: Overlay is on LEFT. It should show Magazine Invite. */}
                {/* If isSRT is FALSE: Overlay is on RIGHT. It should show SRT Invite. */}
                <div className={`absolute top-0 left-0 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-20 ${isSRT ? 'translate-x-0' : 'translate-x-full'}`}>

                    {/* Inner Content Container - We just toggle opacity of the two invites */}
                    <div className="relative w-full h-full">

                        {/* MAGAZINE INVITE (Visible when Overlay is Left -> isSRT is True) */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-r from-gold-950 via-black to-black border-r border-gold-500/20 transition-opacity duration-500 ${isSRT ? 'opacity-100 delay-200' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)]" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="mb-6 p-4 rounded-full bg-gold-500/10 border border-gold-500/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                                    <img src={logo} alt="Magazine" className="h-16 opacity-80" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Membro Magazine?</h2>
                                <p className="text-gold-200/60 mb-8 max-w-xs">
                                    Acesse o clube de elite e gerencie seu império.
                                </p>
                                <button
                                    onClick={toggleMembership}
                                    className="px-8 py-3 rounded-full border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-black transition-all duration-300 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                                >
                                    Acessar Magazine
                                </button>
                            </div>
                        </div>

                        {/* SRT INVITE (Visible when Overlay is Right -> isSRT is False) */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-l from-red-950 via-black to-black border-l border-red-500/20 transition-opacity duration-500 ${!isSRT ? 'opacity-100 delay-200' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(220,20,60,0.15)_0%,_transparent_70%)]" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="mb-6 p-4 rounded-full bg-red-600/10 border border-red-600/30 shadow-[0_0_30px_rgba(220,20,60,0.2)]">
                                    <img src={logoSrt} alt="SRT" className="h-12 opacity-80" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Membro SRT?</h2>
                                <p className="text-red-200/60 mb-8 max-w-xs">
                                    Entre na pista e acelere para a vitória.
                                </p>
                                <button
                                    onClick={toggleMembership}
                                    className="px-8 py-3 rounded-full border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(220,20,60,0.1)] hover:shadow-[0_0_30px_rgba(220,20,60,0.4)]"
                                >
                                    Acessar SRT
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Central Toggle Button */}
                    <div className={`absolute top-1/2 -translate-y-1/2 z-30 transition-all duration-700 ${isSRT ? 'right-[-20px]' : 'left-[-20px]'}`}>
                        <button
                            onClick={toggleMembership}
                            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-xl transition-all duration-300 hover:scale-110
                                ${isSRT
                                    ? 'bg-black/80 border-gold-500/50 text-gold-400 shadow-gold-500/20'
                                    : 'bg-black/80 border-red-500/50 text-red-500 shadow-red-500/20'
                                }`}
                        >
                            <ArrowRightLeft size={16} />
                        </button>
                    </div>
                </div>

            </div>

            {/* Visitor Access */}
            <button
                onClick={() => {
                    loginAsVisitor(isSRT ? 'SRT' : 'MAGAZINE');
                    navigate('/feed');
                }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 hover:text-white text-xs uppercase tracking-widest transition-colors opacity-60 hover:opacity-100 z-20"
            >
                Entrar como Visitante
            </button>

            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
                isSRT={isSRT}
            />
        </div>
    );
}

function LoginForm({ register, errors, isSubmitting, onSubmit, isSRT, onForgotPassword }: any) {
    return (
        <form onSubmit={onSubmit} className="space-y-5 w-full max-w-xs mx-auto">
            <div className="space-y-1">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-black/40 transition-all duration-300 group-focus-within:bg-black/60
                    ${isSRT
                        ? 'border-red-500/20 focus-within:border-red-500/60 focus-within:shadow-[0_0_15px_rgba(220,20,60,0.15)]'
                        : 'border-gold-500/20 focus-within:border-gold-500/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    }`}>
                    <User size={18} className={isSRT ? 'text-red-500/70' : 'text-gold-500/70'} />
                    <input
                        {...register('email')}
                        type="email"
                        placeholder="Email"
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                    />
                </div>
                {errors.email && <p className="text-red-400 text-[10px] pl-2">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-black/40 transition-all duration-300 group-focus-within:bg-black/60
                    ${isSRT
                        ? 'border-red-500/20 focus-within:border-red-500/60 focus-within:shadow-[0_0_15px_rgba(220,20,60,0.15)]'
                        : 'border-gold-500/20 focus-within:border-gold-500/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    }`}>
                    <Lock size={18} className={isSRT ? 'text-red-500/70' : 'text-gold-500/70'} />
                    <input
                        {...register('password')}
                        type="password"
                        placeholder="Senha"
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                    />
                </div>
                {errors.password && <p className="text-red-400 text-[10px] pl-2">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className={`text-[10px] uppercase tracking-wider font-medium hover:underline ${isSRT ? 'text-red-400/80 hover:text-red-400' : 'text-gold-400/80 hover:text-gold-400'}`}
                >
                    Esqueceu a senha?
                </button>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg
                    ${isSRT
                        ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-red-900/30 hover:shadow-red-600/40'
                        : 'bg-gradient-to-r from-gold-600 to-gold-500 text-black shadow-gold-900/30 hover:shadow-gold-500/40'
                    }`}
            >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>

            {errors.root && <p className="text-red-400 text-xs text-center">{errors.root.message}</p>}
        </form>
    );
}
