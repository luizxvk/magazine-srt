// ============================================
// FEATURE FLAGS SYSTEM
// ============================================
// Define quais features estão disponíveis em cada plano
// Magazine SRT (ENTERPRISE) tem TODAS as features
// Outras comunidades têm features limitadas por plano

import { Plan } from './community.config';

// ============================================
// ENUM DE FEATURES
// ============================================
export enum Feature {
  // === CORE (Todas têm) ===
  FEED = 'FEED',
  POSTS_IMAGE = 'POSTS_IMAGE',
  POSTS_TEXT = 'POSTS_TEXT',
  PROFILE = 'PROFILE',
  COMMENTS = 'COMMENTS',
  LIKES = 'LIKES',
  NOTIFICATIONS = 'NOTIFICATIONS',
  
  // === SOCIAL (STARTER+) ===
  STORIES = 'STORIES',
  DIRECT_MESSAGES = 'DIRECT_MESSAGES',
  FRIENDSHIPS = 'FRIENDSHIPS',
  USER_SEARCH = 'USER_SEARCH',
  
  // === GAMIFICATION BÁSICA (STARTER+) ===
  XP_SYSTEM = 'XP_SYSTEM',
  LEVELS = 'LEVELS',
  DAILY_LOGIN = 'DAILY_LOGIN',
  BADGES_BASIC = 'BADGES_BASIC',
  
  // === GAMIFICATION AVANÇADA (GROWTH+) ===
  RANKING_LEADERBOARD = 'RANKING_LEADERBOARD',
  RANKING_PRIZES = 'RANKING_PRIZES',
  BADGES_ADVANCED = 'BADGES_ADVANCED',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  STREAKS = 'STREAKS',
  
  // === MÍDIA (Varia por plano) ===
  POSTS_VIDEO = 'POSTS_VIDEO',
  POSTS_POLL = 'POSTS_POLL',
  CATALOG_PHOTOS = 'CATALOG_PHOTOS',
  
  // === ECONOMIA (GROWTH+) ===
  VIRTUAL_CURRENCY = 'VIRTUAL_CURRENCY',
  SHOP_CUSTOMIZATIONS = 'SHOP_CUSTOMIZATIONS',
  SHOP_PRODUCTS = 'SHOP_PRODUCTS',
  MARKETPLACE_P2P = 'MARKETPLACE_P2P',
  SUPPLY_BOX = 'SUPPLY_BOX',
  WITHDRAWALS = 'WITHDRAWALS',
  
  // === GRUPOS (GROWTH+) ===
  GROUPS = 'GROUPS',
  GROUP_CHAT = 'GROUP_CHAT',
  GROUP_ADMIN = 'GROUP_ADMIN',
  
  // === INTEGRAÇÕES (GROWTH+) ===
  DISCORD_INTEGRATION = 'DISCORD_INTEGRATION',
  STEAM_INTEGRATION = 'STEAM_INTEGRATION',
  TWITCH_INTEGRATION = 'TWITCH_INTEGRATION',
  
  // === PERSONALIZAÇÃO (GROWTH+) ===
  THEME_PACKS = 'THEME_PACKS',
  CUSTOM_BACKGROUNDS = 'CUSTOM_BACKGROUNDS',
  CUSTOM_COLORS = 'CUSTOM_COLORS',
  PROFILE_BORDERS = 'PROFILE_BORDERS',
  
  // === ADMIN (Varia) ===
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_MODERATION = 'ADMIN_MODERATION',
  ADMIN_ANALYTICS_BASIC = 'ADMIN_ANALYTICS_BASIC',
  ADMIN_ANALYTICS_ADVANCED = 'ADMIN_ANALYTICS_ADVANCED',
  ADMIN_BADGES = 'ADMIN_BADGES',
  ADMIN_ANNOUNCEMENTS = 'ADMIN_ANNOUNCEMENTS',
  ADMIN_EVENTS = 'ADMIN_EVENTS',
  ADMIN_PRODUCTS = 'ADMIN_PRODUCTS',
  
