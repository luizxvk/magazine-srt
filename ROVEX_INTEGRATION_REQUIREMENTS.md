# Magazine SRT Template - Requisições para Rovex Platform

> **Documento Técnico de Integração**  
> Este arquivo descreve tudo que a Rovex Platform precisa fornecer para que o template Magazine SRT funcione corretamente ao criar novas comunidades.

---

## 📋 Visão Geral

O **Magazine SRT** é o template base que a Rovex Platform usa para gerar comunidades white-label. Este template:

- ✅ Contém **TODAS** as features (plano ENTERPRISE)
- ✅ É totalmente modularizado por feature gates
- ✅ Usa nomenclaturas dinâmicas (moeda, tiers, etc)
- ✅ Aceita branding customizado (cores, logos, etc)
- ✅ Reporta métricas para a Rovex Platform

---

## 🔧 1. Provisioning - O que Rovex deve ENVIAR

Quando uma nova comunidade é criada, a Rovex Platform deve enviar a seguinte configuração:

### 1.1 Endpoint de Provisioning

```
POST {MAGAZINE_API_URL}/api/rovex/config
Headers:
  Content-Type: application/json
  X-Rovex-API-Key: {COMMUNITY_API_SECRET}
```

### 1.2 Payload de Configuração

```typescript
interface CommunityProvisioningPayload {
  // === IDENTIFICAÇÃO (obrigatório) ===
  id: string;                    // UUID único na Rovex
  subdomain: string;             // Ex: "gamerhub" → gamerhub.comunidades.rovex.app
  
  // === PLANO (obrigatório) ===
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  planExpiresAt?: string;        // ISO date (para trials)
  
  // === BRANDING (obrigatório) ===
  name: string;                  // "GamerHub"
  slogan?: string;               // "Sua comunidade gamer"
  logoUrl: string;               // URL do logo principal (mín 256x256)
  logoIconUrl?: string;          // Ícone quadrado (favicon grande)
  faviconUrl?: string;           // Favicon 32x32
  ogImageUrl?: string;           // Open Graph 1200x630
  loginBackgroundUrl?: string;   // Background página de login
  
  // === CORES (obrigatório) ===
  primaryColor: string;          // Hex da cor principal "#3b82f6"
  secondaryColor?: string;       // Hex cor secundária
  accentColor?: string;          // Hex cor de destaque
  
  // === NOMENCLATURAS (opcional, tem defaults) ===
  currencyName?: string;         // Default: "Coins"
  currencySymbol?: string;       // Default: "🪙"
  currencyIconUrl?: string;      // URL ícone da moeda
  tierVipName?: string;          // Default: "VIP"
  tierVipColor?: string;         // Default: primaryColor
  tierStdName?: string;          // Default: "MEMBER"
  tierStdColor?: string;         // Default: secondaryColor
  xpName?: string;               // Default: "XP"
  
  // === DOMÍNIO CUSTOMIZADO (GROWTH+) ===
  customDomain?: string;         // Ex: "comunidade.cliente.com"
  
  // === CREDENCIAIS (obrigatório) ===
  apiSecret: string;             // Secret para autenticar requests Rovex → Magazine
  databaseUrl: string;           // Connection string PostgreSQL
  
  // === STORAGE (GROWTH+) ===
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  // OU
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  
  // === LIMITES ===
  limits: {
    maxUsers: number;            // 50 | 500 | 2000 | Infinity
    maxStorageMB: number;        // Limite de storage
    maxUploadsPerMonth: number;  // Limite de uploads
    maxEmailsPerMonth: number;   // Limite de emails
  };
}
```

### 1.3 Resposta Esperada

```typescript
// Sucesso
{
  "success": true,
  "message": "Configuration applied",
  "data": {
    "subdomain": "gamerhub",
    "plan": "STARTER",
    "appliedAt": "2026-01-31T12:00:00Z"
  }
}

// Erro
{
  "success": false,
  "error": "Invalid configuration",
  "details": ["logoUrl is required"]
}
```

---

## 📊 2. Métricas - O que Magazine REPORTA

O template reporta métricas para a Rovex Platform periodicamente ou sob demanda.

### 2.1 Endpoint de Métricas (Pull)

A Rovex pode buscar métricas a qualquer momento:

```
GET {MAGAZINE_API_URL}/api/rovex/metrics
Headers:
  X-Rovex-API-Key: {COMMUNITY_API_SECRET}
```

### 2.2 Resposta de Métricas

