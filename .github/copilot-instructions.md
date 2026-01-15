# Magazine SRT - AI Coding Agent Instructions

## Project Overview
**Magazine SRT** is a premium gamified social network for exclusive communities (Magazine and MGT/Machine Gold Team). Think "Facebook meets game progression" with dual membership tiers, virtual economy, and luxury theming.

### Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL (production) / SQLite (dev)
- **Key Libraries**: Zustand, React Router, Axios, Lucide icons

## Architecture Pattern: Dual-Membership Theming

### Membership Types (`membershipType` field)
- `MAGAZINE`: Gold theme (`#d4af37`), **VIP/Elite tier** - club exclusivo com benefícios premium
- `MGT`: Emerald/Red theme (`#10b981`), **Standard tier** - acesso básico à comunidade

**Critical**: UI components use conditional theming based on `user.membershipType === 'MGT'`:
```tsx
const isMGT = user?.membershipType === 'MGT';
const themeColor = isMGT ? 'text-emerald-500' : 'text-gold-400';
```

### Dynamic Accent Colors (User Customization)
Users can equip custom accent colors via `equippedColor` (stored as key like `color_cyan`):
- Resolved in [AuthContext.tsx](client/src/context/AuthContext.tsx) to hex values
- Access via `accentColor` from `useAuth()` hook
- Falls back to membership defaults if no custom color equipped

**Example**:
```tsx
const { accentColor } = useAuth(); // Returns hex like '#00ffff'
style={{ color: accentColor }}
```

## Virtual Economy System

### Three Currency Types
1. **XP (Experience)**: Leveling system using `XP_TABLE` curve in [gamificationService.ts](server/src/services/gamificationService.ts)
2. **Zions Points** (`zionsPoints`): Earned via engagement, used for customizations (100 points = 1 cash)
3. **Zions Cash** (`zionsCash`): Real money equivalent (1 cash = R$ 1.00)

**Deprecated**: `zions` field - use `zionsPoints`/`zionsCash` instead

### Reward Flows
- Daily login bonuses with streaks → [DailyLoginModal.tsx](client/src/components/DailyLoginModal.tsx)
- Engagement actions (post, like, comment) → Call gamification endpoints
- Level-up triggers system notifications in Prisma transaction

## Database Schema Patterns (Prisma)

### Key Models
- **User**: Core entity with membership, economy, customization fields
- **Post**: Social content with `linkedProductId` for store integration
- **UserThemePack**: Stores owned theme bundles (background + accent color pairs)
- **MarketListing**: P2P marketplace for user-to-user item trading

### Critical Relationships
```prisma
model User {
  themePacks UserThemePack[] // Owned theme bundles
  marketListings MarketListing[] @relation("MarketSeller")
  groupMemberships GroupMember[] @relation("UserGroupMemberships")
}
```

**Always** use Prisma transactions for multi-step operations (e.g., awarding XP + Zions together).

## Component Architecture

### Layout Structure (Facebook-style 3-column)
```
┌─────────────┬──────────────┬─────────────┐
│ LeftSidebar │ Feed (Center)│ RightSidebar│
│ (260px)     │ (max-2xl)    │ (320px)     │
│ Quick Links │ Posts/Content│ Tools/Store │
│ XP Progress │              │ Market      │
└─────────────┴──────────────┴─────────────┘
```
- Left sidebar: [LeftSidebar.tsx](client/src/components/LeftSidebar.tsx) - Navigation, user stats
- Right sidebar: [RecommendationsDrawer.tsx](client/src/components/RecommendationsDrawer.tsx) - Tools, store, inventory
- Main feed: [FeedPage.tsx](client/src/pages/FeedPage.tsx)

### Mobile Responsive Patterns
- Below `lg` (1024px): Sidebars collapse, show [MobileCarousel.tsx](client/src/components/MobileCarousel.tsx)
- Use Tailwind responsive prefixes: `hidden lg:block`, `max-lg:flex-col`

