/**
 * Feature Routes
 * 
 * Endpoints para consultar features disponíveis e bloqueadas
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/authMiddleware';
import { getCurrentPlan } from '../middleware/featureGate';
import { 
  Feature,
  Plan,
  FEATURE_INFO,
  PLAN_DETAILS,
  getAllFeaturesForPlan,
  getLockedFeatures,
  getUpgradeFeatures,
  getMinimumPlan,
  getNextPlan,
  hasFeature,
} from '../utils/features';

const router = Router();

/**
 * GET /api/features/available
 * 
 * Retorna todas as features disponíveis e bloqueadas para o plano atual
 */
router.get('/available', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const communityPlan = getCurrentPlan();
    const nextPlan = getNextPlan(communityPlan);
    
    const availableFeatures = getAllFeaturesForPlan(communityPlan);
    const lockedFeatures = getLockedFeatures(communityPlan);
    const upgradeFeatures = getUpgradeFeatures(communityPlan);
    
    // Formata features disponíveis com info
    const available = availableFeatures.map(f => ({
      feature: f,
      ...FEATURE_INFO[f],
    }));
    
    // Formata features bloqueadas com info + plano necessário
    const locked = lockedFeatures.map(f => ({
      feature: f,
      ...FEATURE_INFO[f],
      requiredPlan: getMinimumPlan(f),
      requiredPlanDetails: PLAN_DETAILS[getMinimumPlan(f)],
    }));
    
    // Highlights do próximo plano
    const upgradeHighlights = upgradeFeatures.slice(0, 5).map(f => ({
      feature: f,
      ...FEATURE_INFO[f],
    }));
    
    res.json({
      success: true,
      data: {
        currentPlan: communityPlan,
        currentPlanDetails: PLAN_DETAILS[communityPlan],
        nextPlan: nextPlan,
        nextPlanDetails: nextPlan ? PLAN_DETAILS[nextPlan] : null,
        availableFeatures: available,
        availableCount: available.length,
        lockedFeatures: locked,
        lockedCount: locked.length,
        upgradeHighlights,
      }
    });
  } catch (error) {
    console.error('[Features] Error fetching available features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch features',
    });
  }
});

/**
 * GET /api/features/check/:feature
 * 
 * Verifica se uma feature específica está disponível
 */
router.get('/check/:feature', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const featureParam = req.params.feature as Feature;
    const communityPlan = getCurrentPlan();
    
    // Valida se a feature existe
    if (!Object.values(Feature).includes(featureParam)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feature',
        message: `Feature "${featureParam}" não existe`,
      });
    }
    
    const isAvailable = hasFeature(communityPlan, featureParam);
    const featureInfo = FEATURE_INFO[featureParam];
    const requiredPlan = getMinimumPlan(featureParam);
    
    res.json({
      success: true,
      data: {
        feature: featureParam,
        isAvailable,
        featureInfo,
        currentPlan: communityPlan,
        requiredPlan,
        requiredPlanDetails: isAvailable ? null : PLAN_DETAILS[requiredPlan],
      }
    });
  } catch (error) {
    console.error('[Features] Error checking feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature',
    });
  }
});

/**
 * GET /api/features/plans
 * 
 * Retorna todos os planos disponíveis com suas features
 */
router.get('/plans', (req: AuthRequest, res: Response) => {
  try {
    const communityPlan = getCurrentPlan();
    
    const plans = Object.values(Plan).map(plan => ({
      plan,
      ...PLAN_DETAILS[plan],
      isCurrent: plan === communityPlan,
      features: getAllFeaturesForPlan(plan).map(f => ({
        feature: f,
        name: FEATURE_INFO[f]?.name,
        description: FEATURE_INFO[f]?.description,
        category: FEATURE_INFO[f]?.category,
      })),
    }));
    
    res.json({
      success: true,
      data: {
        currentPlan: communityPlan,
        plans,
      }
    });
  } catch (error) {
    console.error('[Features] Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
    });
  }
});

export default router;
