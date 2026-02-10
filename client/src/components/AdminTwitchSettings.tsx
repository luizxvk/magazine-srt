import { useState, useEffect } from 'react';
import { Tv, Plus, X, Save, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function AdminTwitchSettings() {
    const [channels, setChannels] = useState<string[]>([]);
    const [newChannel, setNewChannel] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const { data } = await api.get('/social/twitch/channels');
            setChannels(data.channels || []);
        } catch {
            setMessage({ text: 'Erro ao carregar canais', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
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

    const handleRemove = (channel: string) => {
        setChannels(channels.filter(c => c !== channel));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/social/twitch/channels', { channels });
            setMessage({ text: 'Canais salvos com sucesso!', type: 'success' });
        } catch {
            setMessage({ text: 'Erro ao salvar canais', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-xl font-serif text-white mb-4 flex items-center gap-2">
                <Tv className="w-5 h-5 text-purple-400" /> Twitch — Canais do Carousel
            </h2>
            <p className="text-xs text-gray-400 mb-4">
                Configure os canais padrão que aparecem no carousel para usuários sem conta Twitch conectada.
            </p>

            {loading ? (
                <div className="flex justify-center py-6">
                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Channel tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {channels.map(ch => (
                            <span
                                key={ch}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-lg text-sm"
                            >
                                {ch}
                                <button
                                    onClick={() => handleRemove(ch)}
                                    className="hover:text-red-400 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                        {channels.length === 0 && (
                            <span className="text-gray-500 text-sm">Nenhum canal configurado</span>
                        )}
                    </div>

                    {/* Add input */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newChannel}
                            onChange={e => setNewChannel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Nome do canal (ex: gaules)"
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-gray-500 focus:border-purple-500/50 outline-none"
                        />
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Salvando...' : 'Salvar Canais'}
                    </button>

                    {message && (
                        <p className={`mt-3 text-xs ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {message.text}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
