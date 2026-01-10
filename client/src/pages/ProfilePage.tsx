import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Ranking from '../components/Ranking';
import Badges from '../components/Badges';
import Rewards from '../components/Rewards';
import ModernLoader from '../components/ModernLoader';
import { Camera, Edit2, Palette, Trash2, Share2, UserPlus, UserCheck, MessageCircle, Crown, ZoomIn, ZoomOut, Move } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import LuxuriousBackground from '../components/LuxuriousBackground';
import ToastNotification from '../components/ToastNotification';
import ConfirmModal from '../components/ConfirmModal';
import ChatWindow from '../components/ChatWindow';
import LevelTimeline from '../components/LevelTimeline';
import BadgeDisplay from '../components/BadgeDisplay';

// Badge emoji map
const BADGE_EMOJIS: Record<string, string> = {
    'badge_crown': '👑',
    'badge_skull': '💀',
    'badge_fire': '🔥',
    'badge_star': '⭐',
    'badge_diamond': '💎',
    'badge_lightning': '⚡',
    'badge_pony': '🦄',
    'badge_heart': '❤️',
    'badge_moon': '🌙',
    'badge_sun': '☀️',
};

export default function ProfilePage() {
    const { user: currentUser, theme, equippedBadge } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paramId = searchParams.get('id');

    const [profileUser, setProfileUser] = useState<any>(null);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [friendshipStatus, setFriendshipStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('NONE');
    const [isRequester, setIsRequester] = useState(false);

    const [activeTab, setActiveTab] = useState<'posts' | 'badges' | 'rewards'>('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postId: string | null }>({
        isOpen: false,
        postId: null
    });
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [toast, setToast] = useState({ message: '', isVisible: false, type: 'success' as 'success' | 'error' | 'info' });
    
    // Background image adjustment states
    const [isBgAdjustOpen, setIsBgAdjustOpen] = useState(false);
    const [tempBgImage, setTempBgImage] = useState<string | null>(null);
    const [bgScale, setBgScale] = useState(1);
    const [bgPosition, setBgPosition] = useState({ x: 50, y: 50 }); // Percentage position

    useEffect(() => {
        if (profileUser) {
            const savedBg = localStorage.getItem(`profile_bg_${profileUser.id}`);
            const savedBgSettings = localStorage.getItem(`profile_bg_settings_${profileUser.id}`);
            if (savedBg) setBgImage(savedBg);
            if (savedBgSettings) {
                const settings = JSON.parse(savedBgSettings);
                setBgScale(settings.scale || 1);
                setBgPosition(settings.position || { x: 50, y: 50 });
            }

            // Open chat if param is present
            if (searchParams.get('chat') === 'true' && !isOwnProfile) {
                setIsChatOpen(true);
            }
        }
    }, [profileUser, searchParams, isOwnProfile]);

    useEffect(() => {
        const loadProfile = async () => {
            if (!currentUser) return;

            const targetId = paramId || currentUser.id;
            const isOwn = targetId === currentUser.id;
            setIsOwnProfile(isOwn);

            if (isOwn) {
                setProfileUser(currentUser);
            } else {
                try {
                    const response = await api.get(`/users/${targetId}`);
                    setProfileUser(response.data);

                    // Check friendship
                    const statusRes = await api.get(`/social/status/${targetId}`);
                    setFriendshipStatus(statusRes.data.status);
                    setIsRequester(statusRes.data.isRequester);
                } catch (error) {
                    console.error('Failed to load profile', error);
                    showToast('Usuário não encontrado', 'error');
                }
            }
        };
        loadProfile();
    }, [currentUser, paramId]);

    useEffect(() => {
        if (profileUser && activeTab === 'posts') {
            const fetchUserPosts = async () => {
                try {
                    const response = await api.get(`/users/${profileUser.id}/posts`);
                    setUserPosts(response.data);
                } catch (error) {
                    console.error('Failed to fetch user posts', error);
                }
            };
            fetchUserPosts();
        }
    }, [profileUser, activeTab]);

    const handleAddFriend = async () => {
        try {
            await api.post(`/social/request/${profileUser.id}`);
            setFriendshipStatus('PENDING');
            setIsRequester(true);
            showToast('Solicitação de amizade enviada!', 'success');
        } catch (error) {
            showToast('Erro ao enviar solicitação', 'error');
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, isVisible: true, type });
    };

    const handleShare = (postId: string | number) => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        showToast('Link copiado para a área de transferência!', 'success');
    };

    const handleDeletePost = async () => {
        if (!deleteModal.postId) return;
        try {
            await api.delete(`/posts/${deleteModal.postId}`);
            setUserPosts(userPosts.filter(p => p.id !== deleteModal.postId));
            setDeleteModal({ isOpen: false, postId: null });
            showToast('Postagem deletada com sucesso', 'success');
        } catch (error) {
            console.error('Failed to delete post', error);
            showToast('Erro ao deletar postagem', 'error');
        }
    };

    if (!profileUser) return <ModernLoader fullScreen />;

    const isMGT = profileUser.membershipType === 'MGT';

    return (
        <div className="min-h-screen pb-20 relative text-white font-sans selection:bg-gold-500/30">
            <LuxuriousBackground />
            <Header />

            <ToastNotification
                message={toast.message}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                type={toast.type}
            />

            {isOwnProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />}

            {/* Background Image Adjustment Modal */}
            {isBgAdjustOpen && tempBgImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBgAdjustOpen(false)} />
                    <div className={`relative w-full max-w-lg bg-[#0a0a0a] border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up`}>
                        {/* Header */}
                        <div className={`p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r ${isMGT ? 'from-emerald-900/10' : 'from-gold-900/10'} to-transparent`}>
                            <h3 className="text-lg font-serif text-white">Ajustar Imagem de Fundo</h3>
                            <button onClick={() => setIsBgAdjustOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        
                        {/* Preview */}
                        <div className="p-4">
                            <div 
                                className="w-full h-48 rounded-xl overflow-hidden border border-white/10 relative"
                                style={{
                                    backgroundImage: `url(${tempBgImage})`,
                                    backgroundSize: `${bgScale * 100}%`,
                                    backgroundPosition: `${bgPosition.x}% ${bgPosition.y}%`,
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-b ${isMGT ? 'from-emerald-900/20' : 'from-gold-500/10'} to-black/80`} />
                                <div className="absolute bottom-2 left-2 text-xs text-white/50 flex items-center gap-1">
                                    <Move className="w-3 h-3" />
                                    Preview
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="px-4 pb-4 space-y-4">
                            {/* Zoom */}
                            <div className="flex items-center gap-3">
                                <ZoomOut className="w-4 h-4 text-gray-400" />
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={bgScale}
                                    onChange={(e) => setBgScale(parseFloat(e.target.value))}
                                    className="flex-1 accent-gold-500"
                                />
                                <ZoomIn className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-400 w-12">{Math.round(bgScale * 100)}%</span>
                            </div>

                            {/* Position X */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-16">Horizontal</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={bgPosition.x}
                                    onChange={(e) => setBgPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                                    className="flex-1 accent-gold-500"
                                />
                                <span className="text-xs text-gray-400 w-10">{bgPosition.x}%</span>
                            </div>

                            {/* Position Y */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-16">Vertical</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={bgPosition.y}
                                    onChange={(e) => setBgPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                    className="flex-1 accent-gold-500"
                                />
                                <span className="text-xs text-gray-400 w-10">{bgPosition.y}%</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 flex justify-between gap-3">
                            <button
                                onClick={() => {
                                    if (currentUser) {
                                        localStorage.removeItem(`profile_bg_${currentUser.id}`);
                                        localStorage.removeItem(`profile_bg_settings_${currentUser.id}`);
                                        setBgImage(null);
                                        setTempBgImage(null);
                                        setIsBgAdjustOpen(false);
                                        showToast('Imagem de fundo removida', 'info');
                                    }
                                }}
                                className="px-4 py-2 rounded-full text-red-400 border border-red-500/30 hover:bg-red-500/10 text-sm"
                            >
                                Remover
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsBgAdjustOpen(false)}
                                    className="px-4 py-2 rounded-full text-gray-400 border border-white/10 hover:bg-white/5 text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        if (currentUser && tempBgImage) {
                                            localStorage.setItem(`profile_bg_${currentUser.id}`, tempBgImage);
                                            localStorage.setItem(`profile_bg_settings_${currentUser.id}`, JSON.stringify({
                                                scale: bgScale,
                                                position: bgPosition
                                            }));
                                            setBgImage(tempBgImage);
                                            setIsBgAdjustOpen(false);
                                            showToast('Imagem de fundo atualizada!', 'success');
                                        }
                                    }}
                                    className={`px-6 py-2 rounded-full text-black text-sm font-medium ${isMGT ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-gold-500 hover:bg-gold-400'}`}
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isChatOpen && !isOwnProfile && (
                <ChatWindow
                    otherUserId={profileUser.id}
                    otherUserName={profileUser.displayName || profileUser.name}
                    otherUserAvatar={profileUser.avatarUrl}
                    otherUserMembershipType={profileUser.membershipType}
                    onClose={() => setIsChatOpen(false)}
                />
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, postId: null })}
                onConfirm={handleDeletePost}
                title="Deletar Postagem"
                message="Tem certeza que deseja remover esta postagem permanentemente? Esta ação não pode ser desfeita."
                confirmText="Deletar"
            />

            <div className="max-w-7xl mx-auto pt-40 pb-32 px-4 relative z-10">
                {/* Profile Card */}
                <div className={`glass-panel p-8 rounded-3xl border ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} relative overflow-hidden transition-all duration-500 mb-8`}>
                    {bgImage && (
                        <div
                            className="absolute inset-0 z-0 opacity-50 blur-sm"
                            // eslint-disable-next-line react-dom/no-unsafe-inline-style
                            style={{ 
                                backgroundImage: `url(${bgImage})`,
                                backgroundSize: `${bgScale * 100}%`,
                                backgroundPosition: `${bgPosition.x}% ${bgPosition.y}%`,
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-b ${isMGT ? 'from-red-900/20' : 'from-gold-500/10'} ${theme === 'light' ? 'to-white/80' : 'to-black/80'} z-0`} />
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                        {/* Avatar */}
                        <div className="relative group mx-auto md:mx-0 shrink-0">
                            <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br ${isMGT ? 'from-emerald-600 via-black to-emerald-800 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'from-gold-300 via-gold-500 to-gold-800 shadow-[0_0_30px_rgba(212,175,55,0.3)]'}`}>
                                <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                    <img
                                        src={profileUser.avatarUrl || `https://ui-avatars.com/api/?name=${profileUser.name}&background=000&color=${isMGT ? 'ff0000' : 'd4af37'}`}
                                        alt={profileUser.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {isOwnProfile && (
                                        <div
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={() => setIsEditModalOpen(true)}
                                            role="button"
                                            aria-label="Change avatar"
                                            tabIndex={0}
                                        >
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Badge Icon - Shows equipped badge or default crown for Magazine */}
                            {(isOwnProfile ? equippedBadge : profileUser.equippedBadge) ? (
                                <div className="absolute -top-3 -left-3 z-30 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] transform -rotate-12">
                                    <span className="text-3xl">{BADGE_EMOJIS[(isOwnProfile ? equippedBadge : profileUser.equippedBadge) || ''] || '👑'}</span>
                                </div>
                            ) : !isMGT && (
                                <div className="absolute -top-3 -left-3 z-30 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] transform -rotate-12 animate-pulse-slow">
                                    <Crown
                                        size={32}
                                        className="text-yellow-400"
                                        fill="currentColor"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            )}

                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${isMGT ? 'bg-emerald-600 text-white' : 'bg-gold-500 text-black'} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap z-20`}>
                                Lvl {profileUser.level || 1}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left w-full">
                            <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-2 gap-4 md:gap-0">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start mb-1">
                                        <h2 className={`text-2xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{profileUser.displayName || profileUser.name}</h2>
                                        <BadgeDisplay userId={profileUser.id} />
                                    </div>
                                    <p className={`text-sm uppercase tracking-widest mb-2 font-medium ${isMGT ? 'text-emerald-500 text-shine-emerald' : 'text-gold-400 text-shine-gold'}`}>
                                        {isMGT ? 'Membro MGT' : 'Membro Magazine'}
                                    </p>
                                    {profileUser.bio && <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} text-sm italic mb-4 max-w-md mx-auto md:mx-0`}>"{profileUser.bio}"</p>}
                                </div>
                                <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                                    {isOwnProfile ? (
                                        <>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const input = document.getElementById('bg-upload') as HTMLInputElement;
                                                        if (input) {
                                                            input.click();
                                                        }
                                                    }}
                                                    className={`flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full border ${theme === 'light' ? 'border-gray-300 hover:bg-gray-200' : 'border-white/10 hover:bg-white/5'} transition-colors group shrink-0 touch-manipulation`}
                                                    title="Alterar Imagem de Fundo"
                                                    type="button"
                                                >
                                                    <Palette className={`w-5 h-5 md:w-4 md:h-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} group-hover:text-gold-400 transition-colors`} />
                                                </button>
                                                <input
                                                    id="bg-upload"
                                                    aria-label="Upload background image"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            // Validate file type
                                                            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                                                            if (!validTypes.includes(file.type)) {
                                                                showToast('Apenas imagens JPG e PNG são permitidas', 'error');
                                                                e.target.value = '';
                                                                return;
                                                            }
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const result = reader.result as string;
                                                                // Open adjustment modal instead of saving directly
                                                                setTempBgImage(result);
                                                                setBgScale(1);
                                                                setBgPosition({ x: 50, y: 50 });
                                                                setIsBgAdjustOpen(true);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                        // Reset input value so same file can be selected again
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setIsEditModalOpen(true)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors group shrink-0 ${theme === 'light' ? 'border-gray-400 bg-gray-200 text-gray-800' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                                            >
                                                <Edit2 className={`w-4 h-4 transition-colors ${theme === 'light' ? 'text-gray-800' : 'text-gray-400 group-hover:text-white'}`} />
                                                <span className={`text-xs transition-colors ${theme === 'light' ? 'text-gray-800' : 'text-gray-400 group-hover:text-white'}`}>Editar Perfil</span>
                                            </button>
                                            {currentUser?.role === 'ADMIN' && (
                                                <>
                                                    <button
                                                        onClick={() => window.location.href = '/admin'}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/30 bg-gold-500/10 hover:bg-gold-500/20 transition-colors group shrink-0"
                                                    >
                                                        <span className="text-xs text-gold-400 font-medium">Admin</span>
                                                    </button>
                                                    <button
                                                        onClick={() => navigate('/admin/devtools')}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors group shrink-0"
                                                    >
                                                        <span className="text-xs text-blue-400 font-medium">DevTools</span>
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Message button - only show if friends */}
                                            {friendshipStatus === 'ACCEPTED' && (
                                                <button
                                                    onClick={() => setIsChatOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Mensagem</span>
                                                </button>
                                            )}

                                            {friendshipStatus === 'NONE' && (
                                                <button
                                                    onClick={handleAddFriend}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500 text-black hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Adicionar</span>
                                                </button>
                                            )}
                                            {friendshipStatus === 'PENDING' && (
                                                <button
                                                    disabled
                                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-gray-400 cursor-not-allowed"
                                                >
                                                    <UserCheck className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">
                                                        {isRequester ? 'Enviado' : 'Pendente'}
                                                    </span>
                                                </button>
                                            )}
                                            {friendshipStatus === 'ACCEPTED' && (
                                                <button
                                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                                                >
                                                    <UserCheck className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Amigos</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={`grid grid-cols-2 gap-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} pt-6 mt-4`}>
                                <div>
                                    <p className={`text-2xl md:text-3xl font-light ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-1`}>{profileUser.trophies || 0}</p>
                                    <p className={`text-[10px] md:text-xs uppercase tracking-wider ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>Troféus</p>
                                </div>
                                <div>
                                    <p className={`text-2xl md:text-3xl font-light ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-1`}>#{profileUser.id?.slice(0, 4) || '0000'}</p>
                                    <p className={`text-[10px] md:text-xs uppercase tracking-wider ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>ID Membro</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Level Timeline */}
                    <div className="mb-8">
                        <LevelTimeline currentLevel={profileUser.level || 1} currentTrophies={profileUser.trophies || 0} />
                    </div>
                </div>


                {/* Content Tabs */}
                <div className="flex gap-8 border-b border-white/10 mb-8 px-4 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`pb-4 text-sm uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'posts' ? (isMGT ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gold-400 border-b-2 border-gold-400') : 'text-gray-500 hover:text-white'}`}
                    >
                        Postagens
                    </button>
                    <button
                        onClick={() => setActiveTab('badges')}
                        className={`pb-4 text-sm uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'badges' ? (isMGT ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gold-400 border-b-2 border-gold-400') : 'text-gray-500 hover:text-white'}`}
                    >
                        Conquistas
                    </button>
                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveTab('rewards')}
                            className={`pb-4 text-sm uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'rewards' ? (isMGT ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gold-400 border-b-2 border-gold-400') : 'text-gray-500 hover:text-white'}`}
                        >
                            Prêmios
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {activeTab === 'posts' && (
                            <div className="space-y-6">
                                {userPosts.length === 0 ? (
                                    <div className="text-center py-20 glass-panel rounded-3xl border border-white/5">
                                        <p className="text-gray-500">Nenhuma postagem ainda.</p>
                                    </div>
                                ) : (
                                    userPosts.map((post) => (
                                        <div key={post.id} className={`glass-panel rounded-3xl p-6 border ${isMGT ? 'border-emerald-500/10 hover:border-emerald-500/30' : 'border-gold-500/10 hover:border-gold-500/30'} transition-all relative group`}>
                                            {/* Share Button */}
                                            <button
                                                onClick={() => handleShare(post.id)}
                                                className="absolute top-6 right-16 text-gray-500 hover:text-white transition-colors p-2"
                                                title="Compartilhar"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>

                                            {post.imageUrl && (
                                                <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                                                    <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <p className="text-gray-300 text-sm mb-3">{post.caption}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 justify-between">
                                                <div className="flex gap-4">
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    <span>{post.likesCount} curtidas</span>
                                                </div>
                                                {isOwnProfile && (
                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, postId: post.id })}
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        aria-label="Deletar postagem"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {activeTab === 'badges' && <Badges userId={profileUser.id} />}
                        {activeTab === 'rewards' && isOwnProfile && <Rewards />}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <Ranking />
                    </div>
                </div>
            </div>
        </div>
    );
}
