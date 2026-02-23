import { useState, useEffect } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MgtLogCard from './MgtLogCard'; // Updated to correct component name

interface Announcement {
    id: string;
    title: string;
    logoUrl: string;
    tag: string;
    subscriptionType: string;
    description: string;
    backgroundImageUrl?: string;
    buttonText: string;
    link: string;
}

export default function AnnouncementCard() {
    const { user, theme } = useAuth();
    const navigate = useNavigate();
    const isMGT = user?.membershipType === 'MGT';
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const response = await api.get('/announcements/active');
                setAnnouncement(response.data);
            } catch (error) {
                console.error('Failed to fetch announcement', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncement();
    }, []);

    // Loading state removed as per user request
    if (!announcement && !loading) return <MgtLogCard />;
    if (!announcement) return <MgtLogCard />; // Show fallback during loading too

    // Theme Colors
    const themeBorder = isMGT
        ? (theme === 'light' ? 'border-tier-std-500/20' : 'border-tier-std-500/50')
        : 'border-gold-500/50';
    const themeGlow = isMGT
        ? 'shadow-[0_0_30px_rgba(var(--tier-std-color-rgb),0.4)] hover:shadow-[0_0_50px_rgba(var(--tier-std-color-rgb),0.6)]'
        : 'shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)]';
    const themeText = isMGT ? 'text-tier-std-100' : 'text-gold-100';
    const themeAccent = isMGT ? 'text-tier-std-500' : 'text-gold-500';
    const themeButton = isMGT ? 'bg-tier-std-600 hover:bg-tier-std-500' : 'bg-gold-500 hover:bg-gold-400';
    const themeGradient = isMGT
        ? (theme === 'light' ? 'bg-gradient-to-br from-tier-std-900/40 via-gray-900 to-black' : 'bg-gradient-to-br from-tier-std-900/60 via-black to-black')
        : 'bg-gradient-to-br from-gold-900/60 via-black to-black';

    return (
        <div
            onClick={() => navigate(announcement.link)}
            className={`relative overflow-hidden rounded-2xl border-2 ${themeBorder} ${themeGradient} ${themeGlow} group cursor-pointer transition-all duration-500`}
        >
            {/* Background Image Effect */}
            {announcement.backgroundImageUrl && (
                <div className="absolute inset-0 opacity-50 group-hover:opacity-60 transition-opacity duration-500 scale-105 group-hover:scale-110 transform">
                    <img
                        src={announcement.backgroundImageUrl}
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
            )}

            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-shine pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-6 flex flex-col h-full min-h-[320px] items-center text-center pt-12">

                {/* Badge Tag - Absolute Top Center */}
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/20 ${themeText} shadow-lg whitespace-nowrap z-20 flex items-center justify-center gap-2`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isMGT ? 'bg-tier-std-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse shrink-0`} />
                    <span className="mt-[1px]">{announcement.tag}</span>
                </div>

                <div className="flex flex-col items-center gap-2 mb-2 mt-8">
                    <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${themeAccent} drop-shadow-md whitespace-nowrap`}>
                        <Star className="w-3 h-3 fill-current" />
                        {announcement.subscriptionType}
                    </div>
                </div>

                <h3 className={`text-2xl md:text-3xl font-serif ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-3 leading-none drop-shadow-lg flex flex-col items-center w-full transition-all duration-300`}>
                    {announcement.title} <br />
                    <div className="relative mt-4 group w-full flex justify-center">
                        <div className={`absolute inset-0 ${isMGT ? 'bg-tier-std-600' : 'bg-gold-500'} blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full`} />
                        <img
                            src={announcement.logoUrl}
                            alt="Logo"
                            className="h-20 md:h-28 w-auto relative z-10 drop-shadow-xl invert brightness-0 opacity-90 transition-all duration-300"
                        />
                    </div>
                </h3>

                <p className="text-gray-200 text-sm mb-8 leading-relaxed font-light drop-shadow-md max-w-[90%] mt-2">
                    {announcement.description}
                </p>

                <div className="mt-auto w-full">
                    <button className={`w-full py-4 rounded-xl font-bold text-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all transform group-hover:scale-[1.02] active:scale-[0.98] ${themeButton} shadow-xl`}>
                        {announcement.buttonText} <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
