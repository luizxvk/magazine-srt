# 🏦 Solicitação Rovex: Fluxo de Aprovação PIX Direto para Comunidades

> **De:** Magazine SRT (Template Base)  
> **Para:** Rovex AI / Rovex Platform Team  
> **Data:** 10/02/2026  
> **Prioridade:** Alta  
> **Status:** Aguardando Implementação  

---

## 1. Contexto

Comunidades white-label que utilizam o sistema de **Loja / Marketplace** precisam de um mecanismo seguro para aceitar pagamentos via **PIX Direto** (vendedor recebe diretamente). Como o PIX expõe dados financeiros reais dos vendedores (chave PIX, CPF/CNPJ), a **Rovex Platform** precisa atuar como **entidade aprovadora** para garantir compliance, prevenir fraudes e proteger compradores.

O template Magazine SRT já possui a infraestrutura no lado da comunidade (modelo `PixSellerRequest`, enum `PixApprovalStatus`, endpoints de review). **Esta solicitação pede à Rovex a implementação do painel e lógica de gestão dessas solicitações no lado da plataforma.**

---

## 2. Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMUNIDADE (Magazine SRT)                      │
│                                                                     │
│  1. Admin cria produto → seleciona "PIX Direto"                     │
│  2. Formulário de solicitação PIX aparece:                          │
│     • Chave PIX (tipo + valor)                                      │
│     • Nome completo do vendedor                                     │
│     • CPF/CNPJ                                                      │
│     • Email e telefone                                              │
│     • Justificativa (opcional)                                      │
│  3. Ao salvar → produto criado (pixApprovalStatus: PENDING)         │
│  4. Solicitação enviada automaticamente à Rovex                     │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │  POST /api/communities/{id}/metrics
                           │  ou Webhook push
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ROVEX PLATFORM                               │
│                                                                     │
│  5. Recebe solicitação PIX pendente                                 │
│  6. Exibe no painel de gestão (lista de pix-requests)               │
│  7. Operador Rovex revisa dados do vendedor                         │
│  8. Aprova ou Rejeita (com motivo obrigatório se rejeitado)         │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │  GET  /api/rovex/pix-requests
                           │  POST /api/rovex/pix-requests/:id/review
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMUNIDADE (Resultado)                         │
│                                                                     │
│  ✅ APPROVED → PIX Direto aparece no checkout para compradores      │
│  ❌ REJECTED → Admin notificado com motivo, PIX bloqueado           │
│  🏷️ Badge de status visível ao editar produto:                      │
│     🟢 Verde = Aprovado                                             │
│     🟡 Amarelo = Pendente                                           │
│     🔴 Vermelho = Rejeitado                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Endpoints Já Implementados na Comunidade

Os seguintes endpoints já existem em `server/src/routes/rovexRoutes.ts` (autenticados via `x-rovex-secret`):

### 3.1 Listar Solicitações PIX

```
GET /api/rovex/pix-requests
Headers: x-rovex-secret: <ROVEX_API_SECRET>
```

**Response:**
```json
{
  "requests": [
    {
      "id": "clxyz...",
      "productId": "clxyz...",
      "productName": "Pack Premium VIP",
      "productPriceBRL": 49.90,
      "sellerName": "João da Silva",
      "sellerDocument": "123.456.789-00",
      "sellerDocumentType": "CPF",
      "sellerEmail": "joao@email.com",
      "sellerPhone": "+5511999999999",
      "pixKey": "joao@email.com",
      "pixKeyType": "EMAIL",
      "justification": "Venda de pack exclusivo para membros VIP",
      "status": "PENDING",
      "createdAt": "2026-02-10T12:00:00.000Z",
      "communityId": "magazine-srt",
      "communityName": "Magazine SRT"
    }
  ]
}
```

### 3.2 Aprovar/Rejeitar Solicitação

```
POST /api/rovex/pix-requests/:requestId/review
Headers: x-rovex-secret: <ROVEX_API_SECRET>
Content-Type: application/json
```

**Body (Aprovação):**
```json
{
  "action": "APPROVE",
  "reviewerNotes": "Dados verificados, vendedor válido."
}
```

