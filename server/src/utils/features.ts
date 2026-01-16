/**
 * Feature Gates System - Shared Types and Helpers
 * 
 * Este arquivo contém as definições de features, planos e helpers
 * que serão usados tanto no backend quanto no frontend.
 * 
 * NOTA: No futuro, isso será migrado para o pacote @rovex/shared
 */

// ===================== ENUMS =====================

export enum Plan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
}

export enum Feature {
  // Auth & Users
  BASIC_AUTH = 'BASIC_AUTH',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  SOCIAL_LOGIN_GOOGLE = 'SOCIAL_LOGIN_GOOGLE',
  SESSION_SECURITY = 'SESSION_SECURITY',
  VERIFIED_PROFILE = 'VERIFIED_PROFILE',
  
  // Feed & Content
  FEED = 'FEED',
  CREATE_POST = 'CREATE_POST',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD',
  VIDEO_UPLOAD = 'VIDEO_UPLOAD',
  HIGHLIGHTS = 'HIGHLIGHTS',
  POST_VISIBILITY = 'POST_VISIBILITY',
  
  // Stories
  STORIES = 'STORIES',
  STORY_VIEWS = 'STORY_VIEWS',
  STORY_EDITOR = 'STORY_EDITOR',
  
  // Gamification
  XP_SYSTEM = 'XP_SYSTEM',
  ZIONS_POINTS = 'ZIONS_POINTS',
  ZIONS_CASH = 'ZIONS_CASH',
  DAILY_LOGIN = 'DAILY_LOGIN',
  BADGES = 'BADGES',
  EQUIPPED_BADGE = 'EQUIPPED_BADGE',
  LEVEL_TIMELINE = 'LEVEL_TIMELINE',
  
  // Ranking
  RANKING = 'RANKING',
  RANKING_PERIODS = 'RANKING_PERIODS',
  
  // Economy
  ZIONS_PURCHASE = 'ZIONS_PURCHASE',
  ZIONS_WITHDRAWAL = 'ZIONS_WITHDRAWAL',
  
  // Supply Box
  SUPPLY_BOX = 'SUPPLY_BOX',
  
  // Marketplace
  MARKETPLACE_P2P = 'MARKETPLACE_P2P',
  
  // Store
  PRODUCT_STORE = 'PRODUCT_STORE',
  GAME_KEYS = 'GAME_KEYS',
  PAYMENT_ZIONS = 'PAYMENT_ZIONS',
  PAYMENT_PIX = 'PAYMENT_PIX',
  PAYMENT_CARD = 'PAYMENT_CARD',
  
  // Customization
  CUSTOMIZATION_SHOP = 'CUSTOMIZATION_SHOP',
  THEME_PACKS = 'THEME_PACKS',
  
  // Chat & Messages
  DIRECT_MESSAGES = 'DIRECT_MESSAGES',
  READ_RECEIPTS = 'READ_RECEIPTS',
  CHAT_IMAGES = 'CHAT_IMAGES',
  
  // Groups
  GROUPS = 'GROUPS',
  GROUP_BACKGROUNDS = 'GROUP_BACKGROUNDS',
  GROUP_NSFW = 'GROUP_NSFW',
  
  // Social Integrations
  SOCIAL_INTEGRATION_1 = 'SOCIAL_INTEGRATION_1',
  SOCIAL_INTEGRATION_3 = 'SOCIAL_INTEGRATION_3',
  SOCIAL_INTEGRATION_UNLIMITED = 'SOCIAL_INTEGRATION_UNLIMITED',
  DISCORD_OAUTH = 'DISCORD_OAUTH',
  STEAM_OAUTH = 'STEAM_OAUTH',
  TWITCH_OAUTH = 'TWITCH_OAUTH',
  
  // Admin
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_GRID_DASHBOARD = 'ADMIN_GRID_DASHBOARD',
  ADMIN_BADGES = 'ADMIN_BADGES',
  ADMIN_WITHDRAWALS = 'ADMIN_WITHDRAWALS',
  DEV_TOOLS = 'DEV_TOOLS',
  
