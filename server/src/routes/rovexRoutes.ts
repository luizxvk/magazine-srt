import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import { reportMetricsToRovex, testRovexConnection, isRovexConfigured, reportEvent } from '../services/rovexService';
import {
  getSuspensionState,
  setSuspensionState,
  setQuotaLimits,
  updateBranding,
  setDeletionState,
  updateFeatureFlags,
  getQuotaLimits,
  invalidateSuspensionCache,
} from '../services/suspensionService';

import {
  getRovexPixRequests,
  reviewPixRequest
} from '../controllers/pixSellerController';

const router = Router();

// =====================================
// CACHE E HELPER FUNCTIONS
// =====================================

// Cache em memória para o secret (evita consultas repetidas ao banco)
let cachedSecret: string | null = null;
let secretCacheExpiry: number = 0;
const SECRET_CACHE_TTL = 60 * 1000; // 1 minuto

/**
 * Busca o secret do Rovex do banco de dados ou cache
 * Fallback para env var se não configurado
 */
async function getStoredSecret(): Promise<string | null> {
  // Verificar cache
  if (cachedSecret && Date.now() < secretCacheExpiry) {
    return cachedSecret;
  }
  
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'rovex_api_secret' },
    });
    
    if (config?.value) {
      // Atualizar cache
      cachedSecret = config.value;
      secretCacheExpiry = Date.now() + SECRET_CACHE_TTL;
      return config.value;
    }
  } catch (error) {
    console.warn('[Rovex] Could not fetch secret from database:', error);
  }
  
  // Fallback para env var
  return process.env.ROVEX_API_SECRET || null;
}

/**
 * Salva o secret do Rovex no banco de dados
 */
async function saveSecret(secret: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: 'rovex_api_secret' },
    update: { value: secret },
    create: { key: 'rovex_api_secret', value: secret },
  });
  
  // Atualizar cache
  cachedSecret = secret;
  secretCacheExpiry = Date.now() + SECRET_CACHE_TTL;
  
  console.log('[Rovex] ✅ API Secret saved/updated in database');
}

/**
 * Invalida o cache do secret (para forçar nova busca)
 */
function invalidateSecretCache(): void {
  cachedSecret = null;
  secretCacheExpiry = 0;
}

/**
 * Verifica assinatura HMAC-SHA256 do webhook da Rovex
 * OBRIGATÓRIO para garantir autenticidade dos webhooks
 */
function verifyRovexSignature(
  signature: string,
  timestamp: string,
  body: string,
  secret: string
): boolean {
  const signatureBase = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signatureBase)
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Middleware para validar secret da Rovex Platform
 * Suporta dois formatos de autenticação:
 * 1. Header x-rovex-secret: <secret>
 * 2. Header Authorization: Bearer <secret>
 * 
 * Busca o secret dinamicamente do banco de dados com fallback para env var
 */
const validateRovexSecret = async (req: Request, res: Response, next: NextFunction) => {
  // Tentar obter secret do header x-rovex-secret (formato legado)
  let secret = req.headers['x-rovex-secret'] as string | undefined;
  
  // Se não encontrou, tentar Authorization: Bearer (formato novo)
  if (!secret) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      secret = authHeader.substring(7);
    }
  }
  
  if (!secret) {
    console.warn('⚠️ Unauthorized Rovex request - no secret provided');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Missing Rovex secret',
      code: 'MISSING_SECRET'
    });
  }
  
  // Buscar secret salvo do banco/cache (com fallback para env var)
  const expectedSecret = await getStoredSecret();
  
  if (!expectedSecret) {
    console.warn('⚠️ No Rovex secret configured - use /provision endpoint first');
    return res.status(401).json({ 
      success: false, 
      error: 'Rovex secret not configured',
      code: 'NOT_CONFIGURED'
    });
  }
  
  if (secret !== expectedSecret) {
    console.warn('⚠️ Unauthorized Rovex request - invalid secret');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Invalid Rovex secret',
      code: 'INVALID_SECRET'
    });
  }
  
  next();
};

/**
 * Middleware para validar secret do Cron (Vercel)
 */
const validateCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const cronSecret = process.env.CRON_SECRET;
  
  // Se CRON_SECRET não está configurado, bloquear acesso
  if (!cronSecret) {
    console.warn('⚠️ CRON_SECRET not configured - blocking cron access');
    return res.status(503).json({
      success: false,
      error: 'Cron not configured',
    });
  }
  
  // Vercel envia o secret no header Authorization: Bearer <secret>
  const authHeader = req.headers.authorization;
  const secret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!secret || secret !== cronSecret) {
    console.warn('⚠️ Unauthorized cron request attempt');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid cron secret',
    });
  }
  
  next();
};

// =====================================
// ROTAS PÚBLICAS (sem autenticação)
// =====================================

/**
 * GET /api/rovex/public/health
 * Health check público para monitoramento externo
 * NÃO requer autenticação
 */
