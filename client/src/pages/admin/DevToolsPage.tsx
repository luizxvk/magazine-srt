import { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Pause, Play, Trash2, AlertTriangle, Coins } from 'lucide-react';
import api from '../../services/api';
import Header from '../../components/Header';
import LuxuriousBackground from '../../components/LuxuriousBackground';
import { useAuth } from '../../context/AuthContext';

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
    const [resettingZions, setResettingZions] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError } = useAuth();

    const handleResetZions = async () => {
        if (!confirm('⚠️ ATENÇÃO: Isso irá ZERAR todos os Zions de TODOS os usuários (exceto admins).\n\nEssa ação é IRREVERSÍVEL!\n\nDeseja continuar?')) {
            return;
        }
        
        setResettingZions(true);
        try {
            const response = await api.post('/devtools/reset-zions');
            showSuccess(`✅ ${response.data.message}`);
            console.log('[DevTools] Reset Zions result:', response.data);
        } catch (error) {
            console.error('[DevTools] Failed to reset zions:', error);
            showError('Erro ao resetar Zions');
        } finally {
            setResettingZions(false);
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

                    {/* Danger Zone - Admin Actions */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <h2 className="text-lg font-bold text-red-400">Zona de Perigo</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleResetZions}
                                disabled={resettingZions}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Coins className="w-4 h-4" />
                                {resettingZions ? 'Resetando...' : 'Reset Zions (Exceto Admins)'}
                            </button>
                        </div>
                        <p className="text-red-400/60 text-xs mt-3">
                            ⚠️ Essas ações são irreversíveis. Use com cuidado.
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
                                <div className="text-center text-gray-500 py-20">Carregando logs...</div>
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
        </div>

    );
}