  // Analytics
  ANALYTICS_BASIC = 'ANALYTICS_BASIC',
  ANALYTICS_ADVANCED = 'ANALYTICS_ADVANCED',
  ANALYTICS_API = 'ANALYTICS_API',
  REVENUE_REPORTS = 'REVENUE_REPORTS',
  
  // Misc
  WELCOME_TOUR = 'WELCOME_TOUR',
  PHOTO_CATALOG = 'PHOTO_CATALOG',
  WHITE_LABEL = 'WHITE_LABEL',
  
  // Rovex Integration
  ROVEX_INTEGRATION = 'ROVEX_INTEGRATION',
}

export enum FeatureCategory {
  AUTH = 'Autenticação',
  CONTENT = 'Conteúdo',
  STORIES = 'Stories',
  GAMIFICATION = 'Gamificação',
  ECONOMY = 'Economia',
  MARKETPLACE = 'Marketplace',
  STORE = 'Loja',
  CUSTOMIZATION = 'Customização',
  CHAT = 'Mensagens',
  GROUPS = 'Grupos',
  SOCIAL = 'Integrações',
  ADMIN = 'Administração',
  ANALYTICS = 'Analytics',
  MISC = 'Outros',
}

// ===================== FEATURE INFO =====================

export interface FeatureInfo {
  name: string;
  description: string;
  category: FeatureCategory;
  icon?: string;
}

