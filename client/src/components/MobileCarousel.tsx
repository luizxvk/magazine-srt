import { useState, useRef, useEffect } from 'react';
import { Gift, Camera, Calendar, Users, Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
    onEventsClick 
}: MobileCarouselProps) {
    const { user, accentColor } = useAuth();
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const isMGT = user?.membershipType === 'MGT';
    const defaultColor = isMGT ? '#10b981' : '#d4af37';
    const color = accentColor || defaultColor;

    const cards: CarouselCard[] = [
        {
            id: 'daily',
            title: 'Bônus Diário',
            subtitle: dailyLoginStatus?.claimed 
                ? `Sequência: ${dailyLoginStatus.streak} dias` 
                : `Resgate ${dailyLoginStatus?.nextReward || 0} Zions`,
            icon: <Gift className="w-6 h-6" />,
            gradient: 'from-amber-500 to-orange-600',
            onClick: onDailyLoginClick,
            badge: dailyLoginStatus?.claimed ? '✓' : dailyLoginStatus?.nextReward
        },
        {
            id: 'photos',
            title: 'Catálogo de Fotos',
            subtitle: 'Explore as fotos da comunidade',
            icon: <Camera className="w-6 h-6" />,
            gradient: 'from-pink-500 to-rose-600',
            onClick: () => navigate('/photos')
        },
        {
            id: 'events',
            title: 'Eventos Exclusivos',
            subtitle: 'Confira os próximos eventos',
            icon: <Calendar className="w-6 h-6" />,
            gradient: 'from-violet-500 to-purple-600',
            onClick: onEventsClick
        },
        {
            id: 'members',
            title: 'Membros Novos',
            subtitle: 'Conheça quem chegou',
            icon: <Users className="w-6 h-6" />,
            gradient: 'from-cyan-500 to-blue-600',
            onClick: onNewMembersClick
        },
        {
            id: 'highlights',
            title: 'Destaques da Semana',
            subtitle: 'Os melhores momentos',
            icon: <Star className="w-6 h-6" />,
            gradient: 'from-yellow-500 to-amber-600',
            onClick: () => navigate('/highlights')
        },
        {
            id: 'feedback',
            title: 'Feedback',
            subtitle: 'Sua opinião importa!',
            icon: <MessageSquare className="w-6 h-6" />,
            gradient: 'from-emerald-500 to-teal-600',
            onClick: () => navigate('/feedback')
        }
    ];

    // Handle scroll snap
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const handleScroll = () => {
            const cardWidth = 160 + 12; // card width + gap
            const newIndex = Math.round(carousel.scrollLeft / cardWidth);
            setCurrentIndex(Math.min(newIndex, cards.length - 1));
        };

        carousel.addEventListener('scroll', handleScroll);
        return () => carousel.removeEventListener('scroll', handleScroll);
    }, [cards.length]);

    // Mouse/Touch drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
        setScrollLeft(carouselRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 1.5;
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
        <div className="xl:hidden mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-medium text-gray-400">Acesso Rápido</h3>
                <div className="flex gap-1">
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
                        disabled={currentIndex >= cards.length - 2}
                    >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Carousel Container */}
            <div 
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 cursor-grab active:cursor-grabbing"
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
                        onClick={card.onClick}
                        className="flex-shrink-0 w-40 snap-start"
                    >
                        <div 
                            className={`relative h-24 rounded-xl overflow-hidden bg-gradient-to-br ${card.gradient} p-3 flex flex-col justify-between transition-transform active:scale-95`}
                        >
                            {/* Badge */}
                            {card.badge && (
                                <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-white">
                                    {card.badge}
                                </div>
                            )}
                            
                            {/* Icon */}
                            <div className="text-white/90">
                                {card.icon}
                            </div>
                            
                            {/* Text */}
                            <div className="text-left">
                                <p className="text-white font-semibold text-sm leading-tight truncate">
                                    {card.title}
                                </p>
                                <p className="text-white/70 text-[10px] leading-tight truncate">
                                    {card.subtitle}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-3">
                {cards.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => scrollToIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex 
                                ? 'w-4' 
                                : 'w-1.5 bg-white/20 hover:bg-white/30'
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
