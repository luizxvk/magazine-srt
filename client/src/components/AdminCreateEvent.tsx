import { useState } from 'react';
import { Calendar, Clock, Car, Gamepad2, FileText, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
        description: ''
    });

    const themeColor = isMGT ? 'emerald' : 'gold';
    const borderColor = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const focusColor = isMGT ? 'focus:border-emerald-500/50' : 'focus:border-gold-500/50';
    const buttonBg = isMGT ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gold-600 hover:bg-gold-500';
    const iconColor = isMGT ? 'text-emerald-400' : 'text-gold-400';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.date || !formData.time) {
            showToast('Preencha título, data e horário', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/events', {
                title: formData.title,
                date: `${formData.date}T${formData.time}:00`,
                category: formData.category,
                game: formData.game,
                description: formData.description
            });

            showToast('Evento criado com sucesso!', 'success');
            setFormData({ title: '', date: '', time: '', category: '', game: '', description: '' });
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
        <div className={`glass-panel p-6 rounded-xl border ${borderColor}`}>
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

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all ${buttonBg} text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
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
