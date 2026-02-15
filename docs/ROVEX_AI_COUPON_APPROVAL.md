# Rovex Platform — Sistema de Cupons Push

## Visão Geral

O sistema de cupons da Magazine SRT utiliza um modelo **push-based** onde a **Rovex Platform** cria e distribui cupons para as comunidades. Os administradores de comunidade recebem notificações quando novos cupons são disponibilizados.

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE CUPONS (PUSH)                      │
│                                                                 │
│  Rovex Platform       Admin Comunidade      Usuário Final       │
│  ──────────────       ────────────────      ──────────────      │
│                                                                 │
│  Cria Cupom ──────►  Notificação                                │
│  (Estratégia/        "Um novo cupom                             │
│   Promocional)        foi postado!" 🔔                          │
│        │                   │                                    │
│        │                   ▼                                    │
│        │             Admin visualiza                            │
│        │             no Dashboard                               │
│        │                   │                                    │
│        ▼                   ▼                                    │
│  Cupom já nasce      Admin pode                                 │
│  APPROVED            ativar/desativar                           │
│        │                   │                                    │
│        │                   ▼                                    │
│        └──────────►  Valida no Checkout ◄─── Usuário aplica     │
└─────────────────────────────────────────────────────────────────┘
```

## Modelo Push vs Pull

| Aspecto | Modelo Antigo (Pull) | Modelo Atual (Push) |
|---------|---------------------|---------------------|
| Criador | Admin da comunidade | Rovex Platform |
| Aprovação | Rovex AI revisava | N/A - já vem aprovado |
| Controle | Admin define desconto | Rovex define, admin ativa |
| Timing | Admin quando quiser | Rovex em campanhas estratégicas |
| Notificação | Admin esperava aprovação | Admin recebe "novo cupom postado" |

---

## Endpoints da API

### 1. Rovex Cria e Distribui Cupom

```
POST /api/rovex/coupons/distribute
Authorization: Bearer <rovex_service_jwt>
X-Rovex-Signature: <hmac_sha256>
```

**Request Body:**
```json
{
  "communityId": "uuid-da-comunidade",
  "code": "ROVEX2025",
  "discountValue": 15,
  "description": "🎉 Promoção Rovex - 15% de desconto exclusivo!",
  "discountType": "PERCENTAGE",
  "minPurchase": 50.00,
  "maxDiscount": 30.00,
  "maxUses": 200,
  "maxUsesPerUser": 1,
  "applicableCategories": ["all"],
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "campaignId": "campanha-verao-2025",
  "notifyAdmins": true
}
```

**Response (201):**
```json
{
  "id": "uuid-do-cupom",
  "code": "ROVEX2025",
  "discountType": "PERCENTAGE",
  "discountValue": 15,
  "rovexApproval": "APPROVED",
  "isRovexManaged": true,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "notificationSent": true
}
```

> **IMPORTANTE:** Cupons distribuídos pela Rovex já nascem com `rovexApproval: "APPROVED"` e `isRovexManaged: true`.

---

### 2. Admin Visualiza Cupons Disponíveis

```
GET /api/coupons/admin/available
Authorization: Bearer <admin_jwt>
```

**Response:**
```json
{
  "coupons": [
    {
      "id": "uuid",
      "code": "ROVEX2025",
      "description": "🎉 Promoção Rovex - 15% de desconto exclusivo!",
      "discountType": "PERCENTAGE",
      "discountValue": 15,
      "minPurchase": 50.00,
      "maxDiscount": 30.00,
      "maxUses": 200,
      "usedCount": 0,
      "isActive": true,
      "isRovexManaged": true,
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "campaignId": "campanha-verao-2025",
      "receivedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "unreadCount": 1
}
```

---

### 3. Admin Ativa/Desativa Cupom

Admins podem desativar temporariamente um cupom Rovex sem excluí-lo:

```
PATCH /api/coupons/admin/:id/toggle
Authorization: Bearer <admin_jwt>
```

**Request Body:**
```json
{
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "code": "ROVEX2025",
  "isActive": false,
  "message": "Cupom desativado. Membros não poderão utilizá-lo temporariamente."
}
```

---

### 4. Admin Marca Notificação como Lida

```
POST /api/coupons/admin/:id/mark-read
Authorization: Bearer <admin_jwt>
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Notificações no Dashboard

Quando a Rovex distribui um cupom, o sistema cria uma notificação para o admin:

```typescript
// Tipo de notificação
{
  type: "COUPON_DISTRIBUTED",
  title: "Novo cupom disponível!",
  message: "A Rovex liberou o cupom ROVEX2025 (15% off) para sua comunidade.",
  data: {
    couponId: "uuid",
    code: "ROVEX2025",
    discountValue: 15,
    discountType: "PERCENTAGE"
  },
  isRead: false,
  createdAt: "2025-01-15T10:00:00.000Z"
}
```

### Card no Dashboard Admin

O dashboard do admin exibe um card de "Cupons Rovex" que mostra:
- Badge com contagem de cupons não lidos
- Lista de cupons recentes com status (ativo/inativo)
- Botão para ver detalhes/ativar

```tsx
// Exemplo visual do card
┌────────────────────────────────────────┐
│  🎫 Cupons Rovex              🔴 1 novo │
├────────────────────────────────────────┤
│  ROVEX2025 - 15% off                   │
│  📅 Expira em 31/12/2025               │
│  ⚡ 0/200 usos                          │
│  [Ativo ✓]  [Ver detalhes]             │
└────────────────────────────────────────┘
```

---

## Limites por Plano da Comunidade

Cupons distribuídos pela Rovex respeitam os limites do plano da comunidade:

| Plano | % Máximo | R$ Máximo | Cupons Ativos | Elite-Only |
|-------|----------|-----------|---------------|------------|
| STARTER | 20% | R$ 10 | 3 | ❌ |
| GROWTH | 35% | R$ 50 | 10 | ✅ |
| ENTERPRISE | 50% | R$ 100 | Ilimitado | ✅ |

---

## Campanhas da Rovex

A Rovex pode distribuir cupons como parte de campanhas promocionais:

| Tipo de Campanha | Exemplo | Descrição |
|-----------------|---------|-----------|
| **Sazonal** | VERAO2025 | Black Friday, Natal, etc. |
| **Onboarding** | BEMVINDO10 | Para novas comunidades |
| **Retenção** | VOLTAPRA15 | Para reativar comunidades |
| **Parceria** | PATROCINIO20 | Cupons de parceiros |

```json
// Exemplo de campanha push
{
  "campaignId": "blackfriday-2025",
  "campaignName": "Black Friday 2025",
  "targetPlans": ["GROWTH", "ENTERPRISE"],
  "coupons": [
    {
      "code": "BLACK25",
      "discountValue": 25,
      "discountType": "PERCENTAGE"
    }
  ],
  "distributionDate": "2025-11-28T00:00:00.000Z"
}
```

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
  isRovexManaged    Boolean              @default(false)  // Cupom criado/gerenciado pela Rovex
  campaignId        String?                               // ID da campanha Rovex
  expiresAt         DateTime?
  rovexApproval     CouponApprovalStatus @default(APPROVED)  // Cupons Rovex já vêm aprovados
  rovexDistributedAt DateTime?                            // Quando foi distribuído
  createdById       String?
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  usages            CouponUsage[]
}

enum CouponApprovalStatus {
  APPROVED   // Cupom utilizável (padrão para cupons Rovex)
  REJECTED   // Cupom bloqueado (removido pela Rovex ou admin)
}
```

---

## Modelo de Dados - Notificação Admin

```prisma
model AdminNotification {
  id          String   @id @default(uuid())
  adminId     String
  type        String   // "COUPON_DISTRIBUTED", "COUPON_EXPIRING", etc.
  title       String
  message     String
  data        Json?    // { couponId, code, discountValue, ... }
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  admin       User     @relation(fields: [adminId], references: [id])
}
```

---

## Exceções ao Fluxo

### Cupons Auto-Gerados (Elite)
Cupons gerados automaticamente para membros Elite via `POST /api/coupons/elite/claim` são criados com `rovexApproval: "APPROVED"` e **não passam pelo fluxo de distribuição**.

### Validação no Checkout
Quando um usuário aplica um cupom no checkout (`POST /api/coupons/validate`), o sistema verifica:

1. `rovexApproval === "APPROVED"`
2. `isActive === true`
3. `expiresAt` não expirado
4. `usedCount < maxUses` (se definido)
5. Uso por usuário < `maxUsesPerUser`
6. `minPurchase` atendido (se definido)
7. `isEliteOnly` — verifica se usuário é Elite

---

## Fluxo de Integração Resumido

```
1. Rovex Platform decide criar campanha promocional
2. Rovex distribui cupom para comunidades elegíveis → POST /api/rovex/coupons/distribute
3. Sistema cria cupom com rovexApproval: "APPROVED" e isRovexManaged: true
4. Sistema cria notificação para admins: "Um novo cupom foi postado!"
5. Admin visualiza notificação no dashboard → card "Cupons Rovex"
6. Admin pode ativar/desativar cupom conforme necessidade
7. Membros aplicam cupom no checkout
8. Rovex monitora métricas de uso via analytics
```

---

## Webhooks de Notificação

A Rovex envia webhook para confirmar distribuição:

```json
// POST <community_webhook_url>/rovex/coupon-distributed
{
  "event": "coupon.distributed",
  "couponId": "uuid",
  "code": "ROVEX2025",
  "discountType": "PERCENTAGE",
  "discountValue": 15,
  "campaignId": "campanha-verao-2025",
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

A comunidade pode enviar eventos de uso de volta:

```json
// POST <rovex_api>/webhooks/coupon-usage
{
  "event": "coupon.used",
  "couponId": "uuid",
  "code": "ROVEX2025",
  "userId": "uuid-usuario",
  "discountApplied": 15.00,
  "orderTotal": 100.00,
  "timestamp": "2025-01-16T14:30:00.000Z"
}
```

---

## Autenticação

### Endpoints Comunidade
Requerem JWT de admin da comunidade:
```
Authorization: Bearer <admin_jwt>
```

### Endpoints Rovex
Requerem Service Token + assinatura HMAC:
```
Authorization: Bearer <rovex_service_jwt>
X-Rovex-Signature: <hmac_sha256_of_body>
```

O token é rotacionado a cada 90 dias via `POST /api/rovex/rotate-token`.

---

## FAQ

### O admin pode criar cupons próprios?
**Sim**, mas cupons criados pelo admin local funcionam independentemente do sistema Rovex. Eles não aparecem no card "Cupons Rovex" e são gerenciados normalmente.

### O admin pode editar cupons Rovex?
**Não**. Cupons `isRovexManaged: true` só podem ser ativados/desativados. Os valores de desconto, código e limites são definidos pela Rovex.

### E se o admin desativar um cupom Rovex?
O cupom fica temporariamente indisponível na comunidade. A Rovex recebe analytics sobre cupons desativados para ajustar campanhas futuras.

### Como a Rovex escolhe quais comunidades recebem cupons?
Baseado em:
- Plano da comunidade (STARTER, GROWTH, ENTERPRISE)
- Métricas de engajamento
- Participação em campanhas anteriores
- Configurações de opt-in da comunidade