router.get('/public/health', async (req: Request, res: Response) => {
  try {
    // Testar conexão com banco
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    res.json({
      status: 'healthy',
      database: true,
      dbLatencyMs: dbLatency,
      version: process.env.APP_VERSION || '0.4.3',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('❌ Public health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: false,
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

/**
 * GET /api/rovex/public/stats
 * Retorna estatísticas públicas da comunidade (para tela de beta)
 * NÃO requer autenticação
 */
router.get('/public/stats', async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalPosts, totalBadges] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.post.count(),
      prisma.badge.count(),
    ]);
    
    res.json({
      success: true,
      betaTesters: totalUsers,
      totalPosts,
      totalFeatures: 50, // Valor fixo baseado no roadmap
      totalBadges,
    });
  } catch (error) {
    console.error('❌ Public stats error:', error);
    res.status(500).json({
      success: false,
      betaTesters: 0,
      totalPosts: 0,
      totalFeatures: 50,
      totalBadges: 0,
    });
  }
});

/**
 * GET /api/rovex/public/config
 * Retorna configurações da comunidade para o FRONTEND
 * NÃO requer autenticação - usado pelo CommunityContext
 */
router.get('/public/config', async (req: Request, res: Response) => {
  try {
    // Primeiro, verificar se já temos config no tenant context (multi-tenant)
    const tenantConfig = (req as any).community;
    
    // Tenta buscar config do banco local (para Magazine SRT default)
    let savedConfig: Record<string, unknown> | null = null;
    try {
      const configRecord = await prisma.systemConfig.findUnique({
        where: { key: 'community_config' },
      });
      if (configRecord?.value) {
        savedConfig = JSON.parse(configRecord.value);
      }
    } catch {
      // Tabela pode não existir ainda
    }
    
    // Se temos config do tenant middleware (Rovex), usar ele como base
    // Prioridade: tenantConfig (Rovex) > savedConfig (local) > defaults
    const baseConfig = tenantConfig || {};
    
    // Mescla config - tenant config tem prioridade sobre saved config
    const config = {
      id: baseConfig.id || savedConfig?.id || 'magazine-srt',
      subdomain: baseConfig.subdomain || savedConfig?.subdomain || 'magazine-srt',
      name: baseConfig.name || savedConfig?.name || 'Magazine SRT',
      slogan: baseConfig.slogan || savedConfig?.slogan || 'A comunidade definitiva',
      
      // Cores - TENANT CONFIG tem prioridade!
      primaryColor: baseConfig.primaryColor || savedConfig?.primaryColor || '#A78BFA',
      secondaryColor: baseConfig.secondaryColor || savedConfig?.secondaryColor || '#8B5CF6',
      accentColor: baseConfig.accentColor || savedConfig?.accentColor || '#A78BFA',
      backgroundColor: baseConfig.backgroundColor || savedConfig?.backgroundColor || '#A78BFA',
      
      // Tiers - TENANT CONFIG tem prioridade!
      tierVipName: baseConfig.tierVipName || savedConfig?.tierVipName || 'MAGAZINE',
      tierVipColor: baseConfig.tierVipColor || savedConfig?.tierVipColor || '#d4af37',
      tierVipSlogan: baseConfig.tierVipSlogan || savedConfig?.tierVipSlogan || 'A Elite do Sucesso',
      tierStdName: baseConfig.tierStdName || savedConfig?.tierStdName || 'ROVEX',
      tierStdSlogan: baseConfig.tierStdSlogan || savedConfig?.tierStdSlogan || 'Velocidade e Poder',
      
      // Logos - TENANT CONFIG tem prioridade!
      logoUrl: baseConfig.logoUrl || savedConfig?.logoUrl || '/assets/logo-mgzn.png',
      logoIconUrl: baseConfig.logoIconUrl || savedConfig?.logoIconUrl || '/assets/logo-rovex.png',
      faviconUrl: baseConfig.faviconUrl || savedConfig?.faviconUrl || '/favicon.ico',
      
      // Economia - TENANT CONFIG tem prioridade!
      currencyName: baseConfig.currencyName || savedConfig?.currencyName || 'Zions',
      currencySymbol: baseConfig.currencySymbol || savedConfig?.currencySymbol || 'Z$',
      
      // Plano
      plan: baseConfig.plan || savedConfig?.plan || process.env.COMMUNITY_PLAN || 'ENTERPRISE',
      
      // Ads Configuration (geralmente local)
      adsEnabled: savedConfig?.adsEnabled ?? false,
      adsCarouselEnabled: savedConfig?.adsCarouselEnabled ?? false,
      adsClientId: savedConfig?.adsClientId || process.env.ADSENSE_CLIENT_ID || 'ca-pub-5337827655553735',
      adsCarouselSlot: savedConfig?.adsCarouselSlot || process.env.ADSENSE_CAROUSEL_SLOT || '1989194771',
    };
    
    // Log para debug (remover em produção)
    if (tenantConfig) {
      console.log('[PublicConfig] Using tenant config for:', tenantConfig.subdomain);
    }
    
    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('❌ Public config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch config',
    });
  }
});

/**
 * GET /api/rovex/cron/metrics
 * Endpoint de cron para Vercel - reporta métricas periodicamente
 * Autenticado via CRON_SECRET
 */
