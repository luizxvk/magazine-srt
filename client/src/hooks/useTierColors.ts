/**
 * Hook for getting dynamic tier colors based on community config.
 * Use this instead of hardcoded '#10b981' or '#d4af37'.
 * 
 * Colors are loaded from CommunityContext and can vary per community.
 */
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';

interface TierColors {
  /** Standard tier color (e.g., '#0a0f1a' for Team Liquid Pro, '#10b981' default) */
  stdColor: string;
  /** VIP tier color (e.g., '#d4af37' default gold) */
  vipColor: string;
  /** Returns correct color based on membership type */
  getAccentColor: (isMGT: boolean) => string;
  /** Returns user's accent color or default for their tier */
  getUserAccent: () => string;
  /** CSS variable for standard tier (use in Tailwind arbitrary values) */
  stdVar: string;
  /** CSS variable RGB for standard tier (use in rgba()) */
  stdVarRgb: string;
}

export function useTierColors(): TierColors {
  const { config } = useCommunity();
  const { user, accentColor } = useAuth();
  
  const stdColor = config.backgroundColor || '#10b981';
  const vipColor = config.tierVipColor || '#d4af37';
  const isMGT = user?.membershipType === 'MGT';
  
  return {
    stdColor,
    vipColor,
    getAccentColor: (isMGT: boolean) => isMGT ? stdColor : vipColor,
    getUserAccent: () => accentColor || (isMGT ? stdColor : vipColor),
    stdVar: 'var(--tier-std-500)',
    stdVarRgb: 'var(--tier-std-color-rgb)',
  };
}

export default useTierColors;
