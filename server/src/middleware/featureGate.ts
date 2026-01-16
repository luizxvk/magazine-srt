/**
 * Feature Gate Middleware
 * 
 * Middleware para proteger rotas que requerem features específicas.
 * Bloqueia acesso e retorna erro FEATURE_LOCKED com informações de upgrade.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { 
  Feature, 
  Plan, 
  hasFeature, 
  getMinimumPlan, 
  FEATURE_INFO,
  PLAN_DETAILS,
} from '../utils/features';

// Cache do plano da comunidade (em produção, viria do Rovex ou config)
// Por enquanto, usamos variável de ambiente ou default
function getCommunityPlan(): Plan {
  const planFromEnv = process.env.COMMUNITY_PLAN as Plan;
  if (planFromEnv && Object.values(Plan).includes(planFromEnv)) {
    return planFromEnv;
  }
  // Default: STARTER para Magazine SRT
  return Plan.STARTER;
}

export interface FeatureLockedError {
  success: false;
  error: 'FEATURE_LOCKED';
  message: string;
  data: {
    feature: Feature;
    featureName: string;
    featureDescription: string;
    featureCategory: string;
    currentPlan: Plan;
    requiredPlan: Plan;
    requiredPlanDetails: {
      name: string;
      priceMonthly: number;
      priceYearly: number;
    };
    upgradeUrl: string;
  };
}

/**
 * Middleware que verifica se a comunidade tem acesso a uma feature
 * 
 * @param feature - A feature que será verificada
 * @returns Middleware do Express
 * 
 * @example
 * router.get('/marketplace', authenticate, requireFeature(Feature.MARKETPLACE_P2P), controller);
 */
export function requireFeature(feature: Feature) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const communityPlan = getCommunityPlan();
    
    if (!hasFeature(communityPlan, feature)) {
      const minimumPlan = getMinimumPlan(feature);
      const featureInfo = FEATURE_INFO[feature];
      const planDetails = PLAN_DETAILS[minimumPlan];
      
      const response: FeatureLockedError = {
        success: false,
        error: 'FEATURE_LOCKED',
        message: `Esta funcionalidade requer o plano ${planDetails.name} ou superior`,
        data: {
          feature: feature,
          featureName: featureInfo?.name || feature,
          featureDescription: featureInfo?.description || 'Funcionalidade não disponível no plano atual',
          featureCategory: featureInfo?.category || 'Outros',
          currentPlan: communityPlan,
          requiredPlan: minimumPlan,
          requiredPlanDetails: {
            name: planDetails.name,
            priceMonthly: planDetails.priceMonthly,
            priceYearly: planDetails.priceYearly,
          },
          upgradeUrl: '/upgrade',
        }
      };
      
      console.log(`[FeatureGate] 🔒 Blocked access to ${feature} - requires ${minimumPlan}, community has ${communityPlan}`);
      
      return res.status(403).json(response);
    }
    
    next();
  };
}

/**
 * Helper para verificar feature em controllers (sem bloquear)
 */
export function checkFeature(feature: Feature): boolean {
  const communityPlan = getCommunityPlan();
  return hasFeature(communityPlan, feature);
}

/**
 * Retorna o plano atual da comunidade
 */
export function getCurrentPlan(): Plan {
  return getCommunityPlan();
}

export default requireFeature;
