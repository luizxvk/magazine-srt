# 🗺️ ROADMAP - Magazine SRT

> **Versão Atual:** v5.0.0-rc.1 (Release Candidate)  
> **Última Atualização:** 31 de Janeiro de 2026  
> **Lançamento v5.0:** 05 de Fevereiro de 2026 às 13:00 BRT

---

## 📊 Status do Projeto

```
🚀 Versão 5.0 em Preparação
├─ Sistema Base: 100% ✅
├─ Features Sociais: 100% ✅
├─ Gamificação: 100% ✅
├─ E-commerce: 95% ✅
├─ Personalização: 95% ✅
├─ Integração Rovex: 100% ✅
└─ Multi-Tenant: 100% ✅
```

---

## 🆕 v5.0.0-rc.1 (Release Candidate - 31 Janeiro 2026)

### 🌐 Integração Rovex Platform
**Conexão completa com a plataforma de gestão de comunidades**

- 🔗 **Endpoints de Integração**
  - `GET /api/rovex/health` - Health check para monitoramento
  - `GET /api/rovex/metrics` - Métricas reais do banco de dados
  - `GET /api/rovex/config` - Configuração da comunidade
  - `PUT /api/rovex/config` - Atualização remota de config
  - `POST /api/rovex/webhook` - Recebimento de eventos

- 🔐 **Segurança HMAC-SHA256**
  - Validação de assinatura em todos os webhooks
  - Verificação de timestamp (±5 minutos)
  - Secret compartilhado entre Magazine e Rovex

- 📊 **Push de Métricas**
  - `reportEvent()` - Envio de eventos para Rovex
  - `pushMetrics()` - Métricas periódicas
  - `reportHealth()` - Status de saúde da comunidade

### 🎛️ Sistema de Feature Gates
**Controle de features por plano**

- 📋 **Planos Disponíveis**
  - FREE - Trial 14 dias (50 usuários)
  - STARTER - R$ 247/mês (500 usuários)
  - GROWTH - R$ 597/mês (2000 usuários)
  - ENTERPRISE - R$ 1.497/mês (ilimitado)

- 🔒 **Componente `<FeatureGate>`**
  - Bloqueia UI baseado no plano
  - Mostra preview com blur
  - Modal de upgrade automático

- 🛡️ **Middleware `requireFeature()`**
  - Proteção de endpoints por feature
  - Retorna plano mínimo necessário
  - Mensagens de erro contextuais

### 🏢 Arquitetura Multi-Tenant
**Suporte a múltiplas comunidades**

- 🎨 **Branding Dinâmico**
  - Nome, logo e cores customizáveis
  - Moeda virtual com nome próprio
  - Tiers VIP/Standard configuráveis

- 🌍 **Detecção por Subdomain**
  - `{comunidade}.comunidades.rovex.app`
  - Cache de configuração (5 minutos TTL)
  - Fallback para Magazine SRT default

- 📝 **CommunityContext**
  - `formatCurrency()` - Formata moeda local
  - `getTierName()` - Nome do tier
  - `isFeatureEnabled()` - Verifica feature

### ⚠️ Sistema de Suspensão
**Gerenciamento de comunidades suspensas**

- 🚫 **Middleware de Suspensão**
  - Bloqueia todas as rotas (exceto Rovex)
  - Retorna 503 com código `COMMUNITY_SUSPENDED`
  - Suporte a suspensão temporária com data de retorno

- 📄 **Página `/suspended`**
  - UI estilizada com motivo da suspensão
  - Contador até reativação (se aplicável)
  - Link para contato de suporte

- 🗑️ **Comunidade Deletada**
  - Retorna 410 com código `COMMUNITY_DELETED`
  - Limpa localStorage do usuário
  - Redireciona para página de encerramento

### 🎉 Encerramento da Beta
**Agradecimento aos beta testers**

- 🏆 **BetaEndedOverlay**
  - Ativa às 00:00 de 01/02/2026
  - Agradecimento aos 847+ beta testers
  - Estatísticas da beta (posts, features)

- ⏱️ **Countdown para v5.0**
  - Contagem regressiva até 05/02/2026 13:00 BRT
  - Animações de confetti
  - Link para redes sociais

