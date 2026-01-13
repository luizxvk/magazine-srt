import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    };
    linkedProduct?: LinkedProduct | null;
}

interface FeedCarouselProps {
    posts: CarouselPost[];
}

export default function FeedCarousel({ posts }: FeedCarouselProps) {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const isMGT = user?.membershipType === 'MGT';

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, [posts.length]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
    }, [posts.length]);

    useEffect(() => {
        if (posts.length <= 1) return;
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [posts.length, nextSlide]);

    if (!posts.length) return null;

    const currentPost = posts[currentIndex];

    return (
        <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden mb-12 group">
            {/* Background Blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />

            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={{
                        enter: (direction: number) => ({
                            x: direction > 0 ? 1000 : -1000,
                            opacity: 0
                        }),
                        center: {
                            zIndex: 1,
                            x: 0,
                            opacity: 1
                        },
                        exit: (direction: number) => ({
                            zIndex: 0,
                            x: direction < 0 ? 1000 : -1000,
                            opacity: 0
                        })
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="absolute inset-0 w-full h-full"
                >
                    <Link to={`/post/${currentPost.id}`} className="block w-full h-full cursor-pointer">
                        {/* Main Image */}
                        <img
                            src={currentPost.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                            alt={currentPost.title}
                            className="w-full h-full object-cover"
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
                                {currentPost.linkedProduct && (
                                    <span className="px-3 py-1 rounded-full border bg-emerald-500/20 border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <ShoppingBag className="w-3 h-3" />
                                        Produto
                                    </span>
                                )}
                                <span className="text-xs text-gray-300 uppercase tracking-wider font-medium">
                                    {currentPost.category.toUpperCase() !== 'DESTAQUE' && currentPost.category}
                                </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif !text-white mb-4 leading-tight max-w-3xl drop-shadow-lg">
                                {currentPost.title}
                            </h2>

                            {/* Linked Product Info */}
                            {currentPost.linkedProduct && (
                                <div className="mb-4 inline-flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">{currentPost.linkedProduct.name}</span>
                                        <span className="text-xs text-gold-400">
                                            {currentPost.linkedProduct.priceZions ? `${currentPost.linkedProduct.priceZions} Z$` : ''}
                                            {currentPost.linkedProduct.priceZions && currentPost.linkedProduct.priceBRL ? ' ou ' : ''}
                                            {currentPost.linkedProduct.priceBRL ? `R$ ${currentPost.linkedProduct.priceBRL.toFixed(2)}` : ''}
                                        </span>
                                    </div>
                                    <Link
                                        to="/loja"
                                        className="px-3 py-1.5 bg-gold-500 text-black text-xs font-bold rounded-lg hover:bg-gold-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Ver na Loja
                                    </Link>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full p-0.5 ${isMGT ? 'bg-emerald-500/20' : 'bg-gold-500/20'}`}>
                                    <img
                                        src={currentPost.author.avatarUrl}
                                        alt={currentPost.author.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                                <span className="text-sm text-gray-300 font-medium">
                                    Por <span className={`${isMGT ? 'text-emerald-400' : 'text-gold-400'}`}>{currentPost.author.name}</span>
                                </span>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {posts.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100 z-20 ${isMGT ? 'hover:bg-red-500/20 hover:border-red-500/50' : 'hover:bg-gold-500/20 hover:border-gold-500/50'}`}
                        aria-label="Slide anterior"
                    >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100 z-20 ${isMGT ? 'hover:bg-red-500/20 hover:border-red-500/50' : 'hover:bg-gold-500/20 hover:border-gold-500/50'}`}
                        aria-label="Próximo slide"
                    >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 flex gap-2 z-20">
                        {posts.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setDirection(idx > currentIndex ? 1 : -1);
                                    setCurrentIndex(idx);
                                }}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex
                                    ? (isMGT ? 'w-8 bg-red-500 shadow-[0_0_10px_#ff0000]' : 'w-8 bg-gold-500 shadow-[0_0_10px_#D4AF37]')
                                    : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                aria-label={`Ir para slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
