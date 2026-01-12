import { AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface LoginErrorPopupProps {
    message: string;
    onClose: () => void;
    autoCloseDuration?: number;
}

export default function LoginErrorPopup({ message, onClose, autoCloseDuration = 4000 }: LoginErrorPopupProps) {
    useEffect(() => {
        if (autoCloseDuration > 0) {
            const timer = setTimeout(onClose, autoCloseDuration);
            return () => clearTimeout(timer);
        }
    }, [autoCloseDuration, onClose]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 pointer-events-none">
            <div 
                className="pointer-events-auto animate-slideDown bg-gradient-to-br from-red-500/95 to-red-600/95 backdrop-blur-xl border border-red-400/30 rounded-2xl shadow-2xl shadow-red-900/50 px-6 py-4 max-w-md mx-4"
                role="alert"
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1">
                            Erro de Autenticação
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                            {message}
                        </p>
                    </div>
                    
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                        aria-label="Fechar notificação"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-white/40 rounded-full animate-shrinkWidth"
                        style={{ animationDuration: `${autoCloseDuration}ms` }}
                    />
                </div>
            </div>
            
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes shrinkWidth {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
                
                .animate-shrinkWidth {
                    animation: shrinkWidth linear;
                }
            `}</style>
        </div>
    );
}
