import axios from 'axios';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

// ============================================
// DYNAMIC WORD BLACKLIST (loaded from JSON file)
// ============================================

interface BadwordsData {
    'pt-BR': Record<string, string[]>;
    en: Record<string, string[]>;
    es: Record<string, string[]>;
    abbreviations: string[];
    evasion_patterns: string[];
}

let BLACKLISTED_WORDS: string[] = [];
let EVASION_PATTERNS: RegExp[] = [];

/**
 * Load bad words from external JSON file.
 * Called once at startup. Can be reloaded without restarting server.
 */
export function loadBadwords(): void {
    try {
        const filePath = path.join(__dirname, '..', 'data', 'badwords.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data: BadwordsData = JSON.parse(raw);

        // Flatten all categories from all languages into one list
        const words: Set<string> = new Set();

        for (const lang of ['pt-BR', 'en', 'es'] as const) {
            const langData = data[lang];
            if (langData) {
                for (const category of Object.values(langData)) {
                    if (Array.isArray(category)) {
                        category.forEach(w => words.add(w.toLowerCase()));
                    }
                }
            }
        }

        // Add abbreviations
        if (data.abbreviations) {
            data.abbreviations.forEach(w => words.add(w.toLowerCase()));
        }

        BLACKLISTED_WORDS = Array.from(words);

        // Load evasion regex patterns
        if (data.evasion_patterns) {
            EVASION_PATTERNS = data.evasion_patterns.map(p => new RegExp(p, 'i'));
        }

        logger.info(`[Moderation] Loaded ${BLACKLISTED_WORDS.length} blacklisted words and ${EVASION_PATTERNS.length} evasion patterns from badwords.json`);
    } catch (error) {
        logger.error('[Moderation] Failed to load badwords.json, using empty list:', error);
        BLACKLISTED_WORDS = [];
        EVASION_PATTERNS = [];
    }
}

// Load on module init
loadBadwords();

/**
 * Quick local text filter using word blacklist
 * Returns matched words or empty array if clean
 */
export function checkBlacklist(text: string): string[] {
    const normalizedText = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, ' ');   // Remove special chars

    const matches: string[] = [];

    for (const word of BLACKLISTED_WORDS) {
        const normalizedWord = word
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        if (normalizedText.includes(normalizedWord)) {
            matches.push(word);
        }
    }

    for (const pattern of EVASION_PATTERNS) {
        if (pattern.test(text)) {
            matches.push(`[regex: ${pattern.source}]`);
        }
    }

    return matches;
}

// ============================================
// GOOGLE PERSPECTIVE API (Text toxicity)
// ============================================

interface PerspectiveResult {
    safe: boolean;
    scores: {
        toxicity: number;
        severeToxicity: number;
        identityAttack: number;
        insult: number;
        profanity: number;
        threat: number;
    };
    flaggedCategories: string[];
}

const PERSPECTIVE_THRESHOLD = 0.7; // Lowered from 0.8 to catch more offensive content
const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;

/**
 * Check text content using Google Perspective API
 * Returns toxicity scores for multiple attributes
 */
