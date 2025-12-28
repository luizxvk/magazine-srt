import React, { useState } from 'react';
import { X, Lock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const { user } = useAuth();
    const isSRT = user?.membershipType === 'SRT';
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setError('As novas senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao alterar senha.');
        } finally {
            setLoading(false);
        }
    };

    const themeBorder = isSRT ? 'border-red-500/20' : 'border-gold-500/20';
    const themeButton = isSRT ? 'bg-red-600 hover:bg-red-500' : 'bg-gold-500 hover:bg-gold-400';
    const themeFocus = isSRT ? 'focus:border-red-500/50' : 'focus:border-gold-500/50';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md glass-panel border ${themeBorder} rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up`}>
                <div className={`p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r ${isSRT ? 'from-red-900/10' : 'from-gold-900/10'} to-transparent`}>
                    <h2 className={`text-xl font-serif ${isSRT ? 'text-red-100' : 'text-gold-100'} flex items-center gap-2`}>
                        <Lock className="w-5 h-5" /> Alterar Senha
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Fechar" aria-label="Fechar modal de alteração de senha">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <Check className="w-4 h-4" /> Senha alterada com sucesso!
                        </div>
                    )}

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5">Senha Atual</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none ${themeFocus} transition-colors pr-10`}
                                required
                                aria-label="Senha atual"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                title={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}
                                aria-label={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}
                            >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5">Nova Senha</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none ${themeFocus} transition-colors pr-10`}
                                placeholder="Mínimo 6 caracteres"
                                aria-label="Nova senha"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                title={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                                aria-label={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5">Confirmar Nova Senha</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none ${themeFocus} transition-colors pr-10`}
                                placeholder="Repita a nova senha"
                                aria-label="Confirmar nova senha"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                title={showConfirmPassword ? "Ocultar confirmação da nova senha" : "Mostrar confirmação da nova senha"}
                                aria-label={showConfirmPassword ? "Ocultar confirmação da nova senha" : "Mostrar confirmação da nova senha"}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full ${themeButton} text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm mt-4`}
                        aria-label={loading ? 'Alterando senha...' : 'Confirmar alteração de senha'}
                    >
                        {loading ? 'Alterando...' : 'Confirmar Alteração'}
                    </button>
                </form>
            </div>
        </div>
    );
}
