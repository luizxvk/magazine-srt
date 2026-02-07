import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';
import crypto from 'crypto';
import https from 'https';

// Packages configuration - valores fixos para evitar manipulaÃ§Ã£o
// Novos valores mais acessÃ­veis e com melhor custo-benefÃ­cio
const ZION_PACKAGES: Record<number, number> = {
    100: 4.90,      // Pacote inicial - acessÃ­vel para todos
    250: 9.90,      // Popular - bom custo-benefÃ­cio
    500: 17.90,     // Entusiasta - 10% de economia
    1000: 29.90,    // Colecionador - 25% de economia
    2500: 59.90,    // Magnata - 40% de economia
};

// Pacotes de recarga de Zions Cash (com margem de lucro)
// UsuÃ¡rio paga R$ X e recebe Z$ Y (onde Y < X para gerar margem)
const CASH_PACKAGES: Record<number, number> = {
    12: 15.00,      // Z$12 por R$15 (20% margem)
    25: 30.00,      // Z$25 por R$30 (16% margem)
    50: 60.00,      // Z$50 por R$60 (16% margem)
    110: 130.00,    // Z$110 por R$130 + bÃ´nus (15% margem)
    225: 260.00,    // Z$225 por R$260 + bÃ´nus (13% margem)
};

// BÃ´nus para pacotes de Cash (incentiva compras maiores)
const CASH_BONUS: Record<number, number> = {
    12: 0,
    25: 0,
    50: 0,
    110: 5,   // +Z$5 bÃ´nus = Z$115 total
    225: 15,  // +Z$15 bÃ´nus = Z$240 total
};

// Helper para verificar se o pacote Ã© vÃ¡lido
const isValidPackage = (zions: number): boolean => {
    return zions in ZION_PACKAGES;
};

