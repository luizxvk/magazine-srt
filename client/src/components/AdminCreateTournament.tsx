import { useState } from 'react';
import { Swords, Trophy, Users, Clock, Gamepad2, Image, FileText, ChevronDown, X, Sparkles, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface AdminCreateTournamentProps {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onTournamentCreated?: () => void;
}

const FORMATS = [
    { value: 'SINGLE_ELIMINATION', label: 'Eliminatória Simples', icon: '⚔️' },
    { value: 'DOUBLE_ELIMINATION', label: 'Eliminatória Dupla', icon: '🔄' },
    { value: 'ROUND_ROBIN', label: 'Todos contra Todos', icon: '🔁' },
    { value: 'FREE_FOR_ALL', label: 'Todos Livres', icon: '🎯' },
];

const TEAM_SIZES = [
    { value: 1, label: 'Solo' },
    { value: 2, label: 'Duo' },
    { value: 3, label: 'Trio' },
    { value: 4, label: 'Squad (4)' },
    { value: 5, label: 'Equipe (5)' },
];

export default function AdminCreateTournament({ showToast, onTournamentCreated }: AdminCreateTournamentProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFormatDropdown, setShowFormatDropdown] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        game: '',
        description: '',
        format: 'SINGLE_ELIMINATION',
        teamSize: 1,
        maxTeams: 16,
        prizePool: 0,
        rules: '',
        startDate: '',
        startTime: '',
        imageUrl: '',
    });

    const isDark = theme !== 'light';
    const accent = isMGT ? '#10b981' : '#d4af37';
    const accentBg = isMGT ? 'bg-emerald-500/10' : 'bg-amber-500/10';
    const accentBorder = isMGT ? 'border-emerald-500/30' : 'border-amber-500/30';
    const accentText = isMGT ? 'text-emerald-400' : 'text-amber-400';
    const inputBg = isDark ? 'bg-white/5' : 'bg-gray-100/80';
    const inputBorder = isDark ? 'border-white/10' : 'border-gray-200';
    const textMain = isDark ? 'text-white' : 'text-gray-900';
    const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
    const labelClass = `text-xs font-bold uppercase tracking-wider ${accentText} mb-2`;

    const selectedFormat = FORMATS.find(f => f.value === formData.format);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data } = await api.post('/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, imageUrl: data.url || data.imageUrl }));
            showToast('Imagem enviada!', 'success');
        } catch {
            showToast('Erro ao enviar imagem', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            showToast('Nome do torneio é obrigatório', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                game: formData.game || undefined,
                description: formData.description || undefined,
                format: formData.format,
                teamSize: formData.teamSize,
                maxTeams: formData.maxTeams,
                prizePool: formData.prizePool,
                rules: formData.rules || undefined,
                imageUrl: formData.imageUrl || undefined,
                startDate: formData.startDate && formData.startTime
                    ? new Date(`${formData.startDate}T${formData.startTime}`).toISOString()
                    : formData.startDate
                        ? new Date(formData.startDate).toISOString()
                        : undefined,
            };

            await api.post('/tournaments', payload);
            showToast('Torneio criado com sucesso!', 'success');

            // Reset form
            setFormData({
                title: '', game: '', description: '', format: 'SINGLE_ELIMINATION',
                teamSize: 1, maxTeams: 16, prizePool: 0, rules: '', startDate: '', startTime: '', imageUrl: ''
            });
            setImagePreview(null);
            setIsOpen(false);
            onTournamentCreated?.();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Erro ao criar torneio', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-card transition-all duration-300">
            {/* Header Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${accentBg}`}>
                        <Swords className={`w-5 h-5 ${accentText}`} />
                    </div>
                    <div className="text-left">
                        <h3 className={`font-bold ${textMain}`}>Criar Torneio</h3>
                        <p className={`text-xs ${textSub}`}>Anuncie e gerencie torneios</p>
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 ${textSub} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
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
                        <div className="pt-5 space-y-4">
                            {/* Tournament Name */}
                            <div>
                                <label className={labelClass}>NOME DO TORNEIO</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Copa MGT Season 1"
                                    className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none focus:ring-1 focus:ring-current transition-all`}
                                    style={{ focusRingColor: accent } as any}
                                />
                            </div>

                            {/* Game */}
                            <div>
                                <label className={labelClass}>
                                    <Gamepad2 className="w-3 h-3 inline mr-1" />
                                    JOGO
                                </label>
                                <input
                                    type="text"
                                    value={formData.game}
                                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                                    placeholder="Ex: Valorant, CS2, League of Legends"
                                    className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none transition-all`}
                                />
                            </div>

                            {/* Date & Time Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        DATA
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none transition-all`}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>HORÁRIO</label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none transition-all`}
                                    />
                                </div>
                            </div>

                            {/* Format Dropdown */}
                            <div className="relative">
                                <label className={labelClass}>FORMATO</label>
                                <button
                                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                                    className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} text-left flex items-center justify-between transition-all`}
                                >
                                    <span>
                                        {selectedFormat?.icon} {selectedFormat?.label}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 ${textSub} transition-transform ${showFormatDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {showFormatDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className={`absolute z-10 mt-1 w-full ${isDark ? 'bg-gray-900' : 'bg-white'} border ${inputBorder} rounded-xl overflow-hidden shadow-xl`}
                                        >
                                            {FORMATS.map(f => (
                                                <button
                                                    key={f.value}
                                                    onClick={() => {
                                                        setFormData({ ...formData, format: f.value });
                                                        setShowFormatDropdown(false);
                                                    }}
                                                    className={`w-full px-4 py-3 text-sm text-left ${textMain} hover:${accentBg} transition-colors flex items-center gap-2 ${formData.format === f.value ? accentBg : ''}`}
                                                >
                                                    <span>{f.icon}</span>
                                                    <span>{f.label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Team Size & Max Teams */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>
                                        <Users className="w-3 h-3 inline mr-1" />
                                        EQUIPE
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {TEAM_SIZES.map(ts => (
                                            <button
                                                key={ts.value}
                                                onClick={() => setFormData({ ...formData, teamSize: ts.value })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                    formData.teamSize === ts.value
                                                        ? `${accentBg} ${accentBorder} ${accentText}`
                                                        : `${inputBg} ${inputBorder} ${textSub}`
                                                }`}
                                            >
                                                {ts.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>MÁX. EQUIPES/JOGADORES</label>
                                    <input
                                        type="number"
                                        value={formData.maxTeams}
                                        onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || 16 })}
                                        min={2}
                                        max={128}
                                        className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none transition-all`}
                                    />
                                </div>
                            </div>

                            {/* Prize Pool */}
                            <div>
                                <label className={labelClass}>
                                    <Trophy className="w-3 h-3 inline mr-1" />
                                    PREMIAÇÃO (ZIONS)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.prizePool}
                                        onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none transition-all pr-10`}
                                    />
                                    <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold ${accentText}`}>Z</span>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className={labelClass}>
                                    <Image className="w-3 h-3 inline mr-1" />
                                    IMAGEM DO TORNEIO
                                </label>
                                {imagePreview ? (
                                    <div className="relative rounded-xl overflow-hidden">
                                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                                        <button
                                            onClick={() => { setImagePreview(null); setFormData({ ...formData, imageUrl: '' }); }}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed ${inputBorder} cursor-pointer hover:border-current transition-all ${inputBg}`}>
                                        <Upload className={`w-8 h-8 ${textSub}`} />
                                        <span className={`text-xs ${textSub}`}>Clique para enviar imagem</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className={labelClass}>
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    DESCRIÇÃO
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva o torneio, premiação, regras gerais..."
                                    rows={3}
                                    className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none resize-none transition-all`}
                                />
                            </div>

                            {/* Rules */}
                            <div>
                                <label className={labelClass}>REGRAS (OPCIONAL)</label>
                                <textarea
                                    value={formData.rules}
                                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                                    placeholder="Regras específicas do torneio..."
                                    rows={2}
                                    className={`w-full ${inputBg} ${textMain} rounded-xl px-4 py-3 text-sm border ${inputBorder} focus:outline-none resize-none transition-all`}
                                />
                            </div>

                            {/* Submit */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.title.trim()}
                                className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                                style={{
                                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                    boxShadow: `0 4px 20px ${accent}40`
                                }}
                            >
                                {isSubmitting ? (
                                    <Loader size="sm" />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Criar Torneio
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
