import React, { useState } from 'react';
import { Crown, ChevronRight } from 'lucide-react';
import type { Colors } from './uilayouts/liquid-gradient';
import { Liquid } from './uilayouts/liquid-gradient';
import { useTranslation } from 'react-i18next';

// Elite theme colors - violet/indigo palette
const ELITE_COLORS: Colors = {
  color1: '#FFFFFF',
  color2: '#6D28D9', // violet-700
  color3: '#A78BFA', // violet-400
  color4: '#F3F4F6', 
  color5: '#F9FAFB',
  color6: '#C4B5FD', // violet-300
  color7: '#4C1D95', // violet-900
  color8: '#7C3AED', // violet-600
  color9: '#8B5CF6', // violet-500
  color10: '#A78BFA', // violet-400
  color11: '#5B21B6', // violet-800
  color12: '#DDD6FE', // violet-200
  color13: '#6D28D9', // violet-700
  color14: '#C4B5FD', // violet-300
  color15: '#DDD6FE', // violet-200
  color16: '#4C1D95', // violet-900
  color17: '#6366F1', // indigo-500
};

interface LiquidEliteButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const LiquidEliteButton: React.FC<LiquidEliteButtonProps> = ({
  onClick,
  disabled = false,
  children,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation('common');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-block w-72 h-20 mx-auto group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* Glow effect behind button */}
      <div className="absolute w-[130%] h-[150%] -top-[10%] left-1/2 -translate-x-1/2 filter blur-[20px] opacity-60 transition-opacity duration-300 group-hover:opacity-80">
        <span className="absolute inset-0 rounded-2xl bg-violet-500/30 filter blur-[8px]"></span>
        <div className="relative w-full h-full overflow-hidden rounded-2xl">
          <Liquid isHovered={isHovered} colors={ELITE_COLORS} />
        </div>
      </div>
      
      {/* Shadow layer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[96%] h-[98%] rounded-2xl bg-[#1a0a2e] filter blur-[8px]"></div>
      
      {/* Main button surface */}
      <div className="relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f0520] via-[#1a0a2e] to-[#0a0118] z-10 border border-violet-500/20 group-hover:border-violet-500/40 transition-colors duration-300">
        <Liquid isHovered={isHovered} colors={ELITE_COLORS} buttonType />
        
        {/* Button content overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 z-20">
          {children || (
            <>
              <Crown className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              <span className="text-white font-bold text-lg tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {t('elite.subscribe')}
              </span>
              <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default LiquidEliteButton;