### Reusable Cards Pattern
Most feature cards follow this structure:
```tsx
<div className={`glass-panel rounded-xl border ${themeBorder}`}>
  <div className="p-4 border-b flex items-center gap-2">
    <Icon style={{ color: accentColor }} />
    <h3>Title</h3>
  </div>
  {/* Content */}
</div>
```
Where `glass-panel` provides backdrop-blur glassmorphism effect (see [index.css](client/src/index.css)).

## State Management

### AuthContext (Global User State)
[AuthContext.tsx](client/src/context/AuthContext.tsx) provides:
- `user`: Current user object with all profile/economy data
- `accentColor`, `backgroundStyle`: Resolved customization values
- `theme`: 'dark' | 'light' mode
- `updateUserPoints()`, `updateUserCash()`: Economy updaters
- `showAchievement()`: Toast-style achievement popups

**Always** destructure from `useAuth()` hook in components.

### API Communication
Use [api.ts](client/src/services/api.ts) instance (Axios with JWT interceptor):
```tsx
import api from '../services/api';
const response = await api.get('/users/profile');
```

## Development Workflows

### Running Locally
```powershell
# Terminal 1 - Backend
cd server
npm install
npx prisma migrate dev    # Sync database schema
npm run dev               # Starts on :3001

# Terminal 2 - Frontend  
cd client
npm install
npm run dev               # Starts on :5173
```

### Database Migrations
```powershell
cd server
npx prisma migrate dev --name descriptive_name
npx prisma generate       # Regenerate Prisma client
npx prisma studio         # Visual DB editor
```

### Build Info Generation
Frontend generates [buildInfo.json](client/src/buildInfo.json) via [generate-build-info.js](client/scripts/generate-build-info.js) before each build - displays version/date in footer.

## Code Conventions

### Naming Patterns
- Components: PascalCase (`DailyLoginModal.tsx`)
- Utilities/Services: camelCase (`gamificationService.ts`)
- API routes: kebab-case (`/api/daily-login`)
- Database fields: camelCase (`membershipType`, `zionsPoints`)

### Color Variables
Avoid hardcoded colors - use dynamic theming:
```tsx
// ❌ Bad
<div className="text-gold-500">

// ✅ Good - Responds to membership type
<div className={isMGT ? 'text-emerald-500' : 'text-gold-500'}>

// ✅ Best - Uses user's custom color
<div style={{ color: accentColor }}>
```

### TypeScript Patterns
- Use interface for public APIs, type for unions/intersections
- Leverage Prisma generated types: `import { User, Post } from '@prisma/client'`
- Prefer explicit return types for service functions

## Integration Points

### External Services
- **Cloudinary**: Image uploads via [cloudinaryService.ts](server/src/services/cloudinaryService.ts)
- **Cloudflare R2**: Alternative file storage ([r2Service.ts](server/src/services/r2Service.ts))
- **Nodemailer**: Email verification ([emailService.ts](server/src/services/emailService.ts))
- **MercadoPago**: Payment processing (⚠️ in development - not production ready)

### Social Platform Integrations
Integrated via OAuth with cards in [ToolsCarousel.tsx](client/src/components/ToolsCarousel.tsx):

