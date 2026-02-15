import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import TournamentCard from '../components/TournamentCard';
import TournamentDetail from '../components/TournamentDetail';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Trophy, Swords, Users } from 'lucide-react';
import GradientText from '../components/GradientText';
import { useTranslation } from 'react-i18next';

interface Tournament {
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
    endDate?: string;
    _count: { teams: number; matches: number };
}

export default function TournamentsPage() {
    const { user } = useAuth();
    const { formatCurrency } = useCommunity();
    const { t } = useTranslation('gamification');
    const isMGT = user?.membershipType === 'MGT';

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        fetchTournaments();
    }, [statusFilter]);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const { data } = await api.get(`/tournaments${params}`);
            setTournaments(data);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusTabs = [
        { value: '', label: 'Todos', icon: Trophy },
        { value: 'REGISTRATION', label: 'Inscrições Abertas', icon: Users },
        { value: 'IN_PROGRESS', label: 'Em Andamento', icon: Swords },
        { value: 'COMPLETED', label: 'Finalizados', icon: Trophy },
    ];

    if (selectedTournament) {
        return (
            <TournamentDetail
                tournamentId={selectedTournament}
                onBack={() => setSelectedTournament(null)}
            />
        );
    }

    return (
        <div className="min-h-screen">
            <LuxuriousBackground />
            <Header />

            <div className="max-w-7xl mx-auto px-4 pt-32 pb-8">
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
                {/* Page Header */}
                <div className="mb-8">
                    <GradientText as="h1" className="text-4xl font-serif mb-2" fallbackClassName={isMGT ? 'text-emerald-400' : 'text-gold-400'}>
                        <Swords className="inline-block w-8 h-8 mr-2 -mt-1" />
                        {t('tournaments.title')}
                    </GradientText>
                    <p className="text-gray-400">
                        {t('tournaments.prizes')} + {t('tournaments.brackets')}
                    </p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {statusTabs.map(tab => {
                        const Icon = tab.icon;
                        const active = statusFilter === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                    active
                                        ? isMGT
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tournament Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${isMGT ? 'bg-emerald-400' : 'bg-gold-400'}`}
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                />
                            ))}
                        </div>
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="text-center py-20">
                        <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 mb-2">Nenhum torneio encontrado</h3>
                        <p className="text-gray-500">
                            {statusFilter === 'REGISTRATION'
                                ? 'Não há torneios com inscrições abertas no momento.'
                                : 'Fique ligado para os próximos torneios!'}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1 } },
                        }}
                    >
                        {tournaments.map(tournament => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={tournament}
                                onClick={() => setSelectedTournament(tournament.id)}
                                formatCurrency={formatCurrency}
                            />
                        ))}
                    </motion.div>
                )}
                </div>
            </div>
        </div>
    );
}
