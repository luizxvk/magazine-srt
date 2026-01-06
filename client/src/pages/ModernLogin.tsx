import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRightLeft, User, Lock, X, Heart, Sparkles, Rocket, Check, Clock } from 'lucide-react';

import logo from '../assets/logo-mgzn.png';
import logoMgt from '../assets/logo-mgt-full.png';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const loginSchema = z.object({
    email: z.string().trim().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function ModernLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginAsVisitor } = useAuth();

    // Maintenance popup state
    const [showMaintenancePopup, setShowMaintenancePopup] = useState(true);

    // Determine initial state based on navigation or storage
    const initialMembership = location.state?.membershipType || localStorage.getItem('lastMembershipType') || 'MAGAZINE';
    const [isMGT, setIsMGT] = useState(initialMembership === 'MGT');

    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Form hooks - Separate forms to avoid input registration conflicts
    const magazineForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const mgtForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    // Update form context/theme when toggling
    const toggleMembership = () => {
        setIsMGT(!isMGT);
    };

    const onMagazineSubmit = async (data: LoginFormValues) => {
        console.log('Magazine Form Submitted:', data);
        await handleLogin(data, magazineForm.setError, 'MAGAZINE');
    };

    const onMgtSubmit = async (data: LoginFormValues) => {
        console.log('MGT Form Submitted:', data);
        await handleLogin(data, mgtForm.setError, 'MGT');
    };

    const handleLogin = async (data: LoginFormValues, setError: any, membershipContext: 'MAGAZINE' | 'MGT') => {
        try {
            console.log('Sending login request to server...');
            const response = await api.post('/auth/login', data);
            console.log('Login success:', response.data);
            login(response.data.token, response.data.user, membershipContext);
            navigate('/feed');
        } catch (error: any) {
            console.error('Login failed', error);
            // Check if it's maintenance mode
            if (error.response?.data?.error === 'maintenance') {
                setShowMaintenancePopup(true);
                return;
            }
            const errorMessage = error.response?.data?.error || 'Falha ao entrar. Verifique suas credenciais.';
            setError('root', { message: errorMessage });
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans">
            {/* Maintenance Popup */}
            {showMaintenancePopup && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
                    <div className="relative w-full max-w-lg bg-gradient-to-br from-neutral-900 via-neutral-950 to-black rounded-3xl border border-gold-500/30 shadow-[0_0_60px_rgba(212,175,55,0.15)] overflow-hidden animate-fade-in-up my-8">
                        {/* Gold accent line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
                        
                        {/* Close button */}
                        <button
                            onClick={() => setShowMaintenancePopup(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="p-6 md:p-8 text-center">
                            {/* Icon */}
                            <div className="mb-4 relative">
                                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center border border-gold-500/30">
                                    <Heart className="w-8 h-8 text-gold-400 fill-gold-400/50" />
                                </div>
                                <Sparkles className="absolute top-0 right-1/3 w-5 h-5 text-gold-400 animate-pulse" />
                            </div>

                            {/* Title */}
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                                Obrigado por fazer parte!
                            </h2>
                            
                            <p className="text-gold-400 font-semibold text-xs uppercase tracking-widest mb-4">
                                Versão Alpha Encerrada
                            </p>

                            {/* Message */}
                            <div className="text-gray-300 text-sm leading-relaxed mb-6">
                                <p>
                                    Agradecemos a todos que acessaram e testaram a nossa plataforma durante a fase alpha. 
                                    Seu feedback foi essencial! 🙏
                                </p>
                            </div>

                            {/* Simple Roadmap */}
                            <div className="bg-black/40 rounded-xl border border-white/10 p-4 mb-6 text-left">
                                <div className="flex items-center gap-2 mb-3">
                                    <Rocket className="w-4 h-4 text-gold-400" />
                                    <h3 className="text-sm font-bold text-white">Próximas Novidades</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                        <span className="text-xs text-gray-400 line-through">Sistema de Gamificação</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                        <span className="text-xs text-gray-400 line-through">Chat em tempo real</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                        <span className="text-xs text-gray-400 line-through">Sistema de Badges</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-gold-400" />
                                        <span className="text-xs text-gray-300">Sistema de Prestígio</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-gold-400" />
                                        <span className="text-xs text-gray-300">Marketplace de Itens</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-gold-400" />
                                        <span className="text-xs text-gray-300">Crews e Rankings</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-gold-400" />
                                        <span className="text-xs text-gray-300">Notificações Push</span>
                                    </div>
                                </div>
                            </div>

                            {/* Coming Soon Box */}
                            <div className="py-3 px-4 bg-gold-500/10 rounded-xl border border-gold-500/20">
                                <p className="text-gold-400 font-semibold text-sm">
                                    🚀 Em breve voltaremos!
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Fique atento às nossas redes sociais.
                                </p>
                            </div>

                            {/* Button */}
                            <button
                                onClick={() => setShowMaintenancePopup(false)}
                                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-black font-bold uppercase tracking-widest text-xs hover:from-gold-500 hover:to-gold-400 transition-all duration-300 shadow-lg shadow-gold-500/25"
                            >
                                Entendi
                            </button>
                        </div>

                        {/* Bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
                    </div>
                </div>
            )}

            {/* Dynamic Background */}
            <div className={`fixed inset-0 transition-colors duration-1000 ease-in-out ${isMGT ? 'bg-emerald-950/20' : 'bg-gold-950/20'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,0,0,0)_0%,_#000000_100%)]" />
                <div className={`absolute top-0 left-0 w-full h-full opacity-30 transition-opacity duration-1000 ${isMGT ? 'bg-[url("/patterns/grid.svg")]' : 'gold-flow'}`} />
                <div className="animated-fog opacity-30" />
            </div>


            {/* Main Card Container - Vertical on mobile, horizontal on desktop */}
            <div className="relative w-full max-w-[1000px] min-h-[600px] md:min-h-[600px] bg-neutral-950/60 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row z-10 mx-4 my-20 md:my-0">

                {/* LEFT PANEL (Magazine Form) - Full width on mobile when active */}
                <div className={`md:absolute md:top-0 md:left-0 md:w-1/2 w-full md:h-full flex flex-col justify-center p-6 md:p-12 transition-all duration-700 ease-in-out ${isMGT ? 'hidden md:flex md:opacity-0 md:-translate-x-20 md:pointer-events-none' : 'flex opacity-100 translate-x-0 z-10'}`}>
                    <div className="text-center mb-6 md:mb-8">
                        <img src={logo} alt="Magazine" className="h-24 md:h-48 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                        <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold mb-2">MAGAZINE</h2>
                        <p className="text-gold-400/60 text-xs uppercase tracking-widest">A Elite do Sucesso</p>
                    </div>

                    <LoginForm
                        register={magazineForm.register}
                        errors={magazineForm.formState.errors}
                        isSubmitting={magazineForm.formState.isSubmitting}
                        onSubmit={magazineForm.handleSubmit(onMagazineSubmit)}
                        isMGT={false}
                        onForgotPassword={() => setIsForgotPasswordOpen(true)}
                    />

                    <div className="mt-4 md:mt-6 text-center">
                        <p className="text-gray-500 text-xs">
                            Deseja fazer parte?
                            <Link to="/request-invite" className="text-gold-400 hover:text-gold-300 font-bold ml-1 transition-colors">
                                Solicitar Convite
                            </Link>
                        </p>
                    </div>

                    {/* Mobile: Button to switch to MGT */}
                    <button
                        onClick={toggleMembership}
                        className="md:hidden mt-6 w-full py-3 rounded-xl border border-emerald-500/50 text-emerald-500 font-bold uppercase tracking-widest text-xs"
                    >
                        Acessar MGT
                    </button>
                </div>

                {/* RIGHT PANEL (MGT Form) - Full width on mobile when active */}
                <div className={`md:absolute md:top-0 md:right-0 md:w-1/2 w-full md:h-full flex flex-col justify-center p-6 md:p-12 transition-all duration-700 ease-in-out ${!isMGT ? 'hidden md:flex md:opacity-0 md:translate-x-20 md:pointer-events-none' : 'flex opacity-100 translate-x-0 z-10'}`}>
                    <div className="text-center mb-6 md:mb-8">
                        <img src={logoMgt} alt="MGT" className="h-16 md:h-20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">MGT</h2>
                        <p className="text-emerald-500/80 text-xs uppercase tracking-widest">Velocidade e Poder</p>
                    </div>

                    <LoginForm
                        register={mgtForm.register}
                        errors={mgtForm.formState.errors}
                        isSubmitting={mgtForm.formState.isSubmitting}
                        onSubmit={mgtForm.handleSubmit(onMgtSubmit)}
                        isMGT={true}
                        onForgotPassword={() => setIsForgotPasswordOpen(true)}
                    />

                    <div className="mt-4 md:mt-6 text-center">
                        <p className="text-gray-500 text-xs">
                            Ainda não é membro?
                            <Link to="/register" state={{ membershipType: 'MGT' }} className="text-emerald-500 hover:text-emerald-400 font-bold ml-1 transition-colors">
                                Criar Conta
                            </Link>
                        </p>
                    </div>

                    {/* Mobile: Button to switch to Magazine */}
                    <button
                        onClick={toggleMembership}
                        className="md:hidden mt-6 w-full py-3 rounded-xl border border-gold-500/50 text-gold-400 font-bold uppercase tracking-widest text-xs"
                    >
                        Acessar Magazine
                    </button>
                </div>

                {/* OVERLAY / SLIDER - Hidden on mobile */}
                <div className={`hidden md:block absolute top-0 left-0 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-20 ${isMGT ? 'translate-x-0' : 'translate-x-full'}`}>

                    {/* Inner Content Container */}
                    <div className="relative w-full h-full">

                        {/* MAGAZINE INVITE (Visible when Overlay is Left -> isMGT is True) */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-r from-gold-950 via-black to-black border-r border-gold-500/20 transition-opacity duration-500 ${isMGT ? 'opacity-100 delay-200' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)]" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="mb-6 p-4 rounded-full bg-gold-500/10 border border-gold-500/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                                    <img src={logo} alt="Magazine" className="h-16 opacity-80" />
                                </div>
                                <h2 className="text-3xl font-bold !text-white mb-4">Membro Magazine?</h2>
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

                        {/* MGT INVITE (Visible when Overlay is Right -> isMGT is False) - EMERALD */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-l from-emerald-950 via-black to-black border-l border-emerald-500/20 transition-opacity duration-500 ${!isMGT ? 'opacity-100 delay-200' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="mb-6 p-4 rounded-full bg-emerald-600/10 border border-emerald-600/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <img src={logoMgt} alt="MGT" className="h-12 opacity-80" />
                                </div>
                                <h2 className="text-3xl font-bold !text-white mb-4">Membro MGT?</h2>
                                <p className="text-emerald-200/60 mb-8 max-w-xs">
                                    Entre na pista e acelere para a vitória.
                                </p>
                                <button
                                    onClick={toggleMembership}
                                    className="px-8 py-3 rounded-full border border-emerald-600/50 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                                >
                                    Acessar MGT
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Central Toggle Button */}
                    <div className={`absolute top-1/2 -translate-y-1/2 z-30 transition-all duration-700 ${isMGT ? 'right-[-20px]' : 'left-[-20px]'}`}>
                        <button
                            onClick={toggleMembership}
                            aria-label="Alternar tipo de membro"
                            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-xl transition-all duration-300 hover:scale-110
                                ${isMGT
                                    ? 'bg-black/80 border-gold-500/50 text-gold-400 shadow-gold-500/20'
                                    : 'bg-black/80 border-emerald-500/50 text-emerald-500 shadow-emerald-500/20'
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
                    loginAsVisitor(isMGT ? 'MGT' : 'MAGAZINE');
                    navigate('/feed');
                }}
                className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-gray-500 hover:text-white text-xs uppercase tracking-widest transition-colors opacity-60 hover:opacity-100 z-20"
            >
                Entrar como Visitante
            </button>

            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
                isMGT={isMGT}
            />
        </div>
    );
}

function LoginForm({ register, errors, isSubmitting, onSubmit, isMGT, onForgotPassword }: any) {
    return (
        <form onSubmit={onSubmit} className="space-y-5 w-full max-w-xs mx-auto">
            <div className="space-y-1">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-neutral-900/60 transition-all duration-300 group-focus-within:bg-black/60
                    ${isMGT
                        ? 'border-emerald-500/20 focus-within:border-emerald-500/60 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'border-gold-500/20 focus-within:border-gold-500/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    }`}>
                    <User size={18} className={isMGT ? 'text-emerald-500/70' : 'text-gold-500/70'} />
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
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-neutral-900/60 transition-all duration-300 group-focus-within:bg-black/60
                    ${isMGT
                        ? 'border-emerald-500/20 focus-within:border-emerald-500/60 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'border-gold-500/20 focus-within:border-gold-500/60 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    }`}>
                    <Lock size={18} className={isMGT ? 'text-emerald-500/70' : 'text-gold-500/70'} />
                    <input
                        {...register('password')}
                        type="password"
                        placeholder="Senha"
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                    />
                </div>
                {errors.password && <p className="text-red-400 text-[10px] pl-2">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        defaultChecked={localStorage.getItem('rememberMe') === 'true'}
                        onChange={(e) => localStorage.setItem('rememberMe', e.target.checked.toString())}
                        className={`w-4 h-4 rounded border-2 appearance-none cursor-pointer transition-all duration-200
                            ${isMGT
                                ? 'border-emerald-500/50 checked:bg-emerald-500 checked:border-emerald-500'
                                : 'border-gold-500/50 checked:bg-gold-500 checked:border-gold-500'
                            }`}
                    />
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 group-hover:text-gray-300 transition-colors">
                        Lembrar-me
                    </span>
                </label>
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className={`text-[10px] uppercase tracking-wider font-medium hover:underline ${isMGT ? 'text-emerald-400/80 hover:text-emerald-400' : 'text-gold-400/80 hover:text-gold-400'}`}
                >
                    Esqueceu a senha?
                </button>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg
                    ${isMGT
                        ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-emerald-900/30 hover:shadow-emerald-600/40'
                        : 'bg-gradient-to-r from-gold-600 to-gold-500 text-black shadow-gold-900/30 hover:shadow-gold-500/40'
                    }`}
            >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>

            {errors.root && <p className="text-red-400 text-xs text-center">{errors.root.message}</p>}
        </form>
    );
}
