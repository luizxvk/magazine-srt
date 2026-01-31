// ============================================
// SUSPENSION STATE SERVICE
// Gerencia o estado de suspensão da comunidade
// ============================================

import prisma from '../utils/prisma';

export interface SuspensionState {
  suspended: boolean;
  reason: 'payment_failed' | 'tos_violation' | 'manual' | 'quota_exceeded' | null;
  suspendedAt: string | null;
  suspendedUntil: string | null;
}

export interface QuotaLimits {
  maxUsers: number;
  maxStorageMB: number;
  maxEmailsPerMonth: number;
  maxUploadsPerMonth: number;
}

export interface BrandingConfig {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
}

// Cache em memória para evitar queries em cada request
let suspensionCache: SuspensionState | null = null;
let suspensionCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto

/**
 * Obtém o estado de suspensão atual
 * Usa cache em memória para performance
 */
export async function getSuspensionState(): Promise<SuspensionState> {
  const now = Date.now();
  
  // Retornar cache se ainda válido
  if (suspensionCache && (now - suspensionCacheTime) < CACHE_TTL_MS) {
    return suspensionCache;
  }
  
  try {
    const record = await prisma.systemConfig.findUnique({
      where: { key: 'suspension_state' },
    });
    
    if (record?.value) {
      suspensionCache = JSON.parse(record.value) as SuspensionState;
    } else {
      suspensionCache = {
        suspended: false,
        reason: null,
        suspendedAt: null,
        suspendedUntil: null,
      };
    }
    
    suspensionCacheTime = now;
    return suspensionCache;
  } catch (error) {
    console.error('[Suspension] Error getting state:', error);
    // Retornar estado não-suspenso em caso de erro
    return {
      suspended: false,
      reason: null,
      suspendedAt: null,
      suspendedUntil: null,
    };
  }
}

/**
 * Define o estado de suspensão
 * Chamado pelo webhook da Rovex
 */
export async function setSuspensionState(state: SuspensionState): Promise<void> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: 'suspension_state' },
      update: { value: JSON.stringify(state) },
      create: { key: 'suspension_state', value: JSON.stringify(state) },
    });
    
    // Atualizar cache imediatamente
    suspensionCache = state;
    suspensionCacheTime = Date.now();
    
    console.log(`[Suspension] State updated: suspended=${state.suspended}, reason=${state.reason}`);
  } catch (error) {
    console.error('[Suspension] Error setting state:', error);
    throw error;
  }
}

/**
 * Verifica se a comunidade está suspensa (sem usar cache)
 */
export async function isSuspendedFresh(): Promise<boolean> {
  // Força refresh do cache
  suspensionCacheTime = 0;
  const state = await getSuspensionState();
  return state.suspended;
}

/**
 * Invalida o cache de suspensão
 * Útil após receber webhook
 */
export function invalidateSuspensionCache(): void {
  suspensionCache = null;
  suspensionCacheTime = 0;
}

// ============================================
// QUOTA LIMITS
// ============================================

let quotaCache: QuotaLimits | null = null;
let quotaCacheTime = 0;

const DEFAULT_QUOTAS: QuotaLimits = {
  maxUsers: Infinity,
  maxStorageMB: 102400,
  maxUploadsPerMonth: 999999,
  maxEmailsPerMonth: 50000,
};

/**
 * Obtém os limites de quota atuais
 */
export async function getQuotaLimits(): Promise<QuotaLimits> {
  const now = Date.now();
  
  if (quotaCache && (now - quotaCacheTime) < CACHE_TTL_MS) {
    return quotaCache;
  }
  
  try {
    const record = await prisma.systemConfig.findUnique({
      where: { key: 'quota_limits' },
    });
    
    if (record?.value) {
      quotaCache = JSON.parse(record.value) as QuotaLimits;
    } else {
      quotaCache = DEFAULT_QUOTAS;
    }
    
    quotaCacheTime = now;
    return quotaCache;
  } catch (error) {
    console.error('[Quotas] Error getting limits:', error);
    return DEFAULT_QUOTAS;
  }
}

/**
 * Atualiza os limites de quota
 * Chamado pelo webhook da Rovex
 */
