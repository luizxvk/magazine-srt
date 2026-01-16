import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { reportMetricsToRovex, testRovexConnection, isRovexConfigured } from '../services/rovexService';

const router = Router();

/**
 * Middleware para validar secret da Rovex Platform
 * Suporta dois formatos de autenticação:
 * 1. Header x-rovex-secret: <secret>
 * 2. Header Authorization: Bearer <secret>
 */
const validateRovexSecret = (req: Request, res: Response, next: NextFunction) => {
  const expectedSecret = process.env.ROVEX_API_SECRET;
  
  // Tentar obter secret do header x-rovex-secret (formato legado)
  let secret = req.headers['x-rovex-secret'] as string | undefined;
  
  // Se não encontrou, tentar Authorization: Bearer (formato novo)
  if (!secret) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      secret = authHeader.substring(7);
    }
  }
  
  if (!secret || secret !== expectedSecret) {
    console.warn('⚠️ Unauthorized Rovex request attempt');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Invalid Rovex secret' 
    });
  }
  
  next();
};

// Aplicar middleware em todas as rotas
router.use(validateRovexSecret);

// Feature requirements by plan
const FEATURE_REQUIREMENTS: Record<string, string> = {
  // Core features (FREE)
  'feed': 'FREE',
  'profile': 'FREE',
  'basic_customization': 'FREE',
  
  // STARTER features
  'groups': 'STARTER',
  'market': 'STARTER',
  'supply_box': 'STARTER',
  'badges': 'STARTER',
  'daily_login': 'STARTER',
  
  // GROWTH features
  'analytics': 'GROWTH',
  'custom_themes': 'GROWTH',
  'api_access': 'GROWTH',
  'export_data': 'GROWTH',
  'advanced_gamification': 'GROWTH',
  
  // ENTERPRISE features
  'white_label': 'ENTERPRISE',
  'sso_integration': 'ENTERPRISE',
  'priority_support': 'ENTERPRISE',
  'custom_domain': 'ENTERPRISE',
  'unlimited_storage': 'ENTERPRISE',
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
      name: savedConfig?.name || 'Magazine MGT',
      slogan: savedConfig?.slogan || 'A comunidade definitiva de games e entretenimento',
      primaryColor: savedConfig?.primaryColor || '#d4af37',
      secondaryColor: savedConfig?.secondaryColor || '#10b981',
      accentColor: savedConfig?.accentColor || '#f59e0b',
      tierVipName: savedConfig?.tierVipName || 'MAGAZINE',
      tierVipColor: savedConfig?.tierVipColor || '#d4af37',
      tierStdName: savedConfig?.tierStdName || 'MGT',
      tierStdColor: savedConfig?.tierStdColor || '#10b981',
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
          { name: config.tierStdName, type: 'standard', color: config.tierStdColor },
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
      newConfig.tierStdColor = payload.tiers.std?.color || newConfig.tierStdColor;
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
 * POST /api/rovex/provision
 * Provisiona uma nova comunidade ou atualiza configuração completa
 * Cria o admin user se fornecido
 */
router.post('/provision', async (req: Request, res: Response) => {
  try {
    const {
      communityName,
      subdomain,
      plan,
      tierVipName,
      tierVipColor,
      tierStdName,
      tierStdColor,
      currencyName,
      currencySymbol,
      primaryColor,
      secondaryColor,
      logoUrl,
      adminUser,
      features,
    } = req.body;
    
    console.log(`🚀 Provisioning community: ${communityName} (${subdomain})`);
    
    // Criar configuração completa
    const communityConfig = {
      communityName: communityName || 'Magazine MGT',
      communitySlug: subdomain || 'magazine-mgt',
      plan: plan || 'STARTER',
      tierVipName: tierVipName || 'MAGAZINE',
      tierVipColor: tierVipColor || '#d4af37',
      tierStdName: tierStdName || 'MGT',
      tierStdColor: tierStdColor || '#10b981',
      currencyName: currencyName || 'Zions',
      currencySymbol: currencySymbol || 'Z$',
      primaryColor: primaryColor || '#d4af37',
      secondaryColor: secondaryColor || '#10b981',
      logoUrl: logoUrl || null,
      features: features || {},
      provisionedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Salvar config no banco
    await prisma.systemConfig.upsert({
      where: { key: 'community_config' },
      update: { value: JSON.stringify(communityConfig) },
      create: { key: 'community_config', value: JSON.stringify(communityConfig) },
    });
    
    // Criar usuário admin se fornecido
    let adminResult = null;
    if (adminUser?.email && adminUser?.password) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(adminUser.password, 10);
      
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminUser.email },
      });
      
      if (existingAdmin) {
        // Atualizar para admin
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'ADMIN' },
        });
        adminResult = { userId: existingAdmin.id, action: 'updated' };
      } else {
        // Criar novo admin
        const newAdmin = await prisma.user.create({
          data: {
            email: adminUser.email,
            name: adminUser.name || adminUser.email.split('@')[0],
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
        adminResult = { userId: newAdmin.id, action: 'created' };
      }
    }
    
    console.log(`✅ Community provisioned successfully`);
    
    res.json({
      success: true,
      message: 'Community provisioned successfully',
      config: communityConfig,
      adminUser: adminResult,
    });
  } catch (error) {
    console.error('❌ Provisioning error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provision community',
      details: error instanceof Error ? error.message : 'Unknown error',
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
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { event, data, timestamp } = req.body;
    
    console.log(`📨 Rovex webhook received: ${event}`, data);
    
    switch (event) {
      case 'community.suspended':
        // TODO: Lidar com suspensão da comunidade
        // Pode ser: bloquear logins, mostrar mensagem de manutenção, etc
        console.warn('⚠️ Community suspended by Rovex:', data?.reason);
        break;
      case 'community.reactivated':
        // TODO: Lidar com reativação
        console.log('✅ Community reactivated by Rovex');
        break;
      case 'community.plan_changed':
        // Mudança de plano (STARTER, GROWTH, ENTERPRISE)
        console.log('📊 Plan changed via Rovex:', data?.newPlan);
        break;
      case 'config.updated':
        // Config foi atualizada no painel Rovex
        console.log('📝 Config updated via Rovex:', data);
        break;
      case 'alert.triggered':
        // Alertas de uso (ex: limite de usuários próximo)
        console.warn('🚨 Alert triggered by Rovex:', data?.alertType, data?.message);
        break;
      default:
        console.log(`❓ Unknown Rovex event: ${event}`);
    }
    
    res.json({ success: true, received: true });
  } catch (error) {
    console.error('❌ Rovex webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
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

export default router;
