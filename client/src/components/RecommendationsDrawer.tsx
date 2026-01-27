import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar, Star, Sparkles, TrendingUp, Camera, MessageCircle, Gamepad2, Tv, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, type DailyLoginStatus } from '../context/AuthContext';
import DailyLoginCard from './DailyLoginCard';
import PhotoCatalogCard from './PhotoCatalogCard';
import WhatsNewModal from './WhatsNewModal';
import MgtLogCard from './MgtLogCard';
import FeedbackFormCard from './FeedbackFormCard';
import InventoryCard from './InventoryCard';
import OnlineFriendsCard from './OnlineFriendsCard';
import RadioCard from './RadioCard';
import api from '../services/api';

interface CatalogPhoto {
    id: string;
    imageUrl: string;
    title?: string;
    category?: string;
    carValue?: string;
    eventType?: string;
    carBrand?: string;
    isPublic: boolean;
    isFavorite: boolean;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        displayName?: string;
        avatarUrl?: string;
    };
}


interface RecommendationsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    dailyLoginStatus: DailyLoginStatus | null;
    openDailyLoginModal: () => void;
}

export default function RecommendationsDrawer({ isOpen, onClose, dailyLoginStatus, openDailyLoginModal }: RecommendationsDrawerProps) {
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';
    const [catalogPhotos, setCatalogPhotos] = useState<CatalogPhoto[]>([]);
    const [showWhatsNew, setShowWhatsNew] = useState(false);

    // XP Progress calculation
    const progressData = useMemo(() => {
        const XP_TABLE = Array.from({ length: 30 }, (_, i) => {
            const level = i + 1;
            if (level === 1) return 0;
            return Math.floor(1000 * Math.pow(level - 1, 1.2));
        });
        
        const currentLevel = user?.level || 1;
        const currentXP = user?.xp || 0;
        const currentLevelXP = XP_TABLE[currentLevel - 1] || 0;
        const nextLevelXP = XP_TABLE[currentLevel] || XP_TABLE[29];
        const xpInCurrentLevel = currentXP - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const progressPercent = xpNeededForNextLevel > 0 
            ? Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100)
            : 100;
        
        return { currentLevel, xpInCurrentLevel, xpNeededForNextLevel, progressPercent };
    }, [user?.level, user?.xp]);

    // Fetch user's catalog photos when drawer opens
    useEffect(() => {
        if (isOpen && user) {
            const fetchCatalogPhotos = async () => {
                try {
                    // Try user's own photos first, fallback to public catalog
                    const response = await api.get('/catalog');
                    if (response.data && response.data.length > 0) {
                        setCatalogPhotos(response.data.slice(0, 4));
                    } else {
                        // Fallback to public photos
                        const publicResponse = await api.get('/catalog/public', { params: { limit: 4 } });
                        setCatalogPhotos(publicResponse.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch catalog photos:', error);
                    // Try public photos on error
                    try {
                        const publicResponse = await api.get('/catalog/public', { params: { limit: 4 } });
                        setCatalogPhotos(publicResponse.data);
                    } catch (e) {
                        console.error('Failed to fetch public catalog photos:', e);
                    }
                }
            };
            fetchCatalogPhotos();
        }
    }, [isOpen, user]);

    const themeBg = theme === 'light' ? 'bg-white' : 'bg-black';
    const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
    const themeTitleColor = isMGT ? 'text-white' : 'text-gold-400';
    const themeBorder = isMGT ? 'border-emerald-500/20' : 'border-gold-500/20';
    const themeIconBg = isMGT ? 'bg-emerald-500/10' : 'bg-gold-500/10';
    const themeIconColor = isMGT ? 'text-emerald-500' : 'text-gold-400';
    const themeTextHover = isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed inset-y-0 right-0 w-full max-w-sm ${themeBg} shadow-2xl z-[70] overflow-y-auto border-l ${themeBorder}`}
                    >
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className={`text-xl font-serif ${themeTitleColor}`}>Recomendações</h3>
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-full transition-colors ${themeText} ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                                    aria-label="Fechar"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Inventory Card */}
                            <InventoryCard onOpenShop={() => {}} />

                            {/* Daily Login Card */}
                            <DailyLoginCard status={dailyLoginStatus} onClick={openDailyLoginModal} />

                            {/* Progress Card */}
                            <div className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20' : 'border-gold-500/20'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 ${themeIconBg} rounded-lg`}>
                                        <TrendingUp className={`w-5 h-5 ${themeIconColor}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Seu progresso</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${themeText}`}>Nível {progressData.currentLevel}</span>
                                            <span className={`text-sm ${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>
                                                {progressData.xpInCurrentLevel} / {progressData.xpNeededForNextLevel} XP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`h-2 rounded-full ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`}>
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'}`}
                                        style={{ width: `${progressData.progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* MGT Log Card */}
                            <MgtLogCard />

                            {/* Feedback Card */}
                            <FeedbackFormCard />

                            {/* O que há de novo - card separado */}
                            <div 
                                onClick={() => setShowWhatsNew(true)}
                                className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 active:border-white/40' : 'border-gold-500/20 active:border-gold-500/40'} transition-all duration-300 group cursor-pointer`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <h4 className={`font-medium ${themeText} ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>O Que Há de Novo</h4>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Confira as últimas novidades e atualizações da plataforma.
                                </p>
                            </div>

                            {/* Online Friends Card */}
                            <OnlineFriendsCard maxDisplay={3} />

                            {/* Photo Catalog Card - separado com espaçamento */}
                            <div className="mt-4">
                                <PhotoCatalogCard photos={catalogPhotos} />
                            </div>

                            {/* Navigation Cards - Quick Access */}
                            <div className="space-y-3">
                                <h4 className={`text-sm font-medium ${isMGT ? 'text-emerald-400' : 'text-gold-400'} uppercase tracking-wider`}>Navegação Rápida</h4>
                                
                                <Link to="/groups" onClick={onClose} className={`glass-panel rounded-xl p-3 border ${isMGT ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 group flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${themeIconBg} rounded-lg`}>
                                            <MessageCircle className={`w-4 h-4 ${themeIconColor}`} />
                                        </div>
                                        <span className={`font-medium ${themeText}`}>Grupos</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${themeIconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </Link>

                                <Link to="/catalog" onClick={onClose} className={`glass-panel rounded-xl p-3 border ${isMGT ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 group flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${themeIconBg} rounded-lg`}>
                                            <Camera className={`w-4 h-4 ${themeIconColor}`} />
                                        </div>
                                        <span className={`font-medium ${themeText}`}>Catálogo de Fotos</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${themeIconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </Link>

                                <Link to="/highlights" onClick={onClose} className={`glass-panel rounded-xl p-3 border ${isMGT ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 group flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${themeIconBg} rounded-lg`}>
                                            <Star className={`w-4 h-4 ${themeIconColor}`} />
                                        </div>
                                        <span className={`font-medium ${themeText}`}>Destaques da Semana</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${themeIconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </Link>
                            </div>

                            {/* Radio & Tools */}
                            <div className="space-y-3">
                                <h4 className={`text-sm font-medium ${isMGT ? 'text-emerald-400' : 'text-gold-400'} uppercase tracking-wider`}>Ferramentas</h4>
                                
                                {/* Radio Card */}
                                <RadioCard />
                                
                                {/* Compact Tool Buttons */}
                                <div className="grid grid-cols-3 gap-2">
                                    <a 
                                        href="https://discord.gg/magazine" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`glass-panel rounded-xl p-3 border ${isMGT ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 flex flex-col items-center gap-2`}
                                    >
                                        <div className={`p-2 ${themeIconBg} rounded-lg`}>
                                            <svg className={`w-4 h-4 ${themeIconColor}`} viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                            </svg>
                                        </div>
                                        <span className={`text-xs ${themeText}`}>Discord</span>
                                    </a>
                                    
                                    <a 
                                        href="https://store.steampowered.com" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`glass-panel rounded-xl p-3 border ${isMGT ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 flex flex-col items-center gap-2`}
                                    >
                                        <div className={`p-2 ${themeIconBg} rounded-lg`}>
                                            <Gamepad2 className={`w-4 h-4 ${themeIconColor}`} />
                                        </div>
                                        <span className={`text-xs ${themeText}`}>Steam</span>
                                    </a>
                                    
                                    <a 
                                        href="https://twitch.tv" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`glass-panel rounded-xl p-3 border ${isMGT ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-gold-500/20 hover:border-gold-500/40'} transition-all duration-300 flex flex-col items-center gap-2`}
                                    >
                                        <div className={`p-2 ${themeIconBg} rounded-lg`}>
                                            <Tv className={`w-4 h-4 ${themeIconColor}`} />
                                        </div>
                                        <span className={`text-xs ${themeText}`}>Twitch</span>
                                    </a>
                                </div>
                            </div>

                            {/* Events Card */}
                            <div className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 active:border-white/40' : 'border-gold-500/20 active:border-gold-500/40'} transition-all duration-300 group cursor-pointer`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <h4 className={`font-medium ${themeText} ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>Eventos Exclusivos</h4>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Fique por dentro dos próximos encontros e experiências {isMGT ? 'MGT' : 'Magazine'}.
                                </p>
                            </div>

                            {/* New Members Card */}
                            <div className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 active:border-white/40' : 'border-gold-500/20 active:border-gold-500/40'} transition-all duration-300 group cursor-pointer`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <h4 className={`font-medium ${themeText} ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>Novos Membros</h4>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Dê as boas-vindas aos novos integrantes da nossa comunidade exclusiva.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* WhatsNew Modal */}
                    <WhatsNewModal isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
                </>
            )}
        </AnimatePresence>
    );
}
