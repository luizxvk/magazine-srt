# 📋 TODO - Features & Fixes

## 🚀 Features Planejadas

### ✅ Carrossel Mobile (Feed - Acima do "Bem-vindo")
**Status:** ✅ CONCLUÍDO (v0.3.26)  
**Prioridade:** Alta  

Implementado carrossel horizontal no modo responsivo/mobile que aparece **acima** do espaço "Bem-vindo, usuário" no feed.

#### Cards incluídos no carrossel:
1. ✅ **Bônus Diário** - Com badge de Zions ou checkmark
2. ✅ **Catálogo de Fotos** - Link para /photos
3. ✅ **Eventos Exclusivos** - Abre EventsModal
4. ✅ **Membros Novos** - Abre NewMembersModal
5. ✅ **Destaques da Semana** - Placeholder (TODO: modal)
6. ✅ **Feedback** - Placeholder (TODO: scroll ou modal)

#### Funcionalidades implementadas:
- ✅ Componente `MobileCarousel.tsx`
- ✅ Visível apenas em telas < xl (1280px)
- ✅ Swipe horizontal com drag
- ✅ Indicadores de posição (dots) com cor do accentColor
- ✅ Botões de navegação prev/next
- ✅ Cards compactos com gradientes coloridos
- ✅ Snap scroll suave

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
- **EDIÇÃO LIMITADA**: Cada pack tem estoque limitado (ex: 10 cópias)
- Quando esgotar, mostrar botão "ESGOTADO" desabilitado
- **REVENDÍVEL NO MERCADO**: Usuário pode vender pack no mercado para outros

#### Fluxo de Compra/Venda:
1. Admin cria pack com `maxStock: 10`
2. Usuários compram até esgotar
3. Pack esgotado = botão desabilitado
4. Usuário pode listar pack no Mercado (preço livre)
5. Outro usuário compra do Mercado (transferência de posse)

---

## 🐛 Bugs Corrigidos

### ✅ [v0.3.25] Erro 500 ao deletar produto
**Data:** 12/01/2026  
**Problema:** DELETE /api/products/admin/:id retornava 500  
**Causa:** Foreign key constraint com Orders e ProductKeys  
**Solução:** Implementado transaction para deletar keys e orders antes do produto  

---

## 📝 Notas Gerais

- Versão Atual: **0.3.27**
- Branch: **beta**
- Deploy: Vercel (client) + Vercel (server)

---

*Última atualização: 12/01/2026*
