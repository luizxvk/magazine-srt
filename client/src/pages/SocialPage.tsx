import { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, X, Check, ChevronDown, Loader2, UserPlus } from 'lucide-react';
import api from '../services/api';
import LuxuriousBackground from '../components/LuxuriousBackground';
import Header from '../components/Header';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModernLoader from '../components/ModernLoader';
import { motion, AnimatePresence } from 'framer-motion';

interface Friend {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    trophies: number;
    level: number;
}

interface FriendRequest {
    id: string;
    requester: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
        trophies: number;
    };
}

interface GroupInvite {
    id: string;
    group: {
        id: string;
        name: string;
        avatarUrl?: string;
        membershipType: 'MAGAZINE' | 'MGT';
    };
    inviter: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
    };
}

export default function SocialPage() {
    const { user, showToast } = useAuth();
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'recommended'>(
        tabParam === 'recommended' ? 'recommended' : tabParam === 'requests' ? 'requests' : 'friends'
    );
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
    const [recommended, setRecommended] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [recommendedPage, setRecommendedPage] = useState(1);
    const [hasMoreRecommended, setHasMoreRecommended] = useState(true);
    const [joinedGroupPopup, setJoinedGroupPopup] = useState<{ show: boolean; groupName: string; groupId: string } | null>(null);
    const [sendingRequest, setSendingRequest] = useState<string | null>(null);
    const navigate = useNavigate();

    const isMGT = user?.membershipType === 'MGT';
    const themeColor = isMGT ? 'text-emerald-500' : 'text-gold-400';
    const themeBg = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';
    const themeBorder = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';
    const themeHoverBorder = isMGT ? 'hover:border-red-500/30' : 'hover:border-gold-500/30';
    const themeButton = isMGT ? 'bg-emerald-600 hover:bg-red-500' : 'bg-gold-500 hover:bg-gold-400';
    const themeShadow = isMGT ? 'shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 'shadow-[0_0_10px_rgba(212,175,55,0.5)]';
    const themeTabActive = isMGT ? 'text-emerald-500' : 'text-gold-400';
    const themeTabBorder = isMGT ? 'bg-emerald-500' : 'bg-gold-500';

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'friends') {
                const response = await api.get('/social/friends');
                setFriends(response.data);
            } else if (activeTab === 'requests') {
                const [friendReqResponse, groupInvResponse] = await Promise.all([
                    api.get('/social/requests'),
                    api.get('/groups/invites/me')
                ]);
                setRequests(friendReqResponse.data);
                setGroupInvites(groupInvResponse.data);
            } else {
                // Fetch recommended users with pagination
                const response = await api.get('/users');
                // Filter out self and existing friends (basic client-side filter for demo)
                const allUsers = response.data as Friend[];
                const friendIds = new Set(friends.map(f => f.id));
                const recs = allUsers.filter(u => u.id !== user?.id && !friendIds.has(u.id));
                const paginatedRecs = recs.slice(0, 10);
                setRecommended(paginatedRecs);
                setHasMoreRecommended(recs.length > 10);
                setRecommendedPage(1);
            }
        } catch (error) {
            console.error('Failed to fetch social data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        try {
            await api.post(`/social/request/${requestId}/accept`);
            setRequests(requests.filter(r => r.id !== requestId));
            // Optional: Show toast
        } catch (error) {
            console.error('Failed to accept request', error);
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await api.post(`/social/request/${requestId}/reject`);
            setRequests(requests.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Failed to reject request', error);
        }
    };

    const handleAcceptGroupInvite = async (inviteId: string) => {
        try {
            const invite = groupInvites.find(i => i.id === inviteId);
            await api.post(`/groups/invites/${inviteId}/respond`, { accept: true });
            setGroupInvites(groupInvites.filter(i => i.id !== inviteId));
            
            if (invite) {
                setJoinedGroupPopup({ 
                    show: true, 
                    groupName: invite.group.name,
                    groupId: invite.group.id 
                });
            }
        } catch (error) {
            console.error('Failed to accept group invite', error);
            showToast('Erro ao aceitar convite');
        }
    };

    const handleRejectGroupInvite = async (inviteId: string) => {
        try {
            await api.post(`/groups/invites/${inviteId}/respond`, { accept: false });
            setGroupInvites(groupInvites.filter(i => i.id !== inviteId));
        } catch (error) {
            console.error('Failed to reject group invite', error);
        }
    };
    
    const loadMoreRecommended = async () => {
        setLoadingMore(true);
        try {
            const response = await api.get('/users');
            const allUsers = response.data as Friend[];
            const friendIds = new Set(friends.map(f => f.id));
            const recs = allUsers.filter(u => u.id !== user?.id && !friendIds.has(u.id));
            const nextPage = recommendedPage + 1;
            const paginatedRecs = recs.slice(0, nextPage * 10);
            setRecommended(paginatedRecs);
            setRecommendedPage(nextPage);
            setHasMoreRecommended(paginatedRecs.length < recs.length);
        } catch (error) {
            console.error('Failed to load more recommended', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleSendFriendRequest = async (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSendingRequest(userId);
        try {
            await api.post(`/social/request/${userId}`);
            showToast('Solicitação de amizade enviada!');
            // Remover da lista de recomendados
            setRecommended(prev => prev.filter(r => r.id !== userId));
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao enviar solicitação';
            showToast(message);
        } finally {
            setSendingRequest(null);
        }
    };

    return (
        <div className="min-h-screen text-white font-sans selection:bg-gold-500/30 relative">
            <LuxuriousBackground />
            <Header />

            <div className="max-w-4xl mx-auto pt-48 pb-20 px-4 relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className={`p-3 ${themeBg} rounded-xl border ${themeBorder}`}>
                        <Users className={`w-8 h-8 ${themeColor}`} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white">Social</h1>
                        <p className="text-gray-400">Conecte-se com outros membros da elite.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-1">
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`pb-3 px-4 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'friends' ? themeTabActive : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Meus Amigos
                        {activeTab === 'friends' && (
                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeTabBorder} ${themeShadow}`} />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`pb-3 px-4 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'requests' ? themeTabActive : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Solicitações
                        {requests.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                                {requests.length}
                            </span>
                        )}
                        {activeTab === 'requests' && (
                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeTabBorder} ${themeShadow}`} />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('recommended')}
                        className={`pb-3 px-4 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'recommended' ? themeTabActive : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Recomendados
                        {activeTab === 'recommended' && (
                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${themeTabBorder} ${themeShadow}`} />
                        )}
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <ModernLoader />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeTab === 'friends' ? (
                            friends.length > 0 ? (
                                friends.map(friend => (
                                    <div key={friend.id} className={`glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 ${themeHoverBorder} transition-colors group cursor-pointer`} onClick={() => navigate(`/profile?id=${friend.id}`)}>
                                        <div className={`w-12 h-12 rounded-full bg-black border ${themeBorder} overflow-hidden shrink-0`}>
                                            {friend.avatarUrl ? (
                                                <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <Users className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-white font-medium truncate group-hover:${themeColor} transition-colors`}>
                                                {friend.displayName || friend.name}
                                            </h3>
                                            <p className="text-xs text-gray-400 flex items-center gap-2">
                                                <span className={`${isMGT ? 'text-emerald-500/80' : 'text-gold-500/80'}`}>{friend.trophies} Troféus</span>
                                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                <span>Nível {friend.level}</span>
                                            </p>
                                        </div>
                                        <button className="p-2 text-gray-500 hover:text-white transition-colors" aria-label="Report user">
                                            <Shield className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">Você ainda não tem amigos adicionados.</p>
                                </div>
                            )
                        ) : activeTab === 'requests' ? (
                            <>
                                {/* Friend Requests */}
                                {requests.length > 0 && (
                                    <div className="col-span-full">
                                        <h3 className="text-white font-semibold mb-3">Solicitações de Amizade</h3>
                                    </div>
                                )}
                                {requests.length > 0 ? (
                                requests.map(req => (
                                    <div key={req.id} className="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full bg-black border ${themeBorder} overflow-hidden shrink-0`}>
                                            {req.requester.avatarUrl ? (
                                                <img src={req.requester.avatarUrl} alt={req.requester.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <Users className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-medium truncate">
                                                {req.requester.displayName || req.requester.name}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                Quer ser seu amigo
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(req.id)}
                                                className={`p-2 ${themeButton} text-black rounded-lg transition-colors`}
                                                title="Aceitar"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                                title="Rejeitar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : null}

                            {/* Group Invites */}
                            {groupInvites.length > 0 && (
                                <div className="col-span-full mt-6">
                                    <h3 className="text-white font-semibold mb-3">Convites para Grupos</h3>
                                </div>
                            )}
                            {groupInvites.map(invite => (
                                <div key={invite.id} className="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full bg-black border ${themeBorder} overflow-hidden shrink-0`}>
                                        {invite.group.avatarUrl ? (
                                            <img src={invite.group.avatarUrl} alt={invite.group.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                <Users className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">
                                            {invite.group.name}
                                        </h3>
                                        <p className="text-xs text-gray-400">
                                            {invite.inviter.displayName || invite.inviter.name} convidou você
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptGroupInvite(invite.id)}
                                            className={`p-2 ${themeButton} text-black rounded-lg transition-colors`}
                                            title="Aceitar"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRejectGroupInvite(invite.id)}
                                            className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                            title="Rejeitar"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State */}
                            {requests.length === 0 && groupInvites.length === 0 && (
                                <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                                    <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">Nenhuma solicitação pendente.</p>
                                </div>
                            )}
                            </>
                        ) : (
                            recommended.length > 0 ? (
                                <>
                                    {recommended.map(rec => (
                                        <div key={rec.id} className={`glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 ${themeHoverBorder} transition-colors group cursor-pointer`} onClick={() => navigate(`/profile?id=${rec.id}`)}>
                                            <div className={`w-12 h-12 rounded-full bg-black border ${themeBorder} overflow-hidden shrink-0`}>
                                                {rec.avatarUrl ? (
                                                    <img src={rec.avatarUrl} alt={rec.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                        <Users className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`text-white font-medium truncate group-hover:${themeColor} transition-colors`}>
                                                    {rec.displayName || rec.name}
                                                </h3>
                                                <p className="text-xs text-gray-400 flex items-center gap-2">
                                                    <span className={`${isMGT ? 'text-emerald-500/80' : 'text-gold-500/80'}`}>{rec.trophies} Troféus</span>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <span>Nível {rec.level || 1}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => navigate(`/profile?id=${rec.id}`)}
                                                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${isMGT ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black'} transition-all`}
                                                >
                                                    Ver Perfil
                                                </button>
                                                <button
                                                    onClick={(e) => handleSendFriendRequest(rec.id, e)}
                                                    disabled={sendingRequest === rec.id}
                                                    className={`p-1.5 rounded-lg transition-all ${isMGT ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-gold-500 hover:bg-gold-400 text-black'} disabled:opacity-50`}
                                                    title="Enviar solicitação de amizade"
                                                >
                                                    {sendingRequest === rec.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <UserPlus className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Load More Button */}
                                    {hasMoreRecommended && (
                                        <div className="col-span-full flex justify-center pt-4">
                                            <button
                                                onClick={loadMoreRecommended}
                                                disabled={loadingMore}
                                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                                                    isMGT
                                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/20'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {loadingMore ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Carregando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="w-4 h-4" />
                                                        Ver Mais
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">Nenhuma recomendação no momento.</p>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Popup de entrada no grupo */}
            <AnimatePresence>
                {joinedGroupPopup?.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            navigate(`/groups/${joinedGroupPopup.groupId}`);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`${isMGT ? 'bg-gray-900 border-emerald-500/30' : 'bg-gray-900 border-gold-500/30'} border rounded-2xl p-8 max-w-md w-full text-center`}
                        >
                            <div className={`w-16 h-16 rounded-full ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'} flex items-center justify-center mx-auto mb-4`}>
                                <Check className={`w-8 h-8 ${isMGT ? 'text-emerald-500' : 'text-gold-500'}`} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Bem-vindo ao grupo!</h2>
                            <p className="text-gray-400 mb-6">
                                Você entrou no grupo <span className={`font-semibold ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>"{joinedGroupPopup.groupName}"</span>
                            </p>
                            <button
                                onClick={() => navigate(`/groups/${joinedGroupPopup.groupId}`)}
                                className={`w-full py-3 rounded-xl font-semibold text-white ${isMGT ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gold-600 hover:bg-gold-500'} transition-colors`}
                            >
                                Ir para o grupo
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
