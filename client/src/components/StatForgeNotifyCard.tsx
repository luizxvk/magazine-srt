import { useState } from 'react';
import { Bell, BellOff, Gamepad2, TrendingUp, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function StatForgeNotifyCard() {
    const { theme, accentColor, accentGradient, user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const [enabled, setEnabled] = useState(() => {
        return localStorage.getItem('statforge-notifications') === 'true';
    });
    const [justToggled, setJustToggled] = useState(false);

    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    const cardBg = theme === 'light'
        ? 'bg-white/70 border-gray-200/60'
        : 'bg-white/[0.03] border-white/[0.08]';

    const handleToggle = () => {
        const newVal = !enabled;
        setEnabled(newVal);
        localStorage.setItem('statforge-notifications', String(newVal));
        setJustToggled(true);
        setTimeout(() => setJustToggled(false), 2000);
    };

    if (enabled && !justToggled) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${cardBg} border rounded-2xl p-4 backdrop-blur-xl`}
        >
            <div className="flex items-center gap-3">
                <div
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                >
                    {enabled ? (
                        <Bell className="w-5 h-5" style={{ color }} />
                    ) : (
                        <BellOff className="w-5 h-5" style={{ color }} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {justToggled && enabled ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                            >
                                <p className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Notificações ativadas!
                                </p>
                                <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                                    Você será notificado sobre mudanças de rank e stats
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="prompt"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <p className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Ativar notificações?
                                </p>
                                <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                                    Receba alertas de rank ups, recordes e mudanças
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleToggle}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        enabled
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'text-white hover:opacity-90'
                    }`}
                    style={!enabled ? { background: accentGradient || color } : {}}
                >
                    {enabled ? 'Ativado ✓' : 'Ativar'}
                </button>
            </div>

            {/* Feature hints */}
            {!enabled && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Trophy className="w-3 h-3" />
                        <span>Rank ups</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <TrendingUp className="w-3 h-3" />
                        <span>Novos recordes</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Gamepad2 className="w-3 h-3" />
                        <span>Stats atualizadas</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