  // === ENTERPRISE ONLY ===
  WHITE_LABEL = 'WHITE_LABEL',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
  API_ACCESS = 'API_ACCESS',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  RADIO_247 = 'RADIO_247',
  PUSH_NOTIFICATIONS = 'PUSH_NOTIFICATIONS',
  EMAIL_CUSTOMIZATION = 'EMAIL_CUSTOMIZATION',
  MULTIPLE_ADMINS = 'MULTIPLE_ADMINS',
}

// ============================================
// FEATURES POR PLANO
// ============================================
export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  FREE: [
    // Core apenas
    Feature.FEED,
    Feature.POSTS_IMAGE,
    Feature.POSTS_TEXT,
    Feature.PROFILE,
    Feature.COMMENTS,
    Feature.LIKES,
    Feature.NOTIFICATIONS,
    Feature.USER_SEARCH,
    Feature.ADMIN_DASHBOARD,
    Feature.ADMIN_USERS,
  ],
  
  STARTER: [
    // Tudo do FREE +
    Feature.FEED,
    Feature.POSTS_IMAGE,
    Feature.POSTS_TEXT,
    Feature.PROFILE,
    Feature.COMMENTS,
    Feature.LIKES,
    Feature.NOTIFICATIONS,
    Feature.USER_SEARCH,
    Feature.ADMIN_DASHBOARD,
    Feature.ADMIN_USERS,
    // Social
    Feature.STORIES,
    Feature.DIRECT_MESSAGES,
    Feature.FRIENDSHIPS,
    // Gamification básica
    Feature.XP_SYSTEM,
    Feature.LEVELS,
    Feature.DAILY_LOGIN,
    Feature.BADGES_BASIC,
    // Admin
    Feature.ADMIN_MODERATION,
    Feature.ADMIN_ANALYTICS_BASIC,
    Feature.ADMIN_ANNOUNCEMENTS,
  ],
  
  GROWTH: [
    // Tudo do STARTER +
    Feature.FEED,
    Feature.POSTS_IMAGE,
    Feature.POSTS_TEXT,
    Feature.PROFILE,
    Feature.COMMENTS,
    Feature.LIKES,
    Feature.NOTIFICATIONS,
    Feature.USER_SEARCH,
    Feature.STORIES,
    Feature.DIRECT_MESSAGES,
    Feature.FRIENDSHIPS,
    Feature.XP_SYSTEM,
    Feature.LEVELS,
    Feature.DAILY_LOGIN,
    Feature.BADGES_BASIC,
    Feature.ADMIN_DASHBOARD,
    Feature.ADMIN_USERS,
    Feature.ADMIN_MODERATION,
    Feature.ADMIN_ANALYTICS_BASIC,
    Feature.ADMIN_ANNOUNCEMENTS,
    // Mídia avançada
    Feature.POSTS_VIDEO,
    Feature.POSTS_POLL,
    Feature.CATALOG_PHOTOS,
    // Gamification avançada
    Feature.RANKING_LEADERBOARD,
    Feature.RANKING_PRIZES,
    Feature.BADGES_ADVANCED,
    Feature.ACHIEVEMENTS,
    Feature.STREAKS,
    // Economia
    Feature.VIRTUAL_CURRENCY,
    Feature.SHOP_CUSTOMIZATIONS,
    Feature.SHOP_PRODUCTS,
    Feature.MARKETPLACE_P2P,
    Feature.SUPPLY_BOX,
    // Grupos
    Feature.GROUPS,
    Feature.GROUP_CHAT,
    Feature.GROUP_ADMIN,
    // Integrações
    Feature.DISCORD_INTEGRATION,
    Feature.STEAM_INTEGRATION,
    Feature.TWITCH_INTEGRATION,
    // Personalização
    Feature.THEME_PACKS,
    Feature.CUSTOM_BACKGROUNDS,
    Feature.CUSTOM_COLORS,
    Feature.PROFILE_BORDERS,
    // Admin avançado
    Feature.ADMIN_ANALYTICS_ADVANCED,
    Feature.ADMIN_BADGES,
    Feature.ADMIN_EVENTS,
    Feature.ADMIN_PRODUCTS,
    // Extras
    Feature.CUSTOM_DOMAIN,
  ],
  
  ENTERPRISE: [
    // TODAS AS FEATURES
    ...Object.values(Feature),
  ],
};

