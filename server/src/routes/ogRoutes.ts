import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const FRONTEND_URL = 'https://magazine-frontend.vercel.app';
const API_BASE = 'https://magazine-srt.vercel.app';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Generate Open Graph HTML for a post
router.get('/post/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        displayName: true,
                        avatarUrl: true
                    }
                }
            }
        });
        
        if (!post) {
            // Redirect to frontend if post not found
            return res.redirect(302, `${FRONTEND_URL}/post/${id}`);
        }
        
        // Get image URL
        let imageUrl = `${FRONTEND_URL}/assets/mgt-log-logo.png`;
        if (post.imageUrl) {
            imageUrl = post.imageUrl.startsWith('http') 
                ? post.imageUrl 
                : `${API_BASE}${post.imageUrl}`;
        }
        
        // Get author name
        const authorName = post.user?.displayName || post.user?.name || 'Magazine MGT';
        
        // Get post content
        let description = post.caption || 'Confira esta publicação no Magazine MGT';
        if (description.length > 200) {
            description = description.substring(0, 197) + '...';
        }
        
        // Generate HTML with OG meta tags
        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${FRONTEND_URL}/post/${id}">
    <meta property="og:title" content="${escapeHtml(authorName)} no Magazine MGT">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Magazine MGT">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${FRONTEND_URL}/post/${id}">
    <meta name="twitter:title" content="${escapeHtml(authorName)} no Magazine MGT">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <title>${escapeHtml(authorName)} no Magazine MGT</title>
    
    <!-- Redirect to actual SPA after a moment -->
    <meta http-equiv="refresh" content="0; url=${FRONTEND_URL}/post/${id}">
</head>
<body style="background: #0a0a0a; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
    <p>Redirecionando para <a href="${FRONTEND_URL}/post/${id}" style="color: #d4af37;">Magazine MGT</a>...</p>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).send(html);
        
    } catch (error) {
        console.error('Error generating OG for post:', error);
        return res.redirect(302, `${FRONTEND_URL}/post/${id}`);
    }
});

export default router;
