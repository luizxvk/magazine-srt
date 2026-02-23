// ============================================
// TENANT DETECTION MIDDLEWARE
// ============================================
// Detecta qual comunidade está acessando baseado no subdomain
// Busca configuração na Rovex Platform e aplica

import { Request, Response, NextFunction } from 'express';
import { CommunityConfig, DEFAULT_COMMUNITY_CONFIG } from '../config/community.config';
import { setCommunityConfig } from '../services/tenantService';

// Cache simples em memória (em prod usar Redis/Vercel KV)
const configCache = new Map<string, { config: CommunityConfig; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Middleware que detecta a comunidade pelo subdomain/header e carrega config
 */
export async function tenantDetection(req: Request, res: Response, next: NextFunction) {
  try {
    // Em desenvolvimento local, usar config default (Magazine SRT)
    // NOTA: Em produção (Vercel), NODE_ENV=production
    if (process.env.NODE_ENV === 'development' && !process.env.FORCE_MULTI_TENANT) {
      setCommunityConfig(DEFAULT_COMMUNITY_CONFIG);
      return next();
    }
    
    // 1. Primeiro tenta header explícito (para frontends clonados)
    let subdomain = req.headers['x-community-subdomain'] as string || null;
    
    // 2. Se não tiver header, extrai do Host (backend URL)
    if (!subdomain) {
      const host = req.headers.host || '';
      subdomain = extractSubdomain(host);
      console.log(`[TenantDetection] Host: ${host}, extracted subdomain: ${subdomain}`);
    }
    
    // 3. Também pode vir do Origin (CORS) - FRONTEND URL
    if (!subdomain && req.headers.origin) {
      const originHost = new URL(req.headers.origin as string).host;
      subdomain = extractSubdomain(originHost);
      console.log(`[TenantDetection] Origin: ${req.headers.origin}, extracted subdomain: ${subdomain}`);
    }
    
    // 4. Fallback: variável de ambiente (para backends específicos)
    if (!subdomain) {
      subdomain = process.env.ROVEX_COMMUNITY_SLUG || null;
    }
    
    if (!subdomain) {
      // Sem subdomain = Magazine SRT default
      console.log(`[TenantDetection] No subdomain detected, using default config`);
      setCommunityConfig(DEFAULT_COMMUNITY_CONFIG);
      return next();
    }
    
    // Buscar config (com cache)
    const config = await getCommunityConfigBySubdomain(subdomain);
    
    if (!config) {
      // Comunidade não encontrada no Rovex - criar config básico com defaults
      // Isso permite que novas comunidades funcionem mesmo sem registro completo
      console.log(`[TenantDetection] Community "${subdomain}" not found in Rovex, using generated defaults`);
      
      const generatedConfig: CommunityConfig = {
        ...DEFAULT_COMMUNITY_CONFIG,
        id: subdomain,
        subdomain: subdomain,
        name: subdomain.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // "teste-mt-001" -> "Teste Mt 001"
      };
      
      setCommunityConfig(generatedConfig);
      (req as any).community = generatedConfig;
      return next();
    }
    
    // Aplicar config para este request
    setCommunityConfig(config);
    
    // Anexar no request para acesso fácil
    (req as any).community = config;
    
    next();
  } catch (error) {
    console.error('[TenantDetection] Error:', error);
    // Em caso de erro, usar config default para não quebrar
    setCommunityConfig(DEFAULT_COMMUNITY_CONFIG);
    next();
  }
}

/**
 * Extrai subdomain do host
 * Exemplos:
 * - "magazine-srt.comunidades.rovex.app" → "magazine-srt"
 * - "gamerhub.comunidades.rovex.app" → "gamerhub"
 * - "localhost:3000" → null
 * - "magazine-srt.com" → null (domínio custom, tratar diferente)
 */
function extractSubdomain(host: string): string | null {
  // Remover porta
  const hostWithoutPort = host.split(':')[0];
  
  // Padrão Rovex: {subdomain}.comunidades.rovex.app
  const rovexPattern = /^([a-z0-9-]+)\.comunidades\.rovex\.app$/;
  const match = hostWithoutPort.match(rovexPattern);
  if (match) {
    return match[1];
  }
  
  // Padrão Vercel provisioning: magazine-{subdomain}-frontend.vercel.app
  const vercelProvisionPattern = /^magazine-([a-z0-9-]+)-frontend\.vercel\.app$/;
  const vercelMatch = hostWithoutPort.match(vercelProvisionPattern);
  if (vercelMatch) {
    return vercelMatch[1];
  }
  
  // Padrão Vercel direto: {subdomain}.vercel.app (exceto magazine-srt, magazine-frontend)
  // Também captura pattern com hífens como "team-liquid-pro"
  const vercelDirectPattern = /^([a-z0-9][a-z0-9-]*[a-z0-9])\.vercel\.app$/;
  const directMatch = hostWithoutPort.match(vercelDirectPattern);
  if (directMatch) {
    const subdomain = directMatch[1];
    // Ignorar os projetos principais (magazine-srt, magazine-frontend, rovex-hub) 
    // mas aceitar comunidades como "team-liquid-pro"
    const ignoredProjects = ['magazine-srt', 'magazine-frontend', 'rovex-hub', 'rovex-platform', 'vercel'];
    if (!ignoredProjects.includes(subdomain)) {
      console.log(`[TenantDetection] Vercel direct pattern matched: ${subdomain}`);
      return subdomain;
    }
  }
  
  // Localhost ou domínio custom = null (usar default ou buscar por domínio)
  return null;
}

/**
 * Busca config da comunidade com cache
 */
async function getCommunityConfigBySubdomain(subdomain: string): Promise<CommunityConfig | null> {
  // Verificar cache
  const cached = configCache.get(subdomain);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.config;
  }
  
  // Magazine SRT é sempre o default
  if (subdomain === 'magazine-srt') {
    return DEFAULT_COMMUNITY_CONFIG;
  }
  
  // Buscar na Rovex Platform
  const config = await fetchFromRovexPlatform(subdomain);
  
  if (config) {
    // Cachear
    configCache.set(subdomain, { config, cachedAt: Date.now() });
  }
  
  return config;
}