// ============================================
// INFORMAÇÕES DAS FEATURES (para UI)
// ============================================
export const FEATURE_INFO: Record<Feature, { name: string; description: string; icon?: string }> = {
  [Feature.FEED]: { name: 'Feed Social', description: 'Publicações e timeline' },
  [Feature.POSTS_IMAGE]: { name: 'Posts com Imagem', description: 'Upload de fotos' },
  [Feature.POSTS_TEXT]: { name: 'Posts de Texto', description: 'Publicações texto' },
  [Feature.POSTS_VIDEO]: { name: 'Posts com Vídeo', description: 'Upload de vídeos' },
  [Feature.POSTS_POLL]: { name: 'Enquetes', description: 'Criar votações' },
  [Feature.PROFILE]: { name: 'Perfil', description: 'Página de perfil do usuário' },
  [Feature.COMMENTS]: { name: 'Comentários', description: 'Comentar em posts' },
  [Feature.LIKES]: { name: 'Curtidas', description: 'Curtir publicações' },
  [Feature.NOTIFICATIONS]: { name: 'Notificações', description: 'Sistema de notificações' },
  [Feature.STORIES]: { name: 'Stories', description: 'Publicações temporárias 24h' },
  [Feature.DIRECT_MESSAGES]: { name: 'Mensagens Diretas', description: 'Chat privado' },
  [Feature.FRIENDSHIPS]: { name: 'Amizades', description: 'Sistema de amigos' },
  [Feature.USER_SEARCH]: { name: 'Busca de Usuários', description: 'Encontrar membros' },
  [Feature.XP_SYSTEM]: { name: 'Sistema de XP', description: 'Ganhe experiência' },
  [Feature.LEVELS]: { name: 'Níveis', description: 'Suba de nível' },
  [Feature.DAILY_LOGIN]: { name: 'Bônus Diário', description: 'Recompensas por login' },
  [Feature.BADGES_BASIC]: { name: 'Badges Básicos', description: 'Conquistas simples' },
  [Feature.BADGES_ADVANCED]: { name: 'Badges Avançados', description: 'Todas as conquistas' },
  [Feature.RANKING_LEADERBOARD]: { name: 'Ranking', description: 'Leaderboard global' },
  [Feature.RANKING_PRIZES]: { name: 'Prêmios do Ranking', description: 'Prêmios mensais' },
  [Feature.ACHIEVEMENTS]: { name: 'Conquistas', description: 'Sistema completo' },
  [Feature.STREAKS]: { name: 'Streaks', description: 'Sequência de dias' },
  [Feature.VIRTUAL_CURRENCY]: { name: 'Moeda Virtual', description: 'Economia interna' },
  [Feature.SHOP_CUSTOMIZATIONS]: { name: 'Loja de Customização', description: 'Comprar temas' },
  [Feature.SHOP_PRODUCTS]: { name: 'Loja de Produtos', description: 'Keys, gift cards' },
  [Feature.MARKETPLACE_P2P]: { name: 'Mercado P2P', description: 'Troca entre usuários' },
  [Feature.SUPPLY_BOX]: { name: 'Supply Box', description: 'Caixas de recompensa' },
  [Feature.WITHDRAWALS]: { name: 'Saques', description: 'Converter para PIX' },
  [Feature.GROUPS]: { name: 'Grupos', description: 'Comunidades internas' },
  [Feature.GROUP_CHAT]: { name: 'Chat de Grupo', description: 'Conversa em grupo' },
  [Feature.GROUP_ADMIN]: { name: 'Admin de Grupo', description: 'Gerenciar grupos' },
  [Feature.DISCORD_INTEGRATION]: { name: 'Discord', description: 'Integração Discord' },
  [Feature.STEAM_INTEGRATION]: { name: 'Steam', description: 'Integração Steam' },
  [Feature.TWITCH_INTEGRATION]: { name: 'Twitch', description: 'Integração Twitch' },
  [Feature.THEME_PACKS]: { name: 'Packs de Tema', description: 'Temas de jogos' },
  [Feature.CUSTOM_BACKGROUNDS]: { name: 'Fundos Animados', description: 'Backgrounds custom' },
  [Feature.CUSTOM_COLORS]: { name: 'Cores Personalizadas', description: 'Cor de destaque' },
  [Feature.PROFILE_BORDERS]: { name: 'Bordas de Perfil', description: 'Bordas premium' },
  [Feature.CATALOG_PHOTOS]: { name: 'Catálogo de Fotos', description: 'Galeria da comunidade' },
  [Feature.ADMIN_DASHBOARD]: { name: 'Painel Admin', description: 'Dashboard básico' },
  [Feature.ADMIN_USERS]: { name: 'Gestão de Usuários', description: 'Gerenciar membros' },
  [Feature.ADMIN_MODERATION]: { name: 'Moderação', description: 'Moderar conteúdo' },
  [Feature.ADMIN_ANALYTICS_BASIC]: { name: 'Analytics Básico', description: 'Métricas simples' },
  [Feature.ADMIN_ANALYTICS_ADVANCED]: { name: 'Analytics Avançado', description: 'Métricas completas' },
  [Feature.ADMIN_BADGES]: { name: 'Gestão de Badges', description: 'Criar conquistas' },
  [Feature.ADMIN_ANNOUNCEMENTS]: { name: 'Anúncios', description: 'Criar anúncios' },
  [Feature.ADMIN_EVENTS]: { name: 'Eventos', description: 'Gerenciar eventos' },
  [Feature.ADMIN_PRODUCTS]: { name: 'Gestão de Produtos', description: 'Loja admin' },
  [Feature.WHITE_LABEL]: { name: 'White Label', description: 'Sem marca Rovex' },
  [Feature.CUSTOM_DOMAIN]: { name: 'Domínio Próprio', description: 'URL personalizada' },
  [Feature.API_ACCESS]: { name: 'Acesso à API', description: 'API para integrações' },
  [Feature.PRIORITY_SUPPORT]: { name: 'Suporte Prioritário', description: 'Atendimento VIP' },
  [Feature.RADIO_247]: { name: 'Rádio 24/7', description: 'Música ambiente' },
  [Feature.PUSH_NOTIFICATIONS]: { name: 'Push Notifications', description: 'Notificações push' },
  [Feature.EMAIL_CUSTOMIZATION]: { name: 'Emails Customizados', description: 'Templates de email' },
  [Feature.MULTIPLE_ADMINS]: { name: 'Múltiplos Admins', description: 'Equipe de moderação' },
};

// ============================================
// FUNÇÕES HELPER
// ============================================

/**
 * Verifica se um plano tem acesso a uma feature
 */
export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

/**
 * Retorna o plano mínimo necessário para uma feature
 */
export function getMinimumPlan(feature: Feature): Plan {
  const plans: Plan[] = ['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'];
  for (const plan of plans) {
    if (PLAN_FEATURES[plan].includes(feature)) {
      return plan;
    }
  }
  return 'ENTERPRISE';
}

/**
 * Retorna features bloqueadas para um plano
 */
export function getLockedFeatures(plan: Plan): Feature[] {
  const allFeatures = Object.values(Feature);
  const available = PLAN_FEATURES[plan];
  return allFeatures.filter(f => !available.includes(f));
}

/**
 * Retorna features que seriam desbloqueadas ao fazer upgrade
 */
export function getUpgradeFeatures(currentPlan: Plan, targetPlan: Plan): Feature[] {
  const current = PLAN_FEATURES[currentPlan];
  const target = PLAN_FEATURES[targetPlan];
  return target.filter(f => !current.includes(f));
}
