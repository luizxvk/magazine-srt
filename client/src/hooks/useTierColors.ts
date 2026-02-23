/**
 * Hook for getting dynamic tier colors based on community config.
 * Use this instead of hardcoded '#10b981' or '#d4af37'.
 * 
 * Colors are loaded from CommunityContext and can vary per community.
 * 
 * Note: accentColor = highlight/button color (e.g., #0A2463)
 *       backgroundColor = page background color (e.g., #0A0F1A)
 */
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';

interface TierColors {
  /** Standard tier accent color for highlights (e.g., '#0A2463' for Team Liquid Pro) */
  stdColor: string;
  /** VIP tier color (e.g., '#d4af37' default gold) */
  vipColor: string;
  /** Background color for the site (e.g., '#0A0F1A') */
  bgColor: string;
  /** Returns correct accent color based on membership type */
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
  
  // accentColor = cor de destaque (botões, badges)
  // backgroundColor = cor de fundo do site
  const stdColor = config.accentColor || config.backgroundColor || '#10b981';
  const vipColor = config.tierVipColor || '#d4af37';
  const bgColor = config.backgroundColor || '#0f0f0f';
  const isMGT = user?.membershipType === 'MGT';
  
  return {
    stdColor,
    vipColor,
    bgColor,
    getAccentColor: (isMGT: boolean) => isMGT ? stdColor : vipColor,
    getUserAccent: () => accentColor || (isMGT ? stdColor : vipColor),
    stdVar: 'var(--tier-std-500)',
    stdVarRgb: 'var(--tier-std-color-rgb)',
  };
}

export default useTierColors;
