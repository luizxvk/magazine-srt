import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Flag, Maximize2, Check, Sparkles, BarChart3, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import BadgeDisplay from './BadgeDisplay';
import VisitorBlockPopup from './VisitorBlockPopup';
import SponsorPostModal from './SponsorPostModal';
import { getProfileBorderGradient } from '../utils/profileBorderUtils';

interface PollOption {
    id: string;
    text: string;
    voteCount: number;
    percentage: number;
}

interface Poll {
    question: string;
    options: PollOption[];
    totalVotes: number;
    userVotedOptionId: string | null;
}

interface FeedItemProps {
    id: string | number;
    image?: string;
    video?: string;
    title: string; // This is actually the content/caption
    category: string;
    author: string;
    authorAvatar?: string;
    authorId?: string; // To check ownership
    authorProfileBorder?: string | null;
    authorMembershipType?: string;
    authorIsElite?: boolean;
    authorEliteUntil?: string | null;
    likes: number;
    comments: number;
    isLiked?: boolean;
    isHighlight?: boolean;
    poll?: Poll | null;
    onLike?: (id: string | number) => void;
    onComment?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
    onShare?: (id: string | number) => void;
    onPollVote?: (postId: string | number, optionId: string) => void;
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
    isHighlight?: boolean;
    t: (key: string) => string;
}

