import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playSound } from '../utils/sounds';

interface AchievementPopupProps {
    title: string;
    description: string;
    onClose: () => void;
}

export default function AchievementPopup({ title, description, onClose }: AchievementPopupProps) {
    const [visible, setVisible] = useState(false);
    const { user, theme } = useAuth();
    const isMGT = user?.membershipType === 'MGT';

    const themeBorder = isMGT ? 'border-emerald-500/30' : 'border-gold-500/30';
    const themeShadow = isMGT ? 'shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'shadow-[0_0_30px_rgba(212,175,55,0.2)]';
    const themeIconBg = isMGT ? 'bg-gradient-to-br from-red-400 to-red-700' : 'bg-gradient-to-br from-gold-400 to-gold-700';
    const themeText = isMGT ? 'text-emerald-500' : 'text-gold-500';
    const themeBg = theme === 'light' ? 'bg-white/90' : 'bg-black/90';
    const themeTitle = theme === 'light' ? 'text-gray-900' : 'text-white';

    useEffect(() => {
        // Play level up sound for achievements
        playSound('levelUp');
        
        // Animate in
        setTimeout(() => setVisible(true), 100);

        // Auto close
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 500); // Wait for exit animation
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-24 md:top-auto md:bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-10 md:translate-y-0 opacity-0 md:opacity-100'}`}>
            <div className={`flex items-center gap-4 ${themeBg} border ${themeBorder} rounded-full pl-2 pr-8 py-2 ${themeShadow} backdrop-blur-xl min-w-[300px]`}>
                <div className={`w-12 h-12 rounded-full ${themeIconBg} flex items-center justify-center shrink-0 animate-pulse-slow`}>
                    <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className={`text-[10px] ${themeText} uppercase tracking-[0.2em] font-bold mb-0.5`}>Prêmio Recebido</p>
                    <p className={`${themeTitle} font-serif text-lg leading-none`}>{title}</p>
                    <p className="text-xs text-gray-400 mt-1">{description}</p>
                </div>
            </div>
        </div>
    );
}