// Helper para gerar referÃªncia externa Ãºnica
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

        // ValidaÃ§Ã£o rigorosa
        if (!zions || typeof zions !== 'number' || !isValidPackage(zions)) {
            console.warn(`[PAYMENT] Invalid package attempt: ${zions} by user ${userId}`);
            return res.status(400).json({ error: 'Pacote de Zions invÃ¡lido' });
        }

        // PreÃ§o fixo do servidor - NUNCA confie no cliente
        const price = ZION_PACKAGES[zions];

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('[PAYMENT] MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({ error: 'Sistema de pagamento nÃ£o configurado' });
        }

        // Debug: verificar tipo de credencial
        const isTestToken = accessToken.startsWith('TEST-') || accessToken.includes('test');
        const isAppUser = accessToken.startsWith('APP_USR-');
        console.log(`[PAYMENT] Token type: ${isTestToken ? 'TEST' : isAppUser ? 'PRODUCTION (APP_USR)' : 'UNKNOWN'}`);
        console.log(`[PAYMENT] Token prefix: ${accessToken.substring(0, 15)}...`);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });
        }

        // Gerar referÃªncia externa Ãºnica para idempotÃªncia
        const externalRef = generateExternalRef(userId, zions);

        const client = new MercadoPagoConfig({ accessToken });
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

        // Usar Payment API para PIX (documentaÃ§Ã£o oficial do MercadoPago)
        const payerEmail = user.email || 'customer@email.com';
        const payerFirstName = user.name?.split(' ')[0] || 'Usuario';
        const payerLastName = user.name?.split(' ').slice(1).join(' ') || 'Usuario';
        
        console.log(`[PAYMENT] Mode: PRODUCTION - Payer: ${payerFirstName} ${payerLastName} - Email: ${payerEmail}`);
        
        // DescriÃ§Ãµes por pacote
        const packageDescriptions: Record<number, string> = {
            100: 'Pacote de 100 Zions - Magazine MGT',
            500: 'Pacote de 500 Zions - Magazine MGT',
            1100: 'Pacote de 1.100 Zions com bÃ´nus - Magazine MGT',
            2500: 'Pacote de 2.500 Zions com 25% bÃ´nus - Magazine MGT',
            5500: 'Pacote de 5.500 Zions com 37% bÃ´nus - Magazine MGT',
            12000: 'Pacote de 12.000 Zions com 50% bÃ´nus - Magazine MGT'
        };

        const idempotencyKey = `pix-${newPurchase.id}-${Date.now()}`;
        
        // URL de webhook para receber notificaÃ§Ãµes
        const webhookUrl = `${process.env.BACKEND_URL || 'https://magazine-srt-react-server.vercel.app'}/api/payments/webhook`;
        
        try {
            // Criar pagamento PIX usando SDK oficial do MercadoPago
            const paymentResult = await payment.create({
                body: {
                    transaction_amount: price,
                    description: packageDescriptions[zions] || `${zions} Zions - Magazine MGT`,
                    payment_method_id: 'pix',
                    payer: {
                        email: payerEmail,
                        first_name: payerFirstName,
                        last_name: payerLastName
                    },
                    external_reference: newPurchase.id,
                    notification_url: webhookUrl
                },
                requestOptions: {
                    idempotencyKey
                }
            });

            // Atualizar registro com ID do pagamento
            await prisma.zionPurchase.update({
                where: { id: newPurchase.id },
                data: { 
                    paymentId: paymentResult.id?.toString()
                }
            });

            console.log(`[PAYMENT] PIX created successfully - PaymentID: ${paymentResult.id} - Status: ${paymentResult.status}`);

            // Retornar dados do PIX
            const pixData = paymentResult.point_of_interaction?.transaction_data;
            
            res.json({
                paymentId: paymentResult.id,
                purchaseId: newPurchase.id,
                qrCode: pixData?.qr_code,
                qrCodeBase64: pixData?.qr_code_base64,
                copyPaste: pixData?.qr_code,
                ticketUrl: pixData?.ticket_url,
                status: paymentResult.status,
                expirationDate: paymentResult.date_of_expiration
            });
        } catch (paymentError: any) {
            console.error('[PAYMENT] Error creating PIX payment:', paymentError.message || paymentError);
            
            // Marcar compra como falha
            await prisma.zionPurchase.update({
                where: { id: newPurchase.id },
                data: { status: 'REJECTED' }
            });
            
            return res.status(500).json({ 
                error: 'Erro ao criar pagamento PIX', 
                details: paymentError.message 
            });
        }

    } catch (error: any) {
        console.error('[PAYMENT] Error creating PIX payment:', error?.message || error);
        res.status(500).json({ error: 'Falha ao criar pagamento PIX' });
    }
};

