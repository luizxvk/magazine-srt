# Rovex AI — Fluxo de Aprovação de Cupons

## Visão Geral

O sistema de cupons da Magazine SRT utiliza um fluxo de aprovação mediado pela **Rovex AI** para garantir que todos os cupons criados por administradores de comunidades estejam em conformidade com as políticas da plataforma antes de serem disponibilizados aos usuários.

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE APROVAÇÃO                          │
│                                                                 │
│  Admin Comunidade     Rovex Platform        Usuário Final       │
│  ────────────────     ──────────────        ──────────────      │
│                                                                 │
│  Cria Cupom ──────►  Status: PENDING                            │
│  (POST /create)       │                                         │
│                       │                                         │
│                  Rovex AI Analisa                                │
│                       │                                         │
│               ┌───────┴────────┐                                │
│               ▼                ▼                                │
│          APPROVED          REJECTED                             │
│               │                │                                │
│               ▼                ▼                                │
│          Cupom Ativo      Cupom Bloqueado                       │
│               │                                                 │
│               ▼                                                 │
│          Valida no Checkout ◄────── Usuário aplica código       │
└─────────────────────────────────────────────────────────────────┘
```

## Endpoints da API

### 1. Criação de Cupom (Comunidade → Rovex)

```
POST /api/coupons/admin/create
Authorization: Bearer <admin_jwt>
```

**Request Body:**
```json
{
  "code": "VERAO2025",
  "discountValue": 15,
  "description": "Promoção de Verão - 15% off",
  "discountType": "PERCENTAGE",
  "minPurchase": 50.00,
  "maxDiscount": 30.00,
  "maxUses": 200,
  "maxUsesPerUser": 1,
  "isEliteOnly": false,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

**Validações na Criação:**
| Campo | Regra |
|-------|-------|
| `code` | Obrigatório, único, auto-uppercase, sem espaços |
| `discountValue` | Obrigatório, > 0 |
| `discountType` | `"FIXED"` (R$) ou `"PERCENTAGE"` (%) |
| `PERCENTAGE` | Deve ser entre 1% e 50% |
| `maxDiscount` | Teto para cupons percentuais |

**Response (201):**
```json
{
  "id": "uuid-do-cupom",
  "code": "VERAO2025",
  "discountType": "PERCENTAGE",
  "discountValue": 15,
  "rovexApproval": "PENDING",
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

> **IMPORTANTE:** Todo cupom criado por admins inicia com `rovexApproval: "PENDING"` e **NÃO pode ser usado** até aprovação.

---

### 2. Listar Cupons Pendentes (Rovex AI → Consulta)

```
GET /api/coupons/admin/approvals
Authorization: Bearer <rovex_service_jwt>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "VERAO2025",
    "description": "Promoção de Verão - 15% off",
    "discountType": "PERCENTAGE",
    "discountValue": 15,
    "minPurchase": 50.00,
    "maxDiscount": 30.00,
    "maxUses": 200,
    "maxUsesPerUser": 1,
    "isEliteOnly": false,
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "rovexApproval": "PENDING",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
]
```

---

### 3. Revisar Cupom (Rovex AI → Aprovação/Rejeição)

```
POST /api/coupons/admin/approvals/:id/review
Authorization: Bearer <rovex_service_jwt>
Content-Type: application/json
```

**Request Body:**
```json
{
  "approved": true,
  "reviewNote": "Cupom dentro das políticas. Desconto percentual válido com teto definido."
}
```

**Parâmetros:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `approved` | `boolean` | Sim | `true` = APPROVED, `false` = REJECTED |
| `reviewNote` | `string` | Não | Justificativa da decisão (exibida ao admin) |

**Response (200) — Aprovado:**
```json
{
  "id": "uuid",
  "code": "VERAO2025",
  "rovexApproval": "APPROVED",
  "rovexReviewedAt": "2025-01-15T10:05:00.000Z",
  "rovexReviewNote": "Cupom dentro das políticas."
}
```

**Response (200) — Rejeitado:**
```json
{
  "id": "uuid",
  "code": "VERAO2025",
  "rovexApproval": "REJECTED",
  "rovexReviewedAt": "2025-01-15T10:05:00.000Z",
  "rovexReviewNote": "Desconto acima do limite permitido para o plano STARTER."
}
```

---

## Critérios de Análise da Rovex AI

A Rovex AI deve validar os seguintes critérios antes de aprovar um cupom:

### Regras de Negócio
| Regra | Descrição |
|-------|-----------|
| **Limite de Desconto** | PERCENTAGE: máx 50%. FIXED: proporcional ao plano da comunidade |
| **Frequência** | Máx 5 cupons ativos simultâneos por comunidade (plano STARTER) |
| **Nomenclatura** | Código não pode conter palavras ofensivas ou enganosas |
| **Validade** | `expiresAt` deve ser no futuro (mín 1h, máx 1 ano) |
| **Uso Único** | `maxUsesPerUser` deve ser ≥ 1 |
| **Teto Obrigatório** | Cupons PERCENTAGE devem ter `maxDiscount` definido |

### Limites por Plano

| Plano | % Máximo | R$ Máximo | Cupons Ativos | Elite-Only |
|-------|----------|-----------|---------------|------------|
| STARTER | 20% | R$ 10 | 3 | ❌ |
| GROWTH | 35% | R$ 50 | 10 | ✅ |
| ENTERPRISE | 50% | R$ 100 | Ilimitado | ✅ |

---

## Modelo de Dados

```prisma
model Coupon {
  id                String               @id @default(uuid())
  code              String               @unique
  description       String?
  discountType      DiscountType         @default(FIXED)
  discountValue     Float
  minPurchase       Float?
  maxDiscount       Float?
  maxUses           Int?
  maxUsesPerUser    Int                  @default(1)
  usedCount         Int                  @default(0)
  isActive          Boolean              @default(true)
  isEliteOnly       Boolean              @default(false)
  isAutoGenerated   Boolean              @default(false)
  expiresAt         DateTime?
  rovexApproval     CouponApprovalStatus @default(PENDING)
  rovexReviewedAt   DateTime?
  rovexReviewNote   String?              @db.Text
  createdById       String?
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  usages            CouponUsage[]
}

