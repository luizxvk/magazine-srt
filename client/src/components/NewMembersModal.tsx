import { useState, useEffect } from 'react';
import { X, Users, Sparkles } from 'lucide-react';
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
            const response = await api.get('/users/recent?limit=10');
            setRecentUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch recent users', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const borderColor = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';
    const themeBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`relative w-full max-w-md ${themeBg} rounded-2xl border ${borderColor} shadow-2xl overflow-hidden`}>
                {/* Header */}
                <div className={`p-6 border-b ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-black/40'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isMGT ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold-500/10 text-gold-500'}`}>
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className={`text-xl font-serif ${isMGT ? 'text-emerald-500' : 'text-gold-500'}`}>Novos Membros</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Fechar">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isMGT ? 'border-emerald-500' : 'border-gold-500'}`}></div>
                        </div>
                    ) : recentUsers.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">Nenhum membro novo recentemente.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentUsers.map((member, index) => (
                                <div
                                    key={member.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} border ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`p-1.5 rounded-full ${member.membershipType === 'MGT' ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                                        <Sparkles className={`w-4 h-4 ${member.membershipType === 'MGT' ? 'text-emerald-500' : 'text-gold-500'}`} />
                                    </div>
                                    <p className={`text-sm ${textColor}`}>
                                        <span className={`font-bold ${member.membershipType === 'MGT' ? 'text-emerald-400' : 'text-gold-400'}`}>
                                            {member.displayName || member.name}
                                        </span>
                                        {' '}acabou de se juntar a MGT
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
