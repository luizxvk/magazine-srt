# 🗺️ ROADMAP - Magazine SRT

> **Versão Atual:** v0.4.0 (Beta)  
> **Última Atualização:** 12 de Janeiro de 2026

---

## 📊 Status do Projeto

```
🟢 Fase Beta Ativa
├─ Sistema Base: 100% ✅
├─ Features Sociais: 95% ✅
├─ Gamificação: 90% ✅
├─ E-commerce: 85% 🔄
└─ Personalização: 75% 🔄
```

---

## ✅ Recentemente Implementado (v0.3.25 - v0.4.0)

### v0.4.0 (Atual - Janeiro 2026) 🎉
**MAJOR UPDATE - 30+ Bug Fixes & Improvements**

- 🔒 **Sistema de Visitante Aprimorado**
  - 9 bloqueios implementados (comentários, share, feedback, notificações, zions, social, market, badge)
  - Popup centralizado e reutilizável (VisitorBlockPopup)
  - Sem popups intrusivos (daily login/welcome removidos)
  - Experiência mais limpa para guests

- 🎨 **Header Modernizado**
  - Logo MAGAZINE agora segue cor personalizada do usuário (accentColor)
  - Logo MGT aumentado 40% (h-12/h-14/h-16)
  - Pulse de notificação movido de Social para Grupos
  - Botão Settings removido do desktop (ainda no drawer)

- ☀️ **Modo Claro 100% Funcional**
  - Títulos do carrossel móvel com contraste perfeito
  - Background do Ranking adaptado (bg-white/80 vs bg-white/5)
  - Ícone verificado com stroke 2.5 + drop-shadow

- 📻 **Rádio Totalmente Operacional**
  - Badge "AO VIVO" movido para canto direito
  - Volume automático (unmute ao aumentar de 0)
  - Busca redireciona e scroll animado com highlight
  - Event listener 'openRadio' no FeedPage

- 🏆 **Sistema de Conquistas Expandido**
  - 7 novas conquistas implementadas:
    * Blogueiro (20 posts)
    * Editor Chefe (50 posts)
    * Comentador (first comment)
    * Debatedor (50 comments)
    * Super Fã (100 likes given)
    * Ícone (100 likes received)
    * Viral (50 comments received)
  - Agora 12/25 conquistas têm lógica funcional

- 🎭 **Personalização Melhorada**
  - Botão "Desequipar" para theme packs equipados
  - Remove background + cor ao desequipar
  - Volta ao tema padrão com um clique

- 🔧 **Correções Gerais**
  - Contador do carrossel com clamping correto
  - Scroll tracking suave (handleScroll initial call)
  - Ícone verificado com maior contraste
  - SearchModal processa actions (radio, shop, events)

**Commits:** 8 progressivos + 1 release  
**Branch:** beta (pronto para merge)

### v0.3.39 (Janeiro 2026)
- 🔒 **Sistema de Visitante Aprimorado**
  - Visitantes não recebem mais popups intrusivos (welcome/daily login)
  - Componente centralizado `VisitorBlockPopup` para bloqueios consistentes
  - Bloqueios implementados: comentários, compartilhamento, feedback, notificações, compra de Zions, Social, Market
  - Visitantes não têm mais crown badge no perfil
  - Experiência de navegação mais limpa para convidados

- 🎨 **Melhorias no Header**
  - Logo MAGAZINE agora segue a cor personalizada do usuário (accentColor)
  - Logo MGT aumentado 40% (h-12/h-14/h-16) para maior destaque
  - Pulse de notificação movido do ícone Social para Grupos
  - Botão Settings removido do desktop header (ainda em drawer)
  - Design mais limpo e intuitivo

- ☀️ **Correções de Modo Claro**
  - Títulos do MobileCarousel agora visíveis (text-white + drop-shadow-md)
  - Ranking component adaptado para light mode (bg-white/80 vs bg-white/5)
  - Ícone verificado com stroke 2.5 e drop-shadow para melhor contraste

- 📻 **Rádio Totalmente Funcional**
  - Badge "AO VIVO" movido para canto superior direito
  - Volume automático: unmute ao aumentar slider de 0
  - Busca agora redireciona e faz scroll para rádio com animação highlight
  - Event listener 'openRadio' implementado no FeedPage

