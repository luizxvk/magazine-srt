import { useState, useEffect } from 'react';
import { Calendar, Clock, Car, Gamepad2, FileText, Plus, Gift, ChevronDown, X, Sparkles, Palette, Image, Award, CircleDot, Key, Hash } from 'lucide-react';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Reward {
    id: string;
    title: string;
    type: string;
    costZions: number;
    zionsReward?: number;
    metadata?: { imageUrl?: string };
    backgroundColor?: string;
}

interface AdminCreateEventProps {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onEventCreated?: () => void;
}

export default function AdminCreateEvent({ showToast, onEventCreated }: AdminCreateEventProps) {
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        category: '',
        game: '',
        description: '',
        tag: ''
    });
    
    // Recompensa vinculada
    const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
    const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
    const [showRewardDropdown, setShowRewardDropdown] = useState(false);
    const [loadingRewards, setLoadingRewards] = useState(false);

    // Drop exclusivo do evento (itens do Meu Estilo)
    const [showDropSection, setShowDropSection] = useState(false);
    const [dropItemType, setDropItemType] = useState<'background' | 'badge' | 'color' | 'profileBorder' | ''>('');
    const [dropItemId, setDropItemId] = useState('');
    const [dropKeyword, setDropKeyword] = useState('');
    const [dropClaimHours, setDropClaimHours] = useState(24); // Horas após evento para resgatar

    const themeColor = isMGT ? 'tier-std' : 'gold';
    const focusColor = isMGT ? 'focus:border-tier-std-500/50' : 'focus:border-gold-500/50';
    const buttonBg = isMGT ? 'bg-tier-std-600 hover:bg-tier-std-500' : 'bg-gold-600 hover:bg-gold-500';
    const iconColor = isMGT ? 'text-tier-std-400' : 'text-gold-400';

    // Buscar recompensas disponíveis quando abre o form
    useEffect(() => {
        if (isOpen) {
            fetchAvailableRewards();
        }
    }, [isOpen]);

    const fetchAvailableRewards = async () => {
        setLoadingRewards(true);
        try {
            const response = await api.get('/events/available-rewards');
            setAvailableRewards(response.data);
        } catch (error) {
            console.error('Failed to fetch rewards', error);
        } finally {
            setLoadingRewards(false);
        }
    };

    const selectedReward = availableRewards.find(r => r.id === selectedRewardId);

    // Itens disponíveis para drop (simplificado - itens mais populares)
    const dropItems = {
        background: [
            { id: 'bg_aurora', name: 'Aurora Boreal' },
            { id: 'bg_galaxy', name: 'Galáxia' },
            { id: 'bg_retrowave', name: 'Retrowave' },
            { id: 'bg_fire', name: 'Fogo' },
            { id: 'bg_oceano', name: 'Oceano' },
            { id: 'bg_cyberpunk', name: 'Cyberpunk' },
            { id: 'bg_lava', name: 'Lava' },
            { id: 'bg_emerald', name: 'Esmeralda' },
            { id: 'bg_royal', name: 'Real Púrpura' },
            { id: 'anim-cosmic-triangles', name: 'Triângulos Cósmicos (Premium)' },
            { id: 'anim-gradient-waves', name: 'Ondas Gradiente (Premium)' },
            { id: 'anim-rainbow-skies', name: 'Rainbow Skies (Premium)' },
            { id: 'anim-moonlit-sky', name: 'Moonlit Sky (Premium)' },
            { id: 'anim-dark-veil', name: 'Véu Sombrio (Premium WebGL)' },
            { id: 'anim-iridescence', name: 'Prisma Iridescente (Premium WebGL)' },
        ],
        badge: [
            { id: 'badge_diamond', name: 'Diamante' },
            { id: 'badge_fire', name: 'Fogo' },
            { id: 'badge_lightning', name: 'Raio' },
            { id: 'badge_skull', name: 'Caveira' },
            { id: 'badge_moon', name: 'Lua' },
            { id: 'badge_sun', name: 'Sol' },
            { id: 'badge_shark', name: 'Grande Norke' },
            { id: 'badge_event_exclusive', name: '⭐ Exclusivo de Evento' },
        ],
        color: [
            { id: 'color_rgb', name: 'RGB Dinâmico' },
            { id: 'color_cyan', name: 'Ciano Neon' },
            { id: 'color_magenta', name: 'Magenta Neon' },
            { id: 'color_purple', name: 'Roxo Neon' },
            { id: 'color_pink', name: 'Rosa Neon' },
            { id: 'color_orange', name: 'Laranja Neon' },
        ],
        profileBorder: [
            { id: 'border_diamond', name: 'Diamante' },
            { id: 'border_fire', name: 'Fogo' },
            { id: 'border_ice', name: 'Gelo' },
            { id: 'border_rainbow', name: 'Arco-íris' },
            { id: 'border_galaxy', name: 'Galáxia' },
            { id: 'border_royal', name: 'Royal' },
        ],
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.date || !formData.time) {
            showToast('Preencha título, data e horário', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Criar data/hora com timezone local (Brasil UTC-3)
            // Usar o formato ISO com timezone para evitar problemas de conversão
            const localDateTimeString = `${formData.date}T${formData.time}:00`;
            const eventDateLocal = new Date(localDateTimeString);
            
            // Calcular dropClaimUntil baseado no horário do evento + horas de resgate
            let dropClaimUntilDate = null;
            if (showDropSection && dropItemId && dropItemType) {
                dropClaimUntilDate = new Date(eventDateLocal.getTime() + (dropClaimHours * 60 * 60 * 1000));
            }

            await api.post('/events', {
                title: formData.title,
                date: eventDateLocal.toISOString(), // Enviar como ISO com timezone correto
                category: formData.category,
                game: formData.game,
                description: formData.description,
                tag: formData.tag || undefined,
                linkedRewardId: selectedRewardId || undefined,
                // Drop exclusivo
                dropItemId: showDropSection && dropItemId ? dropItemId : undefined,
                dropItemType: showDropSection && dropItemType ? dropItemType : undefined,
                dropKeyword: showDropSection && dropKeyword ? dropKeyword : undefined,
                dropClaimUntil: dropClaimUntilDate ? dropClaimUntilDate.toISOString() : undefined,
            });

            showToast('Evento criado com sucesso!', 'success');
            setFormData({ title: '', date: '', time: '', category: '', game: '', description: '', tag: '' });
            setSelectedRewardId(null);
            setShowDropSection(false);
            setDropItemId('');
            setDropItemType('');
            setDropKeyword('');
            setDropClaimHours(24);
            setIsOpen(false);
            onEventCreated?.();
        } catch (error) {
            console.error('Failed to create event', error);
            showToast('Erro ao criar evento', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-serif text-${themeColor}-400 flex items-center gap-2`}>
                    <Calendar className={`w-5 h-5 ${iconColor}`} />
                    Eventos Exclusivos
                </h2>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-2 rounded-lg ${buttonBg} text-black hover:scale-105 transition-all`}
                    title={isOpen ? 'Fechar' : 'Novo Evento'}
                >
                    <Plus className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                    {/* Title */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
                            Título do Evento *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Encontro de Supercarros"
                            className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors placeholder-gray-500`}
                        />
                    </div>

                    {/* Tag do Evento */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Hash className="w-3 h-3" /> Tag do Evento
                        </label>
                        <input
                            type="text"
                            value={formData.tag}
                            onChange={(e) => setFormData({ ...formData, tag: e.target.value.replace(/\s/g, '') })}
                            placeholder="Ex: EncontroBR, RaceSRT"
                            className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors placeholder-gray-500`}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Esta tag aparecerá como sugestão para posts relacionados ao evento
                        </p>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Data *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Horário *
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors`}
                            />
                        </div>
                    </div>

                    {/* Category & Game */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                                <Car className="w-3 h-3" /> Categoria de Carro
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Ex: Supercars, Tuning"
                                className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors placeholder-gray-500`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                                <Gamepad2 className="w-3 h-3" /> Jogo
                            </label>
                            <input
                                type="text"
                                value={formData.game}
                                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                                placeholder="Ex: CPM2, FH5"
                                className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors placeholder-gray-500`}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes do evento..."
                            rows={3}
                            className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors placeholder-gray-500 resize-none`}
                        />
                    </div>

                    {/* Recompensa Exclusiva */}
                    <div className={`p-4 rounded-xl border ${selectedRewardId ? 'bg-amber-500/5 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                        <label className="block text-xs text-amber-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Recompensa Exclusiva do Evento
                        </label>
                        
                        {loadingRewards ? (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Loader size="sm" />
                                Carregando recompensas...
                            </div>
                        ) : availableRewards.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                Nenhuma recompensa disponível. Crie uma recompensa primeiro.
                            </p>
                        ) : (
                            <div className="relative">
                                {/* Dropdown button */}
                                <button
                                    type="button"
                                    onClick={() => setShowRewardDropdown(!showRewardDropdown)}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all ${
                                        selectedReward 
                                            ? 'bg-black/60 border-amber-500/50' 
                                            : 'bg-black/40 border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    {selectedReward ? (
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: selectedReward.backgroundColor || '#1a1a1a' }}
                                            >
                                                {selectedReward.metadata?.imageUrl ? (
                                                    <img 
                                                        src={selectedReward.metadata.imageUrl} 
                                                        alt="" 
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <Gift className="w-5 h-5 text-gold-400" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-white font-medium text-sm">{selectedReward.title}</p>
                                                <p className="text-xs text-gray-400">
                                                    {selectedReward.costZions > 0 ? `${selectedReward.costZions} Z` : 'Gratuito'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Selecionar recompensa (opcional)</span>
                                    )}
                                    
                                    <div className="flex items-center gap-2">
                                        {selectedReward && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRewardId(null);
                                                }}
                                                className="p-1 rounded-full hover:bg-white/10"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        )}
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRewardDropdown ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                
                                {/* Dropdown menu */}
                                {showRewardDropdown && (
                                    <div className="absolute z-50 w-full mt-2 py-2 bg-gray-900 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {availableRewards.map((reward) => (
                                            <button
                                                key={reward.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRewardId(reward.id);
                                                    setShowRewardDropdown(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                                                    selectedRewardId === reward.id ? 'bg-amber-500/10' : ''
                                                }`}
                                            >
                                                <div 
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: reward.backgroundColor || '#1a1a1a' }}
                                                >
                                                    {reward.metadata?.imageUrl ? (
                                                        <img 
                                                            src={reward.metadata.imageUrl} 
                                                            alt="" 
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <Gift className="w-5 h-5 text-gold-400" />
                                                    )}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm truncate">{reward.title}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {reward.costZions > 0 ? `${reward.costZions} Zions` : 'Gratuito'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <p className="mt-3 text-xs text-gray-500">
                            💡 A recompensa será publicada automaticamente quando o evento finalizar.
                        </p>
                    </div>

                    {/* Drop Exclusivo - Itens do Meu Estilo */}
                    <div className={`p-4 rounded-xl border ${showDropSection ? 'bg-purple-500/5 border-purple-500/30' : 'bg-white/5 border-white/10'}`}>
                        <button
                            type="button"
                            onClick={() => setShowDropSection(!showDropSection)}
                            className="w-full flex items-center justify-between"
                        >
                            <label className="text-xs text-purple-400 uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                                <Palette className="w-4 h-4" />
                                Drop Exclusivo (Meu Estilo)
                            </label>
                            <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${showDropSection ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showDropSection && (
                            <div className="mt-4 space-y-4">
                                {/* Tipo de Item */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                                        <Award className="w-3 h-3" /> Tipo de Item *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { type: 'background' as const, label: 'Background', icon: Image },
                                            { type: 'badge' as const, label: 'Badge', icon: Award },
                                            { type: 'color' as const, label: 'Cor', icon: Palette },
                                            { type: 'profileBorder' as const, label: 'Borda', icon: CircleDot },
                                        ].map(({ type, label, icon: Icon }) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    setDropItemType(type);
                                                    setDropItemId('');
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                                    dropItemType === type
                                                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-sm">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Seleção do Item */}
                                {dropItemType && (
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">
                                            Selecionar {dropItemType === 'background' ? 'Background' : dropItemType === 'badge' ? 'Badge' : dropItemType === 'color' ? 'Cor' : 'Borda'} *
                                        </label>
                                        <select
                                            value={dropItemId}
                                            onChange={(e) => setDropItemId(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors`}
                                        >
                                            <option value="">Selecione...</option>
                                            {dropItems[dropItemType as keyof typeof dropItems]?.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Palavra-chave secreta */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                                        <Key className="w-3 h-3" /> Palavra-chave Secreta *
                                    </label>
                                    <input
                                        type="text"
                                        value={dropKeyword}
                                        onChange={(e) => setDropKeyword(e.target.value.toUpperCase())}
                                        placeholder="Ex: EVENTO2024, MGT, SUPERCARS"
                                        className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors placeholder-gray-500 uppercase`}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Será revelada durante a live/evento
                                    </p>
                                </div>

                                {/* Tempo para resgate */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Tempo para Resgate (horas)
                                    </label>
                                    <input
                                        type="number"
                                        value={dropClaimHours}
                                        onChange={(e) => setDropClaimHours(Number(e.target.value))}
                                        min={1}
                                        max={168}
                                        className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white ${focusColor} outline-none transition-colors`}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Após o horário do evento, usuários terão {dropClaimHours}h para resgatar
                                    </p>
                                </div>

                                {/* Preview */}
                                {dropItemId && dropKeyword && (
                                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                        <p className="text-xs text-purple-300 font-medium mb-1">Preview do Drop:</p>
                                        <p className="text-sm text-white">
                                            Item: <span className="text-purple-400">{dropItems[dropItemType as keyof typeof dropItems]?.find(i => i.id === dropItemId)?.name}</span>
                                        </p>
                                        <p className="text-sm text-white">
                                            Keyword: <span className="text-purple-400 font-mono">{dropKeyword}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <p className="mt-3 text-xs text-gray-500">
                            🎁 Item exclusivo que participantes podem resgatar com a palavra-chave.
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all ${buttonBg} text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader size="sm" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Calendar className="w-4 h-4" />
                                Criar Evento
                            </>
                        )}
                    </button>
                </form>
            )}

            {!isOpen && (
                <p className="text-gray-500 text-sm">
                    Crie eventos exclusivos para os membros. Eles aparecerão no card de Recomendados.
                </p>
            )}
        </div>
    );
}