export async function setQuotaLimits(limits: Partial<QuotaLimits>): Promise<void> {
  try {
    const currentLimits = await getQuotaLimits();
    const newLimits = { ...currentLimits, ...limits };
    
    await prisma.systemConfig.upsert({
      where: { key: 'quota_limits' },
      update: { value: JSON.stringify(newLimits) },
      create: { key: 'quota_limits', value: JSON.stringify(newLimits) },
    });
    
    quotaCache = newLimits;
    quotaCacheTime = Date.now();
    
    console.log('[Quotas] Updated:', newLimits);
  } catch (error) {
    console.error('[Quotas] Error setting limits:', error);
    throw error;
  }
}

/**
 * Verifica se uma quota específica foi excedida
 */
export async function isQuotaExceeded(quotaType: 'users' | 'storage' | 'emails' | 'uploads'): Promise<boolean> {
  const limits = await getQuotaLimits();
  
  switch (quotaType) {
    case 'users': {
      const userCount = await prisma.user.count({ where: { deletedAt: null } });
      return userCount >= limits.maxUsers;
    }
    case 'storage':
      // TODO: Implementar cálculo de storage
      return false;
    case 'emails':
      // TODO: Implementar contagem de emails
      return false;
    case 'uploads':
      // TODO: Implementar contagem de uploads
      return false;
    default:
      return false;
  }
}

// ============================================
// BRANDING
// ============================================

/**
 * Atualiza configurações de branding
 * Chamado pelo webhook da Rovex
 */
export async function updateBranding(branding: BrandingConfig): Promise<void> {
  try {
    const record = await prisma.systemConfig.findUnique({
      where: { key: 'community_config' },
    });
    
    let currentConfig = {};
    if (record?.value) {
      currentConfig = JSON.parse(record.value);
    }
    
    const newConfig = {
      ...currentConfig,
      ...(branding.name && { name: branding.name }),
      ...(branding.logoUrl && { logoUrl: branding.logoUrl }),
      ...(branding.primaryColor && { primaryColor: branding.primaryColor }),
      ...(branding.secondaryColor && { secondaryColor: branding.secondaryColor }),
      ...(branding.faviconUrl && { faviconUrl: branding.faviconUrl }),
      updatedAt: new Date().toISOString(),
    };
    
    await prisma.systemConfig.upsert({
      where: { key: 'community_config' },
      update: { value: JSON.stringify(newConfig) },
      create: { key: 'community_config', value: JSON.stringify(newConfig) },
    });
    
    console.log('[Branding] Updated:', Object.keys(branding).join(', '));
  } catch (error) {
    console.error('[Branding] Error updating:', error);
    throw error;
  }
}

// ============================================
// DELETION STATE
// ============================================

/**
 * Marca a comunidade como deletada
 */
export async function setDeletionState(deleted: boolean): Promise<void> {
  try {
    await prisma.systemConfig.upsert({
      where: { key: 'community_deleted' },
      update: { value: JSON.stringify({ deleted, deletedAt: new Date().toISOString() }) },
      create: { key: 'community_deleted', value: JSON.stringify({ deleted, deletedAt: new Date().toISOString() }) },
    });
    
    console.log(`[Deletion] Community marked as deleted: ${deleted}`);
  } catch (error) {
    console.error('[Deletion] Error setting state:', error);
    throw error;
  }
}

/**
 * Verifica se a comunidade foi deletada
 */
export async function isDeleted(): Promise<boolean> {
  try {
    const record = await prisma.systemConfig.findUnique({
      where: { key: 'community_deleted' },
    });
    
    if (record?.value) {
      const state = JSON.parse(record.value);
      return state.deleted === true;
    }
    
    return false;
  } catch (error) {
    console.error('[Deletion] Error checking state:', error);
    return false;
  }
}

// ============================================
// FEATURE FLAGS (por plano)
// ============================================

/**
 * Atualiza feature flags baseado no plano
 */
export async function updateFeatureFlags(plan: string): Promise<void> {
  try {
    const record = await prisma.systemConfig.findUnique({
      where: { key: 'community_config' },
    });
    
    let currentConfig: Record<string, unknown> = {};
    if (record?.value) {
      currentConfig = JSON.parse(record.value);
    }
    
    const updatedConfig = {
      ...currentConfig,
      plan,
      planUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await prisma.systemConfig.upsert({
      where: { key: 'community_config' },
      update: { value: JSON.stringify(updatedConfig) },
      create: { key: 'community_config', value: JSON.stringify(updatedConfig) },
    });
    
    console.log(`[Features] Plan updated to: ${plan}`);
  } catch (error) {
    console.error('[Features] Error updating plan:', error);
    throw error;
  }
}