/**
 * Busca configuração na Rovex Platform API
 */
async function fetchFromRovexPlatform(subdomain: string): Promise<CommunityConfig | null> {
  const ROVEX_API_URL = process.env.ROVEX_API_URL;
  
  if (!ROVEX_API_URL) {
    console.warn('[TenantDetection] ROVEX_API_URL not configured');
    return null;
  }
  
  try {
    const response = await fetch(`${ROVEX_API_URL}/api/integration/public/community/${subdomain}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Rovex API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }
    
    // Mapear resposta da Rovex para nossa interface
    return mapRovexResponseToConfig(data.data);
  } catch (error) {
    console.error('[TenantDetection] Failed to fetch from Rovex:', error);
    return null;
  }
}

/**
 * Mapeia resposta da Rovex API para CommunityConfig
 */
function mapRovexResponseToConfig(data: any): CommunityConfig {
  return {
    id: data.id,
    subdomain: data.subdomain,
    name: data.name,
    slogan: data.slogan,
    plan: data.plan || 'FREE',
    
    logoUrl: data.logoUrl || DEFAULT_COMMUNITY_CONFIG.logoUrl,
    logoIconUrl: data.logoIconUrl || data.logoUrl || DEFAULT_COMMUNITY_CONFIG.logoIconUrl,
    faviconUrl: data.faviconUrl || data.logoUrl,
    ogImageUrl: data.ogImageUrl,
    loginBackgroundUrl: data.loginBackgroundUrl,
    
    primaryColor: data.primaryColor || DEFAULT_COMMUNITY_CONFIG.primaryColor,
    secondaryColor: data.secondaryColor,
    accentColor: data.accentColor,
    
    currencyName: data.currencyName || 'Coins',
    currencySymbol: data.currencySymbol || '🪙',
    currencyIcon: data.currencyIcon,
    tierVipName: data.tierVipName || 'VIP',
    tierVipColor: data.tierVipColor || '#d4af37',
    tierVipSlogan: data.tierVipSlogan || 'A Elite do Sucesso',
    tierStdName: data.tierStdName || 'MEMBER',
    tierStdSlogan: data.tierStdSlogan || 'Velocidade e Poder',
    backgroundColor: data.backgroundColor || '#10b981',
    xpName: data.xpName || 'XP',
    
    baseUrl: data.baseUrl,
    apiUrl: data.apiUrl,
    cdnUrl: data.cdnUrl,
    
    rovexApiSecret: data.apiSecret || '',
    databaseUrl: data.databaseUrl || '',
    
    limits: data.limits || {
      maxUsers: 50,
      maxStorageMB: 500,
      maxUploadsPerMonth: 100,
      maxEmailsPerMonth: 100,
    },
    
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Limpa cache de uma comunidade específica (útil após update de config)
 */
export function invalidateCommunityCache(subdomain: string): void {
  configCache.delete(subdomain);
}

/**
 * Limpa todo o cache
 */
export function clearAllCache(): void {
  configCache.clear();
}
