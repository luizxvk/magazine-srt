import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// ===================== ADMIN: Submit PIX Seller Request =====================

/**
 * Submit a request to Rovex for PIX selling permission on a product
 */
export const submitPixSellerRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const {
            productId,
            sellerName,
            sellerDocument,
            sellerEmail,
            sellerPhone,
            pixKey,
            pixKeyType,
            justification
        } = req.body;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem solicitar permissão PIX' });
        }

        // Get product
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        if (!product.priceBRL) {
            return res.status(400).json({ error: 'O produto precisa ter um preço em BRL para vender via PIX' });
        }

        // Check if there's already a pending request for this product
        const existingRequest = await prisma.pixSellerRequest.findFirst({
            where: {
                productId,
                status: 'PENDING'
            }
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'Já existe uma solicitação pendente para este produto' });
        }

        // Validate required fields
        if (!sellerName || !sellerEmail || !pixKey || !pixKeyType) {
            return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
        }

        // Create the request
        const request = await prisma.pixSellerRequest.create({
            data: {
                productId,
                requestedById: userId!,
                sellerName,
                sellerDocument: sellerDocument || null,
                sellerEmail,
                sellerPhone: sellerPhone || null,
                pixKey,
                pixKeyType,
                productName: product.name,
                productPrice: product.priceBRL,
                productDescription: product.description,
                justification: justification || null,
                status: 'PENDING'
            }
        });

        // Update product's PIX approval status to PENDING
        await prisma.product.update({
            where: { id: productId },
            data: {
                pixApprovalStatus: 'PENDING',
                pixKey,
                pixKeyType
            }
        });

        res.status(201).json({
            message: 'Solicitação enviada para a Rovex com sucesso',
            request
        });
    } catch (error) {
        console.error('Error submitting PIX seller request:', error);
        res.status(500).json({ error: 'Erro ao enviar solicitação' });
    }
};

/**
 * Get PIX seller requests for admin (their own requests)
 */
export const getPixSellerRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const requests = await prisma.pixSellerRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        category: true,
                        priceBRL: true,
                        pixApprovalStatus: true
                    }
                }
            }
        });

        res.json(requests);
    } catch (error) {
        console.error('Error getting PIX seller requests:', error);
        res.status(500).json({ error: 'Erro ao buscar solicitações' });
    }
};

/**
 * Get PIX approval status for a specific product
 */
export const getProductPixStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { productId } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                pixApprovalStatus: true,
                pixKey: true,
                pixKeyType: true
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const latestRequest = await prisma.pixSellerRequest.findFirst({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                reviewNote: true,
                reviewedAt: true,
                createdAt: true
            }
        });

        res.json({
            ...product,
            latestRequest
        });
    } catch (error) {
        console.error('Error getting product PIX status:', error);
        res.status(500).json({ error: 'Erro ao buscar status PIX' });
    }
};

// ===================== ROVEX: Review PIX Seller Requests =====================

/**
 * Get all pending PIX seller requests (Rovex Platform)
 */
export const getRovexPixRequests = async (req: any, res: Response) => {
    try {
        const { status = 'PENDING' } = req.query;

        const requests = await prisma.pixSellerRequest.findMany({
            where: status !== 'all' ? { status: status as any } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        category: true,
                        priceBRL: true
                    }
                },
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        email: true
                    }
                }
            }
        });

        res.json(requests);
    } catch (error) {
        console.error('Error getting Rovex PIX requests:', error);
        res.status(500).json({ error: 'Erro ao buscar solicitações PIX' });
    }
};

/**
 * Approve or reject a PIX seller request (Rovex Platform)
 */
export const reviewPixRequest = async (req: any, res: Response) => {
    try {
        const { requestId } = req.params;
        const { action, reviewNote } = req.body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Ação inválida. Use "approve" ou "reject"' });
        }

        const request = await prisma.pixSellerRequest.findUnique({
            where: { id: requestId },
            include: {
                product: true,
                requestedBy: { select: { id: true, email: true, displayName: true } }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Esta solicitação já foi processada' });
        }

        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

        // Update request
        await prisma.pixSellerRequest.update({
            where: { id: requestId },
            data: {
                status: newStatus,
                reviewedAt: new Date(),
                reviewNote: reviewNote || null
            }
        });

        // Update product's PIX approval status
        const productUpdate: any = {
            pixApprovalStatus: newStatus
        };

        if (action === 'approve') {
            // Enable PIX on the product and ensure it's in accepted methods
            const currentMethods = request.product.acceptedPaymentMethods || [];
            if (!currentMethods.includes('PIX')) {
                productUpdate.acceptedPaymentMethods = [...currentMethods, 'PIX'];
            }
            productUpdate.pixKey = request.pixKey;
            productUpdate.pixKeyType = request.pixKeyType;
        } else {
            // Remove PIX from accepted methods if rejected
            productUpdate.acceptedPaymentMethods = (request.product.acceptedPaymentMethods || []).filter(
                (m: string) => m !== 'PIX'
            );
            productUpdate.pixKey = null;
            productUpdate.pixKeyType = null;
        }

        await prisma.product.update({
            where: { id: request.productId },
            data: productUpdate
        });

        // Notify the admin who made the request
        await prisma.notification.create({
            data: {
                userId: request.requestedById,
                type: 'SYSTEM',
                content: action === 'approve'
                    ? `✅ Sua solicitação PIX para "${request.productName}" foi APROVADA pela Rovex! Agora você pode vender via PIX.`
                    : `❌ Sua solicitação PIX para "${request.productName}" foi REJEITADA pela Rovex.${reviewNote ? ` Motivo: ${reviewNote}` : ''}`
            }
        });

        res.json({
            message: action === 'approve'
                ? 'Solicitação aprovada com sucesso'
                : 'Solicitação rejeitada',
            status: newStatus
        });
    } catch (error) {
        console.error('Error reviewing PIX request:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
};