**Body (Rejeição):**
```json
{
  "action": "REJECT",
  "reviewerNotes": "CPF não corresponde ao titular da chave PIX.",
  "rejectionReason": "Divergência de dados cadastrais"
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "clxyz...",
    "status": "APPROVED",
    "reviewedAt": "2026-02-10T14:00:00.000Z",
    "reviewerNotes": "Dados verificados, vendedor válido."
  }
}
```

---

## 4. O Que a Rovex Precisa Implementar

### 4.1 Dashboard de Solicitações PIX

Painel no dashboard Rovex com:

| Elemento | Descrição |
|----------|-----------|
| **Lista de solicitações** | Tabela com todas as solicitações PIX de todas as comunidades |
| **Filtros** | Por status (`PENDING`, `APPROVED`, `REJECTED`), por comunidade, por data |
| **Ordenação** | Pendentes primeiro, mais recentes no topo |
| **Busca** | Por nome do vendedor, CPF/CNPJ, nome do produto |
| **Contadores** | Badge com quantidade de pendentes no menu lateral |

### 4.2 Tela de Revisão Individual

Ao clicar numa solicitação, exibir:

```
┌──────────────────────────────────────────────────┐
│  📦 Solicitação PIX #1234                        │
│  Status: 🟡 PENDENTE                             │
├──────────────────────────────────────────────────┤
│                                                  │
│  DADOS DO PRODUTO                                │
│  Nome: Pack Premium VIP                          │
│  Preço: R$ 49,90                                 │
│  Comunidade: Magazine SRT (ENTERPRISE)           │
│                                                  │
│  DADOS DO VENDEDOR                               │
│  Nome: João da Silva                             │
│  Documento: 123.456.789-00 (CPF)                 │
│  Email: joao@email.com                           │
│  Telefone: +55 11 99999-9999                     │
│                                                  │
│  CHAVE PIX                                       │
│  Tipo: EMAIL                                     │
│  Chave: joao@email.com                           │
│                                                  │
│  JUSTIFICATIVA                                   │
│  "Venda de pack exclusivo para membros VIP"      │
│                                                  │
├──────────────────────────────────────────────────┤
│  Notas do revisor: [________________]            │
│                                                  │
│  [✅ Aprovar]              [❌ Rejeitar]          │
│                                                  │
│  Se rejeitar, motivo: [________________]         │
└──────────────────────────────────────────────────┘
```

### 4.3 Polling / Webhook para Novas Solicitações

A Rovex precisa de um mecanismo para detectar novas solicitações:

**Opção A — Polling (recomendado para MVP):**
```
GET /api/rovex/pix-requests?status=PENDING
```
Intervalo sugerido: a cada 5 minutos para todas as comunidades ativas.

**Opção B — Push via Webhook (ideal para produção):**
A comunidade envia webhook para Rovex ao criar uma solicitação:
```
POST {ROVEX_PLATFORM_URL}/api/webhooks/pix-request
Headers: x-webhook-signature: <HMAC-SHA256>
Body: {
  "event": "pix_request.created",
  "communityId": "magazine-srt",
  "requestId": "clxyz...",
  "productName": "Pack Premium VIP",
  "sellerName": "João da Silva",
  "createdAt": "2026-02-10T12:00:00.000Z"
}
```

### 4.4 Notificações

| Evento | Notificação |
|--------|-------------|
| Nova solicitação PIX criada | Badge no painel Rovex + email para operador |
| Solicitação aprovada | Webhook para comunidade (já suportado) |
| Solicitação rejeitada | Webhook para comunidade com `rejectionReason` |

### 4.5 Validações Sugeridas (Checklist do Revisor)

A Rovex pode implementar um checklist de validação antes de aprovar:

- [ ] Chave PIX é válida para o tipo informado
- [ ] CPF/CNPJ é um documento válido (dígitos verificadores)
- [ ] Nome do vendedor corresponde ao titular do documento
- [ ] Comunidade está em plano que suporta marketplace (`GROWTH` ou `ENTERPRISE`)
- [ ] Vendedor não possui rejeições anteriores recorrentes
- [ ] Preço do produto está dentro dos limites razoáveis

---

