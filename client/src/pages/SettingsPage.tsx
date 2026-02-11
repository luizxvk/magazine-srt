import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Bell, LogOut, Trash2, User, Zap, Mail, CheckCircle, LayoutDashboard, Globe, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import PushNotificationSettings from '../components/PushNotificationSettings';
import LanguageSelector from '../components/LanguageSelector';
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
    const [freeGameAlerts, setFreeGameAlerts] = useState(
        localStorage.getItem('freeGameAlerts') !== 'false'
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
    const [socialConnections, setSocialConnections] = useState<Record<string, { connected: boolean; username?: string }>>({
        discord: { connected: false },
        steam: { connected: false },
        twitch: { connected: false },
    });
    const [loadingSocial, setLoadingSocial] = useState(true);

    // Fetch social connections
    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const { data } = await api.get('/social/connections');
                const conns: Record<string, { connected: boolean; username?: string }> = {
                    discord: { connected: false },
                    steam: { connected: false },
                    twitch: { connected: false },
                };
                for (const c of data.connections || []) {
                    const platform = c.platform.toLowerCase();
                    if (conns[platform]) {
                        conns[platform] = { connected: true, username: c.platformUsername || c.platformId };
                    }
                }
                setSocialConnections(conns);
            } catch (err) {
                console.error('Error fetching social connections:', err);
            } finally {
                setLoadingSocial(false);
            }
        };
        fetchConnections();
    }, []);

    const handleSocialConnect = async (platform: string) => {
        try {
            const response = await api.get(`/social/${platform}/auth`);
            let authUrl = response.data.authUrl;
            if (platform === 'discord' && user?.id) {
                authUrl = `${authUrl}&state=${user.id}`;
            }
            window.location.href = authUrl;
        } catch (error) {
            console.error(`Error connecting ${platform}:`, error);
            showToast(`Erro ao conectar ${platform}. Tente novamente.`);
        }
    };

    const handleSocialDisconnect = async (platform: string) => {
        try {
            await api.delete(`/social/disconnect/${platform}`);
            setSocialConnections(prev => ({
                ...prev,
                [platform]: { connected: false },
            }));
            showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} desconectado.`);
        } catch (error) {
            console.error(`Error disconnecting ${platform}:`, error);
            showToast(`Erro ao desconectar ${platform}.`);
        }
    };

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

    const handleToggleFreeGameAlerts = async () => {
        const newValue = !freeGameAlerts;
        setFreeGameAlerts(newValue);
        localStorage.setItem('freeGameAlerts', String(newValue));
        
        try {
            await api.put('/users/me/preferences', { freeGameAlerts: newValue });
        } catch (error) {
            console.error('Error updating freeGameAlerts:', error);
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

                    {/* Social Connections */}
                    <div className={`${cardBg} backdrop-blur-xl border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'} rounded-2xl p-6 space-y-4`}>
                        <div className="flex items-center gap-3 mb-2">
                            <Link2 className={`w-5 h-5 text-${themeColor}-400`} />
                            <h3 className={`font-semibold ${textMain}`}>Conectar Serviços</h3>
                        </div>
                        <p className={`text-sm ${textSub} mb-4`}>Vincule suas contas para uma experiência completa</p>

                        {/* Discord */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className={`font-medium ${textMain}`}>Discord</p>
                                    {socialConnections.discord.connected && (
                                        <p className="text-xs text-[#5865F2]">{socialConnections.discord.username}</p>
                                    )}
                                </div>
                            </div>
                            {socialConnections.discord.connected ? (
                                <button
                                    onClick={() => handleSocialDisconnect('discord')}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    Desconectar
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSocialConnect('discord')}
                                    disabled={loadingSocial}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-[#5865F2]/15 text-[#5865F2] hover:bg-[#5865F2]/25 transition-colors disabled:opacity-50"
                                >
                                    Conectar
                                </button>
                            )}
                        </div>

                        {/* Steam */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#1b2838]/30 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-[#66c0f4]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className={`font-medium ${textMain}`}>Steam</p>
                                    {socialConnections.steam.connected && (
                                        <p className="text-xs text-[#66c0f4]">{socialConnections.steam.username}</p>
                                    )}
                                </div>
                            </div>
                            {socialConnections.steam.connected ? (
                                <button
                                    onClick={() => handleSocialDisconnect('steam')}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    Desconectar
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSocialConnect('steam')}
                                    disabled={loadingSocial}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-[#66c0f4]/15 text-[#66c0f4] hover:bg-[#66c0f4]/25 transition-colors disabled:opacity-50"
                                >
                                    Conectar
                                </button>
                            )}
                        </div>

                        {/* Twitch */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#9146FF]/15 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className={`font-medium ${textMain}`}>Twitch</p>
                                    {socialConnections.twitch.connected && (
                                        <p className="text-xs text-[#9146FF]">{socialConnections.twitch.username}</p>
                                    )}
                                </div>
                            </div>
                            {socialConnections.twitch.connected ? (
                                <button
                                    onClick={() => handleSocialDisconnect('twitch')}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    Desconectar
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSocialConnect('twitch')}
                                    disabled={loadingSocial}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-[#9146FF]/15 text-[#9146FF] hover:bg-[#9146FF]/25 transition-colors disabled:opacity-50"
                                >
                                    Conectar
                                </button>
                            )}
                        </div>
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

                        {/* Free Game Alerts */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className={`font-medium ${textMain}`}>Alertas de Jogos Grátis</p>
                                <p className={`text-sm ${textSub}`}>Receber notificação quando um jogo ficar de graça</p>
                            </div>
                            <button
                                onClick={handleToggleFreeGameAlerts}
                                className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                                    freeGameAlerts ? `bg-${themeColor}-500` : 'bg-gray-600'
                                }`}
                            >
                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${
                                    freeGameAlerts ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
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

                        {/* Language Selector */}
                        <div className="pt-4 border-t border-zinc-700/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className={`w-4 h-4 text-${themeColor}-400`} />
                                <p className={`font-medium ${textMain}`}>Idioma</p>
                            </div>
                            <LanguageSelector variant="inline" />
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
