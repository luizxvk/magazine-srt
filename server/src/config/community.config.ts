// ============================================
// COMMUNITY CONFIGURATION TYPES & DEFAULTS
// ============================================
// Este arquivo define a estrutura de configuração de cada comunidade
// Magazine SRT = Template base com TODAS as features (ENTERPRISE)
// Outras comunidades herdam daqui mas com features limitadas por plano

export type Plan = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface CommunityConfig {
  // === Identificação ===
  id: string;                    // UUID único da comunidade
  subdomain: string;             // "magazine-srt", "gamerhub", etc
  name: string;                  // "Magazine SRT", "GamerHub", etc
  slogan?: string;               // "A comunidade definitiva"
  plan: Plan;                    // Plano ativo
  
  // === Assets Visuais ===
  logoUrl: string;               // Logo principal (header, loading)
  logoIconUrl?: string;          // Ícone quadrado (favicon, PWA)
  faviconUrl?: string;           // Favicon 32x32
  ogImageUrl?: string;           // OpenGraph 1200x630
  loginBackgroundUrl?: string;   // Background da página de login
  
  // === Cores do Tema ===
  primaryColor: string;          // Cor principal (botões, links) - ex: "#d4af37"
  secondaryColor?: string;       // Cor secundária
  accentColor?: string;          // Cor de destaque (hover, focus)
  
  // === Nomenclaturas Customizáveis ===
  currencyName: string;          // Nome da moeda: "Zions", "Coins", "Pontos"
  currencySymbol: string;        // Símbolo: "Z$", "🪙", "P"
  currencyIcon?: string;         // URL do ícone da moeda
  tierVipName: string;           // Nome do tier VIP: "MAGAZINE", "ELITE", "PRO"
  tierVipColor: string;          // Cor do tier VIP: "#d4af37"
  tierVipSlogan?: string;        // Slogan do tier VIP: "A Elite do Sucesso"
  tierStdName: string;           // Nome do tier padrão: "MGT", "MEMBER", "FREE"
  tierStdSlogan?: string;        // Slogan do tier padrão: "Velocidade e Poder"
  backgroundColor: string;       // Cor de fundo/tema do tier padrão: "#10b981"
  xpName?: string;               // Nome do XP: "XP", "EXP", "Experiência"
  
  // === URLs e Domínios ===
  baseUrl?: string;              // URL customizada (GROWTH+)
  apiUrl?: string;               // URL da API
  cdnUrl?: string;               // URL do CDN
  
  // === Integrações ===
  rovexApiSecret: string;        // Secret para autenticar com Rovex
  databaseUrl: string;           // Connection string do PostgreSQL
  
  // === Limites por Plano ===
  limits: {
    maxUsers: number;            // FREE: 50, STARTER: 500, GROWTH: 2000, ENTERPRISE: Infinity
    maxStorageMB: number;        // Limite de storage
    maxUploadsPerMonth: number;  // Limite de uploads
    maxEmailsPerMonth: number;   // Limite de emails transacionais
  };
  
  // === Metadata ===
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// CONFIGURAÇÃO PADRÃO (Magazine SRT - ENTERPRISE)
// ============================================
// Esta é a config default quando rodando localmente ou como Magazine SRT
export const DEFAULT_COMMUNITY_CONFIG: CommunityConfig = {
  id: 'magazine-srt-default',
  subdomain: 'magazine-srt',
  name: 'Magazine SRT',
  slogan: 'A comunidade definitiva',
  plan: 'ENTERPRISE',
  
  // Assets (URLs do Magazine SRT - usa logo Rovex para tier STD)
  logoUrl: '/assets/logo-mgzn.png',
  logoIconUrl: '/assets/logo-rovex.png',
  faviconUrl: '/favicon.ico',
  
  // Cores do Magazine
  primaryColor: '#d4af37',      // Dourado
  secondaryColor: '#50c878',    // Esmeralda
  accentColor: '#f59e0b',       // Âmbar
  
  // Nomenclaturas Magazine
  currencyName: 'Zions',
  currencySymbol: 'Z$',
  currencyIcon: '/assets/zions/zion-50.png',
  tierVipName: 'MAGAZINE',
  tierVipColor: '#d4af37',
  tierVipSlogan: 'A Elite do Sucesso',
  tierStdName: 'MGT',
  tierStdSlogan: 'Velocidade e Poder',
  backgroundColor: '#8B5CF6',
  xpName: 'XP',
  
  // Credenciais (substituídas por env vars em prod)
  rovexApiSecret: process.env.ROVEX_API_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Limites ENTERPRISE (sem limites práticos)
  limits: {
    maxUsers: Infinity,
    maxStorageMB: 102400,        // 100 GB
    maxUploadsPerMonth: 999999,
    maxEmailsPerMonth: 50000,
  },
};

// ============================================
// CONFIGURAÇÃO ROVEX (Para comunidades genéricas/template)
// ============================================
// Esta config é usada quando uma comunidade não é encontrada no Rovex Platform
export const ROVEX_DEFAULT_CONFIG: CommunityConfig = {
  id: 'rovex-default',
  subdomain: 'rovex',
  name: 'Rovex',
  slogan: 'Sua comunidade digital',
  plan: 'ENTERPRISE',
  
  // Assets (URLs do Rovex)
  logoUrl: '/assets/logo-rovex.png',
  logoIconUrl: '/assets/logo-rovex.png',
  faviconUrl: '/favicon.ico',
  
  // Cores do Rovex
  primaryColor: '#8B5CF6',      // Roxo Rovex
  secondaryColor: '#7C3AED',    // Roxo escuro
  accentColor: '#A78BFA',       // Roxo claro
  
  // Nomenclaturas Rovex
  currencyName: 'Coins',
  currencySymbol: '🪙',
  currencyIcon: '/assets/coin.png',
  tierVipName: 'PRO',
  tierVipColor: '#8B5CF6',
  tierVipSlogan: 'Membro Premium',
  tierStdName: 'RVX',
  tierStdSlogan: 'Seja bem-vindo',
  backgroundColor: '#7C3AED',
  xpName: 'XP',
  
  // Credenciais (substituídas por env vars em prod)
  rovexApiSecret: process.env.ROVEX_API_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Limites ENTERPRISE
  limits: {
    maxUsers: Infinity,
    maxStorageMB: 102400,
    maxUploadsPerMonth: 999999,
    maxEmailsPerMonth: 50000,
  },
};

// ============================================
// LIMITES POR PLANO
// ============================================
export const PLAN_LIMITS: Record<Plan, CommunityConfig['limits']> = {
  FREE: {
    maxUsers: 50,
    maxStorageMB: 500,
    maxUploadsPerMonth: 100,
    maxEmailsPerMonth: 100,
  },
  STARTER: {
    maxUsers: 500,
    maxStorageMB: 5120,          // 5 GB
    maxUploadsPerMonth: 1000,
    maxEmailsPerMonth: 1000,
  },
  GROWTH: {
    maxUsers: 2000,
    maxStorageMB: 25600,         // 25 GB
    maxUploadsPerMonth: 5000,
    maxEmailsPerMonth: 10000,
  },
  ENTERPRISE: {
    maxUsers: Infinity,
    maxStorageMB: 102400,        // 100 GB
    maxUploadsPerMonth: 999999,
    maxEmailsPerMonth: 50000,
  },
};
