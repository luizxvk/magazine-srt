import { useState, useEffect } from 'react';
import { X, UserPlus, PartyPopper, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface NewMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface User {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    role: string;
    membershipType: 'MAGAZINE' | 'MGT';
    createdAt: string;
}

export default function NewMembersModal({ isOpen, onClose }: NewMembersModalProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchRecentUsers();
        }
    }, [isOpen]);

    const fetchRecentUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/recent');
            setRecentUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch recent users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCongratulate = (userName: string) => {
        // Mock congratulations
        console.log(`Congratulated ${userName}`);
        // In real app, could send a notification or specific message
    };

    const handleAddFriend = (userId: string) => {
        // Mock add friend
        console.log(`Friend request sent to ${userId}`);
    };

    if (!isOpen) return null;

    const themeColor = isMGT ? 'emerald' : 'gold';
    const borderColor = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';

    const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`relative w-full max-w-md ${themeBg} rounded-2xl border ${borderColor} shadow-2xl overflow-hidden`}>
                {/* Header */}
                <div className={`p-6 border-b ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-black/40'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${themeColor}-500/10 text-${themeColor}-500`}>
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className={`text-xl font-serif text-${themeColor}-500`}>Novos Membros</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : recentUsers.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">Nenhum membro novo recentemente.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            {user.membershipType === 'MGT' && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900" title="MGT Member" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">{user.displayName || user.name}</h3>
                                            <p className={`text-xs ${user.membershipType === 'MGT' ? 'text-emerald-400' : 'text-gold-400'}`}>
                                                {user.membershipType}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCongratulate(user.name)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-yellow-400 transition-colors"
                                            title="Parabenizar"
                                        >
                                            <PartyPopper className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAddFriend(user.id)}
                                            className={`p-2 rounded-lg bg-${themeColor}-500/10 hover:bg-${themeColor}-500/20 text-${themeColor}-400 transition-colors`}
                                            title="Adicionar Amigo"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