- 🏆 **Sistema de Conquistas Expandido**
  - 7 novas conquistas implementadas:
    * Blogueiro (20 posts)
    * Editor Chefe (50 posts)
    * Comentador (first comment)
    * Debatedor (50 comments)
    * Super Fã (100 likes given)
    * Ícone (100 likes received)
    * Viral (50 comments received)
  - Agora 12/25 conquistas têm lógica funcional

- 🎠 **Carrossel Contador Corrigido**
  - Melhor cálculo de scroll position
  - Clamping (0 to cards.length-1) para evitar índices inválidos
  - Contador atualiza suavemente durante toda a rolagem

- 🎭 **Desequipar Theme Packs**
  - Novo botão "Desequipar" para packs equipados
  - Desequipa background e color simultaneamente
  - Feedback visual com hover (gray → red)
  - Retorna ao tema padrão facilmente

### v0.3.39 (Janeiro 2026)
- ⭐ **Card "O Que Há de Novo" no Acesso Rápido**
  - Novo card no carrossel mobile para acesso direto às novidades
  - Gradiente azul/indigo distinto
  - Dispara evento para abrir WhatsNewModal
  - Melhor visibilidade das atualizações da plataforma

### v0.3.38 (Janeiro 2026)
- 🎁 **Supply Box com Preço Progressivo**
  - Primeira caixa do dia é GRÁTIS!
  - Preços aumentam progressivamente: 500, 1000, 2500...
  - Reset automático à meia-noite
  - Incentivo para login diário

- 🏆 **Nova Conquista: Identidade Revelada**
  - Desbloqueada ao atualizar o perfil pela primeira vez
  - Badge especial com ícone de ID
  - 50 Zions de recompensa

- 💰 **Melhorias no Zions Cash**
  - Exibição aprimorada do saldo
  - Melhor feedback visual nas transações
  - Separação clara entre Cash e Points

### v0.3.27 (Janeiro 2026)
- 💰 **Sistema de Moeda Dual** - Economia completa
  - zionsPoints (Int) - Para customizações (100 points = 1 cash)
  - zionsCash (Float) - Para produtos reais (1 cash = R$ 1,00)
  - Migração Prisma aplicada no Supabase
  - Campos antigos mantidos para compatibilidade

- 🎨 **10 Packs de Tema Completos**
  - Arc Raiders, Cyberpunk 2077, Red Dead Redemption
  - The Witcher, Resident Evil, Valorant
  - Elden Ring, God of War, Stray, Hollow Knight
  - Schema completo com ThemePack e UserThemePack
  - Sistema de estoque e edição limitada
  
- 📻 **Rádio 24/7 Waves** - Música ambiente integrada
  - 4 estações: Synthwave, Chillwave, Darksynth, Spacesynth
  - Componente RadioCard com controles completos
  - Streaming via Nightride FM

- 💸 **Cashback System** - 10% em Points
  - Toda compra de produto retorna 10% em Points
  - Histórico separado para Cash e Points
  - Daily Login agora concede Points

- 🏪 **Mercado Dual Currency**
  - Aceita Zions Cash ou Zions Points
  - Conversão: 1 Cash = 100 Points
  - Taxa de 5% vai para admin

- 🎨 **LoginErrorPopup Estilizado**
  - Design moderno com gradiente vermelho
  - Animação slideDown + progress bar
  - Auto-close de 5 segundos

- 🎠 **Carrossel Mobile Otimizado**
  - Cards reduzidos (w-36, h-20) para melhor UX
  - Navegação corrigida - todos os 6 cards acessíveis

### v0.3.26 (Janeiro 2026)
- 🎠 **Carrossel Mobile** - Acesso rápido no feed
  - 6 cards: Bônus Diário, Fotos, Eventos, Membros Novos, Destaques, Feedback
  - Swipe horizontal com snap scroll
  - Indicadores (dots) com accentColor
  - Botões prev/next
  - Visível apenas < 1280px (xl breakpoint)

