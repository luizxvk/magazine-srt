# Rovex Platform - AI Coding Instructions

> **Para uso em ferramentas de AI (GitHub Copilot, Cursor, Claude, etc)**  
> Este documento descreve como integrar com o template Magazine SRT.

---

## 🎯 Contexto

A **Rovex Platform** é um SaaS B2B que permite criar comunidades gamificadas white-label. O backend das comunidades usa o template **Magazine SRT** como base.

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     ROVEX PLATFORM                          │
│  (Dashboard Admin, Billing, User Management, Provisioning)  │
│                    Next.js + PostgreSQL                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  Comunidade A │ │  Comunidade B │ │  Comunidade C │
    │  (Magazine)   │ │  (GamerHub)   │ │  (FanClub)    │
    │               │ │               │ │               │
    │  Template +   │ │  Template +   │ │  Template +   │
    │  DB Isolado   │ │  DB Isolado   │ │  DB Isolado   │
    └───────────────┘ └───────────────┘ └───────────────┘
           │                 │                 │
           └─────────────────┴─────────────────┘
                    Vercel (shared)
```

---

## 🔗 Endpoints de Integração

A Rovex deve implementar endpoints para comunicação com Magazine e vice-versa.

### Rovex → Magazine (Provisioning/Control)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/rovex/health` | Verificar se comunidade está online |
| `GET` | `/api/rovex/metrics` | Buscar métricas da comunidade |
| `POST` | `/api/rovex/config` | Atualizar configuração da comunidade |
| `POST` | `/api/rovex/webhook` | Enviar eventos (mudança de plano, etc) |

### Magazine → Rovex (Reporting)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/communities/{id}/metrics` | Reportar métricas |
| `POST` | `/api/communities/{id}/events` | Reportar eventos |

---

## 🔐 Autenticação

### Rovex → Magazine

```typescript
// Headers para requests autenticados
{
  'Content-Type': 'application/json',
  'X-Rovex-API-Key': process.env.COMMUNITY_API_SECRET,
}

// Para webhooks (adicionar assinatura HMAC)
{
  'X-Rovex-Signature': hmacSha256(timestamp + '.' + payload, webhookSecret),
  'X-Rovex-Timestamp': Date.now().toString(),
}
```

### Magazine → Rovex

```typescript
// Headers para requests autenticados
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.ROVEX_COMMUNITY_TOKEN}`,
}
```

---

## 📦 Provisioning de Comunidade

### Fluxo de Criação

```typescript
// 1. Admin cria comunidade no dashboard Rovex
async function createCommunity(data: CreateCommunityInput) {
  // 1.1 Validar dados
  const validated = validateCommunityData(data);
  
  // 1.2 Criar registro no banco Rovex
  const community = await prisma.community.create({
    data: {
      subdomain: validated.subdomain,
      name: validated.name,
      plan: 'FREE', // ou plano selecionado
      status: 'PROVISIONING',
    }
  });
  
  // 1.3 Provisionar banco PostgreSQL
  const databaseUrl = await provisionDatabase(community.id);
  
  // 1.4 Gerar secrets
  const apiSecret = generateSecureToken(32);
  const webhookSecret = generateSecureToken(32);
  
  // 1.5 Salvar credenciais
  await prisma.community.update({
    where: { id: community.id },
    data: {
      databaseUrl: encrypt(databaseUrl),
      apiSecret: encrypt(apiSecret),
      webhookSecret: encrypt(webhookSecret),
    }
  });
  
  // 1.6 Deploy do template (Vercel API)
  const deployment = await deployMagazineTemplate({
    subdomain: community.subdomain,
    envVars: {
      DATABASE_URL: databaseUrl,
      ROVEX_API_SECRET: apiSecret,
      ROVEX_API_URL: process.env.ROVEX_API_URL,
      JWT_SECRET: generateSecureToken(64),
    }
  });
  
  // 1.7 Aguardar deploy
  await waitForDeployment(deployment.id);
  
  // 1.8 Enviar configuração para Magazine
  await sendCommunityConfig(community, apiSecret);
  
  // 1.9 Marcar como ativo
  await prisma.community.update({
    where: { id: community.id },
    data: { status: 'ACTIVE' }
  });
  
  return community;
}
```

### Payload de Configuração

```typescript
interface CommunityConfigPayload {
  id: string;
  subdomain: string;
  name: string;
  slogan?: string;
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  
  // Branding
  logoUrl: string;
  logoIconUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  
  // Nomenclaturas
  currencyName?: string;      // default: "Coins"
  currencySymbol?: string;    // default: "🪙"
  tierVipName?: string;       // default: "VIP"
  tierStdName?: string;       // default: "MEMBER"
  
