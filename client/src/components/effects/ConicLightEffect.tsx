import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConicLightEffectProps {
  /** Accent color in hex format */
  color?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Conic gradient light effect matching Figma design.
 * Creates a spotlight effect with light beams emanating from top-center.
 */
export const ConicLightEffect: React.FC<ConicLightEffectProps> = ({
  color = '#6A5EFE',
  className = '',
}) => {
  // Convert hex to rgb values
  const rgb = useMemo(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }, [color]);

  // Main spotlight gradient - radial from top center (more intense)
  const spotlightGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `radial-gradient(ellipse 150% 100% at 50% 0%, rgba(${r}, ${g}, ${b}, 0.6) 0%, rgba(${r}, ${g}, ${b}, 0.35) 25%, rgba(${r}, ${g}, ${b}, 0.15) 50%, rgba(${r}, ${g}, ${b}, 0.05) 75%, transparent 100%)`;
  }, [rgb]);

  // Light beam effect - vertical bar of light at center
  const lightBeamGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.8) 0%, rgba(${r}, ${g}, ${b}, 0.4) 20%, rgba(${r}, ${g}, ${b}, 0.1) 60%, transparent 100%)`;
  }, [rgb]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Main spotlight from top center */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          background: spotlightGradient,
        }}
      />

      {/* Central light beam / bar */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        className="absolute"
        style={{
          background: lightBeamGradient,
          width: '200px',
          height: '70%',
          left: '50%',
          top: 0,
          transform: 'translateX(-50%)',
          filter: 'blur(80px)',
          transformOrigin: 'top center',
        }}
      />

      {/* Horizontal glow at top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="absolute"
        style={{
          background: `radial-gradient(ellipse 60% 20% at 50% 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) 50%, transparent 100%)`,
          width: '100%',
          height: '300px',
          left: 0,
          top: 0,
          filter: 'blur(20px)',
        }}
      />

      {/* Subtle breathing pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{ 
          duration: 5,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 50% at 50% 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 0%, transparent 60%)`,
          filter: 'blur(30px)',
        }}
      />
    </div>
  );
};

export default ConicLightEffect;
