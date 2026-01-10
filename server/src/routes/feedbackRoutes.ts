import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

interface FeedbackRating {
    interfaceRating: number;
    navigationRating: number;
    performanceRating: number;
    designRating: number;
    featuresRating: number;
    communityRating: number;
    customizationRating: number;
    supportRating: number;
    wouldRecommend: boolean;
}

// Submit feedback (authenticated users only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        
        // Check if user already submitted feedback in last 7 days
        const existingFeedback = await prisma.feedback.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        });
        
        if (existingFeedback) {
            return res.status(400).json({ 
                error: 'Você já enviou um feedback nos últimos 7 dias. Aguarde para enviar novamente.' 
            });
        }
        
        const {
            interfaceRating,
            navigationRating,
            performanceRating,
            designRating,
            featuresRating,
            bugsFound,
            favoriteFeature,
            missingFeature,
            wouldRecommend,
            overallExperience,
            suggestions,
            communityRating,
            customizationRating,
            supportRating
        } = req.body;
        
        // Validate ratings (1-5)
        const ratings = [
            interfaceRating,
            navigationRating,
            performanceRating,
            designRating,
            featuresRating,
            communityRating,
            customizationRating,
            supportRating
        ];
        
        for (const rating of ratings) {
            if (typeof rating !== 'number' || rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'Todas as avaliações devem ser entre 1 e 5' });
            }
        }
        
        const feedback = await prisma.feedback.create({
            data: {
                userId,
                interfaceRating,
                navigationRating,
                performanceRating,
                designRating,
                featuresRating,
                bugsFound: bugsFound || null,
                favoriteFeature: favoriteFeature || null,
                missingFeature: missingFeature || null,
                wouldRecommend: Boolean(wouldRecommend),
                overallExperience: overallExperience || null,
                suggestions: suggestions || null,
                communityRating,
                customizationRating,
                supportRating
            }
        });
        
        // Award user with Zions for feedback
        await prisma.user.update({
            where: { id: userId },
            data: { zions: { increment: 50 } }
        });
        
        // Log zion history
        await prisma.zionHistory.create({
            data: {
                userId,
                amount: 50,
                reason: 'Feedback enviado'
            }
        });
        
        res.status(201).json({ 
            message: 'Feedback enviado com sucesso! Você ganhou 50 Zions.',
            feedback 
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Erro ao enviar feedback' });
    }
});

// Check if user can submit feedback
router.get('/can-submit', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        
        const existingFeedback = await prisma.feedback.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        if (existingFeedback) {
            const nextAllowedDate = new Date(existingFeedback.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            res.json({ 
                canSubmit: false, 
                nextAllowedDate,
                lastSubmittedAt: existingFeedback.createdAt
            });
        } else {
            res.json({ canSubmit: true });
        }
    } catch (error) {
        console.error('Error checking feedback status:', error);
        res.status(500).json({ error: 'Erro ao verificar status do feedback' });
    }
});

// Get all feedbacks (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        
        const where = unreadOnly === 'true' ? { isRead: false } : {};
        
        const [feedbacks, total, unreadCount] = await Promise.all([
            prisma.feedback.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            avatarUrl: true,
                            membershipType: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            }),
            prisma.feedback.count({ where }),
            prisma.feedback.count({ where: { isRead: false } })
        ]);
        
        res.json({
            feedbacks,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ error: 'Erro ao buscar feedbacks' });
    }
});

// Get feedback stats (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            select: {
                interfaceRating: true,
                navigationRating: true,
                performanceRating: true,
                designRating: true,
                featuresRating: true,
                communityRating: true,
                customizationRating: true,
                supportRating: true,
                wouldRecommend: true
            }
        });
        
        const count = feedbacks.length;
        
        if (count === 0) {
            return res.json({
                averages: {
                    interface: 0,
                    navigation: 0,
                    performance: 0,
                    design: 0,
                    features: 0,
                    community: 0,
                    customization: 0,
                    support: 0
                },
                recommendRate: 0,
                totalFeedbacks: 0
            });
        }
        
        const averages = {
            interface: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.interfaceRating, 0) / count,
            navigation: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.navigationRating, 0) / count,
            performance: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.performanceRating, 0) / count,
            design: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.designRating, 0) / count,
            features: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.featuresRating, 0) / count,
            community: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.communityRating, 0) / count,
            customization: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.customizationRating, 0) / count,
            support: feedbacks.reduce((acc: number, f: FeedbackRating) => acc + f.supportRating, 0) / count
        };
        
        const recommendCount = feedbacks.filter((f: FeedbackRating) => f.wouldRecommend).length;
        const recommendRate = (recommendCount / count) * 100;
        
        res.json({
            averages,
            recommendRate,
            totalFeedbacks: count
        });
    } catch (error) {
        console.error('Error fetching feedback stats:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas de feedback' });
    }
});

// Mark feedback as read (admin only)
router.patch('/:id/read', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const feedback = await prisma.feedback.update({
            where: { id },
            data: { isRead: true }
        });
        
        res.json(feedback);
    } catch (error) {
        console.error('Error marking feedback as read:', error);
        res.status(500).json({ error: 'Erro ao marcar feedback como lido' });
    }
});

// Delete feedback (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.feedback.delete({
            where: { id }
        });
        
        res.json({ message: 'Feedback removido com sucesso' });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ error: 'Erro ao remover feedback' });
    }
});

export default router;