  // Limites
  limits: {
    maxUsers: number;
    maxStorageMB: number;
  };
}

async function sendCommunityConfig(community: Community, apiSecret: string) {
  const payload: CommunityConfigPayload = {
    id: community.id,
    subdomain: community.subdomain,
    name: community.name,
    plan: community.plan,
    logoUrl: community.logoUrl,
    primaryColor: community.primaryColor,
    limits: getPlanLimits(community.plan),
  };
  
  const response = await fetch(
    `https://${community.subdomain}.comunidades.rovex.app/api/rovex/config`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Rovex-API-Key': apiSecret,
      },
      body: JSON.stringify(payload),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to configure community: ${response.status}`);
  }
}
```

---

## 📊 Coleta de Métricas

### Polling de Métricas (Cron Job)

```typescript
// Executar a cada 5 minutos
async function collectAllCommunityMetrics() {
  const communities = await prisma.community.findMany({
    where: { status: 'ACTIVE' }
  });
  
  for (const community of communities) {
    try {
      const metrics = await fetchCommunityMetrics(community);
      await saveMetrics(community.id, metrics);
      
      // Verificar limites
      if (metrics.users.utilizationPercent >= 90) {
        await notifyApproachingLimit(community, 'users');
      }
    } catch (error) {
      console.error(`Failed to collect metrics for ${community.subdomain}:`, error);
      await markCommunityUnhealthy(community.id);
    }
  }
}

async function fetchCommunityMetrics(community: Community) {
  const apiSecret = decrypt(community.apiSecret);
  
  const response = await fetch(
    `https://${community.subdomain}.comunidades.rovex.app/api/rovex/metrics`,
    {
      headers: {
        'X-Rovex-API-Key': apiSecret,
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Metrics fetch failed: ${response.status}`);
  }
  
  return response.json();
}
```

---

## 🪝 Webhooks

### Enviar Webhook para Magazine

```typescript
async function sendWebhook(
  community: Community, 
  event: string, 
  payload: any
) {
  const webhookSecret = decrypt(community.webhookSecret);
  const timestamp = Date.now().toString();
  const body = JSON.stringify({ event, payload, timestamp });
  
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  
  const response = await fetch(
    `https://${community.subdomain}.comunidades.rovex.app/api/rovex/webhook`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Rovex-Signature': signature,
        'X-Rovex-Timestamp': timestamp,
      },
      body,
    }
  );
  
  // Log resultado
  await prisma.webhookLog.create({
    data: {
      communityId: community.id,
      event,
      status: response.ok ? 'SUCCESS' : 'FAILED',
      responseStatus: response.status,
    }
  });
}
```

### Eventos a Implementar

```typescript
// Quando plano muda
await sendWebhook(community, 'plan.upgraded', {
  oldPlan: 'STARTER',
  newPlan: 'GROWTH',
  effectiveAt: new Date().toISOString(),
});

// Quando comunidade é suspensa
await sendWebhook(community, 'community.suspended', {
  reason: 'payment_failed',
  suspendedUntil: suspensionDate.toISOString(),
});