router.get('/cron/metrics', validateCronSecret, async (req: Request, res: Response) => {
  console.log('[Cron] Starting Rovex metrics sync...');
  
  try {
    if (!isRovexConfigured()) {
      console.warn('[Cron] Rovex not configured - skipping');
      return res.json({
        success: true,
        skipped: true,
        message: 'Rovex integration not configured',
        timestamp: new Date().toISOString(),
      });
    }
    
    const success = await reportMetricsToRovex();
    
    if (success) {
      console.log('[Cron] ✅ Metrics synced successfully');
      return res.json({
        success: true,
        message: 'Metrics synced to Rovex',
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('[Cron] ❌ Failed to sync metrics');
      return res.status(500).json({
        success: false,
        error: 'Failed to report metrics',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Cron] ❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/rovex/provision
 * 
 * Provisiona uma nova comunidade ou atualiza configuração completa.
 * Este endpoint suporta AUTENTICAÇÃO FLEXÍVEL:
 * 
 * 1. PRIMEIRO SETUP (sem secret salvo): Aceita sem autenticação
 * 2. ATUALIZAÇÕES: Requer x-rovex-secret header com o secret atual
 * 
 * O rovexApiSecret enviado no body é salvo no banco para futuras autenticações.
 */
router.post('/provision', async (req: Request, res: Response) => {
  try {
    const {
      // Identificação
      communityId,
      subdomain,
      name,
      slogan,
      
      // Branding
      logoUrl,
      logoIconUrl,
      faviconUrl,
      ogImageUrl,
      
      // Cores
      primaryColor,
      secondaryColor,
      accentColor,
      
      // Tiers
      tierVipName,
      tierVipColor,
      tierVipSlogan,
      tierStdName,
      tierStdSlogan,
      backgroundColor,
      
      // Economia
      currencyName,
      currencySymbol,
      currencyIconUrl,
      
      // Plano
      plan,
      planExpiresAt,
      
      // Quotas
      quotas,
      
      // URLs
      baseUrl,
      rovexApiUrl,
      
      // Database (não salvar no banco por segurança)
      databaseUrl,
      
      // 🔑 CRÍTICO: API Secret
      rovexApiSecret,
      
      // Admin inicial (formato novo)
      adminEmail,
      adminPassword,
      adminName,
      ownerEmail,
      
      // Legacy support
      communityName,
      adminUser,
      features,
    } = req.body;
    
    // Buscar secret atual do banco/cache
    const savedSecret = await getStoredSecret();
    
    // Validar autenticação
    if (savedSecret) {
      // Já tem secret salvo - exigir autenticação no header
      const headerSecret = req.headers['x-rovex-secret'] as string | undefined;
      
      if (!headerSecret || headerSecret !== savedSecret) {
        console.warn('⚠️ Unauthorized provision attempt - invalid secret');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - Invalid Rovex secret',
          code: 'INVALID_SECRET',
        });
      }
    } else {
      // Primeiro setup - aceitar sem autenticação
      console.log('[Rovex] 🆕 First-time provisioning detected');
    }
    
    // Validar campos obrigatórios
    if (!rovexApiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: rovexApiSecret',
        code: 'VALIDATION_ERROR',
      });
    }
    
    console.log(`🚀 Provisioning community: ${name || communityName} (${subdomain})`);
    
    // Salvar o API Secret
    await saveSecret(rovexApiSecret);
    
    // Criar configuração completa
    const communityConfig = {
      id: communityId || subdomain || 'magazine-srt',
      subdomain: subdomain || 'magazine-srt',
      name: name || communityName || 'Rovex Communities',
      slogan: slogan || 'Sua comunidade gamificada',
      plan: plan || 'STARTER',
      
      // Branding
      logoUrl: logoUrl || null,
      logoIconUrl: logoIconUrl || null,
      faviconUrl: faviconUrl || null,
      ogImageUrl: ogImageUrl || null,
      
      // Cores
      primaryColor: primaryColor || '#d4af37',
      secondaryColor: secondaryColor || '#7C3AED',
      accentColor: accentColor || '#8B5CF6',
      
      // Tiers
      tierVipName: tierVipName || 'MAGAZINE',
      tierVipColor: tierVipColor || '#d4af37',
      tierVipSlogan: tierVipSlogan || 'A Elite do Sucesso',
      tierStdName: tierStdName || 'ROVEX',
      tierStdSlogan: tierStdSlogan || 'Velocidade e Poder',
      backgroundColor: backgroundColor || '#8B5CF6',
      
      // Economia
      currencyName: currencyName || 'Zions',
      currencySymbol: currencySymbol || 'Z$',
      currencyIconUrl: currencyIconUrl || null,
      
      // Plano
      planExpiresAt: planExpiresAt || null,
      
      // URLs
      baseUrl: baseUrl || null,
      rovexApiUrl: rovexApiUrl || process.env.ROVEX_API_URL || null,
      
      // Features
      features: features || {},
      
      // Quotas
      quotas: quotas || null,
      
      // Timestamps
      provisionedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Salvar config no banco
    await prisma.systemConfig.upsert({
      where: { key: 'community_config' },
      update: { value: JSON.stringify(communityConfig) },
      create: { key: 'community_config', value: JSON.stringify(communityConfig) },
    });
    
    // Salvar quotas separadamente se fornecidas
    if (quotas) {
      await setQuotaLimits(quotas);
    }
    
    // Atualizar feature flags baseado no plano
    if (plan) {
      await updateFeatureFlags(plan);
    }
    
    // Criar usuário admin se fornecido
    // Suporta dois formatos:
    // 1. Novo: adminEmail, adminPassword, adminName (direto no body)
    // 2. Legado: adminUser.email, adminUser.password, adminUser.name
    let adminResult = null;
    const finalAdminEmail = adminEmail || adminUser?.email;
    const finalAdminPassword = adminPassword || adminUser?.password;
    const finalAdminName = adminName || adminUser?.name;
    
    if (finalAdminEmail && finalAdminPassword) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(finalAdminPassword, 10);
      
      const existingAdmin = await prisma.user.findUnique({
        where: { email: finalAdminEmail },
      });
      
      if (existingAdmin) {
        // Atualizar para admin
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'ADMIN' },
        });
        adminResult = { userId: existingAdmin.id, email: finalAdminEmail, action: 'updated' };
        console.log(`👤 Admin updated: ${finalAdminEmail}`);
      } else {
        // Criar novo admin
        const newAdmin = await prisma.user.create({
          data: {
            email: finalAdminEmail,
            name: finalAdminName || finalAdminEmail.split('@')[0],
            passwordHash: hashedPassword,
            role: 'ADMIN',
            membershipType: 'MAGAZINE',
            level: 1,
            xp: 0,
            zionsPoints: 1000,
            zionsCash: 0,
            trophies: 0,
            isVerified: true,
          },
        });
        adminResult = { userId: newAdmin.id, email: finalAdminEmail, action: 'created' };
        console.log(`👤 Admin created: ${finalAdminEmail}`);
      }
    }
    
    console.log(`✅ Community provisioned successfully`);
    
    res.json({
      success: true,
      message: savedSecret ? 'Configuration updated successfully' : 'Initial provisioning complete',
      data: {
        communityId: communityConfig.id,
        syncedAt: new Date().toISOString(),
      },
      config: communityConfig,
      adminUser: adminResult,
    });
  } catch (error) {
    console.error('❌ Provisioning error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provision community',
      code: 'PROVISIONING_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================
// ADMIN: ADS CONFIGURATION (JWT Auth only, before Rovex middleware)
// =====================================

/**
 * GET /api/rovex/admin/ads
 * Retorna configurações de anúncios (requer admin JWT)
 */
router.get('/admin/ads', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const configRecord = await prisma.systemConfig.findUnique({
      where: { key: 'community_config' },
    });
    
    let savedConfig: Record<string, unknown> = {};
    if (configRecord?.value) {
      savedConfig = JSON.parse(configRecord.value);
    }
    
    res.json({
      success: true,
      ads: {
        adsEnabled: savedConfig.adsEnabled ?? false,
        adsCarouselEnabled: savedConfig.adsCarouselEnabled ?? false,
        adsClientId: savedConfig.adsClientId || process.env.ADSENSE_CLIENT_ID || '',
        adsCarouselSlot: savedConfig.adsCarouselSlot || process.env.ADSENSE_CAROUSEL_SLOT || '',
      },
    });
  } catch (error) {
    console.error('❌ Get ads config error:', error);
    res.status(500).json({ success: false, error: 'Failed to get ads config' });
  }
});

/**
 * POST /api/rovex/admin/ads
 * Atualiza configurações de anúncios (requer admin JWT)
 * 
 * Body:
 * - adsEnabled: boolean
 * - adsCarouselEnabled: boolean  
 * - adsClientId: string (opcional)
 * - adsCarouselSlot: string (opcional)
 */
router.post('/admin/ads', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { adsEnabled, adsCarouselEnabled, adsClientId, adsCarouselSlot } = req.body;
    
    // Buscar config existente
    const configRecord = await prisma.systemConfig.findUnique({
      where: { key: 'community_config' },
    });
    
    let existingConfig: Record<string, unknown> = {};
    if (configRecord?.value) {
      existingConfig = JSON.parse(configRecord.value);
    }
    
    // Mesclar com novos valores de ads
    const updatedConfig = {
      ...existingConfig,
      adsEnabled: adsEnabled ?? existingConfig.adsEnabled ?? false,
      adsCarouselEnabled: adsCarouselEnabled ?? existingConfig.adsCarouselEnabled ?? false,
      adsClientId: adsClientId ?? existingConfig.adsClientId ?? '',
      adsCarouselSlot: adsCarouselSlot ?? existingConfig.adsCarouselSlot ?? '',
    };
    
    // Salvar config atualizada
    await prisma.systemConfig.upsert({
      where: { key: 'community_config' },
      update: { value: JSON.stringify(updatedConfig) },
      create: { key: 'community_config', value: JSON.stringify(updatedConfig) },
    });
    
    console.log('[Admin] ✅ Ads config updated:', {
      adsEnabled: updatedConfig.adsEnabled,
      adsCarouselEnabled: updatedConfig.adsCarouselEnabled,
    });
    
    res.json({
      success: true,
      message: 'Ads configuration updated',
      ads: {
        adsEnabled: updatedConfig.adsEnabled,
        adsCarouselEnabled: updatedConfig.adsCarouselEnabled,
        adsClientId: updatedConfig.adsClientId,
        adsCarouselSlot: updatedConfig.adsCarouselSlot,
      },
    });
  } catch (error) {
    console.error('❌ Update ads config error:', error);
    res.status(500).json({ success: false, error: 'Failed to update ads config' });
  }
});