// Create PIX payment for Zions Cash (1:1 with Real)
export const createCashPixPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        const { zions } = req.body;

        // ValidaÃ§Ã£o rigorosa
        if (!zions || typeof zions !== 'number' || !(zions in CASH_PACKAGES)) {
            console.warn(`[PAYMENT] Invalid cash package attempt: ${zions} by user ${userId}`);
            return res.status(400).json({ error: 'Pacote de Zions Cash invÃ¡lido' });
        }

        const price = CASH_PACKAGES[zions];
        const bonus = CASH_BONUS[zions] || 0;
        const totalCash = zions + bonus;

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('[PAYMENT] MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({ error: 'Sistema de pagamento nÃ£o configurado' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });
        }

        const client = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(client);

        // Criar registro da compra
        const newPurchase = await prisma.zionPurchase.create({
            data: {
                userId,
                amount: totalCash, // Total com bÃ´nus
                price: price,
                status: 'PENDING'
            }
        });

        console.log(`[PAYMENT] Creating Cash PIX: Z$${totalCash} for R$${price} - User: ${userId}`);

        const payerEmail = user.email || 'customer@email.com';
        const payerFirstName = user.name?.split(' ')[0] || 'Usuario';
        const payerLastName = user.name?.split(' ').slice(1).join(' ') || 'Usuario';
        
        const idempotencyKey = `cash-${newPurchase.id}-${Date.now()}`;

        // DescriÃ§Ã£o do pacote
        const description = bonus > 0 
            ? `Z$${zions} + Z$${bonus} bÃ´nus Zions Cash - Magazine MGT`
            : `Z$${zions} Zions Cash - Magazine MGT`;
        
        // URL de webhook para receber notificaÃ§Ãµes
        const webhookUrl = `${process.env.BACKEND_URL || 'https://magazine-srt-react-server.vercel.app'}/api/payments/webhook`;
        
        try {
            // Criar pagamento PIX usando SDK oficial
            const paymentResult = await payment.create({
                body: {
                    transaction_amount: price,
                    description: description,
                    payment_method_id: 'pix',
                    payer: {
                        email: payerEmail,
                        first_name: payerFirstName,
                        last_name: payerLastName
                    },
                    external_reference: newPurchase.id,
                    notification_url: webhookUrl
                },
                requestOptions: {
                    idempotencyKey
                }
            });

            // Atualizar registro com ID do pagamento
            await prisma.zionPurchase.update({
                where: { id: newPurchase.id },
                data: { 
                    paymentId: paymentResult.id?.toString()
                }
            });

            console.log(`[PAYMENT] Cash PIX created - PaymentID: ${paymentResult.id} - Status: ${paymentResult.status}`);

            const pixData = paymentResult.point_of_interaction?.transaction_data;
            
            res.json({
                paymentId: paymentResult.id,
                purchaseId: newPurchase.id,
                qrCode: pixData?.qr_code,
                qrCodeBase64: pixData?.qr_code_base64,
                copyPaste: pixData?.qr_code,
                ticketUrl: pixData?.ticket_url,
                status: paymentResult.status,
                expirationDate: paymentResult.date_of_expiration,
                cashAmount: totalCash,
                bonus: bonus
            });
        } catch (paymentError: any) {
            console.error('[PAYMENT] Error creating Cash PIX:', paymentError.message || paymentError);
            
            // Marcar compra como falha
            await prisma.zionPurchase.update({
                where: { id: newPurchase.id },
                data: { status: 'REJECTED' }
            });
            
            return res.status(500).json({ 
                error: 'Erro ao criar pagamento PIX', 
                details: paymentError.message 
            });
        }

    } catch (error: any) {
        console.error('[PAYMENT] Error creating Cash PIX:', error?.message || error);
        res.status(500).json({ error: 'Falha ao criar pagamento PIX' });
    }
};

