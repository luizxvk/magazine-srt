# 📋 TODO - Features & Fixes

## 🚀 Features Planejadas

### 🎠 Carrossel Mobile (Feed - Acima do "Bem-vindo")
**Status:** Pendente  
**Prioridade:** Alta  

Implementar um carrossel horizontal no modo responsivo/mobile que aparecerá **acima** do espaço "Bem-vindo, usuário" no feed.

#### Cards que devem aparecer no carrossel:
1. **Bônus Diário** - DailyLoginCard
2. **Catálogo de Fotos** - PhotoCatalogCard
3. **Eventos Exclusivos** - EventsCard
4. **Membros Novos** - NewMembersCard (modal)
5. **Destaques da Semana** - (criar novo componente)
6. **Feedback** - FeedbackFormCard

#### Requisitos:
- [ ] Criar componente `MobileCarousel.tsx`
- [ ] Mostrar apenas em telas mobile (< 768px ou < 1024px)
- [ ] Swipe horizontal nativo
- [ ] Indicadores de posição (dots)
- [ ] Auto-play opcional
- [ ] Cards adaptados para formato carrossel (mais compactos)

#### Notas:
- NÃO incluir outros cards além dos listados
- O carrossel substitui a sidebar no mobile
- Deve ser suave e performático

---

### 🎨 Pack de Tema (Meu Estilo - Nova Categoria)
**Status:** Pendente  
**Prioridade:** Média  

Nova categoria no catálogo de personalização "Meu Estilo" chamada **Pack de Tema**.

#### Conceito:
Pacotes temáticos inspirados em jogos/franquias que incluem:
- **Fundo Animado Exclusivo** (não disponível avulso)
- **Cor Destaque Única** (não disponível avulsa)

Os packs são vendidos como um conjunto - o usuário compra e recebe AMBOS os itens vinculados.

#### Exemplo de Pack:
```
┌─────────────────────────────────┐
│  🎮 ARC RAIDERS PACK            │
│                                 │
│  [Preview do fundo animado]     │
│                                 │
│  ✓ Fundo Animado Exclusivo      │
│  ✓ Cor Destaque: #FF6B35        │
│                                 │
│  💰 1.000 Zions                 │
│                                 │
│  [    COMPRAR PACK    ]         │
└─────────────────────────────────┘
```

#### Packs Sugeridos:
| Pack | Jogo/Tema | Cor Destaque | Preço |
|------|-----------|--------------|-------|
| Arc Raiders | Arc Raiders | Laranja futurista | 1000 |
| Cyberpunk | Cyberpunk 2077 | Amarelo neon | 1200 |
| Valorant | Valorant | Vermelho/Rosa | 1000 |
| Halo | Halo Infinite | Verde Master Chief | 1000 |
| GTA VI | GTA VI | Rosa Vice City | 1500 |
| Elden Ring | Elden Ring | Dourado antigo | 1200 |

#### Requisitos Técnicos:
- [ ] Criar modelo `ThemePack` no Prisma (ou usar Product com categoria THEME_PACK)
- [ ] Criar componente `ThemePackCard.tsx` para exibir packs
- [ ] Nova aba/seção no CustomizationShop: "Packs de Tema"
- [ ] Ao comprar, desbloquear FUNDO + COR juntos
- [ ] Preview animado do fundo no card
- [ ] Indicar cor destaque visualmente (círculo colorido)
- [ ] Filtro: "Meus Packs" vs "Disponíveis"

#### Banco de Dados:
```prisma
model ThemePack {
  id              String   @id @default(uuid())
  name            String   // "Arc Raiders Pack"
  description     String?
  gameTitle       String   // "Arc Raiders"
  backgroundUrl   String   // URL do fundo animado (video/gif)
  accentColor     String   // Hex da cor destaque "#FF6B35"
  previewUrl      String?  // Thumbnail estática
  price           Int      // Preço em Zions
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}

// Relação com User - packs comprados
model UserThemePack {
  id          String    @id @default(uuid())
  userId      String
  packId      String
  purchasedAt DateTime  @default(now())
  isEquipped  Boolean   @default(false)
  
  user        User      @relation(fields: [userId], references: [id])
  pack        ThemePack @relation(fields: [packId], references: [id])
  
  @@unique([userId, packId])
}
```

#### Notas:
- Fundos e cores dos packs são EXCLUSIVOS (não aparecem nas opções avulsas)
- Usuário pode equipar pack OU itens avulsos (não misturar)
- Considerar animações especiais para fundos de pack

---

## 🐛 Bugs Corrigidos

### ✅ [v0.3.25] Erro 500 ao deletar produto
**Data:** 12/01/2026  
**Problema:** DELETE /api/products/admin/:id retornava 500  
**Causa:** Foreign key constraint com Orders e ProductKeys  
**Solução:** Implementado transaction para deletar keys e orders antes do produto  

---

## 📝 Notas Gerais

- Versão Atual: **0.3.25**
- Branch: **beta**
- Deploy: Vercel (client) + Vercel (server)

---

*Última atualização: 12/01/2026*
