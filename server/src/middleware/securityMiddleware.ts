import { Request, Response, NextFunction } from 'express';

// Sanitize string inputs to prevent XSS
const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    // Remove dangerous HTML/script tags
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<\s*\/?\s*(script|iframe|object|embed|form|input|button|meta|link|style)\b[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:\s*text\/html/gi, '')
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
    
    // Content Security Policy - relaxed for API
    // res.setHeader('Content-Security-Policy', "default-src 'self'; img-src * data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';");
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
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

// Check for common bad words / content moderation (basic)
const badWords = [
    // Portuguese offensive terms - insultos comuns
    'merda', 'porra', 'caralho', 'fdp', 'pqp',
    'puta', 'filho da puta', 'filha da puta', 'filhodaputa', 'filhadaputa',
    'filhoda puta', 'fila da puta', 'puta que pariu',
    'arrombado', 'arrombada', 'cuzao', 'cuzão',
    'desgraçado', 'desgraçada', 'desgraça',
    'viado', 'viadinho', 'bicha', 'bichona',
    'piranha', 'vagabunda', 'vadia', 'vagabundo',
    'otario', 'otária', 'otário',
    'babaca', 'imbecil', 'idiota',
    // Termos sexuais / vulgares
    'rola', 'pau no cu', 'vai tomar no cu', 'tomar no cu',
    'buceta', 'boceta', 'xereca', 'xota',
    'punheta', 'punheteiro', 'broxa',
    'chupar meu', 'chupa meu', 'mama aqui',
    'safado', 'safada', 'putaria', 'sacanagem',
    // English offensive terms
    'fuck', 'fuck you', 'fucking', 'shit', 'ass hole', 'asshole',
    'nigger', 'nigga', 'faggot', 'retard', 'bitch', 'whore', 'slut',
    'dick', 'cock', 'pussy',
    // Racist/hate terms
    'macaco', 'preto fedido', 'negro sujo',
    'volta pra senzala', 'lugar de negro',
    // Ameaças
    'vou te matar', 'vou te bater',
    'merece morrer', 'tem que morrer',
    'kys', 'kill yourself',
];

export const containsBadContent = (text: string): boolean => {
    if (!text) return false;
    // Normalize: lowercase, remove accents, collapse spaces
    const lowerText = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return badWords.some(word => {
        const normalizedWord = word
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        return lowerText.includes(normalizedWord);
    });
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