/**
 * POST /api/rovex/admin/reset-config
 * Reset community configuration to defaults (Rovex template)
 * ADMIN only - use this to restore template after testing
 */
router.post('/admin/reset-config', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    console.log('[Admin] Resetting community config to defaults...');
    
    // Delete the community_config to restore defaults
    await prisma.systemConfig.deleteMany({
      where: { key: 'community_config' },
    });
    
    console.log('[Admin] ✅ Community config reset to defaults');
    
    res.json({
      success: true,
      message: 'Community configuration reset to defaults',
      instructions: 'Refresh the page to see the changes',
    });
  } catch (error) {
    console.error('❌ Reset config error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset config' });
  }
});

/**
 * GET /api/rovex/admin/community-config
 * Get current community configuration for admin panel
 */
router.get('/admin/community-config', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const configRecord = await prisma.systemConfig.findUnique({
      where: { key: 'community_config' },
    });
    
    const savedConfig = configRecord?.value ? JSON.parse(configRecord.value) : null;
    
    res.json({
      success: true,
      hasCustomConfig: !!savedConfig,
      config: savedConfig,
      defaults: {
        id: 'magazine-srt',
        subdomain: 'magazine-srt',
        name: 'Rovex Communities',
        tierVipName: 'MAGAZINE',
        tierStdName: 'ROVEX',
        currencyName: 'Zions',
      },
    });
  } catch (error) {
    console.error('❌ Get community config error:', error);
    res.status(500).json({ success: false, error: 'Failed to get config' });
  }
});

// =====================================
// ROTAS PROTEGIDAS (requerem ROVEX_API_SECRET)
// =====================================

// Aplicar middleware de autenticação nas rotas abaixo
router.use(validateRovexSecret);

/**
 * Feature Requirements by Plan
 * Based on MAGAZINE_FEATURES_CATALOG.md
 * 
 * 🆓 FREE - Trial 14 dias
 * 🟢 STARTER - R$ 247/mês
 * 🟡 GROWTH - R$ 597/mês
 * 🔴 ENTERPRISE - R$ 1.497/mês
 */
