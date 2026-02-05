import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';
import crypto from 'crypto';
import https from 'https';

// Packages configuration - valores fixos para evitar manipulação
// Novos valores mais acessíveis e com melhor custo-benefício
const ZION_PACKAGES: Record<number, number> = {
    100: 4.90,      // Pacote inicial - acessível para todos
    250: 9.90,      // Popular - bom custo-benefício
    500: 17.90,     // Entusiasta - 10% de economia
    1000: 29.90,    // Colecionador - 25% de economia
    2500: 59.90,    // Magnata - 40% de economia
};

// Pacotes de recarga de Zions Cash (1:1 com Real)
const CASH_PACKAGES: Record<number, number> = {
    10: 10.00,      // Básico
    25: 25.00,      // Padrão
    50: 50.00,      // Plus
    100: 100.00,    // Premium (5% bônus = 105 cash)
    200: 200.00,    // Elite (10% bônus = 220 cash)
};

// Bônus para pacotes de Cash
const CASH_BONUS: Record<number, number> = {
    10: 0,
    25: 0,
    50: 0,
    100: 5,   // 5% bônus
    200: 20,  // 10% bônus
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

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('[PAYMENT] MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({ error: 'Sistema de pagamento não configurado' });
        }

        // Debug: verificar tipo de credencial
        const isTestToken = accessToken.startsWith('TEST-') || accessToken.includes('test');
        const isAppUser = accessToken.startsWith('APP_USR-');
        console.log(`[PAYMENT] Token type: ${isTestToken ? 'TEST' : isAppUser ? 'PRODUCTION (APP_USR)' : 'UNKNOWN'}`);
        console.log(`[PAYMENT] Token prefix: ${accessToken.substring(0, 15)}...`);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Gerar referência externa única para idempotência
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

        // Usar Orders API que funciona com contas de teste
        // A Payment API não funciona com credenciais de teste para PIX
        
        // Em sandbox, o email PRECISA ser @testuser.com
        // Detectar sandbox pelo token (contas de teste tem APP_USR- mas são sandbox)
        const isSandbox = accessToken.includes('3116392914') || process.env.MERCADOPAGO_TEST_MODE === 'true';
        const payerEmail = isSandbox ? 'test@testuser.com' : (user.email || 'customer@email.com');
        const payerFirstName = user.name?.split(' ')[0] || 'Usuario';
        
        console.log(`[PAYMENT] Mode: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'} - Payer: ${payerFirstName} - Email: ${payerEmail}`);
        
        // Descrições e benefícios por pacote
        const packageDescriptions: Record<number, string> = {
            500: 'Pacote inicial de Zions para customização de perfil e itens exclusivos.',
            1100: 'Pacote intermediário com bônus de 10%. Ideal para desbloquear backgrounds e cores.',
            2500: 'Pacote avançado com 25% de bônus! Libere Theme Packs e conquistas premium.',
            5500: 'Pacote premium com 37% de bônus! Acesso a itens raros e exclusivos.',
            12000: 'Pacote supremo com 50% de bônus! Máximo valor, itens lendários disponíveis.'
        };
        
        // Criar order via API REST diretamente (Orders API)
        const orderData = JSON.stringify({
            type: 'online',
            external_reference: newPurchase.id,
            total_amount: price.toFixed(2),
            description: `${zions.toLocaleString('pt-BR')} Zions - Magazine MGT`,
            payer: {
                email: payerEmail,
                first_name: isSandbox ? 'APRO' : payerFirstName
            },
            transactions: {
                payments: [{
                    amount: price.toFixed(2),
                    payment_method: {
                        id: 'pix',
                        type: 'bank_transfer'
                    }
                }]
            },
            items: [{
                id: `zions-${zions}`,
                title: `${zions.toLocaleString('pt-BR')} Zions - Magazine MGT`,
                description: packageDescriptions[zions] || `Pacote de ${zions} Zions para customização e itens.`,
                picture_url: 'https://magazine-srt.vercel.app/assets/zions/zion-50.png',
                category_id: 'virtual_goods',
                quantity: 1,
                unit_price: price.toFixed(2)
            }]
        });

        const idempotencyKey = `pix-${newPurchase.id}-${Date.now()}`;
        
        const orderResult = await new Promise<any>((resolve, reject) => {
            const options = {
                hostname: 'api.mercadopago.com',
                path: '/v1/orders',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Idempotency-Key': idempotencyKey
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (res.statusCode === 201 || res.statusCode === 200) {
                            resolve(json);
                        } else {
                            console.error(`[PAYMENT] Orders API error: ${res.statusCode}`, JSON.stringify(json, null, 2));
                            reject(new Error(json.message || json.errors?.[0]?.description || json.errors?.[0]?.message || `HTTP ${res.statusCode}`));
                        }
                    } catch (e) {
                        console.error(`[PAYMENT] Failed to parse response:`, body);
                        reject(new Error(`Failed to parse response: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(orderData);
            req.end();
        });

        // Atualizar registro com ID do pagamento
        const paymentData = orderResult.transactions?.payments?.[0];
        await prisma.zionPurchase.update({
            where: { id: newPurchase.id },
            data: { 
                paymentId: orderResult.id || paymentData?.id
            }
        });

        console.log(`[PAYMENT] PIX created successfully - OrderID: ${orderResult.id} - Status: ${orderResult.status}`);

        // Retornar dados do PIX
        const pixInfo = paymentData?.payment_method;
        
        res.json({
            paymentId: orderResult.id,
            purchaseId: newPurchase.id,
            qrCode: pixInfo?.qr_code,
            qrCodeBase64: pixInfo?.qr_code_base64,
            copyPaste: pixInfo?.qr_code,
            ticketUrl: pixInfo?.ticket_url,
            status: orderResult.status,
            expirationDate: orderResult.expiration_time
        });

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

        // Validação rigorosa
        if (!zions || typeof zions !== 'number' || !(zions in CASH_PACKAGES)) {
            console.warn(`[PAYMENT] Invalid cash package attempt: ${zions} by user ${userId}`);
            return res.status(400).json({ error: 'Pacote de Zions Cash inválido' });
        }

        const price = CASH_PACKAGES[zions];
        const bonus = CASH_BONUS[zions] || 0;
        const totalCash = zions + bonus;

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('[PAYMENT] MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({ error: 'Sistema de pagamento não configurado' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Criar registro da compra
        const newPurchase = await prisma.zionPurchase.create({
            data: {
                userId,
                amount: totalCash, // Total com bônus
                price: price,
                status: 'PENDING'
            }
        });

        console.log(`[PAYMENT] Creating Cash PIX: Z$${totalCash} for R$${price} - User: ${userId}`);

        // Em sandbox, o email PRECISA ser @testuser.com
        const isSandbox = accessToken.includes('3116392914') || process.env.MERCADOPAGO_TEST_MODE === 'true';
        const payerEmail = isSandbox ? 'test@testuser.com' : (user.email || 'customer@email.com');
        
        // Criar order via Orders API
        const orderData = JSON.stringify({
            type: 'online',
            external_reference: newPurchase.id,
            total_amount: price.toFixed(2),
            payer: {
                email: payerEmail,
                first_name: 'APRO'
            },
            transactions: {
                payments: [{
                    amount: price.toFixed(2),
                    payment_method: {
                        id: 'pix',
                        type: 'bank_transfer'
                    }
                }]
            }
        });

        const idempotencyKey = `cash-${newPurchase.id}-${Date.now()}`;
        
        const orderResult = await new Promise<any>((resolve, reject) => {
            const options = {
                hostname: 'api.mercadopago.com',
                path: '/v1/orders',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Idempotency-Key': idempotencyKey
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (res.statusCode === 201 || res.statusCode === 200) {
                            resolve(json);
                        } else {
                            console.error(`[PAYMENT] Orders API error: ${res.statusCode}`, JSON.stringify(json, null, 2));
                            reject(new Error(json.message || json.errors?.[0]?.description || json.errors?.[0]?.message || `HTTP ${res.statusCode}`));
                        }
                    } catch (e) {
                        console.error(`[PAYMENT] Failed to parse response:`, body);
                        reject(new Error(`Failed to parse response: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(orderData);
            req.end();
        });

        // Atualizar registro com ID do pagamento
        const paymentData = orderResult.transactions?.payments?.[0];
        await prisma.zionPurchase.update({
            where: { id: newPurchase.id },
            data: { 
                paymentId: orderResult.id || paymentData?.id
            }
        });

        console.log(`[PAYMENT] Cash PIX created - OrderID: ${orderResult.id} - Status: ${orderResult.status}`);

        const pixInfo = paymentData?.payment_method;
        
        res.json({
            paymentId: orderResult.id,
            purchaseId: newPurchase.id,
            qrCode: pixInfo?.qr_code,
            qrCodeBase64: pixInfo?.qr_code_base64,
            copyPaste: pixInfo?.qr_code,
            ticketUrl: pixInfo?.ticket_url,
            status: orderResult.status,
            expirationDate: orderResult.expiration_time,
            cashAmount: totalCash,
            bonus: bonus
        });

    } catch (error: any) {
        console.error('[PAYMENT] Error creating Cash PIX:', error?.message || error);
        res.status(500).json({ error: 'Falha ao criar pagamento PIX' });
    }
};

// Simular confirmação de pagamento (apenas em modo simulação)
export const simulatePaymentConfirmation = async (req: Request, res: Response) => {
    try {
        const { purchaseId } = req.body;
        const userId = (req as any).user?.userId || (req as any).user?.id;

        if (process.env.MERCADOPAGO_SIMULATION_MODE !== 'true') {
            return res.status(403).json({ error: 'Simulação não está habilitada' });
        }

        const purchase = await prisma.zionPurchase.findUnique({
            where: { id: purchaseId },
            include: { user: true }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Compra não encontrada' });
        }

        if (purchase.userId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        if (purchase.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Pagamento já foi confirmado' });
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
        res.status(500).json({ error: 'Falha ao simular confirmação' });
    }
};

// Check payment status
export const checkPaymentStatus = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const userId = (req as any).user?.userId || (req as any).user?.id;
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            return res.status(500).json({ error: 'Sistema de pagamento não configurado' });
        }

        // Buscar a compra pelo paymentId (que na verdade é o orderId)
        const purchase = await prisma.zionPurchase.findFirst({
            where: { paymentId: paymentId },
            include: { user: true }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Compra não encontrada' });
        }

        if (purchase.userId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Se já foi processada, retornar sucesso
        if (purchase.status === 'COMPLETED') {
            return res.json({ 
                status: 'approved',
                statusDetail: 'accredited',
                completed: true,
                zionsAmount: purchase.amount
            });
        }

        // Verificar status no MercadoPago via Orders API
        const orderStatus = await new Promise<any>((resolve, reject) => {
            const options = {
                hostname: 'api.mercadopago.com',
                path: `/v1/orders/${paymentId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        reject(new Error('Failed to parse response'));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });

        console.log(`[PAYMENT] Order ${paymentId} status: ${orderStatus.status}`);

        // Se aprovado, creditar Zions
        if (orderStatus.status === 'processed' || orderStatus.status === 'paid') {
            const paymentData = orderStatus.transactions?.payments?.[0];
            if (paymentData?.status === 'approved' || orderStatus.status === 'processed') {
                await creditZionsFromPayment(purchase.id, paymentId, userId);
                return res.json({ 
                    status: 'approved',
                    statusDetail: 'accredited',
                    completed: true,
                    zionsAmount: purchase.amount
                });
            }
        }

        res.json({ 
            status: orderStatus.status === 'action_required' ? 'pending' : orderStatus.status,
            statusDetail: orderStatus.status_detail || 'waiting_payment',
            completed: false
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

        // Detectar se é Cash ou Points baseado no preço/valor
        // Cash packages: 10, 25, 50, 105 (100+5), 220 (200+20)
        // Points packages: 100, 250, 500, 1000, 2500
        const isCashPurchase = purchase.price === purchase.amount || 
            [10, 25, 50, 100, 200].includes(purchase.price) ||
            purchase.price >= 10 && purchase.amount === purchase.price; // Cash é 1:1

        // Atualizar status e creditar Zions em uma transação
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
            // Registrar no histórico de Zions
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

        console.log(`[PAYMENT] ✅ ${isCashPurchase ? 'Cash' : 'Points'} credited: ${purchase.amount} to user ${purchase.userId} - PaymentID: ${paymentId}`);
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

        // Descrições e benefícios por pacote
        const packageDescriptions: Record<number, string> = {
            500: 'Pacote inicial de Zions para customização de perfil e itens exclusivos.',
            1100: 'Pacote intermediário com bônus de 10%. Ideal para desbloquear backgrounds e cores.',
            2500: 'Pacote avançado com 25% de bônus! Libere Theme Packs e conquistas premium.',
            5500: 'Pacote premium com 37% de bônus! Acesso a itens raros e exclusivos.',
            12000: 'Pacote supremo com 50% de bônus! Máximo valor, itens lendários disponíveis.'
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
                                reason: `Reembolso de ${purchase.amount} Zions Cash`,
                                currency: 'CASH'
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

    console.log(`[WEBHOOK] ✅ Product keys delivered for order ${orderId}: ${keys.length} keys`);
};