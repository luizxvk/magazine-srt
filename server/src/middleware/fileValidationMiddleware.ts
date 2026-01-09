import { Request, Response, NextFunction } from 'express';

// Magic bytes for common image formats
const IMAGE_MAGIC_BYTES: { [key: string]: number[][] } = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF)
    'image/bmp': [[0x42, 0x4D]], // BM
    'image/svg+xml': [[0x3C, 0x3F, 0x78, 0x6D, 0x6C], [0x3C, 0x73, 0x76, 0x67]], // <?xml or <svg
};

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validates file content by checking magic bytes
 * This prevents malicious files disguised as images
 */
export const validateImageContent = (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    
    if (!file) {
        return next(); // No file to validate, let controller handle it
    }

    // Check if mimetype is allowed
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ 
            error: 'Tipo de arquivo não permitido',
            allowedTypes: ALLOWED_IMAGE_TYPES 
        });
    }

    // Get the magic bytes patterns for this mimetype
    const magicPatterns = IMAGE_MAGIC_BYTES[file.mimetype];
    
    if (!magicPatterns) {
        // Unknown type, reject for safety
        return res.status(400).json({ error: 'Tipo de arquivo não suportado' });
    }

    // Check if file buffer starts with valid magic bytes
    const fileHeader = file.buffer.slice(0, 16);
    let isValid = false;

    for (const pattern of magicPatterns) {
        let matches = true;
        for (let i = 0; i < pattern.length; i++) {
            if (fileHeader[i] !== pattern[i]) {
                matches = false;
                break;
            }
        }
        if (matches) {
            isValid = true;
            break;
        }
    }

    if (!isValid) {
        console.warn(`[Security] Invalid magic bytes for claimed type ${file.mimetype}`);
        return res.status(400).json({ 
            error: 'Arquivo inválido. O conteúdo não corresponde ao tipo declarado.' 
        });
    }

    // Additional security checks
    
    // 1. Check for embedded PHP/script markers in file content
    const contentString = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 1024));
    const dangerousPatterns = [
        '<?php',
        '<?=',
        '<script',
        'javascript:',
        'data:text/html',
        'vbscript:',
    ];

    for (const pattern of dangerousPatterns) {
        if (contentString.toLowerCase().includes(pattern.toLowerCase())) {
            console.warn(`[Security] Dangerous pattern "${pattern}" found in uploaded file`);
            return res.status(400).json({ error: 'Arquivo contém conteúdo não permitido' });
        }
    }

    // 2. Check file size is reasonable for the type
    const maxSizes: { [key: string]: number } = {
        'image/jpeg': 10 * 1024 * 1024, // 10MB
        'image/png': 15 * 1024 * 1024,  // 15MB (PNG can be larger)
        'image/gif': 8 * 1024 * 1024,   // 8MB
        'image/webp': 10 * 1024 * 1024, // 10MB
    };

    const maxSize = maxSizes[file.mimetype] || 10 * 1024 * 1024;
    if (file.buffer.length > maxSize) {
        return res.status(400).json({ 
            error: `Arquivo muito grande. Máximo permitido: ${Math.round(maxSize / (1024 * 1024))}MB` 
        });
    }

    next();
};

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export const sanitizeFilename = (filename: string): string => {
    // Remove path components
    const name = filename.replace(/^.*[\\\/]/, '');
    // Remove special characters except alphanumeric, dots, dashes, underscores
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};
