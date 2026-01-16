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

import { createContext, useContext, useState, type ReactNode } from 'react';
import { 
  type CommunityConfig, 
  DEFAULT_COMMUNITY_CONFIG,
  formatCurrency,
  getTierColor,
  getTierName,
  isVipTier,
} from '../config/community.config';
import { Plan, type Feature } from '../utils/features';
import { isFeatureAvailable, getRequiredPlan } from '../hooks/useFeature';
import api from '../services/api';

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
      
      // Tenta buscar config do backend
      const response = await api.get('/rovex/config');
      
      if (response.data?.config) {
        setConfig(prev => ({
          ...prev,
          ...response.data.config,
        }));
      }
    } catch (err) {
      // Se não conseguir, usa config padrão (não é erro crítico)
      console.log('[CommunityContext] Using default config');
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega config na inicialização (opcional - pode descomentar se quiser)
  // useEffect(() => {
  //   refreshConfig();
  // }, []);

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
