import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, ArrowLeft, Star, ThumbsUp, ThumbsDown, Lightbulb, Bug, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LuxuriousBackground from '../components/LuxuriousBackground';
import api from '../services/api';

type FeedbackType = 'suggestion' | 'bug' | 'compliment' | 'complaint';

interface FeedbackOption {
    type: FeedbackType;
    label: string;
    icon: React.ReactNode;
    color: string;
}

const feedbackOptions: FeedbackOption[] = [
    { type: 'suggestion', label: 'Sugestão', icon: <Lightbulb className="w-5 h-5" />, color: '#f59e0b' },
    { type: 'bug', label: 'Bug/Problema', icon: <Bug className="w-5 h-5" />, color: '#ef4444' },
    { type: 'compliment', label: 'Elogio', icon: <ThumbsUp className="w-5 h-5" />, color: '#22c55e' },
    { type: 'complaint', label: 'Reclamação', icon: <ThumbsDown className="w-5 h-5" />, color: '#f97316' },
];

export default function FeedbackPage() {
    const navigate = useNavigate();
    const { user, accentColor } = useAuth();
    const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isMGT = user?.membershipType === 'MGT';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    const handleSubmit = async () => {
        if (!feedbackType || !message.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post('/feedback', {
                type: feedbackType,
                message: message.trim(),
                rating: rating > 0 ? rating : undefined
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = feedbackType && message.trim().length >= 10;

    return (
        <div className="min-h-screen">
            <LuxuriousBackground />
            <Header />

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 pb-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${color}15`, color }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <MessageSquare className="w-7 h-7" style={{ color }} />
                            Feedback
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Sua opinião nos ajuda a melhorar!
                        </p>
                    </div>
                </div>

                {submitted ? (
                    /* Success State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel rounded-2xl p-8 text-center"
                        style={{ borderColor: `${color}30` }}
                    >
                        <div
                            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: `${color}20` }}
                        >
                            <Check className="w-8 h-8" style={{ color }} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Obrigado pelo feedback!</h2>
                        <p className="text-gray-400 mb-6">
                            Sua mensagem foi enviada com sucesso. Agradecemos por nos ajudar a melhorar!
                        </p>
                        <button
                            onClick={() => navigate('/feed')}
                            className="px-6 py-2.5 rounded-lg font-medium text-white transition-all"
                            style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                        >
                            Voltar ao Feed
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Feedback Type Selection */}
                        <div className="glass-panel rounded-2xl p-6" style={{ borderColor: `${color}20` }}>
                            <h3 className="text-white font-medium mb-4">Tipo de Feedback</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {feedbackOptions.map((option) => (
                                    <button
                                        key={option.type}
                                        onClick={() => setFeedbackType(option.type)}
                                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                            feedbackType === option.type
                                                ? 'border-opacity-100'
                                                : 'border-white/10 hover:border-white/20'
                                        }`}
                                        style={{
                                            borderColor: feedbackType === option.type ? option.color : undefined,
                                            backgroundColor: feedbackType === option.type ? `${option.color}15` : 'transparent'
                                        }}
                                    >
                                        <div style={{ color: option.color }}>{option.icon}</div>
                                        <span className="text-white text-sm font-medium">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rating (Optional) */}
                        <div className="glass-panel rounded-2xl p-6" style={{ borderColor: `${color}20` }}>
                            <h3 className="text-white font-medium mb-4">Avaliação Geral (opcional)</h3>
                            <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${
                                                star <= rating ? 'fill-current' : ''
                                            }`}
                                            style={{ color: star <= rating ? color : '#4b5563' }}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-gray-500 text-xs mt-2">
                                {rating === 0 && 'Clique nas estrelas para avaliar'}
                                {rating === 1 && 'Muito ruim'}
                                {rating === 2 && 'Ruim'}
                                {rating === 3 && 'Regular'}
                                {rating === 4 && 'Bom'}
                                {rating === 5 && 'Excelente!'}
                            </p>
                        </div>

                        {/* Message */}
                        <div className="glass-panel rounded-2xl p-6" style={{ borderColor: `${color}20` }}>
                            <h3 className="text-white font-medium mb-4">Sua Mensagem</h3>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Descreva seu feedback em detalhes... (mínimo 10 caracteres)"
                                className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-opacity-50 resize-none"
                                style={{ borderColor: message.length >= 10 ? `${color}50` : undefined }}
                            />
                            <p className="text-right text-xs text-gray-500 mt-2">
                                {message.length} caracteres
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSubmitting}
                            className="w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: canSubmit ? `linear-gradient(135deg, ${color}, ${color}dd)` : '#374151'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Enviar Feedback</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
