# 💎 Magazine SRT - Plataforma Social Gamificada

<div align="center">

![Version](https://img.shields.io/badge/version-0.5.0--rc.1-gold)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

**A plataforma social premium com gamificação avançada, economia virtual e personalização extrema.**

[🌐 Acessar Plataforma](https://magazine-mgt.vercel.app) • [📱 Download Android](https://ionic.io/appflow)

</div>

---

## 📋 Sobre o Projeto

O **Magazine SRT** é uma plataforma de comunidade social completa, desenvolvida com foco em **exclusividade**, **gamificação** e **engajamento**. Combina elementos de redes sociais com mecânicas de jogos para criar uma experiência única.

### 🎯 Principais Diferenciais

- **💰 Economia Virtual Dual**: Sistema de Zions Points (customização) e Zions Cash (conversível em dinheiro real)
- **🎮 Gamificação Profunda**: XP, níveis, badges, ranking, streaks e Supply Box
- **🎨 Personalização Extrema**: Backgrounds animados, cores de destaque, Theme Packs de jogos
- **👥 Dual Membership**: Dois tiers (MAGAZINE e MGT) com experiências visuais distintas
- **📱 Multiplataforma**: Web (PWA) + App Android nativo via Capacitor

---

## 🚀 Funcionalidades

### 🌟 Social
| Feature | Descrição |
|---------|-----------|
| **Feed Interativo** | Posts com imagem, vídeo e enquetes com curtidas/comentários |
| **Stories 24h** | Publicações temporárias com visualizações |
| **Chat Privado** | Mensagens diretas em tempo real com imagens |
| **Grupos de Chat** | Comunidades internas com roles (Admin/Mod/Member) |
| **Sistema de Amizades** | Solicitações, lista de amigos, status online |
| **Catálogo de Fotos** | Galeria com categorias e favoritos |

### 🎮 Gamificação
| Feature | Descrição |
|---------|-----------|
| **Sistema de XP** | Ganhe experiência por ações na plataforma |
| **30 Níveis** | Progressão com rewards por level up |
| **40+ Badges** | Conquistas desbloqueáveis por metas |
| **Ranking Global** | Leaderboard competitivo por troféus |
| **Bônus Diário** | Streak rewards de 1-7 dias (50-500 Zions) |
| **Troféus** | Sistema de prestígio paralelo ao XP |

### 💰 Economia Virtual

```
┌─────────────────────────────────────────────────────────────┐
│                    DUAL CURRENCY SYSTEM                      │
├─────────────────────────────┬───────────────────────────────┤
│       ZIONS POINTS          │         ZIONS CASH            │
│  (Moeda de Customização)    │    (Moeda Real)               │
├─────────────────────────────┼───────────────────────────────┤
│  • Ganha por engajamento    │  • Compra via PIX/Cartão      │
│  • Compra backgrounds       │  • Conversível para PIX       │
│  • Compra cores             │  • Compra produtos na loja    │
│  • Supply Box               │  • Marketplace P2P            │
│  • 100 points = 1 cash      │  • 1 cash = R$ 1,00           │
└─────────────────────────────┴───────────────────────────────┘
```

### 🎁 Supply Box
- **Caixa Gratuita**: 1x por dia
- **Compra Adicional**: Preço progressivo (100 → 200 → 500 Zions)
- **Raridades**: Comum, Raro, Épico, Lendário
- **Drops**: Backgrounds, cores, badges, Theme Packs
- **Compensação**: +50 Zions por item duplicado

### 🎨 Personalização

| Item | Descrição | Onde Comprar |
|------|-----------|--------------|
| **Backgrounds Animados** | Aurora, Cyberpunk, Lava, Rainbow Skies... | Loja / Supply Box |
| **Cores de Destaque** | RGB, Neon, Pastel... | Loja / Supply Box |
| **Theme Packs** | Pacotes de jogos (Arc Raiders, Fortnite...) | Loja de Themes |
| **Badges Equipáveis** | Badges especiais exibidos no perfil | Conquistas |
| **Bordas de Perfil** | Molduras premium para avatar | Loja |

### 🛒 Marketplace

- **Loja de Produtos**: Game Keys, Gift Cards, Assinaturas
- **Mercado P2P**: Compra/venda de itens entre usuários
- **Pagamentos**: Zions Points, Zions Cash, PIX
- **Taxa**: 5% sobre vendas P2P

### 🔗 Integrações Sociais

| Plataforma | Features |
|------------|----------|
| **Discord** | Status, servidor conectado, atividade |
| **Steam** | Jogos na biblioteca, tempo jogado, conquistas |
| **Twitch** | Status de live, canal, seguidores |

### 🛡️ Painel Admin

- Dashboard com métricas em tempo real
- Gestão de usuários (ban, promote, reset password)
- Criação de posts oficiais e anúncios
- Gerenciamento de eventos com rewards
- Sistema de badges customizadas por usuário
- Aprovação de saques (Zions Cash → PIX)
- Feedbacks dos usuários
- Dev Tools (modo desenvolvimento)

---

## 🛠️ Stack Tecnológica

### Frontend
```
React 19          → UI Library
Vite 7            → Build Tool
TypeScript 5.6    → Type Safety
TailwindCSS 4     → Styling
Framer Motion     → Animations
React Router 7    → Navigation
Axios             → HTTP Client
Lucide React      → Icons
Capacitor 7       → Mobile App
```

### Backend
```
Node.js 20+       → Runtime
Express 5         → Web Framework
TypeScript 5.6    → Type Safety
Prisma 6          → ORM
PostgreSQL 16     → Database (Neon)
JWT               → Authentication
Cloudinary        → Image/Video CDN
Multer            → File Upload
bcryptjs          → Password Hashing
```

### Infraestrutura
```
Vercel            → Hosting (Client + Server)
Neon              → PostgreSQL Database
Cloudinary        → Media Storage
Ionic Appflow     → Android Build CI/CD
GitHub Actions    → CI/CD
```

---

## 📦 Estrutura do Projeto

```
magazine-srt-react/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # 100+ componentes
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── context/           # AuthContext, CommunityContext, RadioContext
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API client (axios)
│   │   ├── utils/             # Helpers e constants
│   │   └── config/            # Configurações
│   ├── android/               # Projeto Capacitor Android
│   ├── public/                # Assets estáticos
│   └── package.json
│
├── server/                    # Backend Express
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation
│   │   ├── config/            # Community, features
│   │   └── utils/             # Prisma, helpers
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (40+ models)
│   │   ├── migrations/        # Migration history
│   │   └── seed.ts            # Initial data
│   └── package.json
│
├── docs/                      # Documentação
├── docker-compose.yml         # PostgreSQL + Redis local
└── README.md
```

---

## ⚡ Instalação

### Pré-requisitos
- Node.js 20+
- npm ou yarn
- PostgreSQL (ou Docker)
- Git

### 1. Clone o Repositório
```bash
git clone https://github.com/streetrunnerteam/magazine-srt.git
cd magazine-srt
```

### 2. Configurar Backend
```bash
cd server
npm install

# Criar arquivo .env
cp .env.example .env

# Editar .env com suas credenciais:
# DATABASE_URL="postgresql://user:pass@host:5432/db"
# JWT_SECRET="sua-chave-secreta-64-chars"
# CLOUDINARY_CLOUD_NAME="..."
# CLOUDINARY_API_KEY="..."
# CLOUDINARY_API_SECRET="..."

# Rodar migrations
npx prisma migrate deploy

# Seed inicial (badges, rewards)
npx prisma db seed

# Iniciar servidor
npm run dev
```
*Servidor rodará em `http://localhost:3000`*

### 3. Configurar Frontend
```bash
cd client
npm install

# Criar arquivo .env
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Iniciar dev server
npm run dev
```
*Frontend rodará em `http://localhost:5173`*

### 4. (Opcional) Docker para Banco Local
```bash
# Na raiz do projeto
docker-compose up -d

# PostgreSQL estará em localhost:5432
# Redis estará em localhost:6379
```

---

## 📱 App Android

O Magazine SRT tem um app Android nativo gerado via **Capacitor**.

### Build Local (requer Android Studio)
```bash
cd client
npm run build
npx cap sync android
npx cap open android
# Build APK no Android Studio
```

### Build na Nuvem (Ionic Appflow)
1. Push para `main` branch
2. Acessar [Ionic Appflow Dashboard](https://dashboard.ionicframework.com)
3. Criar novo build → Android → Debug
4. Download do APK

### Configuração Android
- **Package ID**: `com.magazinesrt.app`
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 35 (Android 15)
- **Tema**: Dark mode com accent dourado (#D4AF37)

---

## 🔧 Scripts Disponíveis

### Client
```bash
npm run dev        # Inicia dev server
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # ESLint
```

### Server
```bash
npm run dev        # Inicia com nodemon
npm run build      # Compila TypeScript
npm start          # Produção
npx prisma studio  # GUI do banco de dados
npx prisma migrate dev --name <name>  # Nova migration
```

---

## 🌐 API Endpoints

### Autenticação
```
POST   /api/auth/register     → Cadastro
POST   /api/auth/login        → Login
POST   /api/auth/verify-email → Verificar email
POST   /api/auth/forgot-password → Recuperar senha
```

### Usuários
```
GET    /api/users/me          → Perfil atual
GET    /api/users/:id         → Perfil por ID
PUT    /api/users/profile     → Atualizar perfil
GET    /api/users/search      → Buscar usuários
```

### Feed
```
GET    /api/posts             → Listar posts
POST   /api/posts             → Criar post
POST   /api/posts/:id/like    → Curtir
POST   /api/posts/:id/comment → Comentar
```

### Gamificação
```
GET    /api/gamification/ranking  → Ranking global
POST   /api/gamification/daily-login → Bônus diário
GET    /api/gamification/badges   → Listar badges
```

### Economia
```
GET    /api/shop/items        → Itens da loja
POST   /api/shop/purchase     → Comprar item
POST   /api/supply-box/open   → Abrir caixa
GET    /api/market/listings   → Mercado P2P
```

---

## 🔐 Variáveis de Ambiente

### Server (.env)
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Email (opcional)
SMTP_HOST="..."
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."

# Mercado Pago (opcional)
MERCADOPAGO_ACCESS_TOKEN="..."

# Rovex Integration (multi-tenant)
ROVEX_API_URL="..."
ROVEX_API_SECRET="..."
```

### Client (.env)
```env
VITE_API_URL="http://localhost:3000/api"
```

---

## 🚀 Deploy

### Vercel (Produção)

O projeto faz deploy automático para Vercel em cada push para `main`.

```bash
# Deploy manual (se necessário)
cd client && vercel --prod
cd server && vercel --prod
```

### URLs de Produção
- **Frontend**: https://magazine-mgt.vercel.app
- **Backend/API**: https://magazine-srt.vercel.app/api

---

## 📊 Database Schema (Principais Models)

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  name            String
  displayName     String?
  avatarUrl       String?
  membershipType  MembershipType  // MAGAZINE | MGT
  level           Int       @default(1)
  xp              Int       @default(0)
  zionsPoints     Int       @default(0)
  zionsCash       Float     @default(0)
  trophies        Int       @default(0)
  // ... 50+ campos
}

model Post {
  id          String    @id @default(uuid())
  userId      String
  imageUrl    String?
  videoUrl    String?
  caption     String?
  mediaType   MediaType // IMAGE | VIDEO | TEXT
  likesCount  Int       @default(0)
  // ... polls, highlights, etc
}

// + 40 outros models (Badge, Group, Story, etc)
```

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: minha feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Regras de Commit
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

---

## 📄 Licença

Este projeto é **proprietário** e desenvolvido exclusivamente para o **Street Runner Team**.

Todos os direitos reservados © 2026

---

## 👥 Equipe

<div align="center">

**Desenvolvido com 💜 e ☕ pela equipe SRT**

[Street Runner Team](https://github.com/streetrunnerteam)

</div>

---

## 📈 Roadmap

- [x] v0.1 - MVP (Feed, Auth, Profiles)
- [x] v0.2 - Gamification (XP, Badges, Ranking)
- [x] v0.3 - Economy (Zions, Shop, Supply Box)
- [x] v0.4 - Social (Groups, DMs, Integrations)
- [x] v0.5 - Mobile (Capacitor, PWA)
- [ ] v0.6 - Marketplace (P2P Trading)
- [ ] v0.7 - Events (Tournaments, Rewards)
- [ ] v1.0 - Production Release

---

<div align="center">

**⭐ Se você gostou do projeto, deixe uma estrela! ⭐**

</div>