const FEATURE_REQUIREMENTS: Record<string, string> = {
  // ============== AUTH & USERS (FREE) ==============
  'auth.register': 'FREE',
  'auth.login': 'FREE',
  'auth.email_verification': 'FREE',
  'auth.password_recovery': 'FREE',
  'auth.google_oauth': 'GROWTH',
  
  'user.profile': 'FREE',
  'user.avatar_upload': 'STARTER',
  'user.levels': 'FREE',
  'user.friends': 'FREE',
  'user.online_status': 'FREE',
  'user.do_not_disturb': 'STARTER',
  'user.session_security': 'STARTER',
  'user.verified_badge': 'GROWTH',
  'user.lite_mode': 'FREE',
  'user.dual_membership': 'STARTER',
  
  // ============== FEED & CONTENT ==============
  'feed.view': 'FREE',
  'feed.create_post': 'FREE',
  'feed.image_upload': 'STARTER',
  'feed.video_upload': 'GROWTH',
  'feed.likes': 'FREE',
  'feed.comments': 'FREE',
  'feed.highlights': 'STARTER',
  'feed.product_link': 'GROWTH',
  'feed.visibility_control': 'STARTER',
  'feed.reports': 'FREE',
  
  // ============== STORIES ==============
  'stories.create': 'FREE',
  'stories.view': 'FREE',
  'stories.expiration': 'FREE',
  'stories.view_count': 'STARTER',
  'stories.editor': 'GROWTH',
  'stories.dm_reply': 'STARTER',
  
  // ============== GAMIFICATION ==============
  'gamification.xp': 'FREE',
  'gamification.zions_points': 'FREE',
  'gamification.zions_cash': 'GROWTH',
  'gamification.xp_rewards': 'FREE',
  'gamification.level_up': 'FREE',
  'gamification.level_timeline': 'STARTER',
  'gamification.daily_bonus': 'FREE',
  'gamification.streaks': 'FREE',
  'gamification.badges': 'FREE',
  'gamification.badge_display': 'FREE',
  'gamification.equipped_badge': 'STARTER',
  'gamification.trophies': 'FREE',
  
  // ============== RANKING ==============
  'ranking.global': 'FREE',
  'ranking.page': 'FREE',
  'ranking.modal': 'FREE',
  'ranking.top3': 'FREE',
  'ranking.by_period': 'GROWTH',
  
  // ============== ECONOMY ==============
  'economy.wallet': 'FREE',
  'economy.history': 'FREE',
  'economy.buy_zions': 'GROWTH',
  'economy.withdraw': 'ENTERPRISE',
  'economy.conversion': 'GROWTH',
  
  // ============== SUPPLY BOX ==============
  'supply_box.system': 'STARTER',
  'supply_box.free_daily': 'STARTER',
  'supply_box.progressive_price': 'STARTER',
  'supply_box.rarities': 'STARTER',
  'supply_box.duplicate_compensation': 'STARTER',
  'supply_box.animation': 'STARTER',
  
  // ============== MARKETPLACE P2P ==============
  'market.list_item': 'GROWTH',
  'market.buy_item': 'GROWTH',
  'market.cancel_listing': 'GROWTH',
  'market.history': 'GROWTH',
  'market.fees': 'GROWTH',
  'market.filters': 'GROWTH',
  'market.stats': 'GROWTH',
  
  // ============== PRODUCT STORE ==============
  'store.view': 'STARTER',
  'store.game_keys': 'GROWTH',
  'store.gift_cards': 'GROWTH',
  'store.subscriptions': 'ENTERPRISE',
  'store.digital_items': 'GROWTH',
  'store.key_management': 'GROWTH',
  'store.vip_discount': 'STARTER',
  'store.pay_zions': 'STARTER',
  'store.pay_pix': 'GROWTH',
  'store.pay_card': 'ENTERPRISE',
  
  // ============== CUSTOMIZATION ==============
  'customization.shop': 'STARTER',
  'customization.backgrounds': 'STARTER',
  'customization.colors': 'STARTER',
  'customization.badge_frames': 'STARTER',
  'customization.theme_packs': 'GROWTH',
  'customization.equip': 'STARTER',
  'customization.inventory': 'STARTER',
  'customization.preview': 'STARTER',
  
  // ============== CHAT & MESSAGES ==============
  'chat.dm': 'FREE',
  'chat.realtime': 'FREE',
  'chat.history': 'FREE',
  'chat.read_receipts': 'STARTER',
  'chat.window': 'FREE',
  'chat.notifications': 'FREE',
  'chat.image_upload': 'STARTER',
  
  // ============== GROUPS ==============
  'groups.create': 'STARTER',
  'groups.private': 'STARTER',
  'groups.roles': 'STARTER',
  'groups.invites': 'STARTER',
  'groups.messages': 'STARTER',
  'groups.settings': 'STARTER',
  'groups.avatar': 'STARTER',
  'groups.background': 'GROWTH',
  'groups.nsfw': 'GROWTH',
  'groups.mute': 'STARTER',
  
  // ============== NOTIFICATIONS ==============
  'notifications.inapp': 'FREE',
  'notifications.likes': 'FREE',
  'notifications.comments': 'FREE',
  'notifications.badges': 'FREE',
  'notifications.friends': 'FREE',
  'notifications.messages': 'FREE',
  'notifications.groups': 'STARTER',
  'notifications.system': 'FREE',
  
  // ============== SOCIAL INTEGRATIONS ==============
  'social.discord': 'STARTER',
  'social.discord_status': 'STARTER',
  'social.discord_guilds': 'GROWTH',
  'social.steam': 'STARTER',
  'social.steam_games': 'GROWTH',
  'social.steam_friends': 'GROWTH',
  'social.twitch': 'GROWTH',
  'social.twitch_live': 'GROWTH',
  'social.twitch_follows': 'GROWTH',
  'social.activity_log': 'GROWTH',
  
  // ============== ADMIN PANEL ==============
  'admin.dashboard': 'STARTER',
  'admin.grid_dashboard': 'GROWTH',
  'admin.user_management': 'STARTER',
  'admin.toggle_membership': 'STARTER',
  'admin.ban_user': 'STARTER',
  'admin.reset_password': 'STARTER',
  'admin.official_posts': 'STARTER',
  'admin.announcements': 'STARTER',
  'admin.events': 'STARTER',
  'admin.rewards': 'STARTER',
  'admin.badge_management': 'GROWTH',
  'admin.approve_invites': 'STARTER',
  'admin.manage_reports': 'STARTER',
  'admin.approve_withdrawals': 'ENTERPRISE',
  'admin.feedbacks': 'STARTER',
  'admin.dev_tools': 'ENTERPRISE',
  
  // ============== PHOTO CATALOG ==============
  'catalog.view': 'STARTER',
  'catalog.upload': 'STARTER',
  'catalog.categories': 'STARTER',
  'catalog.favorites': 'STARTER',
  'catalog.visibility': 'STARTER',
  
  // ============== ANALYTICS ==============
  'analytics.basic': 'STARTER',
  'analytics.active_users': 'STARTER',
  'analytics.online_now': 'STARTER',
  'analytics.counters': 'STARTER',
  'analytics.market_stats': 'GROWTH',
  'analytics.revenue': 'ENTERPRISE',
  'analytics.api': 'ENTERPRISE',
  
  // ============== UI/UX ==============
  'ui.dark_mode': 'FREE',
  'ui.light_mode': 'FREE',
  'ui.responsive': 'FREE',
  'ui.mobile_carousel': 'FREE',
  'ui.glassmorphism': 'FREE',
  'ui.animations': 'FREE',
  'ui.loading_screen': 'FREE',
  'ui.welcome_tour': 'STARTER',
  'ui.search': 'FREE',
  'ui.confetti': 'FREE',
  'ui.toasts': 'FREE',
  'ui.image_crop': 'STARTER',
  
  // ============== TECHNICAL ==============
  'tech.jwt': 'FREE',
  'tech.session_token': 'STARTER',
  'tech.cloudinary': 'STARTER',
  'tech.cloudflare_r2': 'GROWTH',
  'tech.email': 'FREE',
  'tech.cron_jobs': 'STARTER',
  'tech.rate_limiting': 'STARTER',
  
  // ============== ROVEX INTEGRATION ==============
  'rovex.health': 'STARTER',
  'rovex.metrics': 'STARTER',
  'rovex.config': 'STARTER',
  'rovex.webhooks': 'STARTER',
  'rovex.auto_report': 'STARTER',
  
  // ============== ENTERPRISE EXCLUSIVES ==============
  'enterprise.white_label': 'ENTERPRISE',
  'enterprise.sso': 'ENTERPRISE',
  'enterprise.custom_domain': 'ENTERPRISE',
  'enterprise.unlimited_storage': 'ENTERPRISE',
  'enterprise.priority_support': 'ENTERPRISE',
  'enterprise.sla': 'ENTERPRISE',
};

const PLAN_HIERARCHY = ['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'];

/**
 * GET /api/rovex/health
 * Retorna status de saúde da comunidade
 * Usado pela Rovex para monitorar se a comunidade está online
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Testar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      database: true,
      cache: true, // Sem Redis por enquanto
      version: process.env.APP_VERSION || '0.4.2',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('❌ Rovex health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: false,
      cache: false,
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

/**
 * GET /api/rovex/features
 * Retorna lista de features e seus requisitos de plano
 */