- 📧 **Sistema de Entrega por Email**
  - Keys enviadas automaticamente via email
  - Template profissional com logo
  - Histórico de emails enviados

- 📄 **FeedbackPage**
  - Formulário completo de feedback
  - Tipos: Bug, Sugestão, Elogio, Outro
  - Rating com estrelas
  - Integração com /feedback route

### v0.3.25 (Janeiro 2026)
- 🛒 **Loja de Produtos** - E-commerce completo
  - Cadastro de produtos (jogos, keys, gift cards)
  - Sistema de keys físicas vinculadas
  - Compra via Zions ou PIX (MercadoPago)
  - Modal de confirmação de compra
  - Delete cascade para orders/keys

- 💰 **Saque de Zions**
  - Conversão: 100 Zions = R$ 1,00
  - Pagamento via PIX
  - Sistema de aprovação admin
  - Histórico de solicitações

- 🏪 **Mercado de Itens**
  - Venda de customizações entre usuários
  - Taxa de 5% para admin
  - Sistema de listagem e compra
  - Transferência automática de propriedade

---

## 🔄 Em Desenvolvimento (Próximas Semanas)

### Alta Prioridade

#### 🎨 Aba "Packs de Tema" no Meu Estilo
- [ ] Integrar ThemePackCard no CustomizationShop
- [ ] Nova aba "Packs" ao lado de Fundos/Cores/Badges
- [ ] Filtros: Todos / Meus Packs / Disponíveis
- [ ] Preview em fullscreen do pack
- [ ] Sistema de equipar/desequipar pack
- [ ] API completa (/api/theme-packs)

#### 📻 Integração do RadioCard
- [ ] Adicionar RadioCard no sidebar desktop (FeedPage)
- [ ] Adicionar no drawer mobile (RecommendationsDrawer)
- [ ] Persistência do estado (localStorage)
- [ ] Sincronização entre páginas
- [ ] Controles globais (mini player?)

#### 🎮 Packs Iniciais
Criar 6 packs temáticos:
- [ ] Arc Raiders Pack (Laranja futurista - 1000 Zions)
- [ ] Cyberpunk Pack (Amarelo neon - 1200 Zions)
- [ ] Valorant Pack (Vermelho/Rosa - 1000 Zions)
- [ ] Halo Pack (Verde Master Chief - 1000 Zions)
- [ ] GTA VI Pack (Rosa Vice City - 1500 Zions)
- [ ] Elden Ring Pack (Dourado antigo - 1200 Zions)

### Média Prioridade

#### 🏪 Melhorias na Loja de Produtos
- [ ] Categorias de produtos (Jogos, Gift Cards, Keys, Outros)
- [ ] Busca e filtros avançados
- [ ] Sistema de avaliações (5 estrelas)
- [ ] Histórico de compras detalhado
- [ ] Notificação quando produto volta ao estoque

#### 🎯 Destaques da Semana
- [ ] Modal dedicado com posts em destaque
- [ ] Seleção manual por admin
- [ ] Critérios automáticos (mais likes/comments)
- [ ] Rotação semanal

#### 📱 Melhorias Mobile
- [ ] Otimizar posts para aspect-ratio mobile
- [ ] Gestos de swipe entre páginas
- [ ] Menu hamburguer redesenhado
- [ ] Bottom navigation bar (Home/Explore/Shop/Profile)

---

## 🚀 Planejado (Médio Prazo - Q1 2026)

### Social & Comunidade
- [ ] **Sistema de Clãs/Guildas**
  - Criação e gestão de clãs
  - Chat exclusivo de clã
  - Ranking de clãs por pontos
  - Conquistas de clã
  
- [ ] **Eventos Ao Vivo**
  - Eventos programados (torneios, lives)
  - Contagem regressiva
  - Notificações push
  - Participação com recompensas

- [ ] **Perfil Público Aprimorado**
  - Estatísticas detalhadas (tempo online, posts, etc)
  - Galeria de conquistas
  - Histórico de atividades (timeline)
  - Compartilhamento de perfil (link público)

### Gamificação Avançada
- [ ] **Missões Diárias & Semanais**
  - Sistema de quests (postar, comentar, dar like)
  - Recompensas progressivas
  - Missões especiais de evento
  
