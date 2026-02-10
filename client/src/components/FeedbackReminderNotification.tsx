import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const REMINDER_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISMISS_KEY = 'feedback_reminder_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function FeedbackReminderNotification() {
    const { user, isVisitor, accentColor } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';
    
    const [show, setShow] = useState(false);
    const [canSubmit, setCanSubmit] = useState(false);
    
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const activeColor = accentColor || defaultColor;
    
    const checkFeedbackStatus = useCallback(async () => {
        // Don't show for visitors or if user is not logged in
        if (isVisitor || !user) return;
        
        // Check if dismissed recently
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            if (Date.now() - dismissedTime < DISMISS_DURATION) {
                return; // Still within dismiss period
            }
        }
        
        try {
            const response = await api.get('/feedback/can-submit');
            const canSubmitFeedback = response.data.canSubmit;
            setCanSubmit(canSubmitFeedback);
            
            if (canSubmitFeedback) {
                setShow(true);
            }
        } catch (error) {
            console.error('Error checking feedback status:', error);
        }
    }, [user, isVisitor]);
    
    useEffect(() => {
        // Initial check after 30 seconds (give time for page to load)
        const initialTimeout = setTimeout(() => {
            checkFeedbackStatus();
        }, 30 * 1000);
        
        // Check every 5 minutes
        const interval = setInterval(() => {
            checkFeedbackStatus();
        }, REMINDER_INTERVAL);
        
        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [checkFeedbackStatus]);
    
    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    };
    
    const handleGoToFeedback = () => {
        setShow(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
        navigate('/feedback');
    };
    
    // Don't render anything if not showing
    if (!canSubmit) return null;
    
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="fixed bottom-20 right-4 z-50 max-w-sm"
                >
                    <div 
                        className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
                        style={{ borderColor: `${activeColor}30` }}
                    >
                        {/* Close button */}
                        <button 
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                        
                        {/* Content */}
                        <div className="flex items-start gap-3 pr-6">
                            <div 
                                className="p-2.5 rounded-xl flex-shrink-0"
                                style={{ backgroundColor: `${activeColor}15` }}
                            >
                                <MessageSquare 
                                    className="w-5 h-5" 
                                    style={{ color: activeColor }} 
                                />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-sm mb-1">
                                    Queremos sua opinião!
                                </h4>
                                <p className="text-gray-400 text-xs leading-relaxed mb-3">
                                    Nos ajude a melhorar a plataforma enviando seu feedback sobre sua experiência.
                                </p>
                                
                                <button
                                    onClick={handleGoToFeedback}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                                    style={{ 
                                        backgroundColor: activeColor,
                                        color: '#000'
                                    }}
                                >
                                    <Send size={14} />
                                    Enviar Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
