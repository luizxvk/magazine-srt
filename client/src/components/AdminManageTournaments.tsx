import { useState, useEffect } from 'react';
import { Trophy, Play, Ban, ChevronDown, Users, Calendar, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import { useCommunity } from '../context/CommunityContext';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';

interface Tournament {
    id: string;
    title: string;
    game?: string;
    format: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    teamSize: number;
    maxTeams: number;
    prizePool: number;
    startDate?: string;
    imageUrl?: string;
    _count?: {
        teams: number;
    };
}

interface AdminManageTournamentsProps {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminManageTournaments({ showToast }: AdminManageTournamentsProps) {
    const { user, theme } = useAuth();
    const { getAccentColor } = useTierColors();
    const { config, isStdTier } = useCommunity();
    const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;

    const [isOpen, setIsOpen] = useState(false);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(false);
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; tournament: Tournament | null }>({ isOpen: false, tournament: null });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const isDark = theme !== 'light';
    const accent = getAccentColor(isMGT);
    const accentColor = config.accentColor || accent;
    const cardBg = isDark ? 'bg-white/5' : 'bg-gray-50';
    const textMain = isDark ? 'text-white' : 'text-gray-900';
    const textSub = isDark ? 'text-gray-400' : 'text-gray-500';

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tournaments');
            setTournaments(data);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTournaments();
        }
    }, [isOpen]);

    const handleStartTournament = async (tournamentId: string) => {
        setActionLoading(tournamentId);
        try {
            await api.post(`/tournaments/${tournamentId}/start`);
            showToast('Torneio iniciado!', 'success');
            fetchTournaments();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Erro ao iniciar torneio', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelTournament = async () => {
        if (!cancelModal.tournament) return;
        
        setActionLoading(cancelModal.tournament.id);
        try {
            await api.post(`/tournaments/${cancelModal.tournament.id}/cancel`);
            showToast('Torneio cancelado', 'success');
            setCancelModal({ isOpen: false, tournament: null });
            fetchTournaments();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Erro ao cancelar torneio', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: Tournament['status']) => {
        const styles: Record<string, string> = {
            OPEN: 'bg-green-500/20 text-green-400 border-green-500/30',
            IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            COMPLETED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        const labels: Record<string, string> = {
            OPEN: 'Aberto',
            IN_PROGRESS: 'Em Andamento',
            COMPLETED: 'Finalizado',
            CANCELLED: 'Cancelado',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <div className="admin-card">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div 
                                className="p-2.5 rounded-xl"
                                style={{ backgroundColor: `${accentColor}15` }}
                            >
                                <Trophy className="w-5 h-5" style={{ color: accentColor }} />
                            </div>
                            <div className="text-left">
                                <h3 className={`font-semibold ${textMain}`}>Gerenciar Torneios</h3>
                                <p className={`text-xs ${textSub}`}>
                                    {tournaments.length} torneio{tournaments.length !== 1 ? 's' : ''} criado{tournaments.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className={`w-5 h-5 ${textSub}`} />
                        </motion.div>
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 space-y-3">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
                                    </div>
                                ) : tournaments.length === 0 ? (
                                    <div className={`text-center py-8 ${textSub}`}>
                                        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>Nenhum torneio criado</p>
                                    </div>
                                ) : (
                                    tournaments.map(tournament => (
                                        <div
                                            key={tournament.id}
                                            className={`${cardBg} rounded-xl p-4 border border-white/5`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Image */}
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                                                    {tournament.imageUrl ? (
                                                        <img
                                                            src={tournament.imageUrl}
                                                            alt={tournament.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Trophy className="w-6 h-6 opacity-30" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`font-semibold ${textMain} truncate`}>{tournament.title}</h4>
                                                        {getStatusBadge(tournament.status)}
                                                    </div>
                                                    <div className={`flex flex-wrap items-center gap-3 text-xs ${textSub}`}>
                                                        {tournament.game && (
                                                            <span className="flex items-center gap-1">
                                                                <Gamepad2 className="w-3 h-3" />
                                                                {tournament.game}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {tournament._count?.teams || 0}/{tournament.maxTeams}
                                                        </span>
                                                        {tournament.startDate && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(tournament.startDate)}
                                                            </span>
                                                        )}
                                                        {tournament.prizePool > 0 && (
                                                            <span style={{ color: accentColor }}>
                                                                🏆 {tournament.prizePool} Z$
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {tournament.status === 'OPEN' && (
                                                        <button
                                                            onClick={() => handleStartTournament(tournament.id)}
                                                            disabled={actionLoading === tournament.id}
                                                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                                            title="Iniciar Torneio"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(tournament.status === 'OPEN' || tournament.status === 'IN_PROGRESS') && (
                                                        <button
                                                            onClick={() => setCancelModal({ isOpen: true, tournament })}
                                                            disabled={actionLoading === tournament.id}
                                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                            title="Cancelar Torneio"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Cancel Confirmation Modal */}
            <ConfirmModal
                isOpen={cancelModal.isOpen}
                title="Cancelar Torneio"
                message={`Tem certeza que deseja cancelar o torneio "${cancelModal.tournament?.title}"? Esta ação não pode ser desfeita.`}
                confirmText="Cancelar Torneio"
                onConfirm={handleCancelTournament}
                onClose={() => setCancelModal({ isOpen: false, tournament: null })}
                isDestructive={true}
            />
        </>
    );
}
