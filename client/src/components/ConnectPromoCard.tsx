import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Radio, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function ConnectPromoCard() {
  const navigate = useNavigate();
  const { theme, accentColor } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const themeBg = theme === 'light' ? 'bg-white/90' : 'bg-zinc-900/80';
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: dismissed ? 0 : 1, y: dismissed ? -10 : 0 }}
      className={`relative overflow-hidden rounded-xl ${themeBg} border ${themeBorder} backdrop-blur-xl cursor-pointer group`}
      onClick={() => navigate('/connect')}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Radio className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${themeText} text-sm`}>Rovex Connect</span>
            <span 
              className="px-1.5 py-0.5 text-[10px] font-bold rounded text-white"
              style={{ backgroundColor: accentColor }}
            >
              NOVO
            </span>
          </div>
          <p className={`${themeSecondary} text-xs truncate`}>
            Chat de texto e voz com seus amigos
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className={`p-1.5 rounded-full ${themeSecondary} hover:bg-white/10 transition-colors flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
