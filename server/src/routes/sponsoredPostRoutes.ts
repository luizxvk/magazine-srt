import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Pricing tiers for sponsored posts (Zions Cash)
const SPONSORED_POST_COST = 50; // R$ 50 em Zions Cash

// POST /sponsored-posts - Request to sponsor a post
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ error: 'postId é obrigatório' });
        }
        
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        // Get user with balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, zionsCash: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Check if post exists and belongs to user
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, userId: true, caption: true }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        if (post.userId !== userId) {
            return res.status(403).json({ error: 'Você só pode patrocinar seus próprios posts' });
        }

        // Check if there's already a pending request for this post
        const existingRequest = await prisma.sponsoredPostRequest.findFirst({
            where: {
                postId: postId,
                status: 'PENDING'
            }
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'Já existe uma solicitação pendente para este post' });
        }

        // Check balance
        if (user.zionsCash < SPONSORED_POST_COST) {
            return res.status(400).json({ 
                error: 'Zions Cash insuficiente',
                required: SPONSORED_POST_COST,
                current: user.zionsCash
            });
        }

        // Create request and deduct Zions Cash atomically
        const [request] = await prisma.$transaction([
            prisma.sponsoredPostRequest.create({
                data: {
                    postId: postId,
                    userId: userId,
                    zionsCashPaid: SPONSORED_POST_COST,
                    status: 'PENDING'
                },
                include: {
                    post: {
                        select: { id: true, caption: true, imageUrl: true }
                    }
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    zionsCash: { decrement: SPONSORED_POST_COST }
                }
            }),
            prisma.zionHistory.create({
                data: {
                    userId: userId,
                    amount: -SPONSORED_POST_COST,
                    reason: `SPONSORED_POST:${postId}`,
                    description: `Solicitação de post patrocinado`
                }
            })
        ]);

        return res.status(201).json({
            message: 'Solicitação enviada! Aguardando aprovação do admin.',
            request: request
        });
    } catch (error) {
        console.error('Error creating sponsored post request:', error);
        return res.status(500).json({ error: 'Erro ao criar solicitação' });
    }
});

// GET /sponsored-posts - List all requests (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;

        const where: any = {};
        if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
            where.status = status;
        }

        const requests = await prisma.sponsoredPostRequest.findMany({
            where,
            include: {
                post: {
                    select: { 
                        id: true, 
                        caption: true, 
                        imageUrl: true,
                        videoUrl: true,
                        mediaType: true
                    }
                },
                user: {
                    select: { 
                        id: true, 
                        name: true, 
                        username: true,
                        avatarUrl: true
                    }
                },
                reviewer: {
                    select: { 
                        id: true, 
                        name: true, 
                        username: true 
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.json(requests);
    } catch (error) {
        console.error('Error listing sponsored post requests:', error);
        return res.status(500).json({ error: 'Erro ao listar solicitações' });
    }
});

// PUT /sponsored-posts/:id/approve - Approve a request (admin only)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user.id;

        const request = await prisma.sponsoredPostRequest.findUnique({
            where: { id },
            include: { post: true }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Esta solicitação já foi processada' });
        }

        // Update request and mark post as highlight (sponsored)
        const [updatedRequest] = await prisma.$transaction([
            prisma.sponsoredPostRequest.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    reviewedBy: adminId,
                    reviewedAt: new Date()
                }
            }),
            // Mark the post as highlight (this makes it appear prominently)
            prisma.post.update({
                where: { id: request.postId },
                data: { isHighlight: true }
            })
        ]);

        return res.json({
            message: 'Post patrocinado aprovado!',
            request: updatedRequest
        });
    } catch (error) {
        console.error('Error approving sponsored post:', error);
        return res.status(500).json({ error: 'Erro ao aprovar solicitação' });
    }
});

// PUT /sponsored-posts/:id/reject - Reject a request and refund (admin only)
router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user.id;
        const { reason } = req.body;

        const request = await prisma.sponsoredPostRequest.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Esta solicitação já foi processada' });
        }

        // Refund the user and update request
        await prisma.$transaction([
            prisma.sponsoredPostRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    reviewedBy: adminId,
                    reviewedAt: new Date()
                }
            }),
            // Refund Zions Cash
            prisma.user.update({
                where: { id: request.userId },
                data: {
                    zionsCash: { increment: request.zionsCashPaid }
                }
            }),
            prisma.zionHistory.create({
                data: {
                    userId: request.userId,
                    amount: request.zionsCashPaid,
                    reason: `SPONSORED_POST_REFUND:${request.postId}`,
                    description: reason || 'Solicitação de post patrocinado recusada - reembolso'
                }
            })
        ]);

        return res.json({
            message: 'Solicitação rejeitada. Zions Cash reembolsado ao usuário.',
            refunded: request.zionsCashPaid
        });
    } catch (error) {
        console.error('Error rejecting sponsored post:', error);
        return res.status(500).json({ error: 'Erro ao rejeitar solicitação' });
    }
});

// GET /sponsored-posts/my - Get user's own sponsored post requests
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.id;

        const requests = await prisma.sponsoredPostRequest.findMany({
            where: { userId },
            include: {
                post: {
                    select: { 
                        id: true, 
                        caption: true, 
                        imageUrl: true 
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.json(requests);
    } catch (error) {
        console.error('Error listing user sponsored post requests:', error);
        return res.status(500).json({ error: 'Erro ao listar suas solicitações' });
    }
});

// GET /sponsored-posts/price - Get current pricing
router.get('/price', async (_req, res) => {
    return res.json({
        cost: SPONSORED_POST_COST,
        currency: 'zionsCash',
        description: 'Seu post será destacado no feed de todos os usuários'
    });
});

export default router;
