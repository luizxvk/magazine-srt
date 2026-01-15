// ============================================
// ROVEX INTEGRATION SERVICE
// Reporta métricas do Magazine para a plataforma Rovex
// ============================================

import prisma from '../utils/prisma';

const ROVEX_API_URL = process.env.ROVEX_API_URL;
const ROVEX_API_SECRET = process.env.ROVEX_API_SECRET;

interface RovexMetrics {
  totalUsers: number;
  activeUsers24h: number;
  totalPosts: number;
  postsToday: number;
  onlineNow: number;
  totalMessages: number;
  totalStories: number;
  totalComments: number;
  reportedAt: string;
}

interface RovexCommunityConfig {
  id: string;
  name: string;
  subdomain: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  plan: string;
  status: string;
  config: {
    tierVip: string;
    tierDefault: string;
    virtualCurrency: string;
  };
}

/**
 * Verifica se a integração com Rovex está configurada
 */
export function isRovexConfigured(): boolean {
  return Boolean(ROVEX_API_URL && ROVEX_API_SECRET);
}

/**
 * Coleta métricas do banco de dados do Magazine
 */
async function collectMetrics(): Promise<RovexMetrics> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last5min = new Date(Date.now() - 5 * 60 * 1000);

  const [
    totalUsers,
    activeUsers24h,
    totalPosts,
    postsToday,
    onlineNow,
    totalMessages,
    totalStories,
    totalComments,
  ] = await Promise.all([
    // Total de usuários (excluindo deletados)
    prisma.user.count({
      where: { deletedAt: null }
    }),
    
    // Usuários ativos nas últimas 24h
    prisma.user.count({ 
      where: { 
        deletedAt: null,
        lastSeenAt: { gte: last24h } 
      } 
    }),
    
    // Total de posts
    prisma.post.count({
      where: { isRemoved: false }
    }),
    
    // Posts criados hoje
    prisma.post.count({ 
      where: { 
        isRemoved: false,
        createdAt: { gte: todayStart } 
      } 
    }),
    
    // Usuários online agora (últimos 5 min)
    prisma.user.count({ 
      where: { 
        deletedAt: null,
        lastSeenAt: { gte: last5min } 
      } 
    }),
    
    // Total de mensagens
    prisma.message.count(),
    
    // Total de stories (não expirados ou todos?)
    prisma.story.count(),
    
    // Total de comentários
    prisma.comment.count(),
  ]);

  return {
    totalUsers,
    activeUsers24h,
    totalPosts,
    postsToday,
    onlineNow,
    totalMessages,
    totalStories,
    totalComments,
    reportedAt: new Date().toISOString(),
  };
}

/**
 * Reporta métricas do Magazine para a plataforma Rovex
 * Deve ser chamado periodicamente (ex: a cada 5 minutos)
 */
export async function reportMetricsToRovex(): Promise<boolean> {
  if (!ROVEX_API_URL || !ROVEX_API_SECRET) {
    console.warn('[Rovex] Integration not configured - missing ROVEX_API_URL or ROVEX_API_SECRET');
    return false;
  }

  try {
    const metrics = await collectMetrics();

    console.log('[Rovex] Reporting metrics:', JSON.stringify(metrics, null, 2));

    const response = await fetch(`${ROVEX_API_URL}/api/integration/report-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Rovex-Secret': ROVEX_API_SECRET,
      },
      body: JSON.stringify({ metrics }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Rovex] Failed to report metrics:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[Rovex] ✅ Metrics reported successfully:', result);
    return true;
  } catch (error) {
    console.error('[Rovex] ❌ Error reporting metrics:', error);
    return false;
  }
}

/**
 * Busca configurações da comunidade na Rovex
 * Útil para multi-tenant onde cada subdomain tem configs diferentes
 */
export async function getRovexCommunityConfig(subdomain: string): Promise<RovexCommunityConfig | null> {
  if (!ROVEX_API_URL) {
    console.warn('[Rovex] Integration not configured - missing ROVEX_API_URL');
    return null;
  }

  try {
    const response = await fetch(
      `${ROVEX_API_URL}/api/integration/public/community/${subdomain}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[Rovex] Failed to fetch community config:', response.status);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('[Rovex] Community not found:', subdomain);
      return null;
    }

    return result.data as RovexCommunityConfig;
  } catch (error) {
    console.error('[Rovex] Error fetching community config:', error);
    return null;
  }
}

/**
 * Envia um evento/webhook para a Rovex
 * Usado para notificar eventos importantes (ex: novo usuário VIP, erro crítico)
 */
export async function sendRovexWebhook(
  event: string, 
  data: Record<string, unknown>
): Promise<boolean> {
  if (!ROVEX_API_URL || !ROVEX_API_SECRET) {
    console.warn('[Rovex] Integration not configured');
    return false;
  }

  try {
    const response = await fetch(`${ROVEX_API_URL}/api/integration/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Rovex-Secret': ROVEX_API_SECRET,
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('[Rovex] Webhook failed:', response.status);
      return false;
    }

    console.log('[Rovex] ✅ Webhook sent:', event);
    return true;
  } catch (error) {
    console.error('[Rovex] ❌ Error sending webhook:', error);
    return false;
  }
}

/**
 * Testa a conexão com a Rovex Platform
 * Útil para debugging e health checks
 */
export async function testRovexConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  error?: string;
}> {
  if (!ROVEX_API_URL || !ROVEX_API_SECRET) {
    return { configured: false, connected: false, error: 'Missing env vars' };
  }

  try {
    const response = await fetch(`${ROVEX_API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { configured: true, connected: true };
    }

    return { 
      configured: true, 
      connected: false, 
      error: `HTTP ${response.status}` 
    };
  } catch (error) {
    return { 
      configured: true, 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