// Simular confirmaÃ§Ã£o de pagamento (apenas em modo simulaÃ§Ã£o)
export const simulatePaymentConfirmation = async (req: Request, res: Response) => {
    try {
        const { purchaseId } = req.body;
        const userId = (req as any).user?.userId || (req as any).user?.id;

        if (process.env.MERCADOPAGO_SIMULATION_MODE !== 'true') {
            return res.status(403).json({ error: 'SimulaÃ§Ã£o nÃ£o estÃ¡ habilitada' });
        }

        const purchase = await prisma.zionPurchase.findUnique({
            where: { id: purchaseId },
            include: { user: true }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Compra nÃ£o encontrada' });
        }

        if (purchase.userId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        if (purchase.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Pagamento jÃ¡ foi confirmado' });
        }

        // Creditar Zions
        await prisma.$transaction([
            prisma.zionPurchase.update({
                where: { id: purchaseId },
                data: { status: 'COMPLETED' }
            }),
            prisma.user.update({
                where: { id: purchase.userId },
                data: { zionsPoints: { increment: purchase.amount } }
            })
        ]);

        console.log(`[PAYMENT] SIMULATION: Credited ${purchase.amount} Zions to user ${purchase.userId}`);

        res.json({ 
            success: true, 
            message: `${purchase.amount} Zions creditados com sucesso!`,
            newBalance: (purchase.user.zionsPoints || 0) + purchase.amount
        });

    } catch (error: any) {
        console.error('[PAYMENT] Error simulating payment:', error?.message || error);
        res.status(500).json({ error: 'Falha ao simular confirmaÃ§Ã£o' });
    }
};

// Check payment status
export const checkPaymentStatus = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const userId = (req as any).user?.userId || (req as any).user?.id;
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            return res.status(500).json({ error: 'Sistema de pagamento nÃ£o configurado' });
        }

        // Buscar a compra pelo paymentId
        const purchase = await prisma.zionPurchase.findFirst({
            where: { paymentId: paymentId },
            include: { user: true }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Compra nÃ£o encontrada' });
        }

        if (purchase.userId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Se jÃ¡ foi processada, retornar sucesso
        if (purchase.status === 'COMPLETED') {
            return res.json({ 
                status: 'approved',
                statusDetail: 'accredited',
                completed: true,
                zionsAmount: purchase.amount
            });
        }

        // Verificar status no MercadoPago via Payment API
        const client = new MercadoPagoConfig({ accessToken });
        const payment = new Payment(client);
        
        const paymentResult = await payment.get({ id: Number(paymentId) });

        console.log(`[PAYMENT] Payment ${paymentId} status: ${paymentResult.status}`);

        // Se aprovado, creditar Zions
        if (paymentResult.status === 'approved') {
            await creditZionsFromPayment(purchase.id, paymentId, userId);
            return res.json({ 
                status: 'approved',
                statusDetail: paymentResult.status_detail || 'accredited',
                completed: true,
                zionsAmount: purchase.amount
            });
        }

        res.json({ 
            status: paymentResult.status || 'pending',
            statusDetail: paymentResult.status_detail || 'waiting_payment',
            completed: false
        });

    } catch (error: any) {
        console.error('[PAYMENT] Error checking payment:', error?.message || error);
        res.status(500).json({ error: 'Falha ao verificar status do pagamento' });
    }
};

// Helper para creditar Zions de forma segura (evita duplicaÃ§Ã£o)
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

        // VerificaÃ§Ã£o de seguranÃ§a - usuÃ¡rio sÃ³ pode verificar suas prÃ³prias compras
        if (requestingUserId && purchase.userId !== requestingUserId) {
            console.warn(`[PAYMENT] User ${requestingUserId} tried to access purchase of user ${purchase.userId}`);
            return false;
        }

        // JÃ¡ foi processado? (idempotÃªncia)
        if (purchase.status === 'COMPLETED') {
            console.log(`[PAYMENT] Purchase already completed: ${purchaseId}`);
            return true; // JÃ¡ processado, nÃ£o Ã© erro
        }

        // Detectar se Ã© Cash ou Points baseado no preÃ§o/valor
        // Cash packages: 10, 25, 50, 105 (100+5), 220 (200+20)
        // Points packages: 100, 250, 500, 1000, 2500
        const isCashPurchase = purchase.price === purchase.amount || 
            [10, 25, 50, 100, 200].includes(purchase.price) ||
            purchase.price >= 10 && purchase.amount === purchase.price; // Cash Ã© 1:1

        // Atualizar status e creditar Zions em uma transaÃ§Ã£o
        await prisma.$transaction([
            prisma.user.update({
                where: { id: purchase.userId },
                data: isCashPurchase ? { 
                    zionsCash: { increment: purchase.amount } // Creditar em zionsCash
                } : { 
                    zionsPoints: { increment: purchase.amount } // Creditar em zionsPoints
                }
            }),
            prisma.zionPurchase.update({
                where: { id: purchase.id },
                data: { 
                    status: 'COMPLETED',
                    paymentId: paymentId
                }
            }),
            // Registrar no histÃ³rico de Zions
            prisma.zionHistory.create({
                data: {
                    userId: purchase.userId,
                    amount: purchase.amount,
                    reason: isCashPurchase 
                        ? `Recarga de Z$${purchase.amount} Zions Cash por R$${purchase.price.toFixed(2)}`
                        : `Compra de ${purchase.amount} Zions Points por R$${purchase.price.toFixed(2)}`,
                    currency: isCashPurchase ? 'CASH' : 'POINTS'
                }
            })
        ]);

        console.log(`[PAYMENT] âœ… ${isCashPurchase ? 'Cash' : 'Points'} credited: ${purchase.amount} to user ${purchase.userId} - PaymentID: ${paymentId}`);
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

        // DescriÃ§Ãµes e benefÃ­cios por pacote
        const packageDescriptions: Record<number, string> = {
            500: 'Pacote inicial de Zions para customizaÃ§Ã£o de perfil e itens exclusivos.',
            1100: 'Pacote intermediÃ¡rio com bÃ´nus de 10%. Ideal para desbloquear backgrounds e cores.',
            2500: 'Pacote avanÃ§ado com 25% de bÃ´nus! Libere Theme Packs e conquistas premium.',
            5500: 'Pacote premium com 37% de bÃ´nus! Acesso a itens raros e exclusivos.',
            12000: 'Pacote supremo com 50% de bÃ´nus! MÃ¡ximo valor, itens lendÃ¡rios disponÃ­veis.'
        };

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: `zions-${zions}`,
                        title: `${zions.toLocaleString('pt-BR')} Zions - Magazine MGT`,
                        description: packageDescriptions[zions] || `Pacote de ${zions} Zions para a plataforma Magazine MGT. Use para customizar seu perfil, comprar itens na loja e participar do marketplace.`,
                        picture_url: 'https://magazine-srt.vercel.app/assets/zions/zion-50.png',
                        category_id: 'virtual_goods',
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'BRL'
                    }
                ],
                payer: {
                    email: (req as any).user.email
                },
                external_reference: newPurchase.id,
                statement_descriptor: 'MAGAZINE MGT',
                back_urls: {
                    success: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://magazine-srt.vercel.app'}/profile?payment=success`,
                    failure: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://magazine-srt.vercel.app'}/profile?payment=failure`,
                    pending: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://magazine-srt.vercel.app'}/profile?payment=pending`
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
        // Responder imediatamente ao Mercado Pago (ele espera resposta rÃ¡pida)
        res.status(200).send('OK');

        const { type, data, action } = req.body;
        
        console.log(`[WEBHOOK] Received: type=${type}, action=${action}, data=${JSON.stringify(data)}`);

        // Processar apenas notificaÃ§Ãµes de pagamento
        if (type !== 'payment' || !data?.id) {
            console.log('[WEBHOOK] Ignoring non-payment notification');
            return;
        }

        const paymentId = data.id;

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.error('[WEBHOOK] MERCADOPAGO_ACCESS_TOKEN not configured');
            return;
        }

        // Buscar detalhes do pagamento no Mercado Pago (verificaÃ§Ã£o de autenticidade)
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
                // Se jÃ¡ foi creditado, precisa reverter
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
                                reason: `Reembolso de ${purchase.amount} Zions Cash`,
                                currency: 'CASH'
                            }
                        })
                    ]);
                    console.log(`[WEBHOOK] âš ï¸ Refund processed: ${purchase.amount} Zions removed from user ${purchase.userId}`);
                }
                break;
            
            default:
                // pending, in_process, etc - apenas logar
                console.log(`[WEBHOOK] Payment ${paymentId} status: ${result.status}`);
        }

    } catch (error: any) {
        console.error('[WEBHOOK] Error processing webhook:', error?.message || error);
        // NÃ£o retornar erro - jÃ¡ respondemos 200
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
                    reason: `Cashback: ${product.name} (10%)`,
                    currency: 'POINTS'
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

    console.log(`[WEBHOOK] âœ… Product keys delivered for order ${orderId}: ${keys.length} keys`);
};

