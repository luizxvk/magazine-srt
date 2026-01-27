import { useState, useEffect } from 'react';
import { Trophy, Coins, Package, Save, Loader2, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface RankingRewardConfig {
    rewardType: 'zions_points' | 'zions_cash' | 'product' | 'none';
    rewardAmount?: number;
    rewardProductName?: string;
    rewardDescription?: string;
}

interface AdminEliteRewardProps {
    showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminEliteReward({ showToast }: AdminEliteRewardProps) {
    const { theme } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<RankingRewardConfig>({
        rewardType: 'none',
        rewardAmount: 0,
        rewardProductName: '',
        rewardDescription: ''
    });

    const cardBg = theme === 'light' ? 'bg-white' : 'bg-zinc-900/80';
    const cardBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    const inputBg = theme === 'light' ? 'bg-gray-50' : 'bg-black/40';
    const inputBorder = theme === 'light' ? 'border-gray-300' : 'border-white/10';

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/content/elite-ranking-reward');
            setConfig(response.data);
        } catch {
            // Default config if not exists
            setConfig({
                rewardType: 'none',
                rewardAmount: 0,
                rewardProductName: '',
                rewardDescription: ''
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/content/elite-ranking-reward', config);
            showToast?.('Configuração salva com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving config:', error);
            showToast?.('Erro ao salvar configuração', 'error');
        } finally {
            setSaving(false);
        }
    };

    const rewardOptions = [
        { value: 'none', label: 'Sem prêmio definido', icon: <Gift className="w-5 h-5" /> },
        { value: 'zions_points', label: 'Zions Points', icon: <Coins className="w-5 h-5 text-yellow-500" /> },
        { value: 'zions_cash', label: 'Zions Cash (R$)', icon: <Coins className="w-5 h-5 text-green-500" /> },
        { value: 'product', label: 'Produto/Prêmio', icon: <Package className="w-5 h-5 text-purple-500" /> },
    ];

    if (loading) {
        return (
            <div className={`${cardBg} ${cardBorder} border rounded-2xl p-6`}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
                </div>
            </div>
        );
    }

    return (
        <div className={`${cardBg} ${cardBorder} border rounded-2xl p-6`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gold-500/10">
                    <Trophy className="w-6 h-6 text-gold-500" />
                </div>
                <div>
                    <h3 className={`font-semibold ${textMain}`}>Prêmio Elite Ranking</h3>
                    <p className={`text-sm ${textSub}`}>Configure o prêmio mensal para o top do ranking</p>
                </div>
            </div>

            {/* Reward Type Selection */}
            <div className="mb-6">
                <label className={`block text-sm font-medium ${textSub} mb-3`}>Tipo de Prêmio</label>
                <div className="grid grid-cols-2 gap-3">
                    {rewardOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setConfig({ ...config, rewardType: option.value as RankingRewardConfig['rewardType'] })}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                config.rewardType === option.value
                                    ? 'bg-gold-500/20 border-gold-500/50 ring-2 ring-gold-500/30'
                                    : `${inputBg} ${inputBorder} hover:border-gold-500/30`
                            }`}
                        >
                            {option.icon}
                            <span className={`text-sm font-medium ${config.rewardType === option.value ? 'text-gold-400' : textMain}`}>
                                {option.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Amount Input (for zions_points or zions_cash) */}
            {(config.rewardType === 'zions_points' || config.rewardType === 'zions_cash') && (
                <div className="mb-6">
                    <label className={`block text-sm font-medium ${textSub} mb-2`}>
                        {config.rewardType === 'zions_cash' ? 'Valor em R$' : 'Quantidade de Points'}
                    </label>
                    <input
                        type="number"
                        value={config.rewardAmount || ''}
                        onChange={(e) => setConfig({ ...config, rewardAmount: parseFloat(e.target.value) || 0 })}
                        placeholder={config.rewardType === 'zions_cash' ? '10.00' : '1000'}
                        className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${inputBorder} ${textMain} focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all`}
                    />
                </div>
            )}

            {/* Product Name (for product type) */}
            {config.rewardType === 'product' && (
                <div className="mb-6">
                    <label className={`block text-sm font-medium ${textSub} mb-2`}>Nome do Prêmio/Produto</label>
                    <input
                        type="text"
                        value={config.rewardProductName || ''}
                        onChange={(e) => setConfig({ ...config, rewardProductName: e.target.value })}
                        placeholder="Ex: Gift Card R$50, Badge Exclusivo, etc."
                        className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${inputBorder} ${textMain} focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all`}
                    />
                </div>
            )}

            {/* Description (optional) */}
            {config.rewardType !== 'none' && (
                <div className="mb-6">
                    <label className={`block text-sm font-medium ${textSub} mb-2`}>Descrição (opcional)</label>
                    <textarea
                        value={config.rewardDescription || ''}
                        onChange={(e) => setConfig({ ...config, rewardDescription: e.target.value })}
                        placeholder="Ex: Prêmio exclusivo para o 1º lugar do ranking mensal"
                        rows={2}
                        className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${inputBorder} ${textMain} focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all resize-none`}
                    />
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
                {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Save className="w-5 h-5" />
                )}
                {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
        </div>
    );
}
