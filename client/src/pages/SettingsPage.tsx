import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Bell, LogOut, Trash2, User, Zap, Mail, CheckCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import PushNotificationSettings from '../components/PushNotificationSettings';
import api from '../services/api';
import Loader from '../components/Loader';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
    const { user, logout, theme, toggleTheme, showToast, updateUser } = useAuth();
    const { t } = useTranslation('settings');
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isMGT = user?.membershipType === 'MGT';

    // Handle OAuth callback success messages
    useEffect(() => {
        const social = searchParams.get('social');
        const status = searchParams.get('status');
        
        if (social && status === 'connected') {
            const platformNames: Record<string, string> = {
                discord: 'Discord',
                steam: 'Steam',
                twitch: 'Twitch'
            };
            const platformName = platformNames[social] || social;
            showToast(`✅ ${platformName} conectado com sucesso!`);
            
            // Clear URL params
            setSearchParams({});
        } else if (social && status === 'error') {
            showToast(`❌ Erro ao conectar ${social}. Tente novamente.`);
            setSearchParams({});
        }
    }, [searchParams, setSearchParams, showToast]);
    
    const [soundsEnabled, setSoundsEnabled] = useState(
        localStorage.getItem('soundsEnabled') !== 'false'
    );
    const [doNotDisturb, setDoNotDisturb] = useState(
        localStorage.getItem('doNotDisturb') === 'true'
    );
    const [liteMode, setLiteMode] = useState(
        localStorage.getItem('liteMode') === 'true'
    );
    const [showWelcomeCard, setShowWelcomeCard] = useState(
        user?.showWelcomeCard !== false
    );
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [sendingVerification, setSendingVerification] = useState(false);

    const themeColor = isMGT ? 'emerald' : 'gold';
    const themeBg = theme === 'light' ? 'bg-gray-50' : 'bg-black';
    const cardBg = theme === 'light' ? 'bg-white' : 'bg-neutral-900/50';
    const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

    const handleToggleSounds = () => {
        const newValue = !soundsEnabled;
        setSoundsEnabled(newValue);
        localStorage.setItem('soundsEnabled', String(newValue));
    };

    const handleToggleDoNotDisturb = async () => {
        const newValue = !doNotDisturb;
        setDoNotDisturb(newValue);
        localStorage.setItem('doNotDisturb', String(newValue));
        
        // Update on backend
        try {
            await api.put('/users/me/preferences', { doNotDisturb: newValue });
        } catch (error) {
            console.error('Error updating doNotDisturb:', error);
        }
    };

    const handleToggleLiteMode = () => {
        const newValue = !liteMode;
        setLiteMode(newValue);
        localStorage.setItem('liteMode', String(newValue));
        document.documentElement.classList.toggle('lite-mode', newValue);
    };

    const handleToggleWelcomeCard = async () => {
        const newValue = !showWelcomeCard;
        setShowWelcomeCard(newValue);
        
        try {
            await api.put('/users/me/preferences', { showWelcomeCard: newValue });
            updateUser({ showWelcomeCard: newValue });
        } catch (error) {
            console.error('Error updating showWelcomeCard:', error);
            setShowWelcomeCard(!newValue); // Revert on error
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete(`/users/${user?.id}`);
            logout();
            navigate('/login');
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('Erro ao remover conta. Tente novamente.');
        }
    };

    const handleSendVerification = async () => {
        if (user?.isVerified) {
            showToast('Seu email já está verificado!');
            return;
        }
        
        setSendingVerification(true);
        try {
            await api.post('/auth/resend-verification');
            showToast('Email de verificação enviado! Verifique sua caixa de entrada.');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Erro ao enviar email de verificação';
            showToast(message);
        } finally {
            setSendingVerification(false);
        }
    };

    return (
        <div className={`min-h-screen ${themeBg}`}>
            <Header />
            
            <div className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex p-4 rounded-full bg-${themeColor}-500/10 mb-4`}>
                            <Settings className={`w-8 h-8 text-${themeColor}-400`} />
                        </div>
                        <h1 className={`text-3xl font-bold ${textMain} mb-2`}>{t('title')}</h1>
                        <p className={textSub}>Personalize sua experiência na plataforma</p>
                    </div>

                    {/* Profile Section */}
                    <div className={`${cardBg} backdrop-blur-xl border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} rounded-2xl p-6`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-full bg-${themeColor}-500/10`}>
                                <User className={`w-6 h-6 text-${themeColor}-400`} />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${textMain}`}>{t('sections.profile')}</h2>
                                <p className={`text-sm ${textSub}`}>{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className={`w-full py-3 rounded-xl bg-${themeColor}-500/10 text-${themeColor}-400 hover:bg-${themeColor}-500/20 transition-colors font-medium`}
                        >
                            Editar Perfil
                        </button>
                        
                        {/* Email Verification Button */}
                        <button
                            onClick={handleSendVerification}
                            disabled={sendingVerification || user?.isVerified}
                            className={`w-full mt-3 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium ${
                                user?.isVerified
                                    ? 'bg-green-500/10 text-green-400 cursor-default'
                                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                            }`}
                        >
                            {user?.isVerified ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Email Verificado
                                </>
                            ) : sendingVerification ? (
                                <>
                                    <Loader size="sm" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-5 h-5" />
                                    Verificar Email
                                </>
                            )}
                        </button>
                    </div>

                    {/* Notifications Settings */}
                    <div className={`${cardBg} backdrop-blur-xl border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} rounded-2xl p-6 space-y-4`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Bell className={`w-5 h-5 text-${themeColor}-400`} />
                            <h3 className={`font-semibold ${textMain}`}>{t('sections.notifications')}</h3>
                        </div>

                        {/* Sounds Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className={`font-medium ${textMain}`}>Sons de Notificação</p>
                                <p className={`text-sm ${textSub}`}>Reproduzir som ao receber notificações</p>
                            </div>
                            <button
                                onClick={handleToggleSounds}
                                className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                                    soundsEnabled ? `bg-${themeColor}-500` : 'bg-gray-600'
                                }`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                                    soundsEnabled ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
                                }`} />
                            </button>
                        </div>

                        {/* Do Not Disturb */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className={`font-medium ${textMain}`}>Não Perturbe</p>
                                <p className={`text-sm ${textSub}`}>Desativar todas as notificações</p>
                            </div>
                            <button
                                onClick={handleToggleDoNotDisturb}
                                className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                                    doNotDisturb ? `bg-${themeColor}-500` : 'bg-gray-600'
                                }`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                                    doNotDisturb ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
                                }`} />
                            </button>
                        </div>

                        {/* Push Notifications - External */}
                        <div className="pt-2 border-t border-zinc-700/50">
                            <PushNotificationSettings compact />
                        </div>
                    </div>

                    {/* Appearance Settings */}
                    <div className={`${cardBg} backdrop-blur-xl border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} rounded-2xl p-6 space-y-4`}>
                        <h3 className={`font-semibold ${textMain} mb-4`}>{t('sections.appearance')}</h3>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`font-medium ${textMain}`}>Tema {theme === 'light' ? 'Claro' : 'Escuro'}</p>
                                <p className={`text-sm ${textSub}`}>Alternar entre modo claro e escuro</p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`px-4 py-2 rounded-lg bg-${themeColor}-500/10 text-${themeColor}-400 hover:bg-${themeColor}-500/20 transition-colors font-medium`}
                            >
                                Alternar
                            </button>
                        </div>

                        {/* Lite Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className={`font-medium ${textMain} flex items-center gap-2`}>
                                    <Zap className="w-4 h-4" />
                                    Modo Lite
                                </p>
                                <p className={`text-sm ${textSub}`}>Reduz animações e efeitos para melhor performance</p>
                            </div>
                            <button
                                onClick={handleToggleLiteMode}
                                className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                                    liteMode ? `bg-${themeColor}-500` : 'bg-gray-600'
                                }`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                                    liteMode ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
                                }`} />
                            </button>
                        </div>

                        {/* Welcome Card Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className={`font-medium ${textMain} flex items-center gap-2`}>
                                    <LayoutDashboard className="w-4 h-4" />
                                    Card de Boas-vindas
                                </p>
                                <p className={`text-sm ${textSub}`}>Exibir card com saudação e stories no feed</p>
                            </div>
                            <button
                                onClick={handleToggleWelcomeCard}
                                className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                                    showWelcomeCard ? `bg-${themeColor}-500` : 'bg-gray-600'
                                }`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                                    showWelcomeCard ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
                                }`} />
                            </button>
                        </div>
                    </div>

                    {/* Account Actions */}
                    <div className={`${cardBg} backdrop-blur-xl border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} rounded-2xl p-6 space-y-3`}>
                        <h3 className={`font-semibold ${textMain} mb-4`}>{t('sections.account')}</h3>

                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Sair da Conta
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                        >
                            <Trash2 className="w-5 h-5" />
                            Remover Conta
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Logout Confirmation */}
            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Sair da Conta?"
                message="Você será desconectado e redirecionado para a página de login."
                confirmText="Sair"
                cancelText="Cancelar"
            />

            {/* Delete Account Confirmation */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Remover Conta?"
                message="Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos."
                confirmText="Remover"
                cancelText="Cancelar"
            />
        </div>
    );
}
