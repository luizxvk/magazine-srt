import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Conversion rate: 100 Zions = R$ 1.00
const ZIONS_TO_BRL_RATE = 100;
const MIN_WITHDRAWAL_ZIONS = 1000; // Minimum 1000 Zions (R$ 10)
const MAX_WITHDRAWAL_ZIONS = 100000; // Maximum 100000 Zions (R$ 1000)

/**
 * Get conversion rate info
 */
export const getConversionRate = async (_req: Request, res: Response) => {
    try {
        res.json({
            rate: ZIONS_TO_BRL_RATE,
            minZions: MIN_WITHDRAWAL_ZIONS,
            maxZions: MAX_WITHDRAWAL_ZIONS,
            minBRL: MIN_WITHDRAWAL_ZIONS / ZIONS_TO_BRL_RATE,
            maxBRL: MAX_WITHDRAWAL_ZIONS / ZIONS_TO_BRL_RATE
        });
    } catch (error) {
        console.error('Error getting conversion rate:', error);
        res.status(500).json({ error: 'Erro ao buscar taxa de conversão' });
    }
};

/**
 * Request a withdrawal
 */
export const requestWithdrawal = async (req: Request, res: Response) => {
    try {
        const { amountZions, pixKey, pixKeyType } = req.body;
        const userId = (req as any).userId;

        // Validate amount
        if (amountZions < MIN_WITHDRAWAL_ZIONS) {
            return res.status(400).json({ 
                error: `Mínimo para saque: ${MIN_WITHDRAWAL_ZIONS} Zions (R$ ${MIN_WITHDRAWAL_ZIONS / ZIONS_TO_BRL_RATE})` 
            });
        }

        if (amountZions > MAX_WITHDRAWAL_ZIONS) {
            return res.status(400).json({ 
                error: `Máximo para saque: ${MAX_WITHDRAWAL_ZIONS} Zions (R$ ${MAX_WITHDRAWAL_ZIONS / ZIONS_TO_BRL_RATE})` 
            });
        }

        // Get user
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Check if user has enough Zions
        if (user.zions < amountZions) {
            return res.status(400).json({ error: 'Zions insuficientes' });
        }

        // Check for pending withdrawals
        const pendingWithdrawal = await prisma.withdrawalRequest.findFirst({
            where: {
                userId,
                status: { in: ['PENDING', 'PROCESSING'] }
            }
        });

        if (pendingWithdrawal) {
            return res.status(400).json({ 
                error: 'Você já possui uma solicitação de saque em andamento' 
            });
        }

        // Calculate BRL amount
        const amountBRL = amountZions / ZIONS_TO_BRL_RATE;

        // Create withdrawal request and deduct Zions
        const [withdrawal] = await prisma.$transaction([
            prisma.withdrawalRequest.create({
                data: {
                    userId,
                    amountZions,
                    amountBRL,
                    pixKey,
                    pixKeyType
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { zions: { decrement: amountZions } }
            }),
            prisma.zionHistory.create({
                data: {
                    userId,
                    amount: -amountZions,
                    reason: `Solicitação de saque - R$ ${amountBRL.toFixed(2)}`,
                    currency: 'CASH'
                }
            })
        ]);

        res.status(201).json({
            success: true,
            withdrawal: {
                id: withdrawal.id,
                amountZions,
                amountBRL,
                status: withdrawal.status,
                createdAt: withdrawal.createdAt
            }
        });
    } catch (error) {
        console.error('Error requesting withdrawal:', error);
        res.status(500).json({ error: 'Erro ao solicitar saque' });
    }
};

/**
 * Get user's withdrawal history
 */
export const getUserWithdrawals = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const withdrawals = await prisma.withdrawalRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(withdrawals);
    } catch (error) {
        console.error('Error getting user withdrawals:', error);
        res.status(500).json({ error: 'Erro ao buscar saques' });
    }
};

/**
 * Cancel a pending withdrawal request
 */
