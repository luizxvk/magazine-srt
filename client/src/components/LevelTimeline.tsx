import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Crown, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LevelTimelineProps {
    currentLevel: number;
    currentTrophies: number;
}

const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

const LevelTimeline: React.FC<LevelTimelineProps> = ({ currentLevel }) => {
    const { user, theme } = useAuth();
    const isSRT = user?.membershipType === 'SRT';

    // Theme Colors
    const themeProgressGradient = isSRT
        ? 'from-red-600 via-red-500 to-red-400'
        : 'from-yellow-600 via-yellow-400 to-yellow-200';

    const themeShadow = isSRT
        ? 'shadow-[0_0_15px_rgba(220,20,60,0.3)]'
        : 'shadow-[0_0_15px_rgba(234,179,8,0.3)]';

    const themeNodeReached = isSRT
        ? 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white shadow-[0_0_15px_rgba(220,20,60,0.4)]'
        : 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]';

    const themeNodeUnreached = theme === 'light'
        ? 'bg-gray-200 border-gray-300 text-gray-400'
        : 'bg-gray-900 border-gray-700 text-gray-500';

    const themeRewardIconReached = isSRT
        ? 'bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(220,20,60,0.2)]'
        : 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]';

    const themeRewardIconUnreached = theme === 'light'
        ? 'bg-gray-200 text-gray-400'
        : 'bg-gray-800/50 text-gray-600';

    const themeTextReached = isSRT ? 'text-red-500' : 'text-yellow-400';
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
            <div className="overflow-x-auto pb-8 pt-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="min-w-[2000px] px-16">
                    <div className="relative pt-16 pb-4">
                        {/* Progress Bar Background */}
                        <div className={`absolute top-1/2 left-0 w-full h-3 rounded-full -translate-y-1/2 backdrop-blur-sm ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800/50'}`} />

                        {/* Active Progress Bar */}
                        <motion.div
                            className={`absolute top-1/2 left-0 h-3 bg-gradient-to-r ${themeProgressGradient} rounded-full -translate-y-1/2 z-10 ${themeShadow}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentLevel - 1) / (LEVELS.length - 1)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />

                        <div className="relative z-20 flex justify-between items-center">
                            {LEVELS.map((level) => {
                                const isReached = level <= currentLevel;
                                const isCurrent = level === currentLevel;
                                const reward = getLevelReward(level);
                                const RewardIcon = reward?.icon;

                                return (
                                    <div key={level} className="relative flex flex-col items-center group">
                                        {/* Reward Indicator - Positioned higher and with more space */}
                                        {reward && (
                                            <div className="absolute -top-14 flex flex-col items-center transition-transform duration-300 hover:-translate-y-1">
                                                <div className={`p-2 rounded-full mb-1 ${isReached ? themeRewardIconReached : themeRewardIconUnreached}`}>
                                                    <RewardIcon size={16} />
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isReached ? themeTextReached : themeTextUnreached}`}>
                                                    {reward.label}
                                                </span>
                                            </div>
                                        )}

                                        {/* Level Node */}
                                        <motion.div
                                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isReached
                                                ? themeNodeReached
                                                : themeNodeUnreached
                                                } ${isCurrent ? `scale-125 ring-4 ${isSRT ? 'ring-red-500/30' : 'ring-yellow-500/30'} z-30` : 'z-20'}`}
                                            initial={false}
                                            animate={{ scale: isCurrent ? 1.2 : 1 }}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <span className="text-xs md:text-sm">{level}</span>
                                        </motion.div>

                                        {/* Tooltip for non-reward levels */}
                                        {!reward && (
                                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                                <div className={`${theme === 'light' ? 'bg-white border-gray-200 text-gray-600' : 'bg-black/80 border-white/10 text-gray-300'} border rounded px-2 py-1 text-[10px] backdrop-blur-md`}>
                                                    Nível {level}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelTimeline;
