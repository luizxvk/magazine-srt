import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import Header from './Header';
import LuxuriousBackground from './LuxuriousBackground';
import BracketViewer from './BracketViewer';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Trophy, Users, Swords, Calendar, Coins,
    Shield, Crown, UserPlus, BarChart3,
} from 'lucide-react';

interface Team {
    id: string;
    name: string;
    captainId: string;
    seed?: number;
    members: { id: string; userId: string }[];
}

interface Match {
    id: string;
    round: number;
    position: number;
    team1?: { id: string; name: string; seed?: number };
    team2?: { id: string; name: string; seed?: number };
    score1?: number;
    score2?: number;
    winner?: { id: string; name: string };
    status: string;
}

interface TournamentFull {
    id: string;
    title: string;
    description?: string;
    game?: string;
    imageUrl?: string;
    format: string;
    teamSize: number;
    maxTeams: number;
    prizePool: number;
    rules?: string;
    status: string;
    startDate?: string;
    endDate?: string;
    createdBy: string;
    teams: Team[];
    matches: Match[];
    _count: { teams: number; matches: number };
}

interface Standing {
    teamId: string;
    teamName: string;
    seed?: number;
    wins: number;
    losses: number;
    highestRound: number;
    isEliminated: boolean;
}

interface TournamentDetailProps {
    tournamentId: string;
    onBack: () => void;
}

type Tab = 'brackets' | 'teams' | 'leaderboard' | 'rules';

const FORMAT_LABELS: Record<string, string> = {
    SINGLE_ELIMINATION: 'Eliminação Simples',
    DOUBLE_ELIMINATION: 'Eliminação Dupla',
    ROUND_ROBIN: 'Todos contra Todos',
    FREE_FOR_ALL: 'Livre',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    REGISTRATION: { label: 'Inscrições Abertas', color: 'text-green-400' },
    IN_PROGRESS: { label: 'Em Andamento', color: 'text-yellow-400' },
    COMPLETED: { label: 'Finalizado', color: 'text-gray-400' },
    CANCELLED: { label: 'Cancelado', color: 'text-red-400' },
};

