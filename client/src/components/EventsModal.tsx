import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface EventsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    imageUrl?: string;
    active: boolean;
}

export default function EventsModal({ isOpen, onClose }: EventsModalProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchEvents();
        }
    }, [isOpen]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const themeColor = isMGT ? 'emerald' : 'gold';
    const borderColor = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';

    const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`relative w-full max-w-lg ${themeBg} rounded-2xl border ${borderColor} shadow-2xl overflow-hidden`}>
                {/* Header */}
                <div className={`p-6 border-b ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-black/40'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${themeColor}-500/10 text-${themeColor}-500`}>
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h2 className={`text-xl font-serif text-${themeColor}-500`}>Eventos Exclusivos</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Fechar">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Nenhum evento agendado no momento.</p>
                            <p className="text-sm text-gray-600 mt-2">Fique atento para novidades!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {events.map((event) => {
                                const eventDate = new Date(event.date);
                                const day = eventDate.getDate();
                                const month = eventDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();

                                return (
                                    <div key={event.id} className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex">
                                            {/* Date Column */}
                                            <div className={`flex flex-col items-center justify-center w-20 bg-${themeColor}-500/10 border-r border-white/5 p-4`}>
                                                <span className={`text-2xl font-bold text-${themeColor}-500`}>{day}</span>
                                                <span className="text-xs font-medium text-gray-400">{month}</span>
                                            </div>

                                            {/* Info Column */}
                                            <div className="flex-1 p-4">
                                                <h3 className="font-bold text-white mb-1 group-hover:text-gold-400 transition-colors">{event.title}</h3>
                                                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{event.description}</p>

                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        CPM2 Server
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
