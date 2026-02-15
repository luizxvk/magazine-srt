import { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Pause, Play, Trash2, AlertTriangle, Coins, Send, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Header from '../../components/Header';
import LuxuriousBackground from '../../components/LuxuriousBackground';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

interface Log {
    id: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    source: 'FRONTEND' | 'BACKEND';
    message: string;
    timestamp: string;
    metadata?: any;
}

export default function DevToolsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [filterSource, setFilterSource] = useState<'ALL' | 'FRONTEND' | 'BACKEND'>('ALL');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestReason, setRequestReason] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError, user } = useAuth();

    const handleSubmitRequest = async () => {
        if (!requestReason.trim()) {
            showError('Por favor, informe o motivo da solicitação');
            return;
        }
        setSubmittingRequest(true);
        try {
            await api.post('/rovex/action-request', {
                action: 'RESET_ZIONS',
                reason: requestReason,
                requestedBy: user?.name || user?.email
            });
            setRequestSent(true);
            showSuccess('Solicitação enviada para aprovação da Rovex!');
            setTimeout(() => {
                setShowRequestModal(false);
                setRequestSent(false);
                setRequestReason('');
            }, 2000);
        } catch (error: any) {
            showError(error?.response?.data?.error || 'Erro ao enviar solicitação');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await api.get('/logs', {
                params: {
                    limit: 100,
                    source: filterSource !== 'ALL' ? filterSource : undefined
                }
            });
            // Reverse to show oldest at top if we want console style, but usually newest at bottom
            // API returns newest first (desc). Let's reverse for display (oldest -> newest)
            setLogs(response.data.reverse());
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(() => {
            if (autoRefresh) fetchLogs();
        }, 2000);
        return () => clearInterval(interval);
    }, [autoRefresh, filterSource]);

    useEffect(() => {
        if (autoRefresh) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoRefresh]);

    const handleClearLogs = async () => {
        if (!confirm('Tem certeza que deseja limpar todos os logs?')) return;
        try {
            await api.delete('/logs');
            setLogs([]);
        } catch (error) {
            console.error('Failed to clear logs', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans relative">
            <LuxuriousBackground />
            <Header />
            <div className="p-8 pt-32 relative z-10">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Terminal className="w-6 h-6 text-gold-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white font-serif">DevTools Hub</h1>
                                <p className="text-gray-400 text-sm">Monitoramento e Logs do Sistema</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                                <button
                                    onClick={() => setFilterSource('ALL')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterSource === 'ALL' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    TODOS
                                </button>
                                <button
                                    onClick={() => setFilterSource('BACKEND')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterSource === 'BACKEND' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    BACKEND
                                </button>
                                <button
                                    onClick={() => setFilterSource('FRONTEND')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterSource === 'FRONTEND' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    FRONTEND
                                </button>
                            </div>

                            <button
                                onClick={handleClearLogs}
                                className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                title="Limpar Logs"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone - Admin Actions - Requires Rovex Approval */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-bold text-amber-400">Ações Administrativas</h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                REQUER APROVAÇÃO ROVEX
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => setShowRequestModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 hover:bg-amber-500/30 transition-all"
                            >
                                <Coins className="w-4 h-4" />
                                Solicitar Reset de Zions
                            </button>
                        </div>
                        <p className="text-amber-400/60 text-xs mt-3">
                            ⚠️ Ações críticas requerem aprovação da equipe Rovex por segurança.
                        </p>
                    </div>

                    {/* Console Window */}
                    <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                        {/* Console Header */}
                        <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
                                    {autoRefresh ? 'Ao Vivo' : 'Pausado'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setAutoRefresh(!autoRefresh)}
                                    aria-label={autoRefresh ? 'Pausar atualização' : 'Retomar atualização'}
                                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={fetchLogs}
                                    aria-label="Atualizar logs"
                                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Logs Area */}
                        <div className="h-[600px] overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {loading && logs.length === 0 ? (
                                <div className="flex justify-center py-20">
                                    <Loader size="md" />
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center text-gray-500 py-20">Nenhum log registrado.</div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors group">
                                        <span className="text-gray-600 min-w-[80px]">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className={`font-bold min-w-[60px] ${log.level === 'ERROR' ? 'text-red-500' :
                                            log.level === 'WARN' ? 'text-yellow-500' :
                                                'text-green-500'
                                            }`}>
                                            [{log.level}]
                                        </span>
                                        <span className={`font-bold min-w-[80px] ${log.source === 'BACKEND' ? 'text-purple-400' : 'text-blue-400'
                                            }`}>
                                            {log.source}
                                        </span>
                                        <span className="text-gray-300 break-all">
                                            {log.message}
                                        </span>
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Rovex Request Modal */}
            <AnimatePresence>
                {showRequestModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !submittingRequest && setShowRequestModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md rounded-2xl p-6 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10"
                        >
                            {requestSent ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Solicitação Enviada!</h3>
                                    <p className="text-gray-400 text-sm">A equipe Rovex analisará sua solicitação.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                            <Send className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Solicitar Reset de Zions</h3>
                                            <p className="text-xs text-gray-400">Requer aprovação da Rovex</p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-blue-400 font-medium">Como funciona?</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Sua solicitação será enviada para a equipe Rovex. Após análise, você receberá uma notificação com o status da aprovação.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Motivo da solicitação *
                                        </label>
                                        <textarea
                                            value={requestReason}
                                            onChange={e => setRequestReason(e.target.value)}
                                            placeholder="Explique por que precisa resetar os Zions de todos os usuários..."
                                            className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowRequestModal(false)}
                                            disabled={submittingRequest}
                                            className="flex-1 py-3 rounded-xl text-sm font-medium border border-white/10 text-gray-400 hover:bg-white/5 transition-colors disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSubmitRequest}
                                            disabled={submittingRequest || !requestReason.trim()}
                                            className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {submittingRequest ? (
                                                <>
                                                    <Loader size="sm" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Enviar Solicitação
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

    );
}