export const FEATURE_INFO: Record<Feature, FeatureInfo> = {
  // Auth
  [Feature.BASIC_AUTH]: { name: 'Autenticação Básica', description: 'Login com email e senha', category: FeatureCategory.AUTH },
  [Feature.EMAIL_VERIFICATION]: { name: 'Verificação de Email', description: 'Confirmação de email por código', category: FeatureCategory.AUTH },
  [Feature.SOCIAL_LOGIN_GOOGLE]: { name: 'Login com Google', description: 'Autenticação via Google OAuth', category: FeatureCategory.AUTH },
  [Feature.SESSION_SECURITY]: { name: 'Sessão Única', description: 'Login permitido em apenas um dispositivo', category: FeatureCategory.AUTH },
  [Feature.VERIFIED_PROFILE]: { name: 'Perfil Verificado', description: 'Badge de verificação no perfil', category: FeatureCategory.AUTH },
  
  // Content
  [Feature.FEED]: { name: 'Feed Principal', description: 'Visualização e navegação do feed', category: FeatureCategory.CONTENT },
  [Feature.CREATE_POST]: { name: 'Criar Posts', description: 'Publicar conteúdo no feed', category: FeatureCategory.CONTENT },
  [Feature.IMAGE_UPLOAD]: { name: 'Upload de Imagens', description: 'Enviar imagens nos posts', category: FeatureCategory.CONTENT },
  [Feature.VIDEO_UPLOAD]: { name: 'Upload de Vídeos', description: 'Enviar vídeos nos posts', category: FeatureCategory.CONTENT },
  [Feature.HIGHLIGHTS]: { name: 'Destaques', description: 'Posts em destaque no feed', category: FeatureCategory.CONTENT },
  [Feature.POST_VISIBILITY]: { name: 'Visibilidade de Posts', description: 'Posts públicos ou privados', category: FeatureCategory.CONTENT },
  
  // Stories
  [Feature.STORIES]: { name: 'Stories', description: 'Compartilhar stories temporários', category: FeatureCategory.STORIES },
  [Feature.STORY_VIEWS]: { name: 'Visualizações de Stories', description: 'Ver quem visualizou seu story', category: FeatureCategory.STORIES },
  [Feature.STORY_EDITOR]: { name: 'Editor de Stories', description: 'Editar stories antes de publicar', category: FeatureCategory.STORIES },
  
  // Gamification
  [Feature.XP_SYSTEM]: { name: 'Sistema de XP', description: 'Ganhar experiência por ações', category: FeatureCategory.GAMIFICATION },
  [Feature.ZIONS_POINTS]: { name: 'Zions Points', description: 'Moeda virtual da comunidade', category: FeatureCategory.GAMIFICATION },
  [Feature.ZIONS_CASH]: { name: 'Zions Cash', description: 'Moeda conversível em dinheiro real', category: FeatureCategory.GAMIFICATION },
  [Feature.DAILY_LOGIN]: { name: 'Bônus Diário', description: 'Recompensas por login consecutivo', category: FeatureCategory.GAMIFICATION },
  [Feature.BADGES]: { name: 'Conquistas', description: 'Sistema de badges e achievements', category: FeatureCategory.GAMIFICATION },
  [Feature.EQUIPPED_BADGE]: { name: 'Badge Equipada', description: 'Exibir badge no perfil', category: FeatureCategory.GAMIFICATION },
  [Feature.LEVEL_TIMELINE]: { name: 'Timeline de Níveis', description: 'Visualização de progresso', category: FeatureCategory.GAMIFICATION },
  
  // Ranking
  [Feature.RANKING]: { name: 'Ranking Global', description: 'Leaderboard da comunidade', category: FeatureCategory.GAMIFICATION },
  [Feature.RANKING_PERIODS]: { name: 'Ranking por Período', description: 'Rankings semanal e mensal', category: FeatureCategory.GAMIFICATION },
  
  // Economy
  [Feature.ZIONS_PURCHASE]: { name: 'Compra de Zions', description: 'Comprar Zions com dinheiro real', category: FeatureCategory.ECONOMY },
  [Feature.ZIONS_WITHDRAWAL]: { name: 'Saque de Zions', description: 'Converter Zions Cash em PIX', category: FeatureCategory.ECONOMY },
  
  // Supply Box
  [Feature.SUPPLY_BOX]: { name: 'Supply Box', description: 'Sistema de loot boxes diárias', category: FeatureCategory.ECONOMY, icon: '🎁' },
  
  // Marketplace
  [Feature.MARKETPLACE_P2P]: { name: 'Marketplace P2P', description: 'Comprar e vender itens entre usuários', category: FeatureCategory.MARKETPLACE, icon: '🛒' },
  
  // Store
  [Feature.PRODUCT_STORE]: { name: 'Loja de Produtos', description: 'Loja oficial da comunidade', category: FeatureCategory.STORE },
  [Feature.GAME_KEYS]: { name: 'Game Keys', description: 'Venda de keys de jogos', category: FeatureCategory.STORE },
  [Feature.PAYMENT_ZIONS]: { name: 'Pagamento Zions', description: 'Pagar com Zions Points', category: FeatureCategory.STORE },
  [Feature.PAYMENT_PIX]: { name: 'Pagamento PIX', description: 'Pagar com PIX', category: FeatureCategory.STORE },
  [Feature.PAYMENT_CARD]: { name: 'Pagamento Cartão', description: 'Pagar com cartão de crédito', category: FeatureCategory.STORE },
  
  // Customization
  [Feature.CUSTOMIZATION_SHOP]: { name: 'Loja de Customização', description: 'Comprar temas e cores', category: FeatureCategory.CUSTOMIZATION, icon: '🎨' },
  [Feature.THEME_PACKS]: { name: 'Theme Packs', description: 'Pacotes de temas premium', category: FeatureCategory.CUSTOMIZATION },
  
  // Chat
  [Feature.DIRECT_MESSAGES]: { name: 'Mensagens Diretas', description: 'Chat privado entre usuários', category: FeatureCategory.CHAT },
  [Feature.READ_RECEIPTS]: { name: 'Confirmação de Leitura', description: 'Ver quando mensagem foi lida', category: FeatureCategory.CHAT },
  [Feature.CHAT_IMAGES]: { name: 'Imagens no Chat', description: 'Enviar imagens no chat', category: FeatureCategory.CHAT },
  
  // Groups
  [Feature.GROUPS]: { name: 'Grupos de Chat', description: 'Criar e participar de grupos', category: FeatureCategory.GROUPS },
  [Feature.GROUP_BACKGROUNDS]: { name: 'Fundos de Grupo', description: 'Temas personalizados para grupos', category: FeatureCategory.GROUPS },
  [Feature.GROUP_NSFW]: { name: 'Grupos NSFW', description: 'Marcar grupos como adulto', category: FeatureCategory.GROUPS },
  
  // Social Integrations
  [Feature.SOCIAL_INTEGRATION_1]: { name: '1 Integração Social', description: 'Conectar 1 rede social', category: FeatureCategory.SOCIAL },
  [Feature.SOCIAL_INTEGRATION_3]: { name: '3 Integrações Sociais', description: 'Conectar até 3 redes', category: FeatureCategory.SOCIAL },
  [Feature.SOCIAL_INTEGRATION_UNLIMITED]: { name: 'Integrações Ilimitadas', description: 'Conectar redes ilimitadas', category: FeatureCategory.SOCIAL },
  [Feature.DISCORD_OAUTH]: { name: 'Integração Discord', description: 'Conectar conta Discord', category: FeatureCategory.SOCIAL, icon: '🎮' },
  [Feature.STEAM_OAUTH]: { name: 'Integração Steam', description: 'Conectar conta Steam', category: FeatureCategory.SOCIAL },
  [Feature.TWITCH_OAUTH]: { name: 'Integração Twitch', description: 'Conectar conta Twitch', category: FeatureCategory.SOCIAL },
  
  // Admin
  [Feature.ADMIN_DASHBOARD]: { name: 'Painel Admin', description: 'Dashboard administrativo', category: FeatureCategory.ADMIN },
  [Feature.ADMIN_GRID_DASHBOARD]: { name: 'Grid Dashboard', description: 'Dashboard com widgets', category: FeatureCategory.ADMIN },
  [Feature.ADMIN_BADGES]: { name: 'Gerenciar Badges', description: 'Criar badges customizadas', category: FeatureCategory.ADMIN },
  [Feature.ADMIN_WITHDRAWALS]: { name: 'Aprovar Saques', description: 'Gerenciar solicitações de saque', category: FeatureCategory.ADMIN },
  [Feature.DEV_TOOLS]: { name: 'Dev Tools', description: 'Ferramentas de desenvolvimento', category: FeatureCategory.ADMIN },
  
  // Analytics
  [Feature.ANALYTICS_BASIC]: { name: 'Analytics Básico', description: 'Métricas essenciais', category: FeatureCategory.ANALYTICS },
  [Feature.ANALYTICS_ADVANCED]: { name: 'Analytics Avançado', description: 'Métricas detalhadas', category: FeatureCategory.ANALYTICS, icon: '📊' },
  [Feature.ANALYTICS_API]: { name: 'API de Analytics', description: 'Exportar métricas via API', category: FeatureCategory.ANALYTICS },
  [Feature.REVENUE_REPORTS]: { name: 'Relatórios de Receita', description: 'Relatórios financeiros', category: FeatureCategory.ANALYTICS },
  
  // Misc
  [Feature.WELCOME_TOUR]: { name: 'Tour de Boas-vindas', description: 'Onboarding para novos usuários', category: FeatureCategory.MISC },
  [Feature.PHOTO_CATALOG]: { name: 'Catálogo de Fotos', description: 'Galeria de fotos da comunidade', category: FeatureCategory.MISC },
  [Feature.WHITE_LABEL]: { name: 'White Label', description: 'Remover marca Rovex', category: FeatureCategory.MISC },
  
  // Rovex
  [Feature.ROVEX_INTEGRATION]: { name: 'Integração Rovex', description: 'Comunicação com Rovex Platform', category: FeatureCategory.MISC },
};

