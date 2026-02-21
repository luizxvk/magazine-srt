import { Request, Response, NextFunction } from 'express';

// Sanitize string inputs to prevent XSS
const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    // Remove dangerous HTML/script tags - comprehensive list
    return str
        // Remove all script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove dangerous HTML tags (including svg which can execute JS)
        .replace(/<\s*\/?\s*(script|iframe|object|embed|form|input|button|meta|link|style|svg|math|base|applet)\b[^>]*>/gi, '')
        // Remove event handlers (onclick, onerror, onload, etc)
        .replace(/\bon\w+\s*=\s*(["'])[^"']*\1/gi, '')
        .replace(/\bon\w+\s*=\s*[^\s>]+/gi, '')
        // Remove javascript: protocol
        .replace(/javascript\s*:/gi, '')
        // Remove vbscript: protocol
        .replace(/vbscript\s*:/gi, '')
        // Remove data: URLs that could execute code
        .replace(/data\s*:\s*text\/html/gi, '')
        .replace(/data\s*:\s*text\/javascript/gi, '')
        .replace(/data\s*:\s*application\/javascript/gi, '')
        // Remove expression() CSS hack
        .replace(/expression\s*\(/gi, '')
        // Remove eval() calls
        .replace(/eval\s*\(/gi, '')
        // Encode remaining < and > to prevent tag injection
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();
};

// Recursively sanitize object
const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }
    
    return obj;
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    // Only sanitize req.body - query and params are read-only getters in Express
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    
    // For query params, sanitize individual values in-place
    if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
            const value = req.query[key];
            if (typeof value === 'string') {
                (req.query as any)[key] = sanitizeString(value);
            }
        }
    }
    
    // For route params, sanitize individual values in-place
    if (req.params && typeof req.params === 'object') {
        for (const key in req.params) {
            if (typeof req.params[key] === 'string') {
                req.params[key] = sanitizeString(req.params[key]);
            }
        }
    }
    
    next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Skip security headers for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // HTTP Strict Transport Security - force HTTPS for 1 year
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // Content Security Policy - API responses
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    
    // Referrer Policy - strict
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy - disable sensitive features
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    
    // Prevent caching of sensitive API responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    
    next();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate UUID format
export const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Validate password strength
export const isStrongPassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
        return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'A senha deve conter pelo menos um número' };
    }
    return { valid: true };
};

// Check for common bad words / content moderation
// Uses the same badwords.json loaded by moderationService
import { checkBlacklist } from '../services/moderationService';

export const containsBadContent = (text: string): boolean => {
    if (!text) return false;
    return checkBlacklist(text).length > 0;
};

// Moderate content middleware — returns 403 + CONTENT_MODERATED code for modal
export const moderateContent = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const field of fields) {
            const value = req.body[field];
            if (value && typeof value === 'string' && containsBadContent(value)) {
                return res.status(403).json({ 
                    error: 'Conteúdo bloqueado pela moderação automática.',
                    moderationReason: 'Conteúdo contém palavras proibidas',
                    code: 'CONTENT_MODERATED',
                });
            }
        }
        next();
    };
};
