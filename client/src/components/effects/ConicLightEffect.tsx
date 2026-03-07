import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConicLightEffectProps {
  /** Accent color in hex format (used for tinting) */
  color?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Dual conic gradient light effect matching Figma design.
 * Creates two light beams emanating from top-left and top-right corners
 * that sweep/rotate to create an animated aurora-like effect.
 * 
 * Based on Figma nodes: 35:3 (anima 1), 32:3 (anima 2), 32:14 (anima 3)
 */
export const ConicLightEffect: React.FC<ConicLightEffectProps> = ({
  color = '#6A5EFE',
  className = '',
}) => {
  // Convert hex to rgb values for optional color tinting
  const rgb = useMemo(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }, [color]);

  // Left conic beam - emanates from top-left area (25% from left)
  // Matches Figma: conic-gradient from 90deg with grayscale sweep
  const leftConicGradient = useMemo(() => {
    return `conic-gradient(
      from 90deg at 25% 0%,
      rgba(248, 248, 248, 1) 0deg,
      rgba(0, 0, 0, 1) 0deg,
      rgba(170, 170, 170, 0.67) 356deg,
      rgba(248, 248, 248, 1) 360deg
    )`;
  }, []);

  // Right conic beam - emanates from top-right area (75% from left), mirrored
  const rightConicGradient = useMemo(() => {
    return `conic-gradient(
      from 270deg at 75% 0%,
      rgba(248, 248, 248, 1) 0deg,
      rgba(170, 170, 170, 0.67) 4deg,
      rgba(0, 0, 0, 1) 360deg,
      rgba(248, 248, 248, 1) 360deg
    )`;
  }, []);

  // Subtle color-tinted overlay for accent color influence
  const colorOverlayGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `radial-gradient(ellipse 100% 60% at 50% 0%, rgba(${r}, ${g}, ${b}, 0.15) 0%, transparent 70%)`;
  }, [rgb]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ 
        zIndex: 0,
        backgroundColor: 'rgba(8, 8, 30, 0.8)' // #08081E with 0.8 opacity from Figma
      }}
    >
      {/* Left conic light beam */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.6, 0.9, 0.6],
          rotate: [0, 8, 0, -8, 0]
        }}
        transition={{ 
          opacity: { duration: 8, ease: 'easeInOut', repeat: Infinity },
          rotate: { duration: 20, ease: 'easeInOut', repeat: Infinity }
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: leftConicGradient,
          transformOrigin: '50% 0%',
          transform: 'scaleY(0.31) scaleX(0.62)', // Figma transform matrix approximation
          mixBlendMode: 'screen',
        }}
      />

      {/* Right conic light beam (mirrored) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.6, 0.9, 0.6],
          rotate: [0, -8, 0, 8, 0]
        }}
        transition={{ 
          opacity: { duration: 8, ease: 'easeInOut', repeat: Infinity, delay: 0.5 },
          rotate: { duration: 20, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }
        }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: rightConicGradient,
          transformOrigin: '50% 0%',
          transform: 'scaleY(0.31) scaleX(-0.62)', // Mirrored
          mixBlendMode: 'screen',
        }}
      />

      {/* Gradient overlay for bottom fade - from Figma linear gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(8, 8, 27, 0) 0%, rgba(8, 8, 27, 1) 50%, rgba(8, 8, 27, 1) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Optional color-tinted overlay for accent influence */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: colorOverlayGradient,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle animated glow particles */}
      <div className="absolute inset-0" style={{ opacity: 0.2 }}>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: `${10 + Math.random() * 80}%`,
              y: `${5 + Math.random() * 30}%`,
            }}
            animate={{ 
              opacity: [0, 0.6, 0],
              y: [`${5 + Math.random() * 30}%`, `${40 + Math.random() * 40}%`],
            }}
            transition={{ 
              duration: 6 + Math.random() * 6,
              ease: 'easeOut',
              repeat: Infinity,
              delay: Math.random() * 8,
            }}
            style={{
              position: 'absolute',
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              borderRadius: '50%',
              background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ConicLightEffect;
