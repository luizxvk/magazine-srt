import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ConicLightEffectProps {
  /** Primary accent color in hex format */
  color?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Conic light effect matching Figma design.
 * Creates a centered purple/blue light beam emanating from the top
 * that illuminates the page on load, then settles into a steady glow.
 * 
 * Animation: On page load, light "turns on" and brightens over 1.5s,
 * stays bright for 3 seconds, then maintains a steady ambient glow.
 * 
 * Based on Figma nodes: 35:3 (anima 1), 32:3 (anima 2), 32:14 (anima 3)
 */
export const ConicLightEffect: React.FC<ConicLightEffectProps> = ({
  color = '#6366F1',
  className = '',
}) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'brightening' | 'bright' | 'settled'>('initial');

  useEffect(() => {
    // Start brightening immediately
    setAnimationPhase('brightening');
    
    // After 1.5s, reach full brightness
    const brightTimer = setTimeout(() => {
      setAnimationPhase('bright');
    }, 1500);

    // After 4.5s total (1.5s brightening + 3s bright), settle into ambient glow
    const settleTimer = setTimeout(() => {
      setAnimationPhase('settled');
    }, 4500);

    return () => {
      clearTimeout(brightTimer);
      clearTimeout(settleTimer);
    };
  }, []);

  // Opacity values for each phase
  const getOpacity = () => {
    switch (animationPhase) {
      case 'initial': return 0;
      case 'brightening': return 1;
      case 'bright': return 1;
      case 'settled': return 0.85;
    }
  };

  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
    >
      {/* Main conic light beam from top center */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: getOpacity() }}
        transition={{ 
          duration: animationPhase === 'brightening' ? 1.5 : 1,
          ease: 'easeOut'
        }}
        style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          width: '200%',
          height: '150%',
          transform: 'translateX(-50%)',
          background: `conic-gradient(
            from 180deg at 50% 0%,
            transparent 0deg,
            transparent 120deg,
            ${color} 150deg,
            #8B5CF6 180deg,
            ${color} 210deg,
            transparent 240deg,
            transparent 360deg
          )`,
          filter: 'blur(80px)',
          opacity: 0.6,
        }}
      />

      {/* Secondary radial glow for depth */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: animationPhase !== 'initial' ? 0.7 : 0,
          scale: 1
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          width: '120%',
          height: '80%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(
            ellipse 50% 40% at 50% 0%,
            ${color}66 0%,
            #8B5CF640 30%,
            #4C1D9520 50%,
            transparent 70%
          )`,
          filter: 'blur(40px)',
        }}
      />

      {/* Bright center highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: animationPhase === 'bright' || animationPhase === 'settled' 
            ? (animationPhase === 'bright' ? 0.9 : 0.6) 
            : animationPhase === 'brightening' ? 0.5 : 0
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: '60%',
          height: '40%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(
            ellipse 60% 50% at 50% 0%,
            rgba(139, 92, 246, 0.5) 0%,
            rgba(99, 102, 241, 0.3) 40%,
            transparent 70%
          )`,
          filter: 'blur(60px)',
        }}
      />

      {/* Edge light bars (matching Figma design - two light sources at top edges) */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ 
          opacity: animationPhase !== 'initial' ? 0.8 : 0,
          scaleX: 1
        }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          width: '15%',
          height: '4px',
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          filter: 'blur(2px)',
          boxShadow: `0 0 30px 10px ${color}80`,
        }}
      />
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ 
          opacity: animationPhase !== 'initial' ? 0.8 : 0,
          scaleX: 1
        }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        style={{
          position: 'absolute',
          top: 0,
          right: '20%',
          width: '15%',
          height: '4px',
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          filter: 'blur(2px)',
          boxShadow: `0 0 30px 10px ${color}80`,
        }}
      />

      {/* Bottom fade gradient to blend with page background */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(180deg, transparent 0%, #08081B 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle ambient pulse when settled */}
      {animationPhase === 'settled' && (
        <motion.div
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 4,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            width: '80%',
            height: '50%',
            transform: 'translateX(-50%)',
            background: `radial-gradient(
              ellipse 50% 40% at 50% 0%,
              ${color}30 0%,
              transparent 60%
            )`,
            filter: 'blur(50px)',
          }}
        />
      )}
    </div>
  );
};

export default ConicLightEffect;
