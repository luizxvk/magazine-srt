import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Header from '../components/Header';
import AdminGridDashboard from '../components/AdminGridDashboard';
import { Trash2, Gift, Edit2, User as UserIcon, Check, X, Package, ShoppingBag } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';
import AdminCreatePost from '../components/AdminCreatePost';
import AdminCreateAnnouncement from '../components/AdminCreateAnnouncement';
import AdminCreateReward from '../components/AdminCreateReward';
import AdminEditRewardModal from '../components/AdminEditRewardModal';
import AdminCreateEvent from '../components/AdminCreateEvent';
import BadgeManager from '../components/BadgeManager';
import Loader from '../components/Loader';
import AdminFeedbackCard from '../components/AdminFeedbackCard';
import AdminEliteReward from '../components/AdminEliteReward';
import AdminAdsSettings from '../components/AdminAdsSettings';
import AdminProducts from './admin/AdminProducts';
import AdminConsumptionTracker from './admin/AdminConsumptionTracker';
import AdminTwitchSettings from '../components/AdminTwitchSettings';
import AdminModerationPanel from '../components/AdminModerationPanel';
import AdminCreateTournament from '../components/AdminCreateTournament';
import RovexShieldCard from '../components/RovexShieldCard';
import AdminCoupons from '../components/AdminCoupons';

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

