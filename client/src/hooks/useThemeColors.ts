/**
 * useThemeColors
 * 
 * Hook que retorna cores dinâmicas baseadas na configuração da comunidade.
 * Use este hook ao invés de classes Tailwind hardcoded como "emerald-500".
 * 
 * Uso:
 * ```tsx
 * const { stdColors, vipColors, getColorStyle } = useThemeColors();
 * 
 * // Direto no style:
 * <div style={{ backgroundColor: stdColors.bg500, color: stdColors.text500 }}>
 * 
 * // Ou use getColorStyle para gerar o style object:
 * <div style={getColorStyle('std', 'bg', 500)}>
 * ```
 */

import { useCommunity } from '../context/CommunityContext';
import { useMemo } from 'react';

// Helper para converter hex para RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 16, g: 185, b: 129 }; // fallback emerald
};

// Helper para clarear/escurecer cores
const adjustColor = (hex: string, amount: number): string => {
  const { r, g, b } = hexToRgb(hex);
  
  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

interface ColorShades {
  // Cor base
  color: string;
  rgb: string;
  
  // Tonalidades para backgrounds
  bg300: string;
  bg400: string;
  bg500: string;
  bg600: string;
  bg700: string;
  bg950: string;
  
  // Para texto (mesmas cores)
  text300: string;
  text400: string;
  text500: string;
  text600: string;
  
  // Com opacidade (retorna rgba string)
  alpha: (opacity: number) => string;
  
  // Classes CSS compatíveis (para uso em className quando necessário)
  // Essas usam CSS variables definidas no CommunityContext
  varBg: string;
  varText: string;
}

interface ThemeColors {
  // Cores do tier Standard (MGT, MEMBER, etc) - verde por padrão
  std: ColorShades;
  stdColors: ColorShades;
  
  // Cores do tier VIP (MAGAZINE, LEGEND, etc) - dourado por padrão  
  vip: ColorShades;
  vipColors: ColorShades;
  
  // Helper para gerar style object
  getColorStyle: (tier: 'std' | 'vip', type: 'bg' | 'text' | 'border', shade?: 400 | 500 | 600) => React.CSSProperties;
  
  // Seletor baseado no membership type
  getColors: (membershipType: string) => ColorShades;
}

export function useThemeColors(): ThemeColors {
  const { config, isStdTier } = useCommunity();
  
  const colors = useMemo(() => {
    const stdBase = config.backgroundColor || '#10b981';
    const vipBase = config.tierVipColor || '#d4af37';
    
    const createShades = (baseColor: string, varPrefix: string): ColorShades => {
      const { r, g, b } = hexToRgb(baseColor);
      
      return {
        color: baseColor,
        rgb: `${r}, ${g}, ${b}`,
        
        bg300: adjustColor(baseColor, 60),
        bg400: adjustColor(baseColor, 30),
        bg500: baseColor,
        bg600: adjustColor(baseColor, -20),
        bg700: adjustColor(baseColor, -40),
        bg950: adjustColor(baseColor, -100),
        
        text300: adjustColor(baseColor, 60),
        text400: adjustColor(baseColor, 30),
        text500: baseColor,
        text600: adjustColor(baseColor, -20),
        
        alpha: (opacity: number) => `rgba(${r}, ${g}, ${b}, ${opacity})`,
        
        varBg: `var(--${varPrefix}-500)`,
        varText: `var(--${varPrefix}-500)`,
      };
    };
    
    const std = createShades(stdBase, 'tier-std');
    const vip = createShades(vipBase, 'tier-vip');
    
    const getColorStyle = (
      tier: 'std' | 'vip', 
      type: 'bg' | 'text' | 'border', 
      shade: 400 | 500 | 600 = 500
    ): React.CSSProperties => {
      const shades = tier === 'std' ? std : vip;
      const color = shade === 400 
        ? shades.bg400 
        : shade === 600 
          ? shades.bg600 
          : shades.bg500;
      
      switch (type) {
        case 'bg':
          return { backgroundColor: color };
        case 'text':
          return { color };
        case 'border':
          return { borderColor: color };
        default:
          return {};
      }
    };
    
    const getColors = (membershipType: string): ColorShades => {
      return isStdTier(membershipType) ? std : vip;
    };
    
    return {
      std,
      stdColors: std,
      vip,
      vipColors: vip,
      getColorStyle,
      getColors,
    };
  }, [config.backgroundColor, config.tierVipColor, isStdTier]);
  
  return colors;
}

export default useThemeColors;
