import { useState, useEffect } from 'react';
import { MessageSquare, Star, User, ChevronDown, ChevronUp, Check, Trash2, Filter, BarChart3, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from './Loader';

interface FeedbackUser {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    membershipType: 'MAGAZINE' | 'MGT';
}

interface Feedback {
    id: string;
    user: FeedbackUser;
    interfaceRating: number;
    navigationRating: number;
    performanceRating: number;
    designRating: number;
    featuresRating: number;
    communityRating: number;
    customizationRating: number;
    supportRating: number;
    bugsFound?: string;
    favoriteFeature?: string;
    missingFeature?: string;
    wouldRecommend: boolean;
    overallExperience?: string;
    suggestions?: string;
    isRead: boolean;
    createdAt: string;
}

interface FeedbackStats {
    averages: {
        interface: number;
        navigation: number;
        performance: number;
        design: number;
        features: number;
        community: number;
        customization: number;
        support: number;
    };
    recommendRate: number;
    totalFeedbacks: number;
}

export default function AdminFeedbackCard() {
    const { user, theme, accentColor } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [showStats, setShowStats] = useState(false);
    
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const activeColor = accentColor || defaultColor;
    
    const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    
    useEffect(() => {
        fetchFeedbacks();
        fetchStats();
    }, [showUnreadOnly]);
    
    const fetchFeedbacks = async () => {
        try {
            const response = await api.get('/feedback/admin/all', {
                params: { unreadOnly: showUnreadOnly }
            });
            setFeedbacks(response.data.feedbacks);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchStats = async () => {
        try {
            const response = await api.get('/feedback/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching feedback stats:', error);
        }
    };
    
    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/feedback/${id}/read`);
            setFeedbacks(prev => prev.map(f => 
                f.id === id ? { ...f, isRead: true } : f
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking feedback as read:', error);
        }
    };
    
    const deleteFeedback = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este feedback?')) return;
        
        try {
            await api.delete(`/feedback/${id}`);
            setFeedbacks(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error deleting feedback:', error);
        }
    };
    
    const getAverageRating = (feedback: Feedback) => {
        const ratings = [
            feedback.interfaceRating,
            feedback.navigationRating,
            feedback.performanceRating,
            feedback.designRating,
            feedback.featuresRating,
            feedback.communityRating,
            feedback.customizationRating,
            feedback.supportRating
        ];
        return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    };
    
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const RatingDisplay = ({ label, value }: { label: string; value: number }) => (
        <div className="flex items-center justify-between py-1">
            <span className={`text-xs ${themeSecondary}`}>{label}</span>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star}
                        className={`w-3 h-3 ${star <= value ? 'fill-current' : ''}`}
                        style={{ color: star <= value ? activeColor : '#4a4a4a' }}
                    />
                ))}
            </div>
        </div>
    );
    
    if (loading) {
        return (
            <div className="admin-card">
                <div className="flex items-center justify-center py-8">
                    <Loader size="sm" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="admin-card !p-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl relative" style={{ backgroundColor: `${activeColor}20` }}>
                            <MessageSquare className="w-6 h-6" style={{ color: activeColor }} />
                            {unreadCount > 0 && (
                                <span 
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                                    style={{ backgroundColor: activeColor }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${themeText}`}>Feedbacks Recebidos</h3>
                            <p className={`text-xs ${themeSecondary}`}>{feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={`p-2 rounded-lg border ${themeBorder} hover:bg-white/5 transition-colors`}
                            title="Ver estatísticas"
                        >
                            <BarChart3 className="w-4 h-4" style={{ color: showStats ? activeColor : undefined }} />
                        </button>
                        <button
                            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                            className={`p-2 rounded-lg border ${themeBorder} hover:bg-white/5 transition-colors`}
                            title={showUnreadOnly ? 'Ver todos' : 'Ver não lidos'}
                        >
                            <Filter className="w-4 h-4" style={{ color: showUnreadOnly ? activeColor : undefined }} />
                        </button>
                    </div>
                </div>
                
                {/* Stats Panel */}
                {showStats && stats && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className={`text-sm font-semibold ${themeText} mb-3`}>Estatísticas Gerais</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold" style={{ color: activeColor }}>{stats.totalFeedbacks}</p>
                                <p className={`text-xs ${themeSecondary}`}>Total de feedbacks</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold" style={{ color: activeColor }}>{stats.recommendRate.toFixed(0)}%</p>
                                <p className={`text-xs ${themeSecondary}`}>Recomendariam</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <RatingDisplay label="Interface do site" value={Math.round(stats.averages.interface)} />
                            <RatingDisplay label="Facilidade de navegação" value={Math.round(stats.averages.navigation)} />
                            <RatingDisplay label="Velocidade e performance" value={Math.round(stats.averages.performance)} />
                            <RatingDisplay label="Design visual" value={Math.round(stats.averages.design)} />
                            <RatingDisplay label="Funcionalidades disponíveis" value={Math.round(stats.averages.features)} />
                            <RatingDisplay label="Experiência com a comunidade" value={Math.round(stats.averages.community)} />
                            <RatingDisplay label="Sistema de customização" value={Math.round(stats.averages.customization)} />
                            <RatingDisplay label="Suporte e ajuda" value={Math.round(stats.averages.support)} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Feedbacks List */}
            <div className="max-h-[500px] overflow-y-auto">
                {feedbacks.length === 0 ? (
                    <div className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className={themeSecondary}>
                            {showUnreadOnly ? 'Nenhum feedback não lido' : 'Nenhum feedback recebido'}
                        </p>
                    </div>
                ) : (
                    feedbacks.map((feedback) => (
                        <div 
                            key={feedback.id}
                            className={`border-b border-white/5 last:border-0 ${!feedback.isRead ? 'bg-white/5' : ''}`}
                        >
                            {/* Feedback Header */}
                            <button
                                onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {feedback.user.avatarUrl ? (
                                        <img 
                                            src={feedback.user.avatarUrl} 
                                            alt={feedback.user.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium ${themeText}`}>
                                                {feedback.user.displayName || feedback.user.name}
                                            </p>
                                            {!feedback.isRead && (
                                                <span 
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                                    style={{ backgroundColor: activeColor }}
                                                >
                                                    NOVO
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                feedback.user.membershipType === 'MGT' 
                                                    ? 'bg-tier-std-500/20 text-tier-std-400' 
                                                    : 'bg-gold-500/20 text-gold-400'
                                            }`}>
                                                {feedback.user.membershipType}
                                            </span>
                                        </div>
                                        <p className={`text-xs ${themeSecondary}`}>{formatDate(feedback.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-current" style={{ color: activeColor }} />
                                            <span className={`font-bold ${themeText}`}>{getAverageRating(feedback)}</span>
                                        </div>
                                        <p className={`text-xs ${themeSecondary}`}>
                                            {feedback.wouldRecommend ? (
                                                <span className="text-green-400 flex items-center gap-1">
                                                    <ThumbsUp className="w-3 h-3" /> Recomenda
                                                </span>
                                            ) : (
                                                <span className="text-red-400">Não recomenda</span>
                                            )}
                                        </p>
                                    </div>
                                    {expandedId === feedback.id ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>
                            
                            {/* Expanded Content */}
                            {expandedId === feedback.id && (
                                <div className="px-4 pb-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                                        {/* Ratings */}
                                        <div>
                                            <h5 className={`text-xs font-semibold ${themeText} mb-2`}>Avaliações</h5>
                                            <div className="grid grid-cols-2 gap-x-4">
                                                <RatingDisplay label="Interface do site" value={feedback.interfaceRating} />
                                                <RatingDisplay label="Facilidade de navegação" value={feedback.navigationRating} />
                                                <RatingDisplay label="Velocidade e performance" value={feedback.performanceRating} />
                                                <RatingDisplay label="Design visual" value={feedback.designRating} />
                                                <RatingDisplay label="Funcionalidades disponíveis" value={feedback.featuresRating} />
                                                <RatingDisplay label="Experiência com a comunidade" value={feedback.communityRating} />
                                                <RatingDisplay label="Sistema de customização" value={feedback.customizationRating} />
                                                <RatingDisplay label="Suporte e ajuda" value={feedback.supportRating} />
                                            </div>
                                        </div>
                                        
                                        {/* Text Responses */}
                                        {feedback.bugsFound && (
                                            <div>
                                                <h5 className={`text-xs font-semibold ${themeText} mb-1`}>Bugs encontrados</h5>
                                                <p className={`text-sm ${themeSecondary} bg-red-500/10 p-2 rounded-lg border border-red-500/20`}>
                                                    {feedback.bugsFound}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {feedback.favoriteFeature && (
                                            <div>
                                                <h5 className={`text-xs font-semibold ${themeText} mb-1`}>Funcionalidade favorita</h5>
                                                <p className={`text-sm ${themeSecondary}`}>{feedback.favoriteFeature}</p>
                                            </div>
                                        )}
                                        
                                        {feedback.missingFeature && (
                                            <div>
                                                <h5 className={`text-xs font-semibold ${themeText} mb-1`}>O que sente falta</h5>
                                                <p className={`text-sm ${themeSecondary}`}>{feedback.missingFeature}</p>
                                            </div>
                                        )}
                                        
                                        {feedback.overallExperience && (
                                            <div>
                                                <h5 className={`text-xs font-semibold ${themeText} mb-1`}>Experiência geral</h5>
                                                <p className={`text-sm ${themeSecondary}`}>{feedback.overallExperience}</p>
                                            </div>
                                        )}
                                        
                                        {feedback.suggestions && (
                                            <div>
                                                <h5 className={`text-xs font-semibold ${themeText} mb-1`}>Sugestões</h5>
                                                <p className={`text-sm ${themeSecondary} bg-blue-500/10 p-2 rounded-lg border border-blue-500/20`}>
                                                    {feedback.suggestions}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* Actions */}
                                        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                                            {!feedback.isRead && (
                                                <button
                                                    onClick={() => markAsRead(feedback.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium"
                                                    style={{ color: activeColor }}
                                                >
                                                    <Check className="w-3 h-3" />
                                                    Marcar como lido
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteFeedback(feedback.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs font-medium text-red-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