// ============ PRODUTO - PAGAMENTO BRL VIA MERCADOPAGO ============
export const createProductPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        const { productId, quantity, paymentType } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ error: 'productId e quantity sÃ£o obrigatÃ³rios' });
        }

        // Buscar produto
        const product = await prisma.product.findUnique({
            where: { id: productId, isActive: true }
        });

        if (!product) {
            return res.status(404).json({ error: 'Produto nÃ£o encontrado' });
        }

        if (!product.priceBRL) {
            return res.status(400).json({ error: 'Este produto nÃ£o aceita pagamento em BRL' });
        }

        // Verificar estoque
        if (!product.isUnlimited) {
            const availableKeys = await prisma.productKey.count({
                where: { productId, isUsed: false }
            });
            if (availableKeys < quantity) {
                return res.status(400).json({ error: 'Estoque insuficiente' });
            }
        }

        // Verificar desconto Magazine
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { membershipType: true, email: true, name: true }
        });
        
        const hasDiscount = product.magazineDiscount && user?.membershipType === 'MAGAZINE';
        const unitPrice = hasDiscount ? Number((product.priceBRL * 0.9).toFixed(2)) : product.priceBRL;
        const totalPrice = Number((unitPrice * quantity).toFixed(2));

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('[PRODUCT_PAYMENT] MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({ error: 'Sistema de pagamento nÃ£o configurado' });
        }

        // Modo simulaÃ§Ã£o (dev)
        const isSimulationMode = process.env.MERCADOPAGO_SIMULATION_MODE === 'true';
        
        if (isSimulationMode) {
            // Criar pedido pendente
            const order = await prisma.order.create({
                data: {
                    buyerId: userId,
                    productId,
                    quantity,
                    totalBRL: totalPrice,
                    paymentMethod: 'MERCADO_PAGO',
                    paymentStatus: 'PENDING',
                    paymentId: `SIM_${Date.now()}`
                }
            });

            return res.json({
                simulation: true,
                message: 'Modo simulaÃ§Ã£o ativo - pagamento simulado',
                orderId: order.id,
                init_point: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/store?payment=simulate&orderId=${order.id}`,
                total: totalPrice
            });
        }

        // Criar preferÃªncia no MercadoPago
        const client = new MercadoPagoConfig({ accessToken });
        const preference = new Preference(client);
        
        const webhookUrl = `${process.env.BACKEND_URL || process.env.SERVER_URL || 'https://magazine-srt-react-server.vercel.app'}/api/payments/webhook/product`;
        const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app';

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: productId,
                        title: product.name,
                        description: product.description?.substring(0, 200) || '',
                        quantity: quantity,
                        unit_price: unitPrice,
                        currency_id: 'BRL'
                    }
                ],
                payer: {
                    email: user?.email || '',
                    name: user?.name || ''
                },
                payment_methods: {
                    excluded_payment_types: [],
                    installments: 12
                },
                back_urls: {
                    success: `${clientUrl}/store?payment=success`,
                    failure: `${clientUrl}/store?payment=failure`,
                    pending: `${clientUrl}/store?payment=pending`
                },
                notification_url: webhookUrl,
                auto_return: 'approved',
                external_reference: JSON.stringify({ userId, productId, quantity }),
                statement_descriptor: 'MAGAZINE SRT'
            }
        });

        // Criar pedido pendente
        const order = await prisma.order.create({
            data: {
                buyerId: userId,
                productId,
                quantity,
                totalBRL: totalPrice,
                paymentMethod: 'MERCADO_PAGO',
                paymentStatus: 'PENDING',
                paymentId: result.id
            }
        });

        console.log(`[PRODUCT_PAYMENT] Created preference ${result.id} for order ${order.id}`);

        res.json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point,
            orderId: order.id,
            total: totalPrice
        });

    } catch (error: any) {
        console.error('[PRODUCT_PAYMENT] Error creating product preference:', error?.message || error);
        res.status(500).json({ error: 'Erro ao criar preferÃªncia de pagamento' });
    }
};

// Simular pagamento aprovado (DEV)
export const simulateProductPayment = async (req: Request, res: Response) => {
    const isSimulationMode = process.env.MERCADOPAGO_SIMULATION_MODE === 'true';
    if (!isSimulationMode) {
        return res.status(403).json({ error: 'SimulaÃ§Ã£o nÃ£o disponÃ­vel em produÃ§Ã£o' });
    }

    try {
        const { orderId } = req.body;
        const userId = (req as any).user?.userId || (req as any).user?.id;

        const order = await prisma.order.findFirst({
            where: { id: orderId, buyerId: userId, paymentStatus: 'PENDING' },
            include: { product: true }
        });

        if (!order) {
            return res.status(404).json({ error: 'Pedido nÃ£o encontrado' });
        }

        // Entregar keys
        if (!order.product.isUnlimited) {
            const keys = await prisma.productKey.findMany({
                where: { productId: order.productId, isUsed: false },
                take: order.quantity
            });

            for (const key of keys) {
                await prisma.productKey.update({
                    where: { id: key.id },
                    data: { isUsed: true, orderId: order.id }
                });
            }
        }

        // Atualizar para aprovado
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'COMPLETED' }
        });

        // Notificar usuÃ¡rio
        await prisma.notification.create({
            data: {
                userId,
                type: 'SYSTEM',
                content: `Sua compra de ${order.product.name} foi confirmada! ðŸŽ‰`
            }
        });

        res.json({ success: true, message: 'Pagamento simulado com sucesso!' });
    } catch (error: any) {
        console.error('[SIMULATE_PAYMENT] Error:', error?.message || error);
        res.status(500).json({ error: 'Erro ao simular pagamento' });
    }
};

// Webhook para pagamentos de produtos
export const handleProductWebhook = async (req: Request, res: Response) => {
    try {
        const { type, data } = req.body;

        console.log('[PRODUCT_WEBHOOK] Received:', { type, data });

        if (type === 'payment') {
            const paymentId = data?.id;
            
            if (!paymentId) {
                return res.sendStatus(200);
            }

            const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!accessToken) {
                console.error('[PRODUCT_WEBHOOK] No access token');
                return res.sendStatus(200);
            }

            // Buscar detalhes do pagamento
            const client = new MercadoPagoConfig({ accessToken });
            const paymentClient = new Payment(client);
            const payment = await paymentClient.get({ id: paymentId });

            console.log('[PRODUCT_WEBHOOK] Payment status:', payment.status);

            if (payment.status === 'approved') {
                const externalRef = payment.external_reference;
                if (!externalRef) {
                    console.error('[PRODUCT_WEBHOOK] No external reference');
                    return res.sendStatus(200);
                }

                const { userId, productId, quantity } = JSON.parse(externalRef);

                // Buscar pedido pendente
                const order = await prisma.order.findFirst({
                    where: {
                        buyerId: userId,
                        productId,
                        paymentStatus: 'PENDING'
                    },
                    include: { product: true }
                });

                if (!order) {
                    console.error('[PRODUCT_WEBHOOK] Order not found');
                    return res.sendStatus(200);
                }

                // Entregar keys
                if (!order.product.isUnlimited) {
                    const keys = await prisma.productKey.findMany({
                        where: { productId, isUsed: false },
                        take: quantity
                    });

                    for (const key of keys) {
                        await prisma.productKey.update({
                            where: { id: key.id },
                            data: { isUsed: true, orderId: order.id }
                        });
                    }
                }

                // Atualizar pedido para aprovado
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'COMPLETED',
                        paymentId: String(paymentId)
                    }
                });

                // Notificar usuÃ¡rio
                await prisma.notification.create({
                    data: {
                        userId,
                        type: 'SYSTEM',
                        content: `Sua compra de ${order.product.name} foi confirmada! ðŸŽ‰`
                    }
                });

                console.log(`[PRODUCT_WEBHOOK] âœ… Order ${order.id} completed`);

                // Enviar email com keys
                const user = await prisma.user.findUnique({ where: { id: userId } });
                const deliveredKeys = await prisma.productKey.findMany({ 
                    where: { orderId: order.id } 
                });
                
                if (user?.email && deliveredKeys.length > 0) {
                    try {
                        const { sendProductKeysEmail } = await import('../services/emailService');
                        await sendProductKeysEmail(
                            user.email,
                            user.displayName || user.name || 'Cliente',
                            order.product.name,
                            deliveredKeys.map(k => k.key),
                            order.id
                        );
                    } catch (emailError) {
                        console.error('[PRODUCT_WEBHOOK] Failed to send email:', emailError);
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error: any) {
        console.error('[PRODUCT_WEBHOOK] Error:', error?.message || error);
        res.sendStatus(200); // Sempre retornar 200
    }
};
