# 🤖 Instruções para IA - Integração Magazine ↔ Rovex

> **Este arquivo é para ser copiado para o projeto Magazine e usado como instrução para a IA (Copilot/Claude) configurar a integração automaticamente.**

---

## 📋 Contexto do Projeto

Este Magazine faz parte da plataforma multi-tenant Rovex. A Rovex é a plataforma SaaS que gerencia múltiplas comunidades (sites Magazine), controlando:

- Limites de usuários por plano
- Cotas de storage e mídia
- Billing e pagamentos
- Analytics agregados
- Feature flags

**O Magazine precisa:**
1. Reportar métricas periodicamente para a Rovex
2. Expor endpoints para a Rovex verificar saúde e buscar dados
3. Receber atualizações de configuração da Rovex
4. Enviar webhooks de eventos importantes

---

## 🎯 Tarefas de Integração

Execute estas tarefas na ordem:

### Tarefa 1: Criar o Service de Integração

Crie o arquivo `src/services/rovex.service.ts` com o seguinte conteúdo:

```typescript
/**
 * Rovex Platform Integration Service
 * 
 * Este serviço conecta o Magazine com a plataforma Rovex para:
 * - Reportar métricas de uso (usuários, posts, storage)
 * - Receber configurações atualizadas
 * - Enviar webhooks de eventos
 */

import { prisma } from '@/lib/prisma';

const ROVEX_API_URL = process.env.ROVEX_API_URL || 'https://rovex-platform-production.up.railway.app';
const ROVEX_API_SECRET = process.env.ROVEX_API_SECRET || '';

export interface RovexMetrics {
  totalUsers: number;
  activeUsers24h: number;
  totalPosts: number;
  postsToday: number;
  onlineNow: number;
  totalMessages: number;
  totalStories: number;
  totalComments: number;
  storageUsedMB: number;
  tierBreakdown: {
    vip: number;
    standard: number;
  };
}

export interface RovexConfig {
  communityId: string;
  subdomain: string;
  name: string;
  plan: string;
  limits: {
    maxUsers: number;
    maxStorageMB: number;
    maxMediaMB: number;
    maxEmailsPerMonth: number;
  };
  features: {
    customDomain: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
  };
  theme: {
    primaryColor: string;
    tierNames: Record<string, string>;
  };
}

export class RovexIntegration {
  /**
   * Reporta métricas atuais para a plataforma Rovex
   */
  static async reportMetrics(): Promise<{ success: boolean; error?: string }> {
    try {
      const metrics = await this.collectMetrics();
      
      const response = await fetch(`${ROVEX_API_URL}/api/integration/report-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': ROVEX_API_SECRET,
        },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Rovex] Failed to report metrics:', error);
        return { success: false, error };
      }

      console.log('[Rovex] Metrics reported successfully');
      return { success: true };
    } catch (error) {
      console.error('[Rovex] Error reporting metrics:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Coleta métricas do banco de dados local
   * IMPORTANTE: Adapte as queries para o schema real do Magazine
   */
  static async collectMetrics(): Promise<RovexMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // TODO: Adapte estas queries para os modelos do seu Prisma schema
    const [
      totalUsers,
      activeUsers24h,
      totalPosts,
      postsToday,
      onlineNow,
      totalMessages,
      totalStories,
      totalComments,
      vipUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: yesterday } } }),
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: fiveMinutesAgo } } }),
      prisma.message?.count() ?? 0,
      prisma.story?.count() ?? 0,
      prisma.comment?.count() ?? 0,
      prisma.user.count({ where: { tier: 'VIP' } }),
    ]);

    // Storage: calcule baseado nos arquivos/mídia do seu sistema
    const storageUsedMB = await this.calculateStorageUsed();

    return {
      totalUsers,
      activeUsers24h,
      totalPosts,
      postsToday,
      onlineNow,
      totalMessages: totalMessages || 0,
      totalStories: totalStories || 0,
      totalComments: totalComments || 0,
      storageUsedMB,
      tierBreakdown: {
        vip: vipUsers,
        standard: totalUsers - vipUsers,
      },
    };
  }

  /**
   * Calcula storage usado em MB
   * TODO: Implemente baseado no seu sistema de arquivos
   */
  static async calculateStorageUsed(): Promise<number> {
    // Opção 1: Se você salva tamanho dos arquivos no banco
    // const result = await prisma.media.aggregate({ _sum: { sizeBytes: true } });
    // return (result._sum.sizeBytes || 0) / (1024 * 1024);
    
    // Opção 2: Buscar do Cloudinary/R2
    // return await getCloudinaryUsage();
    
    // Placeholder
    return 0;
  }

  /**
   * Busca configurações públicas da comunidade na Rovex
   */
  static async fetchConfig(subdomain: string): Promise<RovexConfig | null> {
    try {
      const response = await fetch(
        `${ROVEX_API_URL}/api/integration/public/community/${subdomain}`,
        {
          headers: { 'X-API-Secret': ROVEX_API_SECRET },
          next: { revalidate: 300 }, // Cache por 5 minutos
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.data as RovexConfig;
    } catch (error) {
      console.error('[Rovex] Error fetching config:', error);
      return null;
    }
  }

  /**
   * Retorna status de saúde do Magazine
   */
  static async getHealthStatus(): Promise<{
    status: 'ok' | 'degraded' | 'down';
    database: boolean;
    cache: boolean;
    version: string;
    uptime: number;
  }> {
    let dbOk = false;
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    return {
      status: dbOk ? 'ok' : 'degraded',
      database: dbOk,
      cache: true, // Adapte se usar Redis
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
    };
  }

  /**
   * Envia webhook para a Rovex
   */
  static async sendWebhook(
    event: string,
    payload: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const response = await fetch(`${ROVEX_API_URL}/api/webhooks/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': ROVEX_API_SECRET,
        },
        body: JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[Rovex] Webhook error:', error);
      return false;
    }
  }
}
```

---

### Tarefa 2: Criar Rotas da API

Crie o arquivo `src/app/api/rovex/[...path]/route.ts`:

```typescript
/**
 * Rovex Integration API Routes
 * 
 * Endpoints que a plataforma Rovex chama para:
 * - Verificar saúde do Magazine
 * - Buscar métricas
 * - Enviar atualizações de configuração
 */

import { NextRequest, NextResponse } from 'next/server';
import { RovexIntegration } from '@/services/rovex.service';

const ROVEX_API_SECRET = process.env.ROVEX_API_SECRET || '';

function validateSecret(request: NextRequest): boolean {
  const secret = request.headers.get('X-Rovex-Secret') || 
                 request.headers.get('X-API-Secret');
  return secret === ROVEX_API_SECRET;
}

function unauthorized() {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'Invalid API secret' },
    { status: 401 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  // Health check - público para monitoramento
  if (path === 'health') {
    const health = await RovexIntegration.getHealthStatus();
    return NextResponse.json(health);
  }

  // Rotas protegidas
  if (!validateSecret(request)) {
    return unauthorized();
  }

  if (path === 'metrics') {
    const metrics = await RovexIntegration.collectMetrics();
    return NextResponse.json({
      success: true,
      data: metrics,
      collectedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!validateSecret(request)) {
    return unauthorized();
  }

  const path = params.path.join('/');

  if (path === 'config') {
    try {
      const body = await request.json();
      
      // TODO: Processar atualização de configuração
      // Exemplos: atualizar limites, features, tema
      console.log('[Rovex] Config update received:', body);
      
      // Invalidar caches se necessário
      // revalidateTag('config');
      
      return NextResponse.json({
        success: true,
        message: 'Configuration updated',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

---

### Tarefa 3: Criar Cron Job

Crie o arquivo `src/app/api/cron/rovex/route.ts`:

```typescript
/**
 * Rovex Metrics Cron Job
 * 
 * Executa periodicamente para enviar métricas atualizadas
 * Configure no vercel.json: "schedule": "*/10 * * * *"
 */

import { NextRequest, NextResponse } from 'next/server';
import { RovexIntegration } from '@/services/rovex.service';

export async function GET(request: NextRequest) {
  // Validar que é chamada pelo Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting Rovex metrics sync...');
  
  const result = await RovexIntegration.reportMetrics();
  
  if (result.success) {
    console.log('[Cron] Metrics synced successfully');
    return NextResponse.json({
      success: true,
      message: 'Metrics synced to Rovex',
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error('[Cron] Failed to sync metrics:', result.error);
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }
}
```

---

### Tarefa 4: Configurar Vercel Cron

Adicione ao `vercel.json` na raiz do projeto:

```json
{
  "crons": [
    {
      "path": "/api/cron/rovex",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

---

### Tarefa 5: Adicionar Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Rovex Platform Integration
ROVEX_API_URL=https://rovex-platform-production.up.railway.app
ROVEX_API_SECRET=<pegar_no_dashboard_rovex>

# Cron Security
CRON_SECRET=seu-secret-aleatorio-aqui
```

---

### Tarefa 6: Adaptar Queries Prisma

Revise o arquivo `src/services/rovex.service.ts` e adapte as queries para os modelos reais do schema Prisma do Magazine.

**Campos comuns que precisam ser adaptados:**

| Query no Template | Possível no Magazine |
|-------------------|----------------------|
| `prisma.user.count()` | ✅ Provavelmente igual |
| `prisma.post.count()` | Pode ser `prisma.publication.count()` |
| `prisma.message.count()` | Pode não existir |
| `prisma.story.count()` | Pode não existir |
| `prisma.comment.count()` | ✅ Provavelmente igual |
| `user.lastActiveAt` | Pode ser `user.updatedAt` |
| `user.tier` | Pode ser `user.subscriptionTier` |

---

### Tarefa 7: Testar Integração

Execute estes testes após implementar:

```bash
# 1. Testar health check
curl http://localhost:3000/api/rovex/health

# 2. Testar métricas (com secret)
curl -H "X-Rovex-Secret: SEU_SECRET" http://localhost:3000/api/rovex/metrics

# 3. Testar cron manualmente
curl -H "Authorization: Bearer SEU_CRON_SECRET" http://localhost:3000/api/cron/rovex
```

---

## ✅ Checklist Final

Após completar todas as tarefas, verifique:

- [ ] `src/services/rovex.service.ts` criado e queries adaptadas
- [ ] `src/app/api/rovex/[...path]/route.ts` criado
- [ ] `src/app/api/cron/rovex/route.ts` criado
- [ ] `vercel.json` atualizado com cron
- [ ] `.env.local` com variáveis Rovex
- [ ] Health check retornando `{ status: "ok" }`
- [ ] Métricas retornando dados reais
- [ ] Cron executando sem erros

---

## 🔗 Links Úteis

- **Rovex Dashboard**: https://rovex-platform.vercel.app
- **Rovex API (Railway)**: https://rovex-platform-production.up.railway.app
- **Documentação Completa**: Ver `MAGAZINE_INTEGRATION.md` no repositório Rovex