enum CouponApprovalStatus {
  PENDING    // Aguardando análise da Rovex AI
  APPROVED   // Aprovado — cupom utilizável
  REJECTED   // Rejeitado — cupom bloqueado
}
```

---

## Exceções ao Fluxo

### Cupons Auto-Gerados (Elite)
Cupons gerados automaticamente para membros Elite via `POST /api/coupons/elite/claim` são criados com `rovexApproval: "APPROVED"` e **não passam pelo fluxo de aprovação**.

### Validação no Checkout
Quando um usuário aplica um cupom no checkout (`POST /api/coupons/validate`), o sistema verifica:

1. `rovexApproval === "APPROVED"` — caso contrário, retorna erro "Cupom aguardando aprovação"
2. `isActive === true`
3. `expiresAt` não expirado
4. `usedCount < maxUses` (se definido)
5. Uso por usuário < `maxUsesPerUser`
6. `minPurchase` atendido (se definido)
7. `isEliteOnly` — verifica se usuário é Elite

---

## Fluxo de Integração Rovex AI

```
1. Comunidade cria cupom → POST /api/coupons/admin/create
2. Rovex AI consulta pendentes periodicamente → GET /api/coupons/admin/approvals
3. Rovex AI analisa contra critérios do plano da comunidade
4. Rovex AI aprova/rejeita → POST /api/coupons/admin/approvals/:id/review
5. Admin da comunidade vê status atualizado no painel (sem botões de aprovação)
6. Se APPROVED → cupom fica disponível para uso dos membros
7. Se REJECTED → admin pode ver a reviewNote e criar novo cupom corrigido
```

---

## Webhooks (Futuro)

> **Status:** Não implementado. Planejado para v0.6.0.

Quando implementado, a Rovex Platform enviará webhooks para notificar a comunidade sobre mudanças de status:

```json
// POST <community_webhook_url>/coupons/status-change
{
  "event": "coupon.approval_changed",
  "couponId": "uuid",
  "code": "VERAO2025",
  "newStatus": "APPROVED",
  "reviewNote": "...",
  "timestamp": "2025-01-15T10:05:00.000Z"
}
```

---

## Autenticação

Todos os endpoints requerem autenticação JWT via header `Authorization: Bearer <token>`.

Para integração Rovex AI, usar um **Service Token** com role `ADMIN` gerado especificamente para o serviço de revisão automática.

```
Authorization: Bearer <rovex_service_jwt>
```

O token deve ser rotacionado a cada 90 dias via endpoint `POST /api/rovex/rotate-token`.
