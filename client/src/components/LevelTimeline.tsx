import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Crown, Sparkles, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface LevelTimelineProps {
    currentLevel: number;
    currentTrophies: number;
    currentXP?: number;
    xpForNextLevel?: number;
}

const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

const LevelTimeline: React.FC<LevelTimelineProps> = ({ currentLevel, currentXP = 0, xpForNextLevel = 1000 }) => {
    const { user, theme, updateUser } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [showPrestigeModal, setShowPrestigeModal] = useState(false);
    const [showPrestigeInfo, setShowPrestigeInfo] = useState(false);
    const [prestigeLoading, setPrestigeLoading] = useState(false);
    const [prestigeInfo, setPrestigeInfo] = useState<any>(null);
    const canPrestigeNow = currentLevel >= 30 && (user?.prestigeLevel || 0) < 10;

    // Calculate XP progress percentage
    const xpProgress = xpForNextLevel > 0 ? Math.min((currentXP / xpForNextLevel) * 100, 100) : 0;

    // Theme Colors
    const themeProgressGradient = isMGT
        ? 'from-emerald-600 via-emerald-500 to-emerald-400'
        : 'from-yellow-600 via-yellow-400 to-yellow-200';

    const themeShadow = isMGT
        ? 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        : 'shadow-[0_0_15px_rgba(234,179,8,0.3)]';

    const themeNodeReached = isMGT
        ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
        : 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]';

    const themeNodeUnreached = theme === 'light'
        ? 'bg-gray-200 border-gray-300 text-gray-400'
        : 'bg-gray-900 border-gray-700 text-gray-500';

    const themeRewardIconReached = isMGT
        ? 'bg-emerald-500/20 text-emerald-500'
        : 'bg-yellow-500/20 text-yellow-400';

    const themeRewardIconUnreached = theme === 'light'
        ? 'bg-gray-200 text-gray-400'
        : 'bg-gray-800/50 text-gray-600';

    const themeTextReached = isMGT ? 'text-emerald-500' : 'text-yellow-400';
    const themeTextUnreached = theme === 'light' ? 'text-gray-400' : 'text-gray-600';

    const getLevelReward = (level: number) => {
        if (level === 5) return { icon: Star, label: 'Bronze' };
        if (level === 10) return { icon: Star, label: 'Prata' };
        if (level === 15) return { icon: Star, label: 'Ouro' };
        if (level === 20) return { icon: Trophy, label: 'Platina' };
        if (level === 25) return { icon: Crown, label: 'Diamante' };
        if (level === 30) return { icon: Crown, label: 'Lenda' };
        return null;
    };

    return (
        <div className="w-full">
            {/* XP Progress Bar */}
            <div className="mb-4 px-4">
                <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-medium ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        Nível {currentLevel}
                    </span>
                    <span className="text-xs text-gray-400">
                        {currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                    </span>
                </div>
                <div className={`w-full h-3 rounded-full ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800/50'} overflow-hidden`}>
                    <motion.div
                        className={`h-full bg-gradient-to-r ${themeProgressGradient} rounded-full ${themeShadow}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
            </div>
            
            {/* Level Timeline */}
            <div className="overflow-x-auto overflow-y-hidden pb-4 pt-2 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="min-w-[1200px] px-4 md:px-8">
                    <div className="relative py-8">
                        {/* Reward Labels at Top */}
                        <div className="absolute top-0 left-0 w-full flex justify-between items-center px-1">
                            {LEVELS.map((level) => {
                                const reward = getLevelReward(level);
                                const isReached = level <= currentLevel;
                                if (!reward) return <div key={level} className="w-7" />;
                                const Icon = reward.icon;
                                return (
                                    <div key={level} className="flex flex-col items-center w-7">
                                        <div className={`p-1 rounded-full ${isReached ? themeRewardIconReached : themeRewardIconUnreached}`}>
                                            <Icon size={10} />
                                        </div>
                                        <span className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${isReached ? themeTextReached : themeTextUnreached}`}>
                                            {reward.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress Bar */}
                        <div className="relative mt-10 mb-6">
                            <div className={`absolute top-1/2 left-0 w-full h-2 rounded-full -translate-y-1/2 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800/50'}`} />
                            <motion.div
                                className={`absolute top-1/2 left-0 h-2 bg-gradient-to-r ${themeProgressGradient} rounded-full -translate-y-1/2 z-10 ${themeShadow}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentLevel - 1) / (LEVELS.length - 1)) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                            
                            {/* Level Nodes */}
                            <div className="relative z-20 flex justify-between items-center">
                                {LEVELS.map((level) => {
                                    const isReached = level <= currentLevel;
                                    const isCurrent = level === currentLevel;

                                    return (
                                        <motion.div
                                            key={level}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                isReached ? themeNodeReached : themeNodeUnreached
                                            } ${isCurrent ? `scale-110 ring-2 ${isMGT ? 'ring-emerald-500/40' : 'ring-yellow-500/40'} z-30` : 'z-20'}`}
                                            whileHover={{ scale: 1.15 }}
                                        >
                                            <span className="text-[10px] font-bold">{level}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prestige Section */}
            {canPrestigeNow && (
                <div className="px-4 mt-2 relative z-10">
                    <motion.button
                        onClick={async () => {
                            try {
                                const { data } = await api.get('/gamification/prestige/status');
                                setPrestigeInfo(data);
                            } catch { /* ignore */ }
                            setShowPrestigeModal(true);
                        }}
                        className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest border transition-all ${
                            isMGT
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400/30 text-white hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-400/30 text-black hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Sparkles className="inline w-4 h-4 mr-2" />
                        Prestigiar ⭐ {(user?.prestigeLevel || 0) + 1}
                    </motion.button>
                </div>
            )}

            {/* Prestige stars display */}
            {(user?.prestigeLevel || 0) > 0 && (
                <div className="px-4 mt-2 flex items-center justify-center gap-2 relative z-10">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Prestígio</span>
                    <span className="text-sm">{'⭐'.repeat(Math.min(user?.prestigeLevel || 0, 10))}</span>
                    {(user?.prestigeLevel || 0) > 0 && (
                        <span className={`text-[10px] ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            +{(user?.prestigeLevel || 0) * 5}% XP
                        </span>
                    )}
                    <button
                        onClick={() => setShowPrestigeInfo(true)}
                        className={`p-1 rounded-full hover:bg-white/10 transition-colors ${isMGT ? 'text-emerald-400 hover:text-emerald-300' : 'text-yellow-400 hover:text-yellow-300'}`}
                        title="Como funciona o Prestígio?"
                    >
                        <Info size={14} />
                    </button>
                </div>
            )}

            {/* Prestige info button when no prestige yet but eligible */}
            {(user?.prestigeLevel || 0) === 0 && currentLevel >= 25 && (
                <div className="px-4 mt-2 flex items-center justify-center relative z-10">
                    <button
                        onClick={() => setShowPrestigeInfo(true)}
                        className={`flex items-center gap-1.5 text-xs ${
                            isMGT ? 'text-emerald-400 hover:text-emerald-300' : 'text-yellow-400 hover:text-yellow-300'
                        } transition-colors`}
                    >
                        <Info size={14} />
                        <span>O que é Prestígio?</span>
                    </button>
                </div>
            )}

            {/* Prestige Info Modal */}
            <AnimatePresence>
                {showPrestigeInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPrestigeInfo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-lg rounded-2xl p-6 border max-h-[85vh] overflow-y-auto ${
                                theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/95 border-white/10'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${isMGT ? 'bg-emerald-500/20' : 'bg-yellow-500/20'}`}>
                                        <Sparkles className={isMGT ? 'text-emerald-400' : 'text-yellow-400'} size={24} />
                                    </div>
                                    <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                        Sistema de Prestígio
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowPrestigeInfo(false)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        theme === 'light' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-gray-400'
                                    }`}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* What is Prestige */}
                                <div className={`rounded-xl p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        O que é Prestígio?
                                    </h4>
                                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                                        Prestígio é um sistema de progressão avançada. Ao atingir o <strong>Nível 30</strong>, você pode 
                                        reiniciar sua jornada em troca de <strong>recompensas exclusivas</strong> e <strong>bônus permanentes</strong>.
                                    </p>
                                </div>

                                {/* How it works */}
                                <div className={`rounded-xl p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        Como Funciona?
                                    </h4>
                                    <ul className={`text-sm space-y-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                                        <li className="flex items-start gap-2">
                                            <span className="text-lg">1️⃣</span>
                                            <span>Alcance o <strong>Nível 30</strong> (nível máximo)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-lg">2️⃣</span>
                                            <span>Clique em <strong>"Prestigiar"</strong> para ativar</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-lg">3️⃣</span>
                                            <span>Seu nível volta ao <strong>1</strong>, mas você ganha:</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Rewards */}
                                <div className={`rounded-xl p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        Recompensas por Prestígio
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className={`p-3 rounded-lg ${isMGT ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                            <div className="text-2xl mb-1">💰</div>
                                            <div className={`font-bold ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>Zions Cash</div>
                                            <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>+Z$5 por prestígio</div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isMGT ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                            <div className="text-2xl mb-1">⚡</div>
                                            <div className={`font-bold ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>Bônus de XP</div>
                                            <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>+5% permanente</div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isMGT ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                            <div className="text-2xl mb-1">⭐</div>
                                            <div className={`font-bold ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>Estrela</div>
                                            <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Exibida no perfil</div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isMGT ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                            <div className="text-2xl mb-1">🏆</div>
                                            <div className={`font-bold ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>Status</div>
                                            <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Reconhecimento</div>
                                        </div>
                                    </div>
                                </div>

                                {/* XP Bonus table */}
                                <div className={`rounded-xl p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        Tabela de Bônus
                                    </h4>
                                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                                            <div key={p} className={`p-2 rounded-lg ${
                                                (user?.prestigeLevel || 0) >= p 
                                                    ? (isMGT ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-yellow-500/20 border border-yellow-500/30')
                                                    : (theme === 'light' ? 'bg-gray-200' : 'bg-white/5')
                                            }`}>
                                                <div className="text-lg">⭐{p}</div>
                                                <div className={`font-bold ${
                                                    (user?.prestigeLevel || 0) >= p
                                                        ? (isMGT ? 'text-emerald-400' : 'text-yellow-400')
                                                        : (theme === 'light' ? 'text-gray-500' : 'text-gray-500')
                                                }`}>
                                                    +{p * 5}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Important notes */}
                                <div className={`rounded-xl p-4 border ${
                                    theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                                }`}>
                                    <h4 className="text-sm font-bold uppercase tracking-wider mb-2 text-amber-500">
                                        ⚠️ Importante
                                    </h4>
                                    <ul className={`text-sm space-y-1 ${theme === 'light' ? 'text-amber-700' : 'text-amber-300/80'}`}>
                                        <li>• O prestígio é <strong>irreversível</strong></li>
                                        <li>• Máximo de <strong>10 prestígios</strong> (50% de bônus de XP)</li>
                                        <li>• Seu nível e XP voltam a 0, mas troféus e conquistas permanecem</li>
                                        <li>• Super Crate, badges e itens cosméticos são mantidos</li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPrestigeInfo(false)}
                                className={`w-full mt-4 py-2.5 rounded-xl text-sm font-medium border ${
                                    theme === 'light' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-white/10 text-gray-400 hover:bg-white/5'
                                }`}
                            >
                                Entendi
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prestige Confirmation Modal */}
            <AnimatePresence>
                {showPrestigeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !prestigeLoading && setShowPrestigeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-md rounded-2xl p-6 border ${
                                theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/95 border-white/10'
                            }`}
                        >
                            <div className="text-center mb-6">
                                <div className="text-5xl mb-3">⭐</div>
                                <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                    Prestigiar para Nível {(user?.prestigeLevel || 0) + 1}
                                </h3>
                                <p className="text-sm text-gray-400 mt-2">
                                    Seu nível e XP serão resetados para 1, mas você ganha recompensas exclusivas!
                                </p>
                            </div>

                            <div className={`rounded-xl p-4 mb-6 ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isMGT ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    Recompensas
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className={`flex justify-between ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                        <span>Zions Cash</span>
                                        <span className="font-bold">Z$ {prestigeInfo?.reward || '???'}</span>
                                    </li>
                                    <li className={`flex justify-between ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                        <span>Bônus de XP</span>
                                        <span className="font-bold">+{prestigeInfo?.xpBonus || ((user?.prestigeLevel || 0) + 1) * 5}%</span>
                                    </li>
                                    <li className={`flex justify-between ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                        <span>Estrela de Prestígio</span>
                                        <span className="font-bold">⭐ ×{(user?.prestigeStars || 0) + 1}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPrestigeModal(false)}
                                    disabled={prestigeLoading}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${
                                        theme === 'light' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-white/10 text-gray-400 hover:bg-white/5'
                                    }`}
                                >
                                    Cancelar
                                </button>
                                <motion.button
                                    onClick={async () => {
                                        setPrestigeLoading(true);
                                        try {
                                            const { data } = await api.post('/gamification/prestige');
                                            updateUser({
                                                level: 1,
                                                xp: 0,
                                                prestigeLevel: data.prestige,
                                                prestigeStars: data.stars,
                                                zionsCash: (user?.zionsCash || 0) + data.cashReward,
                                            });
                                            setShowPrestigeModal(false);
                                        } catch (err: any) {
                                            alert(err?.response?.data?.error || 'Erro ao prestigiar');
                                        } finally {
                                            setPrestigeLoading(false);
                                        }
                                    }}
                                    disabled={prestigeLoading}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider ${
                                        isMGT
                                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white'
                                            : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {prestigeLoading ? 'Prestigiando...' : 'Confirmar Prestígio'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LevelTimeline;
