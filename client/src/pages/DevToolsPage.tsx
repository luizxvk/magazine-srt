
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import { Terminal, Activity, Cpu, Server, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface LogEntry {
    timestamp: string;
    level: 'info' | 'error' | 'warn' | 'debug';
    message: string;
}

interface SystemStats {
    uptime: number;
    memory: {
        rss: string;
        heapTotal: string;
        heapUsed: string;
    };
    platform: string;
    nodeVersion: string;
    pid: number;
}

export default function DevToolsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const logsEndRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const [logsRes, statsRes] = await Promise.all([
                api.get('/devtools/logs?limit=200'),
                api.get('/devtools/stats')
            ]);
            setLogs(logsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch devtools data', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            if (autoRefresh) fetchData();
        }, 2000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    useEffect(() => {
        if (activeTab === 'logs' && autoRefresh) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, activeTab, autoRefresh]);

    if (user?.role !== 'ADMIN') {
        return <div className="min-h-screen flex items-center justify-center text-white">Acesso Negado</div>;
    }

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-500';
            case 'warn': return 'text-yellow-500';
            case 'debug': return 'text-blue-400';
            default: return 'text-green-400';
        }
    };

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative overflow-hidden">
            <LuxuriousBackground />
            <Header />

            <div className="relative z-10 pt-32 pb-20 px-4 max-w-7xl mx-auto h-screen flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                            <Terminal className="w-8 h-8 text-gold-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif text-white">DevTools Hub</h1>
                            <p className="text-gray-400 text-sm">Monitoramento e Logs do Sistema</p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Terminal className="w-4 h-4" /> Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'stats' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Activity className="w-4 h-4" /> Stats
                        </button>
                    </div>
                </div>

                <div className="flex-1 glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col relative shadow-2xl shadow-black/50">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                    {autoRefresh ? 'Ao Vivo' : 'Pausado'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`p-2 rounded-lg border transition-colors ${autoRefresh ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                title={autoRefresh ? 'Pausar' : 'Retomar'}
                            >
                                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
                            </button>
                            <button
                                onClick={fetchData}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                                title="Atualizar Agora"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/40 font-mono text-sm">
                        {activeTab === 'logs' ? (
                            <div className="space-y-1">
                                {logs.map((log, index) => (
                                    <div key={index} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors group">
                                        <span className="text-gray-500 shrink-0 text-xs select-none w-32">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className={`uppercase font-bold text-xs w-16 shrink-0 ${getLevelColor(log.level)}`}>
                                            [{log.level}]
                                        </span>
                                        <span className="text-gray-300 break-all group-hover:text-white transition-colors">
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                                {stats && (
                                    <>
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-medium text-white">Uptime</h3>
                                            </div>
                                            <p className="text-3xl font-bold text-white mb-1">{formatUptime(stats.uptime)}</p>
                                            <p className="text-xs text-gray-400">Tempo de atividade do servidor</p>
                                        </div>

                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                                    <Cpu className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-medium text-white">Memória</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">RSS</span>
                                                    <span className="text-white font-bold">{stats.memory.rss}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Heap Total</span>
                                                    <span className="text-white font-bold">{stats.memory.heapTotal}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Heap Used</span>
                                                    <span className="text-white font-bold">{stats.memory.heapUsed}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                                    <Server className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-medium text-white">Ambiente</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Plataforma</span>
                                                    <span className="text-white font-bold capitalize">{stats.platform}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Node Version</span>
                                                    <span className="text-white font-bold">{stats.nodeVersion}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">PID</span>
                                                    <span className="text-white font-bold">{stats.pid}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
