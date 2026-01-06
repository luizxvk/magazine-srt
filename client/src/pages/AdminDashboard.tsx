import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Header from '../components/Header';
import { Trash2, Gift, Edit2, User as UserIcon, Check, X, Mail } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';
import AdminCreatePost from '../components/AdminCreatePost';
import AdminCreateAnnouncement from '../components/AdminCreateAnnouncement';
import AdminCreateReward from '../components/AdminCreateReward';
import AdminEditRewardModal from '../components/AdminEditRewardModal';
import AdminCreateEvent from '../components/AdminCreateEvent';
import { sendWelcomeEmail, isEmailJSConfigured } from '../services/emailjs';

interface Reward {
    id: string;
    title: string;
    type: 'PRODUCT' | 'COUPON' | 'DIGITAL';
    costZions: number;
    stock: number;
    metadata?: {
        imageUrl?: string;
    };
}

interface InviteRequest {
    id: string;
    name: string;
    email: string;
    instagram: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
    createdAt: string;
    trophies: number;
    level?: number;
    membershipType?: 'MAGAZINE' | 'MGT';
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [requests, setRequests] = useState<InviteRequest[]>([]);
    const [usersList, setUsersList] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; rewardId: string | null }>({
        isOpen: false,
        rewardId: null
    });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; reward: Reward | null }>({
        isOpen: false,
        reward: null
    });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        isVisible: false,
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, isVisible: true, type });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rewardsRes, requestsRes, usersRes] = await Promise.all([
                api.get('/gamification/rewards'),
                api.get('/invites'),
                api.get('/users')
            ]);
            setRewards(rewardsRes.data);
            setRequests(requestsRes.data);
            setUsersList(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            showToast('Erro ao carregar dados', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReward = async () => {
        if (!deleteModal.rewardId) return;
        try {
            await api.delete(`/gamification/rewards/${deleteModal.rewardId}`);
            setRewards(rewards.filter(r => r.id !== deleteModal.rewardId));
            setDeleteModal({ isOpen: false, rewardId: null });
            showToast('Recompensa removida com sucesso', 'success');
        } catch (error) {
            console.error('Failed to delete reward', error);
            showToast('Erro ao remover recompensa', 'error');
        }
    };

    const handleApproveRequest = async (id: string) => {
        try {
            // Find the request to get email and name
            const request = requests.find(r => r.id === id);
            if (!request) return;

            const response = await api.post(`/invites/${id}/approve`);
            setRequests(requests.filter(r => r.id !== id));

            const password = response.data.generatedPassword;
            
            // Try to send email first
            if (isEmailJSConfigured()) {
                showToast('Enviando email com senha...', 'info');
                
                const emailSent = await sendWelcomeEmail({
                    to_email: request.email,
                    to_name: request.name,
                    temp_password: password
                });
                
                if (emailSent) {
                    showToast(`✅ Email enviado para ${request.email} com a senha!`, 'success');
                } else {
                    // Fallback to clipboard if email fails
                    showToast(`⚠️ Falha ao enviar email. Senha: ${password}`, 'error');
                    navigator.clipboard.writeText(password).catch(() => {
                        alert(`Usuário criado! A senha temporária é: ${password}\n\nPor favor, envie para o usuário.`);
                    });
                }
            } else {
                // Email not configured, use clipboard
                showToast(`Aprovado! Senha gerada: ${password}`, 'success');
                navigator.clipboard.writeText(password).then(() => {
                    showToast(`Senha copiada para a área de transferência!`, 'success');
                }).catch(() => {
                    alert(`Usuário criado! A senha temporária é: ${password}\n\nPor favor, envie para o usuário.`);
                });
            }

            console.log(`[Admin] Password for ${request.email}: ${password}`);

        } catch (error) {
            console.error('Failed to approve request', error);
            showToast('Erro ao aprovar solicitação', 'error');
        }
    };

    const handleRejectRequest = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja rejeitar esta solicitação?')) return;
        try {
            await api.post(`/invites/${id}/reject`);
            setRequests(requests.filter(r => r.id !== id));
            showToast('Solicitação rejeitada', 'info');
        } catch (error) {
            console.error('Failed to reject request', error);
            showToast('Erro ao rejeitar solicitação', 'error');
        }
    };

    const handleResetPassword = async (userId: string, userName: string) => {
        if (!window.confirm(`Tem certeza que deseja gerar uma nova senha para ${userName}?`)) return;
        try {
            const response = await api.post(`/users/${userId}/reset-password`);
            const password = response.data.generatedPassword;

            showToast(`Senha gerada para ${userName}: ${password} (Copie agora!)`, 'success');

            navigator.clipboard.writeText(password).then(() => {
                showToast(`Senha copiada!`, 'success');
            }).catch(() => {
                alert(`Senha gerada para ${userName}: ${password}`);
            });
        } catch (error) {
            console.error('Failed to reset password', error);
            showToast('Erro ao gerar senha', 'error');
        }
    };

    const handleToggleMembership = async (userId: string, currentType: 'MAGAZINE' | 'MGT' | undefined) => {
        const newType = currentType === 'MGT' ? 'MAGAZINE' : 'MGT';
        try {
            await api.put(`/users/${userId}/membership`, { membershipType: newType });
            setUsersList(usersList.map(u => u.id === userId ? { ...u, membershipType: newType } : u));
            showToast(`Membro alterado para ${newType}`, 'success');
        } catch (error) {
            console.error('Failed to update membership', error);
            showToast('Erro ao alterar tipo de membro', 'error');
        }
    };

    if (!user || user.role !== 'ADMIN') return null;

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
            <LuxuriousBackground />
            <Header />

            <ToastNotification
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type={toast.type}
            />

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, rewardId: null })}
                onConfirm={handleDeleteReward}
                title="Remover Recompensa"
                message="Tem certeza que deseja remover esta recompensa? Ela não estará mais disponível para os usuários."
                confirmText="Remover"
                isDestructive={true}
            />

            <AdminEditRewardModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, reward: null })}
                reward={editModal.reward}
                onUpdate={fetchData}
                showToast={showToast}
            />

            <div className="max-w-7xl mx-auto pt-32 pb-32 px-4 relative z-10">
                <h1 className="text-3xl font-serif text-gold-300 mb-8">Painel Administrativo</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Actions */}
                    <div className="space-y-8 h-fit">
                        <AdminCreatePost showToast={showToast} />
                        <AdminCreateAnnouncement showToast={showToast} />
                        <AdminCreateReward showToast={showToast} onRewardCreated={fetchData} />
                        <AdminCreateEvent showToast={showToast} />
                    </div>

                    {/* Rewards List */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Admin Stats Edit */}
                        <div className="glass-panel p-6 rounded-xl">
                            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-gold-400" /> Editar Meus Status
                            </h2>
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Meus Troféus</label>
                                    <input
                                        type="number"
                                        defaultValue={user?.trophies || 0}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold-500/50 outline-none"
                                        aria-label="Editar meus troféus"
                                        onBlur={async (e) => {
                                            const newTrophies = parseInt(e.target.value);
                                            if (!isNaN(newTrophies)) {
                                                try {
                                                    await api.put('/users/me', { trophies: newTrophies });
                                                    showToast('Troféus atualizados!', 'success');
                                                    window.location.reload();
                                                } catch (error) {
                                                    console.error('Failed to update trophies', error);
                                                    showToast('Erro ao atualizar troféus. Verifique se você tem permissão.', 'error');
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Meu Nível (1-30)</label>
                                    <input
                                        type="number"
                                        defaultValue={user?.level || 1}
                                        min="1"
                                        max="30"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold-500/50 outline-none"
                                        aria-label="Editar meu nível"
                                        onBlur={async (e) => {
                                            const newLevel = parseInt(e.target.value);
                                            if (!isNaN(newLevel) && newLevel >= 1 && newLevel <= 30) {
                                                try {
                                                    await api.put('/users/me', { level: newLevel });
                                                    showToast('Nível atualizado!', 'success');
                                                    window.location.reload();
                                                } catch (error) {
                                                    console.error('Failed to update level', error);
                                                    showToast('Erro ao atualizar nível.', 'error');
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Meus Zions</label>
                                    <input
                                        type="number"
                                        defaultValue={user?.zions || 0}
                                        min="0"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-gold-500/50 outline-none"
                                        aria-label="Editar meus zions"
                                        onBlur={async (e) => {
                                            const newZions = parseInt(e.target.value);
                                            if (!isNaN(newZions) && newZions >= 0) {
                                                try {
                                                    await api.put('/users/me', { zions: newZions });
                                                    showToast('Zions atualizados!', 'success');
                                                    window.location.reload();
                                                } catch (error) {
                                                    console.error('Failed to update zions', error);
                                                    showToast('Erro ao atualizar zions.', 'error');
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 pb-3">
                                    *Edição em tempo real (Admin)
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-xl">
                            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-gold-400" /> Recompensas Ativas
                            </h2>

                            {loading ? (
                                <div className="text-center py-10 text-gray-500">Carregando...</div>
                            ) : rewards.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">Nenhuma recompensa cadastrada.</div>
                            ) : (
                                <div className="space-y-4">
                                    {rewards.map(reward => (
                                        <div key={reward.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-gold-500/20 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-400">
                                                    <Gift className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{reward.title}</h3>
                                                    <p className="text-xs text-gray-400">
                                                        {reward.costZions} Zions • {reward.stock} em estoque • {reward.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditModal({ isOpen: true, reward })}
                                                    className="p-2 text-gray-400 hover:text-gold-400 transition-colors"
                                                    aria-label={`Editar recompensa ${reward.title}`}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, rewardId: reward.id })}
                                                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                                    aria-label={`Remover recompensa ${reward.title}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Member Requests Card - Moved inside main column */}
                    <div className="glass-panel p-6 rounded-xl h-fit">
                        <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-gold-400" /> Solicitações de Membros
                        </h2>
                        {requests.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma solicitação pendente.</p>
                        ) : (
                            <div className="space-y-4">
                                {requests.map(req => (
                                    <div key={req.id} className="p-4 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                            <div>
                                                <h3 className="font-bold text-white">{req.name}</h3>
                                                {req.instagram && <p className="text-xs text-gold-400 mt-1">@{req.instagram}</p>}
                                            </div>
                                            <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full shrink-0">
                                                Pendente
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproveRequest(req.id)}
                                                className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Check className="w-3 h-3" /> Aprovar
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req.id)}
                                                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                            >
                                                <X className="w-3 h-3" /> Rejeitar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Users Management */}
                <div className="lg:col-span-3 glass-panel p-6 rounded-xl">
                    <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-gold-400" /> Gerenciar Usuários
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-400 border-b border-white/10">
                                    <th className="p-3 font-medium uppercase tracking-wider">Nome</th>
                                    <th className="p-3 font-medium uppercase tracking-wider">Email</th>
                                    <th className="p-3 font-medium uppercase tracking-wider">Membro</th>
                                    <th className="p-3 font-medium uppercase tracking-wider">Nível</th>
                                    <th className="p-3 font-medium uppercase tracking-wider">Troféus</th>
                                    <th className="p-3 font-medium uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {usersList.map(u => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-3 text-white font-medium">{u.name}</td>
                                        <td className="p-3 text-gray-400">{u.email}</td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleToggleMembership(u.id, u.membershipType)}
                                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${u.membershipType === 'MGT'
                                                    ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                                    : 'bg-gold-500/20 text-gold-400 border-gold-500/30 hover:bg-gold-500/30'
                                                    }`}
                                            >
                                                {u.membershipType || 'MAGAZINE'}
                                            </button>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="1"
                                                max="30"
                                                defaultValue={u.level || 1}
                                                aria-label={`Editar nível de ${u.name}`}
                                                className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-gold-500/50 outline-none"
                                                onBlur={async (e) => {
                                                    const newLevel = parseInt(e.target.value);
                                                    if (!isNaN(newLevel) && newLevel >= 1 && newLevel <= 30) {
                                                        try {
                                                            await api.put(`/users/${u.id}/level`, { level: newLevel });
                                                            showToast(`Nível de ${u.name} atualizado para ${newLevel}`, 'success');
                                                        } catch (error) {
                                                            console.error('Failed to update level', error);
                                                            showToast('Erro ao atualizar nível', 'error');
                                                        }
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="p-3 text-gray-400">{u.trophies}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleResetPassword(u.id, u.name)}
                                                className="text-gray-500 hover:text-white transition-colors p-1"
                                                title="Resetar Senha"
                                            >
                                                Resetar Senha
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
