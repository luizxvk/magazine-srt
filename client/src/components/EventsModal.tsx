import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Gift, Sparkles, Gamepad2, Trash2, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface EventsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface LinkedReward {
    id: string;
    title: string;
    type: string;
    costZions: number;
    zionsReward?: number;
    metadata?: { imageUrl?: string };
    backgroundColor?: string;
    isEventReward: boolean;
    publishedAt?: string;
}

interface EventAttendee {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    membershipType: string;
}

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    imageUrl?: string;
    active: boolean;
    category?: string;
    game?: string;
    linkedReward?: LinkedReward;
    attendeeCount?: number;
    isAttending?: boolean;
    attendees?: EventAttendee[];
}

export default function EventsModal({ isOpen, onClose }: EventsModalProps) {
    const { user, theme, showSuccess, showError } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const isAdmin = user?.role === 'ADMIN';
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [attending, setAttending] = useState<string | null>(null);

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

    const handleToggleAttend = async (eventId: string, isCurrentlyAttending: boolean) => {
        setAttending(eventId);
        try {
            if (isCurrentlyAttending) {
                await api.delete(`/events/${eventId}/attend`);
                setEvents(prev => prev.map(e => 
                    e.id === eventId 
                        ? { ...e, isAttending: false, attendeeCount: Math.max(0, (e.attendeeCount || 1) - 1) }
                        : e
                ));
                showSuccess('Presença cancelada');
            } else {
                await api.post(`/events/${eventId}/attend`);
                setEvents(prev => prev.map(e => 
                    e.id === eventId 
                        ? { 
                            ...e, 
                            isAttending: true, 
                            attendeeCount: (e.attendeeCount || 0) + 1,
                            attendees: [...(e.attendees || []), { 
                                id: user?.id || '', 
                                name: user?.name || '', 
                                displayName: user?.displayName,
                                avatarUrl: user?.avatarUrl, 
                                membershipType: user?.membershipType || 'MAGAZINE' 
                            }]
                        }
                        : e
                ));
                showSuccess('Presença confirmada! Você receberá notificação quando o evento terminar.');
            }
        } catch (error: any) {
            console.error('Failed to toggle attendance', error);
            showError(error.response?.data?.error || 'Erro ao confirmar presença');
        } finally {
            setAttending(null);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Tem certeza que deseja remover este evento?')) return;
        
        setDeleting(eventId);
        try {
            await api.delete(`/events/${eventId}`);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            showSuccess('Evento removido com sucesso!');
        } catch (error) {
            console.error('Failed to delete event', error);
            showError('Erro ao remover evento');
        } finally {
            setDeleting(null);
        }
    };

    if (!isOpen) return null;

    const themeColor = isMGT ? 'emerald' : 'gold';
    const borderColor = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';
    const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900/95';

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`relative w-full max-w-lg ${themeBg} rounded-3xl border ${borderColor} shadow-2xl overflow-hidden backdrop-blur-xl`}>
                {/* Header - Apple Vision Pro style */}
                <div className={`p-6 border-b ${borderColor} ${theme === 'light' ? 'bg-gray-50/80' : 'bg-black/40'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br from-${themeColor}-500/20 to-${themeColor}-600/10 text-${themeColor}-500 backdrop-blur-sm border border-${themeColor}-500/20`}>
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Eventos Exclusivos</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Próximos encontros da comunidade</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className={`p-2 rounded-xl ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/5 hover:bg-white/10'} transition-colors`}
                            title="Fechar"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className={`animate-spin rounded-full h-10 w-10 border-2 border-${themeColor}-500/30 border-t-${themeColor}-500`}></div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-${themeColor}-500/10 flex items-center justify-center`}>
                                <Calendar className={`w-8 h-8 text-${themeColor}-500/50`} />
                            </div>
                            <p className={`font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Nenhum evento agendado</p>
                            <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Fique atento para novidades!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => {
                                const eventDate = new Date(event.date);
                                const day = eventDate.getDate();
                                const month = eventDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                                const isUpcoming = eventDate > new Date();
                                const hasReward = !!event.linkedReward;

                                return (
                                    <div 
                                        key={event.id} 
                                        className={`group relative overflow-hidden rounded-2xl ${theme === 'light' ? 'bg-gray-50 border border-gray-200/50' : isMGT ? 'bg-emerald-950/30 border border-emerald-500/10' : 'bg-amber-950/20 border border-amber-500/10'} hover:border-${themeColor}-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-${themeColor}-500/5`}
                                    >
                                        {/* Background glow effect */}
                                        <div className={`absolute inset-0 bg-gradient-to-r from-${themeColor}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                        
                                        <div className="relative flex">
                                            {/* Date Column - Apple style pill */}
                                            <div className={`flex flex-col items-center justify-center w-20 py-4 ${theme === 'light' ? 'bg-gray-100/50' : 'bg-white/[0.02]'} border-r ${theme === 'light' ? 'border-gray-200/50' : 'border-white/[0.06]'}`}>
                                                <span className={`text-3xl font-bold text-${themeColor}-500`}>{day}</span>
                                                <span className={`text-xs font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'} tracking-wider`}>{month}</span>
                                                {isUpcoming && (
                                                    <div className={`mt-2 px-2 py-0.5 rounded-full bg-${themeColor}-500/10 border border-${themeColor}-500/20`}>
                                                        <span className={`text-[9px] font-bold text-${themeColor}-500 uppercase tracking-wider`}>Em breve</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Column */}
                                            <div className="flex-1 p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className={`font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'} group-hover:text-${themeColor}-500 transition-colors`}>
                                                        {event.title}
                                                    </h3>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteEvent(event.id)}
                                                            disabled={deleting === event.id}
                                                            className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'} transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100`}
                                                            title="Remover evento"
                                                        >
                                                            {deleting === event.id ? (
                                                                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {event.description && (
                                                    <p className={`text-sm line-clamp-2 mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                        {event.description}
                                                    </p>
                                                )}

                                                {/* Meta info pills */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                                                        <Clock className="w-3 h-3 text-gray-500" />
                                                        <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                            {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    
                                                    {event.game && (
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
                                                            <Gamepad2 className="w-3 h-3 text-blue-500" />
                                                            <span className={`text-xs font-medium ${theme === 'light' ? 'text-blue-700' : 'text-blue-400'}`}>{event.game}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* RSVP Section - Attendees + Button */}
                                                {isUpcoming && (
                                                    <div className={`mt-3 flex items-center justify-between gap-2 p-2 rounded-xl ${theme === 'light' ? 'bg-gray-50 border border-gray-200/50' : 'bg-white/[0.02] border border-white/[0.05]'}`}>
                                                        {/* Attendee Avatars Stack */}
                                                        <div className="flex items-center gap-2">
                                                            {event.attendees && event.attendees.length > 0 ? (
                                                                <div className="flex -space-x-2">
                                                                    {event.attendees.slice(0, 4).map((attendee, idx) => (
                                                                        <div 
                                                                            key={attendee.id} 
                                                                            className={`w-7 h-7 rounded-full border-2 ${theme === 'light' ? 'border-gray-50' : 'border-gray-900'} overflow-hidden flex-shrink-0`}
                                                                            style={{ zIndex: 5 - idx }}
                                                                            title={attendee.displayName || attendee.name}
                                                                        >
                                                                            {attendee.avatarUrl ? (
                                                                                <img src={attendee.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${attendee.membershipType === 'MGT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                                                                                    {(attendee.displayName || attendee.name).charAt(0).toUpperCase()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {(event.attendeeCount || 0) > 4 && (
                                                                        <div className={`w-7 h-7 rounded-full border-2 ${theme === 'light' ? 'border-gray-50 bg-gray-200' : 'border-gray-900 bg-gray-800'} flex items-center justify-center text-[10px] font-bold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                            +{(event.attendeeCount || 0) - 4}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Users className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'}`} />
                                                            )}
                                                            <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                {(event.attendeeCount || 0) === 0 
                                                                    ? 'Seja o primeiro!' 
                                                                    : `${event.attendeeCount} confirmad${(event.attendeeCount || 0) === 1 ? 'o' : 'os'}`
                                                                }
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Attend Button */}
                                                        <button
                                                            onClick={() => handleToggleAttend(event.id, event.isAttending || false)}
                                                            disabled={attending === event.id}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                event.isAttending 
                                                                    ? `bg-${themeColor}-500/20 text-${themeColor}-500 border border-${themeColor}-500/30` 
                                                                    : `bg-${themeColor}-500 text-black hover:bg-${themeColor}-400`
                                                            }`}
                                                        >
                                                            {attending === event.id ? (
                                                                <div className={`w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin`} />
                                                            ) : (
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                            )}
                                                            {event.isAttending ? 'Confirmado' : 'Vou!'}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Reward Preview - Apple Vision Pro style card */}
                                                {hasReward && (
                                                    <div className={`mt-4 p-3 rounded-xl ${theme === 'light' ? 'bg-amber-50/80 border border-amber-200/50' : 'bg-amber-500/5 border border-amber-500/20'} backdrop-blur-sm`}>
                                                        <div className="flex items-center gap-3">
                                                            {/* Reward image/icon */}
                                                            <div 
                                                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg"
                                                                style={{ backgroundColor: event.linkedReward?.backgroundColor || '#1a1a1a' }}
                                                            >
                                                                {event.linkedReward?.metadata?.imageUrl ? (
                                                                    <img 
                                                                        src={event.linkedReward.metadata.imageUrl} 
                                                                        alt="" 
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <Gift className="w-6 h-6 text-amber-400" />
                                                                )}
                                                            </div>
                                                            
                                                            {/* Reward info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>
                                                                        Recompensa do Evento
                                                                    </span>
                                                                </div>
                                                                <p className={`font-semibold text-sm truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                                    {event.linkedReward?.title}
                                                                </p>
                                                                <p className={`text-xs ${theme === 'light' ? 'text-amber-600' : 'text-amber-400/80'}`}>
                                                                    {event.linkedReward?.costZions ? `${event.linkedReward.costZions} Zions` : 'Gratuito'}
                                                                    {!isUpcoming && ' • Disponível agora!'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
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

    return createPortal(modalContent, document.body);
}
