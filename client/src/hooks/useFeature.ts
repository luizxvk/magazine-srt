/**
 * useFeature Hook
 * 
 * Hook para verificar se uma feature está disponível para o plano atual.
 * Retorna informações sobre a feature e o plano necessário.
 */

import { useMemo, useState, useEffect } from 'react';
import { Feature, FEATURE_INFO, Plan, PLAN_DETAILS } from '../utils/features';
import api from '../services/api';

// Cache do plano da comunidade
let communityPlanCache: Plan | null = null;

/**
 * Hook para verificar disponibilidade de features
 */
export function useFeature(feature: Feature) {
  const [currentPlan, setCurrentPlan] = useState<Plan>(communityPlanCache || Plan.STARTER);
  const [loading, setLoading] = useState(!communityPlanCache);
  
  useEffect(() => {
    // Se já temos cache, não precisa buscar
    if (communityPlanCache) {
      setCurrentPlan(communityPlanCache);
      setLoading(false);
      return;
    }
    
    // Busca o plano da comunidade
    const fetchPlan = async () => {
      try {
        const response = await api.get('/features/available');
        if (response.data?.data?.currentPlan) {
          communityPlanCache = response.data.data.currentPlan;
          setCurrentPlan(response.data.data.currentPlan);
        }
      } catch (error) {
        // Em caso de erro, assume STARTER (plano padrão do Magazine)
        console.warn('[useFeature] Could not fetch community plan, defaulting to STARTER');
        communityPlanCache = Plan.STARTER;
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlan();
  }, []);
  
  return useMemo(() => {
    const featureInfo = FEATURE_INFO[feature];
    const requiredPlan = getMinimumPlanForFeature(feature);
    const isAvailable = isPlanEqualOrHigher(currentPlan, requiredPlan);
    
    return {
      isAvailable,
      loading,
      currentPlan,
      requiredPlan,
      featureInfo,
      requiredPlanDetails: PLAN_DETAILS[requiredPlan],
    };
  }, [currentPlan, feature, loading]);
}

/**
 * Hook para verificar múltiplas features de uma vez
 */
export function useFeatures(features: Feature[]) {
  const [currentPlan, setCurrentPlan] = useState<Plan>(communityPlanCache || Plan.STARTER);
  const [loading, setLoading] = useState(!communityPlanCache);
  
  useEffect(() => {
    if (communityPlanCache) {
      setCurrentPlan(communityPlanCache);
      setLoading(false);
      return;
    }
    
    const fetchPlan = async () => {
      try {
        const response = await api.get('/features/available');
        if (response.data?.data?.currentPlan) {
          communityPlanCache = response.data.data.currentPlan;
          setCurrentPlan(response.data.data.currentPlan);
        }
      } catch (error) {
        communityPlanCache = Plan.STARTER;
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlan();
  }, []);
  
  return useMemo(() => {
    const results: Record<Feature, boolean> = {} as Record<Feature, boolean>;
    
    features.forEach(feature => {
      const requiredPlan = getMinimumPlanForFeature(feature);
      results[feature] = isPlanEqualOrHigher(currentPlan, requiredPlan);
    });
    
    return {
      features: results,
      loading,
      currentPlan,
    };
  }, [currentPlan, features, loading]);
}

/**
 * Hook para obter informações sobre o plano atual
 */
export function useCommunityPlan() {
  const [currentPlan, setCurrentPlan] = useState<Plan>(communityPlanCache || Plan.STARTER);
  const [loading, setLoading] = useState(!communityPlanCache);
  
  useEffect(() => {
    if (communityPlanCache) {
      setCurrentPlan(communityPlanCache);
      setLoading(false);
      return;
    }
    
    const fetchPlan = async () => {
      try {
        const response = await api.get('/features/available');
        if (response.data?.data?.currentPlan) {
          communityPlanCache = response.data.data.currentPlan;
          setCurrentPlan(response.data.data.currentPlan);
        }
      } catch (error) {
        communityPlanCache = Plan.STARTER;
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlan();
  }, []);
  
  return {
    plan: currentPlan,
    planDetails: PLAN_DETAILS[currentPlan],
    loading,
  };
}

// ===================== HELPER FUNCTIONS =====================

const PLAN_HIERARCHY: Plan[] = [Plan.FREE, Plan.STARTER, Plan.GROWTH, Plan.ENTERPRISE];

// Features disponíveis em cada plano
const PLAN_FEATURES: Record<Plan, Feature[]> = {
  [Plan.FREE]: [
    Feature.BASIC_AUTH,
    Feature.EMAIL_VERIFICATION,
    Feature.FEED,
    Feature.CREATE_POST,
    Feature.STORIES,
    Feature.XP_SYSTEM,
    Feature.ZIONS_POINTS,
    Feature.DAILY_LOGIN,
    Feature.BADGES,
    Feature.RANKING,
    Feature.DIRECT_MESSAGES,
  ],
  [Plan.STARTER]: [
    Feature.SESSION_SECURITY,
    Feature.IMAGE_UPLOAD,
    Feature.HIGHLIGHTS,
    Feature.POST_VISIBILITY,
    Feature.STORY_VIEWS,
    Feature.EQUIPPED_BADGE,
    Feature.LEVEL_TIMELINE,
    Feature.SUPPLY_BOX,
    Feature.CUSTOMIZATION_SHOP,
    Feature.READ_RECEIPTS,
    Feature.CHAT_IMAGES,
    Feature.GROUPS,
    Feature.SOCIAL_INTEGRATION_1,
    Feature.DISCORD_OAUTH,
    Feature.ADMIN_DASHBOARD,
    Feature.ANALYTICS_BASIC,
    Feature.PRODUCT_STORE,
    Feature.PAYMENT_ZIONS,
    Feature.WELCOME_TOUR,
    Feature.PHOTO_CATALOG,
    Feature.ROVEX_INTEGRATION,
  ],
  [Plan.GROWTH]: [
    Feature.SOCIAL_LOGIN_GOOGLE,
    Feature.VERIFIED_PROFILE,
    Feature.VIDEO_UPLOAD,
    Feature.STORY_EDITOR,
    Feature.ZIONS_CASH,
    Feature.RANKING_PERIODS,
    Feature.ZIONS_PURCHASE,
    Feature.MARKETPLACE_P2P,
    Feature.THEME_PACKS,
    Feature.GROUP_BACKGROUNDS,
    Feature.GROUP_NSFW,
    Feature.SOCIAL_INTEGRATION_3,
    Feature.STEAM_OAUTH,
    Feature.TWITCH_OAUTH,
    Feature.ADMIN_GRID_DASHBOARD,
    Feature.ADMIN_BADGES,
    Feature.ANALYTICS_ADVANCED,
    Feature.GAME_KEYS,
    Feature.PAYMENT_PIX,
  ],
  [Plan.ENTERPRISE]: [
    Feature.ZIONS_WITHDRAWAL,
    Feature.SOCIAL_INTEGRATION_UNLIMITED,
    Feature.ADMIN_WITHDRAWALS,
    Feature.DEV_TOOLS,
    Feature.ANALYTICS_API,
    Feature.REVENUE_REPORTS,
    Feature.PAYMENT_CARD,
    Feature.WHITE_LABEL,
  ],
};

function getAllFeaturesForPlan(plan: Plan): Feature[] {
  const planIndex = PLAN_HIERARCHY.indexOf(plan);
  const allFeatures = new Set<Feature>();
  
  for (let i = 0; i <= planIndex; i++) {
    const planFeatures = PLAN_FEATURES[PLAN_HIERARCHY[i]];
    planFeatures.forEach(f => allFeatures.add(f));
  }
  
  return Array.from(allFeatures);
}

function getMinimumPlanForFeature(feature: Feature): Plan {
  for (const plan of PLAN_HIERARCHY) {
    const features = getAllFeaturesForPlan(plan);
    if (features.includes(feature)) {
      return plan;
    }
  }
  return Plan.ENTERPRISE;
}

function isPlanEqualOrHigher(currentPlan: Plan, requiredPlan: Plan): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  return currentIndex >= requiredIndex;
}

/**
 * Limpa o cache do plano (útil para testes ou quando o plano muda)
 */
export function clearPlanCache() {
  communityPlanCache = null;
}

export default useFeature;