// Quando config é alterada
await sendWebhook(community, 'config.updated', {
  changedFields: ['name', 'logoUrl', 'primaryColor'],
});
```

---

## 🎛️ Feature Gates

O Magazine controla features via plano. A Rovex deve:

1. **Mostrar features disponíveis** no dashboard por plano
2. **Bloquear upsell** de features já incluídas
3. **Sugerir upgrade** quando limite atingido

### Features por Plano

```typescript
const PLAN_FEATURES = {
  FREE: [
    'FEED', 'POSTS_IMAGE', 'POSTS_TEXT', 'PROFILE',
    'COMMENTS', 'LIKES', 'ADMIN_DASHBOARD'
  ],
  STARTER: [
    ...PLAN_FEATURES.FREE,
    'STORIES', 'DIRECT_MESSAGES', 'XP_SYSTEM',
    'BADGES', 'DAILY_LOGIN'
  ],
  GROWTH: [
    ...PLAN_FEATURES.STARTER,
    'POSTS_VIDEO', 'RANKING', 'VIRTUAL_CURRENCY',
    'SHOP', 'GROUPS', 'THEME_PACKS', 'INTEGRATIONS'
  ],
  ENTERPRISE: [
    // Todas as features
    ...Object.values(Feature)
  ],
};
```

---

## 🛡️ Boas Práticas

### Segurança

- ✅ Sempre validar `X-Rovex-API-Key` em requests para Magazine
- ✅ Usar HTTPS para todas as comunicações
- ✅ Rotacionar secrets periodicamente
- ✅ Encriptar secrets no banco Rovex
- ✅ Implementar rate limiting nos endpoints

### Resiliência

- ✅ Retry com backoff exponencial para webhooks
- ✅ Circuit breaker para comunidades offline
- ✅ Health check antes de operações críticas
- ✅ Fallback para config cached se Magazine offline

### Observabilidade

- ✅ Logar todas as operações de provisioning
- ✅ Alertar quando comunidade unhealthy > 5 min
- ✅ Dashboard de status de comunidades
- ✅ Métricas de latência dos endpoints

---

## 📁 Estrutura de Arquivos Recomendada

```
rovex-platform/
├── src/
│   ├── services/
│   │   ├── community/
│   │   │   ├── provisioning.service.ts    # Lógica de criação
│   │   │   ├── config.service.ts          # Envio de config
│   │   │   ├── metrics.service.ts         # Coleta de métricas
│   │   │   └── webhook.service.ts         # Envio de webhooks
│   │   │
│   │   └── integration/
│   │       ├── magazine.client.ts         # Cliente HTTP para Magazine
│   │       ├── vercel.client.ts           # Deploy API
│   │       └── database.client.ts         # Provisioning de banco
│   │
│   ├── api/
│   │   ├── communities/
│   │   │   ├── route.ts                   # CRUD de comunidades
│   │   │   ├── [id]/
│   │   │   │   ├── metrics/route.ts       # Recebe métricas push
│   │   │   │   └── events/route.ts        # Recebe eventos
│   │   │
│   │   └── integration/
│   │       └── public/
│   │           └── community/
│   │               └── [subdomain]/route.ts  # Config pública
│   │
│   └── jobs/
│       ├── collect-metrics.ts             # Cron job métricas
│       └── health-check.ts                # Cron job health
```

---

## 🔄 Modelo de Dados

```prisma
model Community {
  id            String   @id @default(uuid())
  subdomain     String   @unique
  name          String
  plan          Plan     @default(FREE)
  status        Status   @default(PROVISIONING)
  
  // Config
  logoUrl       String
  primaryColor  String
  
  // Secrets (encriptados)
  databaseUrl   String
  apiSecret     String
  webhookSecret String
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  metrics       CommunityMetric[]
  webhookLogs   WebhookLog[]
}

enum Plan {
  FREE
  STARTER
  GROWTH
  ENTERPRISE
}

enum Status {
  PROVISIONING
  ACTIVE
  SUSPENDED
  DELETED
}
```

---

## ✅ Checklist de Implementação

### Fase 1: Core
- [ ] CRUD de comunidades no dashboard
- [ ] Provisioning de banco de dados
- [ ] Deploy via Vercel API
- [ ] Envio de config inicial

### Fase 2: Comunicação
- [ ] Health check polling
- [ ] Coleta de métricas
- [ ] Webhooks de mudança de plano

### Fase 3: Monitoramento
- [ ] Dashboard de status
- [ ] Alertas de limite
- [ ] Logs de integração

### Fase 4: Self-Service
- [ ] Upgrade/downgrade de plano
- [ ] Alteração de config pelo admin
- [ ] Domínio customizado

---

**Documento versão 1.0.0** | Última atualização: Janeiro 2026