router.get('/features', async (req: Request, res: Response) => {
  try {
    // Buscar plano atual da comunidade
    let currentPlan = 'FREE';
    try {
      const configRecord = await prisma.systemConfig.findUnique({
        where: { key: 'community_config' },
      });
      if (configRecord?.value) {
        const config = JSON.parse(configRecord.value) as { plan?: string };
        currentPlan = config.plan || 'FREE';
      }
    } catch {
      // Use default
    }
    
    const currentPlanIndex = PLAN_HIERARCHY.indexOf(currentPlan);
    
    // Calcular quais features estão disponíveis
    const features = Object.entries(FEATURE_REQUIREMENTS).map(([feature, requiredPlan]) => {
      const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
      return {
        feature,
        requiredPlan,
        available: currentPlanIndex >= requiredIndex,
      };
    });
    
    const availableFeatures = features.filter(f => f.available).map(f => f.feature);
    const lockedFeatures = features.filter(f => !f.available).map(f => ({ 
      feature: f.feature, 
      requiredPlan: f.requiredPlan 
    }));
    
    res.json({
      success: true,
      currentPlan,
      allFeatures: FEATURE_REQUIREMENTS,
      availableFeatures,
      lockedFeatures,
    });
  } catch (error) {
    console.error('❌ Features endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get features',
    });
  }
});

/**
 * GET /api/rovex/metrics
 * Retorna métricas da comunidade para o dashboard da Rovex
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      totalUsers,
      activeUsers24h,
      newUsersLast7Days,
      totalPosts,
      postsToday,
      totalTransactions,
    ] = await Promise.all([
      prisma.user.count({
        where: { deletedAt: null }
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          lastSeenAt: { gte: last24h }
        }
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: last7Days }
        }
      }),
      prisma.post.count(),
      prisma.post.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      prisma.zionHistory.count(), // Histórico de transações de Zions
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers24h,
        totalPosts,
        totalTransactions,
        storageUsedMB: 0, // TODO: Calcular se necessário (Cloudinary/R2)
        lastActivity: new Date().toISOString(),
      },
      // Formato detalhado (novo)
      users: {
        total: totalUsers,
        active24h: activeUsers24h,
        newLast7Days: newUsersLast7Days,
      },
      content: {
        totalPosts,
        postsToday,
      },
      engagement: {
        totalTransactions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Rovex metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
    });
  }
});

/**
 * GET /api/rovex/config
 * Retorna configurações da comunidade para o dashboard da Rovex
 * Busca do banco se disponível, senão usa defaults
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    // Tenta buscar config do banco
    let savedConfig = null;
    try {
      const configRecord = await prisma.systemConfig.findUnique({
        where: { key: 'community_config' },
      });
      if (configRecord?.value) {
        savedConfig = JSON.parse(configRecord.value);
      }
    } catch {
      // Tabela pode não existir ainda
    }
    
    // Mescla config salva com defaults
    const config = {
      id: savedConfig?.id || 'magazine-srt',
      subdomain: savedConfig?.subdomain || 'magazine-srt',
      name: savedConfig?.name || 'Rovex Communities',
      slogan: savedConfig?.slogan || 'Sua comunidade gamificada',
      primaryColor: savedConfig?.primaryColor || '#d4af37',
      secondaryColor: savedConfig?.secondaryColor || '#7C3AED',
      accentColor: savedConfig?.accentColor || '#8B5CF6',
      tierVipName: savedConfig?.tierVipName || 'MAGAZINE',
      tierVipColor: savedConfig?.tierVipColor || '#d4af37',
      tierVipSlogan: savedConfig?.tierVipSlogan || 'A Elite do Sucesso',
      tierStdName: savedConfig?.tierStdName || 'ROVEX',
      tierStdSlogan: savedConfig?.tierStdSlogan || 'Velocidade e Poder',
      backgroundColor: savedConfig?.backgroundColor || '#8B5CF6',
      currencyName: savedConfig?.currencyName || 'Zions',
      currencySymbol: savedConfig?.currencySymbol || 'Z$',
      plan: savedConfig?.plan || process.env.COMMUNITY_PLAN || 'ENTERPRISE',
      isWhiteLabel: savedConfig?.isWhiteLabel || false,
      maintenanceMode: savedConfig?.maintenanceMode || false,
    };
    
    res.json({
      success: true,
      config,
      // Formato legado para compatibilidade
      community: {
        name: config.name,
        currency: config.currencyName,
        currencySymbol: config.currencySymbol,
        tiers: [
          { name: config.tierStdName, type: 'standard', color: config.backgroundColor },
          { name: config.tierVipName, type: 'vip', color: config.tierVipColor },
        ],
      },
      features: {
        gamification: true,
        leaderboard: true,
        achievements: true,
        supplyBox: true,
        marketplace: true,
        groups: true,
        socialIntegrations: ['discord', 'steam', 'twitch'],
      },
      version: process.env.APP_VERSION || '0.4.3',
    });
  } catch (error) {
    console.error('❌ Rovex config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch config',
    });
  }
});

/**
 * POST /api/rovex/config
 * Recebe atualizações de configuração da Rovex (sync button)
 * Alias para PUT - alguns clientes preferem POST
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    console.log('📦 Config sync received from Rovex (POST):', JSON.stringify(payload, null, 2));
    
    // Buscar config existente
    let existingConfig: Record<string, unknown> = {};
    try {
      const configRecord = await prisma.systemConfig.findUnique({
        where: { key: 'community_config' },
      });
      if (configRecord?.value) {
        existingConfig = JSON.parse(configRecord.value) as Record<string, unknown>;
      }
    } catch {
      // Tabela pode não existir
    }
    
    // Mesclar com novas configurações
    const newConfig: Record<string, unknown> = {
      ...existingConfig,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    
    // Converter payload legado para novo formato
    if (payload.tiers) {
      newConfig.tierVipName = payload.tiers.vip?.name || newConfig.tierVipName;
      newConfig.tierVipColor = payload.tiers.vip?.color || newConfig.tierVipColor;
      newConfig.tierStdName = payload.tiers.std?.name || newConfig.tierStdName;
      newConfig.backgroundColor = payload.tiers.std?.color || newConfig.backgroundColor;
    }
    if (payload.currency) {
      newConfig.currencyName = payload.currency.name || newConfig.currencyName;
      newConfig.currencySymbol = payload.currency.symbol || newConfig.currencySymbol;
    }
    if (payload.theme) {
      newConfig.primaryColor = payload.theme.primary || newConfig.primaryColor;
      newConfig.secondaryColor = payload.theme.secondary || newConfig.secondaryColor;
    }
    
    // Salvar no banco
    await prisma.systemConfig.upsert({
      where: { key: 'community_config' },
      update: { value: JSON.stringify(newConfig) },
      create: { key: 'community_config', value: JSON.stringify(newConfig) },
    });
    
    console.log('✅ Config synced successfully');
    
    res.json({
      success: true,
      message: 'Configuration synced successfully',
      config: newConfig,
    });
  } catch (error) {
    console.error('❌ Rovex config sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync configuration',
    });
  }
});

/**
 * PUT /api/rovex/config
 * Recebe atualizações de configuração da Rovex (provisioning)
 * Salva no banco para persistência
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    console.log('📦 Config update received from Rovex:', JSON.stringify(payload, null, 2));
    
    // Buscar config existente
    let existingConfig = {};
    try {
      const configRecord = await prisma.systemConfig.findUnique({
        where: { key: 'community_config' },
      });
      if (configRecord?.value) {
        existingConfig = JSON.parse(configRecord.value);
      }
    } catch {
      // Tabela pode não existir
    }
    
    // Mesclar com novas configurações
    const newConfig = {
      ...existingConfig,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    
    // Converter payload legado para novo formato
    if (payload.tiers) {
      newConfig.tierVipName = payload.tiers.vip?.name || newConfig.tierVipName;
      newConfig.tierVipColor = payload.tiers.vip?.color || newConfig.tierVipColor;
      newConfig.tierStdName = payload.tiers.std?.name || newConfig.tierStdName;
      newConfig.backgroundColor = payload.tiers.std?.color || newConfig.backgroundColor;
    }
    if (payload.currency) {
      newConfig.currencyName = payload.currency.name || newConfig.currencyName;
      newConfig.currencySymbol = payload.currency.symbol || newConfig.currencySymbol;
    }
    if (payload.theme) {
      newConfig.primaryColor = payload.theme.primary || newConfig.primaryColor;
      newConfig.secondaryColor = payload.theme.secondary || newConfig.secondaryColor;
    }
    
    // Salvar no banco
    try {
      await prisma.systemConfig.upsert({
        where: { key: 'community_config' },
        update: { value: JSON.stringify(newConfig) },
        create: { key: 'community_config', value: JSON.stringify(newConfig) },
      });
      console.log('✅ Config saved to database');
    } catch (dbError) {
      console.warn('⚠️ Could not persist config to database:', dbError);
      // Continua mesmo sem persistir (dev mode)
    }
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: newConfig,
    });
  } catch (error) {
    console.error('❌ Rovex config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
    });
  }
});

/**
 * PUT /api/rovex/plan
 * Atualiza o plano da comunidade (upgrade/downgrade)
 */
