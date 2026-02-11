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

// Check for common bad words / content moderation
// Comprehensive list: PT-BR, English, Spanish
const badWords = [
    // ==========================================
    // PORTUGUÊS (BR) — Xingamentos e insultos
    // ==========================================
    'merda', 'bosta', 'porra', 'caralho', 'cacete', 'caramba',
    'fdp', 'pqp', 'vsf', 'vtnc', 'tnc', 'pnc', 'krl',
    'puta', 'filho da puta', 'filha da puta', 'filhodaputa', 'filhadaputa',
    'filhoda puta', 'fila da puta', 'puta que pariu', 'puta merda',
    'arrombado', 'arrombada', 'cuzao', 'cuzão', 'cu',
    'desgraçado', 'desgraçada', 'desgraça', 'maldito', 'maldita',
    'lazarento', 'lazarenta', 'infeliz', 'inútil', 'energúmeno',
    'viado', 'viadinho', 'viadao', 'viadão', 'bicha', 'bichona', 'bicha velha',
    'gay de merda', 'traveco', 'travecao', 'sapatão', 'sapatona',
    'piranha', 'vagabunda', 'vadia', 'vagabundo', 'galinha', 'quenga',
    'rapariga', 'rameira', 'meretriz', 'prostituta', 'garota de programa',
    'otario', 'otária', 'otário', 'trouxa', 'trouxão', 'troxa',
    'babaca', 'imbecil', 'idiota', 'retardado', 'retardada',
    'burro', 'burra', 'animal', 'jumento', 'jumenta', 'besta', 'bestalhão',
    'corno', 'corna', 'cornudo', 'cornuda', 'chifrudo', 'chifruda',
    'nojento', 'nojenta', 'asqueroso', 'asquerosa',
    'lixo', 'lixo humano', 'escória', 'verme', 'parasita',
    'cretino', 'cretina', 'anta', 'estúpido', 'estúpida', 'tapado', 'tapada',
    'mongol', 'mongoloide', 'débil mental', 'demente', 'doente mental',
    'maluco', 'maluca', 'pirado', 'pirada', 'doido', 'doida',
    'pau no cu', 'palhaço', 'palhaça', 'ridículo', 'ridícula',
    'sem vergonha', 'sem-vergonha', 'safado', 'safada', 'canalha',
    'miserável', 'miseravel', 'ordinário', 'ordinária',
    'pulha', 'cafajeste', 'canalha', 'crápula', 'crapula',
    'covarde', 'frouxo', 'frouxa', 'banana', 'bunda mole',
    'folgado', 'folgada', 'abusado', 'abusada', 'fominha',
    'peste', 'praga', 'mala', 'mala sem alça', 'chato', 'chata',
    'pentelho', 'pentelhão', 'pentelha',
    'filho de chocadeira', 'filho de uma égua',
    // PT-BR — Termos sexuais / vulgares
    'rola', 'rolão', 'pau', 'pinto', 'pica', 'piroca', 'piru',
    'pau no cu', 'vai tomar no cu', 'tomar no cu', 'toma no cu',
    'vai se fuder', 'vai se foder', 'foda-se', 'fodase', 'foda se',
    'se foder', 'se fuder', 'vai se lascar',
    'buceta', 'boceta', 'xereca', 'xota', 'xoxota', 'pepeca',
    'punheta', 'punheteiro', 'punheteira', 'broxa',
    'chupar meu', 'chupa meu', 'mama aqui', 'me chupa', 'me mama',
    'boquete', 'chupar pau', 'chupar rola',
    'gozar', 'gozei', 'ejacular', 'porra toda',
    'putaria', 'sacanagem', 'puteiro', 'bordel',
    'tesão', 'tarado', 'tarada', 'pervertido', 'pervertida',
    'pedófilo', 'pedofilo', 'estuprador', 'estupro',
    'assédio', 'assedio',
    // PT-BR — Racismo e preconceito
    'macaco', 'macaca', 'preto fedido', 'preta fedida', 'negro sujo', 'negra suja',
    'volta pra senzala', 'lugar de negro', 'preto imundo', 'preta imunda',
    'crioulo', 'crioula', 'nego safado', 'nega safada',
    'índio burro', 'índio sujo', 'bugre',
    'nordestino de merda', 'baiano burro', 'paraíba',
    'japa', 'japinha', 'china de merda', 'olho puxado',
    'boludo', 'gringo de merda',
    // PT-BR — Ameaças e violência
    'vou te matar', 'vou te bater', 'vou te espancar',
    'vou te pegar', 'vou acabar contigo', 'vou acabar com você',
    'merece morrer', 'tem que morrer', 'morra', 'morre',
    'se mata', 'se mate', 'se matar', 'suicida',
    'vou te esfaquear', 'vou te dar um tiro',
    'vou te arrebentar', 'vou te destruir',
    'cuidado comigo', 'eu te acho',
    // ==========================================
    // ENGLISH — Slurs, insults, hate speech
    // ==========================================
    'fuck', 'fuck you', 'fuck off', 'fucking', 'fucker', 'motherfucker',
    'shit', 'bullshit', 'shitty', 'shithead', 'piece of shit',
    'asshole', 'ass hole', 'jackass', 'dumbass', 'smartass', 'fatass',
    'bitch', 'son of a bitch', 'bitchy', 'bitchass',
    'nigger', 'nigga', 'negro', 'coon', 'spook', 'darkie',
    'chink', 'gook', 'zipperhead', 'slant eye',
    'spic', 'wetback', 'beaner', 'greaseball',
    'kike', 'hymie', 'jewboy',
    'raghead', 'towelhead', 'sand nigger', 'camel jockey',
    'cracker', 'white trash', 'redneck',
    'faggot', 'fag', 'dyke', 'homo', 'queer', 'tranny',
    'retard', 'retarded', 'tard',
    'whore', 'slut', 'skank', 'hoe', 'thot', 'tramp', 'hooker', 'prostitute',
    'dick', 'dickhead', 'cock', 'cocksucker', 'cock sucker',
    'cunt', 'twat', 'pussy', 'prick',
    'wanker', 'tosser', 'bellend', 'knobhead', 'bollocks',
    'bastard', 'douchebag', 'douche', 'scumbag', 'lowlife',
    'moron', 'imbecile', 'idiot', 'stupid',
    'kill yourself', 'kys', 'go die', 'drink bleach',
    'hang yourself', 'slit your wrists', 'neck yourself',
    'i will kill you', 'gonna kill you', 'death threat',
    'pedophile', 'pedo', 'child molester', 'groomer',
    'rapist', 'rape', 'molest',
    'nazi', 'neonazi', 'neo-nazi', 'heil hitler', 'hitler did nothing',
    'white power', 'white supremacy', 'gas the jews',
    'stfu', 'gtfo', 'lmfao', 'wtf',
    // ==========================================
    // ESPAÑOL — Insultos y groserías
    // ==========================================
    'puto', 'puta madre', 'hijo de puta', 'hija de puta', 'hijueputa',
    'pendejo', 'pendeja', 'pinche', 'chingada', 'chingar', 'chingado',
    'chinga tu madre', 'a la verga', 'verga', 'vergudo',
    'culero', 'culera', 'culo', 'culiao', 'culiado',
    'cabron', 'cabrón', 'cabrona', 'carbón',
    'marica', 'maricón', 'maricon', 'joto', 'jota', 'puñal',
    'mierda', 'mierdero', 'mierdoso',
    'coño', 'cono', 'concha', 'conchudo', 'conchatumadre', 'concha de tu madre',
    'idiota', 'estúpido', 'estupido', 'estúpida', 'estupida',
    'imbécil', 'imbecil', 'tarado', 'tarada',
    'baboso', 'babosa', 'menso', 'mensa', 'tonto', 'tonta',
    'güey', 'guey', 'wey', 'buey',
    'mamón', 'mamon', 'mamona', 'mamaverga', 'mamahuevo',
    'vergón', 'vergon', 'picha', 'pija', 'poronga',
    'huevón', 'huevon', 'huevona', 'güevón',
    'boludo', 'boluda', 'pelotudo', 'pelotuda',
    'pajero', 'pajera', 'pajudo',
    'malparido', 'malparida', 'malcogido',
    'perra', 'zorra', 'ramera', 'golfa', 'cualquiera',
    'cornudo', 'cornuda', 'cachón', 'cachona',
    'te voy a matar', 'te mato', 'vas a morir',
    'suicidate', 'matate', 'muérete', 'muerete',
    'negro de mierda', 'negra de mierda', 'indio de mierda',
    'sudaca', 'naco', 'naca', 'gata', 'sirviente',
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
