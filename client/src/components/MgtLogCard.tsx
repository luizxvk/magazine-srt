import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Announcement {
    id: string;
    title: string;
    tag: string;
    subscriptionType: string;
    description: string;
    logoUrl: string;
    backgroundImageUrl: string;
}

export default function MgtLogCard() {
    const { user, theme } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';

    const [isEditing] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (announcements.length === 0) return null;

    const currentItem = announcements[currentIndex];

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements');
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setAnnouncements(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        }
    };

    useEffect(() => {
        if (!isEditing && announcements.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % announcements.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isEditing, announcements.length]);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    // Theme Colors (emerald for MGT, gold for Magazine)
    const themeBorder = isMGT
        ? (theme === 'light' ? 'border-emerald-500/20' : 'border-emerald-500/50')
        : 'border-gold-500/50';
    const themeGlow = isMGT
        ? 'shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]'
        : 'shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)]';
    const themeText = isMGT ? 'text-emerald-100' : 'text-gold-100';
    const themeAccent = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeButton = isMGT ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gold-500 hover:bg-gold-400';
    const themeGradient = isMGT
        ? (theme === 'light' ? 'bg-gradient-to-br from-emerald-900/40 via-gray-900 to-black' : 'bg-gradient-to-br from-emerald-900/60 via-black to-black')
        : 'bg-gradient-to-br from-gold-900/60 via-black to-black';

    return (
        <div
            onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                navigate('/mgt-log');
            }}
            className={`relative overflow-hidden rounded-2xl border-2 ${themeBorder} ${themeGradient} ${themeGlow} group cursor-pointer transition-all duration-500`}
        >
            {/* Carousel Controls */}
            {announcements.length > 1 && !isEditing && (
                <>
                    <button
                        onClick={handlePrev}
                        aria-label="Anúncio anterior"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        aria-label="Próximo anúncio"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                        {announcements.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-3' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Background Image Effect */}
            <div className="absolute inset-0 opacity-50 group-hover:opacity-60 transition-opacity duration-500 scale-105 group-hover:scale-110 transform">
                <img
                    src={currentItem.backgroundImageUrl || "/ads/mgt-log-ad.png"}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-shine pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-6 flex flex-col h-full min-h-[320px] items-center text-center pt-12">

                {/* Badge Lançamento - Absolute Top Center */}
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/20 ${themeText} shadow-lg whitespace-nowrap z-20 flex items-center justify-center gap-2`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981] shrink-0" />
                    <span className="mt-[1px]">{currentItem.tag || 'Lançamento'}</span>
                </div>

                <div className="flex flex-col items-center gap-2 mb-2 mt-8">
                    <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${themeAccent} drop-shadow-md whitespace-nowrap`}>
                        <Star className="w-3 h-3 fill-current" />
                        {currentItem.subscriptionType || 'Assinatura Premium'}
                    </div>
                </div>

                <h3 className={`text-2xl md:text-3xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-3 leading-none drop-shadow-lg flex flex-col items-center w-full transition-all duration-300`}>
                    {currentItem.title} <br />
                    <div className="relative mt-4 group w-full flex justify-center flex-col items-center">
                        <div className={`absolute inset-0 ${isMGT ? 'bg-emerald-600' : 'bg-gold-500'} blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full`} />

                        <img
                            src={currentItem.logoUrl}
                            alt="Logo"
                            className="h-20 md:h-28 w-auto relative z-10 drop-shadow-xl invert brightness-0 opacity-90 transition-all duration-300 object-contain"
                        />
                    </div>
                </h3>

                <p className="text-gray-200 text-sm mb-8 leading-relaxed font-light drop-shadow-md max-w-[90%] mt-2 min-h-[60px]">
                    {currentItem.description}
                </p>

                <div className="mt-auto w-full">
                    <button className={`w-full py-4 rounded-xl font-bold text-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all transform group-hover:scale-[1.02] active:scale-[0.98] ${themeButton} shadow-xl`}>
                        Conhecer Agora <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