router.put('/plan', async (req: Request, res: Response) => {
  try {
    const { plan, effectiveAt, features } = req.body;
    
    const validPlans = ['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: `Invalid plan. Must be one of: ${validPlans.join(', ')}`,
      });
    }
    
    console.log(`📈 Plan update: ${plan} (effective: ${effectiveAt || 'immediately'})`);
    
    // Buscar config atual
    let currentConfig: Record<string, unknown> = {};
    try {
      const configRecord = await prisma.systemConfig.findUnique({
        where: { key: 'community_config' },
      });
      if (configRecord?.value) {
        currentConfig = JSON.parse(configRecord.value) as Record<string, unknown>;
      }
    } catch {
      // Use defaults
    }
    
    // Atualizar plano
    const updatedConfig = {
      ...currentConfig,
      plan,
      features: features || currentConfig.features,
      planUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await prisma.systemConfig.upsert({
      where: { key: 'community_config' },
      update: { value: JSON.stringify(updatedConfig) },
      create: { key: 'community_config', value: JSON.stringify(updatedConfig) },
    });
    
    console.log(`✅ Plan updated to ${plan}`);
    
    res.json({
      success: true,
      message: `Plan updated to ${plan}`,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('❌ Plan update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update plan',
    });
  }
});

/**
 * POST /api/rovex/webhook
 * Recebe eventos da Rovex (suspensão, reativação, etc)
 * Com verificação de assinatura HMAC-SHA256
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Obter headers de autenticação
    const signature = req.headers['x-rovex-signature'] as string | undefined;
    const timestamp = req.headers['x-rovex-timestamp'] as string | undefined;
    const eventHeader = req.headers['x-rovex-event'] as string | undefined;
    
    // Verificar headers obrigatórios
    if (!signature || !timestamp) {
      console.warn('[Webhook] Missing required headers (signature/timestamp)');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required headers' 
      });
    }
    
    // Verificar timestamp (não aceitar webhooks com mais de 5 minutos)
    const timestampMs = parseInt(timestamp);
    if (isNaN(timestampMs) || Date.now() - timestampMs > 5 * 60 * 1000) {
      console.warn('[Webhook] Timestamp too old or invalid:', timestamp);
      return res.status(401).json({ 
        success: false, 
        error: 'Timestamp too old' 
      });
    }
    
    // Verificar assinatura HMAC-SHA256
    const secret = process.env.ROVEX_API_SECRET;
    if (secret) {
      const rawBody = JSON.stringify(req.body);
      const isValid = verifyRovexSignature(signature, timestamp, rawBody, secret);
      
      if (!isValid) {
        console.warn('[Webhook] Invalid signature');
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid signature' 
        });
      }
    }
    
    // Extrair evento e payload
    const { event: bodyEvent, payload, data } = req.body;
    const event = eventHeader || bodyEvent;
    const eventData = payload || data;
    
    console.log(`📨 Rovex webhook received: ${event}`, eventData);
    
    try {
      switch (event) {
        // ============== PLAN EVENTS ==============
        case 'plan.upgraded':
        case 'plan.downgraded': {
          const { oldPlan, newPlan, effectiveAt } = eventData;
          console.log(`📈 Plan changed: ${oldPlan} → ${newPlan}`);
          await updateFeatureFlags(newPlan);
          // Notificar admins se necessário
          break;
        }
        
        // ============== SUSPENSION EVENTS ==============
        case 'community.suspended': {
          const { reason, suspendedAt, suspendedUntil } = eventData;
          console.warn(`⚠️ Community suspended: ${reason}`);
          await setSuspensionState({
            suspended: true,
            reason: reason || 'manual',
            suspendedAt: suspendedAt || new Date().toISOString(),
            suspendedUntil: suspendedUntil || null,
          });
          invalidateSuspensionCache();
          break;
        }
        
        case 'community.activated':
        case 'community.reactivated': {
          console.log('✅ Community reactivated');
          await setSuspensionState({
            suspended: false,
            reason: null,
            suspendedAt: null,
            suspendedUntil: null,
          });
          invalidateSuspensionCache();
          break;
        }
        
        case 'community.deleted': {
          console.error('🚨 Community marked as deleted');
          await setDeletionState(true);
          break;
        }
        
        // ============== BILLING EVENTS ==============
        case 'billing.success': {
          const { amount, currency, invoiceId } = eventData;
          console.log(`💰 Payment received: ${currency} ${amount} (Invoice: ${invoiceId})`);
          // Log interno ou notificar admin
          break;
        }
        
        case 'billing.failed': {
          const { amount, reason: failReason, failedAt } = eventData;
          console.error(`❌ Payment failed: ${failReason}`);
          // Alertar admin via notificação
          break;
        }
        
        // ============== CONFIG EVENTS ==============
        case 'config.updated': {
          const { changedFields } = eventData;
          console.log('📝 Config updated via Rovex:', changedFields);
          // Invalidar cache de configuração se necessário
          break;
        }
        
        case 'branding.updated': {
          const { changes } = eventData;
          console.log('🎨 Branding updated:', changes);
          await updateBranding(changes);
          break;
        }
        
        case 'quotas.updated': {
          const { quotas } = eventData;
          console.log('📊 Quotas updated:', quotas);
          await setQuotaLimits(quotas);
          break;
        }
        
        // ============== DOMAIN EVENTS ==============
        case 'domain.added': {
          const { domain } = eventData;
          console.log(`🌐 Domain added: ${domain}`);
          // Configurar novo domínio se necessário
          break;
        }
        
        case 'domain.removed': {
          const { domain } = eventData;
          console.log(`🗑️ Domain removed: ${domain}`);
          break;
        }
        
        case 'domain.verified': {
          const { domain } = eventData;
          console.log(`✅ Domain verified: ${domain}`);
          break;
        }
        
        // ============== ALERT EVENTS ==============
        case 'alert.triggered': {
          const { alertType, message } = eventData;
          console.warn(`🚨 Alert triggered: ${alertType} - ${message}`);
          break;
        }
        
        // ============== LEGACY EVENTS ==============
        case 'community.plan_changed': {
          const { newPlan } = eventData;
          console.log(`📊 Plan changed via legacy event: ${newPlan}`);
          await updateFeatureFlags(newPlan);
          break;
        }
        
        default:
          console.log(`❓ Unknown Rovex event: ${event}`);
      }
      
      res.json({ 
        success: true, 
        received: true, 
        event,
        processedAt: new Date().toISOString()
      });
    } catch (handlerError) {
      console.error(`[Webhook] Error handling ${event}:`, handlerError);
      // Retornar sucesso mesmo com erro interno para evitar retries infinitos
      res.json({ 
        success: true, 
        received: true, 
        event,
        warning: 'Internal processing error'
      });
    }
  } catch (error) {
    console.error('❌ Rovex webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Webhook processing failed' 
    });
  }
});

/**
 * POST /api/rovex/report-metrics
 * Endpoint para forçar envio de métricas para a Rovex (manual trigger)
 */
