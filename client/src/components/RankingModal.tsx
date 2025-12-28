import { useState, useEffect } from 'react';
import { X, Trophy, Star, Crown } from 'lucide-react';
import api from '../services/api';

interface RankingModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSRT: boolean;
}

interface RankedUser {
    id: string;
    name: string;
    avatarUrl?: string;
    trophies: number;
    level: number;
    membershipType: 'MAGAZINE' | 'SRT';
}

export default function RankingModal({ isOpen, onClose, isSRT }: RankingModalProps) {
    const [users, setUsers] = useState<RankedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'trophies' | 'level'>('trophies');

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                // Fetch all users or top 100. Assuming /users endpoint supports sorting or we sort client side for now if list is small.
                // Since we don't have a dedicated full ranking endpoint with filters yet, we'll use /users or /gamification/ranking and maybe fetch more?
                // The existing /gamification/ranking returns top 10.
                // I'll use /users for now and sort client side, assuming not too many users yet.
                // Ideally backend should handle this.
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

        if (isOpen) {
            fetchRanking();
        }
    }, [isOpen]);

    const sortedUsers = [...users].sort((a, b) => {
        if (sortBy === 'trophies') {
            return b.trophies - a.trophies;
        } else {
            return (b.level || 1) - (a.level || 1);
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-2xl glass-panel rounded-3xl border ${isSRT ? 'border-red-500/20' : 'border-gold-500/20'} overflow-hidden flex flex-col max-h-[80vh]`}>
                {/* Header */}
                <div className={`p-6 border-b ${isSRT ? 'border-red-500/10' : 'border-gold-500/10'} flex justify-between items-center bg-black/40`}>
                    <div className="flex items-center gap-3">
                        <Crown className={`w-6 h-6 ${isSRT ? 'text-red-500' : 'text-gold-500'}`} />
                        <h2 className={`text-xl font-serif ${isSRT ? 'text-white' : 'text-gold-400'}`}>Elite Ranking</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Fechar">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 flex gap-4 border-b border-white/5 bg-white/5">
                    <button
                        onClick={() => setSortBy('trophies')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${sortBy === 'trophies' ? (isSRT ? 'bg-red-600 text-white' : 'bg-gold-500 text-black') : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Trophy className="w-3 h-3" /> Por Troféus
                    </button>
                    <button
                        onClick={() => setSortBy('level')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${sortBy === 'level' ? (isSRT ? 'bg-red-600 text-white' : 'bg-gold-500 text-black') : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
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
                                    <th className="py-3 px-4">#</th>
                                    <th className="py-3 px-4">Membro</th>
                                    <th className="py-3 px-4 text-center">Nível</th>
                                    <th className="py-3 px-4 text-right">Troféus</th>
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
                                                <div className={`w-8 h-8 rounded-full p-[1px] ${user.membershipType === 'SRT' ? 'bg-gradient-to-br from-red-600 to-black' : 'bg-gradient-to-br from-gold-400 to-gold-700'}`}>
                                                    <img
                                                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=000&color=fff`}
                                                        alt={user.name}
                                                        className="w-full h-full rounded-full object-cover border border-black"
                                                    />
                                                </div>
                                                <span className={`text-sm font-medium ${user.membershipType === 'SRT' ? 'text-red-100' : 'text-gold-100'}`}>
                                                    {user.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">
                                                Lvl {user.level || 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gold-400">
                                            {user.trophies} 🏆
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
