import { useEffect, useState } from 'react';
import api from '../services/api';
import { Award, Lock, UserPlus, Users, Star, Crown, PenTool, FileText, Megaphone, MessageCircle, Heart, ThumbsUp, Camera, MessageSquare, Coins, Calendar, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const iconMap: { [key: string]: any } = {
    UserPlus, Users, Star, Crown, PenTool, FileText, Megaphone, MessageCircle, Heart, ThumbsUp, Camera, MessageSquare, Coins, Calendar, Flame, Award
};

interface Badge {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    isEarned: boolean;
    trophies: number;
}

interface BadgesProps {
    userId?: string; // Optional userId to fetch badges for specific user
}

export default function Badges({ userId }: BadgesProps = {}) {
    const [badges, setBadges] = useState<Badge[]>([]);
    const { user } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const themeBorder = isMGT ? 'border-tier-std-500/20' : 'border-gold-500/20';
    const themeIcon = isMGT ? 'text-tier-std-400' : 'text-gold-400';
    const themeShadow = isMGT ? 'group-hover:shadow-[0_0_30px_rgba(220,20,60,0.4)]' : 'group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]';

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                // Use provided userId or default to logged-in user
                const targetUserId = userId || user?.id;
                if (!targetUserId) return;
                
                const response = await api.get(`/gamification/badges?userId=${targetUserId}`);
                setBadges(response.data);
            } catch (error) {
                console.error('Failed to fetch badges', error);
            }
        };

        fetchBadges();
    }, [userId, user?.id]);

    return (
        <div className={`glass-panel rounded-xl p-6 border ${themeBorder}`}>
            <div className="flex items-center gap-3 mb-6">
                <Award className={`w-6 h-6 ${themeIcon}`} />
                <h3 className="text-xl font-serif text-white tracking-wider uppercase">Conquistas</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {badges.map((badge) => (
                    <div key={badge.id} className={`flex flex-col items-center text-center group ${badge.isEarned ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        <div className={`w-16 h-16 rounded-full bg-black/40 border ${isMGT ? 'border-tier-std-500/30 group-hover:border-red-500/60' : 'border-gold-500/30 group-hover:border-gold-500/60'} flex items-center justify-center mb-2 relative overflow-hidden transition-all duration-300 group-hover:scale-105 ${themeShadow}`}>
                            {badge.imageUrl && badge.imageUrl.startsWith('icon:') ? (
                                (() => {
                                    const IconComponent = iconMap[badge.imageUrl.split(':')[1]];
                                    return IconComponent ? (
                                        <IconComponent className={`w-8 h-8 ${isMGT ? 'text-tier-std-500' : 'text-gold-500'}`} />
                                    ) : (
                                        <Award className={`w-8 h-8 ${isMGT ? 'text-tier-std-500' : 'text-gold-500'}`} />
                                    );
                                })()
                            ) : badge.imageUrl ? (
                                <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-cover" />
                            ) : (
                                <Award className={`w-8 h-8 ${isMGT ? 'text-tier-std-500' : 'text-gold-500'}`} />
                            )}
                            {!badge.isEarned && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-white/50" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-white font-medium mb-1">{badge.name}</p>
                        <p className={`text-[10px] ${isMGT ? 'text-tier-std-400' : 'text-gold-400'} font-bold mb-1`}>+{badge.trophies} Troféus</p>
                        <p className="text-[10px] text-gray-300 leading-tight hidden group-hover:block transition-all">{badge.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