```typescript
interface CommunityMetrics {
  communityId: string;
  subdomain: string;
  plan: string;
  timestamp: string;              // ISO date
  
  users: {
    total: number;                // Total de usuários ativos
    limit: number;                // Limite do plano
    activeToday: number;          // Ativos últimas 24h
    activeThisWeek: number;       // Ativos últimos 7 dias
    utilizationPercent: number;   // % do limite usado
  };
  
  content: {
    totalPosts: number;
    postsToday: number;
    totalMessages: number;
    totalGroups: number;
    activeStories: number;
  };
  
  storage: {
    usedMB: number;
    limitMB: number;
    utilizationPercent: number;
  };
  
  economy: {
    totalZionsCirculating: number;
    totalZionsCashCirculating: number;
    transactionsToday: number;
  };
}
```

### 2.3 Endpoint de Métricas (Push)

O template pode enviar métricas proativamente para a Rovex:

```
POST {ROVEX_API_URL}/api/communities/{communityId}/metrics
Headers:
  Authorization: Bearer {COMMUNITY_API_SECRET}
  Content-Type: application/json
Body: CommunityMetrics
```

---

## ❤️ 3. Health Check

### 3.1 Endpoint

```
GET {MAGAZINE_API_URL}/api/rovex/health
```

### 3.2 Resposta

```typescript
{
  "status": "healthy" | "unhealthy" | "degraded",
  "timestamp": "2026-01-31T12:00:00Z",
  "community": {
    "id": "uuid",
    "subdomain": "gamerhub",
    "plan": "STARTER"
  },
  "version": "5.0.0",
  "uptime": 86400  // segundos
}
```

---

## 🪝 4. Webhooks

A Rovex Platform deve enviar webhooks para notificar eventos importantes:

```
POST {MAGAZINE_API_URL}/api/rovex/webhook
Headers:
  Content-Type: application/json
  X-Rovex-Signature: {HMAC_SHA256_SIGNATURE}
  X-Rovex-Timestamp: {UNIX_TIMESTAMP_MS}
```

### 4.1 Eventos Suportados

| Evento | Descrição |
|--------|-----------|
| `plan.upgraded` | Comunidade fez upgrade de plano |
| `plan.downgraded` | Comunidade fez downgrade de plano |
| `community.suspended` | Comunidade suspensa (falta pagamento, etc) |
| `community.activated` | Comunidade reativada |
| `billing.failed` | Falha no pagamento |
| `billing.success` | Pagamento realizado com sucesso |
| `config.updated` | Configuração alterada pelo admin na Rovex |

### 4.2 Payload dos Webhooks

```typescript
// plan.upgraded / plan.downgraded
{
  "event": "plan.upgraded",
  "timestamp": "2026-01-31T12:00:00Z",
  "payload": {
    "communityId": "uuid",
    "subdomain": "gamerhub",
    "oldPlan": "STARTER",
    "newPlan": "GROWTH",
    "effectiveAt": "2026-01-31T12:00:00Z"
  }
}

// community.suspended
{
  "event": "community.suspended",
  "timestamp": "2026-01-31T12:00:00Z",
  "payload": {
    "communityId": "uuid",
    "subdomain": "gamerhub",
    "reason": "payment_failed",
    "suspendedUntil": "2026-02-07T12:00:00Z"
  }
}

// config.updated
{
  "event": "config.updated",
  "timestamp": "2026-01-31T12:00:00Z",
  "payload": {
    "communityId": "uuid",
    "subdomain": "gamerhub",
    "changedFields": ["name", "logoUrl", "primaryColor"]
  }
}
```

### 4.3 Assinatura de Webhooks

```typescript
// Como Rovex deve assinar
const timestamp = Date.now().toString();
const payload = JSON.stringify(body);
const signatureBase = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', COMMUNITY_WEBHOOK_SECRET)
  .update(signatureBase)
  .digest('hex');

// Headers
headers['X-Rovex-Signature'] = signature;
headers['X-Rovex-Timestamp'] = timestamp;
```

---

## 🔐 5. Autenticação

### 5.1 Secrets Necessários

Cada comunidade precisa de:

| Secret | Descrição | Quem Gera |
|--------|-----------|-----------|
| `ROVEX_API_SECRET` | Secret para requests Rovex → Magazine | Rovex |
| `ROVEX_WEBHOOK_SECRET` | Secret para assinar webhooks | Rovex |
| `DATABASE_URL` | Connection string do PostgreSQL | Rovex |
| `JWT_SECRET` | Secret para tokens de usuários | Magazine (gerado no deploy) |

### 5.2 Environment Variables Esperadas

