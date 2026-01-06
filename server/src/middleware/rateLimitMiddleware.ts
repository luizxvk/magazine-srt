import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
// For production, consider using Redis-based solution
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
    windowMs?: number;   // Time window in milliseconds
    max?: number;        // Max requests per window
    message?: string;    // Error message
    keyGenerator?: (req: Request) => string;
}

const defaultOptions: RateLimitOptions = {
    windowMs: 60 * 1000, // 1 minute
    max: 100,            // 100 requests per minute
    message: 'Too many requests, please try again later.',
    keyGenerator: (req) => {
        // Use IP + user ID if authenticated
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userId = (req as any).user?.userId || 'anonymous';
        return `${ip}:${userId}`;
    }
};

export const rateLimit = (options: RateLimitOptions = {}) => {
    const opts = { ...defaultOptions, ...options };

    return (req: Request, res: Response, next: NextFunction) => {
        const key = opts.keyGenerator!(req);
        const now = Date.now();
        const record = requestCounts.get(key);

        if (!record || now > record.resetTime) {
            // New window
            requestCounts.set(key, {
                count: 1,
                resetTime: now + opts.windowMs!
            });
            return next();
        }

        if (record.count >= opts.max!) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            res.setHeader('X-RateLimit-Limit', opts.max!);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', record.resetTime);
            return res.status(429).json({ 
                error: opts.message,
                retryAfter 
            });
        }

        record.count++;
        res.setHeader('X-RateLimit-Limit', opts.max!);
        res.setHeader('X-RateLimit-Remaining', opts.max! - record.count);
        res.setHeader('X-RateLimit-Reset', record.resetTime);
        next();
    };
};

// Stricter rate limit for login attempts
export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 attempts per 15 minutes
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    keyGenerator: (req) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const email = req.body?.email?.toLowerCase() || 'unknown';
        return `login:${ip}:${email}`;
    }
});

// Rate limit for password reset
export const resetPasswordRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,                    // 3 attempts per hour
    message: 'Muitas solicitações de redefinição. Tente novamente em 1 hora.',
    keyGenerator: (req) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const email = req.body?.email?.toLowerCase() || 'unknown';
        return `reset:${ip}:${email}`;
    }
});

// Rate limit for posting content
export const postRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,              // 10 posts per minute
    message: 'Você está postando muito rápido. Aguarde um momento.'
});

// Rate limit for messaging
export const messageRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,              // 30 messages per minute
    message: 'Você está enviando mensagens muito rápido.'
});

// Rate limit for file uploads
export const uploadRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,               // 5 uploads per minute
    message: 'Muitos uploads. Aguarde um momento.'
});

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
        if (now > value.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 60 * 1000); // Clean up every minute
