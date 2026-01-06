import { LogOut, ShieldAlert } from 'lucide-react';

interface SessionExpiredModalProps {
    isOpen: boolean;
    onConfirm: () => void;
}

export default function SessionExpiredModal({ isOpen, onConfirm }: SessionExpiredModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop com blur */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* Modal com Liquid Glass */}
            <div className="relative w-full max-w-sm animate-in fade-in zoom-in duration-300">
                {/* Glass Effect Container */}
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                    {/* Gradient overlay para efeito glass */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
                    
                    {/* Brilho superior */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                    {/* Conteúdo */}
                    <div className="relative p-6 text-center">
                        {/* Ícone */}
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center mb-4">
                            <ShieldAlert className="w-8 h-8 text-red-400" />
                        </div>

                        {/* Título */}
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Sessão Encerrada
                        </h2>

                        {/* Descrição */}
                        <p className="text-white/70 text-sm mb-6 leading-relaxed">
                            Sua sessão foi encerrada pois você fez login em outro dispositivo.
                        </p>

                        {/* Botão */}
                        <button
                            onClick={onConfirm}
                            className="w-full py-3 px-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <LogOut className="w-5 h-5" />
                            Fazer Login Novamente
                        </button>
                    </div>

                    {/* Brilho inferior */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
            </div>
        </div>
    );
}
