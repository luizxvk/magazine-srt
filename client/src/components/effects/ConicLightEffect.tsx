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
 * Creates a spotlight effect with animated light beams emanating from top-center.
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
    return `radial-gradient(ellipse 180% 80% at 50% 0%, rgba(${r}, ${g}, ${b}, 0.5) 0%, rgba(${r}, ${g}, ${b}, 0.25) 30%, rgba(${r}, ${g}, ${b}, 0.08) 60%, transparent 100%)`;
  }, [rgb]);

  // Light bar gradient - the main vertical glow bar
  const lightBarGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 1) 0%, rgba(${r}, ${g}, ${b}, 0.6) 15%, rgba(${r}, ${g}, ${b}, 0.2) 50%, transparent 100%)`;
  }, [rgb]);

  // Conic rays effect - spreading light beams
  const conicRaysGradient = useMemo(() => {
    const { r, g, b } = rgb;
    return `conic-gradient(from 90deg at 50% 0%, 
      transparent 0deg, 
      rgba(${r}, ${g}, ${b}, 0.15) 20deg, 
      transparent 40deg, 
      rgba(${r}, ${g}, ${b}, 0.12) 70deg, 
      transparent 90deg, 
      rgba(${r}, ${g}, ${b}, 0.1) 110deg, 
      transparent 130deg,
      rgba(${r}, ${g}, ${b}, 0.08) 150deg,
      transparent 180deg,
      rgba(${r}, ${g}, ${b}, 0.08) 210deg,
      transparent 230deg,
      rgba(${r}, ${g}, ${b}, 0.1) 250deg,
      transparent 270deg,
      rgba(${r}, ${g}, ${b}, 0.12) 290deg,
      transparent 320deg,
      rgba(${r}, ${g}, ${b}, 0.15) 340deg,
      transparent 360deg
    )`;
  }, [rgb]);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Conic light rays spreading from top - animated rotation */}
      <motion.div
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 12,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
        className="absolute"
        style={{
          background: conicRaysGradient,
          width: '200%',
          height: '100%',
          left: '-50%',
          top: 0,
          transformOrigin: '50% 0%',
        }}
      />

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

      {/* Primary light bar - intense glow at center */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0.8, 1, 0.8],
          scaleY: 1 
        }}
        transition={{ 
          opacity: { duration: 4, ease: 'easeInOut', repeat: Infinity },
          scaleY: { duration: 1.2, ease: 'easeOut' }
        }}
        className="absolute"
        style={{
          background: lightBarGradient,
          width: '200px',
          height: '70%',
          left: '50%',
          top: '60px',
          transform: 'translateX(-50%)',
          filter: 'blur(60px)',
          transformOrigin: 'top center',
        }}
      />

      {/* Secondary wider light bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ 
          duration: 6,
          ease: 'easeInOut',
          repeat: Infinity,
          delay: 1
        }}
        className="absolute"
        style={{
          background: `linear-gradient(180deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 30%, transparent 80%)`,
          width: '400px',
          height: '50%',
          left: '50%',
          top: '60px',
          transform: 'translateX(-50%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Concentrated light source at top center */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0.9, 1, 0.9],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 3,
          ease: 'easeInOut',
          repeat: Infinity
        }}
        className="absolute"
        style={{
          background: `radial-gradient(ellipse 150px 100px at 50% 50%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) 30%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) 60%, transparent 100%)`,
          width: '500px',
          height: '250px',
          left: '50%',
          top: '40px',
          transform: 'translateX(-50%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Horizontal glow spread at top - the "light bar" */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={{ 
          opacity: 1,
          scaleX: 1
        }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) 30%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1) 50%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) 70%, transparent 100%)`,
          width: '80%',
          height: '4px',
          left: '10%',
          top: '64px',
          filter: 'blur(2px)',
          borderRadius: '2px',
        }}
      />

      {/* Light bar glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity
        }}
        className="absolute"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) 30%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7) 50%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) 70%, transparent 100%)`,
          width: '70%',
          height: '30px',
          left: '15%',
          top: '52px',
          filter: 'blur(15px)',
        }}
      />

      {/* Ambient particles/stars effect */}
      <div className="absolute inset-0" style={{ opacity: 0.3 }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: `${Math.random() * 100}%`,
              y: `${10 + Math.random() * 40}%`,
            }}
            animate={{ 
              opacity: [0, 0.8, 0],
              y: [`${10 + Math.random() * 40}%`, `${50 + Math.random() * 30}%`],
            }}
            transition={{ 
              duration: 4 + Math.random() * 4,
              ease: 'easeOut',
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              position: 'absolute',
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              borderRadius: '50%',
              background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ConicLightEffect;
