import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ArrowRightLeft, Check, AlertCircle, Clock, Ban, DollarSign, Key, Mail, Phone, Hash } from 'lucide-react';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ConversionRate {
    rate: number;
    minZions: number;
    maxZions: number;
    minBRL: number;
    maxBRL: number;
}

interface Withdrawal {
    id: string;
    amountZions: number;
    amountBRL: number;
    pixKey: string;
    pixKeyType: string;
    status: string;
    createdAt: string;
    processedAt?: string;
    rejectionNote?: string;
}

const pixKeyTypes = [
    { value: 'CPF', label: 'CPF', icon: <Key className="w-4 h-4" /> },
    { value: 'EMAIL', label: 'E-mail', icon: <Mail className="w-4 h-4" /> },
    { value: 'PHONE', label: 'Telefone', icon: <Phone className="w-4 h-4" /> },
    { value: 'RANDOM', label: 'Chave Aleatória', icon: <Hash className="w-4 h-4" /> }
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-500/10', icon: <Clock className="w-4 h-4" /> },
    APPROVED: { label: 'Aprovado', color: 'text-blue-400 bg-blue-500/10', icon: <Check className="w-4 h-4" /> },
    PROCESSING: { label: 'Processando', color: 'text-purple-400 bg-purple-500/10', icon: <Loader size="sm" /> },
    COMPLETED: { label: 'Concluído', color: 'text-green-400 bg-green-500/10', icon: <Check className="w-4 h-4" /> },
    REJECTED: { label: 'Rejeitado', color: 'text-red-400 bg-red-500/10', icon: <Ban className="w-4 h-4" /> }
};

