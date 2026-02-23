import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, X, AlertCircle, Camera, Sparkles, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoMgtFallback from '../assets/logo-mgt-full.png';
import logoFallback from '../assets/logo-mgzn.png';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import Loader from '../components/Loader';
import { useDynamicHead } from '../hooks/useDynamicHead';
import api from '../services/api';
import TermsOfServiceModal from '../components/TermsOfServiceModal';

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
    const { config } = useCommunity();
    const { t } = useTranslation('common');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Atualiza título e favicon dinamicamente
    useDynamicHead();
    
    // Logo dinâmica do MGT (usa config ou fallback)
    const logoMgt = config.logoIconUrl || logoMgtFallback;
    const logo = config.logoUrl || logoFallback;
    
    const [errorPopup, setErrorPopup] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarBase64, setAvatarBase64] = useState<string>('');
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [pendingSubmitData, setPendingSubmitData] = useState<RegisterForm | null>(null);
    const [capsLockOn, setCapsLockOn] = useState(false);
    
    const handleCapsLock = (e: React.KeyboardEvent) => {
        setCapsLockOn(e.getModifierState('CapsLock'));
    };
    
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const membershipType = location.state?.membershipType || 'MAGAZINE';
    const isMGT = membershipType === 'MGT';

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type - only PNG and JPG allowed
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                setErrorPopup('Formato de imagem não permitido. Use apenas PNG ou JPG.');
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                setErrorPopup('Imagem muito grande. Tamanho máximo: 2MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                setAvatarBase64(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: RegisterForm) => {
        // If terms not accepted, show modal first
        if (!acceptedTerms) {
            setPendingSubmitData(data);
            setShowTermsModal(true);
            return;
        }

        await performRegistration(data);
    };

    const performRegistration = async (data: RegisterForm) => {
        try {
            const response = await api.post('/auth/register', {
                ...data,
                membershipType,
                avatarUrl: avatarBase64 || undefined
            });
            
            // Store token first
            localStorage.setItem('token', response.data.token);
            
            // Fetch complete user data from /users/me to ensure all fields are loaded
            try {
                const fullUserRes = await api.get('/users/me');
                login(response.data.token, fullUserRes.data, membershipType);
            } catch {
                // Fallback to register response data if /users/me fails
                login(response.data.token, response.data.user, membershipType);
            }
            
            navigate('/feed');
        } catch (error: any) {
            console.error('Registration failed', error);
            const errorMessage = error.response?.data?.error || 'Falha ao criar conta. Tente novamente.';
            
            if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('já existe') || errorMessage.toLowerCase().includes('already')) {
                setErrorPopup(errorMessage);
            } else {
                setError('root', { message: errorMessage });
            }
        }
    };

    const handleTermsAccepted = async () => {
        setAcceptedTerms(true);
        setShowTermsModal(false);
        if (pendingSubmitData) {
            await performRegistration(pendingSubmitData);
            setPendingSubmitData(null);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0a] font-sans p-4">
            {/* Error Popup Modal */}
            {errorPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setErrorPopup(null)} />
                    <div className="relative w-full max-w-sm bg-neutral-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-red-500/30 p-6 animate-fade-in-up">
                        <button 
                            onClick={() => setErrorPopup(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 rounded-full mb-4 bg-red-500/20">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{t('register.error')}</h3>
                            <p className="text-gray-300 text-sm mb-4">{errorPopup}</p>
                            <button
                                onClick={() => setErrorPopup(null)}
                                className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${isMGT ? 'bg-tier-std-600 hover:bg-tier-std-500 text-white' : 'bg-gold-500 hover:bg-gold-400 text-black'}`}
                            >
                                {t('modals.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animated Background */}
            <div className={`fixed inset-0 transition-colors duration-1000 ${isMGT ? 'bg-tier-std-950/10' : 'bg-gold-950/10'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000000_80%)]" />
                <div className={`absolute inset-0 opacity-20 ${isMGT ? 'bg-[radial-gradient(circle_at_30%_20%,_rgba(16,185,129,0.15)_0%,_transparent_50%)]' : 'bg-[radial-gradient(circle_at_70%_20%,_rgba(212,175,55,0.15)_0%,_transparent_50%)]'}`} />
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate('/login', { state: { membershipType } })}
                className={`absolute top-6 left-6 z-30 flex items-center gap-2 text-sm transition-colors ${isMGT ? 'text-tier-std-500/70 hover:text-tier-std-400' : 'text-gold-500/70 hover:text-gold-400'}`}
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('actions.back')}</span>
            </button>

            {/* Main Card */}
            <div className={`relative w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border z-10 ${isMGT ? 'border-tier-std-500/20' : 'border-gold-500/20'}`}>
                {/* Gradient top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isMGT ? 'bg-gradient-to-r from-transparent via-tier-std-500 to-transparent' : 'bg-gradient-to-r from-transparent via-gold-500 to-transparent'}`} />

                <div className="p-8 sm:p-10">
                    {/* Header with Logo */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img
                                src={isMGT ? logoMgt : logo}
                                alt={isMGT ? config.tierStdName : "MAGAZINE"}
                                className={`${isMGT ? 'h-14' : 'h-20'} drop-shadow-lg`}
                            />
                        </div>
                        <h2 className={`text-xl font-bold tracking-wide ${isMGT ? 'text-white' : 'text-gradient-gold'}`}>
                            {t('register.title')}
                        </h2>
                        <p className={`text-xs mt-2 tracking-widest uppercase ${isMGT ? 'text-tier-std-400/50' : 'text-gold-400/50'}`}>
                            {isMGT ? config.tierStdSlogan : config.tierVipSlogan}
                        </p>
                    </div>

                    {/* Avatar Upload - Clean and Modern */}
                    <div className="flex justify-center mb-8">
                        <div className="relative group">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed transition-all duration-300 ${
                                    isMGT 
                                        ? 'border-tier-std-500/40 hover:border-tier-std-500/80 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                        : 'border-gold-500/40 hover:border-gold-500/80 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                }`}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex flex-col items-center justify-center ${isMGT ? 'bg-tier-std-500/5' : 'bg-gold-500/5'}`}>
                                        <Camera className={`w-6 h-6 mb-1 ${isMGT ? 'text-tier-std-500/50' : 'text-gold-500/50'}`} />
                                        <span className={`text-[10px] ${isMGT ? 'text-tier-std-500/50' : 'text-gold-500/50'}`}>{t('profile.photo')}</span>
                                    </div>
                                )}
                                
                                {/* Hover overlay */}
                                <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${avatarPreview ? 'bg-black/60' : ''}`}>
                                    {avatarPreview && <Camera className="w-6 h-6 text-white" />}
                                </div>
                            </button>
                            
                            {/* Optional indicator */}
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] tracking-wider ${isMGT ? 'bg-tier-std-500/20 text-tier-std-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                OPCIONAL
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-1">
                            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/[0.02] transition-all duration-300
                                ${isMGT
                                    ? 'border-white/10 focus-within:border-tier-std-500/50 focus-within:bg-tier-std-500/5'
                                    : 'border-white/10 focus-within:border-gold-500/50 focus-within:bg-gold-500/5'
                                }`}>
                                <User size={18} className="text-gray-500" />
                                <input
                                    {...register('name')}
                                    type="text"
                                    placeholder={t('register.name')}
                                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                                />
                            </div>
                            {errors.name && <p className="text-red-400 text-[10px] pl-4">{errors.name.message}</p>}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1">
                            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/[0.02] transition-all duration-300
                                ${isMGT
                                    ? 'border-white/10 focus-within:border-tier-std-500/50 focus-within:bg-tier-std-500/5'
                                    : 'border-white/10 focus-within:border-gold-500/50 focus-within:bg-gold-500/5'
                                }`}>
                                <Mail size={18} className="text-gray-500" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-[10px] pl-4">{errors.email.message}</p>}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1">
                            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/[0.02] transition-all duration-300
                                ${isMGT
                                    ? 'border-white/10 focus-within:border-tier-std-500/50 focus-within:bg-tier-std-500/5'
                                    : 'border-white/10 focus-within:border-gold-500/50 focus-within:bg-gold-500/5'
                                }`}>
                                <Lock size={18} className="text-gray-500" />
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder={t('register.password')}
                                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-600"
                                    onKeyDown={handleCapsLock}
                                    onKeyUp={handleCapsLock}
                                />
                            </div>
                            {capsLockOn && (
                                <p className="text-amber-400 text-[10px] pl-4 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Caps Lock está ativado
                                </p>
                            )}
                            {errors.password && <p className="text-red-400 text-[10px] pl-4">{errors.password.message}</p>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6 flex items-center justify-center gap-2
                                ${isMGT
                                    ? 'bg-tier-std-600 hover:bg-tier-std-500 text-white shadow-lg shadow-tier-std-900/30'
                                    : 'bg-gold-500 hover:bg-gold-400 text-black shadow-lg shadow-gold-900/30'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader size="sm" />
                                    {t('register.loading')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    {t('register.submit')}
                                </>
                            )}
                        </button>

                        {errors.root && <p className="text-red-400 text-xs text-center mt-2">{errors.root.message}</p>}
                    </form>

                    {/* Footer Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-xs">
                            {t('register.hasAccount')}
                            <Link
                                to="/login"
                                state={{ membershipType }}
                                className={`font-bold ml-1 transition-colors ${isMGT ? 'text-tier-std-500 hover:text-tier-std-400' : 'text-gold-400 hover:text-gold-300'}`}
                            >
                                {t('register.login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Terms of Service Modal */}
            <TermsOfServiceModal
                isOpen={showTermsModal}
                onAccept={handleTermsAccepted}
                onClose={() => {
                    setShowTermsModal(false);
                    setPendingSubmitData(null);
                }}
                isMGT={isMGT}
            />
        </div>
    );
}
