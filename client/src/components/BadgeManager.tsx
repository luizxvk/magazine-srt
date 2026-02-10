import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

interface AdminBadge {
    id: string;
    text: string;
    color: string;
    textColor: string;
    userId: string;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
}

interface BadgeTemplate {
    text: string;
    color: string;
    textColor: string;
}

const BadgeManager: React.FC = () => {
    const { theme, showError, showWarning } = useAuth();
    const [badges, setBadges] = useState<AdminBadge[]>([]);
    const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Form state
    const [badgeText, setBadgeText] = useState('');
    const [badgeColor, setBadgeColor] = useState('#3B82F6');
    const [badgeTextColor, setBadgeTextColor] = useState('#FFFFFF');
    const [userId, setUserId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        fetchBadges();
        fetchTemplates();
    }, []);

    const fetchBadges = async () => {
        try {
            const response = await api.get('/admin/badges');
            setBadges(response.data);
        } catch (error) {
            console.error('Error fetching badges:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/admin/badges/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const searchUsers = async (query: string) => {
        try {
            // If empty, get all users (limit 10)
            if (!query.trim()) {
                const response = await api.get('/users?limit=10');
                setSearchResults(response.data.slice(0, 10));
                return;
            }

            const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
            setSearchResults(response.data.slice(0, 5));
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleCreateBadge = async () => {
        if (!badgeText.trim() || !userId) {
            showWarning('Campos obrigatórios', 'Preencha todos os campos');
            return;
        }

        try {
            await api.post('/admin/badges', {
                text: badgeText.toUpperCase(),
                color: badgeColor,
                textColor: badgeTextColor,
                userId,
            });

            setBadgeText('');
            setBadgeColor('#3B82F6');
            setBadgeTextColor('#FFFFFF');
            setUserId('');
            setSearchQuery('');
            setSearchResults([]);
            setShowCreateModal(false);
            fetchBadges();
        } catch (error: any) {
            console.error('Error creating badge:', error);
            showError('Erro ao criar selo', error.response?.data?.error);
        }
    };

    const handleDeleteBadge = async (badgeId: string) => {
        if (!confirm('Remover este selo?')) return;

        try {
            await api.delete(`/admin/badges/${badgeId}`);
            fetchBadges();
        } catch (error) {
            console.error('Error deleting badge:', error);
            showError('Erro ao remover selo');
        }
    };

    const applyTemplate = (template: BadgeTemplate) => {
        setBadgeText(template.text);
        setBadgeColor(template.color);
        setBadgeTextColor(template.textColor || '#FFFFFF');
    };

    if (loading) {
        return (
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-6">
                    <Tag className="w-6 h-6 text-purple-500" />
                    <h2 className="text-xl font-bold">Gerenciar Selos</h2>
                </div>
                <Loader size="sm" />
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Tag className="w-6 h-6 text-purple-500" />
                    <h2 className="text-xl font-bold">Gerenciar Selos</h2>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Criar Selo
                </button>
            </div>

            {/* Badges List */}
            <div className="space-y-3">
                {badges.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nenhum selo criado ainda</p>
                ) : (
                    badges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                {badge.user?.avatarUrl ? (
                                    <img
                                        src={badge.user.avatarUrl}
                                        alt={badge.user.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{badge.user?.name || 'Usuário'}</span>
                                        <span
                                            className="px-2 py-0.5 text-xs font-bold rounded"
                                            style={{ backgroundColor: badge.color, color: badge.textColor || '#FFFFFF' }}
                                        >
                                            {badge.text}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Criado em {new Date(badge.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteBadge(badge.id)}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        className={`w-full max-w-md rounded-xl p-6 ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Criar Selo</h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setBadgeText('');
                                    setBadgeColor('#3B82F6');
                                    setBadgeTextColor('#FFFFFF');
                                    setUserId('');
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Templates */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Templates</label>
                            <div className="flex flex-wrap gap-2">
                                {templates.map((template, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => applyTemplate(template)}
                                        className="px-3 py-1 text-xs font-bold text-white rounded transition-transform hover:scale-105"
                                        style={{ backgroundColor: template.color }}
                                    >
                                        {template.text}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Badge Text */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Texto do Selo</label>
                            <input
                                type="text"
                                value={badgeText}
                                onChange={(e) => setBadgeText(e.target.value.toUpperCase())}
                                placeholder="Ex: BETA, DEV, MGT"
                                maxLength={10}
                                className={`w-full px-4 py-2 rounded-lg ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600'
                                        : 'bg-gray-100 border-gray-300'
                                } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                            />
                        </div>

                        {/* Badge Color */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Cor de Fundo</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={badgeColor}
                                    onChange={(e) => setBadgeColor(e.target.value)}
                                    className="w-16 h-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={badgeColor}
                                    onChange={(e) => setBadgeColor(e.target.value)}
                                    className={`flex-1 px-4 py-2 rounded-lg ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600'
                                            : 'bg-gray-100 border-gray-300'
                                    } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                />
                            </div>
                        </div>

                        {/* Badge Text Color */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Cor do Texto</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={badgeTextColor}
                                    onChange={(e) => setBadgeTextColor(e.target.value)}
                                    className="w-16 h-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={badgeTextColor}
                                    onChange={(e) => setBadgeTextColor(e.target.value)}
                                    className={`flex-1 px-4 py-2 rounded-lg ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600'
                                            : 'bg-gray-100 border-gray-300'
                                    } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                />
                            </div>
                        </div>

                        {/* User Search */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Usuário</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                onFocus={() => {
                                    if (!searchQuery) {
                                        searchUsers(''); // Load all users on focus
                                    }
                                }}
                                placeholder="Buscar usuário..."
                                className={`w-full px-4 py-2 rounded-lg ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600'
                                        : 'bg-gray-100 border-gray-300'
                                } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                            />
                            {searchResults.length > 0 && (
                                <div
                                    className={`mt-2 rounded-lg overflow-hidden ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}
                                >
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                setUserId(user.id);
                                                setSearchQuery(user.name);
                                                setSearchResults([]);
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-600 transition-colors"
                                        >
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                            <span>{user.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        {badgeText && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Preview</label>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Nome do Usuário</span>
                                    <span
                                        className="px-2 py-0.5 text-xs font-bold rounded"
                                        style={{ backgroundColor: badgeColor, color: badgeTextColor }}
                                    >
                                        {badgeText}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setBadgeText('');
                                    setBadgeColor('#3B82F6');
                                    setBadgeTextColor('#FFFFFF');
                                    setUserId('');
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className={`flex-1 py-2 rounded-lg ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 hover:bg-gray-600'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                } transition-colors`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateBadge}
                                disabled={!badgeText.trim() || !userId}
                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Criar Selo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BadgeManager;
