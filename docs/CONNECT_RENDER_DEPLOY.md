# Deploy do Rovex Connect no Render

## Visão Geral

O **Rovex Connect** é um sistema estilo Discord para comunidades Rovex. Para suportar WebSockets em tempo real (chat e voz), ele precisa de um servidor dedicado.

### Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   API REST      │     │   WebSockets    │
│   (Vercel)      │────▶│   (Vercel)      │     │   (Render)      │
│                 │     │                 │     │                 │
│ magazine-srt.   │     │ magazine-srt-   │     │ rovex-connect.  │
│ vercel.app      │     │ api.vercel.app  │     │ onrender.com    │
└────────┬────────┘     └─────────────────┘     └────────▲────────┘
         │                                               │
         └───────────── Socket.IO ──────────────────────┘
```

## Plano Free do Render

O plano Free/Hobby oferece:
- **750 horas/mês** de instância (suficiente para rodar 24/7 com 30h de folga)
- **100 GB** de bandwidth
- **500 minutos** de pipeline (build)
- Spin-down após 15 min de inatividade (cold start de ~30s)

## Deploy Passo a Passo

### 1. Criar Conta no Render

Acesse [render.com](https://render.com) e faça login com GitHub.

### 2. Criar Web Service

1. Clique em **New +** → **Web Service**
2. Conecte o repositório `streetrunnerteam/magazine-srt`
3. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `rovex-connect` |
| **Region** | `Ohio (US East)` |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx tsc connect-server.ts --esModuleInterop --skipLibCheck --outDir dist` |
| **Start Command** | `node dist/connect-server.js` |
| **Instance Type** | `Free` |

### 3. Configurar Variáveis de Ambiente

No dashboard do Render, vá em **Environment** e adicione:

```
JWT_SECRET=<mesmo_valor_do_vercel>
NODE_ENV=production
PORT=4000
```

⚠️ **IMPORTANTE**: O `JWT_SECRET` deve ser igual ao do backend no Vercel para validar os tokens!

### 4. Deploy

Clique em **Create Web Service**. O deploy iniciará automaticamente.

### 5. Configurar Frontend

Após o deploy, você terá uma URL como: `https://rovex-connect.onrender.com`

No Vercel, adicione a variável de ambiente no projeto do **client**:

```
VITE_CONNECT_URL=https://rovex-connect.onrender.com
```

Redeploy o frontend para aplicar.

## Health Check

O servidor expõe um endpoint de health check:

```bash
curl https://rovex-connect.onrender.com/health
```

Resposta:
```json
{
  "status": "ok",
  "service": "rovex-connect",
  "users": 0,
  "voiceChannels": 0
}
```

## Custos Estimados

### Plano Free (atual)
- **Custo**: R$ 0/mês
- **Limitações**: 
  - Cold start após 15min inativo
  - 750h/mês (OK para 1 comunidade)

### Plano Starter ($7/mês)
- Sem cold start
- 100% uptime
- Melhor para comunidades ativas

### Quando Fazer Upgrade?

|Cenário | Recomendação |
|--------|--------------|
| ≤50 usuários ativos | Free |
| 50-200 usuários | Starter ($7) |
| 200+ usuários | Standard ($25) |

## Feature Gate

O **Rovex Connect** está no plano **STARTER**:

| Feature | Plano |
|---------|-------|
| `CONNECT` | STARTER |
| `CONNECT_TEXT_CHANNELS` | STARTER |
| `CONNECT_VOICE` | GROWTH |

Comunidades no plano FREE não terão acesso ao Connect.

## Troubleshooting

### Cold Start Lento

O plano Free "dorme" após 15min de inatividade. A primeira conexão pode demorar ~30s.

**Solução**: Upgrade para Starter ou use um serviço de ping (UptimeRobot) para manter ativo.

### WebSocket Não Conecta

1. Verifique se `VITE_CONNECT_URL` está configurado no frontend
2. Verifique se `JWT_SECRET` é igual ao do backend
3. Verifique CORS no connect-server.ts

### Erro de Autenticação

O token JWT é compartilhado entre API e Connect. Se der erro:
1. Faça logout/login no app
2. Verifique se o `JWT_SECRET` está correto
