import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConicLightEffectProps {
  /** Accent color in hex format */
  color?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Conic gradient light effect matching Figma design exactly.
 * Figma spec: conic-gradient(from 90deg at 48% 9%, rgba(2, 0, 20, 1) 49%, rgba(2, 0, 20, 1) 100%, rgba(106, 94, 254, 1) 100%)
 * Creates two mirrored conic beams emanating from the top center.
 */
export const ConicLightEffect: React.FC<ConicLightEffectProps> = ({
  color = '#6A5EFE', // Figma default: rgba(106, 94, 254, 1)
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

  // Left conic gradient - exactly as Figma spec
  // Creates light beam on left side emanating from top-center
  const leftConicGradient = useMemo(() => {
    const { r, g, b } = rgb;
    // Figma: conic-gradient(from 90deg at 48% 9%, ...) - positioned at right edge of left half to meet center
    return `conic-gradient(from 90deg at 100% 9%, rgba(2, 0, 20, 1) 49%, rgba(2, 0, 20, 1) 100%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
  }, [rgb]);

  // Right conic gradient - mirrored version
  const rightConicGradient = useMemo(() => {
    const { r, g, b } = rgb;
    // Mirrored - positioned at left edge of right half to meet center  
    return `conic-gradient(from 90deg at 0% 9%, rgba(${r}, ${g}, ${b}, 1) 0%, rgba(2, 0, 20, 1) 51%, rgba(2, 0, 20, 1) 100%)`;
  }, [rgb]);

  // Soft glow overlay for depth
  const glowGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `radial-gradient(ellipse 100% 60% at 50% 0%, rgba(${r}, ${g}, ${b}, 0.15) 0%, rgba(${r}, ${g}, ${b}, 0.05) 50%, transparent 80%)`;
  }, [rgb]);

  return (
    <motion.div 
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      {/* Left conic beam - positioned on left half */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute"
        style={{
          background: leftConicGradient,
          width: '50vw',
          height: '100vh',
          left: 0,
          top: 0,
        }}
      />

      {/* Right conic beam - mirrored on right half */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.1 }}
        className="absolute"
        style={{
          background: rightConicGradient,
          width: '50vw',
          height: '100vh',
          left: '50vw',
          top: 0,
        }}
      />

      {/* Soft glow overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
        className="absolute inset-0"
        style={{
          background: glowGradient,
        }}
      />

      {/* Animated breathing pulse effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0, 0.3, 0.15, 0.25, 0.15],
        }}
        transition={{ 
          duration: 8,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
    </motion.div>
  );
};

export default ConicLightEffect;