export const cancelWithdrawal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        const withdrawal = await prisma.withdrawalRequest.findUnique({
            where: { id }
        });

        if (!withdrawal) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        if (withdrawal.userId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        if (withdrawal.status !== 'PENDING') {
            return res.status(400).json({ error: 'Apenas solicitações pendentes podem ser canceladas' });
        }

        // Cancel and refund
        await prisma.$transaction([
            prisma.withdrawalRequest.update({
                where: { id },
                data: { status: 'REJECTED', rejectionNote: 'Cancelado pelo usuário' }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { zions: { increment: withdrawal.amountZions } }
            }),
            prisma.zionHistory.create({
                data: {
                    userId,
                    amount: withdrawal.amountZions,
                    reason: 'Saque cancelado - reembolso',
                    currency: 'CASH'
                }
            })
        ]);

        res.json({ 
            success: true, 
            message: 'Saque cancelado e Zions reembolsados',
            refundedZions: withdrawal.amountZions
        });
    } catch (error) {
        console.error('Error canceling withdrawal:', error);
        res.status(500).json({ error: 'Erro ao cancelar saque' });
    }
};

// ===================== ADMIN FUNCTIONS =====================

/**
 * Get all withdrawal requests (Admin only)
 */
export const getAllWithdrawals = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { status, limit = 50 } = req.query;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const withdrawals = await prisma.withdrawalRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Get summary stats
        const stats = await prisma.withdrawalRequest.groupBy({
            by: ['status'],
            _count: true,
            _sum: { amountBRL: true }
        });

        res.json({ withdrawals, stats });
    } catch (error) {
        console.error('Error getting all withdrawals:', error);
        res.status(500).json({ error: 'Erro ao buscar saques' });
    }
};

/**
 * Approve a withdrawal request (Admin only)
 */
export const approveWithdrawal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const withdrawal = await prisma.withdrawalRequest.findUnique({
            where: { id }
        });

        if (!withdrawal) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        if (withdrawal.status !== 'PENDING') {
            return res.status(400).json({ error: 'Esta solicitação não está pendente' });
        }

        await prisma.withdrawalRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                processedById: userId,
                processedAt: new Date()
            }
        });

        res.json({ success: true, message: 'Saque aprovado' });
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        res.status(500).json({ error: 'Erro ao aprovar saque' });
    }
};

/**
 * Mark withdrawal as processing (Admin only)
 */
export const processWithdrawal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const withdrawal = await prisma.withdrawalRequest.findUnique({
            where: { id }
        });

        if (!withdrawal || withdrawal.status !== 'APPROVED') {
            return res.status(400).json({ error: 'Solicitação inválida ou não aprovada' });
        }

        await prisma.withdrawalRequest.update({
            where: { id },
            data: { status: 'PROCESSING' }
        });

        res.json({ success: true, message: 'Saque em processamento' });
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ error: 'Erro ao processar saque' });
    }
};

/**
 * Complete a withdrawal (Admin only)
 */
export const completeWithdrawal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const withdrawal = await prisma.withdrawalRequest.findUnique({
            where: { id }
        });

        if (!withdrawal || !['APPROVED', 'PROCESSING'].includes(withdrawal.status)) {
            return res.status(400).json({ error: 'Solicitação inválida' });
        }

        await prisma.withdrawalRequest.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                processedAt: new Date()
            }
        });

        res.json({ success: true, message: 'Saque concluído' });
    } catch (error) {
        console.error('Error completing withdrawal:', error);
        res.status(500).json({ error: 'Erro ao concluir saque' });
    }
};

/**
 * Reject a withdrawal request (Admin only)
 */
export const rejectWithdrawal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rejectionNote } = req.body;
        const userId = (req as any).userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const withdrawal = await prisma.withdrawalRequest.findUnique({
            where: { id }
        });

        if (!withdrawal) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        if (!['PENDING', 'APPROVED'].includes(withdrawal.status)) {
            return res.status(400).json({ error: 'Esta solicitação não pode ser rejeitada' });
        }

        // Reject and refund
        await prisma.$transaction([
            prisma.withdrawalRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    processedById: userId,
                    processedAt: new Date(),
                    rejectionNote: rejectionNote || 'Solicitação rejeitada pelo administrador'
                }
            }),
            prisma.user.update({
                where: { id: withdrawal.userId },
                data: { zions: { increment: withdrawal.amountZions } }
            }),
            prisma.zionHistory.create({
                data: {
                    userId: withdrawal.userId,
                    amount: withdrawal.amountZions,
                    reason: 'Saque rejeitado - reembolso',
                    currency: 'CASH'
                }
            })
        ]);

        res.json({ success: true, message: 'Saque rejeitado e Zions reembolsados' });
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        res.status(500).json({ error: 'Erro ao rejeitar saque' });
    }
};
