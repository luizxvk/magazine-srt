# Magazine AI → Rovex: Resposta sobre Estrutura do Repositório

**Data:** 31 de Janeiro de 2026  
**De:** Magazine AI (GitHub Copilot)  
**Para:** Rovex Platform (Luiz)

---

## ✅ Resposta no Formato Solicitado

```yaml
repository_structure:
  frontend_folder: "client"
  backend_folder: "server"

vercel_frontend:
  root_directory: "client"
  framework: "vite"  # NÃO é Next.js, é React + Vite!
  build_command: "npm run build"
  output_directory: "dist"
  install_command: "npm install"

vercel_backend:
  root_directory: "server"
  framework: "other"  # Express.js com @vercel/node
  build_command: null  # Vercel compila automaticamente via @vercel/node
  output_directory: null
  install_command: "npm install && npx prisma generate"

required_env_vars:
  # Compartilhadas (ambos projetos precisam)
  shared:
    - name: "DATABASE_URL"
      description: "Connection string PostgreSQL"
      example: "postgresql://user:pass@host:5432/dbname?sslmode=require"
      required: true
    
    - name: "JWT_SECRET"
      description: "Secret para assinar tokens JWT de autenticação"
      example: "random-64-chars-string"
      required: true

  # Apenas Backend
  backend:
    - name: "NODE_ENV"
      description: "Ambiente de execução"
      example: "production"
      required: true

    - name: "ROVEX_API_URL"
      description: "URL da Rovex Platform para integração"
      example: "https://rovex-platform-production.up.railway.app"
      required: true

    - name: "ROVEX_API_SECRET"
      description: "Secret para autenticar requests da Rovex"
      example: "mag_secret_2026_rovex_integration_key"
      required: true

    - name: "CLOUDINARY_CLOUD_NAME"
      description: "Cloud name do Cloudinary para uploads"
      example: "dqztnruyc"
      required: false  # Opcional se usar R2

    - name: "CLOUDINARY_API_KEY"
      description: "API Key do Cloudinary"
      example: "868128454283539"
      required: false

    - name: "CLOUDINARY_API_SECRET"
      description: "API Secret do Cloudinary"
      example: "xxxxx"
      required: false

    - name: "R2_ENDPOINT"
      description: "Endpoint Cloudflare R2 (alternativa ao Cloudinary)"
      example: "https://xxx.r2.cloudflarestorage.com"
      required: false

    - name: "R2_ACCESS_KEY_ID"
      description: "Access Key do R2"
      example: "xxxxx"
      required: false

    - name: "R2_SECRET_ACCESS_KEY"
      description: "Secret Key do R2"
      example: "xxxxx"
      required: false

    - name: "R2_BUCKET_NAME"
      description: "Nome do bucket R2"
      example: "project-magazine"
      required: false

    - name: "R2_PUBLIC_URL"
      description: "URL pública do bucket R2"
      example: "https://pub-xxx.r2.dev"
      required: false

    - name: "SMTP_HOST"
      description: "Servidor SMTP para envio de emails"
      example: "smtp.gmail.com"
      required: false  # Funciona sem emails

    - name: "SMTP_PORT"
      description: "Porta do servidor SMTP"
      example: "587"
      required: false

    - name: "SMTP_USER"
      description: "Usuário SMTP"
      example: "email@gmail.com"
      required: false

    - name: "SMTP_PASS"
      description: "Senha SMTP (app password)"
      example: "xxxx xxxx xxxx xxxx"
      required: false

    - name: "MERCADOPAGO_ACCESS_TOKEN"
      description: "Token do Mercado Pago para pagamentos"
      example: "APP_USR-xxxx"
      required: false  # Só se habilitar pagamentos

    - name: "DISCORD_CLIENT_ID"
      description: "Client ID do Discord OAuth"
      example: "1234567890"
      required: false  # Só se habilitar integração Discord

    - name: "DISCORD_CLIENT_SECRET"
      description: "Client Secret do Discord OAuth"
      example: "xxxxx"
      required: false

    - name: "DISCORD_REDIRECT_URI"
      description: "Callback URL do Discord OAuth"
      example: "https://app.comunidade.com/api/social/discord/callback"
      required: false

    - name: "STEAM_API_KEY"
      description: "API Key da Steam"
      example: "xxxxx"
      required: false  # Só se habilitar integração Steam

    - name: "STEAM_REALM"
      description: "URL base para autenticação Steam"
      example: "https://app.comunidade.com"
      required: false

  # Apenas Frontend
  frontend:
    - name: "VITE_API_URL"
      description: "URL da API do backend"
      example: "https://api.comunidade.com/api"
      required: true

build_dependencies:
  frontend_needs_backend: false
  notes: |
    O frontend e backend são independentes para build.
    O frontend precisa da VITE_API_URL para saber onde está a API.
    Em produção, o frontend faz requests para /api/* que são proxied para o backend.
```

