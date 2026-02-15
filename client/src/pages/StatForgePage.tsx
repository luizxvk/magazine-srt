import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Clock, Gamepad2,
  RefreshCw, BarChart3, Shield, Target, Trophy,
  Crosshair, Activity, Zap, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Loader from '../components/Loader';
import GradientText from '../components/GradientText';
import StatForgeNotifyCard from '../components/StatForgeNotifyCard';

interface GameInfo {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string | null;
  platforms: string[];
  category: string;
}

// Helper component for game icons with accent color filter
function GameIcon({ iconUrl, icon, size = 'md', accentColor }: { iconUrl?: string | null; icon: string; size?: 'sm' | 'md' | 'lg'; accentColor?: string }) {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' };
  const textSizes = { sm: 'text-lg', md: 'text-3xl', lg: 'text-4xl' };
  
  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt="" 
        className={`${sizeClasses[size]} object-contain`}
        style={{ 
          filter: accentColor ? `drop-shadow(0 0 6px ${accentColor}80)` : undefined 
        }}
      />
    );
  }
  return <span className={textSizes[size]}>{icon}</span>;
}

interface GameProfile {
  id: string;
  game: string;
  platform: string;
  gamertag: string;
  avatarUrl?: string;
  isVerified: boolean;
  lastSyncedAt?: string;
  gameName: string;
  gameIcon: string;
  gameIconUrl?: string | null;
  gameCategory: string;
  latestStats?: GameSnapshot;
}

interface GameSnapshot {
  id: string;
  rank?: string;
  rankTier?: number;
  level?: number;
  kd?: number;
  winRate?: number;
  totalMatches?: number;
  totalWins?: number;
  totalKills?: number;
  totalDeaths?: number;
  hoursPlayed?: number;
  score?: number;
  stats?: any;
  createdAt: string;
}

interface GameEvent {
  id: string;
  game: string;
  eventType: string;
  title: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user?: { id: string; name: string; displayName?: string; avatarUrl?: string };
  gameInfo?: GameInfo;
}

type Tab = 'profiles' | 'feed' | 'link';