```bash
# Obrigatórias
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=random-64-chars
ROVEX_API_SECRET=rovex-generated-secret
ROVEX_API_URL=https://api.rovex.app

# Opcionais (se usar storage)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Opcionais (para envio de emails)
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx

# Opcional (Mercado Pago para pagamentos)
MERCADOPAGO_ACCESS_TOKEN=xxx

# Opcional (Stripe)
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
```

---

## 🎛️ 6. Feature Gates

O template usa um sistema de Feature Gates que a Rovex controla através do plano.

### 6.1 Features por Plano

Veja o arquivo completo em: `client/src/utils/features.ts`

**FREE:**
- Feed básico (posts imagem/texto)
- Perfil
- Comentários e Likes
- Admin básico (dashboard, users)

**STARTER:**
- Tudo do FREE +
- Stories
- Mensagens Diretas
- Sistema de XP
- Badges básicos
- Daily Login

**GROWTH:**
- Tudo do STARTER +
- Vídeos
- Ranking
- Economia virtual (Zions)
- Shop de customização
- Grupos
- Theme Packs
- Integrações sociais
- Analytics avançado

**ENTERPRISE:**
- TODAS as features
- White-label
- Domínio custom
- API access
- Múltiplos admins
- Suporte prioritário

### 6.2 Como Bloquear Features

O template automaticamente:
1. Verifica o plano no `CommunityContext`
2. Bloqueia endpoints protegidos com `requireFeature()` middleware
3. Esconde/bloqueia UI com `<FeatureGate>` component
4. Mostra prompts de upgrade quando feature bloqueada

---

## 🗄️ 7. Banco de Dados

### 7.1 Modelo Multi-Tenant

Cada comunidade tem seu **próprio banco de dados** PostgreSQL.

A Rovex deve:
1. Criar banco para nova comunidade
2. Passar `DATABASE_URL` no provisioning
3. Rodar migrations iniciais (ou o template roda no primeiro boot)

### 7.2 Migrations

O template usa Prisma. No primeiro boot ou update:

```bash
npx prisma migrate deploy
```

A Rovex pode acionar isso via:

```
POST {MAGAZINE_API_URL}/api/rovex/admin/migrate
Headers:
  X-Rovex-API-Key: {MASTER_SECRET}
```

### 7.3 Seed Inicial

O template inclui seed para:
- Badges padrão
- Rewards iniciais
- Config default

```bash
npx prisma db seed
```

---

## 🚀 8. Deploy Workflow

### 8.1 Fluxo de Criação de Comunidade

```mermaid
sequenceDiagram
    Rovex->>Rovex DB: Cria registro da comunidade
    Rovex->>Neon/Supabase: Cria banco PostgreSQL
    Rovex->>Vercel: Deploy do template (env vars)
    Vercel->>Magazine: Boot da aplicação
    Magazine->>Magazine: Roda migrations
    Magazine->>Magazine: Roda seed
    Rovex->>Magazine: POST /api/rovex/config
    Magazine->>Rovex: Confirma provisioning
    Rovex->>Admin: Notifica comunidade pronta
```

### 8.2 Fluxo de Atualização

```mermaid
sequenceDiagram
    Rovex Admin->>Rovex: Altera config da comunidade
    Rovex->>Magazine: POST /api/rovex/config
    Magazine->>Magazine: Invalida cache
    Magazine->>Magazine: Aplica nova config
    Magazine->>Rovex: Confirma update
```

---

## 📞 9. Suporte e Debugging

### 9.1 Logs

O template loga para console com prefixo:
- `[Rovex/Health]` - Health checks
- `[Rovex/Metrics]` - Coleta de métricas
- `[Rovex/Config]` - Alterações de config
- `[Rovex/Webhook]` - Webhooks recebidos

### 9.2 Endpoint de Debug (apenas dev)

```
GET {MAGAZINE_API_URL}/api/devtools/status
```

Retorna estado atual da comunidade, config, features, etc.

---

## ✅ 10. Checklist de Integração

Antes de ativar uma comunidade, verificar:

- [ ] `DATABASE_URL` está funcionando
- [ ] `ROVEX_API_SECRET` está configurado em ambos os lados
- [ ] Health check retorna `healthy`
- [ ] Config foi aplicado corretamente
- [ ] Logo e cores estão aparecendo
- [ ] Migrations rodaram
- [ ] Primeiro admin consegue fazer login
- [ ] Métricas estão sendo coletadas

---

## 📝 Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2026-01-31 | Documento inicial |

---

## 🤝 Contato

Para dúvidas sobre integração:
- **Email:** dev@rovex.app
- **Slack:** #magazine-integration