---

## 📁 Estrutura Real do Repositório

```
magazine-srt/
├── client/                    # ← FRONTEND (React + Vite + TypeScript)
│   ├── package.json
│   ├── vercel.json            # Configuração de rewrites/SPAs
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html             # Entry point HTML
│   ├── public/                # Assets estáticos
│   │   ├── assets/
│   │   └── sw.js              # Service Worker
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── services/
│       └── hooks/
│
├── server/                    # ← BACKEND (Express.js + Prisma + TypeScript)
│   ├── package.json
│   ├── vercel.json            # Configuração @vercel/node + crons
│   ├── tsconfig.json
│   ├── index.ts               # Entry point Express
│   ├── prisma/
│   │   ├── schema.prisma      # Schema do banco
│   │   ├── seed.ts            # Seed inicial
│   │   └── migrations/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       ├── middleware/
│       └── utils/
│
├── docs/                      # Documentação
├── docker-compose.yml         # PostgreSQL + Redis local
├── README.md
├── ROADMAP.md
└── ROVEX_INTEGRATION_REQUIREMENTS.md
```

---

## ⚠️ IMPORTANTE: NÃO é Next.js!

O frontend **NÃO usa Next.js**. Usa:
- **React 19**
- **Vite 7** (build tool)
- **TypeScript**
- **TailwindCSS**
- **Framer Motion** (animações)

Isso significa que:
1. **Framework Preset na Vercel:** Usar "Vite" ou "Other" (não "Next.js")
2. **Output Directory:** `dist` (não `.next`)
3. **Sem SSR:** É uma SPA pura (Single Page Application)

---

## 🔧 Configurações Vercel Atuais

### Projeto Frontend (`magazine-frontend` ou `client`)

```json
// client/vercel.json
{
    "rewrites": [
        {
            "source": "/api/:path*",
            "destination": "https://magazine-srt.vercel.app/api/:path*"
        },
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

**Configuração:**
- Root Directory: `client`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Projeto Backend (`magazine-srt` ou `server`)

```json
// server/vercel.json
{
    "version": 2,
    "builds": [
        {
            "src": "index.ts",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "index.ts"
        }
    ],
    "crons": [
        {
            "path": "/api/rovex/cron/metrics",
            "schedule": "0 0 * * *"
        }
    ]
}
```

**Configuração:**
- Root Directory: `server`
- Framework: Other (usa @vercel/node)
- Build Command: `npx prisma generate` (ou deixar padrão)
- Output Directory: (deixar vazio)
- Install Command: `npm install`

---

## 🔄 Fluxo de Deploy Recomendado para Novas Comunidades

### 1. Criar Projeto Backend
```typescript
const backendProject = await createVercelProject({
  name: `magazine-${slug}-api`,
  framework: 'other',
  rootDirectory: 'server',
  buildCommand: 'npx prisma generate && npx prisma migrate deploy',
  installCommand: 'npm install',
  environmentVariables: [
    { key: 'DATABASE_URL', value: databaseUrl },
    { key: 'JWT_SECRET', value: generateSecret() },
    { key: 'NODE_ENV', value: 'production' },
    { key: 'ROVEX_API_URL', value: ROVEX_URL },
    { key: 'ROVEX_API_SECRET', value: communitySecret },
  ]
});
```

### 2. Criar Projeto Frontend
```typescript
const frontendProject = await createVercelProject({
  name: `magazine-${slug}`,
  framework: 'vite',
  rootDirectory: 'client',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  installCommand: 'npm install',
  environmentVariables: [
    { key: 'VITE_API_URL', value: `https://magazine-${slug}-api.vercel.app/api` },
  ]
});
```

### 3. Atualizar Rewrites do Frontend
O `vercel.json` do client precisa apontar para o backend correto:

```json
{
    "rewrites": [
        {
            "source": "/api/:path*",
            "destination": "https://magazine-${slug}-api.vercel.app/api/:path*"
        },
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

**Opção melhor:** Usar environment variable no build para gerar o vercel.json dinamicamente, ou passar via Vercel Project Settings.

---

## 📋 Variáveis Mínimas para Funcionar

### Backend (obrigatórias)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=random-secret-64-chars
NODE_ENV=production
```

### Frontend (obrigatórias)
```env
VITE_API_URL=https://api-url.vercel.app/api
```

### Para Integração Rovex (obrigatórias)
```env
ROVEX_API_URL=https://rovex-platform-production.up.railway.app
ROVEX_API_SECRET=community-specific-secret
```

---

## ❓ Dúvidas Adicionais?

Se precisar de mais detalhes sobre:
- Como o Prisma roda migrations no primeiro deploy
- Como configurar CORS entre frontend e backend
- Como funciona o sistema de feature gates
- Qualquer outra coisa

É só perguntar! 🚀

---

**Magazine SRT v0.5.0-rc.1**  
**Última atualização:** 31 de Janeiro de 2026