export async function checkTextToxicity(text: string): Promise<PerspectiveResult> {
    // If no API key, fallback to blacklist-only
    if (!PERSPECTIVE_API_KEY) {
        const blacklistMatches = checkBlacklist(text);
        return {
            safe: blacklistMatches.length === 0,
            scores: {
                toxicity: blacklistMatches.length > 0 ? 1.0 : 0.0,
                severeToxicity: 0,
                identityAttack: 0,
                insult: 0,
                profanity: blacklistMatches.length > 0 ? 1.0 : 0.0,
                threat: 0,
            },
            flaggedCategories: blacklistMatches.length > 0 ? ['PROFANITY (blacklist)'] : [],
        };
    }

    try {
        const response = await axios.post(
            `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
            {
                comment: { text },
                languages: ['pt', 'en', 'es'],
                requestedAttributes: {
                    TOXICITY: {},
                    SEVERE_TOXICITY: {},
                    IDENTITY_ATTACK: {},
                    INSULT: {},
                    PROFANITY: {},
                    THREAT: {},
                },
            },
            { timeout: 5000 }
        );

        const scores = {
            toxicity: response.data.attributeScores.TOXICITY?.summaryScore?.value || 0,
            severeToxicity: response.data.attributeScores.SEVERE_TOXICITY?.summaryScore?.value || 0,
            identityAttack: response.data.attributeScores.IDENTITY_ATTACK?.summaryScore?.value || 0,
            insult: response.data.attributeScores.INSULT?.summaryScore?.value || 0,
            profanity: response.data.attributeScores.PROFANITY?.summaryScore?.value || 0,
            threat: response.data.attributeScores.THREAT?.summaryScore?.value || 0,
        };

        const flaggedCategories: string[] = [];
        if (scores.toxicity >= PERSPECTIVE_THRESHOLD) flaggedCategories.push('TOXICITY');
        if (scores.severeToxicity >= PERSPECTIVE_THRESHOLD) flaggedCategories.push('SEVERE_TOXICITY');
        if (scores.identityAttack >= PERSPECTIVE_THRESHOLD) flaggedCategories.push('IDENTITY_ATTACK');
        if (scores.insult >= PERSPECTIVE_THRESHOLD) flaggedCategories.push('INSULT');
        if (scores.profanity >= PERSPECTIVE_THRESHOLD) flaggedCategories.push('PROFANITY');
        if (scores.threat >= PERSPECTIVE_THRESHOLD) flaggedCategories.push('THREAT');

        // Also check blacklist
        const blacklistMatches = checkBlacklist(text);
        if (blacklistMatches.length > 0) {
            flaggedCategories.push('BLACKLIST');
        }

        return {
            safe: flaggedCategories.length === 0,
            scores,
            flaggedCategories,
        };
    } catch (error) {
        logger.error('[Moderation] Perspective API error, falling back to blacklist:', error);
        // Fallback to blacklist
        const blacklistMatches = checkBlacklist(text);
        return {
            safe: blacklistMatches.length === 0,
            scores: {
                toxicity: blacklistMatches.length > 0 ? 1.0 : 0.0,
                severeToxicity: 0,
                identityAttack: 0,
                insult: 0,
                profanity: blacklistMatches.length > 0 ? 1.0 : 0.0,
                threat: 0,
            },
            flaggedCategories: blacklistMatches.length > 0 ? ['BLACKLIST'] : [],
        };
    }
}

// ============================================
// NSFWJS IMAGE MODERATION
// ============================================

interface NSFWResult {
    safe: boolean;
    predictions: {
        className: string;
        probability: number;
    }[];
    flaggedCategories: string[];
}

let nsfwModel: any = null;
let nsfwModelLoading = false;

/**
 * Lazy-load the NSFWJS model (only first call incurs delay)
 */
async function loadNSFWModel() {
    if (nsfwModel) return nsfwModel;
    if (nsfwModelLoading) {
        // Wait for model to finish loading
        while (nsfwModelLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return nsfwModel;
    }

    try {
        nsfwModelLoading = true;
        // Dynamic imports to avoid loading tensorflow at startup
        const tf = await import('@tensorflow/tfjs');
        const nsfwjs = await import('nsfwjs');
        
        // Small model for server-side use
        nsfwModel = await nsfwjs.load('MobileNetV2Mid', { size: 224 });
        logger.info('[Moderation] NSFWJS model loaded successfully');
        return nsfwModel;
    } catch (error) {
        logger.error('[Moderation] Failed to load NSFWJS model:', error);
        return null;
    } finally {
        nsfwModelLoading = false;
    }
}

const NSFW_THRESHOLD = 0.6; // 60% confidence to flag

/**
 * Check image content using NSFWJS (TensorFlow.js)
 * Downloads the image and runs local inference
 */
export async function checkImageContent(imageUrl: string): Promise<NSFWResult> {
    try {
        const model = await loadNSFWModel();
        if (!model) {
            // Model not available, allow by default
            return { safe: true, predictions: [], flaggedCategories: [] };
        }

        const tf = await import('@tensorflow/tfjs');

        // Download image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const buffer = Buffer.from(response.data);

        // Decode image to tensor
        // Use tf.node if available, otherwise decode manually
        let imageTensor;
        try {
            const { createCanvas, loadImage } = await import('canvas' as any);
            const img = await loadImage(buffer);
            const canvas = createCanvas(224, 224);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 224, 224);
            const imageData = ctx.getImageData(0, 0, 224, 224);
            imageTensor = tf.browser.fromPixels({ data: new Uint8Array(imageData.data), width: 224, height: 224 });
        } catch {
            // If canvas is not available (serverless), skip image check
            logger.warn('[Moderation] Canvas not available for image decoding, skipping NSFW check');
            return { safe: true, predictions: [], flaggedCategories: [] };
        }

        const predictions = await model.classify(imageTensor);
        imageTensor.dispose();

        const flaggedCategories: string[] = [];
        for (const pred of predictions) {
            if ((pred.className === 'Porn' || pred.className === 'Hentai' || pred.className === 'Sexy') && pred.probability >= NSFW_THRESHOLD) {
                flaggedCategories.push(pred.className);
            }
        }

        return {
            safe: flaggedCategories.length === 0,
            predictions,
            flaggedCategories,
        };
    } catch (error) {
        logger.error('[Moderation] Image check error:', error);
        // On error, allow by default (don't block legitimate content)
        return { safe: true, predictions: [], flaggedCategories: [] };
    }
}

// ============================================
// COMBINED MODERATION
// ============================================

interface ModerationResult {
    allowed: boolean;
    textResult?: PerspectiveResult;
    imageResult?: NSFWResult;
    action: 'ALLOWED' | 'BLOCKED' | 'FLAGGED';
    reason?: string;
}

/**
 * Moderate content (text and/or image)
 * Returns whether content should be allowed
 */
export async function moderateContent(options: {
    text?: string;
    imageUrl?: string;
    userId: string;
    postId?: string;
    commentId?: string;
}): Promise<ModerationResult> {
    const { text, imageUrl, userId, postId, commentId } = options;
    let textResult: PerspectiveResult | undefined;
    let imageResult: NSFWResult | undefined;

    // Check text if provided
    if (text && text.trim().length > 0) {
        textResult = await checkTextToxicity(text);
    }

    // Check image if provided
    if (imageUrl) {
        imageResult = await checkImageContent(imageUrl);
    }

    const textSafe = textResult ? textResult.safe : true;
    const imageSafe = imageResult ? imageResult.safe : true;

    let action: 'ALLOWED' | 'BLOCKED' | 'FLAGGED' = 'ALLOWED';
    let reason: string | undefined;

    if (!textSafe || !imageSafe) {
        // Any blacklist match or high toxicity → BLOCK immediately
        const hasBlacklist = textResult?.flaggedCategories?.includes('BLACKLIST');
        const isSevere = textResult?.scores?.severeToxicity && textResult.scores.severeToxicity >= PERSPECTIVE_THRESHOLD;
        const isThreat = textResult?.scores?.threat && textResult.scores.threat >= PERSPECTIVE_THRESHOLD;
        const isProfanity = textResult?.scores?.profanity && textResult.scores.profanity >= PERSPECTIVE_THRESHOLD;
        const isInsult = textResult?.scores?.insult && textResult.scores.insult >= PERSPECTIVE_THRESHOLD;
        const isToxic = textResult?.scores?.toxicity && textResult.scores.toxicity >= PERSPECTIVE_THRESHOLD;
        const isNSFW = imageResult?.flaggedCategories?.includes('Porn') || imageResult?.flaggedCategories?.includes('Hentai');

        // Block on: blacklist match, severe toxicity, threats, profanity, insults, NSFW
        if (hasBlacklist || isSevere || isThreat || isProfanity || isInsult || isToxic || isNSFW) {
            action = 'BLOCKED';
        } else {
            action = 'FLAGGED';
        }

        const reasons: string[] = [];
        if (textResult?.flaggedCategories?.length) {
            reasons.push(`Texto: ${textResult.flaggedCategories.join(', ')}`);
        }
        if (imageResult?.flaggedCategories?.length) {
            reasons.push(`Imagem: ${imageResult.flaggedCategories.join(', ')}`);
        }
        reason = reasons.join(' | ');
    }

    // Log moderation result
    if (action !== 'ALLOWED') {
        try {
            await prisma.moderationLog.create({
                data: {
                    userId,
                    postId,
                    commentId,
                    type: imageResult && !imageSafe ? 'IMAGE' : 'TEXT',
                    reason: reason || 'Unknown',
                    action,
                    score: textResult?.scores?.toxicity || 0,
                    details: {
                        textScores: textResult?.scores,
                        textCategories: textResult?.flaggedCategories,
                        imageCategories: imageResult?.flaggedCategories,
                        imagePredictions: imageResult?.predictions,
                    },
                },
            });
        } catch (err) {
            logger.error('[Moderation] Failed to log moderation result:', err);
        }
    }

    return {
        allowed: action !== 'BLOCKED',
        textResult,
        imageResult,
        action,
        reason,
    };
}

// ============================================
// ADMIN: Get moderation stats & logs
// ============================================

export async function getModerationLogs(options: {
    page?: number;
    limit?: number;
    type?: 'IMAGE' | 'TEXT';
    action?: 'BLOCKED' | 'FLAGGED' | 'WARNED';
}) {
    const { page = 1, limit = 20, type, action } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
        prisma.moderationLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.moderationLog.count({ where }),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getModerationStats() {
    const [totalBlocked, totalFlagged, last24h, byType] = await Promise.all([
        prisma.moderationLog.count({ where: { action: 'BLOCKED' } }),
        prisma.moderationLog.count({ where: { action: 'FLAGGED' } }),
        prisma.moderationLog.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.moderationLog.groupBy({
            by: ['type'],
            _count: true,
        }),
    ]);

    return {
        totalBlocked,
        totalFlagged,
        last24h,
        byType: byType.reduce((acc, item) => {
            acc[item.type] = item._count;
            return acc;
        }, {} as Record<string, number>),
    };
}
