import { useState, useEffect } from 'react';
import { X, Users, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    membershipType: 'MAGAZINE' | 'MGT';
    createdAt: string;
}

export default function NewMembersModal({ isOpen, onClose }: NewMembersModalProps) {
    const { user, theme, accentColor } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const defaultAccent = isMGT ? '#10b981' : '#d4af37';
    const userAccent = accentColor || defaultAccent;

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

    const handleUserClick = (userId: string) => {
        onClose();
        navigate(`/profile?id=${userId}`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md overflow-hidden rounded-3xl"
                    style={{
                        background: theme === 'light' 
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                            : 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.9) 100%)',
                        boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 0 1px ${theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`
                    }}
                >
                    {/* Accent glow */}
                    <div 
                        className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at top, ${userAccent}30, transparent 60%)`
                        }}
                    />

                    {/* Header */}
                    <div className="relative p-6 border-b" style={{ borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="p-2.5 rounded-xl"
                                    style={{ backgroundColor: `${userAccent}20` }}
                                >
                                    <Users className="w-5 h-5" style={{ color: userAccent }} />
                                </div>
                                <h2 className="text-xl font-semibold" style={{ color: userAccent }}>
                                    Novos Membros
                                </h2>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose} 
                                className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                            >
                                <X className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-8 h-8 rounded-full border-2 border-t-transparent"
                                    style={{ borderColor: `${userAccent}40`, borderTopColor: 'transparent' }}
                                />
                            </div>
                        ) : recentUsers.length === 0 ? (
                            <p className={`text-center py-8 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Nenhum membro novo recentemente.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {recentUsers.map((member, index) => (
                                    <motion.button
                                        key={member.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleUserClick(member.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left group ${
                                            theme === 'light' 
                                                ? 'hover:bg-gray-100' 
                                                : 'hover:bg-white/5'
                                        }`}
                                        style={{
                                            background: theme === 'light' 
                                                ? 'rgba(0,0,0,0.02)' 
                                                : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            {member.avatarUrl ? (
                                                <img 
                                                    src={member.avatarUrl} 
                                                    alt={member.displayName || member.name}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                                                />
                                            ) : (
                                                <div 
                                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: `${userAccent}20` }}
                                                >
                                                    <Sparkles className="w-5 h-5" style={{ color: userAccent }} />
                                                </div>
                                            )}
                                            <div 
                                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2"
                                                style={{ 
                                                    backgroundColor: member.membershipType === 'MGT' ? '#10b981' : '#d4af37',
                                                    borderColor: theme === 'light' ? '#fff' : '#1a1a1a'
                                                }}
                                            >
                                                <Sparkles className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        </div>
                                        
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                                <span 
                                                    className="font-semibold"
                                                    style={{ color: member.membershipType === 'MGT' ? '#10b981' : '#d4af37' }}
                                                >
                                                    {member.displayName || member.name}
                                                </span>
                                                {' '}
                                                <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                                                    acabou de se juntar
                                                </span>
                                            </p>
                                            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <UserPlus 
                                            className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}
                                        />
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div 
                        className="p-4 border-t"
                        style={{ borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                onClose();
                                navigate('/social?tab=recommended');
                            }}
                            className="w-full py-3 rounded-xl font-medium text-black transition-all duration-200"
                            style={{
                                background: `linear-gradient(135deg, ${userAccent}, ${userAccent}dd)`,
                                boxShadow: `0 4px 20px ${userAccent}40`
                            }}
                        >
                            Ver Todos os Membros
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
