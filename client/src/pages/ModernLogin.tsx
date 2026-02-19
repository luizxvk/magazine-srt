import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, User, Lock, AlertCircle, X, AlertTriangle, Eye, EyeOff, Fingerprint, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import logo from '../assets/logo-mgzn.png';
import logoMgtFallback from '../assets/logo-mgt-full.png';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useDynamicHead } from '../hooks/useDynamicHead';
import api from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import LoginErrorPopup from '../components/LoginErrorPopup';
import { DottedGlowBackground } from '../components/ui/DottedGlowBackground';

const loginSchema = z.object({
    email: z.string().trim().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ============================================
// MOBILE DETECTION HOOK
// ============================================

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}

// ============================================
// ANIMATED BACKGROUND COMPONENTS
// ============================================

/** Premium floating orbs — Magazine (gold) */
function MagazineBackground() {
    const isMobile = useIsMobile();

    return (
        <motion.div
            className="fixed inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isMobile ? 0.6 : 1.2 }}
        >
            <div className="absolute inset-0 bg-[#050505]" />

            {isMobile ? (
                /* ── Mobile: Static CSS gradients, no animation ── */
                <>
                    <div
                        className="absolute w-[400px] h-[400px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
                            top: '-10%',
                            right: '-15%',
                        }}
                    />
                    <div
                        className="absolute w-[300px] h-[300px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(170,140,44,0.08) 0%, transparent 70%)',
                            bottom: '-5%',
                            left: '-10%',
                        }}
                    />
                </>
            ) : (
                /* ── Desktop: Full animated orbs with blur ── */
                <>
                    <motion.div
                        className="absolute w-[800px] h-[800px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 40%, transparent 70%)',
                            filter: 'blur(80px)',
                            top: '-15%',
                            right: '-10%',
                        }}
                        animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.98, 1] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute w-[600px] h-[600px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(170,140,44,0.1) 0%, rgba(170,140,44,0.02) 50%, transparent 70%)',
                            filter: 'blur(60px)',
                            bottom: '-10%',
                            left: '-5%',
                        }}
                        animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0], scale: [1, 0.97, 1.03, 1] }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute w-[400px] h-[400px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 60%)',
                            filter: 'blur(50px)',
                            top: '40%',
                            left: '30%',
                        }}
                        animate={{ x: [0, 40, -30, 0], y: [0, -30, 20, 0] }}
                        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </>
            )}

            {/* Noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                }}
            />

            {/* Golden horizon line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        </motion.div>
    );
}

/** Premium background — MGT (emerald + dotted glow) */
function MgtBackground() {
    const isMobile = useIsMobile();

    return (
        <motion.div
            className="fixed inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isMobile ? 0.6 : 1.2 }}
        >
            <div className="absolute inset-0 bg-[#030a06]" />

            {isMobile ? (
                /* ── Mobile: Static CSS gradients, no canvas ── */
                <>
                    <div
                        className="absolute w-[350px] h-[350px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
                            top: '-15%',
                            left: '-10%',
                        }}
                    />
                    <div
                        className="absolute w-[250px] h-[250px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(4,120,87,0.1) 0%, transparent 70%)',
                            bottom: '-5%',
                            right: '-8%',
                        }}
                    />
                    {/* Static dot pattern for MGT feel on mobile */}
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.8) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}
                    />
                </>
            ) : (
                /* ── Desktop: Full animated orbs + DottedGlow canvas ── */
                <>
                    <motion.div
                        className="absolute w-[700px] h-[700px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 45%, transparent 70%)',
                            filter: 'blur(80px)',
                            top: '-20%',
                            left: '-10%',
                        }}
                        animate={{ x: [0, 25, -15, 0], y: [0, -15, 25, 0], scale: [1, 1.04, 0.97, 1] }}
                        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute w-[500px] h-[500px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(4,120,87,0.12) 0%, rgba(4,120,87,0.03) 50%, transparent 70%)',
                            filter: 'blur(70px)',
                            bottom: '-5%',
                            right: '-8%',
                        }}
                        animate={{ x: [0, -20, 30, 0], y: [0, 15, -20, 0], scale: [1, 0.96, 1.05, 1] }}
                        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute w-[350px] h-[350px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 60%)',
                            filter: 'blur(40px)',
                            top: '50%',
                            right: '25%',
                        }}
                        animate={{ x: [0, -35, 20, 0], y: [0, 25, -15, 0] }}
                        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <DottedGlowBackground
                        className="pointer-events-none"
                        opacity={0.4}
                        gap={14}
                        radius={1.2}
                        color="rgba(16,185,129,0.3)"
                        darkColor="rgba(16,185,129,0.3)"
                        glowColor="rgba(52,211,153,0.7)"
                        darkGlowColor="rgba(52,211,153,0.7)"
                        backgroundOpacity={0}
                        speedMin={0.2}
                        speedMax={0.8}
                        speedScale={0.6}
                    />
                </>
            )}

            {/* Noise texture */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                }}
            />

            {/* Emerald horizon line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </motion.div>
    );
}

// ============================================
// LIQUID GLASS CARD  (Apple Vision Pro style)
// ============================================

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <div className={`relative ${className}`}>
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.01] pointer-events-none" />
                <div
                    className="relative rounded-3xl overflow-hidden border border-white/[0.06]"
                    style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        backdropFilter: 'blur(16px) saturate(1.2)',
                        WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                        boxShadow: '0 16px 40px -10px rgba(0,0,0,0.5)',
                    }}
                >
                    <div className="relative z-10">{children}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Outer glow ring */}
            <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-b from-white/[0.12] to-white/[0.02] pointer-events-none" />

            {/* Glass surface */}
            <div
                className="relative rounded-[28px] overflow-hidden"
                style={{
                    background:
                        'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)',
                    backdropFilter: 'blur(40px) saturate(1.5)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                    boxShadow: `
                        0 0 0 1px rgba(255,255,255,0.08),
                        inset 0 1px 0 rgba(255,255,255,0.1),
                        inset 0 -1px 0 rgba(255,255,255,0.02),
                        0 25px 50px -12px rgba(0,0,0,0.5),
                        0 0 80px -20px rgba(0,0,0,0.3)
                    `,
                }}
            >
                {/* Internal light refraction */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
                    }}
                />

                {/* Content */}
                <div className="relative z-10">{children}</div>
            </div>
        </div>
    );
}

// ============================================
// LOGIN FORM  (Liquid Glass Inputs)
// ============================================

function LoginForm({
    register,
    errors,
    isSubmitting,
    onSubmit,
    isMGT,
    onForgotPassword,
}: {
    register: ReturnType<typeof useForm<LoginFormValues>>['register'];
    errors: ReturnType<typeof useForm<LoginFormValues>>['formState']['errors'];
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
    isMGT: boolean;
    onForgotPassword: () => void;
}) {
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isMobile = useIsMobile();
    const { t } = useTranslation('common');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        setCapsLockOn(e.getModifierState('CapsLock'));
    };

    const accentRgb = isMGT ? '16,185,129' : '212,175,55';

    const glassInputStyle: React.CSSProperties = isMobile
        ? {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
          }
        : {
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          };

    const focusInput = (e: React.FocusEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.4)`;
        if (!isMobile) {
            e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 20px rgba(${accentRgb}, 0.08)`;
        }
    };

    const blurInput = (e: React.FocusEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = isMobile ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)';
        if (!isMobile) {
            e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)';
        }
    };

    const submitButtonStyle: React.CSSProperties = isMobile ? {
        background: isMGT
            ? 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(4,120,87,0.45) 100%)'
            : 'linear-gradient(135deg, rgba(212,175,55,0.35) 0%, rgba(170,140,44,0.45) 100%)',
        border: `1px solid ${isMGT ? 'rgba(16,185,129,0.3)' : 'rgba(212,175,55,0.3)'}`,
        color: isMGT ? 'rgba(167,243,208,0.9)' : 'rgba(253,230,138,0.9)',
    } : {
        background: isMGT
            ? 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(4,120,87,0.4) 100%)'
            : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(170,140,44,0.4) 100%)',
        border: `1px solid ${isMGT ? 'rgba(16,185,129,0.25)' : 'rgba(212,175,55,0.25)'}`,
        color: isMGT ? 'rgba(167,243,208,0.9)' : 'rgba(253,230,138,0.9)',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 30px ${isMGT ? 'rgba(16,185,129,0.1)' : 'rgba(212,175,55,0.1)'}`,
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 w-full">
            {/* Email */}
            <div className="space-y-1.5">
                <div
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500"
                    style={glassInputStyle}
                    onFocus={focusInput}
                    onBlur={blurInput}
                >
                    <User size={16} className={`${isMGT ? 'text-emerald-400/60' : 'text-gold-400/60'} flex-shrink-0`} />
                    <input
                        {...register('email')}
                        type="email"
                        placeholder={t('forgotPassword.email')}
                        autoComplete="email"
                        className="bg-transparent border-none outline-none text-white/90 text-sm w-full placeholder-white/25 font-light tracking-wide"
                    />
                </div>
                {errors.email && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-red-400/80 text-[10px] pl-4 font-light">
                        {errors.email.message}
                    </motion.p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
                <div
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500"
                    style={glassInputStyle}
                    onFocus={focusInput}
                    onBlur={blurInput}
                >
                    <Lock size={16} className={`${isMGT ? 'text-emerald-400/60' : 'text-gold-400/60'} flex-shrink-0`} />
                    <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth:login.password')}
                        autoComplete="current-password"
                        className="bg-transparent border-none outline-none text-white/90 text-sm w-full placeholder-white/25 font-light tracking-wide"
                        onKeyDown={handleKeyDown}
                        onKeyUp={handleKeyDown}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-white/25 hover:text-white/50 transition-colors flex-shrink-0"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {capsLockOn && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400/70 text-[10px] pl-4 flex items-center gap-1 font-light">
                        <AlertTriangle size={10} />
                        Caps Lock ativado
                    </motion.p>
                )}
                {errors.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-red-400/80 text-[10px] pl-4 font-light">
                        {errors.password.message}
                    </motion.p>
                )}
            </div>

            {/* Remember me & Forgot */}
            <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        defaultChecked={localStorage.getItem('rememberMe') === 'true'}
                        onChange={(e) => localStorage.setItem('rememberMe', e.target.checked.toString())}
                        className={`w-3.5 h-3.5 rounded-md border appearance-none cursor-pointer transition-all duration-300
                            ${isMGT ? 'border-white/10 checked:bg-emerald-500/80 checked:border-emerald-500/60' : 'border-white/10 checked:bg-gold-500/80 checked:border-gold-500/60'}`}
                    />
                    <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors font-light tracking-wider">{t('actions.save')}</span>
                </label>
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className={`text-[10px] font-light tracking-wider transition-colors ${isMGT ? 'text-emerald-400/50 hover:text-emerald-400/80' : 'text-gold-400/50 hover:text-gold-400/80'}`}
                >
                    {t('forgotPassword.title')}
                </button>
            </div>

            {/* Submit */}
            <motion.button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full py-3.5 rounded-2xl font-medium text-xs uppercase tracking-[0.2em] overflow-hidden"
                style={submitButtonStyle}
                whileHover={isMobile ? undefined : { scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Shimmer — desktop only */}
                {!isMobile && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 55%, transparent 60%)' }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                    />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                        <>
                            <motion.div
                                className={`w-4 h-4 border-2 rounded-full ${isMGT ? 'border-emerald-400/30 border-t-emerald-400' : 'border-gold-400/30 border-t-gold-400'}`}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            {t('status.loading')}
                        </>
                    ) : (
                        <>
                            <Fingerprint size={14} className="opacity-60" />
                            {t('actions.submit')}
                        </>
                    )}
                </span>
            </motion.button>

            {errors.root && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400/80 text-xs text-center font-light">
                    {errors.root.message}
                </motion.p>
            )}
        </form>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ModernLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginAsVisitor } = useAuth();
    const { config } = useCommunity();
    const { t } = useTranslation('common');

    // Clear stale tokens
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('sessionMembershipType');
            localStorage.removeItem('dailyLoginModalShown');
        }
    }, []);

    useDynamicHead();

    const logoMgt = config.logoIconUrl || logoMgtFallback;

    // Membership from URL path
    const getMembershipFromPath = useCallback(() => {
        if (location.pathname === '/login/mgt') return 'MGT';
        if (location.pathname === '/login/magazine') return 'MAGAZINE';
        return null;
    }, [location.pathname]);

    const pathMembership = getMembershipFromPath();
    const initialMembership = pathMembership || location.state?.membershipType || localStorage.getItem('lastMembershipType') || 'MAGAZINE';
    const [isMGT, setIsMGT] = useState(initialMembership === 'MGT');

    useEffect(() => {
        const membership = getMembershipFromPath();
        if (membership) setIsMGT(membership === 'MGT');
    }, [getMembershipFromPath]);

    // Modal states
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [showUserNotFoundPopup, setShowUserNotFoundPopup] = useState(false);
    const [showPermissionDeniedPopup, setShowPermissionDeniedPopup] = useState(false);
    const [showLoginErrorPopup, setShowLoginErrorPopup] = useState(false);
    const [loginErrorMessage, setLoginErrorMessage] = useState('');
    const [notFoundEmail, setNotFoundEmail] = useState('');
    const [deniedMembershipType, setDeniedMembershipType] = useState<'MAGAZINE' | 'MGT'>('MAGAZINE');

    // Forms (separate to avoid cross-registration)
    const magazineForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
    const mgtForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

    const toggleMembership = () => setIsMGT((prev) => !prev);

    // ---- Login handler ----
    const handleLogin = async (data: LoginFormValues, setError: ReturnType<typeof useForm<LoginFormValues>>['setError'], membershipContext: 'MAGAZINE' | 'MGT') => {
        try {
            const response = await api.post('/auth/login', data);
            const userMembershipType = response.data.user.membershipType;

            if (membershipContext === 'MAGAZINE' && userMembershipType === 'MGT') {
                setDeniedMembershipType('MAGAZINE');
                setShowPermissionDeniedPopup(true);
                return;
            }
            if (membershipContext === 'MGT' && userMembershipType === 'MAGAZINE') {
                setDeniedMembershipType('MGT');
                setShowPermissionDeniedPopup(true);
                return;
            }

            sessionStorage.setItem('token', response.data.token);

            try {
                const fullUserRes = await api.get('/users/me');
                login(response.data.token, fullUserRes.data, membershipContext);
            } catch {
                login(response.data.token, response.data.user, membershipContext);
            }

            navigate('/feed');
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || t('errors.unauthorized');

            if (
                errorMessage.toLowerCase().includes('não encontrado') ||
                errorMessage.toLowerCase().includes('not found') ||
                errorMessage.toLowerCase().includes('usuário não existe') ||
                error.response?.status === 404
            ) {
                setNotFoundEmail(data.email);
                setShowUserNotFoundPopup(true);
            } else if (
                errorMessage.toLowerCase().includes('invalid credentials') ||
                errorMessage.toLowerCase().includes('credenciais inválidas')
            ) {
                setLoginErrorMessage(t('errors.unauthorized'));
                setShowLoginErrorPopup(true);
            } else {
                setError('root', { message: errorMessage });
            }
        }
    };

    const onMagazineSubmit = async (data: LoginFormValues) => await handleLogin(data, magazineForm.setError, 'MAGAZINE');
    const onMgtSubmit = async (data: LoginFormValues) => await handleLogin(data, mgtForm.setError, 'MGT');

    // ============================
    // RENDER
    // ============================

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
            {/* ── Dynamic Backgrounds ── */}
            <AnimatePresence mode="wait">
                {isMGT ? <MgtBackground key="mgt-bg" /> : <MagazineBackground key="mag-bg" />}
            </AnimatePresence>

            {/* ── Central Layout ── */}
            <div className="relative z-10 w-full max-w-[1060px] mx-4 my-12 md:my-0 flex flex-col md:flex-row items-center gap-6 md:gap-0">
                {/* ===== LEFT: Liquid Glass Login Card ===== */}
                <motion.div
                    className="w-full md:w-[420px] flex-shrink-0 z-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                >
                    <GlassCard>
                        <div className="p-6 md:p-10">
                            {/* Logo & Title */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isMGT ? 'mgt-header' : 'mag-header'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="text-center mb-6 md:mb-8"
                                >
                                    <motion.img
                                        src={isMGT ? logoMgt : logo}
                                        alt={isMGT ? config.tierStdName : config.tierVipName}
                                        className={`mx-auto mb-4 md:mb-5 ${isMGT ? 'h-12 md:h-16' : 'h-16 md:h-24'}`}
                                        style={{
                                            filter: isMGT
                                                ? 'drop-shadow(0 0 20px rgba(16,185,129,0.3))'
                                                : 'drop-shadow(0 0 20px rgba(212,175,55,0.3))',
                                        }}
                                    />
                                    <h1
                                        className="text-[22px] font-semibold tracking-tight mb-1"
                                        style={{
                                            background: isMGT
                                                ? 'linear-gradient(135deg, #6ee7b7 0%, #10b981 50%, #34d399 100%)'
                                                : 'linear-gradient(135deg, #fde68a 0%, #d4af37 50%, #f59e0b 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {isMGT ? config.tierStdName : config.tierVipName}
                                    </h1>
                                    <p className="text-white/30 text-[11px] uppercase tracking-[0.25em] font-light">
                                        {isMGT ? config.tierStdSlogan : config.tierVipSlogan}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Form */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isMGT ? 'mgt-form' : 'mag-form'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {isMGT ? (
                                        <LoginForm
                                            register={mgtForm.register}
                                            errors={mgtForm.formState.errors}
                                            isSubmitting={mgtForm.formState.isSubmitting}
                                            onSubmit={mgtForm.handleSubmit(onMgtSubmit)}
                                            isMGT
                                            onForgotPassword={() => setIsForgotPasswordOpen(true)}
                                        />
                                    ) : (
                                        <LoginForm
                                            register={magazineForm.register}
                                            errors={magazineForm.formState.errors}
                                            isSubmitting={magazineForm.formState.isSubmitting}
                                            onSubmit={magazineForm.handleSubmit(onMagazineSubmit)}
                                            isMGT={false}
                                            onForgotPassword={() => setIsForgotPasswordOpen(true)}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-white/[0.06]" />
                                <span className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-light">ou</span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>

                            {/* Register / Invite CTA */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isMGT ? 'mgt-cta' : 'mag-cta'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center"
                                >
                                    {isMGT ? (
                                        <p className="text-white/25 text-xs font-light">
                                            Ainda não é membro?{' '}
                                            <Link to="/register" state={{ membershipType: 'MGT' }} className="text-emerald-400/70 hover:text-emerald-400 transition-colors font-normal">
                                                Criar Conta
                                            </Link>
                                        </p>
                                    ) : (
                                        <p className="text-white/25 text-xs font-light">
                                            Deseja fazer parte?{' '}
                                            <Link to="/request-invite" className="text-gold-400/70 hover:text-gold-400 transition-colors font-normal">
                                                Solicitar Convite
                                            </Link>
                                        </p>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </GlassCard>

                    {/* Visitor access */}
                    <motion.button
                        onClick={() => {
                            loginAsVisitor(isMGT ? 'MGT' : 'MAGAZINE');
                            navigate('/feed');
                        }}
                        className="mt-4 w-full text-center text-white/15 hover:text-white/40 text-[10px] uppercase tracking-[0.25em] font-light transition-colors duration-300"
                        whileHover={{ y: -1 }}
                    >
                        Entrar como Visitante
                    </motion.button>
                </motion.div>

                {/* ===== RIGHT: Switch Panel (Desktop only) ===== */}
                <motion.div
                    className="hidden md:flex flex-1 items-center justify-center pl-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isMGT ? 'switch-to-mag' : 'switch-to-mgt'}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-center max-w-[320px]"
                        >
                            {/* Opposite tier floating logo */}
                            <motion.div
                                className="mb-6 w-20 h-20 mx-auto rounded-3xl flex items-center justify-center"
                                style={{
                                    background: isMGT
                                        ? 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)'
                                        : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)',
                                    border: `1px solid ${isMGT ? 'rgba(212,175,55,0.1)' : 'rgba(16,185,129,0.1)'}`,
                                    backdropFilter: 'blur(20px)',
                                }}
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <img src={isMGT ? logo : logoMgt} alt={isMGT ? config.tierVipName : config.tierStdName} className="h-10 opacity-60" />
                            </motion.div>

                            <h2 className="text-xl font-semibold text-white/80 mb-2">
                                Membro {isMGT ? config.tierVipName : config.tierStdName}?
                            </h2>
                            <p className="text-white/25 text-sm font-light leading-relaxed mb-8">
                                {isMGT ? 'Acesse o clube de elite e gerencie seu império.' : 'Entre na pista e acelere para a vitória.'}
                            </p>

                            <motion.button
                                onClick={toggleMembership}
                                className="group inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-500"
                                style={{
                                    background: isMGT ? 'rgba(212,175,55,0.06)' : 'rgba(16,185,129,0.06)',
                                    border: `1px solid ${isMGT ? 'rgba(212,175,55,0.15)' : 'rgba(16,185,129,0.15)'}`,
                                    color: isMGT ? 'rgba(212,175,55,0.7)' : 'rgba(16,185,129,0.7)',
                                    backdropFilter: 'blur(20px)',
                                }}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <ArrowRightLeft size={13} className="opacity-60" />
                                Acessar {isMGT ? config.tierVipName : config.tierStdName}
                                <ChevronRight size={12} className="opacity-40 group-hover:translate-x-0.5 transition-transform" />
                            </motion.button>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* ===== Mobile: Switch button ===== */}
                <motion.button
                    onClick={toggleMembership}
                    className="md:hidden w-full py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2"
                    style={{
                        background: isMGT ? 'rgba(212,175,55,0.08)' : 'rgba(16,185,129,0.08)',
                        border: `1px solid ${isMGT ? 'rgba(212,175,55,0.12)' : 'rgba(16,185,129,0.12)'}`,
                        color: isMGT ? 'rgba(212,175,55,0.6)' : 'rgba(16,185,129,0.6)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <ArrowRightLeft size={12} className="opacity-60" />
                    Acessar {isMGT ? config.tierVipName : config.tierStdName}
                </motion.button>
            </div>

            {/* ===== MODALS ===== */}
            {showLoginErrorPopup && (
                <LoginErrorPopup message={loginErrorMessage} onClose={() => setShowLoginErrorPopup(false)} autoCloseDuration={5000} />
            )}

            <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} isMGT={isMGT} />

            {/* User Not Found */}
            <AnimatePresence>
                {showUserNotFoundPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm md:backdrop-blur-xl"
                        onClick={() => setShowUserNotFoundPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-sm"
                        >
                            <GlassCard>
                                <div className="p-6">
                                    <button onClick={() => setShowUserNotFoundPopup(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors z-20">
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="text-center">
                                        <div
                                            className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10'}`}
                                            style={{ border: `1px solid ${isMGT ? 'rgba(16,185,129,0.15)' : 'rgba(212,175,55,0.15)'}` }}
                                        >
                                            <AlertCircle className={`w-6 h-6 ${isMGT ? 'text-emerald-400/70' : 'text-gold-400/70'}`} />
                                        </div>

                                        <h3 className="text-lg font-semibold text-white/90 mb-2">Usuário não encontrado</h3>
                                        <p className="text-white/30 text-sm font-light mb-1">Não encontramos uma conta com o email</p>
                                        <p className={`text-sm font-medium mb-4 ${isMGT ? 'text-emerald-400/70' : 'text-gold-400/70'}`}>{notFoundEmail}</p>
                                        <p className="text-white/20 text-xs font-light mb-6">Verifique o email digitado ou crie uma nova conta.</p>

                                        <div className="flex flex-col gap-2.5">
                                            <motion.button
                                                onClick={() => setShowUserNotFoundPopup(false)}
                                                className={`w-full py-3 rounded-xl font-medium text-xs uppercase tracking-[0.15em] ${isMGT ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-gold-500/20 text-gold-300 border border-gold-500/20'}`}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Tentar Novamente
                                            </motion.button>

                                            {isMGT ? (
                                                <Link
                                                    to="/register"
                                                    state={{ membershipType: 'MGT' }}
                                                    className="w-full py-3 rounded-xl border border-white/[0.06] text-white/40 font-medium text-xs uppercase tracking-[0.15em] text-center hover:text-white/60 hover:border-white/10 transition-all"
                                                >
                                                    Criar Nova Conta
                                                </Link>
                                            ) : (
                                                <Link
                                                    to="/request-invite"
                                                    className="w-full py-3 rounded-xl border border-white/[0.06] text-white/40 font-medium text-xs uppercase tracking-[0.15em] text-center hover:text-white/60 hover:border-white/10 transition-all"
                                                >
                                                    Solicitar Convite
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Permission Denied */}
            <AnimatePresence>
                {showPermissionDeniedPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm md:backdrop-blur-xl"
                        onClick={() => setShowPermissionDeniedPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-sm"
                        >
                            <GlassCard>
                                <div className="p-6">
                                    <button onClick={() => setShowPermissionDeniedPopup(false)} className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors z-20">
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="text-center">
                                        <div
                                            className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${deniedMembershipType === 'MAGAZINE' ? 'bg-gold-500/10' : 'bg-emerald-500/10'}`}
                                            style={{ border: `1px solid ${deniedMembershipType === 'MAGAZINE' ? 'rgba(212,175,55,0.15)' : 'rgba(16,185,129,0.15)'}` }}
                                        >
                                            <AlertCircle className={`w-6 h-6 ${deniedMembershipType === 'MAGAZINE' ? 'text-gold-400/70' : 'text-emerald-400/70'}`} />
                                        </div>

                                        <h3 className="text-lg font-semibold text-white/90 mb-2">Acesso Negado</h3>

                                        {deniedMembershipType === 'MAGAZINE' ? (
                                            <>
                                                <p className="text-white/30 text-sm font-light mb-3">
                                                    Você não tem permissão para acessar o <span className="text-gold-400/70 font-medium">{config.tierVipName}</span>.
                                                </p>
                                                <div className="text-left text-white/25 text-xs font-light mb-4 space-y-2 bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]">
                                                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Para se tornar membro:</p>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-gold-400/60 mt-0.5">1.</span>
                                                        <span>Solicitar um convite através do formulário oficial</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-gold-400/60 mt-0.5">2.</span>
                                                        <span>Aguardar análise e aprovação da administração</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-gold-400/60 mt-0.5">3.</span>
                                                        <span>Receber confirmação de aceitação</span>
                                                    </div>
                                                </div>
                                                <p className="text-white/20 text-xs font-light mb-5">
                                                    Sua conta atual é <span className="text-emerald-400/60 font-medium">{config.tierStdName}</span>.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-white/30 text-sm font-light mb-3">
                                                    Você não tem permissão para acessar o <span className="text-emerald-400/70 font-medium">{config.tierStdName}</span>.
                                                </p>
                                                <p className="text-white/20 text-xs font-light mb-5">
                                                    Sua conta atual é <span className="text-gold-400/60 font-medium">{config.tierVipName}</span>. Cada conta tem acesso a apenas um tipo.
                                                </p>
                                            </>
                                        )}

                                        <div className="flex flex-col gap-2.5">
                                            <motion.button
                                                onClick={() => {
                                                    setShowPermissionDeniedPopup(false);
                                                    navigate(deniedMembershipType === 'MGT' ? '/login/mgt' : '/login');
                                                }}
                                                className={`w-full py-3 rounded-xl font-medium text-xs uppercase tracking-[0.15em] ${deniedMembershipType === 'MAGAZINE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-gold-500/20 text-gold-300 border border-gold-500/20'}`}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Acessar {deniedMembershipType === 'MAGAZINE' ? config.tierStdName : config.tierVipName}
                                            </motion.button>

                                            {deniedMembershipType === 'MAGAZINE' && (
                                                <Link
                                                    to="/request-invite"
                                                    className="w-full py-3 rounded-xl border border-white/[0.06] text-white/40 font-medium text-xs uppercase tracking-[0.15em] text-center hover:text-white/60 hover:border-white/10 transition-all"
                                                >
                                                    Solicitar Convite {config.tierVipName}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