## 5. Modelo de Dados (Lado Rovex)

A Rovex deve persistir o histórico de revisões no seu próprio banco:

```prisma
model PixReviewLog {
  id              String   @id @default(cuid())
  communityId     String
  communityName   String
  requestId       String   // ID da solicitação na comunidade
  productName     String
  sellerName      String
  sellerDocument  String
  pixKey          String
  pixKeyType      String
  action          String   // "APPROVE" | "REJECT"
  reviewerEmail   String   // Operador Rovex que revisou
  reviewerNotes   String?
  rejectionReason String?
  reviewedAt      DateTime @default(now())

  @@index([communityId])
  @@index([action])
  @@index([reviewedAt])
}
```

---

## 6. Feature Gate

O marketplace/shop com PIX Direto requer pelo menos plano **GROWTH**:

```typescript
// Já configurado no template:
// Feature.SHOP → GROWTH+
// Feature.MARKETPLACE → GROWTH+

// Comunidades FREE e STARTER não terão acesso ao fluxo PIX Direto
```

A Rovex deve verificar o plano da comunidade antes de processar solicitações:
- `FREE` / `STARTER` → Rejeitar automaticamente com motivo "Plano não suporta pagamentos PIX Direto. Upgrade para GROWTH ou superior."
- `GROWTH` / `ENTERPRISE` → Processar normalmente

---

## 7. Métricas para o Dashboard Rovex

Adicionar à tela de métricas da comunidade:

| Métrica | Descrição |
|---------|-----------|
| `pix_requests_total` | Total de solicitações PIX criadas |
| `pix_requests_pending` | Solicitações aguardando revisão |
| `pix_requests_approved` | Solicitações aprovadas |
| `pix_requests_rejected` | Solicitações rejeitadas |
| `pix_avg_review_time` | Tempo médio de revisão (em horas) |
| `pix_revenue_total` | Volume total de vendas PIX (R$) |

---

## 8. SLA de Revisão

| Prioridade | SLA | Critério |
|------------|-----|----------|
| **Alta** | ≤ 4h | Comunidades ENTERPRISE |
| **Normal** | ≤ 24h | Comunidades GROWTH |
| **Auto-reject** | Imediato | Comunidades FREE/STARTER |

A Rovex deve alertar internamente quando uma solicitação ultrapassar o SLA.

---

## 9. Segurança

- **Dados sensíveis**: CPF/CNPJ e chaves PIX devem ser armazenados criptografados no banco Rovex
- **Auditoria**: Todo approve/reject deve gerar log com IP, timestamp e operador
- **Rate limiting**: Máximo 10 solicitações PIX por comunidade por dia (prevenir abuso)
- **Transmissão**: Todas as comunicações via HTTPS, payloads sensíveis assinados com HMAC-SHA256

---

## 10. Cronograma Sugerido

| Fase | Escopo | Estimativa |
|------|--------|------------|
| **Fase 1 — MVP** | Polling de solicitações + tela de lista + aprovação/rejeição manual | 1 semana |
| **Fase 2 — Automação** | Validação automática de CPF/CNPJ, webhook push, notificações por email | 1 semana |
| **Fase 3 — Analytics** | Dashboard de métricas PIX, SLA tracking, relatórios | 1 semana |

---

## 11. Referências

| Recurso | Localização |
|---------|-------------|
| Modelo PixSellerRequest | `server/prisma/schema.prisma` (PixSellerRequest) |
| Endpoints Rovex PIX | `server/src/routes/rovexRoutes.ts` (GET/POST pix-requests) |
| Feature Gates | `server/src/config/features.config.ts` |
| Community Config | `server/src/config/community.config.ts` |
| Integração Rovex | `ROVEX_INTEGRATION_REQUIREMENTS.md` |
| Enums PIX | `PixKeyType`, `PixApprovalStatus` em schema.prisma |

---

**⚡ Ação Necessária:** A Rovex AI deve implementar os itens 4.1 a 4.5 (Dashboard, Tela de Revisão, Polling/Webhook, Notificações e Validações) no painel da plataforma Rovex para que o fluxo PIX Direto funcione end-to-end em todas as comunidades.
