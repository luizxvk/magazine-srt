# 🔗 Integração Magazine ↔ Rovex Platform

> **Status**: ✅ Implementado (Janeiro 2026)  
> **Versão**: 2.0 (White-Label Provisioning)

---

## 📋 Resumo da Implementação

A integração permite comunicação bidirecional entre o Magazine (comunidade) e a plataforma Rovex, incluindo provisionamento white-label e feature gates.

### Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `server/src/services/rovexService.ts` | Serviço principal de integração |
| `server/src/routes/rovexRoutes.ts` | Endpoints da API Rovex (provisioning, features, config) |
| `server/prisma/schema.prisma` | Model `SystemConfig` para persistência |
| `client/src/config/community.config.ts` | Configuração white-label do frontend |
| `client/src/context/CommunityContext.tsx` | Provider de configuração dinâmica |
| `client/src/hooks/useFeature.ts` | Hook de feature gates |

---

## 🔐 Configuração

### Variáveis de Ambiente (`.env`)

```env
# Rovex Platform Integration
ROVEX_API_URL=https://rovex-platform-production.up.railway.app
ROVEX_API_SECRET=<copiar do dashboard da comunidade na Rovex>
```

⚠️ **Importante**: Sem essas variáveis, o cron job NÃO será iniciado (fail-safe).

---

## 🎯 Feature Gates por Plano

| Feature | FREE | STARTER | GROWTH | ENTERPRISE |
|---------|------|---------|--------|------------|
| Feed & Perfil | ✅ | ✅ | ✅ | ✅ |
| Grupos | ❌ | ✅ | ✅ | ✅ |
| Market | ❌ | ✅ | ✅ | ✅ |
| Supply Box | ❌ | ✅ | ✅ | ✅ |
| Badges | ❌ | ✅ | ✅ | ✅ |
| Daily Login | ❌ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ✅ | ✅ |
| Custom Themes | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ | ✅ |
| White Label | ❌ | ❌ | ❌ | ✅ |
| SSO Integration | ❌ | ❌ | ❌ | ✅ |
| Custom Domain | ❌ | ❌ | ❌ | ✅ |

---

## 📊 Métricas Reportadas

O Magazine envia automaticamente estas métricas a cada **5 minutos**:

```typescript
interface RovexMetrics {
  totalUsers: number;      // Usuários ativos (não deletados)
  activeUsers24h: number;  // Usuários vistos nas últimas 24h
  totalPosts: number;      // Posts não removidos
  postsToday: number;      // Posts criados hoje
  onlineNow: number;       // Usuários online (últimos 5 min)
  totalMessages: number;   // Total de mensagens
  totalStories: number;    // Total de stories
  totalComments: number;   // Total de comentários
  reportedAt: string;      // ISO timestamp
}
```

---

## 🛠️ Endpoints Disponíveis

### Endpoints que Magazine EXPÕE (Rovex chama)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/rovex/health` | Health check da comunidade |
| `GET` | `/api/rovex/metrics` | Métricas sob demanda |
| `GET` | `/api/rovex/config` | Configurações da comunidade (do DB ou defaults) |
| `PUT` | `/api/rovex/config` | Atualizar configs via Rovex (persiste no DB) |
| `GET` | `/api/rovex/features` | Lista features e disponibilidade por plano |
| `POST` | `/api/rovex/provision` | Provisionar nova comunidade + admin user |
| `PUT` | `/api/rovex/plan` | Upgrade/downgrade de plano |
| `POST` | `/api/rovex/webhook` | Receber eventos da Rovex |

### Endpoints que Magazine USA (Magazine chama Rovex)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/rovex/report-metrics` | Trigger manual de report |
| `GET` | `/api/rovex/connection-test` | Testar conexão com Rovex |

---

## 🚀 Provisioning API

### POST `/api/rovex/provision`

Cria/atualiza configuração completa da comunidade e opcionalmente cria usuário admin.

```json
// Request
{
  "communityName": "Minha Comunidade",
  "subdomain": "minha-comunidade",
  "plan": "STARTER",
  "tierVipName": "VIP",
  "tierVipColor": "#FFD700",
  "tierStdName": "MEMBER",
  "tierStdColor": "#10B981",
  "currencyName": "Coins",
  "currencySymbol": "C$",
  "primaryColor": "#FFD700",
  "secondaryColor": "#10B981",
  "logoUrl": "https://...",
  "adminUser": {
    "email": "admin@example.com",
    "password": "securepassword",
    "name": "Admin"
  }
}

// Response
{
  "success": true,
  "message": "Community provisioned successfully",
  "config": { ... },
  "adminUser": { "userId": "...", "action": "created" }
}
```

### PUT `/api/rovex/plan`

Atualiza o plano da comunidade (upgrade/downgrade).

```json
// Request
{
  "plan": "GROWTH",
  "features": { ... }
}

// Response
{
  "success": true,
  "message": "Plan updated to GROWTH",
  "config": { ... }
}
```

### GET `/api/rovex/features`

Lista todas as features e disponibilidade por plano.

