import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Check, X, Loader2, Clock, Ban, DollarSign, Search, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
    user: {
        id: string;
        name: string;
        displayName?: string;
        email: string;
        avatarUrl?: string;
    };
}

interface Stats {
    status: string;
    _count: number;
    _sum: { amountBRL: number };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'Pendente', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
    APPROVED: { label: 'Aprovado', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    PROCESSING: { label: 'Processando', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    COMPLETED: { label: 'Concluído', color: 'text-green-400', bgColor: 'bg-green-500/10' },
    REJECTED: { label: 'Rejeitado', color: 'text-red-400', bgColor: 'bg-red-500/10' }
};

interface AdminWithdrawalsProps {
    onClose: () => void;
}

export default function AdminWithdrawals({ onClose }: AdminWithdrawalsProps) {
    const { theme } = useAuth();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [stats, setStats] = useState<Stats[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rejectionNote, setRejectionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchWithdrawals();
    }, [filter]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (filter) params.status = filter;
            
            const response = await api.get('/withdrawals/admin/all', { params });
            setWithdrawals(response.data.withdrawals);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setSubmitting(true);
        try {
            await api.post(`/withdrawals/admin/${id}/approve`);
            fetchWithdrawals();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao aprovar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleProcess = async (id: string) => {
        setSubmitting(true);
        try {
            await api.post(`/withdrawals/admin/${id}/process`);
            fetchWithdrawals();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao processar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async (id: string) => {
        setSubmitting(true);
        try {
            await api.post(`/withdrawals/admin/${id}/complete`);
            fetchWithdrawals();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao completar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await api.post(`/withdrawals/admin/${selectedId}/reject`, { rejectionNote });
            setShowRejectModal(false);
            setSelectedId(null);
            setRejectionNote('');
            fetchWithdrawals();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao rejeitar');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            w.user.name.toLowerCase().includes(searchLower) ||
            w.user.email.toLowerCase().includes(searchLower) ||
            w.pixKey.toLowerCase().includes(searchLower)
        );
    });

    const pendingTotal = stats.find(s => s.status === 'PENDING')?._sum?.amountBRL || 0;
    const completedTotal = stats.find(s => s.status === 'COMPLETED')?._sum?.amountBRL || 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        Solicitações de Saque
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Gerencie os saques de Zions para PIX
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors"
                >
                    Fechar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(statusConfig).map(([status, config]) => {
                    const stat = stats.find(s => s.status === status);
                    return (
                        <div 
                            key={status}
                            onClick={() => setFilter(filter === status ? '' : status)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                filter === status 
                                    ? `${config.bgColor} border-current ${config.color}` 
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                            <p className={`text-sm ${filter === status ? config.color : 'text-gray-400'}`}>
                                {config.label}
                            </p>
                            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                {stat?._count || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                                R$ {(stat?._sum?.amountBRL || 0).toFixed(2)}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-yellow-50' : 'bg-yellow-500/10'} border border-yellow-500/30`}>
                    <p className="text-sm text-yellow-400">Pendente Total</p>
                    <p className="text-2xl font-bold text-yellow-400">R$ {pendingTotal.toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-green-50' : 'bg-green-500/10'} border border-green-500/30`}>
                    <p className="text-sm text-green-400">Pago Total</p>
                    <p className="text-2xl font-bold text-green-400">R$ {completedTotal.toFixed(2)}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nome, email ou chave PIX..."
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 ${theme === 'light' ? 'bg-white' : 'bg-white/5'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
            </div>

            {/* Withdrawals List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : filteredWithdrawals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma solicitação encontrada</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredWithdrawals.map(w => (
                        <div
                            key={w.id}
                            className={`p-4 rounded-xl border border-white/10 ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* User Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                        {w.user.avatarUrl ? (
                                            <img src={w.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                            {w.user.displayName || w.user.name}
                                        </p>
                                        <p className="text-xs text-gray-400">{w.user.email}</p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-center sm:text-right">
                                    <p className="text-sm text-yellow-400">💎 {w.amountZions.toLocaleString()}</p>
                                    <p className="text-lg font-bold text-green-400">R$ {w.amountBRL.toFixed(2)}</p>
                                </div>

                                {/* PIX */}
                                <div className="text-center sm:text-right">
                                    <p className="text-xs text-gray-400">{w.pixKeyType}</p>
                                    <p className={`text-sm font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        {w.pixKey}
                                    </p>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[w.status].bgColor} ${statusConfig[w.status].color}`}>
                                        {statusConfig[w.status].label}
                                    </span>
                                    
                                    {w.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(w.id)}
                                                disabled={submitting}
                                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                                title="Aprovar"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedId(w.id); setShowRejectModal(true); }}
                                                disabled={submitting}
                                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                title="Rejeitar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                    {w.status === 'APPROVED' && (
                                        <>
                                            <button
                                                onClick={() => handleProcess(w.id)}
                                                disabled={submitting}
                                                className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                                                title="Marcar como Processando"
                                            >
                                                <Clock className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleComplete(w.id)}
                                                disabled={submitting}
                                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                title="Marcar como Pago"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                    {w.status === 'PROCESSING' && (
                                        <button
                                            onClick={() => handleComplete(w.id)}
                                            disabled={submitting}
                                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                            title="Marcar como Pago"
                                        >
                                            <DollarSign className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Date and Rejection Note */}
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                                <span>
                                    {new Date(w.createdAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {w.rejectionNote && (
                                    <span className="text-red-400">Motivo: {w.rejectionNote}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowRejectModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-md rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-zinc-900'} border border-white/10 shadow-2xl p-6`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-red-500/10">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Rejeitar Saque
                                </h3>
                            </div>

                            <p className="text-sm text-gray-400 mb-4">
                                O usuário será reembolsado automaticamente. Informe o motivo da rejeição:
                            </p>

                            <textarea
                                value={rejectionNote}
                                onChange={e => setRejectionNote(e.target.value)}
                                placeholder="Motivo da rejeição..."
                                rows={3}
                                className={`w-full px-4 py-3 rounded-lg border border-white/10 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4`}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={submitting}
                                    className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                    Rejeitar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
