import { useState, useRef, useEffect } from 'react';
import { Gift, Camera, Calendar, Users, Star, MessageSquare, ChevronLeft, ChevronRight, UserPlus, Hand, Package, Info, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MobileCarouselProps {
    dailyLoginStatus: {
        claimed: boolean;
        streak: number;
        nextReward: number;
    } | null;
    onDailyLoginClick: () => void;
    onNewMembersClick: () => void;
    onEventsClick: () => void;
    onSupplyBoxClick?: () => void;
}

interface CarouselCard {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    gradient: string;
    onClick?: () => void;
    badge?: string | number;
}

export default function MobileCarousel({
    dailyLoginStatus,
    onDailyLoginClick,
    onNewMembersClick,
    onEventsClick,
    onSupplyBoxClick
}: MobileCarouselProps) {
    const { user, accentColor } = useAuth();
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);

    const isMGT = user?.membershipType === 'MGT';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    // Estilo padrão Apple Vision Pro - escuro com accent color do usuário
    const cardStyle = isMGT 
        ? 'from-emerald-500/20 to-emerald-900/40' 
        : 'from-[#2c2c2e] to-[#1c1c1e]';

    const cards: CarouselCard[] = [
        {
            id: 'daily',
            title: 'Bônus Diário',
            subtitle: dailyLoginStatus?.claimed
                ? `Sequência: ${dailyLoginStatus.streak} dias`
                : `Resgate ${dailyLoginStatus?.nextReward || 0} Zions`,
            icon: <Gift className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: onDailyLoginClick,
            badge: dailyLoginStatus?.claimed ? '✓' : dailyLoginStatus?.nextReward
        },
        {
            id: 'supplybox',
            title: 'Supply Box',
            subtitle: 'Abra e ganhe prêmios!',
            icon: <Package className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: onSupplyBoxClick,
            badge: '🎁'
        },
        {
            id: 'whatsnew',
            title: 'O Que Há de Novo',
            subtitle: 'Novidades e atualizações',
            icon: <Star className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: () => {
                const event = new CustomEvent('openWhatsNew');
                window.dispatchEvent(event);
            }
        },
        {
            id: 'recommended',
            title: 'Adicionar Amigos',
            subtitle: 'Pessoas que você pode conhecer',
            icon: <UserPlus className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: () => navigate('/social?tab=recommended')
        },
        {
            id: 'photos',
            title: 'Catálogo de Fotos',
            subtitle: 'Explore as fotos da comunidade',
            icon: <Camera className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: () => navigate('/catalog')
        },
        {
            id: 'events',
            title: 'Eventos Exclusivos',
            subtitle: 'Confira os próximos eventos',
            icon: <Calendar className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: onEventsClick
        },
        {
            id: 'tournaments',
            title: 'Torneios',
            subtitle: 'Competições e prêmios',
            icon: <Trophy className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: () => navigate('/tournaments'),
            badge: '🏆'
        },
        {
            id: 'members',
            title: 'Membros Novos',
            subtitle: 'Conheça quem chegou',
            icon: <Users className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: onNewMembersClick
        },
        {
            id: 'highlights',
            title: 'Destaques da Semana',
            subtitle: 'Os melhores momentos',
            icon: <Star className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: () => navigate('/highlights')
        },
        {
            id: 'feedback',
            title: 'Feedback',
            subtitle: 'Sua opinião importa!',
            icon: <MessageSquare className="w-6 h-6" />,
            gradient: cardStyle,
            onClick: () => navigate('/feedback')
        },
        {
            id: 'about-rovex',
            title: 'Quem Somos',
            subtitle: 'Conheça a Rovex',
            icon: <Info className="w-6 h-6" />,
            gradient: 'from-purple-500/20 to-purple-900/40',
            onClick: () => navigate('/sobre-rovex')
        }
    ];

    // Handle scroll snap
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const handleScroll = () => {
            const cardWidth = 160 + 12; // card width + gap
            const scrollPosition = carousel.scrollLeft;
            const newIndex = Math.round(scrollPosition / cardWidth);
            // Clamp between 0 and cards.length - 1
            const clampedIndex = Math.max(0, Math.min(newIndex, cards.length - 1));
            if (clampedIndex !== currentIndex) {
                setCurrentIndex(clampedIndex);
            }
        };

        carousel.addEventListener('scroll', handleScroll);
        // Call once to set initial index
        handleScroll();
        return () => carousel.removeEventListener('scroll', handleScroll);
    }, [cards.length, currentIndex]);

    // Mouse/Touch drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setHasMoved(false);
        setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
        setScrollLeft(carouselRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 5) {
            setHasMoved(true);
        }
        if (carouselRef.current) {
            carouselRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const scrollToIndex = (index: number) => {
        const cardWidth = 160 + 12;
        carouselRef.current?.scrollTo({
            left: index * cardWidth,
            behavior: 'smooth'
        });
    };

    const handlePrev = () => {
        const newIndex = Math.max(0, currentIndex - 1);
        scrollToIndex(newIndex);
    };

    const handleNext = () => {
        const newIndex = Math.min(cards.length - 1, currentIndex + 1);
        scrollToIndex(newIndex);
    };

    return (
        <div className="xl:hidden mb-6 relative group w-full">
            {/* Subtle glow background for visibility */}
            <div 
                className="absolute -inset-2 rounded-2xl opacity-30 blur-xl pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${color}20 0%, transparent 60%)` }}
            />
            
            {/* Header - Arrows only visible on larger tablets (sm+) */}
            <div className="flex items-center justify-between mb-3 px-1 relative">
                <div className="flex items-center gap-2">
                    <div 
                        className="w-1.5 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <h3 
                        className="text-sm font-bold text-white"
                    >
                        Acesso Rápido
                    </h3>
                    {/* Swipe hint for mobile */}
                    <div className="flex sm:hidden items-center gap-1 text-gray-500">
                        <Hand className="w-3 h-3 animate-pulse" />
                        <ChevronRight className="w-3 h-3 animate-bounce-x" />
                    </div>
                </div>
                <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handlePrev}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30"
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30"
                        disabled={currentIndex >= cards.length - 1}
                    >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Carousel Container */}
            <div className="relative w-full overflow-visible">
                <div
                    ref={carouselRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 cursor-grab active:cursor-grabbing -mx-1 px-1"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {cards.map((card) => (
                        <button
                            key={card.id}
                            onClick={(e) => {
                                if (hasMoved) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                }
                                card.onClick?.();
                            }}
                            className="flex-shrink-0 w-32 sm:w-36 snap-start transition-opacity duration-300"
                        >
                            <div
                                className={`relative h-20 sm:h-24 rounded-xl overflow-hidden bg-gradient-to-br ${card.gradient} p-2.5 flex flex-col justify-between shadow-lg shadow-black/30 active:scale-95 transition-transform border border-white/10 backdrop-blur-xl`}
                            >
                                {/* Badge */}
                                {card.badge && (
                                    <div className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm">
                                        {card.badge}
                                    </div>
                                )}

                                {/* Icon */}
                                <div className="drop-shadow-md" style={{ color }}>
                                    {card.icon}
                                </div>

                                {/* Text */}
                                <div className="text-left">
                                    <p className="text-white drop-shadow-md font-bold text-[11px] sm:text-xs leading-tight truncate">
                                        {card.title}
                                    </p>
                                    <p className="text-white/70 drop-shadow-md text-[9px] leading-tight truncate mt-0.5">
                                        {card.subtitle}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Fade Gradients for edge indication - Removed to prevent overflow issues */}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-[-8px]">
                {cards.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => scrollToIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                            ? 'w-4'
                            : 'w-1.5 bg-white/10 hover:bg-white/20'
                            }`}
                        style={{
                            backgroundColor: idx === currentIndex ? color : undefined
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
