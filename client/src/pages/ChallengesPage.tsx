import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Clock, Coins, Target, Shield,
  Check, X, Loader2, AlertCircle, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useTierColors } from '../hooks/useTierColors';
import api from '../services/api';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Loader from '../components/Loader';
import GradientText from '../components/GradientText';
import CreateChallengeModal from '../components/CreateChallengeModal';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
}

interface Challenge {
  id: string;
  challengerId: string;
  opponentId: string;
  game: string;
  metric: string;
  betAmount: number;
  duration: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DECLINED' | 'EXPIRED';
  winnerId?: string;
  challengerDelta?: number;
  opponentDelta?: number;
  expiresAt?: string;
  startsAt?: string;
  endsAt?: string;
  completedAt?: string;
  createdAt: string;
  challenger: User;
  opponent: User;
}

interface LeaderboardEntry {
  user: User;
  wins: number;
}

interface WeeklyLeaderboardEntry {
  userId: string;
  user: User;
  wins: number;
  totalEarnings: number;
}

interface ChallengeStats {
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  weeklyWins: number;
  winRate: string;
  totalEarnings: number;
}

const METRIC_LABELS: Record<string, string> = {
  KILLS: 'Eliminações',
  WINS: 'Vitórias',
  KD: 'K/D Ratio',
  WIN_RATE: '% Vitória',
  SCORE: 'Score/ELO',
  HOURS: 'Horas Jogadas'
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Aguardando', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  ACCEPTED: { label: 'Aceito', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'text-tier-std-400', bgColor: 'bg-tier-std-500/20' },
  COMPLETED: { label: 'Finalizado', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  CANCELLED: { label: 'Cancelado', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  DECLINED: { label: 'Recusado', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  EXPIRED: { label: 'Expirado', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
};

type Tab = 'active' | 'history' | 'leaderboard';

export default function ChallengesPage() {
  const { user, theme, accentColor, accentGradient } = useAuth();
  const { isStdTier } = useCommunity();
  const { getAccentColor } = useTierColors();
  const isMGT = user?.membershipType ? isStdTier(user.membershipType) : false;
  const defaultAccent = getAccentColor(isMGT);
  const userAccent = accentColor || defaultAccent;

  const [tab, setTab] = useState<Tab>('active');
  const [leaderboardTab, setLeaderboardTab] = useState<'allTime' | 'weekly'>('weekly');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<WeeklyLeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard();
    fetchWeeklyLeaderboard();
    fetchMyStats();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const res = await api.get('/challenges');
      setChallenges(res.data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/challenges/leaderboard/top');
      setLeaderboard(res.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchWeeklyLeaderboard = async () => {
    try {
      const res = await api.get('/challenges/leaderboard/weekly');
      setWeeklyLeaderboard(res.data);
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
    }
  };

  const fetchMyStats = async () => {
    try {
      const res = await api.get('/challenges/my-stats');
      setMyStats(res.data);
    } catch (error) {
      console.error('Error fetching my stats:', error);
    }
  };

  const handleAccept = async (challengeId: string) => {
    setActionLoading(challengeId);
    setError(null);
    try {
      await api.post(`/challenges/${challengeId}/accept`);
      await fetchChallenges();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao aceitar desafio');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (challengeId: string) => {
    setActionLoading(challengeId);
    setError(null);
    try {
      await api.post(`/challenges/${challengeId}/decline`);
      await fetchChallenges();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao recusar desafio');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (challengeId: string) => {
    setActionLoading(challengeId);
    setError(null);
    try {
      await api.post(`/challenges/${challengeId}/cancel`);
      await fetchChallenges();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao cancelar desafio');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter challenges based on tab
  const activeChallenges = challenges.filter(c => 
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(c.status)
  );
  const historyChallenges = challenges.filter(c => 
    ['COMPLETED', 'CANCELLED', 'DECLINED', 'EXPIRED'].includes(c.status)
  );

  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white' : 'bg-white/5';
  const cardBorder = isLight ? 'border-gray-200' : 'border-white/10';
  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textMuted = isLight ? 'text-gray-500' : 'text-gray-400';

  const renderChallengeCard = (challenge: Challenge) => {
    const isChallenger = challenge.challengerId === user?.id;
    const opponent = isChallenger ? challenge.opponent : challenge.challenger;
    const statusConfig = STATUS_CONFIG[challenge.status];
    const isPending = challenge.status === 'PENDING';
    const isInProgress = challenge.status === 'IN_PROGRESS';
    const isCompleted = challenge.status === 'COMPLETED';
    const didWin = isCompleted && challenge.winnerId === user?.id;
    const wasDraw = isCompleted && !challenge.winnerId;

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative ${cardBg} border ${cardBorder} rounded-2xl p-4 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${userAccent}20` }}
            >
              <Swords className="w-5 h-5" style={{ color: userAccent }} />
            </div>
            <div>
              <p className={`font-semibold ${textMain}`}>
                {isChallenger ? 'Você desafiou' : 'Desafiado por'}
              </p>
              <p className={`text-sm ${textMuted}`}>
                {opponent.displayName || opponent.name}
              </p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Details */}
        <div className={`grid grid-cols-3 gap-3 p-3 rounded-xl mb-4 ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
          <div className="text-center">
            <Gamepad className="w-4 h-4 mx-auto mb-1 opacity-60" style={{ color: userAccent }} />
            <p className={`text-xs ${textMuted}`}>Jogo</p>
            <p className={`text-sm font-medium ${textMain} capitalize`}>{challenge.game}</p>
          </div>
          <div className="text-center">
            <Target className="w-4 h-4 mx-auto mb-1 opacity-60" style={{ color: userAccent }} />
            <p className={`text-xs ${textMuted}`}>Métrica</p>
            <p className={`text-sm font-medium ${textMain}`}>{METRIC_LABELS[challenge.metric]}</p>
          </div>
          <div className="text-center">
            <Coins className="w-4 h-4 mx-auto mb-1 opacity-60" style={{ color: userAccent }} />
            <p className={`text-xs ${textMuted}`}>Aposta</p>
            <p className={`text-sm font-medium ${textMain}`}>{challenge.betAmount} Zions</p>
          </div>
        </div>

        {/* Time info */}
        {isPending && challenge.expiresAt && (
          <div className={`flex items-center gap-2 text-xs ${textMuted} mb-3`}>
            <Clock className="w-3 h-3" />
            <span>Expira {formatDistanceToNow(new Date(challenge.expiresAt), { addSuffix: true, locale: ptBR })}</span>
          </div>
        )}
        {isInProgress && challenge.endsAt && (
          <div className={`flex items-center gap-2 text-xs ${textMuted} mb-3`}>
            <Clock className="w-3 h-3" />
            <span>Termina {formatDistanceToNow(new Date(challenge.endsAt), { addSuffix: true, locale: ptBR })}</span>
          </div>
        )}

        {/* Result */}
        {isCompleted && (
          <div className={`flex items-center justify-center gap-2 p-3 rounded-xl mb-3 ${
            didWin ? 'bg-tier-std-500/20 text-tier-std-400' : 
            wasDraw ? 'bg-yellow-500/20 text-yellow-400' : 
            'bg-red-500/20 text-red-400'
          }`}>
            {didWin ? (
              <>
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">Você venceu! +{challenge.betAmount * 2 * 0.95} Zions</span>
              </>
            ) : wasDraw ? (
              <>
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Empate! Zions devolvidos</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                <span className="font-semibold">Você perdeu</span>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        {isPending && !isChallenger && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAccept(challenge.id)}
              disabled={actionLoading === challenge.id}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: accentGradient || userAccent }}
            >
              {actionLoading === challenge.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Aceitar ({challenge.betAmount} Zions)
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDecline(challenge.id)}
              disabled={actionLoading === challenge.id}
              className={`px-4 py-2.5 rounded-xl font-semibold ${isLight ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white'}`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {isPending && isChallenger && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCancel(challenge.id)}
            disabled={actionLoading === challenge.id}
            className={`w-full py-2.5 rounded-xl font-semibold ${isLight ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white'} flex items-center justify-center gap-2`}
          >
            {actionLoading === challenge.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4" />
                Cancelar Desafio
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0f]'}`}>
        <LuxuriousBackground />
        <Header />
        <div className="flex items-center justify-center pt-32">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0f]'}`}>
      <LuxuriousBackground />
      <Header />

      <main className="relative z-10 pt-20 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <GradientText className="text-3xl font-bold mb-2">
                Desafios 1v1
              </GradientText>
              <p className={textMuted}>
                Desafie amigos, aposte Zions e prove quem é o melhor!
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2"
              style={{ background: accentGradient || userAccent }}
            >
              <Swords className="w-4 h-4" />
              Novo Desafio
            </motion.button>
          </div>

          {/* Tabs */}
          <div className={`flex gap-2 p-1 rounded-xl ${isLight ? 'bg-gray-100' : 'bg-white/5'} mb-6`}>
            {[
              { id: 'active', label: 'Ativos', icon: Swords, count: activeChallenges.length },
              { id: 'history', label: 'Histórico', icon: Clock, count: historyChallenges.length },
              { id: 'leaderboard', label: 'Ranking', icon: Trophy, count: null }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  tab === t.id 
                    ? `${isLight ? 'bg-white shadow' : 'bg-white/10'} ${textMain}`
                    : textMuted
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span 
                    className="px-1.5 py-0.5 rounded-full text-xs text-white"
                    style={{ backgroundColor: userAccent }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 rounded-xl bg-red-500/20 text-red-400 mb-6"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {tab === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {activeChallenges.length === 0 ? (
                  <div className={`text-center py-12 ${cardBg} border ${cardBorder} rounded-2xl`}>
                    <Swords className={`w-12 h-12 mx-auto mb-4 ${textMuted}`} />
                    <p className={`text-lg font-medium ${textMain} mb-2`}>Nenhum desafio ativo</p>
                    <p className={textMuted}>Crie um novo desafio para começar!</p>
                  </div>
                ) : (
                  activeChallenges.map(renderChallengeCard)
                )}
              </motion.div>
            )}

            {tab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {historyChallenges.length === 0 ? (
                  <div className={`text-center py-12 ${cardBg} border ${cardBorder} rounded-2xl`}>
                    <Clock className={`w-12 h-12 mx-auto mb-4 ${textMuted}`} />
                    <p className={`text-lg font-medium ${textMain} mb-2`}>Sem histórico</p>
                    <p className={textMuted}>Seus desafios finalizados aparecerão aqui.</p>
                  </div>
                ) : (
                  historyChallenges.map(renderChallengeCard)
                )}
              </motion.div>
            )}

            {tab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* My Stats Card */}
                {myStats && (
                  <div className={`${cardBg} border ${cardBorder} rounded-2xl p-4`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5" style={{ color: userAccent }} />
                      <h3 className={`font-semibold ${textMain}`}>Suas Estatísticas</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`text-center p-3 rounded-xl ${isLight ? 'bg-tier-std-50' : 'bg-tier-std-500/10'}`}>
                        <p className="text-2xl font-bold text-tier-std-500">{myStats.totalWins}</p>
                        <p className={`text-xs ${textMuted}`}>Vitórias</p>
                      </div>
                      <div className={`text-center p-3 rounded-xl ${isLight ? 'bg-red-50' : 'bg-red-500/10'}`}>
                        <p className="text-2xl font-bold text-red-500">{myStats.totalLosses}</p>
                        <p className={`text-xs ${textMuted}`}>Derrotas</p>
                      </div>
                      <div className={`text-center p-3 rounded-xl ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
                        <p className="text-2xl font-bold text-blue-500">{myStats.winRate}%</p>
                        <p className={`text-xs ${textMuted}`}>Win Rate</p>
                      </div>
                      <div className={`text-center p-3 rounded-xl`} style={{ backgroundColor: `${userAccent}15` }}>
                        <p className="text-2xl font-bold" style={{ color: userAccent }}>Z${myStats.totalEarnings}</p>
                        <p className={`text-xs ${textMuted}`}>Ganhos</p>
                      </div>
                    </div>
                    {myStats.weeklyWins > 0 && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className={textMuted}>{myStats.weeklyWins} vitórias esta semana!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Leaderboard Sub-tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setLeaderboardTab('weekly')}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                      leaderboardTab === 'weekly'
                        ? isLight ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                        : `${cardBg} border ${cardBorder} ${textMuted}`
                    }`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setLeaderboardTab('allTime')}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                      leaderboardTab === 'allTime'
                        ? isLight ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                        : `${cardBg} border ${cardBorder} ${textMuted}`
                    }`}
                  >
                    Geral
                  </button>
                </div>

                {/* Leaderboard List */}
                <div className={`${cardBg} border ${cardBorder} rounded-2xl overflow-hidden`}>
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" style={{ color: userAccent }} />
                      <h3 className={`font-semibold ${textMain}`}>
                        {leaderboardTab === 'weekly' ? 'Top Duelistas da Semana' : 'Top Duelistas'}
                      </h3>
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {leaderboardTab === 'weekly' ? (
                      weeklyLeaderboard.length === 0 ? (
                        <div className="text-center py-8">
                          <p className={textMuted}>Nenhum duelista esta semana</p>
                        </div>
                      ) : (
                        weeklyLeaderboard.map((entry, index) => (
                          <div key={entry.userId || index} className="flex items-center gap-4 p-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-400/20 text-gray-400' :
                              index === 2 ? 'bg-amber-600/20 text-amber-600' :
                              `${isLight ? 'bg-gray-100' : 'bg-white/5'} ${textMuted}`
                            }`}>
                              {index + 1}
                            </div>
                            <img
                              src={entry.user?.avatarUrl || `https://ui-avatars.com/api/?name=${entry.user?.name}&background=random`}
                              alt={entry.user?.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <p className={`font-medium ${textMain}`}>
                                {entry.user?.displayName || entry.user?.name}
                              </p>
                              <p className={`text-sm ${textMuted}`}>
                                {entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'} · Z${entry.totalEarnings}
                              </p>
                            </div>
                            {index === 0 && <Crown className="w-5 h-5 text-yellow-400" />}
                          </div>
                        ))
                      )
                    ) : (
                      leaderboard.length === 0 ? (
                        <div className="text-center py-8">
                          <p className={textMuted}>Nenhum duelista ainda</p>
                        </div>
                      ) : (
                        leaderboard.map((entry, index) => (
                          <div key={entry.user?.id || index} className="flex items-center gap-4 p-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-400/20 text-gray-400' :
                              index === 2 ? 'bg-amber-600/20 text-amber-600' :
                              `${isLight ? 'bg-gray-100' : 'bg-white/5'} ${textMuted}`
                            }`}>
                              {index + 1}
                            </div>
                            <img
                              src={entry.user?.avatarUrl || `https://ui-avatars.com/api/?name=${entry.user?.name}&background=random`}
                              alt={entry.user?.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <p className={`font-medium ${textMain}`}>
                                {entry.user?.displayName || entry.user?.name}
                              </p>
                              <p className={`text-sm ${textMuted}`}>
                                {entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'}
                              </p>
                            </div>
                            {index === 0 && <Crown className="w-5 h-5 text-yellow-400" />}
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchChallenges();
        }}
      />
    </div>
  );
}

// Helper icon component
function Gamepad({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4m-2-2v4m10-2h.01M17 10h.01" />
    </svg>
  );
}
