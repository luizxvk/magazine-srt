/**
 * Community Configuration
 * 
 * Este arquivo define a configuração da comunidade que pode ser
 * sobrescrita via provisioning da Rovex Platform.
 * 
 * Quando a Rovex provisiona uma nova comunidade, ela envia esses
 * valores via API e eles são salvos no banco/env.
 */

import type { Plan } from '../utils/features';

// ============================================
// INTERFACE DE CONFIGURAÇÃO
// ============================================

export interface CommunityConfig {
  // === Identificação ===
  id: string;                    // UUID da comunidade na Rovex
  subdomain: string;             // Ex: "magazine-srt"
  
  // === Branding ===
  name: string;                  // "Magazine SRT"
  slogan: string;                // "A comunidade definitiva"
  logoUrl: string;               // URL do logo principal
  logoIconUrl: string;           // URL do ícone/favicon grande
  faviconUrl: string;            // URL do favicon
  ogImageUrl: string;            // Imagem para compartilhamento
  
  // === Cores ===
  primaryColor: string;          // Cor principal (botões, links)
  secondaryColor: string;        // Cor secundária
  accentColor: string;           // Cor de destaque
  
  // === Tiers de Membership ===
  tierVipName: string;           // Nome do tier VIP (ex: "MAGAZINE")
  tierVipColor: string;          // Cor do tier VIP
  tierStdName: string;           // Nome do tier Standard (ex: "MGT")
  backgroundColor: string;       // Cor de fundo/tema do tier Standard (ex: "#10b981")
  
  // === Economia ===
  currencyName: string;          // Nome da moeda virtual (ex: "Zions")
  currencySymbol: string;        // Símbolo da moeda (ex: "Z$")
  currencyIconUrl?: string;      // Ícone customizado da moeda
  xpName: string;                // Nome dos pontos de XP
  
  // === Plano Rovex ===
  plan: Plan;                    // Plano atual da comunidade
  planExpiresAt?: string;        // ISO date, se trial
  
  // === URLs ===
  baseUrl: string;               // URL principal
  apiUrl: string;                // URL da API
  rovexApiUrl?: string;          // URL da API Rovex para callbacks
  
  // === Flags ===
  isWhiteLabel: boolean;         // Remove branding Rovex
  maintenanceMode: boolean;      // Modo manutenção
}

// ============================================
// CONFIGURAÇÃO PADRÃO (Magazine SRT)
// ============================================

export const DEFAULT_COMMUNITY_CONFIG: CommunityConfig = {
  // Identificação
  id: 'magazine-srt-local',
  subdomain: 'magazine-srt',
  
  // Branding
  name: 'Magazine MGT',
  slogan: 'A comunidade definitiva de games e entretenimento',
  logoUrl: '/assets/logo-mgzn.png',
  logoIconUrl: '/assets/mgt-log-logo.png',
  faviconUrl: '/assets/mgt-log-logo.png',
  ogImageUrl: '/assets/og-image.png',
  
  // Cores (dourado Magazine / verde MGT)
  primaryColor: '#d4af37',
  secondaryColor: '#10b981',
  accentColor: '#f59e0b',
  
  // Tiers
  tierVipName: 'MAGAZINE',
  tierVipColor: '#d4af37',
  tierStdName: 'MGT',
  backgroundColor: '#10b981',
  
  // Economia
  currencyName: 'Zions',
  currencySymbol: 'Z$',
  currencyIconUrl: '/assets/zions/zion-50.png',
  xpName: 'XP',
  
  // Plano (dev = tudo liberado)
  plan: 'ENTERPRISE',
  planExpiresAt: undefined,
  
  // URLs
  baseUrl: import.meta.env.VITE_BASE_URL || 'http://localhost:5173',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  rovexApiUrl: import.meta.env.VITE_ROVEX_API_URL,
  
  // Flags
  isWhiteLabel: false,
  maintenanceMode: false,
};

// ============================================
// HELPERS
// ============================================

/**
 * Formata valor com a moeda da comunidade
 * @example formatCurrency(1500, config) => "Z$ 1.500"
 */
export function formatCurrency(value: number, config: CommunityConfig): string {
  return `${config.currencySymbol} ${value.toLocaleString('pt-BR')}`;
}

/**
 * Retorna a cor do tier baseado no tipo de membership
 */
export function getTierColor(membershipType: string, config: CommunityConfig): string {
  return membershipType === config.tierStdName 
    ? config.backgroundColor 
    : config.tierVipColor;
}

/**
 * Retorna o nome do tier baseado no tipo de membership
 */
export function getTierName(membershipType: string, config: CommunityConfig): string {
  return membershipType === 'MGT' || membershipType === config.tierStdName
    ? config.tierStdName
    : config.tierVipName;
}

/**
 * Verifica se é o tier VIP
 */
export function isVipTier(membershipType: string, config: CommunityConfig): boolean {
  return membershipType === config.tierVipName || membershipType === 'MAGAZINE';
}
