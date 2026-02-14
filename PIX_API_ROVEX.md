# 🔑 API de Solicitação PIX — Magazine SRT → Rovex

## Visão Geral

Quando um administrador do Magazine SRT quer vender um produto via **PIX**, ele precisa submeter uma solicitação que é enviada para a **Rovex Platform** aprovar ou rejeitar.

---

## 🔐 Credenciais

### Magazine Admin (quem abre a solicitação)
| Campo | Valor |
|-------|-------|
| Email | `admin@magazine.com` |
| Senha | `admin123` |
| Role | `ADMIN` |

### Rovex Secret (autenticação da Rovex Platform)
| Campo | Valor |
|-------|-------|
| Header | `x-rovex-secret` |
| Secret | Armazenado na tabela `SystemConfig` (chave `rovex_api_secret`) |

> O secret é gerado durante o provisioning e fica salvo no banco de dados. Pode ser consultado via Prisma Studio (`npx prisma studio`).

---

## 📋 Fluxo Completo

```
Magazine Admin             API                    Rovex Platform
     │                      │                          │
     │  1. Login            │                          │
     │─────────────────────>│                          │
     │  ← token JWT         │                          │
     │                      │                          │
     │  2. Submeter PIX     │                          │
     │─────────────────────>│                          │
     │  ← status: PENDING   │                          │
     │                      │                          │
     │                      │  3. Listar pendentes     │
     │                      │<─────────────────────────│
     │                      │  ← lista de requests     │
     │                      │                          │
     │                      │  4. Aprovar/Rejeitar     │
     │                      │<─────────────────────────│
     │                      │  ← status: APPROVED      │
     │                      │                          │
     │  5. Verificar status │                          │
     │─────────────────────>│                          │
     │  ← APPROVED ✅       │                          │
```

---

## 📡 Endpoints

### Base URL
- **Local:** `http://localhost:3000`
- **Produção:** `https://api.magazinesrt.com`

---

### 1️⃣ Login (obter token JWT)

```
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@magazine.com",
  "password": "admin123"
}
```