interface SponsoredPostRequest {
    id: string;
    postId: string;
    userId: string;
    zionsCashPaid: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    post: {
        id: string;
        caption: string | null;
        imageUrl: string | null;
    };
    user: {
        id: string;
        name: string;
        username: string;
        avatarUrl: string | null;
    };
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
    const [sponsoredRequests, setSponsoredRequests] = useState<SponsoredPostRequest[]>([]);
    const [requestFilter, setRequestFilter] = useState<'members' | 'sponsored'>('members');
    const [usersList, setUsersList] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProducts, setShowProducts] = useState(false);
    const [showWithdrawals, setShowWithdrawals] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; rewardId: string | null }>({
        isOpen: false,
        rewardId: null
    });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; reward: Reward | null }>({
        isOpen: false,
        reward: null
    });
    const [resetPasswordModal, setResetPasswordModal] = useState<{ isOpen: boolean; userId: string; userName: string } | null>(null);
    const [rejectRequestModal, setRejectRequestModal] = useState<{ isOpen: boolean; requestId: string } | null>(null);
    const [usersToShow, setUsersToShow] = useState(10);
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
            const [rewardsRes, requestsRes, usersRes, sponsoredRes] = await Promise.all([
                api.get('/gamification/rewards'),
                api.get('/invites'),
                api.get('/users'),
                api.get('/sponsored-posts?status=PENDING').catch(() => ({ data: [] }))
            ]);
            setRewards(rewardsRes.data);
            setRequests(requestsRes.data);
            setUsersList(usersRes.data);
            setSponsoredRequests(sponsoredRes.data);
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
            const wasConversion = response.data.wasConversion;

            // If this was an MGT conversion, no password was generated
            // The server already sent the welcome email
            if (wasConversion) {
                showToast(`🎉 ${request.name} agora é membro Magazine! Email de boas-vindas enviado.`, 'success');
                console.log(`[Admin] MGT user ${request.email} converted to Magazine`);
                return;
            }

            // For new users, server already sent the email with credentials
            // Show success and copy password as backup
            showToast(`✅ ${request.name} aprovado! Email com credenciais enviado para ${request.email}`, 'success');

            // Copy password to clipboard as backup
            if (password) {
                navigator.clipboard.writeText(password).then(() => {
                    setTimeout(() => {
                        showToast(`📋 Senha copiada como backup: ${password}`, 'info');
                    }, 2000);
                }).catch(() => {
                    console.log('[Admin] Clipboard not available');
                });
            }

            // Security: Do not log passwords

        } catch (error) {
            console.error('Failed to approve request');
            showToast('Erro ao aprovar solicitação', 'error');
        }
    };

    const handleRejectRequest = async (id: string) => {
        setRejectRequestModal({ isOpen: true, requestId: id });
    };

    const confirmRejectRequest = async () => {
        if (!rejectRequestModal) return;
        try {
            await api.post(`/invites/${rejectRequestModal.requestId}/reject`);
            setRequests(requests.filter(r => r.id !== rejectRequestModal.requestId));
            showToast('Solicitação rejeitada', 'info');
        } catch (error) {
            console.error('Failed to reject request', error);
            showToast('Erro ao rejeitar solicitação', 'error');
        } finally {
            setRejectRequestModal(null);
        }
    };

    const handleApproveSponsoredPost = async (id: string) => {
        try {
            await api.put(`/sponsored-posts/${id}/approve`);
            setSponsoredRequests(sponsoredRequests.filter(r => r.id !== id));
            showToast('✅ Post patrocinado aprovado!', 'success');
        } catch (error) {
            console.error('Failed to approve sponsored post', error);
            showToast('Erro ao aprovar post', 'error');
        }
    };

    const handleRejectSponsoredPost = async (id: string) => {
        try {
            await api.put(`/sponsored-posts/${id}/reject`);
            setSponsoredRequests(sponsoredRequests.filter(r => r.id !== id));
            showToast('Post rejeitado. Zions Cash reembolsado.', 'info');
        } catch (error) {
            console.error('Failed to reject sponsored post', error);
            showToast('Erro ao rejeitar post', 'error');
        }
    };

    const handleResetPassword = async (userId: string, userName: string) => {
        setResetPasswordModal({ isOpen: true, userId, userName });
    };

    const confirmResetPassword = async () => {
        if (!resetPasswordModal) return;
        try {
            const response = await api.post(`/users/${resetPasswordModal.userId}/reset-password`);

            if (response.data.success) {
                showToast(response.data.message, 'success');
            } else {
                showToast('Erro ao resetar senha', 'error');
            }
        } catch (error) {
            console.error('Failed to reset password', error);
            showToast('Erro ao enviar nova senha', 'error');
        } finally {
            setResetPasswordModal(null);
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

                {/* Grid Dashboard */}
                <AdminGridDashboard />

                {/* Quick Access Buttons */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <button
                        onClick={() => setShowProducts(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-purple-600/30 transition-all text-white font-medium"
                    >
                        <Package className="w-5 h-5 text-purple-400" />
                        <span>Gerenciar Produtos</span>
                    </button>
                    <button
                        onClick={() => setShowWithdrawals(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-xl hover:from-amber-500/30 hover:to-orange-600/30 transition-all text-white font-medium"
                    >
                        <ShoppingBag className="w-5 h-5 text-amber-400" />
                        <span>Rastreio de Consumo</span>
                    </button>
                </div>

                {/* Admin Cards - Horizontal Full Width Layout */}
                <div className="space-y-4">
                    <AdminCreatePost showToast={showToast} />
                    <AdminEliteReward showToast={showToast} />
                    
                    {/* Admin Stats Edit */}
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-gold-500/10">
                                <Edit2 className="w-5 h-5 text-gold-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Editar Meus Status</h3>
                                <p className="text-xs text-gray-400">Edição em tempo real (Admin)</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs text-gray-400 mb-1">Troféus</label>
                                <input
                                    type="number"
                                    defaultValue={user?.trophies || 0}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500/50 outline-none text-sm"
                                    onBlur={async (e) => {
                                        const newTrophies = parseInt(e.target.value);
                                        if (!isNaN(newTrophies)) {
                                            try {
                                                await api.put('/users/me', { trophies: newTrophies });
                                                showToast('Troféus atualizados!', 'success');
                                                window.location.reload();
                                            } catch { showToast('Erro ao atualizar troféus.', 'error'); }
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs text-gray-400 mb-1">Nível (1-30)</label>
                                <input
                                    type="number"
                                    defaultValue={user?.level || 1}
                                    min="1"
                                    max="30"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500/50 outline-none text-sm"
                                    onBlur={async (e) => {
                                        const newLevel = parseInt(e.target.value);
                                        if (!isNaN(newLevel) && newLevel >= 1 && newLevel <= 30) {
                                            try {
                                                await api.put('/users/me', { level: newLevel });
                                                showToast('Nível atualizado!', 'success');
                                                window.location.reload();
                                            } catch { showToast('Erro ao atualizar nível.', 'error'); }
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs text-gray-400 mb-1">Zions Points</label>
                                <input
                                    type="number"
                                    defaultValue={user?.zionsPoints || 0}
                                    min="0"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500/50 outline-none text-sm"
                                    onBlur={async (e) => {
                                        const newPoints = parseInt(e.target.value);
                                        if (!isNaN(newPoints) && newPoints >= 0) {
                                            try {
                                                await api.put('/users/me', { zionsPoints: newPoints });
                                                showToast('Zions Points atualizados!', 'success');
                                                window.location.reload();
                                            } catch { showToast('Erro ao atualizar zions points.', 'error'); }
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-xs text-gray-400 mb-1">Zions Cash</label>
                                <input
                                    type="number"
                                    defaultValue={user?.zionsCash || 0}
                                    min="0"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500/50 outline-none text-sm"
                                    onBlur={async (e) => {
                                        const newCash = parseInt(e.target.value);
                                        if (!isNaN(newCash) && newCash >= 0) {
                                            try {
                                                await api.put('/users/me', { zionsCash: newCash });
                                                showToast('Zions Cash atualizados!', 'success');
                                                window.location.reload();
                                            } catch { showToast('Erro ao atualizar zions cash.', 'error'); }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Solicitações Gerais */}
                    <div className="admin-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gold-500/10">
                                    <UserIcon className="w-5 h-5 text-gold-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Solicitações Gerais</h3>
                                    <p className="text-xs text-gray-400">
                                        {requests.length + sponsoredRequests.length} pendente{(requests.length + sponsoredRequests.length) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            {/* Filter Tabs */}
                            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setRequestFilter('members')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        requestFilter === 'members'
                                            ? 'bg-gold-500/20 text-gold-400'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Membros ({requests.length})
                                </button>
                                <button
                                    onClick={() => setRequestFilter('sponsored')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                        requestFilter === 'sponsored'
                                            ? 'bg-gold-500/20 text-gold-400'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Posts ({sponsoredRequests.length})
                                </button>
                            </div>
                        </div>
                        
                        {/* Member Requests */}
                        {requestFilter === 'members' && (
                            requests.length === 0 ? (
                                <p className="text-gray-500 text-sm">Nenhuma solicitação de membro pendente.</p>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {requests.map(req => (
                                        <div key={req.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 min-w-[250px]">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-white text-sm">{req.name}</h4>
                                                {req.instagram && <p className="text-xs text-gold-400">@{req.instagram}</p>}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleApproveRequest(req.id)} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => handleRejectRequest(req.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"><X className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                        
                        {/* Sponsored Post Requests */}
                        {requestFilter === 'sponsored' && (
                            sponsoredRequests.length === 0 ? (
                                <p className="text-gray-500 text-sm">Nenhuma solicitação de post patrocinado pendente.</p>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {sponsoredRequests.map(req => (
                                        <div key={req.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 min-w-[300px]">
                                            {/* Post Preview */}
                                            {req.post.imageUrl && (
                                                <img 
                                                    src={req.post.imageUrl} 
                                                    alt="Post" 
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-white text-sm truncate">@{req.user.username}</h4>
                                                <p className="text-xs text-gray-400 truncate">{req.post.caption || 'Post sem legenda'}</p>
                                                <p className="text-xs text-gold-400">Z$ {req.zionsCashPaid.toFixed(2)}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleApproveSponsoredPost(req.id)} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => handleRejectSponsoredPost(req.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"><X className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    {/* Active Rewards */}
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-gold-500/10">
                                <Gift className="w-5 h-5 text-gold-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Recompensas Ativas</h3>
                                <p className="text-xs text-gray-400">{rewards.length} cadastrada{rewards.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        {loading ? (
                            <Loader size="sm" />
                        ) : rewards.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma recompensa cadastrada.</p>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {rewards.map(reward => (
                                    <div key={reward.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 min-w-[280px]">
                                        <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-400 shrink-0">
                                            <Gift className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-white text-sm truncate">{reward.title}</h4>
                                            <p className="text-xs text-gray-400">{reward.costZions} Z$ • {reward.stock} estoque</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditModal({ isOpen: true, reward })} className="p-1.5 text-gray-400 hover:text-gold-400"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, rewardId: reward.id })} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <AdminCreateAnnouncement showToast={showToast} />
                    <AdminAdsSettings />
                    <AdminCreateReward showToast={showToast} onRewardCreated={fetchData} />
                    <AdminTwitchSettings />
                    <AdminModerationPanel />
                    <AdminCreateEvent showToast={showToast} />
                    <AdminCreateTournament showToast={showToast} />
                    <RovexShieldCard />
                    <AdminCoupons showToast={showToast} />
                    <BadgeManager />
                    <AdminFeedbackCard />

                    {/* Users Management */}
                    <div className="admin-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-gold-500/10">
                                <UserIcon className="w-5 h-5 text-gold-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Gerenciar Usuários</h3>
                                <p className="text-xs text-gray-400">{usersList.length} usuário{usersList.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-400 border-b border-white/10">
                                        <th className="p-2 font-medium">Nome</th>
                                        <th className="p-2 font-medium">Email</th>
                                        <th className="p-2 font-medium">Membro</th>
                                        <th className="p-2 font-medium">Nível</th>
                                        <th className="p-2 font-medium">Troféus</th>
                                        <th className="p-2 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {usersList.slice(0, usersToShow).map(u => (
                                        <tr key={u.id} className="hover:bg-white/5">
                                            <td className="p-2 text-white">{u.name}</td>
                                            <td className="p-2 text-gray-400">{u.email}</td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => handleToggleMembership(u.id, u.membershipType)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${u.membershipType === 'MGT' ? 'bg-tier-std-500/20 text-tier-std-400 border-tier-std-500/30' : 'bg-gold-500/20 text-gold-400 border-gold-500/30'}`}
                                                >
                                                    {u.membershipType || 'MAGAZINE'}
                                                </button>
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    defaultValue={u.level || 1}
                                                    className="w-14 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs"
                                                    onBlur={async (e) => {
                                                        const newLevel = parseInt(e.target.value);
                                                        if (!isNaN(newLevel) && newLevel >= 1 && newLevel <= 30) {
                                                            try {
                                                                await api.put(`/users/${u.id}/level`, { level: newLevel });
                                                                showToast(`Nível de ${u.name} atualizado`, 'success');
                                                            } catch { showToast('Erro ao atualizar nível', 'error'); }
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2 text-gray-400">{u.trophies}</td>
                                            <td className="p-2 text-right">
                                                <button onClick={() => handleResetPassword(u.id, u.name)} className="text-xs text-gray-500 hover:text-white">
                                                    Nova Senha
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {usersToShow < usersList.length && (
                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={() => setUsersToShow(prev => prev + 10)}
                                        className="px-4 py-1.5 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 rounded-lg border border-gold-500/30 text-xs font-medium"
                                    >
                                        Carregar Mais ({usersList.length - usersToShow} restantes)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Modal */}
            {showProducts && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900/95 border border-white/10 rounded-2xl">
                        <AdminProducts onClose={() => setShowProducts(false)} />
                    </div>
                </div>
            )}

            {/* Consumption Tracker Modal */}
            {showWithdrawals && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-gray-900/95 border border-white/10 rounded-3xl shadow-2xl">
                        <AdminConsumptionTracker onClose={() => setShowWithdrawals(false)} />
                    </div>
                </div>
            )}

            {/* Reset Password Confirmation Modal */}
            <ConfirmModal
                isOpen={!!resetPasswordModal}
                title="Enviar Nova Senha"
                message={`Tem certeza que deseja enviar uma nova senha por email para ${resetPasswordModal?.userName}?`}
                onConfirm={confirmResetPassword}
                onClose={() => setResetPasswordModal(null)}
                confirmText="Enviar"
            />

            {/* Reject Request Confirmation Modal */}
            <ConfirmModal
                isOpen={!!rejectRequestModal}
                title="Rejeitar Solicitação"
                message="Tem certeza que deseja rejeitar esta solicitação?"
                onConfirm={confirmRejectRequest}
                onClose={() => setRejectRequestModal(null)}
                confirmText="Rejeitar"
            />
        </div>
    );
}
