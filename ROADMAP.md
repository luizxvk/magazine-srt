# 🗺️ ROADMAP - Magazine SRT

> **Versão Atual:** v0.3.28 (Beta)  
> **Última Atualização:** 12 de Janeiro de 2026

---

## 📊 Status do Projeto

```
🟢 Fase Beta Ativa
├─ Sistema Base: 100% ✅
├─ Features Sociais: 95% ✅
├─ Gamificação: 90% ✅
├─ E-commerce: 85% 🔄
└─ Personalização: 70% 🔄
```

---

## ✅ Recentemente Implementado (v0.3.25 - v0.3.27)

### v0.3.27 (Atual - Janeiro 2026)
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
