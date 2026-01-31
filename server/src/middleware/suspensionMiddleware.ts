// ============================================
// SUSPENSION MIDDLEWARE
// Bloqueia acesso quando comunidade está suspensa
// ============================================

import { Request, Response, NextFunction } from 'express';
import { getSuspensionState, isDeleted } from '../services/suspensionService';

// Rotas que são permitidas mesmo quando suspenso
const ALLOWED_PATHS = [
  '/api/rovex',        // Webhooks da Rovex sempre passam
  '/api/auth/login',   // Permitir login para ver mensagem
  '/api/health',       // Health checks
  '/suspended',        // Página de suspensão
];

/**
 * Middleware que bloqueia acesso quando comunidade está suspensa
 * Aplicar ANTES das rotas principais
 */
export async function suspensionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const path = req.path;
  
  // Verificar se é uma rota permitida
  const isAllowed = ALLOWED_PATHS.some(allowed => path.startsWith(allowed));
  if (isAllowed) {
    return next();
  }
  
  try {
    // Verificar se comunidade foi deletada
    const deleted = await isDeleted();
    if (deleted) {
      return res.status(410).json({
        success: false,
        error: 'Community no longer exists',
        code: 'COMMUNITY_DELETED',
        message: 'Esta comunidade foi encerrada permanentemente.',
      });
    }
    
    // Verificar estado de suspensão
    const suspensionState = await getSuspensionState();
    
    if (suspensionState.suspended) {
      // Calcular tempo restante se tiver data de término
      let resumesAt = null;
      if (suspensionState.suspendedUntil) {
        const until = new Date(suspensionState.suspendedUntil);
        if (until > new Date()) {
          resumesAt = suspensionState.suspendedUntil;
        } else {
          // Suspensão expirou, permitir acesso
          // (O webhook de reativação deve limpar isso)
          return next();
        }
      }
      
      return res.status(503).json({
        success: false,
        error: 'Community suspended',
        code: 'COMMUNITY_SUSPENDED',
        reason: suspensionState.reason,
        suspendedAt: suspensionState.suspendedAt,
        resumesAt,
        message: getSuspensionMessage(suspensionState.reason),
      });
    }
    
    next();
  } catch (error) {
    console.error('[Suspension Middleware] Error:', error);
    // Em caso de erro, permitir acesso (fail open)
    next();
  }
}

/**
 * Retorna mensagem amigável baseada no motivo da suspensão
 */
function getSuspensionMessage(reason: string | null): string {
  switch (reason) {
    case 'payment_failed':
      return 'Esta comunidade está temporariamente suspensa devido a um problema de pagamento. Entre em contato com o administrador.';
    case 'tos_violation':
      return 'Esta comunidade foi suspensa por violação dos termos de serviço.';
    case 'quota_exceeded':
      return 'Esta comunidade atingiu o limite do plano atual. Aguarde o upgrade ou contate o administrador.';
    case 'manual':
    default:
      return 'Esta comunidade está temporariamente suspensa. Entre em contato com o suporte para mais informações.';
  }
}

/**
 * Middleware leve que apenas adiciona info de suspensão ao request
 * Útil para rotas que querem saber o status mas não bloquear
 */
export async function suspensionInfoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const suspensionState = await getSuspensionState();
    (req as any).suspensionState = suspensionState;
  } catch (error) {
    (req as any).suspensionState = { suspended: false };
  }
  next();
}
