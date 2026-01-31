// ============================================
// ROVEX INTEGRATION CONTROLLER
// ============================================
// Handlers para endpoints de integração com Rovex Platform

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import * as tenantService from '../services/tenantService';
import { CommunityConfig, PLAN_LIMITS, Plan } from '../config/community.config';
import { PLAN_FEATURES } from '../config/features.config';
import { invalidateCommunityCache } from '../middleware/tenantMiddleware';

// ============================================
// HEALTH CHECK
// ============================================
export async function healthCheck(req: Request, res: Response) {
  try {
    // Verificar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    
    const config = tenantService.getCommunityConfig();
    
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      community: {
        id: config.id,
        subdomain: config.subdomain,
        plan: config.plan,
      },
      version: process.env.APP_VERSION || '5.0.0',
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('[Rovex/Health] Error:', error);
    return res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================
// GET COMMUNITY CONFIG (para Frontend)
// ============================================
export async function getCommunityConfigEndpoint(req: Request, res: Response) {
  try {
    const config = tenantService.getCommunityConfig();
    const features = PLAN_FEATURES[config.plan] || [];
    
    // Não expor secrets para o frontend
    const safeConfig = {
      id: config.id,
      subdomain: config.subdomain,
      name: config.name,
      slogan: config.slogan,
      plan: config.plan,
      
      logoUrl: config.logoUrl,
      logoIconUrl: config.logoIconUrl,
      faviconUrl: config.faviconUrl,
      loginBackgroundUrl: config.loginBackgroundUrl,
      
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      accentColor: config.accentColor,
      
      currencyName: config.currencyName,
      currencySymbol: config.currencySymbol,
      currencyIcon: config.currencyIcon,
      tierVipName: config.tierVipName,
      tierVipColor: config.tierVipColor,
      tierStdName: config.tierStdName,
      tierStdColor: config.tierStdColor,
      xpName: config.xpName,
      
      limits: config.limits,
      
      // Features disponíveis no plano atual
      features: features.map(f => f.toString()),
    };
    
    return res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    console.error('[Rovex/Config] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get community config',
    });
  }
}

// ============================================
// GET METRICS
// ============================================
export async function getMetrics(req: Request, res: Response) {
  try {
    const config = tenantService.getCommunityConfig();
    
    // Buscar métricas agregadas
    const [
      totalUsers,
      activeToday,
      activeThisWeek,
      totalPosts,
      postsToday,
      totalMessages,
      totalGroups,
      totalStories,
      storageUsed,
    ] = await Promise.all([
      // Total users (excluindo deletados)
      prisma.user.count({ where: { deletedAt: null } }),
      
      // Ativos hoje
      prisma.user.count({
        where: {
          deletedAt: null,
          lastSeenAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      
      // Ativos na semana
      prisma.user.count({
        where: {
          deletedAt: null,
          lastSeenAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      
      // Total posts
      prisma.post.count({ where: { isRemoved: false } }),
      
      // Posts hoje
      prisma.post.count({
        where: {
          isRemoved: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      
      // Total mensagens
      prisma.message.count(),
      
      // Total grupos
      prisma.group.count(),
      
      // Stories ativos
      prisma.story.count({
        where: { expiresAt: { gt: new Date() } },
      }),
      
      // Storage estimado (placeholder - implementar com Cloudinary/R2 API)
      Promise.resolve(0),
    ]);
    
    return res.json({
      success: true,
      data: {
        communityId: config.id,
        subdomain: config.subdomain,
        plan: config.plan,
        timestamp: new Date().toISOString(),
        
        users: {
          total: totalUsers,
          limit: config.limits.maxUsers,
          activeToday,
          activeThisWeek,
          utilizationPercent: config.limits.maxUsers === Infinity 
            ? 0 
            : Math.round((totalUsers / config.limits.maxUsers) * 100),
        },
        
        content: {
          totalPosts,
          postsToday,
          totalMessages,
          totalGroups,
          activeStories: totalStories,
        },
        
        storage: {
          usedMB: storageUsed,
          limitMB: config.limits.maxStorageMB,
          utilizationPercent: Math.round((storageUsed / config.limits.maxStorageMB) * 100),
        },
      },
    });
  } catch (error) {
    console.error('[Rovex/Metrics] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to collect metrics',
    });
  }
}

// ============================================
// REPORT METRICS (push para Rovex)
// ============================================
export async function reportMetrics(req: Request, res: Response) {
  // Este endpoint é chamado periodicamente para reportar métricas
  // Por enquanto, apenas confirma recebimento
  // A implementação real seria um cron job que envia para Rovex
  
  return res.json({
    success: true,
    message: 'Metrics report received',
  });
}

// ============================================
// UPDATE CONFIG
// ============================================
export async function updateConfig(req: Request, res: Response) {
  try {
    const newConfig = req.body as Partial<CommunityConfig>;
    
    if (!newConfig.subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain is required',
      });
    }
    
    // Atualizar config
    const currentConfig = tenantService.getCommunityConfig();
    const plan = (newConfig.plan || currentConfig.plan) as Plan;
    const updatedConfig: CommunityConfig = {
      ...currentConfig,
      ...newConfig,
      // Sempre recalcular limits baseado no plano
      limits: PLAN_LIMITS[plan],
      updatedAt: new Date().toISOString(),
    };
    
    // Aplicar nova config
    tenantService.setCommunityConfig(updatedConfig);
    
    // Invalidar cache se em modo multi-tenant
    invalidateCommunityCache(updatedConfig.subdomain);
    
    console.log(`[Rovex/Config] Config updated for ${updatedConfig.subdomain}`);
    
    return res.json({
      success: true,
      message: 'Configuration updated',
      data: {
        subdomain: updatedConfig.subdomain,
        plan: updatedConfig.plan,
      },
    });
  } catch (error) {
    console.error('[Rovex/Config] Update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update config',
    });
  }
}

// ============================================
// WEBHOOK HANDLER
// ============================================
export async function handleWebhook(req: Request, res: Response) {
  try {
    const { event, payload } = req.body;
    
    console.log(`[Rovex/Webhook] Received event: ${event}`);
    
    switch (event) {
      case 'plan.upgraded':
      case 'plan.downgraded':
        await handlePlanChange(payload);
        break;
        
      case 'community.suspended':
        await handleSuspension(payload);
        break;
        
      case 'community.activated':
        await handleActivation(payload);
        break;
        
      case 'billing.failed':
        await handleBillingFailed(payload);
        break;
        
      default:
        console.log(`[Rovex/Webhook] Unknown event: ${event}`);
    }
    
    return res.json({
      success: true,
      received: event,
    });
  } catch (error) {
    console.error('[Rovex/Webhook] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
    });
  }
}

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handlePlanChange(payload: { subdomain: string; oldPlan: string; newPlan: string }) {
  console.log(`[Rovex] Plan change: ${payload.subdomain} ${payload.oldPlan} -> ${payload.newPlan}`);
  
  // Invalidar cache para forçar reload da config
  invalidateCommunityCache(payload.subdomain);
  
  // TODO: Notificar admins da comunidade sobre mudança de plano
}

async function handleSuspension(payload: { subdomain: string; reason: string }) {
  console.log(`[Rovex] Community suspended: ${payload.subdomain} - ${payload.reason}`);
  
  // TODO: Implementar lógica de suspensão
  // - Bloquear novos logins
  // - Mostrar mensagem de manutenção
}

async function handleActivation(payload: { subdomain: string }) {
  console.log(`[Rovex] Community activated: ${payload.subdomain}`);
  
  // Limpar cache para carregar config atualizada
  invalidateCommunityCache(payload.subdomain);
}

async function handleBillingFailed(payload: { subdomain: string; nextRetry: string }) {
  console.log(`[Rovex] Billing failed: ${payload.subdomain}, retry at ${payload.nextRetry}`);
  
  // TODO: Notificar admin da comunidade sobre falha no pagamento
}
