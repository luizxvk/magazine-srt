import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';
import crypto from 'crypto';

// Packages configuration - valores fixos para evitar manipulação
const ZION_PACKAGES: Record<number, number> = {
    50: 5.00,
    150: 12.00,
    300: 20.00,
    500: 30.00,
    1000: 50.00
};

// Helper para verificar se o pacote é válido
const isValidPackage = (zions: number): boolean => {
    return zions in ZION_PACKAGES;
};

// Helper para gerar referência externa única
const generateExternalRef = (userId: string, zions: number): string => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${userId}-${zions}-${timestamp}-${random}`;
};

// Create PIX payment
export const createPixPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        const { zions } = req.body;

        // Validação rigorosa
        if (!zions || typeof zions !== 'number' || !isValidPackage(zions)) {
            console.warn(`[PAYMENT] Invalid package attempt: ${zions} by user ${userId}`);
            return res.status(400).json({ error: 'Pacote de Zions inválido' });
        }

        // Preço fixo do servidor - NUNCA confie no cliente
        const price = ZION_PACKAGES[zions];

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.error('[PAYMENT] MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({ error: 'Sistema de pagamento não configurado' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Gerar referência externa única para idempotência
        const externalRef = generateExternalRef(userId, zions);

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);

        // Criar registro da compra ANTES de criar o pagamento
        const newPurchase = await prisma.zionPurchase.create({
            data: {
                userId,
                amount: zions,
                price: price,
                status: 'PENDING'
            }
        });

        console.log(`[PAYMENT] Creating PIX payment: ${zions} Zions for R$${price} - User: ${userId} - PurchaseID: ${newPurchase.id}`);

        // Criar pagamento PIX
        const result = await payment.create({
            body: {
                transaction_amount: price,
                description: `${zions} Zions - Magazine/MGT`,
                payment_method_id: 'pix',
                payer: {
                    email: user.email,
                    first_name: user.name?.split(' ')[0] || 'Usuario',
                    last_name: user.name?.split(' ').slice(1).join(' ') || 'Magazine'
                },
                external_reference: newPurchase.id, // Usar ID do registro para rastreabilidade
                notification_url: `${process.env.BACKEND_URL || 'https://api.magazinesrt.com.br'}/api/payments/webhook`
            }
        });

        // Atualizar registro com ID do pagamento (apenas campos que existem)
        await prisma.zionPurchase.update({
            where: { id: newPurchase.id },
            data: { 
                paymentId: String(result.id)
            }
        });

        console.log(`[PAYMENT] PIX created successfully - PaymentID: ${result.id} - Status: ${result.status}`);

        // Retornar dados do PIX
        const pixInfo = result.point_of_interaction?.transaction_data;
        
        res.json({
            paymentId: result.id,
            purchaseId: newPurchase.id,
            qrCode: pixInfo?.qr_code,
            qrCodeBase64: pixInfo?.qr_code_base64,
            copyPaste: pixInfo?.qr_code,
            ticketUrl: pixInfo?.ticket_url,
            status: result.status,
            expirationDate: result.date_of_expiration
        });

    } catch (error: any) {
        console.error('[PAYMENT] Error creating PIX payment:', error?.message || error);
        res.status(500).json({ error: 'Falha ao criar pagamento PIX' });
    }
};

// Check payment status
export const checkPaymentStatus = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const userId = (req as any).user?.userId || (req as any).user?.id;

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            return res.status(500).json({ error: 'Sistema de pagamento não configurado' });
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);

        const result = await payment.get({ id: paymentId });

        // Se aprovado, creditar Zions
        if (result.status === 'approved' && result.external_reference) {
            await creditZionsFromPayment(result.external_reference, String(result.id), userId);
        }

        res.json({ 
            status: result.status,
            statusDetail: result.status_detail
        });

    } catch (error: any) {
        console.error('[PAYMENT] Error checking payment:', error?.message || error);
        res.status(500).json({ error: 'Falha ao verificar status do pagamento' });
    }
};

// Helper para creditar Zions de forma segura (evita duplicação)
const creditZionsFromPayment = async (purchaseId: string, paymentId: string, requestingUserId?: string): Promise<boolean> => {
    try {
        // Buscar a compra
        const purchase = await prisma.zionPurchase.findUnique({
            where: { id: purchaseId },
            include: { user: true }
        });

        if (!purchase) {
            console.warn(`[PAYMENT] Purchase not found: ${purchaseId}`);
            return false;
        }

        // Verificação de segurança - usuário só pode verificar suas próprias compras
        if (requestingUserId && purchase.userId !== requestingUserId) {
            console.warn(`[PAYMENT] User ${requestingUserId} tried to access purchase of user ${purchase.userId}`);
            return false;
        }

        // Já foi processado? (idempotência)
        if (purchase.status === 'COMPLETED') {
            console.log(`[PAYMENT] Purchase already completed: ${purchaseId}`);
            return true; // Já processado, não é erro
        }

        // Atualizar status e creditar Zions Cash em uma transação
        // zionsCash = moeda real (comprada com dinheiro)
        // zionsPoints = moeda virtual (ganha por engajamento)
        await prisma.$transaction([
            prisma.user.update({
                where: { id: purchase.userId },
                data: { 
                    zionsCash: { increment: purchase.amount } // Creditar apenas em zionsCash (moeda real)
                }
            }),
            prisma.zionPurchase.update({
                where: { id: purchase.id },
                data: { 
                    status: 'COMPLETED',
                    paymentId: paymentId
                }
            }),
            // Registrar no histórico de Zions
            prisma.zionHistory.create({
                data: {
                    userId: purchase.userId,
                    amount: purchase.amount,
                    reason: `Compra de ${purchase.amount} Zions Cash por R$${purchase.price.toFixed(2)}`
                }
            })
        ]);

        console.log(`[PAYMENT] ✅ Zions credited: ${purchase.amount} to user ${purchase.userId} - PaymentID: ${paymentId}`);
        return true;

    } catch (error: any) {
        console.error(`[PAYMENT] Error crediting Zions for purchase ${purchaseId}:`, error?.message || error);
        return false;
    }
};

export const createZionsPreference = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { zions } = req.body;

        if (!zions || !ZION_PACKAGES[zions]) {
            return res.status(400).json({ error: 'Invalid Zions package' });
        }

        const price = ZION_PACKAGES[zions];

        // Access Token Check
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.warn('MERCADOPAGO_ACCESS_TOKEN not found');
            // Mock response for dev/testing if token missing
            if (process.env.NODE_ENV === 'development') {
                return res.json({
                    preferenceId: 'mock-pref-id',
                    init_point: 'https://www.mercadopago.com.br' // Just redirect to home as mock
                });
            }
            return res.status(500).json({ error: 'Payment configuration missing' });
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const preference = new Preference(client);

        const newPurchase = await prisma.zionPurchase.create({
            data: {
                userId,
                amount: zions,
                price: price,
                status: 'PENDING'
            }
        });

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: `zions-${zions}`,
                        title: `${zions} Zions - Magazine MGT`,
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'BRL'
                    }
                ],
                payer: {
                    email: (req as any).user.email
                },
                external_reference: newPurchase.id,
                back_urls: {
                    success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=success`,
                    failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=failure`,
                    pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=pending`
                },
                auto_return: 'approved'
            }
        });

        // Update purchase with preference ID
        await prisma.zionPurchase.update({
            where: { id: newPurchase.id },
            data: {
                preferenceId: result.id,
                paymentId: result.id // Temporarily store pref ID here until payment
            }
        });

        res.json({
            preferenceId: result.id,
            init_point: result.init_point
        });

    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: 'Failed to create payment preference' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        // Responder imediatamente ao Mercado Pago (ele espera resposta rápida)
        res.status(200).send('OK');

        const { type, data, action } = req.body;
        
        console.log(`[WEBHOOK] Received: type=${type}, action=${action}, data=${JSON.stringify(data)}`);

        // Processar apenas notificações de pagamento
        if (type !== 'payment' || !data?.id) {
            console.log('[WEBHOOK] Ignoring non-payment notification');
            return;
        }

        const paymentId = data.id;

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.error('[WEBHOOK] MERCADOPAGO_ACCESS_TOKEN not configured');
            return;
        }

        // Buscar detalhes do pagamento no Mercado Pago (verificação de autenticidade)
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);

        const result = await payment.get({ id: paymentId });

        console.log(`[WEBHOOK] Payment ${paymentId}: status=${result.status}, external_ref=${result.external_reference}`);

        if (!result.external_reference) {
            console.warn(`[WEBHOOK] Payment ${paymentId} has no external_reference`);
            return;
        }

        const externalRef = result.external_reference;

        // Check if it's a product order (prefixed with "product_")
        if (externalRef.startsWith('product_')) {
            const orderId = externalRef.replace('product_', '');
            await processProductPayment(orderId, String(paymentId), result.status || 'pending', result.status_detail || null);
            return;
        }

        // Otherwise, it's a Zions purchase
        const purchase = await prisma.zionPurchase.findUnique({
            where: { id: externalRef }
        });

        if (!purchase) {
            console.warn(`[WEBHOOK] Purchase not found for external_ref: ${externalRef}`);
            return;
        }

        // Processar baseado no status
        switch (result.status) {
            case 'approved':
                await creditZionsFromPayment(result.external_reference, String(paymentId));
                break;
            
            case 'rejected':
            case 'cancelled':
                await prisma.zionPurchase.update({
                    where: { id: purchase.id },
                    data: { 
                        status: result.status === 'rejected' ? 'REJECTED' : 'CANCELLED'
                    }
                });
                console.log(`[WEBHOOK] Payment ${paymentId} ${result.status}: ${result.status_detail}`);
                break;
            
            case 'refunded':
                // Se já foi creditado, precisa reverter
                if (purchase.status === 'COMPLETED') {
                    await prisma.$transaction([
                        prisma.user.update({
                            where: { id: purchase.userId },
                            data: { 
                                zionsCash: { decrement: purchase.amount } // Reverter apenas zionsCash
                            }
                        }),
                        prisma.zionPurchase.update({
                            where: { id: purchase.id },
                            data: { status: 'REFUNDED' }
                        }),
                        prisma.zionHistory.create({
                            data: {
                                userId: purchase.userId,
                                amount: -purchase.amount,
                                reason: `Reembolso de ${purchase.amount} Zions Cash`
                            }
                        })
                    ]);
                    console.log(`[WEBHOOK] ⚠️ Refund processed: ${purchase.amount} Zions removed from user ${purchase.userId}`);
                }
                break;
            
            default:
                // pending, in_process, etc - apenas logar
                console.log(`[WEBHOOK] Payment ${paymentId} status: ${result.status}`);
        }

    } catch (error: any) {
        console.error('[WEBHOOK] Error processing webhook:', error?.message || error);
        // Não retornar erro - já respondemos 200
    }
};

