import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Wrench, Gamepad2, Crown, Store, Users, MessageSquare, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import ToolsCarousel from './ToolsCarousel';
import FreeGamesCard from './FreeGamesCard';
import ElitePromoCard from './ElitePromoCard';
import MarketCard from './MarketCard';
import GroupChatCard from './GroupChatCard';
import FeedbackFormCard from './FeedbackFormCard';
import AnnouncementCard from './AnnouncementCard';

/**
 * Carousel de cards da sidebar para tela mobile na página Explorar.
 * Cada "página" mostra um card diferente com drag/swipe para navegar.
 */
export default function ExploreCardsCarousel() {
    const { user, theme } = useAuth();
    const { getAccentColor } = useTierColors();
    const isMGT = user?.membershipType === 'MGT';
    const [currentPage, setCurrentPage] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const cards = [
        { id: 'tools', label: 'Ferramentas', icon: Wrench },
        { id: 'games', label: 'Jogos Grátis', icon: Gamepad2 },
        { id: 'elite', label: 'Elite', icon: Crown },
        { id: 'market', label: 'Mercado', icon: Store },
        { id: 'groups', label: 'Grupos', icon: Users },
        { id: 'feedback', label: 'Feedback', icon: MessageSquare },
        { id: 'news', label: 'Novidades', icon: Megaphone },
    ];

    const scrollToPage = useCallback((page: number) => {
        const container = containerRef.current;
        if (!container) return;
        const pageWidth = container.offsetWidth;
        container.scrollTo({ left: page * pageWidth, behavior: 'smooth' });
        setCurrentPage(page);
    }, []);

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container || isDragging.current) return;
        const pageWidth = container.offsetWidth;
        const page = Math.round(container.scrollLeft / pageWidth);
        setCurrentPage(page);
    }, []);

    // Mouse drag handlers for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startX.current = e.pageX - (containerRef.current?.offsetLeft || 0);
        scrollLeft.current = containerRef.current?.scrollLeft || 0;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        e.preventDefault();
        const x = e.pageX - (containerRef.current.offsetLeft || 0);
        const walk = (x - startX.current) * 1.5;
        containerRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        handleScroll();
    };

    const accentColor = getAccentColor(isMGT);
    const themeBorder = isMGT ? 'border-tier-std-500/20' : 'border-gold-500/20';
    const cardBg = theme === 'light' ? 'bg-white/60' : 'bg-black/20';

    return (
        <div className={`${cardBg} backdrop-blur-xl rounded-2xl border ${themeBorder} p-3 md:hidden`}>
            {/* Scroll container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 cursor-grab active:cursor-grabbing"
                style={{ scrollSnapType: 'x mandatory' }}
            >
                {cards.map((card) => {
                    const IconComp = card.icon;
                    return (
                        <div
                            key={card.id}
                            className="flex-shrink-0 w-full snap-center px-1"
                            style={{ scrollSnapAlign: 'center' }}
                        >
                            {/* Card label header */}
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <div
                                    className="flex items-center justify-center w-6 h-6 rounded-lg"
                                    style={{ backgroundColor: `${accentColor}20` }}
                                >
                                    <IconComp className="w-3.5 h-3.5" style={{ color: accentColor }} />
                                </div>
                                <span
                                    className={`text-sm font-semibold tracking-wide ${
                                        theme === 'light' ? 'text-gray-700' : 'text-white/80'
                                    }`}
                                >
                                    {card.label}
                                </span>
                                <div
                                    className="flex-1 h-px ml-1"
                                    style={{ background: `linear-gradient(to right, ${accentColor}30, transparent)` }}
                                />
                            </div>

                            <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-xl">
                                {card.id === 'tools' && <ToolsCarousel />}
                                {card.id === 'games' && <FreeGamesCard />}
                                {card.id === 'elite' && <ElitePromoCard />}
                                {card.id === 'market' && <MarketCard />}
                                {card.id === 'groups' && <GroupChatCard />}
                                {card.id === 'feedback' && <FeedbackFormCard />}
                                {card.id === 'news' && <AnnouncementCard />}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation: dots + arrows + label */}
            <div className="flex items-center justify-between mt-2 px-1">
                <button
                    onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                    style={{ color: accentColor }}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                    {cards.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollToPage(idx)}
                            className={`rounded-full transition-all duration-300 ${
                                idx === currentPage ? 'w-5 h-1.5' : 'w-1.5 h-1.5'
                            }`}
                            style={{
                                backgroundColor: idx === currentPage
                                    ? accentColor
                                    : theme === 'light' ? '#d1d5db' : 'rgba(255,255,255,0.15)'
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={() => scrollToPage(Math.min(cards.length - 1, currentPage + 1))}
                    disabled={currentPage === cards.length - 1}
                    className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                    style={{ color: accentColor }}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