router.post('/report-metrics', async (req: Request, res: Response) => {
  try {
    if (!isRovexConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Rovex integration not configured',
      });
    }

    const success = await reportMetricsToRovex();
    
    res.json({
      success,
      message: success ? 'Metrics reported successfully' : 'Failed to report metrics',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Manual metrics report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report metrics',
    });
  }
});

/**
 * GET /api/rovex/connection-test
 * Testa conexão com a plataforma Rovex
 */
router.get('/connection-test', async (req: Request, res: Response) => {
  try {
    const result = await testRovexConnection();
    res.json({
      success: result.connected,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Connection test error:', error);
    res.status(500).json({
      success: false,
      configured: false,
      connected: false,
      error: 'Test failed',
    });
  }
});

// ===================== PIX SELLER REQUESTS (Rovex reviews) =====================

/**
 * GET /api/rovex/pix-requests
 * Get all PIX seller requests for review
 */
router.get('/pix-requests', getRovexPixRequests);

/**
 * POST /api/rovex/pix-requests/:requestId/review
 * Approve or reject a PIX seller request
 * Body: { action: 'approve' | 'reject', reviewNote?: string }
 */
router.post('/pix-requests/:requestId/review', reviewPixRequest);

// ===================== ADMIN ACTION REQUESTS (Requires Rovex approval) =====================

/**
 * POST /api/rovex/action-request
 * Submit a critical action request for Rovex approval
 * Body: { action: 'RESET_ZIONS' | string, reason: string, requestedBy?: string }
 */
router.post('/action-request', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { action, reason, requestedBy } = req.body;

    if (!action || !reason) {
      return res.status(400).json({ error: 'action and reason are required' });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    // Create the action request record
    const actionRequest = await prisma.systemConfig.create({
      data: {
        key: `action_request_${Date.now()}`,
        value: JSON.stringify({
          action,
          reason,
          requestedBy: requestedBy || user?.name || user?.email,
          userId,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        })
      }
    });

    // Report to Rovex platform (if configured)
    try {
      await reportEvent('ADMIN_ACTION_REQUEST', {
        requestId: actionRequest.key,
        action,
        reason,
        requestedBy: requestedBy || user?.name || user?.email,
        userId,
      });
    } catch (e) {
      console.debug('[Rovex] Could not report action request event');
    }

    // Create notification for admins
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        content: JSON.stringify({
          title: '📋 Solicitação Enviada',
          text: `Sua solicitação de "${action}" foi enviada para aprovação da Rovex.`,
          action,
        })
      }
    });

    console.log(`[Rovex] 📋 Admin action request submitted: ${action} by ${requestedBy || user?.name}`);

    res.json({
      success: true,
      message: 'Solicitação enviada para aprovação da Rovex',
      requestId: actionRequest.key,
    });
  } catch (error) {
    console.error('[Rovex] Action request error:', error);
    res.status(500).json({ error: 'Failed to submit action request' });
  }
});

/**
 * GET /api/rovex/action-requests
 * Get all pending action requests (for Rovex dashboard)
 */
router.get('/action-requests', async (req: Request, res: Response) => {
  try {
    const requests = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: 'action_request_' }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const parsedRequests = requests.map(r => ({
      id: r.key,
      key: r.key,
      ...JSON.parse(r.value),
    }));

    res.json(parsedRequests);
  } catch (error) {
    console.error('[Rovex] Get action requests error:', error);
    res.status(500).json({ error: 'Failed to get action requests' });
  }
});

export default router;
