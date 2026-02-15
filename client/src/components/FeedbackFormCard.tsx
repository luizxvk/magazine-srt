import { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, CheckCircle, Clock, Bug, Heart, Lightbulb, Users, Palette, HelpCircle, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VisitorBlockPopup from './VisitorBlockPopup';
import Loader from './Loader';

interface FeedbackFormCardProps {
    onClose?: () => void;
}

export default function FeedbackFormCard({ onClose }: FeedbackFormCardProps) {
    const { user, theme, accentColor, accentGradient, isVisitor, showError, showWarning } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    
    const [canSubmit, setCanSubmit] = useState(true);
    const [nextAllowedDate, setNextAllowedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showVisitorBlock, setShowVisitorBlock] = useState(false);
    const totalSteps = 3;
    
    // Form data
    const [formData, setFormData] = useState({
        // Ratings
        interfaceRating: 0,
        navigationRating: 0,
        performanceRating: 0,
        designRating: 0,
        featuresRating: 0,
        communityRating: 0,
        customizationRating: 0,
        supportRating: 0,
        // Text
        bugsFound: '',
        favoriteFeature: '',
        missingFeature: '',
        wouldRecommend: true,
        overallExperience: '',
        suggestions: ''
    });
    
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const activeColor = accentColor || defaultColor;
    
    const themeBorder = theme === 'light' ? 'border-gray-200' : (isMGT ? 'border-emerald-500/30' : 'border-gold-500/30');
    const themeBg = theme === 'light' ? 'bg-white/90' : (isMGT ? 'bg-emerald-950/30' : 'bg-black/30');
    const themeGlow = isMGT
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]'
        : 'shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
    
    useEffect(() => {
        checkCanSubmit();
    }, []);
    
    const checkCanSubmit = async () => {
        try {
            const response = await api.get('/feedback/can-submit');
            setCanSubmit(response.data.canSubmit);
            if (!response.data.canSubmit) {
                setNextAllowedDate(new Date(response.data.nextAllowedDate));
            }
        } catch (error) {
            console.error('Error checking feedback status:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleRatingChange = (field: string, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSubmit = async () => {
        // Validate all ratings are filled
        const ratingFields = [
            'interfaceRating', 'navigationRating', 'performanceRating', 
            'designRating', 'featuresRating', 'communityRating', 
            'customizationRating', 'supportRating'
        ];
        
        for (const field of ratingFields) {
            if (formData[field as keyof typeof formData] === 0) {
                showWarning('Avaliações pendentes', 'Preencha todas as avaliações de 1 a 5.');
                return;
            }
        }
        
        setSubmitting(true);
        try {
            await api.post('/feedback', formData);
            setSubmitted(true);
        } catch (error: any) {
            showError('Erro ao enviar feedback', error.response?.data?.error);
        } finally {
            setSubmitting(false);
        }
    };
    
    const RatingStars = ({ field, label, icon: Icon }: { field: string; label: string; icon: any }) => {
        const value = formData[field as keyof typeof formData] as number;
        
        return (
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: activeColor }} />
                    <span className={`text-sm font-medium ${themeText}`}>{label}</span>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(field, star)}
                            className="p-1 transition-transform hover:scale-110"
                        >
                            <Star 
                                className={`w-6 h-6 transition-colors ${
                                    star <= value 
                                        ? 'fill-current' 
                                        : 'text-gray-600'
                                }`}
                                style={{ color: star <= value ? activeColor : undefined }}
                            />
                        </button>
                    ))}
                    <span className={`ml-2 text-xs ${themeSecondary} self-center`}>
                        {value === 0 ? 'Não avaliado' : 
                         value === 1 ? 'Muito ruim' :
                         value === 2 ? 'Ruim' :
                         value === 3 ? 'Regular' :
                         value === 4 ? 'Bom' : 'Muito bom'}
                    </span>
                </div>
            </div>
        );
    };
    
    const formatTimeRemaining = (date: Date) => {
        const diff = date.getTime() - Date.now();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} dia${days > 1 ? 's' : ''} e ${hours}h`;
        return `${hours} hora${hours > 1 ? 's' : ''}`;
    };
    
    if (loading) {
        return (
            <div className={`rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} ${themeBg} backdrop-blur-xl p-6`}>
                <div className="flex items-center justify-center py-8">
                    <Loader size="sm" />
                </div>
            </div>
        );
    }

    // Block visitors
    if (isVisitor) {
        return (
            <>
                <button
                    onClick={() => setShowVisitorBlock(true)}
                    className={`w-full rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} ${themeBg} backdrop-blur-xl p-6 text-center hover:border-opacity-50 transition-all`}
                >
                    <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: activeColor }} />
                    <h3 className={`text-lg font-bold ${themeText} mb-2`}>Enviar Feedback</h3>
                    <p className={`${themeSecondary} text-sm`}>
                        Compartilhe sua opinião sobre a plataforma
                    </p>
                </button>
                <VisitorBlockPopup 
                    isOpen={showVisitorBlock} 
                    onClose={() => setShowVisitorBlock(false)} 
                    featureName="enviar feedback"
                />
            </>
        );
    }
    
    if (submitted) {
        return (
            <div className={`rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} ${themeBg} backdrop-blur-xl p-6 text-center`}>
                <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: activeColor }} />
                <h3 className={`text-xl font-bold ${themeText} mb-2`}>Obrigado pelo seu feedback!</h3>
                <p className={`${themeSecondary} mb-4`}>
                    Sua opinião é muito importante para nós. Você ganhou <span style={{ color: activeColor }} className="font-bold">50 Zions</span> como agradecimento!
                </p>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: activeColor }}
                    >
                        Fechar
                    </button>
                )}
            </div>
        );
    }
    
    if (!canSubmit && nextAllowedDate) {
        return (
            <div className={`rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} ${themeBg} backdrop-blur-xl p-6`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${activeColor}20` }}>
                        <Clock className="w-6 h-6" style={{ color: activeColor }} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${themeText}`}>Feedback Enviado</h3>
                        <p className={`text-xs ${themeSecondary}`}>Obrigado por compartilhar sua opinião!</p>
                    </div>
                </div>
                <p className={`${themeSecondary} text-sm`}>
                    Você já enviou um feedback recentemente. Poderá enviar novamente em{' '}
                    <span style={{ color: activeColor }} className="font-semibold">
                        {formatTimeRemaining(nextAllowedDate)}
                    </span>
                </p>
            </div>
        );
    }
    
    return (
        <div className={`rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${themeBorder}`} ${themeGlow} ${themeBg} backdrop-blur-xl overflow-hidden`}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${activeColor}20` }}>
                        <MessageSquare className="w-6 h-6" style={{ color: activeColor }} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${themeText}`}>Seu Feedback</h3>
                        <p className={`text-xs ${themeSecondary}`}>Ajude-nos a melhorar • Ganhe 50 Zions</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                )}
            </div>
            
            {/* Progress Bar */}
            <div className="px-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${themeSecondary}`}>Etapa {currentStep} de {totalSteps}</span>
                    <span className={`text-xs ${themeSecondary}`}>{Math.round((currentStep / totalSteps) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: activeColor }}
                    />
                </div>
            </div>
            
            {/* Form Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
                {currentStep === 1 && (
                    <div className="space-y-1">
                        <h4 className={`text-sm font-semibold ${themeText} mb-4`}>Avaliações Gerais</h4>
                        <RatingStars field="interfaceRating" label="Interface do site" icon={Star} />
                        <RatingStars field="navigationRating" label="Facilidade de navegação" icon={Star} />
                        <RatingStars field="performanceRating" label="Velocidade e performance" icon={Star} />
                        <RatingStars field="designRating" label="Design visual" icon={Palette} />
                    </div>
                )}
                
                {currentStep === 2 && (
                    <div className="space-y-1">
                        <h4 className={`text-sm font-semibold ${themeText} mb-4`}>Funcionalidades e Comunidade</h4>
                        <RatingStars field="featuresRating" label="Funcionalidades disponíveis" icon={Lightbulb} />
                        <RatingStars field="communityRating" label="Experiência com a comunidade" icon={Users} />
                        <RatingStars field="customizationRating" label="Sistema de customização" icon={Palette} />
                        <RatingStars field="supportRating" label="Suporte e ajuda" icon={HelpCircle} />
                    </div>
                )}
                
                {currentStep === 3 && (
                    <div className="space-y-4">
                        <h4 className={`text-sm font-semibold ${themeText} mb-4`}>Conte-nos mais</h4>
                        
                        {/* Bugs */}
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium ${themeText} mb-2`}>
                                <Bug className="w-4 h-4" style={{ color: activeColor }} />
                                Encontrou algum bug que te incomodou?
                            </label>
                            <textarea
                                value={formData.bugsFound}
                                onChange={(e) => setFormData(prev => ({ ...prev, bugsFound: e.target.value }))}
                                placeholder="Descreva os bugs que encontrou (opcional)"
                                className={`w-full px-3 py-2 rounded-lg bg-white/5 border ${themeBorder} ${themeText} text-sm resize-none focus:outline-none focus:ring-2`}
                                style={{ '--tw-ring-color': activeColor } as any}
                                rows={2}
                            />
                        </div>
                        
                        {/* Favorite Feature */}
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium ${themeText} mb-2`}>
                                <Heart className="w-4 h-4" style={{ color: activeColor }} />
                                Qual sua funcionalidade favorita?
                            </label>
                            <input
                                type="text"
                                value={formData.favoriteFeature}
                                onChange={(e) => setFormData(prev => ({ ...prev, favoriteFeature: e.target.value }))}
                                placeholder="Ex: Stories, Customização, Grupos..."
                                className={`w-full px-3 py-2 rounded-lg bg-white/5 border ${themeBorder} ${themeText} text-sm focus:outline-none focus:ring-2`}
                                style={{ '--tw-ring-color': activeColor } as any}
                            />
                        </div>
                        
                        {/* Missing Feature */}
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium ${themeText} mb-2`}>
                                <Lightbulb className="w-4 h-4" style={{ color: activeColor }} />
                                O que você sente falta no site?
                            </label>
                            <textarea
                                value={formData.missingFeature}
                                onChange={(e) => setFormData(prev => ({ ...prev, missingFeature: e.target.value }))}
                                placeholder="Funcionalidades que gostaria de ver (opcional)"
                                className={`w-full px-3 py-2 rounded-lg bg-white/5 border ${themeBorder} ${themeText} text-sm resize-none focus:outline-none focus:ring-2`}
                                style={{ '--tw-ring-color': activeColor } as any}
                                rows={2}
                            />
                        </div>
                        
                        {/* Would Recommend */}
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium ${themeText} mb-2`}>
                                <Users className="w-4 h-4" style={{ color: activeColor }} />
                                Você recomendaria o site para um amigo?
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${
                                        formData.wouldRecommend 
                                            ? 'border-green-500 bg-green-500/20 text-green-400' 
                                            : `border-white/10 ${themeSecondary} hover:bg-white/5`
                                    }`}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    Sim
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${
                                        !formData.wouldRecommend 
                                            ? 'border-red-500 bg-red-500/20 text-red-400' 
                                            : `border-white/10 ${themeSecondary} hover:bg-white/5`
                                    }`}
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    Não
                                </button>
                            </div>
                        </div>
                        
                        {/* Overall Experience */}
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium ${themeText} mb-2`}>
                                <MessageSquare className="w-4 h-4" style={{ color: activeColor }} />
                                Como foi sua experiência geral?
                            </label>
                            <textarea
                                value={formData.overallExperience}
                                onChange={(e) => setFormData(prev => ({ ...prev, overallExperience: e.target.value }))}
                                placeholder="Conte-nos sobre sua experiência usando o site (opcional)"
                                className={`w-full px-3 py-2 rounded-lg bg-white/5 border ${themeBorder} ${themeText} text-sm resize-none focus:outline-none focus:ring-2`}
                                style={{ '--tw-ring-color': activeColor } as any}
                                rows={2}
                            />
                        </div>
                        
                        {/* Suggestions */}
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium ${themeText} mb-2`}>
                                <Lightbulb className="w-4 h-4" style={{ color: activeColor }} />
                                Sugestões de melhoria
                            </label>
                            <textarea
                                value={formData.suggestions}
                                onChange={(e) => setFormData(prev => ({ ...prev, suggestions: e.target.value }))}
                                placeholder="Alguma sugestão para melhorarmos? (opcional)"
                                className={`w-full px-3 py-2 rounded-lg bg-white/5 border ${themeBorder} ${themeText} text-sm resize-none focus:outline-none focus:ring-2`}
                                style={{ '--tw-ring-color': activeColor } as any}
                                rows={2}
                            />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 flex justify-between gap-3">
                {currentStep > 1 ? (
                    <button
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className={`px-4 py-2 rounded-lg border ${themeBorder} ${themeSecondary} hover:bg-white/5 transition-colors text-sm font-medium`}
                    >
                        Voltar
                    </button>
                ) : (
                    <div />
                )}
                
                {currentStep < totalSteps ? (
                    <button
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 text-sm flex items-center gap-2"
                        style={{ backgroundColor: activeColor }}
                    >
                        Próximo
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 text-sm flex items-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: activeColor }}
                    >
                        {submitting ? (
                            <>
                                <Loader size="sm" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Enviar Feedback
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
