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
 * Creates a spotlight effect emanating from top-center.
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

  // Main spotlight gradient - radial from top center
  const spotlightGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(${r}, ${g}, ${b}, 0.4) 0%, rgba(${r}, ${g}, ${b}, 0.2) 30%, rgba(${r}, ${g}, ${b}, 0.08) 60%, transparent 100%)`;
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

      {/* Subtle breathing pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ 
          duration: 6,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
};

export default ConicLightEffect;
