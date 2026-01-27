import { useState, useEffect } from 'react';
import { X, Trophy, Star, Crown, Gift, Calendar, Coins, Package, Bell, BellOff } from 'lucide-react';
import api from '../services/api';

interface RankingModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMGT: boolean;
}

interface RankedUser {
    id: string;
    name: string;
    avatarUrl?: string;
    trophies: number;
    level: number;
    membershipType: 'MAGAZINE' | 'MGT';
}

interface RankingRewardConfig {
    rewardType: 'zions_points' | 'zions_cash' | 'product' | 'none';
    rewardAmount?: number;
    rewardProductName?: string;
    rewardDescription?: string;
}

export default function RankingModal({ isOpen, onClose, isMGT }: RankingModalProps) {
    const [users, setUsers] = useState<RankedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'trophies' | 'level'>('trophies');
    const [rewardConfig, setRewardConfig] = useState<RankingRewardConfig | null>(null);
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [reminderEnabled, setReminderEnabled] = useState(false);

    useEffect(() => {
        // Check if reminder is already enabled
        const savedReminder = localStorage.getItem('eliteRankingReminder');
        if (savedReminder) {
            const reminderData = JSON.parse(savedReminder);
            // Check if it's for current month
            const now = new Date();
            if (reminderData.month === now.getMonth() && reminderData.year === now.getFullYear()) {
                setReminderEnabled(true);
            }
        }
    }, []);

    const handleEnableReminder = async () => {
        if (!('Notification' in window)) {
            alert('Seu navegador não suporta notificações');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // Save reminder preference
                const now = new Date();
                localStorage.setItem('eliteRankingReminder', JSON.stringify({
                    enabled: true,
                    month: now.getMonth(),
                    year: now.getFullYear()
                }));
                setReminderEnabled(true);

                // Show confirmation notification
                new Notification('Lembrete Ativado! 🏆', {
                    body: `Você será notificado quando o prêmio do Elite Ranking estiver disponível!`,
                    icon: '/logo192.png'
                });
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
        }
    };

    const handleDisableReminder = () => {
        localStorage.removeItem('eliteRankingReminder');
        setReminderEnabled(false);
    };

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                const response = await api.get('/users');
                if (Array.isArray(response.data)) {
                    setUsers(response.data);
                } else {
                    console.error('Invalid users data format', response.data);
                    setUsers([]);
                }
            } catch (error) {
                console.error('Failed to fetch ranking', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchRewardConfig = async () => {
            try {
                const response = await api.get('/content/elite-ranking-reward');
                setRewardConfig(response.data);
            } catch {
                // If no config exists, use default
                setRewardConfig({ rewardType: 'none' });
            }
        };

        const calculateDaysRemaining = () => {
            const now = new Date();
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const diffTime = lastDayOfMonth.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays);
        };

        if (isOpen) {
            fetchRanking();
            fetchRewardConfig();
            calculateDaysRemaining();
        }
    }, [isOpen]);

    const sortedUsers = [...users].sort((a, b) => {
        if (sortBy === 'trophies') {
            return b.trophies - a.trophies;
        } else {
            return (b.level || 1) - (a.level || 1);
        }
    });

    const getRewardIcon = () => {
        switch (rewardConfig?.rewardType) {
            case 'zions_points':
                return <Coins className="w-5 h-5" />;
            case 'zions_cash':
                return <Coins className="w-5 h-5" />;
            case 'product':
                return <Package className="w-5 h-5" />;
            default:
                return <Gift className="w-5 h-5" />;
        }
    };

    const getRewardText = () => {
        switch (rewardConfig?.rewardType) {
            case 'zions_points':
                return `${rewardConfig.rewardAmount?.toLocaleString()} Zions Points`;
            case 'zions_cash':
                return `R$ ${rewardConfig.rewardAmount?.toFixed(2)} em Zions Cash`;
            case 'product':
                return rewardConfig.rewardProductName || 'Prêmio Especial';
            default:
                return 'A definir';
        }
    };

    if (!isOpen) return null;

    const accentBg = isMGT ? 'bg-emerald-500' : 'bg-gold-500';
    const accentBgLight = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';
    const accentBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const accentText = isMGT ? 'text-emerald-400' : 'text-gold-400';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-2xl glass-panel rounded-3xl border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} overflow-hidden flex flex-col max-h-[85vh]`}>
                {/* Header */}
                <div className={`p-6 border-b ${isMGT ? 'border-emerald-500/10' : 'border-gold-500/10'} flex justify-between items-center bg-black/40`}>
                    <div className="flex items-center gap-3">
                        <Crown className={`w-6 h-6 ${isMGT ? 'text-emerald-500' : 'text-gold-500'}`} />
                        <h2 className={`text-xl font-serif ${isMGT ? 'text-white' : 'text-gold-400'}`}>Elite Ranking</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Fechar">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Reward Card */}
                {rewardConfig && rewardConfig.rewardType !== 'none' && (
                    <div className={`mx-4 mt-4 p-4 rounded-2xl ${accentBgLight} border ${accentBorder} backdrop-blur-sm`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Days Counter */}
                                <div className="text-center">
                                    <div className={`w-14 h-14 rounded-xl ${accentBg} flex items-center justify-center mb-1`}>
                                        <span className="text-2xl font-bold text-black">{daysRemaining}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">dias</span>
                                </div>
                                
                                {/* Info */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className={`w-4 h-4 ${accentText}`} />
                                        <span className="text-xs text-gray-400 uppercase tracking-wider">Prêmio do Mês</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`${accentText}`}>{getRewardIcon()}</span>
                                        <span className="text-white font-semibold">{getRewardText()}</span>
                                    </div>
                                    {rewardConfig.rewardDescription && (
                                        <p className="text-xs text-gray-500 mt-1">{rewardConfig.rewardDescription}</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Reminder Button */}
                            <button
                                onClick={reminderEnabled ? handleDisableReminder : handleEnableReminder}
                                className={`p-3 rounded-full transition-all ${
                                    reminderEnabled 
                                        ? `${accentBg} text-black` 
                                        : `${accentBgLight} ${accentText} hover:${accentBg} hover:text-black`
                                }`}
                                title={reminderEnabled ? 'Desativar lembrete' : 'Ativar lembrete de notificação'}
                            >
                                {reminderEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="p-4 flex gap-4 border-b border-white/5 bg-white/5">
                    <button
                        onClick={() => setSortBy('trophies')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${sortBy === 'trophies' ? (isMGT ? 'bg-emerald-600 text-white' : 'bg-gold-500 text-black') : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Trophy className="w-3 h-3" /> Por Troféus
                    </button>
                    <button
                        onClick={() => setSortBy('level')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${sortBy === 'level' ? (isMGT ? 'bg-emerald-600 text-white' : 'bg-gold-500 text-black') : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Star className="w-3 h-3" /> Por Nível
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Carregando elite...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b border-white/5">
                                    <th className="py-3 px-4 w-12">#</th>
                                    <th className="py-3 px-4">Membro</th>
                                    <th className="py-3 px-4 text-center whitespace-nowrap">Nível</th>
                                    <th className="py-3 px-4 text-right whitespace-nowrap">Troféus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUsers.map((user, index) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="py-3 px-4 font-bold text-gray-500 group-hover:text-white w-12">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full p-[1px] flex-shrink-0 ${user.membershipType === 'MGT' ? 'bg-gradient-to-br from-red-600 to-black' : 'bg-gradient-to-br from-gold-400 to-gold-700'}`}>
                                                    <img
                                                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=000&color=fff`}
                                                        alt={user.name}
                                                        className="w-full h-full rounded-full object-cover border border-black"
                                                    />
                                                </div>
                                                <span className={`text-sm font-medium truncate ${user.membershipType === 'MGT' ? 'text-red-100' : 'text-gold-100'}`}>
                                                    {user.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            <span className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300 inline-block">
                                                Lvl {user.level || 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            <span className="font-bold text-gold-400">{user.trophies}</span>
                                            <span className="ml-1">🏆</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
