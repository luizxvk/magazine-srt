import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Users, Swords, Calendar, Coins } from 'lucide-react';

interface TournamentCardProps {
    tournament: {
        id: string;
        title: string;
        description?: string;
        game?: string;
        imageUrl?: string;
        format: string;
        teamSize: number;
        maxTeams: number;
        prizePool: number;
        status: string;
        startDate?: string;
        _count: { teams: number };
    };
    onClick: () => void;
    formatCurrency: (amount: number) => string;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
    REGISTRATION: { label: 'Inscrições Abertas', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    IN_PROGRESS: { label: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    COMPLETED: { label: 'Finalizado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const FORMAT_LABELS: Record<string, string> = {
    SINGLE_ELIMINATION: 'Eliminação Simples',
    DOUBLE_ELIMINATION: 'Eliminação Dupla',
    ROUND_ROBIN: 'Todos contra Todos',
    FREE_FOR_ALL: 'Livre',
};

export default function TournamentCard({ tournament, onClick, formatCurrency }: TournamentCardProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const badge = STATUS_BADGES[tournament.status] || STATUS_BADGES.REGISTRATION;

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="cursor-pointer group"
        >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden
                          hover:border-white/20 transition-all duration-300
                          hover:shadow-lg hover:shadow-black/20">
                {/* Image / Header */}
                {tournament.imageUrl ? (
                    <div className="relative h-40 overflow-hidden">
                        <img
                            src={tournament.imageUrl}
                            alt={tournament.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${badge.color}`}>
                                {badge.label}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={`h-32 flex items-center justify-center relative ${
                        isMGT
                            ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/10'
                            : 'bg-gradient-to-br from-gold-900/30 to-gold-800/10'
                    }`}>
                        <Swords className={`w-12 h-12 ${isMGT ? 'text-emerald-500/30' : 'text-gold-500/30'}`} />
                        <div className="absolute bottom-3 left-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${badge.color}`}>
                                {badge.label}
                            </span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                            {tournament.title}
                        </h3>
                        {tournament.game && (
                            <p className="text-sm text-gray-400 mt-0.5">{tournament.game}</p>
                        )}
                    </div>

                    {tournament.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{tournament.description}</p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{tournament._count.teams}/{tournament.maxTeams}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Swords className="w-4 h-4" />
                            <span>{FORMAT_LABELS[tournament.format] || tournament.format}</span>
                        </div>
                        {tournament.teamSize > 1 && (
                            <div className="flex items-center gap-1 text-xs bg-white/5 px-2 py-0.5 rounded-full">
                                {tournament.teamSize}v{tournament.teamSize}
                            </div>
                        )}
                    </div>

                    {/* Prize Pool */}
                    {tournament.prizePool > 0 && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                            isMGT ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gold-500/10 border border-gold-500/20'
                        }`}>
                            <Coins className={`w-4 h-4 ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`} />
                            <span className={`text-sm font-bold ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                                {formatCurrency(tournament.prizePool)}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">Premiação</span>
                        </div>
                    )}

                    {/* Start Date */}
                    {tournament.startDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                                {new Date(tournament.startDate).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
