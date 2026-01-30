import { useState } from 'react';
import { X, Check, Loader2, QrCode, Copy, CheckCircle, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import zion50 from '../assets/zions/zion-50.png';
import zion150 from '../assets/zions/zion-150.png';
import zion300 from '../assets/zions/zion-300.png';
import zion500 from '../assets/zions/zion-500.png';
import zion1000 from '../assets/zions/zion-1000.png';

interface ZionsPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Valores mais acessíveis com melhor custo-benefício
const PACKAGES = [
    { zions: 100, price: 4.90, label: 'Iniciante', image: zion50 },
    { zions: 250, price: 9.90, label: 'Popular', popular: true, image: zion150 },
    { zions: 500, price: 17.90, label: 'Entusiasta', bonus: '10% economia', image: zion300 },
    { zions: 1000, price: 29.90, label: 'Colecionador', bonus: '25% economia', image: zion500 },
    { zions: 2500, price: 59.90, label: 'Magnata', bonus: '40% economia', image: zion1000 },
];

export default function ZionsPurchaseModal({ isOpen, onClose }: ZionsPurchaseModalProps) {
    const { user, theme, updateUser } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [loading, setLoading] = useState<number | null>(null);
    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; copyPaste: string; amount: number } | null>(null);
    const [copied, setCopied] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const isDark = theme === 'dark';

    // Apple Vision Pro style - glass morphism
    const themeColors = isMGT ? {
        accent: 'emerald',
        gradient: 'from-emerald-500/20 to-emerald-900/40',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        button: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400',
        glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
        cardBg: isDark ? 'bg-gradient-to-br from-emerald-950/50 to-black/50' : 'bg-gradient-to-br from-emerald-50 to-white',
        bg: isDark ? 'bg-black/80 backdrop-blur-2xl' : 'bg-white/90 backdrop-blur-2xl',
        cardBorder: 'border-emerald-500/20',
    } : {
        accent: 'gold',
        gradient: 'from-amber-500/20 to-amber-900/40',
        border: 'border-gold-500/30',
        text: 'text-gold-400',
        button: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400',
        glow: 'shadow-[0_0_30px_rgba(212,175,55,0.3)]',
        cardBg: isDark ? 'bg-gradient-to-br from-amber-950/30 to-black/50' : 'bg-gradient-to-br from-amber-50 to-white',
        bg: isDark ? 'bg-black/80 backdrop-blur-2xl' : 'bg-white/90 backdrop-blur-2xl',
        cardBorder: 'border-amber-500/20',
    };

    const handlePurchase = async (amount: number) => {
        try {
            setLoading(amount);
            const response = await api.post('/payments/zions/pix', { zions: amount });

            if (response.data.qrCodeBase64) {
                setPixData({
                    qrCode: response.data.qrCode,
                    qrCodeBase64: response.data.qrCodeBase64,
                    copyPaste: response.data.copyPaste,
                    amount: amount
                });
            }
        } catch (error) {
            console.error('Purchase failed', error);
        } finally {
            setLoading(null);
        }
    };

    const handleCopyPix = async () => {
        if (pixData?.copyPaste) {
            await navigator.clipboard.writeText(pixData.copyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleConfirmPayment = async () => {
        setCheckingPayment(true);
        try {
            // Get updated user data
            const response = await api.get('/users/me');
            if (response.data) {
                updateUser(response.data);
            }
            setPixData(null);
            onClose();
        } catch (error) {
            console.error('Error refreshing user', error);
        } finally {
            setCheckingPayment(false);
        }
    };

    const handleClose = () => {
        setPixData(null);
        setCopied(false);
        onClose();
    };

    if (!isOpen) return null;

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
                                {pixData.amount} Zions
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
                {/* Gradient background overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${themeColors.gradient} pointer-events-none`} />
                
                {/* Header */}
                <div className="relative z-10 p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${themeColors.gradient} border ${themeColors.border}`}>
                            <Coins className={`w-6 h-6 ${themeColors.text}`} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Adquirir Zions
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Invista na sua jornada
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

                {/* Packages Grid */}
                <div className="relative z-10 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {PACKAGES.map((pkg) => (
                            <div
                                key={pkg.zions}
                                className={`relative rounded-2xl border ${themeColors.border} backdrop-blur-xl p-4 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] hover:border-opacity-60 group overflow-hidden ${
                                    isDark ? 'bg-black/30' : 'bg-white/50'
                                }`}
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
                                    {/* Badge com quantidade */}
                                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold ${themeColors.button} text-white border border-white/20 whitespace-nowrap`}>
                                        {pkg.zions} ZIONS
                                    </div>
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
                                    onClick={() => handlePurchase(pkg.zions)}
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