**Discord** ([DiscordCard.tsx](client/src/components/DiscordCard.tsx)):
- OAuth flow: `/api/social/discord/auth` → callback → `/api/social/discord/callback`
- Displays user guilds and online status
- Requires: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`
- Full setup: [DISCORD_SETUP.md](DISCORD_SETUP.md)

**Steam** ([SteamCard.tsx](client/src/components/SteamCard.tsx)):
- Shows friends playing games and current activity
- Requires: `STEAM_API_KEY`, `STEAM_REALM`

**Twitch** ([TwitchCard.tsx](client/src/components/TwitchCard.tsx)):
- Live stream previews from followed channels
- API configuration in [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md)

All social connections stored in `SocialConnection` model with platform enum (`DISCORD`, `STEAM`, `TWITCH`).

### API Endpoints Structure
```
/api
├── /auth          - Login, register, reset password
├── /users         - Profile, friends, customizations
├── /posts         - CRUD, like, comment
├── /feed          - Aggregated content
├── /groups        - Chat groups, invites
├── /market        - P2P marketplace
├── /store         - Official product store
├── /gamification  - XP, badges, achievements
├── /supply-box    - Daily loot box system
├── /social        - Discord/Steam/Twitch OAuth
└── /withdrawals   - Zions Cash withdrawal requests
```

## Supply Box System (Loot Boxes)

Daily gacha-style reward system implemented in [supplyBoxController.ts](server/src/controllers/supplyBoxController.ts):

### Mechanics
- **Progressive cost**: First box daily is FREE, then 500/1000/2500/5000 Zions Points
- **Rarity drop rates**: Common (60%), Rare (25%), Epic (12%), Legendary (3%)
- **Duplicate protection**: Rewards Zions Points if user already owns the theme pack
- **Reset**: Counter resets daily at midnight

### Implementation Flow
1. User opens [SupplyBoxModal.tsx](client/src/components/SupplyBoxModal.tsx) from CustomizationShop
2. Frontend checks cost via `GET /api/supply-box/status`
3. Opens box via `POST /api/supply-box/open`
4. Backend:
   - Counts today's opens from `ZionHistory` with reason "Supply Box Open #X"
   - Deducts cost if > 0
   - Rolls rarity using accumulated probability
   - Selects random `ThemePack` of that rarity
   - Checks if user owns it (via `UserThemePack`)
   - Awards pack OR duplicate compensation Zions
5. Frontend displays animated result with [ThemePackCard.tsx](client/src/components/ThemePackCard.tsx)

### Database Models
```prisma
ThemePack {
  rarity: COMMON | RARE | EPIC | LEGENDARY
  backgroundStyle: string // Key for BACKGROUND_STYLES
  accentColor: string     // Key for ACCENT_COLORS
}

