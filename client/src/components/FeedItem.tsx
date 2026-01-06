import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    onReport?: (id: string | number) => void;
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
    onReport,
    isExpanded = false
}: FeedItemProps) {
    const { user, theme } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const isOwner = user?.id === authorId;
    const isMGT = user?.membershipType === 'MGT';


    const handleShare = () => {
        if (onShare) {
            onShare(id);
        } else {
            // Default share behavior (copy link)
            navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
            alert('Link copiado para a área de transferência!');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={!isExpanded ? { scale: 1.02, y: -5 } : {}}
            className={`glass-panel rounded-xl overflow-hidden group h-full flex flex-col relative ${isMGT ? 'hover:border-white/40' : 'hover:border-gold-500/40'}`}
        >
            {(image || video) && (
                <div className={`relative ${isExpanded ? 'w-full' : 'aspect-[4/3]'} overflow-hidden bg-black rounded-t-xl`}>
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
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">{author}</span>
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
                        {showMenu && (
                            <div className={`absolute right-0 top-full mt-2 w-32 bg-black/90 border rounded-lg shadow-xl backdrop-blur-xl z-50 overflow-hidden ${isMGT ? 'border-white/20' : 'border-gold-500/20'}`}>
                                {isOwner && (
                                    <button
                                        onClick={() => { onDelete && onDelete(id); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-3 h-3" /> Deletar
                                    </button>
                                )}
                                <button
                                    onClick={() => { handleShare(); setShowMenu(false); }}
                                    className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Share2 className="w-3 h-3" /> Compartilhar
                                </button>
                                <button
                                    onClick={() => {
                                        if (onReport) onReport(id);
                                        else alert('Denúncia enviada para análise.');
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Flag className="w-3 h-3" /> Denunciar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* If no image, show category here */}
                {!(image || video) && (
                    <div className="mb-4">
                        <span className={`px-3 py-1 rounded-sm backdrop-blur-md border text-[10px] uppercase tracking-[0.2em] font-medium ${theme === 'light' ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-black/80 border-white/30 text-white'} ${isMGT && theme !== 'light' ? 'border-white/30 text-white' : ''} ${!isMGT && theme !== 'light' ? 'border-gold-500/30 text-gold-300' : ''}`}>
                            {category}
                        </span>
                    </div>
                )}

                <h3 className={`text-xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-4 leading-snug transition-colors uppercase tracking-wider ${image || video ? (isExpanded ? '' : 'line-clamp-2') : ''} ${isMGT ? 'group-hover:text-white' : 'group-hover:text-gold-300'}`}>
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
