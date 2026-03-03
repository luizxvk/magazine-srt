/**
 * CommunityContext
 * 
 * Provê configurações da comunidade para toda a aplicação.
 * Essas configurações podem ser sobrescritas via provisioning Rovex.
 * 
 * Uso:
 * ```tsx
 * const { config, isFeatureEnabled } = useCommunity();
 * ```
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type CommunityConfig, 
  DEFAULT_COMMUNITY_CONFIG,
  formatCurrency,
  getTierColor,
  getTierName,
  isVipTier,
  isStdTier,
} from '../config/community.config';
import { Plan, type Feature } from '../utils/features';
import { isFeatureAvailable, getRequiredPlan } from '../hooks/useFeature';
import api from '../services/api';

// Helper para converter hex para RGB
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '16, 185, 129'; // fallback emerald
};

// Helper para clarear/escurecer cores
const adjustColor = (hex: string, amount: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = Math.max(0, Math.min(255, parseInt(result[1], 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(result[2], 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(result[3], 16) + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// ============================================
// INTERFACE DO CONTEXTO
// ============================================

interface CommunityContextValue {
  // Configuração completa
  config: CommunityConfig;
  
  // Atalhos para valores mais usados
  communityName: string;
  currencyName: string;
  currencySymbol: string;
  tierVipName: string;
  tierStdName: string;
  plan: Plan;
  
  // Feature gating
  isFeatureEnabled: (feature: Feature) => boolean;
  getFeatureRequiredPlan: (feature: Feature) => Plan;
  
  // Helpers
  formatCurrency: (value: number) => string;
  getTierColor: (membershipType: string) => string;
  getTierName: (membershipType: string) => string;
  isVipTier: (membershipType: string) => boolean;
  isStdTier: (membershipType: string) => boolean;
  
  // Estado
  isLoading: boolean;
  error: string | null;
  
  // Ações
  refreshConfig: () => Promise<void>;
}

// ============================================
// CONTEXTO
// ============================================

const CommunityContext = createContext<CommunityContextValue | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface CommunityProviderProps {
  children: ReactNode;
  initialConfig?: Partial<CommunityConfig>;
}

export function CommunityProvider({ children, initialConfig }: CommunityProviderProps) {
  const [config, setConfig] = useState<CommunityConfig>({
    ...DEFAULT_COMMUNITY_CONFIG,
    ...initialConfig,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega configuração do servidor (se disponível)
  const refreshConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Buscar config do endpoint público (não requer autenticação)
      const response = await api.get('/rovex/public/config');
      
      if (response.data?.config) {
        console.log('[CommunityContext] Config loaded from server:', response.data.config);
        setConfig(prev => ({
          ...prev,
          ...response.data.config,
        }));
      }
    } catch (err) {
      // Se não conseguir, usa config padrão (não é erro crítico)
      console.log('[CommunityContext] Using default config (server unavailable)');
    } finally {
      setIsLoading(false);
    }
  };

  // Aplica CSS variables para cores dinâmicas do tier Standard (MGT)
  useEffect(() => {
    const root = document.documentElement;
    // accentColor = cor de DESTAQUE (botões, badges, highlights) - ex: #0A2463
    // backgroundColor = cor de FUNDO do site - ex: #0A0F1A
    const accentColor = config.accentColor || config.backgroundColor || '#9333ea'; // Roxo padrão Rovex
    const bgColor = config.backgroundColor || '#0f0f0f';
    const vipColor = config.tierVipColor || '#d4af37';
    
    // CSS Variables para o tier Standard - usar ACCENT color para destaques
    root.style.setProperty('--tier-std-color', accentColor);
    root.style.setProperty('--tier-std-color-rgb', hexToRgb(accentColor));
    
    // Gerar variações de tonalidade (400, 500, 600, 700, 950)
    root.style.setProperty('--tier-std-400', adjustColor(accentColor, 30));
    root.style.setProperty('--tier-std-500', accentColor);
    root.style.setProperty('--tier-std-600', adjustColor(accentColor, -20));
    root.style.setProperty('--tier-std-700', adjustColor(accentColor, -40));
    root.style.setProperty('--tier-std-950', adjustColor(accentColor, -100));
    
    // CSS Variable para cor de fundo real
    root.style.setProperty('--bg-color', bgColor);
    root.style.setProperty('--bg-color-rgb', hexToRgb(bgColor));
    
    // CSS Variables para o tier VIP (MAGAZINE/LEGEND/etc)
    root.style.setProperty('--tier-vip-color', vipColor);
    root.style.setProperty('--tier-vip-color-rgb', hexToRgb(vipColor));
    root.style.setProperty('--tier-vip-400', adjustColor(vipColor, 30));
    root.style.setProperty('--tier-vip-500', vipColor);
    root.style.setProperty('--tier-vip-600', adjustColor(vipColor, -20));
    
    console.log('[CommunityContext] Applied dynamic colors:', { accentColor, bgColor, vipColor });
  }, [config.accentColor, config.backgroundColor, config.tierVipColor]);

  // Carrega config do servidor na inicialização
  useEffect(() => {
    refreshConfig();
  }, []);

  // Feature gating baseado no plano
  const checkFeatureEnabled = (feature: Feature): boolean => {
    return isFeatureAvailable(feature, config.plan);
  };

  const getFeatureRequiredPlan = (feature: Feature): Plan => {
    return getRequiredPlan(feature);
  };

  // Helpers contextualizados
  const formatCurrencyValue = (value: number): string => {
    return formatCurrency(value, config);
  };

  const getTierColorValue = (membershipType: string): string => {
    return getTierColor(membershipType, config);
  };

  const getTierNameValue = (membershipType: string): string => {
    return getTierName(membershipType, config);
  };

  const isVipTierValue = (membershipType: string): boolean => {
    return isVipTier(membershipType, config);
  };

  const isStdTierValue = (membershipType: string): boolean => {
    return isStdTier(membershipType, config);
  };

  // Valor do contexto
  const value: CommunityContextValue = {
    config,
    
    // Atalhos
    communityName: config.name,
    currencyName: config.currencyName,
    currencySymbol: config.currencySymbol,
    tierVipName: config.tierVipName,
    tierStdName: config.tierStdName,
    plan: config.plan as Plan,
    
    // Feature gating
    isFeatureEnabled: checkFeatureEnabled,
    getFeatureRequiredPlan,
    
    // Helpers
    formatCurrency: formatCurrencyValue,
    getTierColor: getTierColorValue,
    getTierName: getTierNameValue,
    isVipTier: isVipTierValue,
    isStdTier: isStdTierValue,
    
    // Estado
    isLoading,
    error,
    
    // Ações
    refreshConfig,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useCommunity(): CommunityContextValue {
  const context = useContext(CommunityContext);
  
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  
  return context;
}

// Export default para compatibilidade
export default CommunityContext;
