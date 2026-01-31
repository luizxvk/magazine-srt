// ============================================
// ROVEX AUTHENTICATION MIDDLEWARE
// ============================================
// Valida requisições vindas da Rovex Platform

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getCommunityConfig } from '../services/tenantService';

/**
 * Valida API Key da Rovex Platform
 * Usado para endpoints de métricas e configuração
 */
export function validateRovexApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-rovex-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Missing X-Rovex-API-Key header',
    });
  }
  
  // Verificar contra secret da comunidade ou secret master
  const communitySecret = getCommunityConfig().rovexApiSecret;
  const masterSecret = process.env.ROVEX_MASTER_SECRET;
  
  if (apiKey !== communitySecret && apiKey !== masterSecret) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid for this community',
    });
  }
  
  // Marcar request como vindo da Rovex
  (req as any).isRovexRequest = true;
  
  next();
}

/**
 * Valida assinatura de webhook
 * Webhooks da Rovex são assinados com HMAC-SHA256
 */
export function validateWebhookSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-rovex-signature'] as string;
  const timestamp = req.headers['x-rovex-timestamp'] as string;
  
  if (!signature || !timestamp) {
    return res.status(401).json({
      error: 'Webhook signature required',
      message: 'Missing X-Rovex-Signature or X-Rovex-Timestamp header',
    });
  }
  
  // Verificar timestamp não é muito antigo (previne replay attacks)
  const timestampAge = Date.now() - parseInt(timestamp);
  const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos
  
  if (isNaN(timestampAge) || timestampAge > MAX_AGE_MS) {
    return res.status(401).json({
      error: 'Webhook timestamp expired',
      message: 'The webhook timestamp is too old or invalid',
    });
  }
  
  // Calcular assinatura esperada
  const webhookSecret = process.env.ROVEX_WEBHOOK_SECRET || getCommunityConfig().rovexApiSecret;
  const payload = JSON.stringify(req.body);
  const signatureBase = `${timestamp}.${payload}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signatureBase)
    .digest('hex');
  
  // Comparação segura contra timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  
  if (signatureBuffer.length !== expectedBuffer.length || 
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(403).json({
      error: 'Invalid webhook signature',
      message: 'The webhook signature does not match',
    });
  }
  
  next();
}

/**
 * Middleware opcional que marca se request é interno (de outro serviço Rovex)
 */
export function markInternalRequest(req: Request, res: Response, next: NextFunction) {
  const internalToken = req.headers['x-rovex-internal'] as string;
  
  if (internalToken === process.env.ROVEX_INTERNAL_TOKEN) {
    (req as any).isInternalRequest = true;
  }
  
  next();
}
