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

  // Left conic gradient - emanates from top center going left
  const leftConicGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `conic-gradient(from 90deg at 50% 9%, rgba(2, 0, 20, 1) 0%, rgba(2, 0, 20, 1) 49%, rgba(${r}, ${g}, ${b}, 1) 51%, rgba(2, 0, 20, 1) 100%)`;
  }, [rgb]);

  // Soft glow overlay for depth
  const glowGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `radial-gradient(ellipse 100% 60% at 50% 0%, rgba(${r}, ${g}, ${b}, 0.15) 0%, rgba(${r}, ${g}, ${b}, 0.05) 50%, transparent 80%)`;
  }, [rgb]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Single conic gradient centered at top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          background: leftConicGradient,
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
    </div>
  );
};

export default ConicLightEffect;
