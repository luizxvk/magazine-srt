/**
 * BetaEndedOverlay - Popup de aviso pós-beta
 * 
 * Exibe um popup de agradecimento quando a beta termina (01/02/2026 00:00 BRT)
 * Com countdown para o lançamento da v0.5.0 (05/02/2026 13:00 BRT)
 * 
 * NÃO afeta rotas da Rovex (/api/rovex/*)
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Heart, Rocket, Star, Trophy, X } from 'lucide-react';
import api from '../services/api';

// Data de término da beta: 01/02/2026 às 00:00 horário de Brasília (UTC-3)
const BETA_END_DATE = new Date('2026-02-01T03:00:00.000Z'); // 00:00 BRT = 03:00 UTC

// Data de lançamento da v0.5.0: 05/02/2026 às 13:00 horário de Brasília (UTC-3)
const LAUNCH_DATE = new Date('2026-02-05T16:00:00.000Z'); // 13:00 BRT = 16:00 UTC

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface BetaStats {
  betaTesters: number;
  totalPosts: number;
  totalFeatures: number;
}

function calculateCountdown(targetDate: Date): CountdownValues {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

// Exportar funções para uso em Login/Register
export function isBetaEnded(): boolean {
  return new Date() >= BETA_END_DATE && new Date() < LAUNCH_DATE;
}

export function getLaunchDate(): Date {
  return LAUNCH_DATE;
}

// Gerar posições dos particles uma única vez (fora do componente para ser estável)
const PARTICLE_POSITIONS = [...Array(15)].map(() => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 2 + Math.random() * 4,
  duration: 3 + Math.random() * 4,
  delay: Math.random() * 2,
}));

const CONFETTI_ITEMS = [...Array(30)].map((_, i) => ({
  left: Math.random() * 100,
  xOffset: (Math.random() - 0.5) * 100,
  duration: 2 + Math.random() * 1.5,
  delay: Math.random() * 1.5,
  color: ['#d4af37', '#50c878', '#ff6b6b', '#4ecdc4', '#a855f7'][i % 5],
  isCircle: i % 2 === 0,
}));

export default function BetaEndedOverlay() {
  const [countdown, setCountdown] = useState<CountdownValues>(calculateCountdown(LAUNCH_DATE));
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState<BetaStats>({ betaTesters: 0, totalPosts: 0, totalFeatures: 50 });
  
  // Verifica se a beta terminou
  const betaHasEnded = useMemo(() => {
    return new Date() >= BETA_END_DATE;
  }, []);
  
  // Verifica se já é hora do lançamento
  const hasLaunched = useMemo(() => {
    return new Date() >= LAUNCH_DATE;
  }, [countdown]);
  
  // Buscar estatísticas reais
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/rovex/public/stats');
        if (data.success) {
          setStats({
            betaTesters: data.betaTesters || 0,
            totalPosts: data.totalPosts || 0,
            totalFeatures: data.totalFeatures || 50,
          });
        }
      } catch (error) {
        // Usar valores padrão se falhar
        console.log('Could not fetch beta stats, using defaults');
      }
    };
    
    fetchStats();
  }, []);
  
  useEffect(() => {
    // Se beta ainda não terminou, não mostrar
    if (!betaHasEnded) {
      setIsVisible(false);
      return;
    }
    
    // Se já lançou, esconder o overlay
    if (hasLaunched) {
      setIsVisible(false);
      return;
    }
    
    // Se usuário já fechou, não mostrar novamente nesta sessão
    if (isDismissed) {
      setIsVisible(false);
      return;
    }
    
    // Mostrar popup com delay para animação
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setShowConfetti(true);
    }, 500);
    
    // Atualizar countdown a cada segundo
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(LAUNCH_DATE));
    }, 1000);
    
    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [betaHasEnded, hasLaunched, isDismissed]);
  
  const handleClose = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };
  
  // Se não deve mostrar, retornar null
  if (!isVisible) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
      >
        {/* Popup Container */}
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Animated background particles - using pre-generated positions */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLE_POSITIONS.map((particle, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full"
                style={{
                  background: i % 2 === 0 ? '#d4af37' : '#50c878',
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: particle.size,
                  height: particle.size,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                }}
              />
            ))}
          </div>
          
          {/* Main content */}
          <div className="relative z-10 p-8 text-center">
            {/* Logo/Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="mb-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-2xl shadow-gold-500/30">
                <Trophy className="w-10 h-10 text-black" />
              </div>
            </motion.div>
            
            {/* Thank you message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Obrigado por fazer parte da{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                  Beta!
                </span>
              </h1>
              
              <p className="text-gray-300 mb-1">
                Sua participação foi fundamental para chegarmos até aqui.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                A versão 0.5.0 está chegando com tudo que você pediu!
              </p>
            </motion.div>
            
            {/* Stats badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap justify-center gap-3 mb-8"
            >
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span className="text-white text-xs">{stats.betaTesters}+ Beta Testers</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-white text-xs">{stats.totalPosts}+ Posts</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-white text-xs">{stats.totalFeatures}+ Features</span>
              </div>
            </motion.div>
            
            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Rocket className="w-4 h-4 text-gold-400" />
                <span className="text-gold-400 font-semibold uppercase tracking-wider text-xs">
                  Lançamento da v0.5.0
                </span>
              </div>
              
              <div className="flex justify-center gap-2 md:gap-3">
                <CountdownBox value={countdown.days} label="Dias" />
                <CountdownBox value={countdown.hours} label="Horas" />
                <CountdownBox value={countdown.minutes} label="Min" />
                <CountdownBox value={countdown.seconds} label="Seg" />
              </div>
              
              <p className="text-gray-500 text-xs mt-3">
                5 de Fevereiro de 2026 às 13:00 (Brasília)
              </p>
            </motion.div>
            
            {/* Footer message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-gray-400 text-xs"
            >
              <p className="flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Aguarde... Algo incrível está vindo!
              </p>
            </motion.div>
            
            {/* Social/Contact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-4"
            >
              <a
                href="https://instagram.com/mgt.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-xs"
              >
                Acompanhe as novidades @mgt.studio
              </a>
            </motion.div>
          </div>
          
          {/* Confetti effect - using pre-generated positions */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {CONFETTI_ITEMS.map((confetti, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute w-2 h-2"
                  style={{
                    background: confetti.color,
                    left: `${confetti.left}%`,
                    top: -20,
                    borderRadius: confetti.isCircle ? '50%' : '0%',
                  }}
                  animate={{
                    y: [0, 400],
                    x: [0, confetti.xOffset],
                    rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: confetti.duration,
                    delay: confetti.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Countdown box component
function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-2 md:p-3 min-w-[55px] md:min-w-[65px] border border-white/10">
      <motion.div
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-xl md:text-2xl font-bold text-white"
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}
