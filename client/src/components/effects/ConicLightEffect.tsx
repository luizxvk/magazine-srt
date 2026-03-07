import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConicLightEffectProps {
  /** Primary accent color in hex format */
  color?: string;
  /** Additional CSS class */
  className?: string;
}

// Convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Conic light effect that adapts to the user's accent color.
 * Creates a prominent light beam from the top that illuminates
 * the page with a vibrant glow based on the accent color.
 */
export const ConicLightEffect: React.FC<ConicLightEffectProps> = ({
  color = '#7C3AED',
  className = '',
}) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'brightening' | 'bright' | 'settled'>('initial');

  // Generate color variations based on the accent color
  const colors = useMemo(() => {
    const hsl = hexToHSL(color);
    
    // Generate 5 shades from dark to light - more vibrant
    const darkest = hslToHex(hsl.h, Math.min(hsl.s + 5, 60), 20);   // Darker but more saturated
    const dark = hslToHex(hsl.h, Math.min(hsl.s + 15, 90), 30);     // Dark
    const medium = hslToHex(hsl.h, Math.min(hsl.s + 10, 85), 50);   // Medium
    const bright = hslToHex(hsl.h, Math.min(hsl.s + 5, 80), 60);    // Bright
    const brightest = hslToHex(hsl.h, Math.max(hsl.s, 60), 75);     // Brightest
    
    return { darkest, dark, medium, bright, brightest, hsl };
  }, [color]);

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

  // Dynamic conic gradient based on accent color
  const conicGradient = useMemo(() => {
    return `conic-gradient(
      from 180deg at 50% 0%,
      #08081B 0deg,
      #08081B 90deg,
      ${colors.darkest} 120deg,
      ${colors.dark} 140deg,
      ${colors.medium} 155deg,
      ${colors.bright} 170deg,
      ${colors.brightest} 180deg,
      ${colors.bright} 190deg,
      ${colors.medium} 205deg,
      ${colors.dark} 220deg,
      ${colors.darkest} 240deg,
      #08081B 270deg,
      #08081B 360deg
    )`;
  }, [colors]);

  // RGB values for glow effects
  const rgbFromHex = useMemo(() => {
    const hex = color.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }, [color]);

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

      {/* Main conic gradient light - dynamic based on accent color */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: getMainOpacity() }}
        transition={{ 
          duration: animationPhase === 'brightening' ? 1.5 : 0.8,
          ease: 'easeOut'
        }}
        className="absolute inset-0"
        style={{ background: conicGradient }}
      />

      {/* Radial overlay to fade edges - made smaller to show more of the gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 100% 70% at 50% 0%,
            transparent 0%,
            transparent 60%,
            #08081B 100%
          )`,
        }}
      />

      {/* Bottom fade to solid background - starts later to show more gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            transparent 50%,
            #08081B80 70%,
            #08081B 90%
          )`,
        }}
      />

      {/* Center glow highlight for extra brightness - uses accent color */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: animationPhase === 'bright' || animationPhase === 'settled' 
            ? (animationPhase === 'bright' ? 0.9 : 0.7) 
            : animationPhase === 'brightening' ? 0.5 : 0
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        className="absolute"
        style={{
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '50%',
          background: `radial-gradient(
            ellipse 100% 100% at 50% 0%,
            rgba(${rgbFromHex.r}, ${rgbFromHex.g}, ${rgbFromHex.b}, 0.7) 0%,
            rgba(${rgbFromHex.r}, ${rgbFromHex.g}, ${rgbFromHex.b}, 0.5) 30%,
            rgba(${rgbFromHex.r}, ${rgbFromHex.g}, ${rgbFromHex.b}, 0.3) 50%,
            transparent 80%
          )`,
          filter: 'blur(40px)',
        }}
      />

      {/* Subtle ambient pulse when settled - uses accent color */}
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
          className="absolute"
          style={{
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '60%',
            background: `radial-gradient(
              ellipse 70% 60% at 50% 0%,
              rgba(${rgbFromHex.r}, ${rgbFromHex.g}, ${rgbFromHex.b}, 0.4) 0%,
              transparent 70%
            )`,
            filter: 'blur(50px)',
          }}
        />
      )}
    </div>
  );
};

export default ConicLightEffect;
