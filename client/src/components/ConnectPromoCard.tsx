import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Radio, Users, Volume2, MessageSquare, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function ConnectPromoCard() {
  const navigate = useNavigate();
  const { theme } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const themeBg = theme === 'light' ? 'bg-white' : 'bg-zinc-900/80';
  const themeText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const themeSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const themeBorder = theme === 'light' ? 'border-gray-200' : 'border-white/10';

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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-violet-600/10 to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      
      {/* NEW badge */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-bold">
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Radio className="w-7 h-7 text-white" />
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
              <div className="flex items-center gap-1.5 text-xs text-purple-400">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat em grupos</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-400">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Canais de voz</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-400">
                <Users className="w-3.5 h-3.5" />
                <span>Ver quem está online</span>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/connect')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
            >
              Experimentar agora
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
