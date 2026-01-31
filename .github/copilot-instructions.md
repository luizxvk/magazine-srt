# Magazine SRT - AI Coding Instructions

## Architecture Overview

Full-stack social platform with gamification. Monorepo with two main directories:
- **`client/`** - React 19 + Vite + TypeScript frontend (port 5173)
- **`server/`** - Express 5 + Prisma + PostgreSQL backend (port 3000)

All API routes are prefixed with `/api` (see [server/index.ts](../server/index.ts#L100-L133) for route registration).

## Key Conventions

### Frontend Patterns
- **State Management**: Uses React Context (`AuthContext`, `CommunityContext`, `RadioContext`) - no Redux/Zustand
- **API Client**: Single axios instance in [client/src/services/api.ts](../client/src/services/api.ts) with JWT interceptor
- **Styling**: TailwindCSS with custom gold/bronze palette and dark/light theme via `darkMode: 'class'`
- **Animations**: Framer Motion (`motion.*` components with `AnimatePresence` for enter/exit)
- **Icons**: Lucide React exclusively
- **Forms**: React Hook Form + Zod validation

### Backend Patterns
- **Route → Controller → Service** architecture in `server/src/{routes,controllers,services}/`
- **Auth Middleware**: `authenticateToken` and `isAdmin` in [authMiddleware.ts](../server/src/middleware/authMiddleware.ts)
- **Validation**: Zod schemas inline in controllers (see [authController.ts](../server/src/controllers/authController.ts#L14-L23))
- **Database**: Prisma singleton in [server/src/utils/prisma.ts](../server/src/utils/prisma.ts) - use `import prisma from '../utils/prisma'`

### Dual Currency System (Zions)
```typescript
// zionsPoints - Earned currency for cosmetics (100 points = 1 cash)
// zionsCash - Real money equivalent (1 cash = R$ 1.00)
// zions field is DEPRECATED - use zionsPoints or zionsCash
```

### User Membership Types
Two tiers that affect UI theming:
- `MAGAZINE` - Gold theme (#D4AF37)
- `MGT` (Elite/SRT) - Emerald/red theme

## Development Commands

```bash
# Client (from client/)
npm run dev          # Starts Vite dev server on :5173
npm run build        # Generates buildInfo.json + TypeScript compile + Vite build

# Server (from server/)
npm run dev          # nodemon + ts-node on :3000
npx prisma migrate dev --name <name>  # Create migration
npx prisma db push   # Quick schema sync (dev only)
npx prisma studio    # Database GUI
```

## Component Patterns

### Modal Pattern (common across codebase)
```tsx
// Always use AnimatePresence + motion.div with backdrop
<AnimatePresence>
  {isOpen && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}>
        {/* content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### Theme-Aware Styling
```tsx
const { theme, user } = useAuth();
const isMGT = user?.membershipType === 'MGT';
// Use conditional classes: isMGT ? 'text-emerald-400' : 'text-gold-400'
```

### API Calls Pattern
```tsx
// Always handle SESSION_EXPIRED (single-device login enforced)
try {
  const { data } = await api.get('/endpoint');
} catch (error) {
  // Error interceptor in api.ts handles session expiry automatically
}
```

## Key Files to Know

| Purpose | Location |
|---------|----------|
| User model & relations | [server/prisma/schema.prisma](../server/prisma/schema.prisma) |
| Gamification logic (XP, levels) | [server/src/services/gamificationService.ts](../server/src/services/gamificationService.ts) |
| Auth context (user state, theme) | [client/src/context/AuthContext.tsx](../client/src/context/AuthContext.tsx) |
| Route protection | `PrivateRoute`, `AdminRoute` components |
| Tailwind theme colors | [client/tailwind.config.js](../client/tailwind.config.js) |

## Testing & Deployment

- **No test framework configured** - manual testing via dev servers
- **Vercel deployment** - both client and server have `vercel.json`
- **Docker compose** provides PostgreSQL + Redis for local dev

## Common Gotchas

1. **Build info generation**: `npm run dev/build` in client auto-generates `src/buildInfo.json`
2. **File uploads**: Max 50MB, handled via Multer to `server/uploads/` or Cloudinary
3. **Session tokens**: Single-device login - new login invalidates previous session
4. **Prisma in serverless**: Uses singleton pattern to prevent connection exhaustion

---

## Multi-Tenant Architecture (Rovex Integration)

Magazine SRT é o **template base** usado pela Rovex Platform para gerar comunidades white-label.

### Modelo Híbrido
```
┌─────────────────────────────────────────────────────────┐
│                   ROVEX PLATFORM                         │
│  (Dashboard, Billing, Provisioning, Monitoring)          │
└───────────────────────────┬─────────────────────────────┘
                            │ Config + Webhooks
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  Magazine SRT │ │  GamerHub     │ │  FanClub      │
    │  (ENTERPRISE) │ │  (GROWTH)     │ │  (STARTER)    │
    │  DB Isolado   │ │  DB Isolado   │ │  DB Isolado   │
    └───────────────┘ └───────────────┘ └───────────────┘
             │               │               │
             └───────────────┴───────────────┘
                   Mesmo codebase (Vercel)
```

### Feature Gates System

```typescript
// Proteger endpoint no backend
import { requireFeature } from '../middleware/featureGateMiddleware';
import { Feature } from '../config/features.config';

router.get('/supply-box', 
  authenticateToken, 
  requireFeature(Feature.SUPPLY_BOX),  // 403 se plano não suporta
  controller.list
);
```

```tsx
// Proteger componente no frontend
import { FeatureGate } from '../components/FeatureGate';

<FeatureGate feature="SUPPLY_BOX" showUpgradePrompt>
  <SupplyBoxSection />
</FeatureGate>
```

### Nomenclaturas Dinâmicas

Não hardcode nomes - use `CommunityContext`:

```tsx
const { config, formatCurrency } = useCommunity();

// ❌ Errado
<span>500 Zions</span>

// ✅ Certo
<span>{formatCurrency(500)}</span>  // "Z$500" ou "🪙500" dependendo da comunidade

// ❌ Errado
<Badge>MAGAZINE</Badge>

// ✅ Certo
<Badge>{config.tierVipName}</Badge>  // "MAGAZINE" ou "VIP" ou "PRO"
```

### Key Files Multi-Tenant

| Arquivo | Descrição |
|---------|-----------|
| [server/src/config/community.config.ts](../server/src/config/community.config.ts) | Config da comunidade atual |
| [server/src/config/features.config.ts](../server/src/config/features.config.ts) | Enum de features e planos |
| [server/src/middleware/tenantMiddleware.ts](../server/src/middleware/tenantMiddleware.ts) | Detecção de comunidade |
| [server/src/middleware/featureGateMiddleware.ts](../server/src/middleware/featureGateMiddleware.ts) | Bloqueio de features |
| [server/src/routes/rovexRoutes.ts](../server/src/routes/rovexRoutes.ts) | Endpoints Rovex |
| [client/src/context/CommunityContext.tsx](../client/src/context/CommunityContext.tsx) | Config no React |
| [client/src/components/FeatureGate.tsx](../client/src/components/FeatureGate.tsx) | Gate de UI |
| [client/src/utils/features.ts](../client/src/utils/features.ts) | Definição de features |

### Ambiente Local vs Produção

```typescript
// Em dev local, sempre roda como Magazine SRT (ENTERPRISE)
if (process.env.NODE_ENV === 'development') {
  setCommunityConfig(DEFAULT_COMMUNITY_CONFIG);
}

// Em produção, detecta comunidade pelo subdomain
// gamerhub.comunidades.rovex.app → config do GamerHub
```

### Documentação de Integração

Ver [ROVEX_INTEGRATION_REQUIREMENTS.md](../ROVEX_INTEGRATION_REQUIREMENTS.md) para:
- Payload de provisioning
- Endpoints de métricas
- Webhooks suportados
- Modelo de autenticação