**Resposta (200):**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "bf29bf0f-...",
    "name": "Admin",
    "role": "ADMIN"
  }
}
```

---

### 2️⃣ Abrir Solicitação PIX (Magazine Admin)

```
POST /api/products/admin/pix-request
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "ID_DO_PRODUTO",
  "sellerName": "Nome Completo do Vendedor",
  "sellerDocument": "12345678900",
  "sellerEmail": "vendedor@email.com",
  "sellerPhone": "11999999999",
  "pixKey": "12345678900",
  "pixKeyType": "CPF",
  "justification": "Solicito permissão para vender este produto via PIX"
}
```

**Campos obrigatórios:** `productId`, `sellerName`, `sellerEmail`, `pixKey`, `pixKeyType`

**pixKeyType aceitos:** `CPF`, `CNPJ`, `EMAIL`, `PHONE`, `RANDOM`

**Resposta (201):**
```json
{
  "message": "Solicitação enviada para a Rovex com sucesso",
  "request": {
    "id": "8c7fee0f-...",
    "status": "PENDING",
    "productName": "Nome do Produto",
    "productPrice": 1497,
    "createdAt": "2026-02-11T15:56:26.476Z"
  }
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| 400 | Produto sem preço BRL, campos obrigatórios faltando, ou já existe solicitação PENDING |
| 403 | Usuário não é ADMIN |
| 404 | Produto não encontrado |

---

### 3️⃣ Consultar Solicitações (Magazine Admin)

```
GET /api/products/admin/pix-requests
Authorization: Bearer <token_jwt>
```

**Resposta (200):**
```json
[
  {
    "id": "8c7fee0f-...",
    "productName": "Plano Enterprise - Rovex",
    "productPrice": 1497,
    "sellerName": "Luiz Guilherme",
    "pixKey": "44817074884",
    "pixKeyType": "CPF",
    "status": "PENDING",
    "reviewedAt": null,
    "reviewNote": null,
    "createdAt": "2026-02-11T15:56:26.476Z",
    "product": {
      "id": "712d8d10-...",
      "name": "Plano Enterprise - Rovex",
      "pixApprovalStatus": "PENDING"
    }
  }
]
```

---

### 4️⃣ Listar Solicitações Pendentes (Rovex)

```
GET /api/rovex/pix-requests
x-rovex-secret: <ROVEX_SECRET>
```

**Query params opcionais:** `?status=PENDING` (default), `?status=all`, `?status=APPROVED`, `?status=REJECTED`

**Resposta (200):**
```json
[
  {
    "id": "8c7fee0f-...",
    "productName": "Plano Enterprise - Rovex",
    "productPrice": 1497,
    "sellerName": "Luiz Guilherme Diogo Garcia",
    "sellerDocument": "44817074884",
    "sellerEmail": "luizguilherme011@gmail.com",
    "sellerPhone": "19992697215",
    "pixKey": "44817074884",
    "pixKeyType": "CPF",
    "justification": "Solicito a venda de produto digital",
    "status": "PENDING",
    "product": {
      "id": "712d8d10-...",
      "name": "Plano Enterprise - Rovex",
      "priceBRL": 1497
    },
    "requestedBy": {
      "name": "Admin",
      "displayName": "adm",
      "email": "admin@magazine.com"
    }
  }
]
```

---

### 5️⃣ Aprovar ou Rejeitar Solicitação (Rovex)

```
POST /api/rovex/pix-requests/{requestId}/review
x-rovex-secret: <ROVEX_SECRET>
Content-Type: application/json
```

**Body para APROVAR:**
```json
{
  "action": "approve",
  "reviewNote": "Aprovado - documentação verificada"
}
```

**Body para REJEITAR:**
```json
{
  "action": "reject",
  "reviewNote": "Documentação incompleta, reenvie com CPF correto"
}
```

**Resposta (200):**
```json
{
  "message": "Solicitação aprovada com sucesso",
  "status": "APPROVED"
}
```

---

### 6️⃣ Verificar Status PIX de um Produto (Magazine Admin)

```
GET /api/products/admin/pix-status/{productId}
Authorization: Bearer <token_jwt>
```

**Resposta (200):**
```json
{
  "id": "712d8d10-...",
  "pixApprovalStatus": "APPROVED",
  "pixKey": "44817074884",
  "pixKeyType": "CPF",
  "latestRequest": {
    "id": "8c7fee0f-...",
    "status": "APPROVED",
    "reviewNote": "Aprovado - documentação verificada",
    "reviewedAt": "2026-02-11T16:21:56.721Z"
  }
}
```

---

## 🧪 Teste Rápido via Terminal (PowerShell)

### Passo 1 — Login
```powershell
$body = '{"email":"admin@magazine.com","password":"admin123"}'
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $r.token
```

### Passo 2 — Ver solicitações existentes
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/products/admin/pix-requests" -Headers $headers | ConvertTo-Json -Depth 5
```

### Passo 3 — Rovex lista pendentes
```powershell
$secret = "<ROVEX_SECRET_DO_BANCO>"
$headers = @{ "x-rovex-secret" = $secret }
Invoke-RestMethod -Uri "http://localhost:3000/api/rovex/pix-requests" -Headers $headers | ConvertTo-Json -Depth 5
```

### Passo 4 — Rovex aprova
```powershell
$requestId = "<ID_DA_SOLICITACAO>"
$body = '{"action":"approve","reviewNote":"Aprovado via teste"}'
$headers = @{ "x-rovex-secret" = $secret; "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "http://localhost:3000/api/rovex/pix-requests/$requestId/review" -Method POST -Headers $headers -Body $body | ConvertTo-Json
```

---

## ⚙️ O que acontece ao aprovar

1. `PixSellerRequest.status` → `APPROVED`
2. `Product.pixApprovalStatus` → `APPROVED`
3. `Product.acceptedPaymentMethods` → adiciona `"PIX"` se não existir
4. `Product.pixKey` e `Product.pixKeyType` são preenchidos
5. Uma **notificação** é criada para o admin: _"✅ Sua solicitação PIX foi APROVADA!"_

## ❌ O que acontece ao rejeitar

1. `PixSellerRequest.status` → `REJECTED`
2. `Product.pixApprovalStatus` → `REJECTED`
3. `Product.acceptedPaymentMethods` → remove `"PIX"`
4. `Product.pixKey` e `Product.pixKeyType` → `null`
5. Uma **notificação** é criada para o admin: _"❌ Sua solicitação PIX foi REJEITADA."_

---

## 📌 Observações

- Só pode existir **uma solicitação PENDING** por produto por vez
- Apenas usuários com role `ADMIN` podem abrir solicitações
- Após rejeição, o admin pode reenviar uma nova solicitação
- O `reviewNote` é opcional mas recomendado (especialmente em rejeições)
- Todas as rotas `/api/rovex/*` exigem o header `x-rovex-secret` — sem ele retorna `401`
