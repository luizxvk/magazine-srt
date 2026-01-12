import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag, Maximize2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import BadgeDisplay from './BadgeDisplay';

interface FeedItemProps {
    id: string | number;
    image?: string;
    video?: string;
    title: string; // This is actually the content/caption
    category: string;
    author: string;
    authorAvatar?: string;
    authorId?: string; // To check ownership
    likes: number;
    comments: number;
    isLiked?: boolean;
    onLike?: (id: string | number) => void;
    onComment?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
    onShare?: (id: string | number) => void;
    isExpanded?: boolean;
}

interface MediaContentProps {
    video?: string;
    image?: string;
    title: string;
    category: string;
    theme: 'dark' | 'light';
    isMGT: boolean;
    isExpanded: boolean;
}

// Extracted outside to avoid re-creation on each render
function MediaContent({ video, image, title, category, theme, isMGT, isExpanded }: MediaContentProps) {
    return (
        <>
            {video ? (
                <video src={video} controls className="w-full h-full object-cover" />
            ) : (
                <img
                    src={image}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${!isExpanded ? 'group-hover:scale-110' : ''}`}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

            {/* Category Badge */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <span className={`px-3 py-1 rounded-sm backdrop-blur-md border text-[10px] uppercase tracking-[0.2em] font-medium ${theme === 'light' ? 'bg-white/90 border-gray-200 text-gray-900' : 'bg-black/80 border-white/30 text-white'} ${isMGT && theme !== 'light' ? 'border-white/30 text-white' : ''} ${!isMGT && theme !== 'light' ? 'border-gold-500/30 text-gold-300' : ''}`}>
                    {category}
                </span>
            </div>

            {/* Expand Button (only if not expanded) */}
            {!isExpanded && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors block cursor-pointer"
                        title="Expandir"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </div>
                </div>
            )}
        </>
    );
}

export default function FeedItem({
    id,
    image,
    video,
    title,
    category,
    author,
    authorAvatar,
    authorId,
    likes,
    comments,
    isLiked,
    onLike,
    onComment,
    onDelete,
    onShare,
    isExpanded = false
}: FeedItemProps) {
    const { user, theme } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const isOwner = user?.id === authorId;
    const isAdmin = user?.role === 'ADMIN';
    const canDelete = isOwner || isAdmin;
    const isMGT = user?.membershipType === 'MGT';


    const handleShare = async () => {
        // Generate public share link
        const shareUrl = `${window.location.origin}/post/${id}`;
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShowCopiedFeedback(true);
            setTimeout(() => setShowCopiedFeedback(false), 2000);
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            console.error('Failed to copy:', err);
        }
        
        if (onShare) {
            onShare(id);
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) return;
        
        setIsReporting(true);
        try {
            await api.post(`/reports/post/${id}`, { reason: reportReason });
            alert('Denúncia enviada com sucesso. Nossa equipe irá analisar.');
            setShowReportModal(false);
            setReportReason('');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao enviar denúncia');
        } finally {
            setIsReporting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={!isExpanded ? { scale: 1.02, y: -5 } : {}}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            className={`glass-panel rounded-xl overflow-hidden group h-full w-full flex flex-col relative transition-all duration-200 ${isMGT ? 'hover:border-white/40' : 'hover:border-gold-500/40'} ${isPressed && theme === 'light' ? 'shadow-[0_0_30px_rgba(0,0,0,0.15)] ring-2 ring-gray-300' : ''}`}
        >
            {(image || video) && (
                <div className={`relative ${isExpanded ? 'w-full' : 'aspect-square md:aspect-[4/3]'} overflow-hidden bg-black rounded-t-xl`}>
                    {!isExpanded ? (
                        <Link to={`/post/${id}`} className="block w-full h-full">
                            <MediaContent video={video} image={image} title={title} category={category} theme={theme} isMGT={isMGT} isExpanded={isExpanded} />
                        </Link>
                    ) : (
                        <div className="w-full h-full">
                            <MediaContent video={video} image={image} title={title} category={category} theme={theme} isMGT={isMGT} isExpanded={isExpanded} />
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={`p-6 flex flex-col flex-1 relative ${theme === 'light' ? 'bg-white/80' : 'bg-black/40'} backdrop-blur-sm ${!(image || video) ? 'min-h-[200px]' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden ${isMGT ? 'bg-emerald-500/20 border-red-500/50' : 'bg-gold-500/20 border-gold-500/50'}`}>
                            {authorAvatar ? (
                                <img src={authorAvatar} alt={author} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-1.5 h-1.5 rounded-full ${isMGT ? 'bg-emerald-500' : 'bg-gold-500'}`} />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">{author}</span>
                            {authorId && <BadgeDisplay userId={authorId} />}
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`${isMGT ? 'text-white/50 hover:text-white' : 'text-gold-500/50 hover:text-gold-400'} transition-colors p-1`}
                            aria-label="More options"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute right-0 top-full mt-2 w-36 bg-black/95 border rounded-xl shadow-2xl backdrop-blur-xl z-[60] overflow-hidden ${isMGT ? 'border-white/20' : 'border-gold-500/20'}`}
                                >
                                    {canDelete && (
                                        <button
                                            onClick={(e) => { 
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setShowMenu(false);
                                                onDelete && onDelete(id); 
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" /> {isAdmin && !isOwner ? 'Remover (Admin)' : 'Deletar'}
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { 
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setShowMenu(false);
                                            handleShare(); 
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                    >
                                        <Share2 className="w-4 h-4" /> Compartilhar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setShowMenu(false);
                                            setShowReportModal(true);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                    >
                                        <Flag className="w-4 h-4" /> Denunciar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Copied Feedback */}
                        <AnimatePresence>
                            {showCopiedFeedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 top-full mt-2 px-3 py-2 bg-green-500 text-white text-xs rounded-lg flex items-center gap-1 shadow-lg z-50"
                                >
                                    <Check className="w-3 h-3" /> Link copiado!
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                            <h3 className="text-white font-serif text-lg mb-4">Denunciar Postagem</h3>
                            <p className="text-gray-400 text-sm mb-4">Por que você está denunciando esta postagem?</p>
                            <div className="space-y-2 mb-4">
                                {['Conteúdo impróprio', 'Spam', 'Discurso de ódio', 'Violência', 'Assédio', 'Outro'].map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => setReportReason(reason)}
                                        className={`w-full p-3 rounded-lg text-left text-sm transition-colors ${
                                            reportReason === reason 
                                                ? (isMGT ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-gold-500/20 border-gold-500/50 text-gold-400')
                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                                        } border`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReport}
                                    disabled={!reportReason || isReporting}
                                    className={`flex-1 py-2 rounded-lg font-medium disabled:opacity-50 ${
                                        isMGT 
                                            ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                                            : 'bg-gold-500 text-black hover:bg-gold-400'
                                    }`}
                                >
                                    {isReporting ? 'Enviando...' : 'Denunciar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* If no image, show category here */}
                {!(image || video) && (
                    <div className="mb-4">
                        <span className={`px-3 py-1 rounded-sm backdrop-blur-md border text-[10px] uppercase tracking-[0.2em] font-medium ${theme === 'light' ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-black/80 border-white/30 text-white'} ${isMGT && theme !== 'light' ? 'border-white/30 text-white' : ''} ${!isMGT && theme !== 'light' ? 'border-gold-500/30 text-gold-300' : ''}`}>
                            {category}
                        </span>
                    </div>
                )}

                <h3 className={`text-xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-4 leading-snug transition-colors ${image || video ? (isExpanded ? '' : 'line-clamp-2') : ''} ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'}`}>
                    {title}
                </h3>

                {/* Spacer to push actions to bottom */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); onLike && onLike(id); }}
                            className={`flex items-center gap-2 transition-colors group/like ${isLiked ? 'text-red-500' : (isMGT ? 'text-gray-500 hover:text-emerald-500' : 'text-gray-500 hover:text-red-500')}`}
                        >
                            <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-red-500' : (isMGT ? 'group-hover/like:fill-emerald-500' : 'group-hover/like:fill-red-500')}`} />
                            <span className="text-xs tracking-wider font-medium">{likes}</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onComment && onComment(id); }}
                            className={`flex items-center gap-2 text-gray-500 transition-colors ${isMGT ? 'hover:text-white' : 'hover:text-gold-400'}`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs tracking-wider font-medium">{comments}</span>
                        </motion.button>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleShare(); }}
                        className="text-gray-500 hover:text-white transition-colors"
                        aria-label="Share"
                    >
                        <Share2 className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Click outside to close menu - simplified for now */}
            {showMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            )}
        </motion.div>
    );
}
