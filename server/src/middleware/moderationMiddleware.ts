import { Request, Response, NextFunction } from 'express';
import { moderateContent } from '../services/moderationService';
import { logger } from '../utils/logger';

/**
 * Middleware to auto-moderate text content in request body
 * Checks: body.content, body.text, body.bio, body.description, body.name
 * If blocked → returns 403
 * If flagged → allows but logs
 */
export function moderateTextContent(fields: string[] = ['content', 'text']) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) return next();

        // Collect all text from specified fields
        const texts: string[] = [];
        for (const field of fields) {
            const value = req.body?.[field];
            if (typeof value === 'string' && value.trim().length > 0) {
                texts.push(value);
            }
        }

        if (texts.length === 0) return next();

        const combinedText = texts.join(' ');

        try {
            const result = await moderateContent({
                text: combinedText,
                userId,
            });

            if (result.action === 'BLOCKED') {
                logger.warn(`[Moderation] Content BLOCKED for user ${userId}: ${result.reason}`);
                return res.status(403).json({
                    error: 'Conteúdo bloqueado pela moderação automática.',
                    moderationReason: result.reason,
                    code: 'CONTENT_MODERATED',
                });
            }

            if (result.action === 'FLAGGED') {
                logger.info(`[Moderation] Content FLAGGED for user ${userId}: ${result.reason}`);
                // Allow but mark in request for downstream handlers
                (req as any).moderationFlagged = true;
                (req as any).moderationReason = result.reason;
            }

            next();
        } catch (error) {
            logger.error('[Moderation] Middleware error:', error);
            // On error, allow content through (don't block on service failure)
            next();
        }
    };
}

/**
 * Middleware to check uploaded images for NSFW content
 * Expects imageUrl in body (after upload)
 */
export function moderateImageContent(imageUrlField: string = 'imageUrl') {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        const imageUrl = req.body?.[imageUrlField];

        if (!userId || !imageUrl) return next();

        try {
            const result = await moderateContent({
                imageUrl,
                userId,
            });

            if (result.action === 'BLOCKED') {
                logger.warn(`[Moderation] Image BLOCKED for user ${userId}: ${result.reason}`);
                return res.status(403).json({
                    error: 'Imagem bloqueada pela moderação automática. Conteúdo impróprio detectado.',
                    moderationReason: result.reason,
                    code: 'IMAGE_MODERATED',
                });
            }

            if (result.action === 'FLAGGED') {
                (req as any).moderationFlagged = true;
                (req as any).moderationReason = result.reason;
            }

            next();
        } catch (error) {
            logger.error('[Moderation] Image middleware error:', error);
            next();
        }
    };
}
