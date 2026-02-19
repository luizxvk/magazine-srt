import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Swords, Search, Coins, Clock, Target, Loader2, AlertCircle, Check, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Friend {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  gameProfiles?: GameProfile[];
}

interface GameProfile {
  id: string;
  game: string;
  gamertag: string;
  gameName?: string;
  gameIconUrl?: string;
}

const METRICS = [
  { id: 'KILLS', label: 'Eliminações', desc: 'Quem fizer mais kills ganha' },
  { id: 'WINS', label: 'Vitórias', desc: 'Quem vencer mais partidas' },
  { id: 'KD', label: 'K/D Ratio', desc: 'Melhor taxa kill/death' },
  { id: 'WIN_RATE', label: '% Vitória', desc: 'Maior porcentagem de vitórias' },
  { id: 'SCORE', label: 'Score/ELO', desc: 'Maior ganho de pontuação' },
];

const DURATIONS = [
  { days: 1, label: '24 horas' },
  { days: 3, label: '3 dias' },
  { days: 7, label: '7 dias' },
];

const BET_PRESETS = [100, 250, 500, 1000];

export default function CreateChallengeModal({ isOpen, onClose, onSuccess }: CreateChallengeModalProps) {
  const { user, theme, accentColor, accentGradient } = useAuth();
  const isMGT = user?.membershipType === 'MGT';
  const defaultAccent = isMGT ? '#10b981' : '#d4af37';
  const userAccent = accentColor || defaultAccent;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Select opponent
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState<Friend | null>(null);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Step 2: Select game profile
  const [myProfiles, setMyProfiles] = useState<GameProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<GameProfile | null>(null);
  const [commonGames, setCommonGames] = useState<string[]>([]);

  // Step 3: Configure challenge
  const [metric, setMetric] = useState('KILLS');
  const [duration, setDuration] = useState(3);
  const [betAmount, setBetAmount] = useState(100);
  const [customBet, setCustomBet] = useState('');

  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white' : 'bg-zinc-900';
  const inputBg = isLight ? 'bg-gray-50' : 'bg-white/5';
  const inputBorder = isLight ? 'border-gray-200' : 'border-white/10';
  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textMuted = isLight ? 'text-gray-500' : 'text-gray-400';

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      fetchMyProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedOpponent && myProfiles.length > 0) {
      // Find common games between user and opponent
      const opponentGames = selectedOpponent.gameProfiles?.map(p => p.game) || [];
      const myGames = myProfiles.map(p => p.game);
      const common = myGames.filter(g => opponentGames.includes(g));
      setCommonGames(common);
      
      // Auto-select first common game
      if (common.length > 0) {
        const profile = myProfiles.find(p => p.game === common[0]);
        if (profile) setSelectedProfile(profile);
      }
    }
  }, [selectedOpponent, myProfiles]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await api.get('/social/friends');
      // Fetch game profiles for each friend (this could be optimized)
      const friendsWithProfiles = await Promise.all(
        res.data.map(async (f: any) => {
          try {
            const profilesRes = await api.get(`/statforge/profiles/user/${f.friendId}`);
            return { ...f.friend, gameProfiles: profilesRes.data };
          } catch {
            return { ...f.friend, gameProfiles: [] };
          }
        })
      );
      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchMyProfiles = async () => {
    try {
      const res = await api.get('/statforge/profiles');
      setMyProfiles(res.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleCreate = async () => {
    if (!selectedOpponent || !selectedProfile) return;

    setLoading(true);
    setError(null);

    const finalBet = customBet ? parseInt(customBet) : betAmount;

    if (finalBet < 100 || finalBet > 10000) {
      setError('Aposta deve ser entre 100 e 10.000 Zions');
      setLoading(false);
      return;
    }

    if ((user?.zionsPoints || 0) < finalBet) {
      setError('Zions insuficientes');
      setLoading(false);
      return;
    }

    try {
      await api.post('/challenges', {
        opponentId: selectedOpponent.id,
        gameProfileId: selectedProfile.id,
        metric,
        betAmount: finalBet,
        duration
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar desafio');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedOpponent(null);
    setSelectedProfile(null);
    setMetric('KILLS');
    setDuration(3);
    setBetAmount(100);
    setCustomBet('');
    setError(null);
    setSearchQuery('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const filteredFriends = friends.filter(f => {
    const name = (f.displayName || f.name).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative w-full max-w-lg ${cardBg} rounded-2xl shadow-2xl border ${inputBorder} overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${userAccent}20` }}
              >
                <Swords className="w-5 h-5" style={{ color: userAccent }} />
              </div>
              <div>
                <h2 className={`font-bold ${textMain}`}>Novo Desafio 1v1</h2>
                <p className={`text-sm ${textMuted}`}>Etapa {step} de 3</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1 px-4 pt-4">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all ${
                  s <= step ? '' : isLight ? 'bg-gray-200' : 'bg-white/10'
                }`}
                style={s <= step ? { backgroundColor: userAccent } : undefined}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {/* Step 1: Select Opponent */}
            {step === 1 && (
              <div>
                <h3 className={`font-semibold ${textMain} mb-4`}>Escolha seu oponente</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                  <input
                    type="text"
                    placeholder="Buscar amigo..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${inputBg} border ${inputBorder} ${textMain} focus:outline-none focus:ring-2`}
                    style={{ '--tw-ring-color': userAccent } as any}
                  />
                </div>

                {/* Friends list */}
                {loadingFriends ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: userAccent }} />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className={`w-10 h-10 mx-auto mb-3 ${textMuted}`} />
                    <p className={textMuted}>Nenhum amigo encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredFriends.map(friend => {
                      const hasGames = (friend.gameProfiles?.length || 0) > 0;
                      const isSelected = selectedOpponent?.id === friend.id;
                      
                      return (
                        <button
                          key={friend.id}
                          onClick={() => hasGames && setSelectedOpponent(friend)}
                          disabled={!hasGames}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? `border-2` 
                              : `${inputBg} border ${inputBorder} ${hasGames ? 'hover:border-white/20' : 'opacity-50 cursor-not-allowed'}`
                          }`}
                          style={isSelected ? { borderColor: userAccent, backgroundColor: `${userAccent}10` } : undefined}
                        >
                          <img
                            src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.name}&background=random`}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 text-left">
                            <p className={`font-medium ${textMain}`}>
                              {friend.displayName || friend.name}
                            </p>
                            <p className={`text-xs ${textMuted}`}>
                              {hasGames 
                                ? `${friend.gameProfiles?.length} jogo(s) vinculado(s)`
                                : 'Sem jogos vinculados'
                              }
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5" style={{ color: userAccent }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Game */}
            {step === 2 && (
              <div>
                <h3 className={`font-semibold ${textMain} mb-4`}>Escolha o jogo</h3>
                
                {commonGames.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className={`w-10 h-10 mx-auto mb-3 text-yellow-400`} />
                    <p className={textMain}>Vocês não têm jogos em comum</p>
                    <p className={`text-sm ${textMuted} mt-1`}>
                      Ambos precisam ter o mesmo jogo vinculado no StatForge
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myProfiles
                      .filter(p => commonGames.includes(p.game))
                      .map(profile => {
                        const isSelected = selectedProfile?.id === profile.id;
                        
                        return (
                          <button
                            key={profile.id}
                            onClick={() => setSelectedProfile(profile)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              isSelected 
                                ? `border-2` 
                                : `${inputBg} border ${inputBorder} hover:border-white/20`
                            }`}
                            style={isSelected ? { borderColor: userAccent, backgroundColor: `${userAccent}10` } : undefined}
                          >
                            {profile.gameIconUrl ? (
                              <img src={profile.gameIconUrl} alt="" className="w-8 h-8" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                                🎮
                              </div>
                            )}
                            <div className="flex-1 text-left">
                              <p className={`font-medium ${textMain} capitalize`}>
                                {profile.gameName || profile.game}
                              </p>
                              <p className={`text-xs ${textMuted}`}>
                                {profile.gamertag}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5" style={{ color: userAccent }} />
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Configure */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Metric */}
                <div>
                  <h4 className={`font-medium ${textMain} mb-3 flex items-center gap-2`}>
                    <Target className="w-4 h-4" style={{ color: userAccent }} />
                    Métrica do desafio
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {METRICS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMetric(m.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          metric === m.id 
                            ? `border-2` 
                            : `${inputBg} border ${inputBorder} hover:border-white/20`
                        }`}
                        style={metric === m.id ? { borderColor: userAccent, backgroundColor: `${userAccent}10` } : undefined}
                      >
                        <p className={`font-medium ${textMain} text-sm`}>{m.label}</p>
                        <p className={`text-xs ${textMuted}`}>{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <h4 className={`font-medium ${textMain} mb-3 flex items-center gap-2`}>
                    <Clock className="w-4 h-4" style={{ color: userAccent }} />
                    Duração do desafio
                  </h4>
                  <div className="flex gap-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d.days}
                        onClick={() => setDuration(d.days)}
                        className={`flex-1 py-2.5 px-4 rounded-xl border font-medium text-sm transition-all ${
                          duration === d.days 
                            ? `border-2 text-white` 
                            : `${inputBg} border ${inputBorder} ${textMain} hover:border-white/20`
                        }`}
                        style={duration === d.days ? { borderColor: userAccent, backgroundColor: userAccent } : undefined}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bet Amount */}
                <div>
                  <h4 className={`font-medium ${textMain} mb-3 flex items-center gap-2`}>
                    <Coins className="w-4 h-4" style={{ color: userAccent }} />
                    Aposta (cada lado)
                  </h4>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {BET_PRESETS.map(bet => (
                      <button
                        key={bet}
                        onClick={() => { setBetAmount(bet); setCustomBet(''); }}
                        className={`py-2 px-4 rounded-xl border font-medium text-sm transition-all ${
                          betAmount === bet && !customBet
                            ? `border-2 text-white` 
                            : `${inputBg} border ${inputBorder} ${textMain} hover:border-white/20`
                        }`}
                        style={betAmount === bet && !customBet ? { borderColor: userAccent, backgroundColor: userAccent } : undefined}
                      >
                        {bet}
                      </button>
                    ))}
                    <input
                      type="number"
                      placeholder="Personalizado"
                      value={customBet}
                      onChange={e => setCustomBet(e.target.value)}
                      className={`flex-1 min-w-24 py-2 px-3 rounded-xl ${inputBg} border ${inputBorder} ${textMain} text-sm focus:outline-none`}
                    />
                  </div>
                  <p className={`text-xs ${textMuted}`}>
                    Seu saldo: <span style={{ color: userAccent }}>{user?.zionsPoints?.toLocaleString() || 0}</span> Zions
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 text-red-400 mt-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-white/10">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className={`px-5 py-2.5 rounded-xl font-medium ${isLight ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white'}`}
              >
                Voltar
              </button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (step < 3) {
                  if (step === 1 && !selectedOpponent) return;
                  if (step === 2 && !selectedProfile) return;
                  setStep(s => s + 1);
                } else {
                  handleCreate();
                }
              }}
              disabled={
                loading || 
                (step === 1 && !selectedOpponent) || 
                (step === 2 && (!selectedProfile || commonGames.length === 0))
              }
              className="flex-1 py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: accentGradient || userAccent }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step < 3 ? (
                'Continuar'
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  Criar Desafio ({customBet || betAmount} Zions)
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
