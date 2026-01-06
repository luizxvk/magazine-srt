import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar, Star } from 'lucide-react';
import { useAuth, type DailyLoginStatus } from '../context/AuthContext';
import DailyLoginCard from './DailyLoginCard';
import PhotoCatalogCard from './PhotoCatalogCard';
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

    // Fetch user's catalog photos when drawer opens
    useEffect(() => {
        if (isOpen && user) {
            const fetchCatalogPhotos = async () => {
                try {
                    const response = await api.get('/catalog', { params: { limit: 4 } });
                    setCatalogPhotos(response.data);
                } catch (error) {
                    console.error('Failed to fetch catalog photos:', error);
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
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

                            {/* Daily Login Card */}
                            <div className="mb-6">
                                <DailyLoginCard status={dailyLoginStatus} onClick={openDailyLoginModal} />
                            </div>

                            {/* Photo Catalog Card */}
                            <PhotoCatalogCard photos={catalogPhotos} />

                            {/* Recommendation Cards */}
                            <div className="space-y-4">
                                <div className={`glass-panel rounded-xl p-4 border ${isMGT ? 'border-emerald-500/20 active:border-white/40' : 'border-gold-500/20 active:border-gold-500/40'} transition-all duration-300 group cursor-pointer`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 ${themeIconBg} rounded-lg ${themeIconColor} ${themeTextHover} transition-colors`}>
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <h4 className={`font-medium ${themeText} ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'} transition-colors`}>Destaques da Semana</h4>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Confira os posts mais curtidos e comentados pelos membros da elite.
                                    </p>
                                </div>

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
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
