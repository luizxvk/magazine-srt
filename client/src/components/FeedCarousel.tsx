import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { getProfileBorderGradient } from '../utils/profileBorderUtils';
import { CarouselAdSlide } from './AdBanner';

interface LinkedProduct {
    id: string;
    name: string;
    imageUrl: string | null;
    priceZions: number | null;
    priceBRL: number | null;
}

interface CarouselPost {
    id: string;
    image?: string;
    title: string;
    category: string;
    author: {
        name: string;
        avatarUrl: string;
        membershipType?: string;
        equippedProfileBorder?: string | null;
    };
    linkedProduct?: LinkedProduct | null;
}

interface FeedCarouselProps {
    posts: CarouselPost[];
}

export default function FeedCarousel({ posts }: FeedCarouselProps) {
    const { user } = useAuth();
    const { config } = useCommunity();
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const isMGT = user?.membershipType === 'MGT';
    
    // Determinar se deve mostrar anúncios no carousel
    // Não mostra para: usuários Elite, se ads desabilitados, ou se não há slot configurado
    const showAds = config.adsEnabled && 
                    config.adsCarouselEnabled && 
                    config.adsCarouselSlot && 
                    !user?.isElite;
    
    // Criar array de slides com anúncio inserido após o segundo post
    const slides = useMemo(() => {
        if (!showAds || posts.length < 2) {
            return posts.map(post => ({ type: 'post' as const, data: post }));
        }
        
        const result: Array<{ type: 'post'; data: CarouselPost } | { type: 'ad' }> = [];
        posts.forEach((post, index) => {
            result.push({ type: 'post', data: post });
            // Inserir anúncio após o segundo slide (índice 1)
            if (index === 1) {
                result.push({ type: 'ad' });
            }
        });
        return result;
    }, [posts, showAds]);

    const goToSlide = useCallback((newIndex: number) => {
        setCurrentIndex(newIndex);
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    // Animate to current slide position
    useEffect(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth || 1;
            const targetX = -currentIndex * containerWidth;
            
            animate(x, targetX, {
                type: 'spring',
                stiffness: 300,
                damping: 30,
            });
        }
    }, [currentIndex, x]);

    // Auto-slide timer
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length, nextSlide]);

    if (!posts.length) return null;

    return (
        <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden mb-12 group" ref={containerRef}>
            {/* Slides Container with Spring Animation */}
            <motion.div className="flex h-full" style={{ x }}>
                {slides.map((slide, index) => (
                    slide.type === 'ad' ? (
                        <CarouselAdSlide key={`ad-${index}`} slot={config.adsCarouselSlot || ''} />
                    ) : (
                        <div key={slide.data.id} className="shrink-0 w-full h-full relative">
                            <Link 
                                to={slide.data.linkedProduct ? `/loja/${slide.data.linkedProduct.id}` : `/post/${slide.data.id}`} 
                                className="block w-full h-full cursor-pointer"
                            >
                                {/* Main Image */}
                                <img
                                    src={slide.data.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                                    alt={slide.data.title}
                                    className="w-full h-full object-cover select-none pointer-events-none"
                                    draggable={false}
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isMGT ? 'bg-emerald-500/20 border-red-500/30 text-white' : 'bg-gold-500/20 border-gold-500/30 text-gold-300'}`}>
                                            <Sparkles className="w-3 h-3" />
                                            Destaque
                                        </span>
                                        {slide.data.linkedProduct && (
                                            <span className="px-3 py-1 rounded-full border bg-emerald-500/20 border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                <ShoppingBag className="w-3 h-3" />
                                                Produto
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-300 uppercase tracking-wider font-medium">
                                            {slide.data.category.toUpperCase() !== 'DESTAQUE' && slide.data.category}
                                        </span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif !text-white mb-4 leading-tight max-w-3xl drop-shadow-lg">
                                        {slide.data.title}
                                    </h2>

                                    {/* Linked Product Info */}
                                    {slide.data.linkedProduct && (
                                        <div className="mb-4 inline-flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">{slide.data.linkedProduct.name}</span>
                                                <span className="text-xs text-gold-400">
                                                    {slide.data.linkedProduct.priceZions ? `${slide.data.linkedProduct.priceZions} Z$` : ''}
                                                    {slide.data.linkedProduct.priceZions && slide.data.linkedProduct.priceBRL ? ' ou ' : ''}
                                                    {slide.data.linkedProduct.priceBRL ? `R$ ${slide.data.linkedProduct.priceBRL.toFixed(2)}` : ''}
                                                </span>
                                            </div>
                                            <span
                                                className="px-3 py-1.5 bg-gold-500 text-black text-xs font-bold rounded-lg hover:bg-gold-400 transition-colors"
                                            >
                                                Comprar
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full p-[2px]" style={{ background: getProfileBorderGradient(slide.data.author.equippedProfileBorder, slide.data.author.membershipType === 'MGT') }}>
                                            <img
                                                src={slide.data.author.avatarUrl}
                                                alt={slide.data.author.name}
                                                className="w-full h-full rounded-full object-cover bg-black"
                                            />
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">
                                            Por <span className={`${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>{slide.data.author.name}</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )
                ))}
            </motion.div>

            {/* Navigation Buttons */}
            {slides.length > 1 && (
                <>
                    <motion.button
                        disabled={currentIndex === 0}
                        onClick={prevSlide}
                        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all z-20
                            ${currentIndex === 0 
                                ? 'opacity-40 cursor-not-allowed' 
                                : `opacity-0 group-hover:opacity-100 ${isMGT ? 'hover:bg-red-500/20 hover:border-red-500/50' : 'hover:bg-gold-500/20 hover:border-gold-500/50'}`
                            }`}
                        aria-label="Slide anterior"
                    >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                    <motion.button
                        disabled={currentIndex === slides.length - 1}
                        onClick={nextSlide}
                        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all z-20
                            ${currentIndex === slides.length - 1 
                                ? 'opacity-40 cursor-not-allowed' 
                                : `opacity-0 group-hover:opacity-100 ${isMGT ? 'hover:bg-red-500/20 hover:border-red-500/50' : 'hover:bg-gold-500/20 hover:border-gold-500/50'}`
                            }`}
                        aria-label="Próximo slide"
                    >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {slides.map((slide, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex
                                    ? (slide.type === 'ad' 
                                        ? 'w-8 bg-blue-500 shadow-[0_0_10px_#3b82f6]'
                                        : (isMGT ? 'w-8 bg-red-500 shadow-[0_0_10px_#ff0000]' : 'w-8 bg-gold-500 shadow-[0_0_10px_#D4AF37]'))
                                    : 'w-2 bg-white/30 hover:bg-white/50'
                                    }`}
                                aria-label={slide.type === 'ad' ? 'Anúncio patrocinado' : `Ir para slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
