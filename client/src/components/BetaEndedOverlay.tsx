/**
 * BetaEndedOverlay - Componente de bloqueio pós-beta
 * 
 * Exibe uma tela de agradecimento quando a beta termina (01/02/2026 00:00 BRT)
 * Com countdown para o lançamento da v5.0 (05/02/2026 13:00 BRT)
 * 
 * NÃO afeta rotas da Rovex (/api/rovex/*)
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Heart, Rocket, Star, Trophy } from 'lucide-react';

// Data de término da beta: 01/02/2026 às 00:00 horário de Brasília (UTC-3)
const BETA_END_DATE = new Date('2026-02-01T03:00:00.000Z'); // 00:00 BRT = 03:00 UTC

// Data de lançamento da v5.0: 05/02/2026 às 13:00 horário de Brasília (UTC-3)
const LAUNCH_DATE = new Date('2026-02-05T16:00:00.000Z'); // 13:00 BRT = 16:00 UTC

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
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

export default function BetaEndedOverlay() {
  const [countdown, setCountdown] = useState<CountdownValues>(calculateCountdown(LAUNCH_DATE));
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Verifica se a beta terminou
  const betaHasEnded = useMemo(() => {
    return new Date() >= BETA_END_DATE;
  }, []);
  
  // Verifica se já é hora do lançamento
  const hasLaunched = useMemo(() => {
    return new Date() >= LAUNCH_DATE;
  }, [countdown]);
  
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
    
    // Mostrar overlay com delay para animação
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
  }, [betaHasEnded, hasLaunched]);
  
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
        className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? '#d4af37' : '#50c878',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* Main content */}
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative z-10 max-w-2xl mx-auto px-6 text-center"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-2xl shadow-gold-500/30">
              <Trophy className="w-12 h-12 text-black" />
            </div>
          </motion.div>
          
          {/* Thank you message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Obrigado por fazer parte da{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                Beta!
              </span>
            </h1>
            
            <p className="text-lg text-gray-300 mb-2">
              Sua participação foi fundamental para chegarmos até aqui.
            </p>
            <p className="text-gray-400 mb-8">
              A versão 5.0 está chegando com tudo que você pediu e muito mais!
            </p>
          </motion.div>
          
          {/* Stats badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-white text-sm">847+ Beta Testers</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm">2000+ Posts</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-white text-sm">50+ Features</span>
            </div>
          </motion.div>
          
          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-10"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Rocket className="w-5 h-5 text-gold-400" />
              <span className="text-gold-400 font-semibold uppercase tracking-wider text-sm">
                Lançamento da v5.0
              </span>
            </div>
            
            <div className="flex justify-center gap-3 md:gap-4">
              <CountdownBox value={countdown.days} label="Dias" />
              <CountdownBox value={countdown.hours} label="Horas" />
              <CountdownBox value={countdown.minutes} label="Min" />
              <CountdownBox value={countdown.seconds} label="Seg" />
            </div>
            
            <p className="text-gray-500 text-sm mt-4">
              5 de Fevereiro de 2026 às 13:00 (Brasília)
            </p>
          </motion.div>
          
          {/* Footer message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-gray-400 text-sm"
          >
            <p className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Aguarde... Algo incrível está vindo!
            </p>
          </motion.div>
          
          {/* Social/Contact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-8"
          >
            <a
              href="https://instagram.com/mgt.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm"
            >
              Acompanhe as novidades @mgt.studio
            </a>
          </motion.div>
        </motion.div>
        
        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute w-2 h-2"
                style={{
                  background: ['#d4af37', '#50c878', '#ff6b6b', '#4ecdc4', '#a855f7'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: -20,
                  borderRadius: i % 2 === 0 ? '50%' : '0%',
                }}
                animate={{
                  y: [0, window.innerHeight + 100],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Countdown box component
function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 min-w-[70px] md:min-w-[80px] border border-white/10">
      <motion.div
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-2xl md:text-4xl font-bold text-white"
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
