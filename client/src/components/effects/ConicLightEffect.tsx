import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConicLightEffectProps {
  /** Accent color in hex format */
  color?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Conic gradient light effect inspired by Figma design (anima 1, 2, 3).
 * Uses CSS conic-gradient for a performant, animated light beam effect.
 * Color is modular based on user's selected accent color.
 */
export const ConicLightEffect: React.FC<ConicLightEffectProps> = ({
  color = '#4725F4',
  className = '',
}) => {
  // Convert hex to rgba with opacity
  const colorWithOpacity = useMemo(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }, [color]);

  // Create the conic gradients matching Figma's design
  // Based on fill_EIUHC1: conic-gradient(from 90deg at 48% 9%, ...)
  const leftGradient = useMemo(() => {
    const { r, g, b } = colorWithOpacity;
    return `conic-gradient(from 90deg at 48% 9%, rgba(2, 0, 20, 1) 49%, rgba(2, 0, 20, 1) 100%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
  }, [colorWithOpacity]);

  const rightGradient = useMemo(() => {
    const { r, g, b } = colorWithOpacity;
    return `conic-gradient(from 90deg at 52% 9%, rgba(${r}, ${g}, ${b}, 1) 0%, rgba(2, 0, 20, 1) 51%, rgba(2, 0, 20, 1) 100%)`;
  }, [colorWithOpacity]);

  // Secondary softer gradient for depth
  const centerGlowGradient = useMemo(() => {
    const { r, g, b } = colorWithOpacity;
    return `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${r}, ${g}, ${b}, 0.3) 0%, rgba(${r}, ${g}, ${b}, 0.1) 40%, transparent 70%)`;
  }, [colorWithOpacity]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Left conic beam */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          background: leftGradient,
          width: '50%',
          height: '100%',
          left: 0,
          top: 0,
        }}
      />

      {/* Right conic beam (mirrored) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.1 }}
        className="absolute inset-0"
        style={{
          background: rightGradient,
          width: '50%',
          height: '100%',
          right: 0,
          left: '50%',
          top: 0,
        }}
      />

      {/* Center glow overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
        className="absolute inset-0"
        style={{
          background: centerGlowGradient,
        }}
      />

      {/* Subtle animated pulse on the glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0, 0.4, 0.2],
        }}
        transition={{ 
          duration: 3,
          ease: 'easeOut',
        }}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 30% at 50% 0%, rgba(${colorWithOpacity.r}, ${colorWithOpacity.g}, ${colorWithOpacity.b}, 0.5) 0%, transparent 60%)`,
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
};

export default ConicLightEffect;
