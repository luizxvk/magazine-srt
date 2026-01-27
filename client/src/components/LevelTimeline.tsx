import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LevelTimelineProps {
    currentLevel: number;
    currentTrophies: number;
    currentXP?: number;
    xpForNextLevel?: number;
}

const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

const LevelTimeline: React.FC<LevelTimelineProps> = ({ currentLevel, currentXP = 0, xpForNextLevel = 1000 }) => {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

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
        </div>
    );
};

export default LevelTimeline;