---

## ✅ Recentemente Implementado (v0.4.1 - v0.4.25)

### v0.4.22 (Atual - Janeiro 2026) 🎉
**SOCIAL DISCOVERY & FRIEND REQUESTS**

- 👥 **Aba Recomendados no Social**
  - Nova aba para descobrir membros da comunidade
  - Lista paginada com "Ver Mais" para carregar mais sugestões
  - Filtra automaticamente amigos já adicionados
  - Cards com avatar, nível e troféus de cada usuário

- ➕ **Envio de Solicitação de Amizade**
  - Botão de adicionar diretamente da aba Recomendados
  - Feedback visual com loading spinner durante envio
  - Toast de confirmação ao enviar solicitação
  - Remove usuário da lista após enviar pedido

- 🎯 **UX Melhorada na SocialPage**
  - Navegação por tabs: Amigos / Solicitações / Recomendados
  - Suporte a query params (?tab=recommended)
  - Botões "Ver Perfil" e "Adicionar" lado a lado
  - Bordas de perfil personalizadas visíveis

- 🔧 **Melhorias Técnicas**
  - Carregamento paralelo de dados (Promise.all)
  - State management otimizado para evitar re-renders
  - Paginação client-side eficiente

### v0.4.21 (Janeiro 2026)
**ENQUETES, LIMPEZA DE GRUPOS, ZIONS CARD REDESIGN**

- 🏆 **Sistema de Prêmios Elite Ranking**
  - Card de prêmio mensal no modal de ranking
  - Contador de dias restantes até fim do mês
  - Suporte a 3 tipos: Zions Points, Zions Cash, Produto
  - Configuração admin para definir prêmio do mês
  - Notificações de lembrete para quando prêmio estiver disponível

- 📻 **Correções de Rádio**
  - URLs de stream Jazz e Eletrônica atualizadas
  - Problema de 404 nas estações corrigido

- 🎬 **Upload de Vídeo**
  - Suporte a vídeo nos posts (MP4, MOV, WebM, AVI)
  - Botão de vídeo no widget de criação de post
  - Preview de vídeo antes de publicar

- ✨ **Melhorias Visuais**
  - Blur sutil nos backgrounds Moonlit Sky e Infinite Triangles
  - Layout do Elite Ranking corrigido (Nível/Troféus sem quebra)
  - Cores do modal de comentários ajustadas

- 🔧 **UX Melhorada**
  - ~30 alerts substituídos por toast notifications
  - Bug de stories corrigido
  - Fotos do catálogo não sobrepõem mais

### v0.4.1 (Janeiro 2026)
**LAYOUT FACEBOOK-STYLE & TOOLS CAROUSEL**

- 📱 **Sidebar Esquerda Estilo Facebook**
  - Nova barra lateral com acesso rápido
  - Links: Bônus Diário, Grupos, Catálogo, Eventos, Novos Membros, Destaques
  - Barra de progresso de XP do usuário
  - Estilização com cor personalizada do usuário
  - Oculta em telas menores que lg (1024px)

- 🎛️ **Carrossel de Ferramentas (ToolsCarousel)**
  - Rádio, Discord, Steam e Twitch em carrossel único
  - Navegação por tabs coloridas (Música/Azul/Verde/Roxo)
  - Setas de navegação laterais
  - Indicadores de ponto (dots) na parte inferior
  - Suporte a gestos de swipe para mobile

- 🖥️ **Layout 3 Colunas Redesenhado**
  - Sidebar Esquerda (260px) | Feed Central (max 2xl) | Sidebar Direita (320px)
  - Container expandido de max-w-7xl para max-w-[1600px]
  - MobileCarousel agora apenas visível abaixo de lg
  - Sidebar direita reorganizada: Tools → Store → Market → Inventory → etc

- 🧹 **Limpeza de Código**
  - Cards sociais removidos da sidebar direita (agora no carrossel)
  - Links duplicados removidos (já estão na sidebar esquerda)
  - Imports otimizados no FeedPage

**Commits:** 3 progressivos + 1 release  
**Branch:** beta

### v0.4.0 (Janeiro 2026)
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
