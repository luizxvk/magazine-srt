import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

const REPORTS_THRESHOLD = 5; // Number of reports before auto-removal

export const reportPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.params;
        const { reason } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        if (!postId || !reason) {
            return res.status(400).json({ error: 'Post ID e motivo são obrigatórios' });
        }

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        // Check if user already reported this post
        const existingReport = await prisma.report.findFirst({
            where: {
                reporterId: userId,
                postId: postId
            }
        });

        if (existingReport) {
            return res.status(400).json({ error: 'Você já denunciou esta postagem' });
        }

        // Create report
        await prisma.report.create({
            data: {
                reporterId: userId,
                postId: postId,
                reason: reason
            }
        });

        // Increment report count on post
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                reportsCount: {
                    increment: 1
                }
            }
        });

        // Auto-remove if threshold reached
        if (updatedPost.reportsCount >= REPORTS_THRESHOLD) {
            await prisma.post.update({
                where: { id: postId },
                data: {
                    isRemoved: true
                }
            });

            // Notify admins
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' }
            });

            for (const admin of admins) {
                await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        type: 'SYSTEM',
                        content: JSON.stringify({
                            text: `Post removido automaticamente por ${REPORTS_THRESHOLD} denúncias`,
                            postId: postId
                        })
                    }
                });
            }

            return res.json({ 
                message: 'Denúncia registrada. Post foi removido devido ao número de denúncias.',
                removed: true 
            });
        }

        res.json({ message: 'Denúncia registrada com sucesso. Obrigado pelo feedback.' });
    } catch (error) {
        console.error('[Report] Error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const getReports = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId || userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const reports = await prisma.report.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(reports);
    } catch (error) {
        console.error('[Report] Error fetching reports:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const resolveReport = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { reportId } = req.params;
        const { action } = req.body; // 'dismiss' or 'remove'

        if (!userId || userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const report = await prisma.report.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return res.status(404).json({ error: 'Denúncia não encontrada' });
        }

        if (action === 'remove' && report.postId) {
            // Remove the post
            await prisma.post.update({
                where: { id: report.postId },
                data: { isRemoved: true }
            });
        }

        // Update report status
        await prisma.report.update({
            where: { id: reportId },
            data: {
                status: action === 'dismiss' ? 'DISMISSED' : 'RESOLVED',
                resolvedAt: new Date(),
                resolvedBy: userId
            }
        });

        res.json({ message: 'Denúncia processada com sucesso' });
    } catch (error) {
        console.error('[Report] Error resolving:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