// ===================== PLAN FEATURES =====================

export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  [Plan.FREE]: [
    // Auth
    Feature.BASIC_AUTH,
    Feature.EMAIL_VERIFICATION,
    // Content
    Feature.FEED,
    Feature.CREATE_POST,
    // Stories
    Feature.STORIES,
    // Gamification
    Feature.XP_SYSTEM,
    Feature.ZIONS_POINTS,
    Feature.DAILY_LOGIN,
    Feature.BADGES,
    Feature.RANKING,
    // Chat
    Feature.DIRECT_MESSAGES,
  ],
  
  [Plan.STARTER]: [
    // All FREE features +
    ...[], // Inherited at runtime
    // Auth
    Feature.SESSION_SECURITY,
    // Content
    Feature.IMAGE_UPLOAD,
    Feature.HIGHLIGHTS,
    Feature.POST_VISIBILITY,
    // Stories
    Feature.STORY_VIEWS,
    // Gamification
    Feature.EQUIPPED_BADGE,
    Feature.LEVEL_TIMELINE,
    // Economy
    Feature.SUPPLY_BOX,
    // Customization
    Feature.CUSTOMIZATION_SHOP,
    // Chat
    Feature.READ_RECEIPTS,
    Feature.CHAT_IMAGES,
    // Groups
    Feature.GROUPS,
    // Social
    Feature.SOCIAL_INTEGRATION_1,
    Feature.DISCORD_OAUTH,
    // Admin
    Feature.ADMIN_DASHBOARD,
    Feature.ANALYTICS_BASIC,
    // Store
    Feature.PRODUCT_STORE,
    Feature.PAYMENT_ZIONS,
    // Misc
    Feature.WELCOME_TOUR,
    Feature.PHOTO_CATALOG,
    Feature.ROVEX_INTEGRATION,
  ],
  
  [Plan.GROWTH]: [
    // All STARTER features +
    ...[], // Inherited at runtime
    // Auth
    Feature.SOCIAL_LOGIN_GOOGLE,
    Feature.VERIFIED_PROFILE,
    // Content
    Feature.VIDEO_UPLOAD,
    // Stories
    Feature.STORY_EDITOR,
    // Gamification
    Feature.ZIONS_CASH,
    Feature.RANKING_PERIODS,
    // Economy
    Feature.ZIONS_PURCHASE,
    Feature.MARKETPLACE_P2P,
    // Customization
    Feature.THEME_PACKS,
    // Groups
    Feature.GROUP_BACKGROUNDS,
    Feature.GROUP_NSFW,
    // Social
    Feature.SOCIAL_INTEGRATION_3,
    Feature.STEAM_OAUTH,
    Feature.TWITCH_OAUTH,
    // Admin
    Feature.ADMIN_GRID_DASHBOARD,
    Feature.ADMIN_BADGES,
    Feature.ANALYTICS_ADVANCED,
    // Store
    Feature.GAME_KEYS,
    Feature.PAYMENT_PIX,
  ],
  
  [Plan.ENTERPRISE]: [
    // All GROWTH features +
    ...[], // Inherited at runtime
    // Economy
    Feature.ZIONS_WITHDRAWAL,
    // Social
    Feature.SOCIAL_INTEGRATION_UNLIMITED,
    // Admin
    Feature.ADMIN_WITHDRAWALS,
    Feature.DEV_TOOLS,
    Feature.ANALYTICS_API,
    Feature.REVENUE_REPORTS,
    // Store
    Feature.PAYMENT_CARD,
    // Misc
    Feature.WHITE_LABEL,
  ],
};

