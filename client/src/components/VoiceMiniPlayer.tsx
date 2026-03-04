import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, PhoneOff, Signal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTierColors } from '../hooks/useTierColors';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface VoiceState {
  channelId: string;
  channelName: string;
  groupName: string;
  groupId: string;
  joinedAt: number;
}

export default function VoiceMiniPlayer() {
  const { user, theme, accentColor: userAccent } = useAuth();
  const { getAccentColor } = useTierColors();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMGT = user?.membershipType === 'MGT';
  
  // Hide on auth pages and connect page (since it has its own voice bar)
  const isAuthPage = ['/', '/login', '/register', '/request-invite', '/reset-password'].includes(location.pathname);
  const isConnectPage = location.pathname.startsWith('/connect');
  
  // Listen for voice state changes in localStorage
  useEffect(() => {
    const checkVoiceState = () => {
      const stored = localStorage.getItem('rovex-voice-state');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Only valid if joined within last 24 hours
          if (Date.now() - parsed.joinedAt < 24 * 60 * 60 * 1000) {
            setVoiceState(parsed);
          } else {
            localStorage.removeItem('rovex-voice-state');
            setVoiceState(null);
          }
        } catch {
          setVoiceState(null);
        }
      } else {
        setVoiceState(null);
      }
    };

    checkVoiceState();
    
    // Listen for storage changes (from ConnectPage)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rovex-voice-state') {
        checkVoiceState();
      }
    };
    
    // Also poll every second to catch same-tab changes
    const interval = setInterval(checkVoiceState, 1000);
    
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);
  
  // Auto-close after 5 seconds of inactivity when expanded
  useEffect(() => {
    if (isExpanded) {
      autoCloseTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
    }
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [isExpanded]);

  // Reset timer on any interaction
  const handleInteraction = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    if (isExpanded) {
      autoCloseTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
    }
  };

  const handleDisconnect = () => {
    // Mark as disconnecting - ConnectPage will see this and disconnect
    localStorage.setItem('rovex-voice-disconnect', Date.now().toString());
    localStorage.removeItem('rovex-voice-state');
    setVoiceState(null);
  };
  
  // Don't show if no voice state, on auth pages, or on connect page
  if (!voiceState || isAuthPage || isConnectPage) return null;

  // Use user's accent color
  const defaultAccent = getAccentColor(isMGT);
  const accentColor = userAccent || defaultAccent;
  
  const textMain = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textSub = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const bgPanel = theme === 'light' ? 'bg-white' : 'bg-zinc-900';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
        onClick={handleInteraction}
      >
        {/* Edge Handle - Always visible (collapsed state) */}
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button
              key="collapsed"
              initial={{ x: 20 }}
              animate={{ x: 0 }}
              exit={{ x: 20, opacity: 0 }}
              onClick={() => setIsExpanded(true)}
              className="relative flex items-center justify-center rounded-l-2xl overflow-hidden shadow-2xl"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor}99)`,
                width: '48px',
                height: '80px',
                boxShadow: `0 0 30px ${accentColor}50`
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <Radio className="w-5 h-5 text-white" />
                <span className="text-[10px] font-medium text-green-400">
                  <Signal className="w-3 h-3" />
                </span>
              </div>
              {/* Pulsing indicator */}
              <motion.div
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={`${bgPanel} rounded-l-2xl shadow-2xl border-l border-t border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}
              style={{ 
                width: '260px',
                boxShadow: `0 0 40px ${accentColor}30`
              }}
            >
              {/* Header */}
              <div 
                className="p-3 border-b flex items-center gap-3"
                style={{ borderColor: theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Radio className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${textMain}`}>
                    {voiceState.channelName}
                  </p>
                  <p className={`text-xs truncate ${textSub}`}>
                    {voiceState.groupName}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Signal className="w-3 h-3" />
                  Conectado
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 flex gap-2">
                {/* Go to Connect Button */}
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    navigate(`/connect/${voiceState.groupId}`);
                  }}
                  className="flex-1 p-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ 
                    backgroundColor: `${accentColor}20`, 
                    color: accentColor 
                  }}
                >
                  Ir para Connect
                </button>

                {/* Disconnect */}
                <button
                  onClick={handleDisconnect}
                  className="p-2.5 rounded-xl flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  title="Desconectar"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
