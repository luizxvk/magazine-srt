import { useState, useEffect, useRef } from 'react';
import { X, Check, Loader2, QrCode, Copy, CheckCircle, Coins, Wallet, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import zionPointsImg from '../assets/zions/zion-points.png';
import zionCashImg from '../assets/zions/zion-cash.png';

interface ZionsPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Valores mais acessíveis com melhor custo-benefício - ZIONS POINTS
const PACKAGES = [
    { zions: 100, price: 4.90, label: 'Iniciante', image: zionPointsImg },
    { zions: 250, price: 9.90, label: 'Popular', popular: true, image: zionPointsImg },
    { zions: 500, price: 17.90, label: 'Entusiasta', bonus: '10% economia', image: zionPointsImg },
    { zions: 1000, price: 29.90, label: 'Colecionador', bonus: '25% economia', image: zionPointsImg },
    { zions: 2500, price: 59.90, label: 'Magnata', bonus: '40% economia', image: zionPointsImg },
];

// Valores de recarga para ZIONS CASH (com margem de lucro)
// Usuário paga R$ X e recebe Z$ Y
const CASH_PACKAGES = [
    { amount: 12, price: 15.00, label: 'Básico', image: zionCashImg },
    { amount: 25, price: 30.00, label: 'Padrão', popular: true, image: zionCashImg },
    { amount: 50, price: 60.00, label: 'Plus', image: zionCashImg },
    { amount: 110, price: 130.00, label: 'Premium', bonus: '+Z$5 bônus', image: zionCashImg },
    { amount: 225, price: 260.00, label: 'Elite', bonus: '+Z$15 bônus', image: zionCashImg },
];

type TabType = 'points' | 'cash';

export default function ZionsPurchaseModal({ isOpen, onClose }: ZionsPurchaseModalProps) {
    const { user, theme, updateUser } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [loading, setLoading] = useState<number | null>(null);
    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; copyPaste: string; amount: number; paymentId: string; type: TabType } | null>(null);
    const [copied, setCopied] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [showSuccess, setShowSuccess] = useState<{ amount: number; type: TabType } | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('points');
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isDark = theme === 'dark';

    // Apple Vision Pro style - glass morphism with dark backgrounds
    const themeColors = isMGT ? {
        accent: 'emerald',
        gradient: 'from-emerald-500/10 to-transparent',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        button: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400',
        glow: 'shadow-[0_0_60px_rgba(16,185,129,0.15)]',
        cardBg: isDark ? 'bg-black/60' : 'bg-white/90',
        bg: isDark ? 'bg-zinc-950/95 backdrop-blur-2xl' : 'bg-white/95 backdrop-blur-2xl',
        cardBorder: 'border-emerald-500/20',
        itemBg: isDark ? 'bg-black/40' : 'bg-gray-50',
        itemBorder: isDark ? 'border-emerald-500/20' : 'border-emerald-200',
    } : {
        accent: 'gold',
        gradient: 'from-gold-500/10 to-transparent',
        border: 'border-gold-500/30',
        text: 'text-gold-400',
        button: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400',
        glow: 'shadow-[0_0_60px_rgba(212,175,55,0.15)]',
        cardBg: isDark ? 'bg-black/60' : 'bg-white/90',
        bg: isDark ? 'bg-zinc-950/95 backdrop-blur-2xl' : 'bg-white/95 backdrop-blur-2xl',
        cardBorder: 'border-gold-500/20',
        itemBg: isDark ? 'bg-black/40' : 'bg-gray-50',
        itemBorder: isDark ? 'border-gold-500/20' : 'border-amber-200',
    };

    const handlePurchase = async (amount: number, type: TabType = 'points') => {
        try {
            setLoading(amount);
            
            // Endpoint diferente para Cash vs Points
            const endpoint = type === 'cash' ? '/payments/zions/cash/pix' : '/payments/zions/pix';
            const response = await api.post(endpoint, { zions: amount });

            if (response.data.qrCodeBase64) {
                setPixData({
                    qrCode: response.data.qrCode,
                    qrCodeBase64: response.data.qrCodeBase64,
                    copyPaste: response.data.copyPaste,
                    amount: amount,
                    paymentId: response.data.paymentId,
                    type: type
                });
                
                // Iniciar polling para verificar status do pagamento
                startPolling(response.data.paymentId, amount, type);
            }
        } catch (error) {
            console.error('Purchase failed', error);
        } finally {
            setLoading(null);
        }
    };

    // Polling para verificar status do pagamento
    const startPolling = (paymentId: string, amount: number, type: TabType = 'points') => {
        // Limpar polling anterior se existir
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }

        pollingRef.current = setInterval(async () => {
            try {
                const response = await api.get(`/payments/status/${paymentId}`);
                
                if (response.data.completed || response.data.status === 'approved') {
                    // Pagamento aprovado!
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                    
                    // Atualizar dados do usuário
                    const userResponse = await api.get('/users/me');
                    if (userResponse.data) {
                        updateUser(userResponse.data);
                    }
                    
                    // Mostrar popup de sucesso
                    setPixData(null);
                    setShowSuccess({ amount, type });
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }, 3000); // Verificar a cada 3 segundos
    };

    // Limpar polling quando componente desmontar ou fechar
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const handleCopyPix = async () => {
        if (pixData?.copyPaste) {
            await navigator.clipboard.writeText(pixData.copyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleConfirmPayment = async () => {
        if (!pixData?.paymentId) return;
        
        setCheckingPayment(true);
        try {
            const response = await api.get(`/payments/status/${pixData.paymentId}`);
            
            if (response.data.completed || response.data.status === 'approved') {
                // Atualizar dados do usuário
                const userResponse = await api.get('/users/me');
                if (userResponse.data) {
                    updateUser(userResponse.data);
                }
                
                // Mostrar popup de sucesso
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                setPixData(null);
                setShowSuccess({ amount: pixData.amount, type: pixData.type });
            } else {
                // Pagamento ainda não confirmado - mostrar mensagem
                alert('Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.');
            }
        } catch (error) {
            console.error('Error refreshing user', error);
        } finally {
            setCheckingPayment(false);
        }
    };

    const handleClose = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setPixData(null);
        setCopied(false);
        setShowSuccess(null);
        onClose();
    };

    const handleSuccessClose = () => {
        setShowSuccess(null);
        onClose();
    };

    if (!isOpen) return null;

    // Success Popup - Apple Pay Premium Style
    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Dark overlay with subtle gradient */}
                <div className="absolute inset-0 bg-black/95" />
                
                {/* Centered radial glow behind card */}
                <div 
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full ${isMGT ? 'bg-emerald-500' : 'bg-amber-500'} opacity-20 blur-[120px]`}
                    style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
                />
                
                {/* Confetti particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-2 h-2 rounded-full ${
                                i % 3 === 0 ? (isMGT ? 'bg-emerald-400' : 'bg-amber-400') :
                                i % 3 === 1 ? (isMGT ? 'bg-emerald-300' : 'bg-amber-300') :
                                'bg-white'
                            }`}
                            style={{
                                left: `${10 + (i * 4.5)}%`,
                                top: '-10px',
                                animation: `confetti-fall ${2 + (i % 3) * 0.5}s ease-out forwards`,
                                animationDelay: `${i * 0.1}s`,
                                opacity: 0.8
                            }}
                        />
                    ))}
                </div>

                {/* Main Card - Apple Vision Pro glassmorphism */}
                <div 
                    className="relative z-10 w-full max-w-[340px]"
                    style={{ animation: 'card-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                >
                    <div className={`relative overflow-hidden rounded-[32px] ${isDark ? 'bg-zinc-900/80' : 'bg-white/90'} backdrop-blur-3xl border ${isMGT ? 'border-emerald-500/20' : 'border-amber-500/20'} shadow-2xl`}>
                        
                        {/* Inner glow at top */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 ${isMGT ? 'bg-emerald-500' : 'bg-amber-500'} opacity-10 blur-3xl rounded-full`} />
                        
                        <div className="relative p-8 pt-10">
                            {/* Animated Checkmark - Apple Pay style */}
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    {/* Outer ring */}
                                    <div 
                                        className={`w-24 h-24 rounded-full ${isMGT ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-amber-600'}`}
                                        style={{ animation: 'scale-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                                    >
                                        {/* Inner checkmark with SVG animation */}
                                        <svg 
                                            className="absolute inset-0 w-full h-full p-6" 
                                            viewBox="0 0 24 24" 
                                            fill="none"
                                        >
                                            <path 
                                                d="M4 12.5L9.5 18L20 6" 
                                                stroke="white" 
                                                strokeWidth="3" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                                className="check-path"
                                                style={{
                                                    strokeDasharray: 30,
                                                    strokeDashoffset: 30,
                                                    animation: 'draw-check 0.4s ease-out 0.3s forwards'
                                                }}
                                            />
                                        </svg>
                                    </div>
                                    
                                    {/* Sparkle effects */}
                                    <div 
                                        className={`absolute -top-1 -right-1 w-4 h-4 ${isMGT ? 'bg-emerald-300' : 'bg-amber-300'} rounded-full`}
                                        style={{ animation: 'sparkle 1s ease-out 0.5s forwards', opacity: 0 }}
                                    />
                                    <div 
                                        className={`absolute -bottom-1 -left-1 w-3 h-3 ${isMGT ? 'bg-emerald-400' : 'bg-amber-400'} rounded-full`}
                                        style={{ animation: 'sparkle 1s ease-out 0.7s forwards', opacity: 0 }}
                                    />
                                    <div 
                                        className={`absolute top-1/2 -right-3 w-2 h-2 ${isMGT ? 'bg-emerald-200' : 'bg-amber-200'} rounded-full`}
                                        style={{ animation: 'sparkle 1s ease-out 0.6s forwards', opacity: 0 }}
                                    />
                                </div>
                            </div>
                            
                            {/* Title */}
                            <h2 
                                className={`text-center text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                                style={{ animation: 'fade-up 0.5s ease-out 0.2s forwards', opacity: 0 }}
                            >
                                {showSuccess.type === 'cash' ? 'Recarga Realizada!' : 'Compra Realizada!'}
                            </h2>
                            
                            {/* Amount display - Apple Pay style ticket */}
                            <div 
                                className="my-6"
                                style={{ animation: 'fade-up 0.5s ease-out 0.3s forwards', opacity: 0 }}
                            >
                                <div className={`relative mx-auto max-w-[200px] py-4 px-6 rounded-2xl ${isDark ? 'bg-black/40' : 'bg-gray-100'} border ${isMGT ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
                                    {/* Decorative dots */}
                                    <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${isDark ? 'bg-zinc-900' : 'bg-white'}`} />
                                    <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${isDark ? 'bg-zinc-900' : 'bg-white'}`} />
                                    
                                    <div className="flex items-center justify-center gap-2">
                                        {showSuccess.type === 'cash' ? (
                                            <Wallet className={`w-6 h-6 ${isMGT ? 'text-emerald-400' : 'text-amber-400'}`} />
                                        ) : (
                                            <Coins className={`w-6 h-6 ${isMGT ? 'text-emerald-400' : 'text-amber-400'}`} />
                                        )}
                                        <span className={`text-3xl font-bold tracking-tight ${isMGT ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {showSuccess.type === 'cash' ? `Z$ ${showSuccess.amount}` : `+${showSuccess.amount}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Description */}
                            <p 
                                className={`text-center text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                                style={{ animation: 'fade-up 0.5s ease-out 0.4s forwards', opacity: 0 }}
                            >
                                {showSuccess.type === 'cash' 
                                    ? 'Seu saldo foi creditado com sucesso!' 
                                    : 'Seus Zions Points foram creditados!'
                                }
                            </p>
                            
                            {/* Continue Button */}
                            <button
                                onClick={handleSuccessClose}
                                className={`w-full py-4 rounded-2xl font-semibold text-white text-lg ${isMGT ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600'} transition-all duration-200 active:scale-[0.98]`}
                                style={{ animation: 'fade-up 0.5s ease-out 0.5s forwards', opacity: 0 }}
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Apple Pay style animations */}
                <style>{`
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(1); }
                        50% { opacity: 0.25; transform: translate(-50%, -50%) scale(1.1); }
                    }
                    @keyframes card-appear {
                        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes scale-bounce {
                        0% { transform: scale(0); }
                        60% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                    @keyframes draw-check {
                        to { stroke-dashoffset: 0; }
                    }
                    @keyframes sparkle {
                        0% { opacity: 0; transform: scale(0); }
                        50% { opacity: 1; transform: scale(1.5); }
                        100% { opacity: 0; transform: scale(0); }
                    }
                    @keyframes fade-up {
                        0% { opacity: 0; transform: translateY(10px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes confetti-fall {
                        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                    }
                `}</style>
            </div>
        );
    }

    // PIX Payment Screen
    if (pixData) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className={`w-full max-w-md ${themeColors.bg} rounded-3xl border ${themeColors.border} shadow-2xl p-6`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Pagar com PIX
                        </h2>
                        <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                        </button>
                    </div>

                    <div className="text-center">
                        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} mb-4`}>
                            Escaneie o QR Code ou copie o código PIX
                        </p>

                        {/* QR Code */}
                        <div className={`inline-block p-4 rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-white'} mb-4`}>
                            <img 
                                src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                                alt="QR Code PIX" 
                                className="w-48 h-48"
                            />
                        </div>

                        {/* Amount */}
                        <div className="mb-4">
                            <span className={`text-2xl font-bold ${themeColors.text}`}>
                                {pixData.type === 'cash' ? `Z$ ${pixData.amount.toFixed(2)}` : `${pixData.amount} Points`}
                            </span>
                        </div>

                        {/* Copy Paste Code */}
                        <button
                            onClick={handleCopyPix}
                            className={`w-full py-3 px-4 rounded-xl border ${themeColors.cardBorder} ${themeColors.cardBg} flex items-center justify-center gap-2 hover:opacity-80 transition-opacity mb-4`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-green-500 font-medium">Copiado!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className={`w-5 h-5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <span className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Copiar código PIX</span>
                                </>
                            )}
                        </button>

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirmPayment}
                            disabled={checkingPayment}
                            className={`w-full py-3 rounded-xl font-bold text-white ${themeColors.button} flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                            {checkingPayment ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Já paguei
                                </>
                            )}
                        </button>

                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} mt-4`}>
                            Os Zions serão creditados automaticamente após a confirmação do pagamento.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Main purchase screen - Apple Vision Pro glass morphism style
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
            <div className={`w-full max-w-4xl rounded-3xl border ${themeColors.border} ${themeColors.glow} backdrop-blur-2xl ${themeColors.cardBg} flex flex-col my-auto relative overflow-hidden`}>
                {/* Subtle gradient background overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${themeColors.gradient} pointer-events-none`} />
                
                {/* Header */}
                <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${themeColors.gradient} border ${themeColors.border}`}>
                            {activeTab === 'cash' ? (
                                <Wallet className={`w-6 h-6 ${themeColors.text}`} />
                            ) : (
                                <Coins className={`w-6 h-6 ${themeColors.text}`} />
                            )}
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {activeTab === 'cash' ? 'Recarregar Zions Cash' : 'Adquirir Zions Points'}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {activeTab === 'cash' ? 'Saldo para comprar na Loja de Produtos' : 'Invista na sua jornada'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}
                    >
                        <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="relative z-10 px-6 pt-4">
                    <div className={`inline-flex p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'} border ${themeColors.border}`}>
                        <button
                            onClick={() => setActiveTab('points')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'points'
                                    ? `${themeColors.button} text-white shadow-lg`
                                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                            }`}
                        >
                            <Zap className="w-4 h-4" />
                            Zions Points
                        </button>
                        <button
                            onClick={() => setActiveTab('cash')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                activeTab === 'cash'
                                    ? `${themeColors.button} text-white shadow-lg`
                                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                            }`}
                        >
                            <Wallet className="w-4 h-4" />
                            Zions Cash
                        </button>
                    </div>
                </div>

                {/* Packages Grid */}
                <div className="relative z-10 overflow-y-auto p-6">
                    {activeTab === 'points' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {PACKAGES.map((pkg) => (
                                <div
                                    key={pkg.zions}
                                    className={`relative rounded-2xl border ${themeColors.itemBorder} p-4 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] group overflow-hidden ${themeColors.itemBg}`}
                                >
                                    {/* Popular Badge */}
                                    {pkg.popular && (
                                        <div className={`absolute -top-0 -right-0 ${themeColors.button} text-white text-[9px] font-bold uppercase py-1 px-2 rounded-bl-xl rounded-tr-xl z-20`}>
                                            Popular
                                        </div>
                                    )}

                                {/* Coin Image with Glow */}
                                <div className="relative mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <div className={`absolute inset-0 ${isMGT ? 'bg-emerald-500' : 'bg-amber-500'} blur-[30px] opacity-30 rounded-full`} />
                                    <img
                                        src={pkg.image}
                                        alt={`${pkg.zions} Zions`}
                                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 drop-shadow-2xl"
                                    />
                                </div>

                                {/* Amount */}
                                <div className="mt-3 mb-1">
                                    <span className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {pkg.zions}
                                    </span>
                                    <span className={`text-xs font-semibold ${themeColors.text} ml-1`}>Z</span>
                                </div>

                                {/* Label */}
                                <div className={`text-[10px] uppercase tracking-widest mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {pkg.label}
                                </div>

                                {/* Buy Button */}
                                <button
                                    onClick={() => handlePurchase(pkg.zions, 'points')}
                                    disabled={loading === pkg.zions}
                                    className={`w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 ${themeColors.button} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading === pkg.zions ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <QrCode className="w-3.5 h-3.5" />
                                            <span>R$ {pkg.price.toFixed(2).replace('.', ',')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                    ) : (
                        /* Cash Packages Grid */
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {CASH_PACKAGES.map((pkg) => (
                                <div
                                    key={pkg.amount}
                                    className={`relative rounded-2xl border ${themeColors.itemBorder} p-4 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] group overflow-hidden ${themeColors.itemBg}`}
                                >
                                    {/* Popular Badge */}
                                    {pkg.popular && (
                                        <div className={`absolute -top-0 -right-0 ${themeColors.button} text-white text-[9px] font-bold uppercase py-1 px-2 rounded-bl-xl rounded-tr-xl z-20`}>
                                            Popular
                                        </div>
                                    )}

                                    {/* Coin Image with Glow */}
                                    <div className="relative mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <div className={`absolute inset-0 ${isMGT ? 'bg-emerald-500' : 'bg-amber-500'} blur-[30px] opacity-30 rounded-full`} />
                                        <img
                                            src={pkg.image}
                                            alt={`Z$ ${pkg.amount}`}
                                            className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 drop-shadow-2xl"
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div className="mt-3 mb-1">
                                        <span className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Z$
                                        </span>
                                        <span className={`text-2xl sm:text-3xl font-bold ${themeColors.text} ml-1`}>{pkg.amount}</span>
                                    </div>

                                    {/* Label */}
                                    <div className={`text-[10px] uppercase tracking-widest mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {pkg.label}
                                    </div>

                                    {/* Buy Button */}
                                    <button
                                        onClick={() => handlePurchase(pkg.amount, 'cash')}
                                        disabled={loading === pkg.amount}
                                        className={`w-full py-2.5 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 ${themeColors.button} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {loading === pkg.amount ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <QrCode className="w-3.5 h-3.5" />
                                                <span>R$ {pkg.price.toFixed(2).replace('.', ',')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'} border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                            <Check className="w-4 h-4 text-green-500" />
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Pagamento seguro via Mercado Pago
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