// ===================== PRODUCT PAYMENT PROCESSING =====================

/**
 * Process product payment from webhook
 */
const processProductPayment = async (orderId: string, paymentId: string, status: string, statusDetail?: string | null) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                product: {
                    include: {
                        keys: {
                            where: { isUsed: false },
                            take: 10
                        }
                    }
                }
            }
        });

        if (!order) {
            console.warn(`[WEBHOOK] Product order not found: ${orderId}`);
            return;
        }

        console.log(`[WEBHOOK] Processing product order ${orderId}: status=${status}`);

        switch (status) {
            case 'approved':
                if (order.paymentStatus === 'COMPLETED') {
                    console.log(`[WEBHOOK] Product order ${orderId} already completed`);
                    return;
                }
                await deliverProductKeysWebhook(orderId, order.product, order.quantity, order.buyerId);
                break;

            case 'rejected':
            case 'cancelled':
                await prisma.order.update({
                    where: { id: orderId },
                    data: { paymentStatus: 'FAILED' }
                });
                console.log(`[WEBHOOK] Product order ${orderId} ${status}`);
                break;

            default:
                console.log(`[WEBHOOK] Product order ${orderId} status: ${status}`);
        }
    } catch (error: any) {
        console.error(`[WEBHOOK] Error processing product payment:`, error?.message || error);
    }
};

