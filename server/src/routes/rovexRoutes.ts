import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

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
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      community: {
        name: 'Magazine SRT',
        currency: 'Zions',
        currencySymbol: 'Z$',
        tiers: [
          { name: 'MGT', type: 'standard', color: '#10b981' },
          { name: 'MAGAZINE', type: 'vip', color: '#d4af37' },
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
      version: process.env.APP_VERSION || '0.4.2',
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
 * Recebe atualizações de configuração da Rovex
 * (tiers, cores, moeda virtual, etc)
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    
    console.log('📦 Config update received from Rovex:', JSON.stringify(config, null, 2));
    
    // TODO: Implemente a lógica para salvar as configurações
    // Por enquanto, apenas logamos e confirmamos recebimento
    // Estrutura esperada do config:
    // {
    //   tiers: { vip: { name: 'MAGAZINE', color: '#d4af37' }, std: { name: 'MGT', color: '#10b981' } },
    //   currency: { name: 'Zions', symbol: 'Z$' },
    //   theme: { primary: '#d4af37', secondary: '#10b981' }
    // }
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
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

export default router;
