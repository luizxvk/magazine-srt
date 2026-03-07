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
 * Creates a prominent purple/violet conic light beam from the top
 * that illuminates the entire page with a vibrant glow.
 * 
 * Based on Figma nodes: 35:3, 32:3, 32:14
 */
export const ConicLightEffect: React.FC<ConicLightEffectProps> = ({
  color: _color = '#7C3AED',
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

    // After 4.5s total, settle into ambient glow
    const settleTimer = setTimeout(() => {
      setAnimationPhase('settled');
    }, 4500);

    return () => {
      clearTimeout(brightTimer);
      clearTimeout(settleTimer);
    };
  }, []);

  const getMainOpacity = () => {
    switch (animationPhase) {
      case 'initial': return 0;
      case 'brightening': return 1;
      case 'bright': return 1;
      case 'settled': return 0.9;
    }
  };

  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Base dark background */}
      <div 
        className="absolute inset-0"
        style={{ background: '#08081B' }}
      />

      {/* Main conic gradient light - the signature purple effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: getMainOpacity() }}
        transition={{ 
          duration: animationPhase === 'brightening' ? 1.5 : 0.8,
          ease: 'easeOut'
        }}
        className="absolute inset-0"
        style={{
          background: `conic-gradient(
            from 180deg at 50% 0%,
            #08081B 0deg,
            #08081B 90deg,
            #1E1B4B 120deg,
            #4C1D95 140deg,
            #6D28D9 155deg,
            #8B5CF6 170deg,
            #A78BFA 180deg,
            #8B5CF6 190deg,
            #6D28D9 205deg,
            #4C1D95 220deg,
            #1E1B4B 240deg,
            #08081B 270deg,
            #08081B 360deg
          )`,
        }}
      />

      {/* Radial overlay to fade edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 80% 50% at 50% 0%,
            transparent 0%,
            transparent 40%,
            #08081B 100%
          )`,
        }}
      />

      {/* Bottom fade to solid background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            transparent 30%,
            #08081B80 50%,
            #08081B 70%
          )`,
        }}
      />

      {/* Center glow highlight for extra brightness */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: animationPhase === 'bright' || animationPhase === 'settled' 
            ? (animationPhase === 'bright' ? 0.8 : 0.5) 
            : animationPhase === 'brightening' ? 0.4 : 0
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        className="absolute"
        style={{
          top: '-5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '30%',
          background: `radial-gradient(
            ellipse 100% 100% at 50% 0%,
            rgba(167, 139, 250, 0.6) 0%,
            rgba(139, 92, 246, 0.4) 30%,
            rgba(109, 40, 217, 0.2) 50%,
            transparent 70%
          )`,
          filter: 'blur(30px)',
        }}
      />

      {/* Subtle ambient pulse when settled */}
      {animationPhase === 'settled' && (
        <motion.div
          animate={{ 
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ 
            duration: 4,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
          className="absolute"
          style={{
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '40%',
            background: `radial-gradient(
              ellipse 60% 50% at 50% 0%,
              rgba(139, 92, 246, 0.3) 0%,
              transparent 60%
            )`,
            filter: 'blur(40px)',
          }}
        />
      )}
    </div>
  );
};

export default ConicLightEffect;
