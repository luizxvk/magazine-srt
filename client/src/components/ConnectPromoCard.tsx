import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, Volume2, MessageSquare, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useState, useEffect } from 'react';

export default function ConnectPromoCard() {
  const navigate = useNavigate();
  const { theme, user } = useAuth();
  const { isStdTier } = useCommunity();
  const isMGT = user?.membershipType ? isStdTier(user.membershipType) : true;
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-zinc-900/80';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';
  
  // Modular tier colors
  const tierAccent = isMGT ? 'text-tier-std' : 'text-gold-500';

  useEffect(() => {
    // Check if already dismissed in this session
    const isDismissed = sessionStorage.getItem('connect-promo-dismissed');
    if (!isDismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('connect-promo-dismissed', 'true');
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: dismissed ? 0 : 1, y: dismissed ? -20 : 0 }}
      className={`relative overflow-hidden rounded-2xl ${themeBg} border ${themeBorder} backdrop-blur-xl`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br to-transparent ${isMGT ? 'from-tier-std-600/20 via-tier-std-600/10' : 'from-gold-600/20 via-gold-600/10'}`} />
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${isMGT ? 'bg-tier-std\/10' : 'bg-gold-500/10'}`} />
      
      {/* NEW badge */}
      <div className="absolute top-3 left-3">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isMGT ? 'bg-tier-std text-white' : 'bg-gold-500 text-black'}`}>
          <Sparkles className="w-3 h-3" />
          NOVO
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={`absolute top-3 right-3 p-1.5 rounded-full ${themeSecondary} hover:bg-white/10 transition-colors`}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative p-6 pt-12">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isMGT ? 'bg-tier-std shadow-tier-std\/20' : 'bg-gold-500 shadow-gold-500/25'}`}>
              <Radio className={`w-7 h-7 ${isMGT ? 'text-white' : 'text-black'}`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-bold ${themeText} mb-1`}>
              Rovex Connect
            </h3>
            <p className={`${themeSecondary} text-sm mb-4`}>
              Converse em tempo real com seus amigos. Chat de texto, canais de voz e muito mais!
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className={`flex items-center gap-1.5 text-xs ${tierAccent}`}>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat em grupos</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${tierAccent}`}>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Canais de voz</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${tierAccent}`}>
                <Users className="w-3.5 h-3.5" />
                <span>Ver quem está online</span>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/connect')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg transition-shadow ${isMGT ? 'bg-tier-std text-white shadow-tier-std\/20 hover:shadow-tier-std\/30' : 'bg-gold-500 text-black shadow-gold-500/25 hover:shadow-gold-500/40'}`}
            >
              Experimentar agora
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
