# Rovex Platform - AI Coding Agent Instructions

## Project Overview
**Rovex Platform** is a SaaS platform for managing multiple gamified communities. It serves as a central hub where community owners can monitor, configure, and manage their communities from a single dashboard.

### Tech Stack
- **Frontend**: Next.js 14+ (App Router) + TypeScript + TailwindCSS + Shadcn/UI
- **Backend**: Node.js + Express (or tRPC) + TypeScript + Prisma ORM
- **Database**: PostgreSQL (central Rovex database)
- **Payments**: Stripe (subscriptions & billing)
- **Deployment**: Vercel (frontend) + Railway (backend)

## Architecture Overview

### Multi-Tenant Model
```
┌─────────────────────────────────────────────────────────────────┐
│                    ROVEX PLATFORM (rovex.io)                    │
│                                                                 │
│  • Dashboard for community owners                               │
│  • Billing & subscription management                            │
│  • Global metrics aggregation                                   │
│  • Community provisioning system                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API Calls
                              ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Community A    │  │  Community B    │  │  Community C    │
│  (separate DB)  │  │  (separate DB)  │  │  (separate DB)  │
│                 │  │                 │  │                 │
│ /api/rovex/*    │  │ /api/rovex/*    │  │ /api/rovex/*    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Data Isolation
- **Each community has its own database** (not just a `communityId` field)
- Rovex stores only metadata about communities (URL, status, billing info)
- Sensitive user data stays in community databases
- Rovex collects only aggregated metrics

## Database Schema (Rovex Central DB)

### Core Models

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model RovexUser {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String
  name          String
  role          RovexRole   @default(COMMUNITY_OWNER)
  
  communities   Community[]
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Community {
  id              String            @id @default(uuid())
  name            String
  subdomain       String            @unique  // "magazine" -> magazine.rovex.io
  baseUrl         String            // Full URL: https://magazine-srt.vercel.app
  apiSecret       String            // Secret for authenticating with community API
  
  status          CommunityStatus   @default(PENDING_SETUP)
  
  // Owner relationship
  ownerId         String
  owner           RovexUser         @relation(fields: [ownerId], references: [id])
  
  // Customization (synced to community)
  config          Json?             // { tiers, currency, theme }
  logoUrl         String?
  
  // Billing
  plan            Plan              @default(STARTER)
  billingCycle    BillingCycle      @default(MONTHLY)
  stripeCustomerId    String?
  stripeSubscriptionId String?
  nextBillingDate DateTime?
  
  // Cached metrics (updated periodically)
  lastMetrics     Json?
  lastHealthCheck DateTime?
  healthStatus    HealthStatus      @default(UNKNOWN)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

enum RovexRole {
  SUPER_ADMIN       // Rovex platform owner (you)
  SUPPORT           // Rovex support staff
  COMMUNITY_OWNER   // Paying customer
}

enum CommunityStatus {
  PENDING_SETUP     // Waiting for initial configuration
  ACTIVE            // Running normally
  SUSPENDED         // Payment failed or ToS violation
  MAINTENANCE       // Temporary maintenance mode
  DELETED           // Soft deleted
}

enum HealthStatus {
  HEALTHY           // All checks passing
  DEGRADED          // Some issues detected
  DOWN              // Community unreachable
  UNKNOWN           // Not yet checked
}

enum Plan {
  STARTER           // Up to 500 users, $29/mo
  GROWTH            // Up to 2000 users, $79/mo
  ENTERPRISE        // Unlimited, $199/mo
}

enum BillingCycle {
  MONTHLY
  YEARLY
}
```

## API Communication with Communities

### Authentication
All requests to community APIs include:
```
Headers:
  x-rovex-secret: <community.apiSecret>
  Content-Type: application/json
```

### Community Endpoints (that Rovex calls)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rovex/health` | Check if community is online |
| GET | `/api/rovex/metrics` | Fetch aggregated metrics |
| PUT | `/api/rovex/config` | Push configuration updates |
| POST | `/api/rovex/webhook` | Send events (suspension, etc) |

### Expected Response Formats

**Health Check Response:**
```json
{
  "status": "ok",
  "database": true,
  "cache": true,
  "version": "0.4.2",
  "timestamp": "2026-01-14T20:30:00.000Z"
}
```

**Metrics Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "activeUsers24h": 342,
    "totalPosts": 8900,
    "totalTransactions": 2300,
    "storageUsedMB": 4500,
    "lastActivity": "2026-01-14T20:30:00.000Z"
  }
}
```

## Services Architecture

### CommunityService
```typescript
// src/services/communityService.ts