export default function StatForgePage() {
  const { theme, accentColor, accentGradient } = useAuth();

  const [tab, setTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<GameProfile[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<GameProfile | null>(null);

  // Link form
  const [linkGame, setLinkGame] = useState('');
  const [linkPlatform, setLinkPlatform] = useState('pc');
  const [linkGamertag, setLinkGamertag] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, gamesRes] = await Promise.all([
        api.get('/statforge/profiles'),
        api.get('/statforge/games'),
      ]);
      setProfiles(profilesRes.data);
      setGames(gamesRes.data);
    } catch (error) {
      console.error('Error fetching statforge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/statforge/events');
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleLink = async () => {
    if (!linkGame || !linkGamertag) return;
    setLinking(true);
    try {
      await api.post('/statforge/profiles/link', {
        game: linkGame,
        platform: linkPlatform,
        gamertag: linkGamertag,
      });
      setLinkGame('');
      setLinkGamertag('');
      setTab('profiles');
      fetchData();
    } catch (error: any) {
      console.error('Error linking profile:', error);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (profileId: string) => {
    try {
      await api.delete(`/statforge/profiles/${profileId}`);
      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (error) {
      console.error('Error unlinking:', error);
    }
  };

  useEffect(() => {
    if (tab === 'feed') fetchEvents();
  }, [tab]);

  const selectedGame = games.find(g => g.id === linkGame);

  const cardBg = theme === 'light'
    ? 'bg-white/80 border-gray-200/60'
    : 'bg-white/[0.03] border-white/[0.08]';

  const glassBg = theme === 'light'
    ? 'bg-white/70 backdrop-blur-2xl'
    : 'bg-black/20 backdrop-blur-2xl';

  if (loading) return (
    <div className="min-h-screen">
      <LuxuriousBackground />
      <Header />
      <div className="pt-32 flex justify-center"><Loader /></div>
    </div>
  );

  return (
    <div className="min-h-screen text-white font-sans relative">
      <LuxuriousBackground />
      <Header />

      <div className="max-w-5xl mx-auto pt-28 pb-32 px-4 relative z-10">
        {/* Hero Header with Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${glassBg} rounded-3xl border ${theme === 'light' ? 'border-gray-200/60' : 'border-white/[0.06]'} px-6 py-5 mb-8 relative overflow-hidden`}
        >
          {/* Glow effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl" />

          <div className="relative flex items-center gap-6">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl scale-150" />
              <img
                src="/assets/statforge-logo.png"
                alt="StatForge"
                className="relative w-40 h-40 object-contain drop-shadow-[0_0_40px_rgba(99,102,241,0.3)]"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <GradientText as="h1" className="text-2xl sm:text-3xl font-bold tracking-tight" fallbackClassName={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                StatForge
              </GradientText>
              <p className={`mt-1 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                Rastreie suas stats de jogos em tempo real
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'} border ${theme === 'light' ? 'border-blue-100' : 'border-blue-500/20'}`}>
                  <Gamepad2 className="w-3.5 h-3.5" />
                  {profiles.length} jogos vinculados
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${theme === 'light' ? 'bg-purple-50 text-purple-600' : 'bg-purple-500/10 text-purple-400'} border ${theme === 'light' ? 'border-purple-100' : 'border-purple-500/20'}`}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  17+ jogos suportados
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notification Opt-in */}
        <div className="mb-4">
          <StatForgeNotifyCard />
        </div>

        {/* Tabs */}
        <div className={`${glassBg} rounded-2xl border ${theme === 'light' ? 'border-gray-200/60' : 'border-white/[0.06]'} p-1.5 flex gap-1 mb-8`}>
          {[
            { key: 'profiles' as Tab, label: 'Meus Jogos', icon: Gamepad2 },
            { key: 'feed' as Tab, label: 'Activity Feed', icon: Activity },
            { key: 'link' as Tab, label: 'Vincular Jogo', icon: Plus },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${tab === t.key
                  ? `border text-white`
                  : `${theme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-white/5'}`
                }`}
              style={tab === t.key ? { background: `${accentColor}20`, borderColor: `${accentColor}30`, color: accentColor } : {}}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Profiles Tab */}
        {tab === 'profiles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.length === 0 ? (
              <div className={`col-span-full ${cardBg} border rounded-2xl p-12 text-center`}>
                <img
                  src="/assets/statforge-logo.png"
                  alt="StatForge"
                  className="w-24 h-24 object-contain mx-auto mb-5 opacity-40"
                />
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Nenhum jogo vinculado
                </h3>
                <p className="text-gray-400 mb-6">Vincule seus jogos para começar a rastrear suas stats</p>
                <button
                  onClick={() => setTab('link')}
                  className="px-6 py-3 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  style={{ background: accentGradient || accentColor }}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Vincular Primeiro Jogo
                </button>
              </div>
            ) : (
              profiles.map(profile => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${cardBg} border rounded-2xl p-5 hover:scale-[1.02] transition-all cursor-pointer group`}
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <GameIcon iconUrl={profile.gameIconUrl} icon={profile.gameIcon} size="md" accentColor={accentColor} />
                      <div>
                        <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {profile.gameName}
                        </h3>
                        <p className="text-sm text-gray-400">{profile.gamertag} • {profile.platform.toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnlink(profile.id); }}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {profile.latestStats ? (
                    <div className="grid grid-cols-3 gap-3">
                      {profile.latestStats.rank && (
                        <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                          <p className="text-xs text-gray-400 mb-1">Rank</p>
                          <p className={`text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {profile.latestStats.rank}
                          </p>
                        </div>
                      )}
                      {profile.latestStats.kd != null && (
                        <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                          <p className="text-xs text-gray-400 mb-1">K/D</p>
                          <p className={`text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {profile.latestStats.kd.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {profile.latestStats.winRate != null && (
                        <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                          <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                          <p className={`text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {profile.latestStats.winRate.toFixed(1)}%
                          </p>
                        </div>
                      )}
                      {profile.latestStats.hoursPlayed != null && (
                        <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                          <p className="text-xs text-gray-400 mb-1">Horas</p>
                          <p className={`text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {Math.round(profile.latestStats.hoursPlayed)}h
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'} text-center`}>
                      <p className="text-sm text-gray-400">Aguardando sincronização...</p>
                    </div>
                  )}

                  {profile.lastSyncedAt && (
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Última sync: {new Date(profile.lastSyncedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Feed Tab */}
        {tab === 'feed' && (
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className={`${cardBg} border rounded-2xl p-12 text-center`}>
                <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Nenhuma atividade ainda
                </h3>
                <p className="text-gray-400">Vincule jogos e acompanhe mudanças de rank, conquistas e mais!</p>
              </div>
            ) : (
              events.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${cardBg} border rounded-2xl p-4 flex items-center gap-4`}
                >
                  {/* Event icon */}
                  <div className={`p-3 rounded-xl shrink-0 ${event.eventType === 'rank_up'
                      ? 'bg-green-500/10 text-green-400'
                      : event.eventType === 'rank_down'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    {event.eventType === 'rank_up' ? <TrendingUp className="w-5 h-5" />
                      : event.eventType === 'rank_down' ? <TrendingDown className="w-5 h-5" />
                        : <Trophy className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {event.user?.avatarUrl && (
                        <img src={event.user.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                      )}
                      <span className="text-sm font-medium text-gray-300">
                        {event.user?.displayName || event.user?.name || 'Jogador'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {event.gameInfo?.iconUrl ? (
                          <img src={event.gameInfo.iconUrl} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          event.gameInfo?.icon
                        )}
                        {event.gameInfo?.name}
                      </span>
                    </div>
                    <p className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Link Tab */}
        {tab === 'link' && (
          <div className={`${cardBg} border rounded-2xl p-6`}>
            <h3 className={`text-lg font-semibold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Vincular Novo Jogo
            </h3>

            {/* Game selection - grouped by category */}
            <div className="mb-6 space-y-5">
              <label className="text-sm text-gray-400 block">Selecione o Jogo</label>
              {(() => {
                const categoryLabels: Record<string, string> = {
                  'FPS': '🎯 FPS / Tactical',
                  'Battle Royale': '🏆 Battle Royale',
                  'MOBA': '⚔️ MOBA',
                  'Strategy': '♟️ Estratégia',
                  'Platform': '🏪 Lojas & Plataformas',
                  'Sports': '⚽ Esportes',
                  'Sandbox': '🧱 Sandbox',
                };
                const categories = [...new Set(games.map(g => g.category))];
                // Sort: Platform last
                const sorted = categories.sort((a, b) => a === 'Platform' ? 1 : b === 'Platform' ? -1 : 0);
                return sorted.map(cat => (
                  <div key={cat}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {categoryLabels[cat] || cat}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {games.filter(g => g.category === cat).map(game => (
                        <button
                          key={game.id}
                          onClick={() => setLinkGame(game.id)}
                          className={`p-3 rounded-xl text-left transition-all border ${linkGame === game.id
                            ? 'ring-1'
                            : `${theme === 'light' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-white/5 border-white/5 hover:bg-white/10'}`
                          }`}
                          style={linkGame === game.id ? { background: `${accentColor}15`, borderColor: `${accentColor}50`, boxShadow: `0 0 0 1px ${accentColor}30` } : {}}
                        >
                          <GameIcon iconUrl={game.iconUrl} icon={game.icon} size="sm" accentColor={linkGame === game.id ? accentColor : undefined} />
                          <span className={`text-xs font-medium ${linkGame === game.id ? 'text-white' : theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                            {game.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {linkGame && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Platform */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Plataforma</label>
                  <div className="flex gap-2">
                    {selectedGame?.platforms.map(p => (
                      <button
                        key={p}
                        onClick={() => setLinkPlatform(p)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${linkPlatform === p
                          ? ''
                            : `${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-white/5 border-white/5 text-gray-400'}`
                          }`}
                        style={linkPlatform === p ? { background: `${accentColor}15`, borderColor: `${accentColor}50`, color: accentColor } : {}}
                      >
                        {p === 'pc' ? '🖥️ PC' : p === 'xbox' ? '🟢 Xbox' : '🔵 PlayStation'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gamertag */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Gamertag / Nome de Usuário</label>
                  <input
                    type="text"
                    value={linkGamertag}
                    onChange={(e) => setLinkGamertag(e.target.value)}
                    placeholder="Ex: xXPlayerXx#1234"
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'light'
                        ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                        : 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': `${accentColor}50` } as React.CSSProperties}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleLink}
                  disabled={!linkGamertag || linking}
                  className="w-full py-3 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: accentGradient || accentColor }}
                >
                  {linking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {linking ? 'Vinculando...' : 'Vincular Jogo'}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-900'} rounded-3xl border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} p-6 max-h-[80vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GameIcon iconUrl={selectedProfile.gameIconUrl} icon={selectedProfile.gameIcon} size="lg" accentColor={accentColor} />
                  <div>
                    <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {selectedProfile.gameName}
                    </h2>
                    <p className="text-sm text-gray-400">{selectedProfile.gamertag}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProfile(null)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {selectedProfile.latestStats ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedProfile.latestStats.rank && (
                    <StatCard label="Rank" value={selectedProfile.latestStats.rank} icon={<Shield className="w-4 h-4" />} theme={theme} />
                  )}
                  {selectedProfile.latestStats.level != null && (
                    <StatCard label="Nível" value={selectedProfile.latestStats.level.toString()} icon={<Zap className="w-4 h-4" />} theme={theme} />
                  )}
                  {selectedProfile.latestStats.kd != null && (
                    <StatCard label="K/D Ratio" value={selectedProfile.latestStats.kd.toFixed(2)} icon={<Crosshair className="w-4 h-4" />} theme={theme} />
                  )}
                  {selectedProfile.latestStats.winRate != null && (
                    <StatCard label="Win Rate" value={`${selectedProfile.latestStats.winRate.toFixed(1)}%`} icon={<Trophy className="w-4 h-4" />} theme={theme} />
                  )}
                  {selectedProfile.latestStats.totalMatches != null && (
                    <StatCard label="Partidas" value={selectedProfile.latestStats.totalMatches.toLocaleString()} icon={<Target className="w-4 h-4" />} theme={theme} />
                  )}
                  {selectedProfile.latestStats.totalKills != null && (
                    <StatCard label="Kills" value={selectedProfile.latestStats.totalKills.toLocaleString()} icon={<Crosshair className="w-4 h-4" />} theme={theme} />
                  )}
                  {selectedProfile.latestStats.hoursPlayed != null && (
                    <StatCard label="Horas Jogadas" value={`${Math.round(selectedProfile.latestStats.hoursPlayed)}h`} icon={<Clock className="w-4 h-4" />} theme={theme} />
                  )}
                  {selectedProfile.latestStats.score != null && (
                    <StatCard label="Score/MMR" value={selectedProfile.latestStats.score.toLocaleString()} icon={<BarChart3 className="w-4 h-4" />} theme={theme} />
                  )}
                </div>
              ) : (
                <div className={`p-8 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'} text-center`}>
                  <p className="text-gray-400">Nenhum dado sincronizado ainda</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, theme }: { label: string; value: string; icon: React.ReactNode; theme: string }) {
  return (
    <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: 'var(--accent-color, #d4af37)' }}>{icon}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{value}</p>
    </div>
  );
}
