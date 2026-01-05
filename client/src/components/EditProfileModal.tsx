import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import ConfirmModal from './ConfirmModal';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { user, updateUser } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const themeBorder = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';
    const themeHeaderBg = isMGT ? 'from-red-900/10' : 'from-gold-900/10';
    const themeText = isMGT ? 'text-emerald-100' : 'text-gold-100';
    const themeAvatarBorder = isMGT ? 'border-emerald-500/30 group-hover:border-red-500' : 'border-gold-500/30 group-hover:border-gold-500';
    const themeIcon = isMGT ? 'text-emerald-500/50' : 'text-gold-500/50';
    const themeLabel = isMGT ? 'text-emerald-500/70' : 'text-gold-500/70';
    const themeFocus = isMGT ? 'focus:border-red-500/50' : 'focus:border-gold-500/50';
    const themeButton = isMGT ? 'bg-emerald-600 hover:bg-red-500 text-white' : 'bg-gold-500 hover:bg-gold-400 text-black';
    const themeToggle = isMGT ? 'bg-emerald-500' : 'bg-gold-500';

    const [name, setName] = useState(user?.name || '');
    const [displayName, setDisplayName] = useState(user?.displayName || ''); // Nickname
    const [isNicknameEnabled, setIsNicknameEnabled] = useState(!!user?.displayName);
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [loading, setLoading] = useState(false);

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/users/me', {
                name,
                displayName: isNicknameEnabled ? displayName : '',
                bio,
                avatarUrl
            });
            // Update local user state
            updateUser(response.data);
            onClose();
        } catch (error: any) {
            console.error('Failed to update profile', error);
            alert(`Failed to update profile: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete(`/users/${user?.id}`);
            window.location.href = '/login';
        } catch (error) {
            console.error('Failed to delete account', error);
            alert('Erro ao excluir conta.');
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
                <div className={`relative w-full max-w-md glass-panel border ${themeBorder} rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up`}>
                    {/* Header */}
                    <div className={`p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r ${themeHeaderBg} to-transparent`}>
                        <h2 className={`text-xl font-serif ${themeText}`}>Editar Perfil</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Fechar">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Avatar Input */}
                        <div className="flex justify-center">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${themeAvatarBorder} transition-colors`}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full bg-white/5 flex items-center justify-center ${themeIcon}`}>
                                            <Camera className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white font-medium">Alterar Foto</span>
                                </div>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Check for GIF restriction
                                            if (file.type === 'image/gif') {
                                                const currentLevel = user?.level || 1;
                                                if (currentLevel < 15) {
                                                    alert('GIFs de perfil são permitidos apenas para usuários Nível 15 ou superior!');
                                                    e.target.value = ''; // Reset input
                                                    return;
                                                }
                                            }

                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setAvatarUrl(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                    aria-label="Alterar foto de perfil"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-xs uppercase tracking-wider ${themeLabel} mb-1.5`}>Nome Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none ${themeFocus} transition-colors`}
                                    placeholder="Seu nome"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className={`block text-xs uppercase tracking-wider ${themeLabel}`}>Nickname (Opcional)</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500">Priorizar Nickname</span>
                                        <div
                                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isNicknameEnabled ? themeToggle : 'bg-white/10'}`}
                                            onClick={() => {
                                                const newState = !isNicknameEnabled;
                                                setIsNicknameEnabled(newState);
                                                if (newState) {
                                                    setTimeout(() => document.getElementById('nickname-input')?.focus(), 0);
                                                }
                                            }}
                                        >
                                            <div className={`w-3 h-3 rounded-full bg-black transition-transform ${isNicknameEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                </div>
                                <input
                                    id="nickname-input"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    disabled={!isNicknameEnabled}
                                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none ${themeFocus} transition-colors ${!isNicknameEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Como você quer ser visto"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Se preenchido, será exibido no lugar do nome.</p>
                            </div>

                            <div>
                                <label className={`block text-xs uppercase tracking-wider ${themeLabel} mb-1.5`}>Frase de Efeito (Bio)</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none ${themeFocus} transition-colors resize-none`}
                                    placeholder="Uma frase que te define..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full ${themeButton} font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm`}
                            >
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>

                            <div className="flex gap-3 pt-2 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIsChangePasswordOpen(true)}
                                    className="flex-1 py-2 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-wider"
                                >
                                    Alterar Senha
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    className="flex-1 py-2 rounded-lg border border-red-500/20 text-xs text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-wider"
                                >
                                    Excluir Conta
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Excluir Conta Permanentemente"
                message="Tem certeza absoluta que deseja excluir sua conta? Todos os seus dados, troféus e conquistas serão perdidos para sempre. Esta ação é irreversível."
                confirmText="Sim, Excluir Minha Conta"
                cancelText="Cancelar"
                isDestructive={true}
            />
        </>
    );
}