/**
 * Deliver product keys from webhook (no response needed)
 */
const deliverProductKeysWebhook = async (orderId: string, product: any, quantity: number, userId: string) => {
    // Check if already delivered (idempotency)
    const existingKeys = await prisma.productKey.findMany({
        where: { orderId },
        select: { key: true }
    });

    if (existingKeys.length > 0) {
        console.log(`[WEBHOOK] Product keys already delivered for order ${orderId}`);
        return;
    }

    // Get available keys
    const availableKeys = await prisma.productKey.findMany({
        where: { productId: product.id, isUsed: false },
        take: quantity
    });

    if (availableKeys.length < quantity && !product.isUnlimited) {
        console.error(`[WEBHOOK] Not enough product keys for order ${orderId}`);
        return;
    }

    // Get user for email
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, displayName: true, name: true }
    });

    // Calculate 10% cashback in Points
    const cashbackPoints = Math.floor((product.priceBRL || 0) * quantity * 10);

    // Execute transaction
    await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'COMPLETED' }
        });

        // Mark keys as used
        if (availableKeys.length > 0) {
            await tx.productKey.updateMany({
                where: { id: { in: availableKeys.map(k => k.id) } },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    usedById: userId,
                    orderId: orderId
                }
            });
        }

        // Update stock if not unlimited
        if (!product.isUnlimited) {
            await tx.product.update({
                where: { id: product.id },
                data: { stock: { decrement: quantity } }
            });
        }

        // Add cashback points
        if (cashbackPoints > 0) {
            await tx.user.update({
                where: { id: userId },
                data: { zionsPoints: { increment: cashbackPoints } }
            });

            await tx.zionHistory.create({
                data: {
                    userId,
                    amount: cashbackPoints,
                    reason: `Cashback: ${product.name} (10%)`
                }
            });
        }
    });

    // Send keys via email (lazy import to avoid circular dependency)
    const keys = availableKeys.map(k => k.key);
    if (user?.email && keys.length > 0) {
        try {
            const { sendProductKeysEmail } = await import('../services/emailService');
            await sendProductKeysEmail(
                user.email,
                user.displayName || user.name || 'Cliente',
                product.name,
                keys,
                orderId
            );
        } catch (emailError) {
            console.error('[WEBHOOK] Failed to send product keys email:', emailError);
        }
    }

    console.log(`[WEBHOOK] ✅ Product keys delivered for order ${orderId}: ${keys.length} keys`);
};