UserThemePack {
  userId + themePackId // Ownership record
}
```

## Admin Panel Features

### Access Control
Admin routes protected by `requireAdmin` or `isAdmin` middleware in [authMiddleware.ts](server/src/middleware/authMiddleware.ts):
- Checks `user.role === 'ADMIN'` from JWT payload
- Single-device session validation via `sessionToken`

### Admin Capabilities ([AdminDashboard.tsx](client/src/pages/AdminDashboard.tsx))

**User Management**:
- View all users with stats (XP, level, Zions, trophies)
- Toggle membership type (MAGAZINE ↔ MGT)
- Delete users
- Reset passwords
- Approve/reject invite requests

**Content Moderation**:
- Create official posts, announcements, events
- Manage rewards and badges
- Review feedback submissions via [AdminFeedbackCard.tsx](client/src/components/AdminFeedbackCard.tsx)

**Financial Controls**:
- Withdrawal request approval workflow (`/api/withdrawals/admin/*`)
- States: PENDING → PROCESSING → COMPLETED or REJECTED
- Zions Cash → Real money conversion (R$ 1.00 = 1 cash)

**Grid Dashboard**:
- Drag-and-drop widget system using `@dnd-kit`
- Real-time metrics: online users, total posts, pending moderation
- Customizable layout saved to localStorage

### Dev Tools ([DevToolsPage.tsx](client/src/pages/admin/DevToolsPage.tsx))
- Clear localStorage/cache
- Inspect API responses
- Debug mode toggles
- Access via `/dev-tools` route (admin-only)

## Common Tasks

### Adding a New Customization Item
1. Add entry to [ACCENT_COLORS](client/src/context/AuthContext.tsx) or `BACKGROUND_STYLES`
2. Seed to `Customization` table via [seed.ts](server/prisma/seed.ts)
3. Users purchase → stored in `ownedCustomizations` JSON array
4. Equip → updates `equippedColor`/`equippedBackground` fields

### Creating a New Theme Pack
1. Create entry in `ThemePack` table with rarity
2. Link `backgroundStyle` key and `accentColor` key
3. Automatically available in Supply Box drops
4. Preview shown in [ThemePackCard.tsx](client/src/components/ThemePackCard.tsx)

### Creating a New Feature Card
1. Create component in [client/src/components/](client/src/components/)
2. Import in [RecommendationsDrawer.tsx](client/src/components/RecommendationsDrawer.tsx) or [LeftSidebar.tsx](client/src/components/LeftSidebar.tsx)
3. Use `accentColor` from `useAuth()` for theming
4. Ensure mobile responsiveness with `max-lg:hidden` if needed

### Adding Social Platform Integration
1. Create OAuth app on platform (Discord/Steam/Twitch)
2. Add env vars: `PLATFORM_CLIENT_ID`, `PLATFORM_CLIENT_SECRET`, `PLATFORM_REDIRECT_URI`
3. Create route in [socialRoutes.ts](server/src/routes/socialRoutes.ts) following Discord pattern
4. Create frontend card component extending social card pattern
5. Add to [ToolsCarousel.tsx](client/src/components/ToolsCarousel.tsx) tabs
6. Store connection in `SocialConnection` model

### Debugging Authentication Issues
- Check JWT token in localStorage: `localStorage.getItem('token')`
- Verify token middleware in [authMiddleware.ts](server/src/middleware/authMiddleware.ts)
- Single-device login: Check if `sessionToken` matches in database
- Session expiry error code: `SESSION_EXPIRED` → show [SessionExpiredModal.tsx](client/src/components/SessionExpiredModal.tsx)
- Inspect Axios interceptor errors in [api.ts](client/src/services/api.ts)

## Deployment Notes
- Frontend deploys to Vercel (`client/` as root directory)
- Backend deploys separately to Vercel (`server/` as root directory)
- **Must** use PostgreSQL in production (SQLite is dev-only)
- Set environment variables per [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## Current Version & Roadmap
- **Version**: v0.4.2 (see [ROADMAP.md](ROADMAP.md))
- **Phase**: Beta (fixes de interface, Market, Cloudinary)
- Recent: Facebook-style layout, ToolsCarousel, theme packs, Supply Boxes
- Next: More social integrations, polish for RC (check [TODO.md](TODO.md))

---

# 🚀 ROVEX PLATFORM - Visão Futura (SaaS)

> **IMPORTANTE**: Esta seção documenta a arquitetura futura. O código atual (Magazine SRT) é a **primeira comunidade** que servirá como template/base para o SaaS.

## Conceito Geral

O **Magazine SRT** é a primeira implementação de uma comunidade gamificada. Na fase final, este projeto evoluirá para o **Rovex Platform** - uma plataforma SaaS que permite qualquer pessoa criar sua própria comunidade gamificada.

### Hierarquia de Projetos
```
📁 Projetos Rovex
├── 📁 magazine-srt-react/     ← ATUAL - Primeira comunidade (template)
│   ├── client/
│   └── server/
│
└── 📁 rovex-platform/         ← FUTURO - Dashboard SaaS (projeto separado)
    ├── client/                 (painel admin rovex.io)
    └── server/                 (API de provisionamento)
```

## Arquitetura Multi-Tenant

### Visão Geral
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROVEX PLATFORM (rovex.io)                       │
│                                                                         │
│  Dashboard Principal:                                                   │
│  • Criar nova comunidade (wizard de configuração)                       │
│  • Monitorar comunidades ativas                                         │
│  • Billing/Pagamentos dos clientes                                      │
│  • Analytics global (usuários totais, receita, etc)                     │
│  • Provisionar banco de dados novo automaticamente                      │
│  • Gerenciamento de planos/preços                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API de Provisionamento
                                    │ (cria DB, configura domínio, aplica template)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMUNIDADES (Tenants Separados)                      │
│                                                                         │
│  magazine.rovex.io       │  gaming.rovex.io      │  arte.rovex.io       │
│  ┌─────────────────┐     │  ┌─────────────────┐  │  ┌─────────────────┐ │
│  │ DB: magazine_db │     │  │ DB: gaming_db   │  │  │ DB: arte_db     │ │
│  │ Admin: Luiz     │     │  │ Admin: João     │  │  │ Admin: Ana      │ │
│  │ VIP: MAGAZINE   │     │  │ VIP: PRO        │  │  │ VIP: PREMIUM    │ │
│  │ STD: MGT        │     │  │ STD: FREE       │  │  │ STD: BASIC      │ │
│  │ Tema: Gold/Red  │     │  │ Tema: Blue/Gray │  │  │ Tema: Purple    │ │
│  └─────────────────┘     │  └─────────────────┘  │  └─────────────────┘ │
│                          │                       │                      │
│  Membros, Eventos,       │  Membros, Eventos,    │  Membros, Eventos,   │
│  Interações, Rewards,    │  Interações, Rewards, │  Interações, Rewards │
│  Socialização            │  Socialização         │  Socialização        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Isolamento de Dados
- **Cada comunidade = Banco de dados separado** (não apenas `communityId`)
- Dados sensíveis criptografados (senhas, tokens OAuth)
- Super Admin (Rovex) vê métricas mas NÃO acessa dados sensíveis dos usuários
- Backup e restore independente por comunidade

### Domínios e Branding
- Padrão: `{nome-comunidade}.rovex.io`
- Cada comunidade pode personalizar:
  - Logo e favicon
  - Cores dos tiers (VIP/Standard)
  - Nome dos tiers (ex: "MAGAZINE"/"MGT" ou "PRO"/"FREE")
  - Nome da moeda virtual (ex: "Zions" ou outro)
  - Backgrounds e temas disponíveis

## Níveis de Acesso (Roles)

| Role | Escopo | Permissões | Exemplo |
|------|--------|------------|----------|
| `SUPER_ADMIN` | Rovex Global | Dashboard Rovex, criar/suspender comunidades, ver métricas globais, billing | Dono da Rovex |
| `COMMUNITY_OWNER` | Uma comunidade | Acesso total à própria comunidade, configurações, ver dados de usuários | Cliente pagante |
| `COMMUNITY_ADMIN` | Uma comunidade | Gerenciar usuários, conteúdo, rewards, eventos | Staff do cliente |
| `COMMUNITY_MOD` | Uma comunidade | Moderar posts, aprovar conteúdo, banir usuários | Moderadores |
| `MEMBER_VIP` | Uma comunidade | Acesso premium, benefícios exclusivos | Membro pagante |
| `MEMBER_STD` | Uma comunidade | Acesso básico | Membro gratuito |

### Restrições do Super Admin (Rovex)
```typescript
// O Super Admin pode:
✅ Ver lista de comunidades e métricas (total usuários, posts, receita)
✅ Suspender/reativar comunidades
✅ Ver logs de acesso (quem logou quando)
✅ Gerenciar billing e planos

// O Super Admin NÃO pode:
❌ Ver senhas de usuários (hash bcrypt)
❌ Ler mensagens privadas entre usuários
❌ Acessar tokens OAuth dos usuários
❌ Modificar dados de usuários diretamente
```

## Fluxo de Criação de Comunidade

```
1. Cliente acessa rovex.io e escolhe plano
                    │
                    ▼
2. Wizard de configuração:
   • Nome da comunidade
   • Subdomínio desejado (verifica disponibilidade)
   • Upload de logo
   • Escolha de tema base (cores)
   • Nome dos tiers (VIP/Standard)
   • Nome da moeda virtual
   • Integrações desejadas (Discord, Steam, etc)
                    │
                    ▼
3. Processamento de pagamento
                    │
                    ▼
4. Provisionamento automático:
   • Cria banco de dados PostgreSQL novo
   • Roda migrations do Prisma
   • Configura subdomínio DNS
   • Aplica configurações do wizard
   • Cria conta admin para o cliente
   • Envia email de boas-vindas com credenciais
                    │
                    ▼
5. Comunidade online em {nome}.rovex.io
```

## Comunicação Rovex ↔ Comunidades (API Architecture)

### Visão Geral da Integração
```
┌─────────────────────┐         ┌─────────────────────┐
│   ROVEX PLATFORM    │         │    COMUNIDADE X     │
│   (rovex.io)        │         │  (x.rovex.io)       │
│                     │         │                     │
│  ┌───────────────┐  │  HTTP   │  ┌───────────────┐  │
│  │ Provisioning  │◄─┼────────►│  │ Health API    │  │
│  │ Service       │  │         │  │ /api/rovex/*  │  │
│  └───────────────┘  │         │  └───────────────┘  │
│                     │         │                     │
│  ┌───────────────┐  │  HTTP   │  ┌───────────────┐  │
│  │ Metrics       │◄─┼────────►│  │ Stats API     │  │
│  │ Collector     │  │         │  │ /api/rovex/*  │  │
│  └───────────────┘  │         │  └───────────────┘  │
│                     │         │                     │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │ Central DB    │  │         │  │ Community DB  │  │
│  │ (metadata)    │  │         │  │ (user data)   │  │
│  └───────────────┘  │         │  └───────────────┘  │
└─────────────────────┘         └─────────────────────┘
```

### Endpoints que Comunidades DEVEM Expor para Rovex

Cada comunidade precisa implementar endpoints especiais para comunicação com a plataforma mãe:

```typescript
// server/src/routes/rovexRoutes.ts (adicionar em cada comunidade)

// 1. Health Check - Rovex verifica se comunidade está online
GET /api/rovex/health
Response: { status: 'ok', version: '0.4.2', uptime: 123456 }

// 2. Métricas Agregadas - Rovex coleta para dashboard global
GET /api/rovex/metrics
Headers: { 'X-Rovex-Secret': 'shared_secret_key' }
Response: {
  totalUsers: 1500,
  activeUsers24h: 342,
  totalPosts: 8900,
  totalTransactions: 2300,
  storageUsedMB: 4500,
  lastActivity: '2026-01-14T12:00:00Z'
}

// 3. Configuração Remota - Rovex pode atualizar configs
POST /api/rovex/config
Headers: { 'X-Rovex-Secret': 'shared_secret_key' }
Body: { maintenanceMode: true, announcement: '...' }

// 4. Suspensão de Emergência - Rovex pode desativar comunidade
POST /api/rovex/suspend
Headers: { 'X-Rovex-Secret': 'shared_secret_key' }
Body: { reason: 'Payment failed', suspendedAt: '...' }

// 5. Logs de Auditoria - Rovex solicita logs de acesso
GET /api/rovex/audit-logs?from=2026-01-01&to=2026-01-14
Headers: { 'X-Rovex-Secret': 'shared_secret_key' }
Response: [{ userId, action, timestamp, ip }]
```

### Autenticação entre Rovex e Comunidades

```typescript
// Cada comunidade terá uma SECRET compartilhada com Rovex
// Configurada como variável de ambiente durante provisionamento

// .env da comunidade
ROVEX_PLATFORM_SECRET=sk_live_xxxxx  // Gerado pelo Rovex
ROVEX_PLATFORM_URL=https://rovex.io

// Middleware de autenticação para rotas /api/rovex/*
const verifyRovexRequest = (req, res, next) => {
  const secret = req.headers['x-rovex-secret'];
  if (secret !== process.env.ROVEX_PLATFORM_SECRET) {
    return res.status(403).json({ error: 'Invalid Rovex secret' });
  }
  next();
};
```

### Banco de Dados Central Rovex (Schema)

```prisma
// rovex-platform/prisma/schema.prisma

model Community {
  id              String   @id @default(uuid())
  name            String
  subdomain       String   @unique  // "magazine" -> magazine.rovex.io
  status          CommunityStatus @default(ACTIVE)
  
  // Conexão com DB da comunidade
  databaseUrl     String   // URL do PostgreSQL da comunidade (criptografado)
  databaseHost    String
  databaseName    String
  
  // Configurações
  config          Json     // { tierVipName, tierStdName, currencyName, etc }
  logoUrl         String?
  primaryColor    String   @default("#d4af37")
  secondaryColor  String   @default("#10b981")
  
  // Owner (cliente pagante)
  ownerId         String
  owner           RovexUser @relation(fields: [ownerId], references: [id])
  
  // Billing
  plan            Plan     @default(STARTER)
  billingCycle    BillingCycle @default(MONTHLY)
  nextBillingDate DateTime
  
  // Métricas (cache das últimas coletadas)
  lastMetrics     Json?
  lastHealthCheck DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model RovexUser {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          RovexRole @default(COMMUNITY_OWNER)
  communities   Community[]
  
  createdAt     DateTime @default(now())
}

enum CommunityStatus {
  ACTIVE
  SUSPENDED
  PENDING_PAYMENT
  MAINTENANCE
  DELETED
}

enum Plan {
  STARTER     // Até 500 usuários
  GROWTH      // Até 2000 usuários
  ENTERPRISE  // Ilimitado
}

enum RovexRole {
  SUPER_ADMIN      // Você (dono da Rovex)
  COMMUNITY_OWNER  // Cliente pagante
  SUPPORT          // Staff de suporte
}
```

### Fluxo de Comunicação em Tempo Real

```
CENÁRIO: Rovex precisa coletar métricas de todas comunidades

1. Cron Job no Rovex (a cada 5 minutos):
   ┌─────────────────────────────────────────────┐
   │  for each community in activeCommunnities:  │
   │    fetch(`${community.url}/api/rovex/metrics`) │
   │    → salva em community.lastMetrics         │
   │    → atualiza lastHealthCheck               │
   └─────────────────────────────────────────────┘

2. Se comunidade não responder:
   ┌─────────────────────────────────────────────┐
   │  → Marca como unhealthy                     │
   │  → Envia alerta para SUPER_ADMIN            │
   │  → Após 3 falhas: notifica COMMUNITY_OWNER  │
   └─────────────────────────────────────────────┘

3. Dashboard Rovex exibe:
   ┌─────────────────────────────────────────────┐
   │  📊 Métricas Globais (soma de todas)        │
   │  • Total usuários: 45.000                   │
   │  • Comunidades ativas: 32                   │
   │  • Receita mensal: R$ 12.400                │
   │                                             │
   │  🟢 magazine.rovex.io - 1.500 users - OK    │
   │  🟢 gaming.rovex.io - 3.200 users - OK      │
   │  🔴 arte.rovex.io - OFFLINE há 5min         │
   └─────────────────────────────────────────────┘
```

### Webhooks: Comunidade → Rovex

Comunidades também podem notificar Rovex sobre eventos importantes:

```typescript
// Eventos que a comunidade envia para Rovex

// Quando usuário faz upgrade de tier
POST https://rovex.io/api/webhooks/community
{
  "communityId": "xxx",
  "event": "USER_UPGRADED",
  "data": { "userId": "...", "newTier": "VIP" }
}

// Quando admin da comunidade altera configs
POST https://rovex.io/api/webhooks/community
{
  "communityId": "xxx",
  "event": "CONFIG_CHANGED",
  "data": { "field": "currencyName", "newValue": "Coins" }
}

// Quando há erro crítico
POST https://rovex.io/api/webhooks/community
{
  "communityId": "xxx",
  "event": "CRITICAL_ERROR",
  "data": { "error": "Database connection lost", "timestamp": "..." }
}
```

### Preparação do Código Atual (Magazine)

Para facilitar a integração futura, ao desenvolver novas features, considere:

```typescript
// ✅ BOM: Criar arquivo separado para rotas Rovex
// server/src/routes/rovexRoutes.ts (criar quando começar SaaS)

// ✅ BOM: Usar constantes para valores configuráveis
// server/src/config/community.ts
export const COMMUNITY_CONFIG = {
  name: process.env.COMMUNITY_NAME || 'Magazine SRT',
  currency: process.env.CURRENCY_NAME || 'Zions',
  tierVip: process.env.TIER_VIP_NAME || 'MAGAZINE',
  tierStd: process.env.TIER_STD_NAME || 'MGT',
};

// ✅ BOM: Abstrair métricas em serviço reutilizável
// server/src/services/metricsService.ts
export const getMetrics = async () => ({
  totalUsers: await prisma.user.count(),
  activeUsers24h: await prisma.user.count({ 
    where: { lastSeenAt: { gte: oneDayAgo } }
  }),
  totalPosts: await prisma.post.count(),
  // ...
});
```

## Stack Técnico Planejado

### Rovex Platform (rovex.io)
```
Frontend:
├── Next.js 14+ (App Router)
├── TypeScript
├── TailwindCSS
└── Shadcn/UI (componentes)

Backend:
├── Node.js + Express (ou tRPC)
├── Prisma ORM
└── PostgreSQL (banco central Rovex)

Infra:
├── Vercel (frontend + API routes)
├── Supabase/Neon (databases das comunidades)
├── Cloudflare R2 (storage)
└── Stripe (pagamentos)
```

### Template de Comunidade (baseado no Magazine)
```
Reutiliza 90% do código atual:
├── React 19 + Vite + TypeScript
├── TailwindCSS + Framer Motion
├── Express + Prisma
└── PostgreSQL

Variáveis configuráveis por comunidade:
├── COMMUNITY_NAME
├── COMMUNITY_LOGO_URL
├── TIER_VIP_NAME (ex: "MAGAZINE")
├── TIER_STD_NAME (ex: "MGT")
├── TIER_VIP_COLOR (ex: "#d4af37")
├── TIER_STD_COLOR (ex: "#10b981")
├── CURRENCY_NAME (ex: "Zions")
├── CURRENCY_SYMBOL (ex: "Z$")
└── ENABLED_FEATURES[] (Discord, Steam, Twitch, etc)
```

## Roadmap de Desenvolvimento

### Fase Alpha ✅ (Concluído)
- [x] Sistema base implementado
- [x] Social/Messages funcionando
- [x] Frontend/Backend development
- [x] Database creation / Pipeline
- [x] Base website system ready

### Fase Beta 🔄 (Atual - Janeiro 2026)
- [x] Fixes de interface
- [x] Correções de Auth
- [ ] Market visual improvements
- [ ] Customization polish
- [ ] Cloudinary implementation completa
- [ ] Final Beta Version

### Fase RC ⏳ (Próxima)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation completa
- [ ] Testes de carga
- [ ] Final Version do Magazine

### Fase SaaS 🚀 (Futuro)
- [ ] Criar projeto `rovex-platform/` separado
- [ ] Dashboard de gerenciamento
- [ ] Sistema de provisionamento automático
- [ ] Billing integration (Stripe)
- [ ] Multi-tenant deployment
- [ ] Wildcard DNS configuration
- [ ] Template system baseado no Magazine

## Considerações para Desenvolvimento Atual

Ao desenvolver novas features no Magazine SRT, considere:

1. **Configurabilidade**: Evite hardcode de nomes ("Magazine", "MGT", "Zions"). Use constantes que possam virar variáveis de ambiente.

2. **Isolamento**: Mantenha lógica de negócio separada de UI para facilitar reutilização.

3. **Documentação**: Comente código complexo pensando que outros devs/IAs precisarão entender.

4. **Abstração de cores**: Use o sistema de `accentColor` e theming existente - já está preparado para customização.

Exemplo de código "SaaS-ready":
```tsx
// ❌ Hardcoded (difícil de customizar)
<h1>Bem-vindo ao Magazine!</h1>
<span>Você tem 100 Zions</span>

// ✅ Configurável (pronto para SaaS)
<h1>Bem-vindo ao {COMMUNITY_NAME}!</h1>
<span>Você tem 100 {CURRENCY_NAME}</span>
```

---

## Key Files Reference
- Theme colors: [AuthContext.tsx](client/src/context/AuthContext.tsx#L75-L124)
- XP leveling logic: [gamificationService.ts](server/src/services/gamificationService.ts#L5-L20)
- Main routes: [App.tsx](client/src/App.tsx)
- Prisma schema: [schema.prisma](server/prisma/schema.prisma)
- API entry point: [index.ts](server/index.ts)
