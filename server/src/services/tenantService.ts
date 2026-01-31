// ============================================
// TENANT (COMMUNITY) CONTEXT MANAGEMENT
// ============================================
// Gerencia a configuração da comunidade atual
// Usado para multi-tenant: detectar qual comunidade está acessando

import { CommunityConfig, DEFAULT_COMMUNITY_CONFIG } from '../config/community.config';

// ============================================
// STORAGE DA CONFIG ATUAL
// ============================================
// Em ambiente de produção multi-tenant, isso seria gerenciado
// por AsyncLocalStorage ou similar para isolamento por request

let currentCommunityConfig: CommunityConfig = DEFAULT_COMMUNITY_CONFIG;

/**
 * Define a configuração da comunidade atual
 * Chamado pelo middleware de tenant detection
 */
export function setCommunityConfig(config: CommunityConfig): void {
  currentCommunityConfig = config;
}

/**
 * Retorna a configuração da comunidade atual
 */
export function getCommunityConfig(): CommunityConfig {
  return currentCommunityConfig;
}

/**
 * Retorna o plano da comunidade atual
 */
export function getCurrentPlan() {
  return currentCommunityConfig.plan;
}

/**
 * Retorna o ID da comunidade atual
 */
export function getCommunityId(): string {
  return currentCommunityConfig.id;
}

/**
 * Retorna o subdomain da comunidade atual
 */
export function getCommunitySubdomain(): string {
  return currentCommunityConfig.subdomain;
}

/**
 * Verifica se estamos rodando como Magazine SRT (default/development)
 */
export function isMagazineSRT(): boolean {
  return currentCommunityConfig.subdomain === 'magazine-srt';
}

/**
 * Verifica se estamos em modo multi-tenant (produção com Rovex)
 */
export function isMultiTenantMode(): boolean {
  return !!process.env.ROVEX_API_SECRET && !!process.env.ROVEX_API_URL;
}
