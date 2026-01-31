// ============================================
// FEATURE GATE MIDDLEWARE
// ============================================
// Protege rotas baseado no plano da comunidade
// Magazine SRT (ENTERPRISE) passa por tudo
// Outras comunidades têm features bloqueadas

import { Request, Response, NextFunction } from 'express';
import { Feature, hasFeature, getMinimumPlan, FEATURE_INFO } from '../config/features.config';
import { getCommunityConfig } from '../services/tenantService';

/**
 * Middleware que bloqueia acesso a features não disponíveis no plano
 * 
 * Uso:
 * router.get('/supply-box', requireFeature(Feature.SUPPLY_BOX), controller.list);
 */
export function requireFeature(feature: Feature) {
  return (req: Request, res: Response, next: NextFunction) => {
    const community = getCommunityConfig();
    const plan = community.plan;
    
    if (hasFeature(plan, feature)) {
      // Feature disponível, prosseguir
      return next();
    }
    
    // Feature bloqueada
    const minimumPlan = getMinimumPlan(feature);
    const featureInfo = FEATURE_INFO[feature];
    
    return res.status(403).json({
      error: 'Feature not available',
      code: 'FEATURE_LOCKED',
      feature: feature,
      featureName: featureInfo.name,
      featureDescription: featureInfo.description,
      currentPlan: plan,
      requiredPlan: minimumPlan,
      message: `A feature "${featureInfo.name}" requer o plano ${minimumPlan} ou superior.`,
      upgradeUrl: `/upgrade?feature=${feature}`,
    });
  };
}

/**
 * Middleware que apenas marca se feature está disponível (não bloqueia)
 * Útil para rotas que funcionam parcialmente em planos menores
 */
export function checkFeature(feature: Feature) {
  return (req: Request, res: Response, next: NextFunction) => {
    const community = getCommunityConfig();
    const plan = community.plan;
    
    // Anexa info no request para uso no controller
    (req as any).featureAvailable = hasFeature(plan, feature);
    (req as any).currentPlan = plan;
    
    next();
  };
}

/**
 * Helper para verificar feature dentro de um controller
 */
export function isFeatureEnabled(feature: Feature): boolean {
  const community = getCommunityConfig();
  return hasFeature(community.plan, feature);
}