// ===================== PLAN DETAILS =====================

export interface PlanDetails {
  name: string;
  description: string;
  priceMonthly: number; // em centavos (R$ 247 = 24700)
  priceYearly: number;
  maxUsers: number | null;
  features: string[]; // Feature highlights para exibição
  color: string;
}

export const PLAN_DETAILS: Record<Plan, PlanDetails> = {
  [Plan.FREE]: {
    name: 'Free',
    description: 'Trial de 14 dias',
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 50,
    features: [
      'Feed básico + posts + stories',
      'Gamificação básica (XP, níveis)',
      'Chat direto simples',
      'Sistema de amigos',
      'Ranking global',
    ],
    color: '#6b7280',
  },
  [Plan.STARTER]: {
    name: 'Starter',
    description: 'Para comunidades pequenas',
    priceMonthly: 24700, // R$ 247
    priceYearly: 251900, // R$ 2.519 (~R$ 210/mês)
    maxUsers: 500,
    features: [
      'Upload de imagens (Cloudinary)',
      'Supply Box (1ª grátis/dia)',
      'Loja de Customização',
      'Grupos de chat (até 10)',
      '1 integração social',
      'Admin dashboard básico',
    ],
    color: '#10b981',
  },
  [Plan.GROWTH]: {
    name: 'Growth',
    description: 'Para comunidades em crescimento',
    priceMonthly: 59700, // R$ 597
    priceYearly: 608900, // R$ 6.089 (~R$ 507/mês)
    maxUsers: 2000,
    features: [
      'Upload de vídeos',
      'Marketplace P2P',
      'Theme Packs',
      'Zions Cash + Saques',
      'Product Store (Game Keys)',
      '3 integrações sociais',
      'Analytics avançado',
    ],
    color: '#f59e0b',
  },
  [Plan.ENTERPRISE]: {
    name: 'Enterprise',
    description: 'Para grandes comunidades',
    priceMonthly: 149700, // R$ 1.497
    priceYearly: 1526900, // R$ 15.269 (~R$ 1.272/mês)
    maxUsers: null, // Unlimited
    features: [
      'Integrações ilimitadas',
      'White-label',
      'Pagamento via cartão',
      'API de métricas',
      'Revenue reports',
      'Dev tools',
      'Suporte dedicado',
      'SLA 99.9%',
    ],
    color: '#8b5cf6',
  },
};

