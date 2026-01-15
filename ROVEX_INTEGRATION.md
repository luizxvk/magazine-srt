# 🔗 Integração Magazine ↔ Rovex Platform

> **Status**: ✅ Implementado (Janeiro 2026)  
> **Versão**: 1.0

---

## 📋 Resumo da Implementação

A integração permite comunicação bidirecional entre o Magazine (comunidade) e a plataforma Rovex.

### Arquivos Criados/Modificados

| Arquivo | Descrição |
|---------|-----------|
| `server/src/services/rovexService.ts` | Serviço principal de integração |
| `server/src/routes/rovexRoutes.ts` | Endpoints da API Rovex |
| `server/index.ts` | Cron job automático |
| `server/.env.example` | Variáveis de ambiente |

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
| `GET` | `/api/rovex/config` | Configurações da comunidade |
| `PUT` | `/api/rovex/config` | Atualizar configs via Rovex |
| `POST` | `/api/rovex/webhook` | Receber eventos da Rovex |

### Endpoints que Magazine USA (Magazine chama Rovex)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/rovex/report-metrics` | Trigger manual de report |
| `GET` | `/api/rovex/connection-test` | Testar conexão com Rovex |

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

- [ ] Implementar cache de métricas (evitar queries repetidas)
- [ ] Adicionar retry com backoff em caso de falha
- [ ] Suportar múltiplas comunidades (multi-tenant)
- [ ] Dashboard interno mostrando status da integração
- [ ] Implementar `config.updated` webhook para recarregar configs dinamicamente
- [ ] Adicionar métricas de engagement (likes, shares)

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