export default function TournamentDetail({ tournamentId, onBack }: TournamentDetailProps) {
    const { user } = useAuth();
    const { formatCurrency } = useCommunity();
    const isMGT = user?.membershipType === 'MGT';

    const [tournament, setTournament] = useState<TournamentFull | null>(null);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('brackets');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [registering, setRegistering] = useState(false);
    const [showScoreModal, setShowScoreModal] = useState<string | null>(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);

    useEffect(() => {
        fetchTournament();
    }, [tournamentId]);

    const fetchTournament = async () => {
        try {
            setLoading(true);
            const [tournamentRes, leaderboardRes] = await Promise.all([
                api.get(`/tournaments/${tournamentId}`),
                api.get(`/tournaments/${tournamentId}/leaderboard`).catch(() => ({ data: [] })),
            ]);
            setTournament(tournamentRes.data);
            setStandings(leaderboardRes.data);
        } catch (error) {
            console.error('Error fetching tournament:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!teamName.trim()) return;
        try {
            setRegistering(true);
            await api.post(`/tournaments/${tournamentId}/register`, {
                teamName: teamName.trim(),
                memberUserIds: [],
            });
            setShowRegisterModal(false);
            setTeamName('');
            fetchTournament();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao registrar');
        } finally {
            setRegistering(false);
        }
    };

    const handleUnregister = async () => {
        if (!confirm('Tem certeza que deseja sair do torneio?')) return;
        try {
            await api.delete(`/tournaments/${tournamentId}/unregister`);
            fetchTournament();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao sair');
        }
    };

    const handleReportScore = async () => {
        if (!showScoreModal) return;
        try {
            await api.post(`/tournaments/matches/${showScoreModal}/report`, {
                score1,
                score2,
            });
            setShowScoreModal(null);
            setScore1(0);
            setScore2(0);
            fetchTournament();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao reportar resultado');
        }
    };

    const myTeam = tournament?.teams.find(
        t => t.captainId === user?.id || t.members.some(m => m.userId === user?.id)
    );
    const canRegister = tournament?.status === 'REGISTRATION' && !myTeam;
    const canUnregister = tournament?.status === 'REGISTRATION' && myTeam && myTeam.captainId === user?.id;
    const statusInfo = STATUS_LABELS[tournament?.status || ''] || STATUS_LABELS.REGISTRATION;

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'brackets', label: 'Brackets', icon: Swords },
        { key: 'teams', label: 'Times', icon: Users },
        { key: 'leaderboard', label: 'Ranking', icon: BarChart3 },
        { key: 'rules', label: 'Regras', icon: Shield },
    ];

    if (loading || !tournament) {
        return (
            <div className="min-h-screen">
                <LuxuriousBackground />
                <Header />
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                className={`w-3 h-3 rounded-full ${isMGT ? 'bg-tier-std-400' : 'bg-gold-400'}`}
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <LuxuriousBackground />
            <Header />

            <div className="max-w-7xl mx-auto px-4 pt-32 pb-8">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar aos Torneios
                </button>

                {/* Tournament Header */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden mb-6">
                    {tournament.imageUrl && (
                        <div className="h-48 overflow-hidden">
                            <img
                                src={tournament.imageUrl}
                                alt={tournament.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{tournament.title}</h1>
                                <div className="flex items-center gap-4 flex-wrap text-sm">
                                    <span className={statusInfo.color}>{statusInfo.label}</span>
                                    {tournament.game && (
                                        <span className="text-gray-400">{tournament.game}</span>
                                    )}
                                    <span className="text-gray-500">
                                        {FORMAT_LABELS[tournament.format]}
                                    </span>
                                    <span className="text-gray-500 flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {tournament._count.teams}/{tournament.maxTeams} times
                                    </span>
                                    {tournament.teamSize > 1 && (
                                        <span className="bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
                                            {tournament.teamSize}v{tournament.teamSize}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {tournament.prizePool > 0 && (
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                                        isMGT ? 'bg-tier-std-500/10 border border-tier-std-500/20' : 'bg-gold-500/10 border border-gold-500/20'
                                    }`}>
                                        <Coins className={`w-5 h-5 ${isMGT ? 'text-tier-std-400' : 'text-gold-400'}`} />
                                        <div>
                                            <div className={`text-lg font-bold ${isMGT ? 'text-tier-std-400' : 'text-gold-400'}`}>
                                                {formatCurrency(tournament.prizePool)}
                                            </div>
                                            <div className="text-xs text-gray-500">Premiação</div>
                                        </div>
                                    </div>
                                )}

                                {canRegister && (
                                    <button
                                        onClick={() => setShowRegisterModal(true)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105 ${
                                            isMGT
                                                ? 'bg-tier-std-500 text-black hover:bg-tier-std-400'
                                                : 'bg-gold-500 text-black hover:bg-gold-400'
                                        }`}
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        Inscrever-se
                                    </button>
                                )}
                                {canUnregister && (
                                    <button
                                        onClick={handleUnregister}
                                        className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                                    >
                                        Sair do Torneio
                                    </button>
                                )}
                            </div>
                        </div>

                        {tournament.description && (
                            <p className="text-gray-400 mt-4">{tournament.description}</p>
                        )}

                        {tournament.startDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                                <Calendar className="w-4 h-4" />
                                Início: {new Date(tournament.startDate).toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                                    active
                                        ? isMGT
                                            ? 'bg-tier-std-500/20 text-tier-std-400'
                                            : 'bg-gold-500/20 text-gold-400'
                                        : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'brackets' && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <BracketViewer
                                    matches={tournament.matches}
                                    onReportScore={(matchId) => {
                                        setShowScoreModal(matchId);
                                        setScore1(0);
                                        setScore2(0);
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === 'teams' && (
                            <div className="space-y-3">
                                {tournament.teams.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        Nenhum time inscrito ainda
                                    </div>
                                ) : (
                                    tournament.teams.map((team, index) => (
                                        <div
                                            key={team.id}
                                            className={`bg-white/5 border rounded-xl p-4 flex items-center justify-between ${
                                                myTeam?.id === team.id
                                                    ? isMGT
                                                        ? 'border-tier-std-500/30 bg-tier-std-500/5'
                                                        : 'border-gold-500/30 bg-gold-500/5'
                                                    : 'border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-600 font-mono text-sm w-6">
                                                    #{team.seed || index + 1}
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold">{team.name}</span>
                                                        {team.captainId === user?.id && (
                                                            <Crown className="w-4 h-4 text-gold-400" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {team.members.length} membro(s)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'leaderboard' && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                {standings.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        O ranking será atualizado quando o torneio começar
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
                                                <th className="text-left px-4 py-3 text-gray-500 font-medium">Time</th>
                                                <th className="text-center px-4 py-3 text-gray-500 font-medium">V</th>
                                                <th className="text-center px-4 py-3 text-gray-500 font-medium">D</th>
                                                <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standings.map((s, i) => (
                                                <tr
                                                    key={s.teamId}
                                                    className={`border-b border-white/5 ${
                                                        i === 0 && tournament.status === 'COMPLETED'
                                                            ? isMGT ? 'bg-tier-std-500/5' : 'bg-gold-500/5'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="px-4 py-3 text-gray-400 font-mono">
                                                        {i === 0 && tournament.status === 'COMPLETED' ? (
                                                            <Trophy className={`w-4 h-4 ${isMGT ? 'text-tier-std-400' : 'text-gold-400'}`} />
                                                        ) : (
                                                            i + 1
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 font-medium ${
                                                        s.isEliminated ? 'text-gray-600 line-through' : 'text-white'
                                                    }`}>
                                                        {s.teamName}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-green-400">{s.wins}</td>
                                                    <td className="px-4 py-3 text-center text-red-400">{s.losses}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {s.isEliminated ? (
                                                            <span className="text-xs text-red-400/60">Eliminado</span>
                                                        ) : (
                                                            <span className="text-xs text-green-400">Ativo</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                {tournament.rules ? (
                                    <div className="prose prose-invert max-w-none">
                                        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans leading-relaxed">
                                            {tournament.rules}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        Sem regras definidas para este torneio
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Register Modal */}
                <AnimatePresence>
                    {showRegisterModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowRegisterModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Inscrever no Torneio</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">
                                            {tournament.teamSize > 1 ? 'Nome do Time' : 'Nickname'}
                                        </label>
                                        <input
                                            type="text"
                                            value={teamName}
                                            onChange={e => setTeamName(e.target.value)}
                                            placeholder={tournament.teamSize > 1 ? 'Ex: Team Alpha' : 'Seu nickname'}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-gold-500/50 focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowRegisterModal(false)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleRegister}
                                            disabled={!teamName.trim() || registering}
                                            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                                                isMGT
                                                    ? 'bg-tier-std-500 text-black hover:bg-tier-std-400'
                                                    : 'bg-gold-500 text-black hover:bg-gold-400'
                                            }`}
                                        >
                                            {registering ? 'Inscrevendo...' : 'Confirmar'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Score Report Modal */}
                <AnimatePresence>
                    {showScoreModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowScoreModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Reportar Resultado</h3>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex-1 text-center">
                                        <label className="text-xs text-gray-500 block mb-2">Time 1</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={score1}
                                            onChange={e => setScore1(parseInt(e.target.value) || 0)}
                                            className="w-full text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl py-3 text-white focus:outline-none focus:border-gold-500/50"
                                        />
                                    </div>
                                    <span className="text-gray-600 text-xl font-bold mt-5">×</span>
                                    <div className="flex-1 text-center">
                                        <label className="text-xs text-gray-500 block mb-2">Time 2</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={score2}
                                            onChange={e => setScore2(parseInt(e.target.value) || 0)}
                                            className="w-full text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl py-3 text-white focus:outline-none focus:border-gold-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowScoreModal(null)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleReportScore}
                                        disabled={score1 === score2}
                                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                                            isMGT
                                                ? 'bg-tier-std-500 text-black hover:bg-tier-std-400'
                                                : 'bg-gold-500 text-black hover:bg-gold-400'
                                        }`}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                                {score1 === score2 && score1 > 0 && (
                                    <p className="text-xs text-red-400 text-center mt-2">
                                        Empates não são permitidos
                                    </p>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