// ===================== HELPER FUNCTIONS =====================

const PLAN_HIERARCHY: Plan[] = [Plan.FREE, Plan.STARTER, Plan.GROWTH, Plan.ENTERPRISE];

/**
 * Retorna todas as features disponíveis para um plano (incluindo herdadas)
 */
export function getAllFeaturesForPlan(plan: Plan): Feature[] {
  const planIndex = PLAN_HIERARCHY.indexOf(plan);
  const allFeatures = new Set<Feature>();
  
  // Adiciona features de todos os planos até o atual (herança)
  for (let i = 0; i <= planIndex; i++) {
    const planFeatures = PLAN_FEATURES[PLAN_HIERARCHY[i]];
    planFeatures.forEach(f => allFeatures.add(f));
  }
  
  return Array.from(allFeatures);
}

/**
 * Verifica se um plano tem acesso a uma feature
 */
export function hasFeature(plan: Plan | string, feature: Feature): boolean {
  const planEnum = plan as Plan;
  const availableFeatures = getAllFeaturesForPlan(planEnum);
  return availableFeatures.includes(feature);
}

/**
 * Retorna o plano mínimo necessário para uma feature
 */
export function getMinimumPlan(feature: Feature): Plan {
  for (const plan of PLAN_HIERARCHY) {
    if (hasFeature(plan, feature)) {
      return plan;
    }
  }
  return Plan.ENTERPRISE; // Default to highest if not found
}

/**
 * Retorna todas as features bloqueadas para um plano
 */
export function getLockedFeatures(plan: Plan | string): Feature[] {
  const planEnum = plan as Plan;
  const availableFeatures = getAllFeaturesForPlan(planEnum);
  const allFeatures = Object.values(Feature);
  
  return allFeatures.filter(f => !availableFeatures.includes(f));
}

/**
 * Retorna as features que seriam desbloqueadas no próximo plano
 */
export function getUpgradeFeatures(plan: Plan | string): Feature[] {
  const planEnum = plan as Plan;
  const currentIndex = PLAN_HIERARCHY.indexOf(planEnum);
  
  if (currentIndex >= PLAN_HIERARCHY.length - 1) {
    return []; // Already at highest plan
  }
  
  const nextPlan = PLAN_HIERARCHY[currentIndex + 1];
  const currentFeatures = getAllFeaturesForPlan(planEnum);
  const nextFeatures = getAllFeaturesForPlan(nextPlan);
  
  return nextFeatures.filter(f => !currentFeatures.includes(f));
}

/**
 * Retorna o próximo plano na hierarquia
 */
export function getNextPlan(plan: Plan | string): Plan | null {
  const planEnum = plan as Plan;
  const currentIndex = PLAN_HIERARCHY.indexOf(planEnum);
  
  if (currentIndex >= PLAN_HIERARCHY.length - 1) {
    return null;
  }
  
  return PLAN_HIERARCHY[currentIndex + 1];
}

/**
 * Formata preço em centavos para string em Reais
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
