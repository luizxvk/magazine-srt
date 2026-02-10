import { useState, useEffect } from 'react';
import { Tv, Plus, X, Save, RefreshCw, Gamepad2, Gift, Radio, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import api from '../services/api';

interface FreeGame {
    id: string;
    title: string;
    imageUrl: string;
    claimUrl: string;
    platform: 'prime' | 'twitch' | 'epic' | 'other';
    expiresAt?: string;
}

interface TwitchConfig {
    carouselEnabled: boolean;
    freeGamesEnabled: boolean;
    dropsEnabled: boolean;
}

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
    prime: { label: 'Prime Gaming', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    twitch: { label: 'Twitch', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
    epic: { label: 'Epic Games', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
    steam: { label: 'Steam', color: 'text-sky-400 bg-sky-500/20 border-sky-500/30' },
    gog: { label: 'GOG', color: 'text-violet-400 bg-violet-500/20 border-violet-500/30' },
    other: { label: 'Outro', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30' },
};

export default function AdminTwitchSettings() {
    const [config, setConfig] = useState<TwitchConfig>({
        carouselEnabled: true,
        freeGamesEnabled: true,
        dropsEnabled: false,
    });
    const [channels, setChannels] = useState<string[]>([]);
    const [freeGames, setFreeGames] = useState<FreeGame[]>([]);
    const [newChannel, setNewChannel] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    
    // New game form
    const [showGameForm, setShowGameForm] = useState(false);
    const [newGame, setNewGame] = useState<Partial<FreeGame>>({
        title: '',
        imageUrl: '',
        claimUrl: '',
        platform: 'prime',
        expiresAt: '',
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await api.get('/social/twitch/config');
            if (data.config) {
                setConfig({
                    carouselEnabled: data.config.carouselEnabled ?? true,
                    freeGamesEnabled: data.config.freeGamesEnabled ?? true,
                    dropsEnabled: data.config.dropsEnabled ?? false,
                });
                setChannels(data.config.channels || []);
            }
            if (data.freeGames) {
                setFreeGames(data.freeGames);
            }
        } catch {
            setMessage({ text: 'Erro ao carregar configuração', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddChannel = () => {
        const name = newChannel.trim().toLowerCase();
        if (!name) return;
        if (channels.includes(name)) {
            setMessage({ text: 'Canal já adicionado', type: 'error' });
            return;
        }
        setChannels([...channels, name]);
        setNewChannel('');
        setMessage(null);
    };

    const handleRemoveChannel = (channel: string) => {
        setChannels(channels.filter(c => c !== channel));
    };

    const handleAddGame = () => {
        if (!newGame.title?.trim() || !newGame.claimUrl?.trim()) {
            setMessage({ text: 'Título e URL são obrigatórios', type: 'error' });
            return;
        }

        const game: FreeGame = {
            id: `game_${Date.now()}`,
            title: newGame.title.trim(),
            imageUrl: newGame.imageUrl?.trim() || '',
            claimUrl: newGame.claimUrl.trim(),
            platform: newGame.platform || 'prime',
            expiresAt: newGame.expiresAt || undefined,
        };

        setFreeGames([...freeGames, game]);
        setNewGame({ title: '', imageUrl: '', claimUrl: '', platform: 'prime', expiresAt: '' });
        setShowGameForm(false);
        setMessage(null);
    };

    const handleRemoveGame = (id: string) => {
        setFreeGames(freeGames.filter(g => g.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/social/twitch/config', {
                ...config,
                channels,
                freeGames,
            });
            setMessage({ text: 'Configuração salva com sucesso!', type: 'success' });
        } catch {
            setMessage({ text: 'Erro ao salvar configuração', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const ToggleSwitch = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) => (
        <button
            onClick={onChange}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                enabled 
                    ? 'bg-purple-500/20 border-purple-500/50 text-white' 
                    : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'
            }`}
        >
            <div className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-purple-500' : 'bg-gray-600'}`}>
                <div 
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200`}
                    style={{ left: enabled ? '24px' : '4px' }} 
                />
            </div>
            <span className="text-sm font-medium whitespace-nowrap">{label}</span>
        </button>
    );

    if (loading) {
        return (
            <div className="glass-panel p-6 rounded-xl">
                <div className="flex justify-center py-12">
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                    <Tv className="w-5 h-5 text-purple-400" /> Twitch & Gaming
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Salvando...' : 'Salvar Tudo'}
                </button>
            </div>

            {message && (
                <p className={`text-sm px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message.text}
                </p>
            )}

            {/* Feature Toggles */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Funcionalidades</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ToggleSwitch
                        enabled={config.carouselEnabled}
                        onChange={() => setConfig({ ...config, carouselEnabled: !config.carouselEnabled })}
                        label="Lives no Carousel"
                    />
                    <ToggleSwitch
                        enabled={config.freeGamesEnabled}
                        onChange={() => setConfig({ ...config, freeGamesEnabled: !config.freeGamesEnabled })}
                        label="Jogos Grátis"
                    />
                    <ToggleSwitch
                        enabled={config.dropsEnabled}
                        onChange={() => setConfig({ ...config, dropsEnabled: !config.dropsEnabled })}
                        label="Twitch Drops"
                    />
                </div>
            </div>

            {/* Channels Section */}
            {config.carouselEnabled && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Radio className="w-4 h-4" /> Canais do Carousel
                    </h3>
                    <p className="text-xs text-gray-500">Canais padrão exibidos para usuários sem Twitch conectada.</p>
                    
                    <div className="flex flex-wrap gap-2">
                        {channels.map(ch => (
                            <span
                                key={ch}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-lg text-sm"
                            >
                                {ch}
                                <button onClick={() => handleRemoveChannel(ch)} className="hover:text-red-400 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                        {channels.length === 0 && (
                            <span className="text-gray-500 text-sm">Nenhum canal configurado</span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newChannel}
                            onChange={e => setNewChannel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddChannel()}
                            placeholder="Nome do canal (ex: gaules)"
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-gray-500 focus:border-purple-500/50 outline-none"
                        />
                        <button
                            onClick={handleAddChannel}
                            className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Free Games Section */}
            {config.freeGamesEnabled && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Gift className="w-4 h-4" /> Jogos Grátis
                        </h3>
                        <button
                            onClick={() => setShowGameForm(!showGameForm)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Jogo
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">Jogos grátis do Prime Gaming, Epic, Twitch Drops, etc.</p>

                    {/* Add Game Form */}
                    {showGameForm && (
                        <div className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-3">
                            <input
                                type="text"
                                value={newGame.title || ''}
                                onChange={e => setNewGame({ ...newGame, title: e.target.value })}
                                placeholder="Título do jogo *"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-gray-500 focus:border-purple-500/50 outline-none"
                            />
                            <input
                                type="url"
                                value={newGame.claimUrl || ''}
                                onChange={e => setNewGame({ ...newGame, claimUrl: e.target.value })}
                                placeholder="URL para resgatar *"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-gray-500 focus:border-purple-500/50 outline-none"
                            />
                            <input
                                type="url"
                                value={newGame.imageUrl || ''}
                                onChange={e => setNewGame({ ...newGame, imageUrl: e.target.value })}
                                placeholder="URL da imagem (opcional)"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-gray-500 focus:border-purple-500/50 outline-none"
                            />
                            <div className="flex gap-3">
                                <select
                                    value={newGame.platform || 'prime'}
                                    onChange={e => setNewGame({ ...newGame, platform: e.target.value as FreeGame['platform'] })}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500/50 outline-none"
                                >
                                    <option value="prime">Prime Gaming</option>
                                    <option value="twitch">Twitch Drops</option>
                                    <option value="epic">Epic Games</option>
                                    <option value="other">Outro</option>
                                </select>
                                <input
                                    type="date"
                                    value={newGame.expiresAt || ''}
                                    onChange={e => setNewGame({ ...newGame, expiresAt: e.target.value })}
                                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500/50 outline-none"
                                    placeholder="Expira em"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowGameForm(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddGame}
                                    className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Games List */}
                    <div className="space-y-2">
                        {freeGames.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">Nenhum jogo grátis cadastrado</p>
                        ) : (
                            freeGames.map(game => (
                                <div
                                    key={game.id}
                                    className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg"
                                >
                                    {game.imageUrl ? (
                                        <img src={game.imageUrl} alt={game.title} className="w-12 h-12 rounded object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                                            <Gamepad2 className="w-6 h-6 text-gray-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{game.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${PLATFORM_LABELS[game.platform]?.color || PLATFORM_LABELS.other.color}`}>
                                                {PLATFORM_LABELS[game.platform]?.label || game.platform}
                                            </span>
                                            {game.expiresAt && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(game.expiresAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={game.claimUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                                            title="Abrir link"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleRemoveGame(game.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
