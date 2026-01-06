import { useState } from 'react';
import { X, Check, ShoppingBag, Loader2, QrCode, Copy, CheckCircle } from 'lucide-react';
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

const PACKAGES = [
    { zions: 50, price: 5.00, label: 'Iniciante', image: zion50 },
    { zions: 150, price: 12.00, label: 'Explorador', popular: true, image: zion150 },
    { zions: 300, price: 20.00, label: 'Entusiasta', image: zion300 },
    { zions: 500, price: 30.00, label: 'Colecionador', image: zion500 },
    { zions: 1000, price: 50.00, label: 'Magnata', image: zion1000 },
];

export default function ZionsPurchaseModal({ isOpen, onClose }: ZionsPurchaseModalProps) {
    const { user, theme, updateUser } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [loading, setLoading] = useState<number | null>(null);
    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; copyPaste: string; amount: number } | null>(null);
    const [copied, setCopied] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);

    /* Centering Fix: Use 'items-center' (already present) but verify height constraints. Using 'max-h-screen' and 'overflow-y-auto' on the container might help smaller screens. */
    /* MGT Color Fix: Ensure 'text' is emerald, remove other colors if conflicting. The user mentioned "red green and blue". Check 'themeColors' object. */

    const themeColors = isMGT ? {
        bg: theme === 'light' ? 'bg-white' : 'bg-gray-900',
        text: 'text-emerald-500',
        border: 'border-emerald-500/30',
        button: 'bg-emerald-600 hover:bg-emerald-500',
        popularBg: 'bg-emerald-500',
        cardBg: theme === 'light' ? 'bg-gray-50' : 'bg-black/40', // Darker background for MGT dark mode
        cardBorder: theme === 'light' ? 'border-gray-200' : 'border-emerald-500/20' // Emerald border
    } : {
        bg: theme === 'light' ? 'bg-white' : 'bg-gray-900',
        text: 'text-gold-500',
        border: 'border-gold-500/30',
        button: 'bg-gold-500 hover:bg-gold-400',
        popularBg: 'bg-gold-500',
        cardBg: theme === 'light' ? 'bg-gray-50' : 'bg-white/5',
        cardBorder: theme === 'light' ? 'border-gray-200' : 'border-white/10'
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

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
            <div className={`w-full max-w-4xl ${themeColors.bg} rounded-3xl border ${themeColors.border} shadow-2xl flex flex-col my-auto relative`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${themeColors.cardBg} ${themeColors.text}`}>
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Adquirir Zions
                            </h2>
                            <p className="text-sm text-gray-500">Invista na sua jornada automotiva</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className={`w-6 h-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PACKAGES.map((pkg) => (
                            <div
                                key={pkg.zions}
                                className={`relative rounded-2xl border ${themeColors.cardBorder} ${themeColors.cardBg} p-6 flex flex-col items-center text-center transition-transform hover:scale-105 group overflow-hidden`}
                            >
                                {pkg.popular && (
                                    <div className={`absolute top-0 right-0 ${themeColors.popularBg} text-white text-[10px] font-bold uppercase py-1 px-3 rounded-bl-xl z-20`}>
                                        Mais Popular
                                    </div>
                                )}

                                <div className="mb-4 relative group-hover:scale-110 transition-transform duration-300">
                                    <div className={`absolute inset-0 ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'} blur-[40px] opacity-20 rounded-full`} />
                                    <img
                                        src={pkg.image}
                                        alt={`${pkg.zions} Zions`}
                                        className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl mix-blend-screen rounded-full"
                                        style={{ backgroundColor: 'transparent' }}
                                    />
                                </div>

                                <div className="mb-2">
                                    <span className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {pkg.zions}
                                    </span>
                                    <span className={`text-sm font-medium ${themeColors.text} ml-1`}>ZIONS</span>
                                </div>

                                <div className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-6">
                                    {pkg.label}
                                </div>

                                <div className="flex-1 w-full flex items-end">
                                    <button
                                        onClick={() => handlePurchase(pkg.zions)}
                                        disabled={loading === pkg.zions}
                                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${themeColors.button} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {loading === pkg.zions ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <QrCode className="w-4 h-4" />
                                                <span>R$ {pkg.price.toFixed(2).replace('.', ',')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Pagamento seguro via Mercado Pago</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