- [ ] **Títulos e Emblemas**
  - Títulos conquistáveis (Lendário, Veterano, etc)
  - Sistema de prestígio
  - Títulos temporários de evento

- [ ] **Temporadas (Seasons)**
  - Temporada de 3 meses com temática
  - Battle pass com recompensas exclusivas
  - Reset de rankings (mantém nível base)
  - Recompensas de fim de temporada

### E-commerce & Economia
- [ ] **Leilões**
  - Leilão de itens raros/limitados
  - Sistema de lance automático
  - Histórico de leilões
  
- [ ] **Assinaturas Premium**
  - Magazine Premium e MGT Premium
  - Benefícios: XP dobrado, cores exclusivas, acesso antecipado
  - Pagamento recorrente (MercadoPago)

- [ ] **Cupons & Promoções**
  - Códigos promocionais
  - Descontos por tempo limitado
  - Ofertas relâmpago (flash sales)

---

## 💡 Ideias Futuras (Backlog)

### Conteúdo & Mídia
- [ ] Suporte para posts em vídeo (uploads diretos)
- [ ] Sistema de podcasts integrado
- [ ] Transmissões ao vivo (streaming)
- [ ] Galeria de wallpapers/assets exclusivos

### Integrações Externas
- [ ] Integração com Discord (roles automáticos)
- [ ] Integração com Steam (exibir jogos, conquistas)
- [ ] Integração com Twitch (status ao vivo)
- [ ] API pública para desenvolvedores

### Moderação & Admin
- [ ] Dashboard admin aprimorado (analytics, gráficos)
- [ ] Sistema de moderadores com permissões
- [ ] Logs de auditoria completos
- [ ] Auto-moderação com IA (filtro de spam/toxicidade)

### Acessibilidade & Performance
- [ ] Tema de alto contraste
- [ ] Suporte para screen readers
- [ ] PWA (Progressive Web App) completo
- [ ] Modo offline básico

---

## 🐛 Bugs Conhecidos & Melhorias Técnicas

### Em Análise
- [ ] Otimização de queries no feed (cache de posts)
- [ ] Redução do bundle size (code splitting agressivo)
- [ ] Lazy loading de imagens no feed
- [ ] Websockets para chat em tempo real
- [ ] Migration para React Query/TanStack

### Backlog de Refatoração
- [ ] Migrar contexts para Zustand
- [ ] Padronizar todos os modais (componente base)
- [ ] Unificar sistema de toast/notificações
- [ ] Documentar componentes com Storybook
- [ ] Testes E2E com Playwright

---

## 📈 Métricas & Objetivos

### Q1 2026 (Janeiro - Março)
- ✅ Atingir 100 usuários ativos mensais
- ✅ Implementar sistema de monetização básico
- 🔄 Lançar 3 eventos exclusivos
- 🔄 Reduzir tempo de carregamento em 30%

### Q2 2026 (Abril - Junho)
- [ ] Atingir 500 usuários ativos mensais
- [ ] Implementar sistema de clãs
- [ ] Lançar primeiro battle pass
- [ ] Mobile app nativo (React Native)

---

## 🎯 Visão de Longo Prazo (2026-2027)

### Expansão
- **Q3 2026:** Versão mobile nativa (iOS/Android)
- **Q4 2026:** Programa de afiliados e criadores de conteúdo
- **Q1 2027:** Magazine SRT como plataforma (API aberta)
- **Q2 2027:** Expansão internacional (EN/ES)

### Sustentabilidade
- Modelo de negócio híbrido (freemium + marketplace)
- Parcerias com publishers de jogos
- Patrocínios de marcas gaming
- Programa de embaixadores

---

## 📞 Contribuindo

Este roadmap é um documento vivo e evolui com feedback da comunidade.

- 💬 Sugestões? Use o formulário de Feedback no app
- 🐛 Bugs? Reporte via sistema de denúncias
- 💡 Ideias? Entre em contato com o admin

---

**Magazine SRT** • Construído com 💛 pela Street Runner Team  
*Versão Beta • Todos os direitos reservados • 2026*
