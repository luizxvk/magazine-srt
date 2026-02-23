import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { useTierColors } from '../hooks/useTierColors';
import logoFallback from '../assets/logo-mgzn.png';
import logoMgtFallback from '../assets/logo-mgt.png';

interface PremiumLoaderProps {
  title: string;
  subtitle?: string;
}

export default function PremiumLoader({ title, subtitle }: PremiumLoaderProps) {
  const { user, accentGradient, theme } = useAuth();
  const { config } = useCommunity();
  const { getUserAccent } = useTierColors();
  const isMGT = user?.membershipType === 'MGT';
  const userAccent = getUserAccent();
  const isLight = theme === 'light';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        isLight ? 'bg-gray-50/95' : 'bg-black/95'
      } backdrop-blur-xl`}
    >
      {/* Premium glassmorphic card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`relative p-8 md:p-12 rounded-3xl ${
          isLight 
            ? 'bg-white/80 shadow-2xl' 
            : 'bg-white/5 border border-white/10'
        } backdrop-blur-2xl`}
        style={{
          boxShadow: isLight 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)' 
            : `0 0 80px -20px ${userAccent}40`
        }}
      >
        {/* Animated accent glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-30"
          animate={{
            background: [
              `radial-gradient(circle at 30% 30%, ${userAccent}20 0%, transparent 50%)`,
              `radial-gradient(circle at 70% 70%, ${userAccent}20 0%, transparent 50%)`,
              `radial-gradient(circle at 30% 30%, ${userAccent}20 0%, transparent 50%)`,
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo with premium shimmer */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full blur-2xl opacity-50"
              style={{ backgroundColor: userAccent }}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.img
              src={config.logoIconUrl || (isMGT ? logoMgtFallback : logoFallback)}
              alt=""
              className="relative h-20 md:h-24 object-contain"
              animate={{ 
                filter: [
                  'drop-shadow(0 0 20px transparent)',
                  `drop-shadow(0 0 30px ${userAccent}80)`,
                  'drop-shadow(0 0 20px transparent)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Title */}
          <div className="text-center">
            <motion.h2
              className={`text-xl md:text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p
                className={`mt-1 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Apple-style loading indicator */}
          <motion.div
            className="relative w-48 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ 
                background: accentGradient || userAccent,
                width: '30%'
              }}
              animate={{
                x: ['0%', '230%', '0%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>

          {/* Floating particles - Apple Vision Pro style */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ 
                  backgroundColor: userAccent,
                  left: `${15 + (i * 15)}%`,
                  top: `${20 + (i * 10)}%`
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2 + (i * 0.3),
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom shimmer line - Vision Pro style */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${userAccent}, transparent)` }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}