// Extracted outside to avoid re-creation on each render
function MediaContent({ video, image, title, category, theme, isMGT, isExpanded, isHighlight, t }: MediaContentProps) {
    return (
        <>
            {video ? (
                <video 
                    src={video} 
                    controls 
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain bg-black" 
                    onError={(e) => {
                        console.error('Video load error:', e);
                        // Tenta recarregar com tipo diferente
                        const videoEl = e.currentTarget;
                        if (!videoEl.querySelector('source')) {
                            const source = document.createElement('source');
                            source.src = video;
                            source.type = 'video/mp4';
                            videoEl.appendChild(source);
                            videoEl.load();
                        }
                    }}
                />
            ) : (
                <img
                    src={image}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${!isExpanded ? 'group-hover:scale-110' : ''}`}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

            {/* Category Badge */}
            <div className="absolute top-4 left-4 pointer-events-none flex gap-2">
                {isHighlight && (
                    <span className={`px-3 py-1 rounded-sm backdrop-blur-md border text-[10px] uppercase tracking-[0.2em] font-medium flex items-center gap-1 ${isMGT ? 'bg-tier-std-500/20 border-tier-std-500/30 text-tier-std-300' : 'bg-gold-500/20 border-gold-500/30 text-gold-300'}`}>
                        <Sparkles className="w-3 h-3" />
                        {t('feed.highlight')}
                    </span>
                )}
                <span className={`px-3 py-1 rounded-sm backdrop-blur-md border text-[10px] uppercase tracking-[0.2em] font-medium ${theme === 'light' ? 'bg-white/90 border-gray-200 text-gray-900' : 'bg-black/80 border-white/30 text-white'} ${isMGT && theme !== 'light' ? 'border-white/30 text-white' : ''} ${!isMGT && theme !== 'light' ? 'border-gold-500/30 text-gold-300' : ''}`}>
                    {category}
                </span>
            </div>

            {/* Expand Button (only if not expanded) */}
            {!isExpanded && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors block cursor-pointer"
                        title={t('actions.expand')}
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
    authorProfileBorder,
    authorMembershipType,
    authorIsElite,
    authorEliteUntil,
    likes,
    comments,
    isLiked,
    isHighlight,
    poll,
    onLike,
    onComment,
    onDelete,
    onShare,
    onPollVote,
    isExpanded = false
}: FeedItemProps) {
    const { t } = useTranslation();
    const { user, theme, isVisitor, showToast, accentColor, accentGradient } = useAuth();
    const { config } = useCommunity();
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [showVisitorBlock, setShowVisitorBlock] = useState(false);
    const [visitorBlockFeature, setVisitorBlockFeature] = useState('');
    const [showSponsorModal, setShowSponsorModal] = useState(false);
    const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
    const isOwner = user?.id === authorId;
    const isAdmin = user?.role === 'ADMIN';
    const canDelete = isOwner || isAdmin;
    const isMGT = user?.membershipType === 'MGT';

    // Use dynamic colors from CommunityContext
    const stdColor = config.accentColor || config.backgroundColor || '#10b981';
    const vipColor = config.tierVipColor || '#d4af37';
    const defaultAccent = isMGT ? stdColor : vipColor;
    const userAccent = accentColor || defaultAccent;


    const handleShare = async () => {
        if (isVisitor) {
            setVisitorBlockFeature('compartilhar posts');
            setShowVisitorBlock(true);
            return;
        }
        
        // Generate public share link with OG meta tags for preview
        const shareUrl = `https://magazine-srt.vercel.app/api/og/post/${id}`;
        
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

    const handlePollVote = async (optionId: string) => {
        if (isVisitor) {
            setVisitorBlockFeature('votar em enquetes');
            setShowVisitorBlock(true);
            return;
        }

        setVotingOptionId(optionId);
        try {
            await api.post('/posts/poll/vote', { optionId });
            if (onPollVote) {
                onPollVote(id, optionId);
            }
        } catch (error: any) {
            showToast(error.response?.data?.error || t('feed.voteError'));
        } finally {
            setVotingOptionId(null);
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) return;
        
        setIsReporting(true);
        try {
            await api.post(`/reports/post/${id}`, { reason: reportReason });
            showToast(t('feed.reportSuccess'));
            setShowReportModal(false);
            setReportReason('');
        } catch (error: any) {
            showToast(error.response?.data?.error || t('feed.reportError'));
        } finally {
            setIsReporting(false);
        }
    };

    // Themed styles - Apple Vision Pro padronizado
    const cardBg = theme === 'light' 
        ? 'bg-white/90' 
        : 'bg-[#1c1c1e]/90';
    const cardBorder = theme === 'light' 
        ? 'border-gray-200' 
        : 'border-white/10';
    const cardHoverBorder = isMGT ? 'hover:border-tier-std-500/30' : 'hover:border-gold-500/30';
    const cardShadow = theme === 'light'
        ? 'shadow-lg'
        : 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={!isExpanded ? { scale: 1.01, y: -3 } : {}}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            className={`${cardBg} rounded-2xl ${accentGradient ? 'border-gradient-accent' : `border ${cardBorder}`} ${cardShadow} backdrop-blur-2xl overflow-hidden group h-full w-full flex flex-col relative transition-all duration-300 ${!accentGradient ? cardHoverBorder : ''} ${isPressed && theme === 'light' ? 'ring-2 ring-gray-300' : ''}`}
        >
            {(image || video) && (
                <div className={`relative ${isExpanded ? 'w-full' : 'aspect-square md:aspect-[4/3]'} overflow-hidden bg-black rounded-t-xl`}>
                    {!isExpanded ? (
                        <Link to={`/post/${id}`} className="block w-full h-full">
                            <MediaContent video={video} image={image} title={title} category={category} theme={theme} isMGT={isMGT} isExpanded={isExpanded} isHighlight={isHighlight} t={t} />
                        </Link>
                    ) : (
                        <div className="w-full h-full">
                            <MediaContent video={video} image={image} title={title} category={category} theme={theme} isMGT={isMGT} isExpanded={isExpanded} isHighlight={isHighlight} t={t} />
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={`p-5 flex flex-col flex-1 relative ${!(image || video) ? 'min-h-[180px]' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full p-[2px] shadow-md" style={{ background: getProfileBorderGradient(authorProfileBorder, authorMembershipType === 'MGT') }}>
                            <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${theme === 'light' ? 'bg-gray-100' : 'bg-black'}`}>
                                {authorAvatar ? (
                                    <img src={authorAvatar} alt={author} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: userAccent }} />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium uppercase tracking-wider`} style={{ color: userAccent }}>{author}</span>
                            {authorId && <BadgeDisplay userId={authorId} isElite={authorIsElite} eliteUntil={authorEliteUntil} size="sm" />}
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
                                            <Trash2 className="w-4 h-4" /> {isAdmin && !isOwner ? t('feed.removeAdmin') : t('feed.delete')}
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
                                        <Share2 className="w-4 h-4" /> {t('actions.share')}
                                    </button>
                                    {isOwner && !isHighlight && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setShowMenu(false);
                                                setShowSponsorModal(true);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-gold-400 hover:bg-gold-500/10 flex items-center gap-2 transition-colors"
                                        >
                                            <Megaphone className="w-4 h-4" /> Patrocinar
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setShowMenu(false);
                                            setShowReportModal(true);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                    >
                                        <Flag className="w-4 h-4" /> {t('feed.report')}
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
                                    <Check className="w-3 h-3" /> {t('feed.linkCopied')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                            <h3 className="text-white font-serif text-lg mb-4">{t('feed.reportPost')}</h3>
                            <p className="text-gray-400 text-sm mb-4">{t('feed.reportReason')}</p>
                            <div className="space-y-2 mb-4">
                                {[t('feed.reportReasons.inappropriate'), t('feed.reportReasons.spam'), t('feed.reportReasons.hate'), t('feed.reportReasons.violence'), t('feed.reportReasons.harassment'), t('feed.reportReasons.other')].map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => setReportReason(reason)}
                                        className={`w-full p-3 rounded-lg text-left text-sm transition-colors ${
                                            reportReason === reason 
                                                ? (isMGT ? 'bg-tier-std-500/20 border-tier-std-500/50 text-tier-std-400' : 'bg-gold-500/20 border-gold-500/50 text-gold-400')
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
                                    {t('actions.cancel')}
                                </button>
                                <button
                                    onClick={handleReport}
                                    disabled={!reportReason || isReporting}
                                    className={`flex-1 py-2 rounded-lg font-medium disabled:opacity-50 ${
                                        isMGT 
                                            ? 'bg-tier-std-500 text-black hover:bg-tier-std-400' 
                                            : 'bg-gold-500 text-black hover:bg-gold-400'
                                    }`}
                                >
                                    {isReporting ? t('feed.sending') : t('feed.report')}
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

                {/* Poll Section */}
                {poll && poll.options.length > 0 && (
                    <div className="mb-4">
                        {/* Poll Question */}
                        {poll.question && (
                            <p className={`text-sm font-medium mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white/90'}`}>
                                {poll.question}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-4 h-4" style={{ color: userAccent }} />
                            <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                {poll.totalVotes} {poll.totalVotes === 1 ? t('feed.vote') : t('feed.votes')}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {poll.options.map((option) => {
                                const isVoted = poll.userVotedOptionId === option.id;
                                const hasVoted = poll.userVotedOptionId !== null;
                                const isVoting = votingOptionId === option.id;

                                return (
                                    <motion.button
                                        key={option.id}
                                        whileHover={{ scale: hasVoted ? 1 : 1.01 }}
                                        whileTap={{ scale: hasVoted ? 1 : 0.99 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (!hasVoted && !isVoting) {
                                                handlePollVote(option.id);
                                            }
                                        }}
                                        disabled={hasVoted || isVoting}
                                        className={`relative w-full p-3 rounded-xl text-left overflow-hidden transition-all ${
                                            hasVoted 
                                                ? 'cursor-default' 
                                                : 'cursor-pointer hover:bg-opacity-90'
                                        }`}
                                        style={{
                                            background: theme === 'light' 
                                                ? (isVoted ? `${userAccent}15` : 'rgba(0,0,0,0.03)')
                                                : (isVoted ? `${userAccent}20` : 'rgba(255,255,255,0.05)'),
                                            border: `1px solid ${isVoted ? userAccent : (theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}`
                                        }}
                                    >
                                        {/* Progress bar background */}
                                        {hasVoted && (
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${option.percentage}%` }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                className="absolute inset-y-0 left-0"
                                                style={{ 
                                                    background: `linear-gradient(90deg, ${userAccent}30, ${userAccent}15)`,
                                                    borderRadius: 'inherit'
                                                }}
                                            />
                                        )}
                                        
                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {isVoted && (
                                                    <Check className="w-4 h-4" style={{ color: userAccent }} />
                                                )}
                                                <span className={`text-sm ${
                                                    isVoted 
                                                        ? 'font-medium' 
                                                        : ''
                                                } ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                                    {option.text}
                                                </span>
                                            </div>
                                            {hasVoted && (
                                                <span 
                                                    className="text-sm font-semibold"
                                                    style={{ color: userAccent }}
                                                >
                                                    {option.percentage}%
                                                </span>
                                            )}
                                            {isVoting && (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="w-4 h-4 rounded-full border-2 border-t-transparent"
                                                    style={{ borderColor: `${userAccent}40`, borderTopColor: 'transparent' }}
                                                />
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Spacer to push actions to bottom */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); onLike && onLike(id); }}
                            className={`flex items-center gap-2 transition-colors group/like ${isLiked ? 'text-red-500' : (isMGT ? 'text-gray-500 hover:text-tier-std-500' : 'text-gray-500 hover:text-red-500')}`}
                        >
                            <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-red-500' : (isMGT ? 'group-hover/like:fill-tier-std-500' : 'group-hover/like:fill-red-500')}`} />
                            <span className="text-xs tracking-wider font-medium">{likes}</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isVisitor) {
                                    setVisitorBlockFeature('comentar');
                                    setShowVisitorBlock(true);
                                } else {
                                    onComment && onComment(id);
                                }
                            }}
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

            {/* Visitor Block Popup */}
            <VisitorBlockPopup 
                isOpen={showVisitorBlock} 
                onClose={() => setShowVisitorBlock(false)} 
                featureName={visitorBlockFeature}
            />

            {/* Sponsor Post Modal */}
            <SponsorPostModal
                isOpen={showSponsorModal}
                onClose={() => setShowSponsorModal(false)}
                postId={String(id)}
            />
        </motion.div>
    );
}
