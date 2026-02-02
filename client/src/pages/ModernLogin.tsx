import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRightLeft, User, Lock, AlertCircle, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import logo from '../assets/logo-mgzn.png';
import logoMgtFallback from '../assets/logo-mgt-full.png';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useDynamicHead } from '../hooks/useDynamicHead';
import api from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import LoginErrorPopup from '../components/LoginErrorPopup';

const loginSchema = z.object({
    email: z.string().trim().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function ModernLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginAsVisitor } = useAuth();
    const { config } = useCommunity();
    
    // Atualiza título e favicon dinamicamente
    useDynamicHead();
    
    // Logo do tier Standard (MGT) - dinâmica
    const logoMgt = config.logoIconUrl || logoMgtFallback;



    // Determine initial state based on navigation or storage
    const initialMembership = location.state?.membershipType || localStorage.getItem('lastMembershipType') || 'MAGAZINE';
    const [isMGT, setIsMGT] = useState(initialMembership === 'MGT');

    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [showUserNotFoundPopup, setShowUserNotFoundPopup] = useState(false);
    const [showPermissionDeniedPopup, setShowPermissionDeniedPopup] = useState(false);
    const [showLoginErrorPopup, setShowLoginErrorPopup] = useState(false);
    const [loginErrorMessage, setLoginErrorMessage] = useState('');
    const [notFoundEmail, setNotFoundEmail] = useState('');
    const [deniedMembershipType, setDeniedMembershipType] = useState<'MAGAZINE' | 'MGT'>('MAGAZINE');

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
        await handleLogin(data, magazineForm.setError, 'MAGAZINE');
    };

    const onMgtSubmit = async (data: LoginFormValues) => {
        await handleLogin(data, mgtForm.setError, 'MGT');
    };

    const handleLogin = async (data: LoginFormValues, setError: any, membershipContext: 'MAGAZINE' | 'MGT') => {
        try {
            console.log('Sending login request to server...');
            const response = await api.post('/auth/login', data);
            console.log('Login success:', response.data);
            
            // Validate membership type permission
            const userMembershipType = response.data.user.membershipType;
            
            // Check if user is trying to access Magazine but is MGT member
            if (membershipContext === 'MAGAZINE' && userMembershipType === 'MGT') {
                setDeniedMembershipType('MAGAZINE');
                setShowPermissionDeniedPopup(true);
                return;
            }
            
            // Check if user is trying to access MGT but is Magazine member
            if (membershipContext === 'MGT' && userMembershipType === 'MAGAZINE') {
                setDeniedMembershipType('MGT');
                setShowPermissionDeniedPopup(true);
                return;
            }
            
            // Store token first
            localStorage.setItem('token', response.data.token);
            
            // Fetch complete user data from /users/me to ensure all fields are loaded
            try {
                const fullUserRes = await api.get('/users/me');
                login(response.data.token, fullUserRes.data, membershipContext);
            } catch {
                // Fallback to login response data if /users/me fails
                login(response.data.token, response.data.user, membershipContext);
            }
            
            navigate('/feed');
        } catch (error: any) {
            console.error('Login failed', error);
            const errorMessage = error.response?.data?.error || 'Falha ao entrar. Verifique suas credenciais.';
            
            // Check if it's a "user not found" error
            if (errorMessage.toLowerCase().includes('não encontrado') || 
                errorMessage.toLowerCase().includes('not found') ||
                errorMessage.toLowerCase().includes('usuário não existe') ||
                error.response?.status === 404) {
                setNotFoundEmail(data.email);
                setShowUserNotFoundPopup(true);
            } else if (errorMessage.toLowerCase().includes('invalid credentials') ||
                       errorMessage.toLowerCase().includes('credenciais inválidas')) {
                // Show styled popup for invalid credentials
                setLoginErrorMessage('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
                setShowLoginErrorPopup(true);
            } else {
                setError('root', { message: errorMessage });
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans">
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
                        Acessar {config.tierStdName}
                    </button>
                </div>

                {/* RIGHT PANEL (MGT Form) - Full width on mobile when active */}
                <div className={`md:absolute md:top-0 md:right-0 md:w-1/2 w-full md:h-full flex flex-col justify-center p-6 md:p-12 transition-all duration-700 ease-in-out ${!isMGT ? 'hidden md:flex md:opacity-0 md:translate-x-20 md:pointer-events-none' : 'flex opacity-100 translate-x-0 z-10'}`}>
                    <div className="text-center mb-6 md:mb-8">
                        <img src={logoMgt} alt={config.tierStdName} className="h-16 md:h-20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">{config.tierStdName}</h2>
                        <p className="text-emerald-500/80 text-xs uppercase tracking-widest">{config.tierStdSlogan}</p>
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
                                    <img src={logoMgt} alt={config.tierStdName} className="h-12 opacity-80" />
                                </div>
                                <h2 className="text-3xl font-bold !text-white mb-4">Membro {config.tierStdName}?</h2>
                                <p className="text-emerald-200/60 mb-8 max-w-xs">
                                    Entre na pista e acelere para a vitória.
                                </p>
                                <button
                                    onClick={toggleMembership}
                                    className="px-8 py-3 rounded-full border border-emerald-600/50 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                                >
                                    Acessar {config.tierStdName}
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

            {/* Login Error Popup */}
            {showLoginErrorPopup && (
                <LoginErrorPopup
                    message={loginErrorMessage}
                    onClose={() => setShowLoginErrorPopup(false)}
                    autoCloseDuration={5000}
                />
            )}

            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
                isMGT={isMGT}
            />

            {/* User Not Found Popup */}
            <AnimatePresence>
                {showUserNotFoundPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowUserNotFoundPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full max-w-md p-6 rounded-2xl border ${isMGT ? 'bg-emerald-950/90 border-emerald-500/30' : 'bg-gold-950/90 border-gold-500/30'} shadow-2xl`}
                        >
                            <button
                                onClick={() => setShowUserNotFoundPopup(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="text-center">
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                                    <AlertCircle className={`w-8 h-8 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Usuário não encontrado
                                </h3>
                                
                                <p className="text-gray-400 text-sm mb-4">
                                    Não encontramos uma conta com o email <span className={`font-semibold ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>{notFoundEmail}</span>
                                </p>
                                
                                <p className="text-gray-500 text-xs mb-6">
                                    Verifique se digitou corretamente ou crie uma nova conta.
                                </p>
                                
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowUserNotFoundPopup(false)}
                                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all
                                            ${isMGT 
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                                                : 'bg-gold-500 text-black hover:bg-gold-400'
                                            }`}
                                    >
                                        Tentar Novamente
                                    </button>
                                    
                                    {isMGT ? (
                                        <Link
                                            to="/register"
                                            state={{ membershipType: 'MGT' }}
                                            className="w-full py-3 rounded-xl border border-emerald-500/50 text-emerald-400 font-bold uppercase tracking-widest text-xs text-center hover:bg-emerald-500/10 transition-all"
                                        >
                                            Criar Nova Conta
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/request-invite"
                                            className="w-full py-3 rounded-xl border border-gold-500/50 text-gold-400 font-bold uppercase tracking-widest text-xs text-center hover:bg-gold-500/10 transition-all"
                                        >
                                            Solicitar Convite
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Permission Denied Popup */}
            <AnimatePresence>
                {showPermissionDeniedPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowPermissionDeniedPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full max-w-md p-6 rounded-2xl border ${deniedMembershipType === 'MAGAZINE' ? 'bg-gold-950/90 border-gold-500/30' : 'bg-emerald-950/90 border-emerald-500/30'} shadow-2xl`}
                        >
                            <button
                                onClick={() => setShowPermissionDeniedPopup(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="text-center">
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${deniedMembershipType === 'MAGAZINE' ? 'bg-gold-500/20' : 'bg-emerald-500/20'}`}>
                                    <AlertCircle className={`w-8 h-8 ${deniedMembershipType === 'MAGAZINE' ? 'text-gold-400' : 'text-emerald-400'}`} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Acesso Negado
                                </h3>
                                
                                {deniedMembershipType === 'MAGAZINE' ? (
                                    <>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Você não tem permissão para acessar o <span className="font-semibold text-gold-400">MAGAZINE</span>.
                                        </p>
                                        
                                        <p className="text-gray-500 text-xs mb-2">
                                            Para se tornar membro Magazine, você precisa:
                                        </p>
                                        
                                        <ul className="text-left text-gray-400 text-xs mb-6 space-y-2 bg-black/30 rounded-lg p-4">
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-400 mt-0.5">1.</span>
                                                <span>Solicitar um convite através do formulário oficial</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-400 mt-0.5">2.</span>
                                                <span>Aguardar análise e aprovação da administração</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-gold-400 mt-0.5">3.</span>
                                                <span>Receber confirmação de aceitação</span>
                                            </li>
                                        </ul>
                                        
                                        <p className="text-gold-400/80 text-xs mb-6">
                                            Atualmente você é membro <span className="font-bold text-emerald-400">MGT</span>.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Você não tem permissão para acessar o <span className="font-semibold text-emerald-400">MGT</span>.
                                        </p>
                                        
                                        <p className="text-gray-500 text-xs mb-6">
                                            Atualmente você é membro <span className="font-bold text-gold-400">MAGAZINE</span>. Cada conta tem acesso a apenas um tipo de assinatura.
                                        </p>
                                    </>
                                )}
                                
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            setShowPermissionDeniedPopup(false);
                                            // Switch to the correct membership type
                                            setIsMGT(deniedMembershipType === 'MGT');
                                        }}
                                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all
                                            ${deniedMembershipType === 'MAGAZINE' 
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                                                : 'bg-gold-500 text-black hover:bg-gold-400'
                                            }`}
                                    >
                                        Acessar {deniedMembershipType === 'MAGAZINE' ? 'MGT' : 'Magazine'}
                                    </button>
                                    
                                    {deniedMembershipType === 'MAGAZINE' && (
                                        <Link
                                            to="/request-invite"
                                            className="w-full py-3 rounded-xl border border-gold-500/50 text-gold-400 font-bold uppercase tracking-widest text-xs text-center hover:bg-gold-500/10 transition-all"
                                        >
                                            Solicitar Convite Magazine
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

function LoginForm({ register, errors, isSubmitting, onSubmit, isMGT, onForgotPassword }: any) {
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        setCapsLockOn(e.getModifierState('CapsLock'));
    };
    
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha"
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                        onKeyDown={handleKeyDown}
                        onKeyUp={handleKeyDown}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`transition-colors ${isMGT ? 'text-emerald-500/50 hover:text-emerald-400' : 'text-gold-500/50 hover:text-gold-400'}`}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {capsLockOn && (
                    <p className="text-amber-400 text-[10px] pl-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Caps Lock está ativado
                    </p>
                )}
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
