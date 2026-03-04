import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Ban, Eye, RefreshCw, ChevronLeft, ChevronRight, Filter, Activity, Clock } from 'lucide-react';
import api from '../services/api';

interface ModerationLog {
    id: string;
    userId: string;
    postId?: string;
    commentId?: string;
    type: 'TEXT' | 'IMAGE';
    reason: string;
    action: 'BLOCKED' | 'FLAGGED' | 'WARNED';
    score: number;
    details?: {
        textScores?: {
            toxicity: number;
            severeToxicity: number;
            identityAttack: number;
            insult: number;
            profanity: number;
            threat: number;
        };
        textCategories?: string[];
        imageCategories?: string[];
    };
    createdAt: string;
}

interface ModerationStats {
    totalBlocked: number;
    totalFlagged: number;
    last24h: number;
    byType: Record<string, number>;
}

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    BLOCKED: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', icon: <Ban className="w-3.5 h-3.5" /> },
    FLAGGED: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    WARNED: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', icon: <Eye className="w-3.5 h-3.5" /> },
};

export default function AdminModerationPanel() {
    const [logs, setLogs] = useState<ModerationLog[]>([]);
    const [stats, setStats] = useState<ModerationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterType, setFilterType] = useState<'all' | 'TEXT' | 'IMAGE'>('all');
    const [filterAction, setFilterAction] = useState<'all' | 'BLOCKED' | 'FLAGGED'>('all');

    useEffect(() => {
        fetchData();
    }, [page, filterType, filterAction]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 15 };
            if (filterType !== 'all') params.type = filterType;
            if (filterAction !== 'all') params.action = filterAction;

            const [logsRes, statsRes] = await Promise.all([
                api.get('/moderation/logs', { params }),
                api.get('/moderation/stats'),
            ]);

            setLogs(logsRes.data.logs || []);
            setTotalPages(logsRes.data.pages || 1);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch moderation data:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-red-400';
        if (score >= 0.5) return 'text-yellow-400';
        return 'text-green-400';
    };

    const getScoreBar = (score: number) => {
        const pct = Math.round(score * 100);
        const color = score >= 0.8 ? 'bg-red-500' : score >= 0.5 ? 'bg-yellow-500' : 'bg-green-500';
        return (
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-xs font-mono ${getScoreColor(score)}`}>{pct}%</span>
            </div>
        );
    };

    return (
        <div className="admin-card space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" /> Moderação
                </h2>
                <button
                    onClick={() => { setPage(1); fetchData(); }}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Ban className="w-4 h-4 text-red-400" />
                            <span className="text-xs text-gray-400">Bloqueados</span>
                        </div>
                        <p className="text-2xl font-bold text-red-400">{stats.totalBlocked}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-gray-400">Flagged</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-400">{stats.totalFlagged}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-gray-400">Últimas 24h</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">{stats.last24h}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-gray-400">Por Tipo</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                            {Object.entries(stats.byType).map(([type, count]) => `${type}: ${count}`).join(' | ') || 'Nenhum'}
                        </p>
                    </div>
                </div>
            )}

            {/* Perspective API Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">Google Perspective API</span>
                <span className="text-gray-400">— Moderação automática ativa em posts, comentários, mensagens, perfis e catálogo</span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value as any); setPage(1); }}
                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none"
                >
                    <option value="all">Todos os tipos</option>
                    <option value="TEXT">Texto</option>
                    <option value="IMAGE">Imagem</option>
                </select>
                <select
                    value={filterAction}
                    onChange={e => { setFilterAction(e.target.value as any); setPage(1); }}
                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 outline-none"
                >
                    <option value="all">Todas as ações</option>
                    <option value="BLOCKED">Bloqueados</option>
                    <option value="FLAGGED">Flagged</option>
                </select>
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum registro de moderação encontrado</p>
                    <p className="text-xs mt-1">Isso é bom! A comunidade está se comportando bem.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {logs.map(log => {
                        const actionStyle = ACTION_STYLES[log.action] || ACTION_STYLES.FLAGGED;
                        return (
                            <div
                                key={log.id}
                                className="p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors space-y-3"
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}>
                                            {actionStyle.icon}
                                            {log.action}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs border ${
                                            log.type === 'IMAGE' 
                                                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' 
                                                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                        }`}>
                                            {log.type}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                                </div>

                                {/* Reason */}
                                <p className="text-sm text-gray-300">{log.reason}</p>

                                {/* Score bars */}
                                {log.details?.textScores && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-500 uppercase">Score Geral</span>
                                        {getScoreBar(log.score)}
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Usuário: <span className="text-gray-400 font-mono">{log.userId.slice(0, 8)}…</span></span>
                                    {log.postId && <span>Post: <span className="text-gray-400 font-mono">{log.postId.slice(0, 8)}…</span></span>}
                                    {log.commentId && <span>Comentário: <span className="text-gray-400 font-mono">{log.commentId.slice(0, 8)}…</span></span>}
                                    <span className={`font-medium ${getScoreColor(log.score)}`}>Score: {Math.round(log.score * 100)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-400">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