import prisma from '@/lib/prisma';
import { generateApiSecret } from '@/utils/crypto';

export const communityService = {
  // Create new community
  async create(data: { name: string; subdomain: string; ownerId: string }) {
    const apiSecret = generateApiSecret(); // sk_live_xxxxx
    
    return prisma.community.create({
      data: {
        ...data,
        apiSecret,
        baseUrl: `https://${data.subdomain}.rovex.io`, // or custom URL
      }
    });
  },
  
  // Fetch health from community
  async checkHealth(communityId: string) {
    const community = await prisma.community.findUnique({
      where: { id: communityId }
    });
    
    if (!community) throw new Error('Community not found');
    
    try {
      const response = await fetch(`${community.baseUrl}/api/rovex/health`, {
        headers: { 'x-rovex-secret': community.apiSecret }
      });
      
      const data = await response.json();
      
      await prisma.community.update({
        where: { id: communityId },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: data.status === 'ok' ? 'HEALTHY' : 'DEGRADED'
        }
      });
      
      return data;
    } catch (error) {
      await prisma.community.update({
        where: { id: communityId },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: 'DOWN'
        }
      });
      throw error;
    }
  },
  
  // Fetch metrics from community
  async fetchMetrics(communityId: string) {
    const community = await prisma.community.findUnique({
      where: { id: communityId }
    });
    
    if (!community) throw new Error('Community not found');
    
    const response = await fetch(`${community.baseUrl}/api/rovex/metrics`, {
      headers: { 'x-rovex-secret': community.apiSecret }
    });
    
    const { data } = await response.json();
    
    await prisma.community.update({
      where: { id: communityId },
      data: { lastMetrics: data }
    });
    
    return data;
  },
  
  // Push config to community
  async pushConfig(communityId: string, config: object) {
    const community = await prisma.community.findUnique({
      where: { id: communityId }
    });
    
    if (!community) throw new Error('Community not found');
    
    await fetch(`${community.baseUrl}/api/rovex/config`, {
      method: 'PUT',
      headers: {
        'x-rovex-secret': community.apiSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    await prisma.community.update({
      where: { id: communityId },
      data: { config }
    });
  },
  
  // Send webhook event to community
  async sendWebhook(communityId: string, event: string, data: object) {
    const community = await prisma.community.findUnique({
      where: { id: communityId }
    });
    
    if (!community) throw new Error('Community not found');
    
    await fetch(`${community.baseUrl}/api/rovex/webhook`, {
      method: 'POST',
      headers: {
        'x-rovex-secret': community.apiSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString()
      })
    });
  }
};
```

### MetricsCollectorService
```typescript
// src/services/metricsCollector.ts

import prisma from '@/lib/prisma';
import { communityService } from './communityService';

export const metricsCollector = {
  // Run every 5 minutes via cron
  async collectAllMetrics() {
    const communities = await prisma.community.findMany({
      where: { status: 'ACTIVE' }
    });
    
    const results = await Promise.allSettled(
      communities.map(c => communityService.fetchMetrics(c.id))
    );
    
    // Log failures for monitoring
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to collect metrics for ${communities[index].name}:`, result.reason);
      }
    });
  },
  
  // Get aggregated global metrics
  async getGlobalMetrics() {
    const communities = await prisma.community.findMany({
      where: { status: 'ACTIVE' },
      select: { lastMetrics: true }
    });
    
    return communities.reduce((acc, c) => {
      const metrics = c.lastMetrics as any;
      if (!metrics) return acc;
      
      return {
        totalUsers: acc.totalUsers + (metrics.totalUsers || 0),
        totalPosts: acc.totalPosts + (metrics.totalPosts || 0),
        totalTransactions: acc.totalTransactions + (metrics.totalTransactions || 0),
        activeCommunities: acc.activeCommunities + 1
      };
    }, { totalUsers: 0, totalPosts: 0, totalTransactions: 0, activeCommunities: 0 });
  }
};
```

## Dashboard Pages Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx              # Sidebar + header layout
│   ├── page.tsx                # Overview dashboard
│   ├── communities/
│   │   ├── page.tsx            # List all communities
│   │   ├── new/page.tsx        # Create new community wizard
│   │   └── [id]/
│   │       ├── page.tsx        # Community details
│   │       ├── settings/page.tsx
│   │       └── metrics/page.tsx
│   ├── billing/
│   │   └── page.tsx            # Subscription management
│   └── settings/
│       └── page.tsx            # Account settings
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── communities/
│   │   ├── route.ts            # CRUD communities
│   │   └── [id]/
│   │       ├── health/route.ts
│   │       ├── metrics/route.ts
│   │       └── config/route.ts
│   ├── billing/
│   │   └── webhook/route.ts    # Stripe webhooks
│   └── cron/
│       └── metrics/route.ts    # Vercel cron endpoint
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/rovex_db"

# Auth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://rovex.io

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_GROWTH=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx

# App
APP_URL=https://rovex.io
```

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full access, can view all communities, manage support staff |
| `SUPPORT` | Can view community status, help with troubleshooting |
| `COMMUNITY_OWNER` | Can only see/manage their own communities |

### Access Control Pattern
```typescript
// middleware.ts or in API routes
export function requireRole(allowedRoles: RovexRole[]) {
  return async (req: Request) => {
    const session = await getServerSession();
    if (!session?.user) return unauthorized();
    
    const user = await prisma.rovexUser.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user || !allowedRoles.includes(user.role)) {
      return forbidden();
    }
    
    return user;
  };
}

// Usage in API route
export async function GET(req: Request) {
  const user = await requireRole(['SUPER_ADMIN', 'COMMUNITY_OWNER'])(req);
  // ...
}
```

## Cron Jobs (Vercel Cron)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/metrics",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## First Integrated Community

### Magazine SRT
- **URL**: `https://magazine-srt.vercel.app`
- **Endpoints implemented**:
  - `GET /api/rovex/health`
  - `GET /api/rovex/metrics`
  - `PUT /api/rovex/config`
  - `POST /api/rovex/webhook`

When adding Magazine SRT as a community:
1. Generate API secret
2. Create community record with baseUrl
3. Send the API secret to Magazine admin
4. They configure it in their `.env` as `ROVEX_API_SECRET`
5. Test connection via health check

## UI Components (Shadcn/UI)

Common components to use:
- `Card` - Community cards, metric cards
- `DataTable` - Community list, user list
- `Dialog` - Create community modal
- `Tabs` - Community detail sections
- `Badge` - Status indicators
- `Chart` (recharts) - Metrics visualization

### Status Badge Pattern
```tsx
const statusColors = {
  HEALTHY: 'bg-green-500',
  DEGRADED: 'bg-yellow-500',
  DOWN: 'bg-red-500',
  UNKNOWN: 'bg-gray-500'
};

function HealthBadge({ status }: { status: HealthStatus }) {
  return (
    <Badge className={statusColors[status]}>
      {status}
    </Badge>
  );
}
```

## Code Conventions

### Naming
- Files: kebab-case (`community-service.ts`)
- Components: PascalCase (`CommunityCard.tsx`)
- Functions/variables: camelCase
- Database models: PascalCase (Prisma convention)

### API Responses
```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: 'Error message' }
```

### Error Handling
```typescript
try {
  // ...
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { success: false, error: 'Operation failed' },
    { status: 500 }
  );
}
```

## Development Workflow

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Run development server
npm run dev

# Open Prisma Studio
npx prisma studio
```

## Key Integration Points

### Adding a New Community
1. Owner signs up / logs in
2. Goes to "Create Community" wizard
3. Enters: name, subdomain, baseUrl
4. System generates `apiSecret`
5. Owner receives secret to configure in their community
6. Rovex tests connection via `/api/rovex/health`
7. If successful, status changes to `ACTIVE`

### Suspending a Community
1. Payment fails or ToS violation detected
2. Update `status` to `SUSPENDED`
3. Call community webhook: `{ event: 'community.suspended', data: { reason: '...' } }`
4. Community should block new logins and show maintenance message

### Reactivating
1. Payment resolved or issue fixed
2. Update `status` to `ACTIVE`
3. Call webhook: `{ event: 'community.reactivated' }`

---

## Current Priority Tasks

1. **Setup Next.js project** with App Router
2. **Implement auth** (NextAuth.js or custom)
3. **Create Prisma schema** and run migrations
4. **Build dashboard layout** with sidebar
5. **Implement community CRUD** pages
6. **Add health check system** with cron jobs
7. **Integrate Stripe** for billing
8. **Add Magazine SRT** as first community

---

## Reference URLs

- **Rovex Admin Panel**: https://rovex-hub.vercel.app
- **Rovex API**: https://rovex-platform-production.up.railway.app
- **First Community (Magazine)**: https://magazine-srt.vercel.app