```json
// Response
{
  "success": true,
  "currentPlan": "STARTER",
  "allFeatures": {
    "feed": "FREE",
    "groups": "STARTER",
    "analytics": "GROWTH",
    "white_label": "ENTERPRISE"
  },
  "availableFeatures": ["feed", "profile", "groups", "market"],
  "lockedFeatures": [
    { "feature": "analytics", "requiredPlan": "GROWTH" }
  ]
}
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      MAGAZINE (Comunidade)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   [Startup]         [Cron 5min]        [Manual]
   10s delay            │                  │
        │               │                  │
        └───────────────┴──────────────────┘
                        │
                        ▼
            reportMetricsToRovex()
                        │
                        ▼
    POST /api/integration/report-metrics
    Headers: X-Rovex-Secret: <secret>
    Body: { metrics: {...} }
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROVEX PLATFORM                            │
│                                                              │
│  • Armazena em lastMetrics                                   │
│  • Atualiza dashboard global                                 │
│  • Dispara alertas se necessário                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testando a Integração

### 1. Testar conexão (local)

```bash
# No terminal do servidor (porta 3001)
curl http://localhost:3001/api/rovex/connection-test \
  -H "X-Rovex-Secret: SEU_SECRET"
```

### 2. Forçar envio de métricas

```bash
curl -X POST http://localhost:3001/api/rovex/report-metrics \
  -H "X-Rovex-Secret: SEU_SECRET" \
  -H "Content-Type: application/json"
```

### 3. Verificar health check

```bash
curl http://localhost:3001/api/rovex/health \
  -H "X-Rovex-Secret: SEU_SECRET"
```

---

## 📝 Serviço Rovex (`rovexService.ts`)

### Funções Exportadas

```typescript
// Verifica se integração está configurada
isRovexConfigured(): boolean

// Reporta métricas para Rovex (chamado pelo cron)
reportMetricsToRovex(): Promise<boolean>

// Busca config da comunidade (multi-tenant futuro)
getRovexCommunityConfig(subdomain: string): Promise<RovexCommunityConfig | null>

// Envia webhook/evento para Rovex
sendRovexWebhook(event: string, data: object): Promise<boolean>

// Testa conexão com Rovex
testRovexConnection(): Promise<{ configured, connected, error? }>
```

---

## 🚨 Webhooks da Rovex

O Magazine escuta estes eventos em `POST /api/rovex/webhook`:

| Evento | Descrição | Ação Sugerida |
|--------|-----------|---------------|
| `community.suspended` | Comunidade suspensa | Bloquear logins, mostrar manutenção |
| `community.reactivated` | Comunidade reativada | Restaurar acesso normal |
| `community.plan_changed` | Plano alterado | Atualizar limites |
| `config.updated` | Config alterada via Rovex | Recarregar configurações |
| `alert.triggered` | Alerta de uso | Notificar admin |

---

## 🔮 TODO / Melhorias Futuras

- [x] Implementar SystemConfig para persistir configurações no DB
- [x] Adicionar endpoint de provisioning com criação de admin
- [x] Adicionar endpoint de upgrade/downgrade de plano
- [x] Adicionar endpoint de features por plano
- [ ] Implementar cache de métricas (evitar queries repetidas)
- [ ] Adicionar retry com backoff em caso de falha
- [ ] Dashboard interno mostrando status da integração
- [ ] Implementar `config.updated` webhook para recarregar configs dinamicamente
- [ ] Adicionar métricas de engagement (likes, shares)
- [ ] Fase 4: Substituir textos hardcoded por config dinâmica (Magazine → config.communityName)

---

## 🎨 Frontend: CommunityContext

### Uso no Frontend

```tsx
import { useCommunity } from '../context/CommunityContext';

function MyComponent() {
  const { 
    config,           // Full community config
    formatCurrency,   // (amount) => "Z$ 100"
    getTierColor,     // (tier) => "#d4af37"
    getTierName,      // (tier) => "MAGAZINE"
    isVipTier,        // (tier) => true/false
    isFeatureEnabled, // (featureId) => true/false
    getFeatureRequiredPlan, // (featureId) => "GROWTH"
  } = useCommunity();
  
  return (
    <div>
      <h1>Bem-vindo ao {config.communityName}!</h1>
      <p>Você tem {formatCurrency(100)}</p>
      {!isFeatureEnabled('analytics') && (
        <p>Analytics requer plano {getFeatureRequiredPlan('analytics')}</p>
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Métricas não aparecem na Rovex

1. Verificar logs do servidor: `[Rovex] ✅ Metrics reported` ou `[Rovex] ❌ Error`
2. Testar conexão: `GET /api/rovex/connection-test`
3. Verificar se `ROVEX_API_SECRET` está correto

### Cron não está executando

- Verificar log de startup: `[Rovex] ✅ Integration configured`
- Se aparecer `[Rovex] ⚠️ Integration not configured`, faltam env vars
- Cron só roda em ambiente não-serverless (local/VPS)

### Erro 401 Unauthorized

- Secret incorreto no header `X-Rovex-Secret`
- Ou secret não bate com `ROVEX_API_SECRET` do Magazine

---

*Última atualização: Janeiro 2026*