export default function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
    const { user, theme, updateUserZions, showToast } = useAuth();
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [rate, setRate] = useState<ConversionRate | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [amount, setAmount] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [pixKeyType, setPixKeyType] = useState('CPF');

    const isMGT = user?.membershipType === 'MGT';
    const gradientFrom = isMGT ? 'from-emerald-500' : 'from-yellow-500';
    const gradientTo = isMGT ? 'to-emerald-600' : 'to-yellow-600';
    const textAccent = isMGT ? 'text-emerald-400' : 'text-yellow-400';
    const borderAccent = isMGT ? 'border-emerald-500/30' : 'border-yellow-500/30';
    const bgAccent = isMGT ? 'bg-emerald-500/10' : 'bg-yellow-500/10';

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rateRes, historyRes] = await Promise.all([
                api.get('/withdrawals/rate'),
                api.get('/withdrawals/my')
            ]);
            setRate(rateRes.data);
            setWithdrawals(historyRes.data);
        } catch (err) {
            console.error('Error fetching withdrawal data:', err);
        } finally {
            setLoading(false);
        }
    };

    const amountZions = parseInt(amount) || 0;
    const amountBRL = rate ? amountZions / rate.rate : 0;
    const canSubmit = rate && 
        amountZions >= rate.minZions && 
        amountZions <= rate.maxZions && 
        amountZions <= (user?.zions || 0) &&
        pixKey.trim().length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError(null);

        try {
            await api.post('/withdrawals/request', {
                amountZions,
                pixKey,
                pixKeyType
            });
            setSuccess(true);
            updateUserZions(-amountZions);
            fetchData();
            
            // Reset form
            setAmount('');
            setPixKey('');
            
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao solicitar saque');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (withdrawalId: string) => {
        try {
            const response = await api.post(`/withdrawals/${withdrawalId}/cancel`);
            updateUserZions(response.data.refundedZions || 0);
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Erro ao cancelar');
        }
    };

    const pendingWithdrawal = withdrawals.find(w => w.status === 'PENDING' || w.status === 'PROCESSING');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className={`w-full max-w-lg rounded-2xl border ${borderAccent} ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} shadow-2xl overflow-hidden`}
                >
                    {/* Header */}
                    <div className={`p-4 border-b ${borderAccent} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${bgAccent}`}>
                                <Wallet className={`w-6 h-6 ${textAccent}`} />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Sacar Zions
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Converta seus Zions em dinheiro real
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className={`flex border-b ${borderAccent}`}>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex-1 py-3 font-medium transition-colors ${
                                activeTab === 'new' 
                                    ? `${textAccent} border-b-2 ${isMGT ? 'border-emerald-500' : 'border-yellow-500'}` 
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                        >
                            Novo Saque
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-3 font-medium transition-colors ${
                                activeTab === 'history' 
                                    ? `${textAccent} border-b-2 ${isMGT ? 'border-emerald-500' : 'border-yellow-500'}` 
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                        >
                            Histórico
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader size="md" />
                            </div>
                        ) : activeTab === 'new' ? (
                            <div className="space-y-4">
                                {/* Balance Display */}
                                <div className={`p-4 rounded-xl ${bgAccent} border ${borderAccent}`}>
                                    <p className="text-sm text-gray-400 mb-1">Seu saldo atual</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">💎</span>
                                        <span className={`text-2xl font-bold ${textAccent}`}>
                                            {user?.zions?.toLocaleString() || 0}
                                        </span>
                                        <span className="text-gray-400">Zions</span>
                                    </div>
                                </div>

                                {/* Conversion Info */}
                                {rate && (
                                    <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} text-sm`}>
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                                            <ArrowRightLeft className="w-4 h-4" />
                                            <span>Taxa de conversão</span>
                                        </div>
                                        <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                                            <strong>{rate.rate} Zions</strong> = <strong>R$ 1,00</strong>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Mín: {rate.minZions.toLocaleString()} Zions (R$ {rate.minBRL.toFixed(2)}) • 
                                            Máx: {rate.maxZions.toLocaleString()} Zions (R$ {rate.maxBRL.toFixed(2)})
                                        </p>
                                    </div>
                                )}

                                {/* Pending Withdrawal Warning */}
                                {pendingWithdrawal && (
                                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Saque em andamento</p>
                                            <p className="text-xs text-yellow-400/70">
                                                Você já tem um saque de {pendingWithdrawal.amountZions.toLocaleString()} Zions ({statusConfig[pendingWithdrawal.status].label.toLowerCase()}).
                                                Aguarde a conclusão para solicitar outro.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!pendingWithdrawal && (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Amount Input */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                                Quantidade de Zions
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">💎</span>
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={e => setAmount(e.target.value)}
                                                    placeholder="1000"
                                                    min={rate?.minZions}
                                                    max={Math.min(rate?.maxZions || 0, user?.zions || 0)}
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${borderAccent} ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-white/5 text-white'} focus:outline-none focus:ring-2 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-yellow-500'}`}
                                                />
                                            </div>
                                            {amountZions > 0 && (
                                                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    Você receberá: <span className="text-green-400 font-medium">R$ {amountBRL.toFixed(2)}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* PIX Key Type */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                                Tipo de Chave PIX
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {pixKeyTypes.map(type => (
                                                    <button
                                                        key={type.value}
                                                        type="button"
                                                        onClick={() => setPixKeyType(type.value)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                                                            ${pixKeyType === type.value 
                                                                ? `${borderAccent} ${bgAccent} ${textAccent}` 
                                                                : `border-white/10 text-gray-400 hover:border-white/20`
                                                            }`}
                                                    >
                                                        {type.icon}
                                                        <span className="text-sm">{type.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* PIX Key Input */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                                Chave PIX
                                            </label>
                                            <input
                                                type="text"
                                                value={pixKey}
                                                onChange={e => setPixKey(e.target.value)}
                                                placeholder={
                                                    pixKeyType === 'CPF' ? '000.000.000-00' :
                                                    pixKeyType === 'EMAIL' ? 'seu@email.com' :
                                                    pixKeyType === 'PHONE' ? '+55 11 99999-9999' :
                                                    'Chave aleatória'
                                                }
                                                className={`w-full px-4 py-3 rounded-xl border ${borderAccent} ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-white/5 text-white'} focus:outline-none focus:ring-2 ${isMGT ? 'focus:ring-emerald-500' : 'focus:ring-yellow-500'}`}
                                            />
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                {error}
                                            </div>
                                        )}

                                        {/* Success */}
                                        {success && (
                                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                                                <Check className="w-5 h-5" />
                                                Solicitação enviada com sucesso!
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={!canSubmit || submitting}
                                            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                                                ${canSubmit && !submitting
                                                    ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white hover:opacity-90`
                                                    : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {submitting ? (
                                                <Loader size="sm" />
                                            ) : (
                                                <>
                                                    <Wallet className="w-5 h-5" />
                                                    Solicitar Saque
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            /* History Tab */
                            <div className="space-y-3">
                                {withdrawals.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Nenhum saque realizado</p>
                                    </div>
                                ) : (
                                    withdrawals.map(w => (
                                        <div 
                                            key={w.id}
                                            className={`p-4 rounded-xl border ${borderAccent} ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg">💎</span>
                                                        <span className={`font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                            {w.amountZions.toLocaleString()} Zions
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-green-400">
                                                        R$ {w.amountBRL.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        PIX: {w.pixKey}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(w.createdAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[w.status].color}`}>
                                                        {statusConfig[w.status].icon}
                                                        {statusConfig[w.status].label}
                                                    </div>
                                                    {w.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleCancel(w.id)}
                                                            className="block mt-2 text-xs text-red-400 hover:text-red-300"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {w.rejectionNote && (
                                                <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-400">
                                                    Motivo: {w.rejectionNote}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
