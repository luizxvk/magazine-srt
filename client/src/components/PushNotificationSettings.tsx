import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, BellRing, CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react';
import pushService from '../services/pushNotificationService';

interface PushNotificationSettingsProps {
    onClose?: () => void;
    compact?: boolean;
}

export default function PushNotificationSettings({ onClose, compact = false }: PushNotificationSettingsProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const supported = pushService.isNotificationSupported();
            setIsSupported(supported);
            
            if (supported) {
                const permStatus = await pushService.getPermissionStatus();
                setPermission(permStatus);
                const subscribed = await pushService.isSubscribed();
                setIsSubscribed(subscribed);
            }
        } catch (error) {
            console.error('Error checking push status:', error);
        }
        setLoading(false);
    };

    const handleEnable = async () => {
        setActionLoading(true);
        setMessage(null);
        
        try {
            // Request permission
            const perm = await pushService.requestPermission();
            setPermission(perm);
            
            if (perm === 'granted') {
                // Register service worker and subscribe
                await pushService.registerServiceWorker();
                const subscription = await pushService.subscribe();
                
                if (subscription) {
                    setIsSubscribed(true);
                    setMessage({ type: 'success', text: 'Notificações ativadas com sucesso!' });
                } else {
                    setMessage({ type: 'error', text: 'Falha ao ativar notificações' });
                }
            } else if (perm === 'denied') {
                setMessage({ type: 'error', text: 'Permissão negada. Verifique as configurações do navegador.' });
            }
        } catch (error) {
            console.error('Error enabling push:', error);
            setMessage({ type: 'error', text: 'Erro ao ativar notificações' });
        }
        
        setActionLoading(false);
    };

    const handleDisable = async () => {
        setActionLoading(true);
        setMessage(null);
        
        try {
            const success = await pushService.unsubscribe();
            if (success) {
                setIsSubscribed(false);
                setMessage({ type: 'success', text: 'Notificações desativadas' });
            } else {
                setMessage({ type: 'error', text: 'Falha ao desativar notificações' });
            }
        } catch (error) {
            console.error('Error disabling push:', error);
            setMessage({ type: 'error', text: 'Erro ao desativar notificações' });
        }
        
        setActionLoading(false);
    };

    const handleTest = async () => {
        setActionLoading(true);
        setMessage(null);
        
        try {
            const success = await pushService.sendTestNotification();
            if (success) {
                setMessage({ type: 'success', text: 'Notificação de teste enviada!' });
            } else {
                setMessage({ type: 'error', text: 'Falha ao enviar teste. Ative as notificações primeiro.' });
            }
        } catch (error) {
            console.error('Error sending test:', error);
            setMessage({ type: 'error', text: 'Erro ao enviar notificação de teste' });
        }
        
        setActionLoading(false);
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${compact ? 'py-2' : 'py-8'}`}>
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
        );
    }

    if (!isSupported) {
        const platformInfo = pushService.getPlatformInfo();
        return (
            <div className={`${compact ? 'p-3' : 'p-6'} bg-amber-500/10 border border-amber-500/30 rounded-xl`}>
                <div className="flex items-center gap-3 text-amber-400">
                    <BellOff className="w-5 h-5" />
                    <div className="text-sm">
                        <p>Notificações push não estão disponíveis.</p>
                        {platformInfo.isNative && (
                            <p className="text-amber-300/70 mt-1">Configure o Firebase para ativar no app.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isSubscribed ? (
                        <BellRing className="w-5 h-5 text-emerald-400" />
                    ) : (
                        <Bell className="w-5 h-5 text-zinc-400" />
                    )}
                    <span className="text-sm text-zinc-200">
                        Notificações Push
                    </span>
                </div>
                
                <button
                    onClick={isSubscribed ? handleDisable : handleEnable}
                    disabled={actionLoading || permission === 'denied'}
                    className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                        isSubscribed 
                            ? 'bg-emerald-500' 
                            : 'bg-gray-600'
                    } ${actionLoading || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <div
                        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                            isSubscribed ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
                        }`}
                    />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    Notificações Push
                </h3>
                {onClose && (
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        ✕
                    </button>
                )}
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-400">
                Receba notificações mesmo quando o site estiver fechado. 
                Fique sabendo de novas mensagens, comentários e eventos em tempo real.
            </p>

            {/* Status */}
            <div className={`p-4 rounded-xl border ${
                isSubscribed 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : permission === 'denied'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-zinc-800/50 border-zinc-700'
            }`}>
                <div className="flex items-center gap-3">
                    {isSubscribed ? (
                        <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400">Notificações ativadas</span>
                        </>
                    ) : permission === 'denied' ? (
                        <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">Permissão bloqueada pelo navegador</span>
                        </>
                    ) : (
                        <>
                            <BellOff className="w-5 h-5 text-zinc-400" />
                            <span className="text-zinc-400">Notificações desativadas</span>
                        </>
                    )}
                </div>
            </div>

            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-lg text-sm ${
                            message.type === 'success' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
                {isSubscribed ? (
                    <>
                        <button
                            onClick={handleDisable}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <BellOff className="w-4 h-4" />
                            )}
                            <span>Desativar</span>
                        </button>
                        <button
                            onClick={handleTest}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <TestTube className="w-4 h-4" />
                            )}
                            <span>Testar</span>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleEnable}
                        disabled={actionLoading || permission === 'denied'}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <BellRing className="w-4 h-4" />
                        )}
                        <span>Ativar Notificações</span>
                    </button>
                )}
            </div>

            {/* Browser permission hint */}
            {permission === 'denied' && (
                <p className="text-xs text-zinc-500">
                    Para reativar, clique no ícone de cadeado na barra de endereço e permita notificações.
                </p>
            )}
        </div>
    );
}
