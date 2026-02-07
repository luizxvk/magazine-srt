import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Radio, DollarSign, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface AdsConfig {
    adsEnabled: boolean;
    adsCarouselEnabled: boolean;
    adsClientId: string;
    adsCarouselSlot: string;
}

export default function AdminAdsSettings() {
    const { theme, showToast } = useAuth();
    const isDarkMode = theme === 'dark';
    const [config, setConfig] = useState<AdsConfig>({
        adsEnabled: false,
        adsCarouselEnabled: false,
        adsClientId: '',
        adsCarouselSlot: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const themeCard = isDarkMode ? 'bg-neutral-900/80' : 'bg-white';
    const themeBorder = isDarkMode ? 'border-white/10' : 'border-gray-200';
    const themeText = isDarkMode ? 'text-white' : 'text-gray-900';
    const themeSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await api.get('/rovex/admin/ads');
            if (data.success) {
                setConfig(data.ads);
            }
        } catch (error) {
            console.error('Failed to fetch ads config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await api.post('/rovex/admin/ads', config);
            if (data.success) {
                showToast('Configurações de anúncios salvas!');
            }
        } catch (error) {
            console.error('Failed to save ads config:', error);
            showToast('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-emerald-500' : 'bg-gray-600'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );

    if (loading) {
        return (
            <div className={`${themeCard} rounded-2xl p-6 border ${themeBorder}`}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${themeCard} rounded-2xl p-6 border ${themeBorder}`}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/10">
                    <Megaphone className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <h2 className={`text-xl font-bold ${themeText}`}>Anúncios (Google AdSense)</h2>
                    <p className={themeSecondary}>Monetize a plataforma com anúncios patrocinados</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Global Toggle */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} border ${themeBorder}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <div>
                                <h3 className={`font-medium ${themeText}`}>Habilitar Anúncios</h3>
                                <p className={`text-sm ${themeSecondary}`}>Ativa o sistema de anúncios globalmente</p>
                            </div>
                        </div>
                        <Toggle 
                            enabled={config.adsEnabled} 
                            onChange={(value) => setConfig({ ...config, adsEnabled: value })} 
                        />
                    </div>
                </div>

                {/* Carousel Toggle */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} border ${themeBorder} ${!config.adsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Radio className="w-5 h-5 text-purple-500" />
                            <div>
                                <h3 className={`font-medium ${themeText}`}>Anúncios no Carousel</h3>
                                <p className={`text-sm ${themeSecondary}`}>Exibe anúncios integrados ao carousel do feed</p>
                            </div>
                        </div>
                        <Toggle 
                            enabled={config.adsCarouselEnabled} 
                            onChange={(value) => setConfig({ ...config, adsCarouselEnabled: value })} 
                        />
                    </div>
                </div>

                {/* AdSense Configuration */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} border ${themeBorder} space-y-4`}>
                    <h3 className={`font-medium ${themeText} flex items-center gap-2`}>
                        <img src="https://www.gstatic.com/adsense/autoads/icons/gdn_icon.svg" alt="AdSense" className="w-5 h-5" />
                        Google AdSense
                    </h3>
                    
                    <div>
                        <label className={`block text-sm font-medium ${themeSecondary} mb-2`}>
                            Client ID (ca-pub-XXXXXXXXXXXXXXXX)
                        </label>
                        <input
                            type="text"
                            value={config.adsClientId}
                            onChange={(e) => setConfig({ ...config, adsClientId: e.target.value })}
                            placeholder="ca-pub-1234567890123456"
                            className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white'} border ${themeBorder} ${themeText}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${themeSecondary} mb-2`}>
                            Carousel Slot ID
                        </label>
                        <input
                            type="text"
                            value={config.adsCarouselSlot}
                            onChange={(e) => setConfig({ ...config, adsCarouselSlot: e.target.value })}
                            placeholder="1234567890"
                            className={`w-full px-4 py-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white'} border ${themeBorder} ${themeText}`}
                        />
                        <p className={`text-xs ${themeSecondary} mt-1`}>
                            Crie um bloco de anúncios no AdSense e cole o slot ID aqui
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/20`}>
                    <p className="text-amber-400 text-sm">
                        <strong>Nota:</strong> Usuários Elite não veem anúncios. 
                        Adicione o script do AdSense no <code className="bg-black/20 px-1 rounded">index.html</code> para que os anúncios funcionem.
                    </p>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    Salvar Configurações
                </button>
            </div>
        </motion.div>
    );
}
