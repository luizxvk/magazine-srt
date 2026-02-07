import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/authMiddleware';
import { ELITE_PRICES, ELITE_BENEFITS } from '../controllers/subscriptionController';

const router = Router();

// Initialize Mercado Pago with Access Token
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || ''
});

const isSimulationMode = process.env.MERCADOPAGO_SIMULATION_MODE === 'true';

// Duração em dias
const PLAN_DURATION_DAYS: Record<string, number> = {
    MONTHLY: 30,
    QUARTERLY: 90,
    YEARLY: 365,
    LIFETIME: 36500 // ~100 anos
};

// ============ PLANOS MGT (existente) ============
router.post('/create-preference', async (req, res) => {
    try {
        const { title, price, planId } = req.body;

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: planId,
                        title: title,
                        quantity: 1,
                        unit_price: Number(price)
                    }
                ],
                back_urls: {
                    success: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/mgt-log?status=success`,
                    failure: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/mgt-log?status=failure`,
                    pending: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/mgt-log?status=pending`
                },
                auto_return: 'approved',
            }
        });

        res.json({
            id: result.id,
            init_point: result.init_point
        });

    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: 'Failed to create preference' });
    }
});

// ============ ELITE - ASSINATURA MERCADO PAGO ============
router.post('/elite/create-preference', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const { planType } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Usuário não autenticado' });
            return;
        }

        // Validar plano
        if (!['MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'].includes(planType)) {
            res.status(400).json({ error: 'Plano inválido' });
            return;
        }

        // Verificar se já tem assinatura ativa
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                email: true, 
                isElite: true, 
                eliteUntil: true 
            }
        });

        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        const now = new Date();
        if (user.isElite && user.eliteUntil && user.eliteUntil > now) {
            res.status(400).json({ 
                error: 'Você já possui uma assinatura ELITE ativa',
                eliteUntil: user.eliteUntil
            });
            return;
        }

        const price = ELITE_PRICES[planType as keyof typeof ELITE_PRICES];
        const planNames: Record<string, string> = {
            MONTHLY: 'Mensal',
            QUARTERLY: 'Trimestral', 
            YEARLY: 'Anual',
            LIFETIME: 'Vitalício'
        };

        const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app';
        const serverUrl = process.env.SERVER_URL || 'https://magazine-srt-react-server.vercel.app';

        // Modo simulação (dev)
        if (isSimulationMode) {
            // Simular pagamento imediato
            const durationDays = PLAN_DURATION_DAYS[planType];
            const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            // Criar assinatura
            await prisma.subscription.create({
                data: {
                    userId,
                    status: 'ACTIVE',
                    planType: planType as any,
                    priceAtPurchase: price,
                    paymentProvider: 'mercadopago',
                    externalId: `SIM_ELITE_${Date.now()}`,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd
                }
            });

            // Atualizar usuário
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { eliteSince: true, eliteStreak: true }
            });

            await prisma.user.update({
                where: { id: userId },
                data: {
                    isElite: true,
                    eliteUntil: periodEnd,
                    eliteSince: existingUser?.eliteSince || now,
                    eliteStreak: (existingUser?.eliteStreak || 0) + 1,
                    zionsPoints: { increment: ELITE_BENEFITS.monthlyZions }
                }
            });

            await prisma.zionHistory.create({
                data: {
                    userId,
                    amount: ELITE_BENEFITS.monthlyZions,
                    reason: 'Bônus mensal ELITE',
                    currency: 'POINTS'
                }
            });

            await prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM',
                    content: 'Bem-vindo ao ELITE! 🎉 Seus benefícios já estão ativos.'
                }
            });

            res.json({
                simulation: true,
                success: true,
                message: 'Assinatura ELITE ativada (modo simulação)',
                eliteUntil: periodEnd,
                init_point: `${clientUrl}/elite?status=success`
            });
            return;
        }

        // Criar preferência no Mercado Pago
        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: `elite_${planType.toLowerCase()}`,
                        title: `MGT ELITE - Plano ${planNames[planType]}`,
                        description: 'Assinatura MGT ELITE com benefícios exclusivos: XP em dobro, 500 Zions/mês, desconto na loja e mais.',
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'BRL'
                    }
                ],
                payer: {
                    email: user.email || 'test_user@test.com'
                },
                payment_methods: {
                    default_payment_method_id: 'pix',
                    excluded_payment_methods: [],
                    excluded_payment_types: [],
                    installments: planType === 'LIFETIME' ? 12 : (planType === 'YEARLY' ? 6 : 1)
                },
                back_urls: {
                    success: `${clientUrl}/elite?status=success&plan=${planType.toLowerCase()}`,
                    failure: `${clientUrl}/elite?status=failure`,
                    pending: `${clientUrl}/elite?status=pending`
                },
                notification_url: `${serverUrl}/api/payment/elite/webhook`,
                auto_return: 'approved',
                external_reference: JSON.stringify({ 
                    type: 'elite_subscription',
                    userId, 
                    planType,
                    price
                }),
                statement_descriptor: 'MGT ELITE',
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
            }
        });

        console.log('[ELITE] Preference created:', result.id);

        // Use sandbox_init_point for test tokens
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
        const isTestToken = accessToken.includes('TEST') || accessToken.startsWith('TEST');
        const checkoutUrl = isTestToken ? (result.sandbox_init_point || result.init_point) : result.init_point;

        res.json({
            id: result.id,
            init_point: checkoutUrl,
            sandbox_init_point: result.sandbox_init_point,
            planType,
            price
        });

    } catch (error) {
        console.error('[ELITE] Error creating preference:', error);
        res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
    }
});

// ============ WEBHOOK ELITE ============
router.post('/elite/webhook', async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, data } = req.body;

        console.log('[ELITE WEBHOOK] Received:', { type, data });

        if (type === 'payment') {
            const paymentId = data?.id;
            
            if (!paymentId) {
                res.sendStatus(200);
                return;
            }

            // Buscar detalhes do pagamento
            const paymentClient = new Payment(client);
            const payment = await paymentClient.get({ id: paymentId });

            console.log('[ELITE WEBHOOK] Payment details:', payment.status, payment.external_reference);

            if (payment.status === 'approved') {
                const externalRef = payment.external_reference;
                if (!externalRef) {
                    console.error('[ELITE WEBHOOK] No external reference');
                    res.sendStatus(200);
                    return;
                }

                let parsed;
                try {
                    parsed = JSON.parse(externalRef);
                } catch {
                    console.error('[ELITE WEBHOOK] Invalid external reference:', externalRef);
                    res.sendStatus(200);
                    return;
                }

                // Verificar se é uma assinatura Elite
                if (parsed.type !== 'elite_subscription') {
                    console.log('[ELITE WEBHOOK] Not an elite subscription, ignoring');
                    res.sendStatus(200);
                    return;
                }

                const { userId, planType, price } = parsed;

                // Verificar se já processou (idempotência)
                const existingSubscription = await prisma.subscription.findFirst({
                    where: { externalId: String(paymentId) }
                });

                if (existingSubscription) {
                    console.log('[ELITE WEBHOOK] Already processed:', paymentId);
                    res.sendStatus(200);
                    return;
                }

                const now = new Date();
                const durationDays = PLAN_DURATION_DAYS[planType] || 30;
                const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

                // Criar assinatura
                await prisma.subscription.create({
                    data: {
                        userId,
                        status: 'ACTIVE',
                        planType: planType as any,
                        priceAtPurchase: price,
                        paymentProvider: 'mercadopago',
                        externalId: String(paymentId),
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd
                    }
                });

                // Atualizar usuário
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { eliteSince: true, eliteStreak: true }
                });

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isElite: true,
                        eliteUntil: periodEnd,
                        eliteSince: user?.eliteSince || now,
                        eliteStreak: (user?.eliteStreak || 0) + 1,
                        zionsPoints: { increment: ELITE_BENEFITS.monthlyZions }
                    }
                });

                // Registrar bônus de Zions
                await prisma.zionHistory.create({
                    data: {
                        userId,
                        amount: ELITE_BENEFITS.monthlyZions,
                        reason: 'Bônus mensal ELITE',
                        currency: 'POINTS'
                    }
                });

                // Notificar usuário
                await prisma.notification.create({
                    data: {
                        userId,
                        type: 'SYSTEM',
                        content: 'Bem-vindo ao ELITE! 🎉 Seus benefícios já estão ativos.'
                    }
                });

                console.log('[ELITE WEBHOOK] Subscription activated for user:', userId);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('[ELITE WEBHOOK] Error:', error);
        res.sendStatus(200); // Sempre retornar 200 para evitar retentativas
    }
});

// ============ PRODUTOS - PAGAMENTO BRL ============
router.post('/product/create-preference', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const { productId, quantity, paymentType } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Usuário não autenticado' });
            return;
        }

        if (!productId || !quantity) {
            res.status(400).json({ error: 'productId e quantity são obrigatórios' });
            return;
        }

        // Buscar produto
        const product = await prisma.product.findUnique({
            where: { id: productId, isActive: true }
        });

        if (!product) {
            res.status(404).json({ error: 'Produto nÃ£o encontrado' });
            return;
        }

        if (!product.priceBRL) {
            res.status(400).json({ error: 'Este produto nÃ£o aceita pagamento em BRL' });
            return;
        }

        // Verificar estoque
        if (!product.isUnlimited) {
            const availableKeys = await prisma.productKey.count({
                where: { productId, isUsed: false }
            });
            if (availableKeys < quantity) {
                res.status(400).json({ error: 'Estoque insuficiente' });
                return;
            }
        }

        // Verificar desconto Magazine
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { membershipType: true, email: true }
        });
        
        const hasDiscount = product.magazineDiscount && user?.membershipType === 'MAGAZINE';
        const unitPrice = hasDiscount ? Number((product.priceBRL * 0.9).toFixed(2)) : product.priceBRL;
        const totalPrice = Number((unitPrice * quantity).toFixed(2));

        // Modo simulaÃ§Ã£o (dev)
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

            res.json({
                simulation: true,
                message: 'Modo simulaÃ§Ã£o ativo - pagamento simulado',
                orderId: order.id,
                init_point: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/store?payment=simulate&orderId=${order.id}`,
                total: totalPrice
            });
            return;
        }

        // Criar preferÃªncia no MercadoPago
        const preference = new Preference(client);

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
                    email: user?.email || ''
                },
                payment_methods: {
                    // Aceitar todos os mÃ©todos: PIX, cartÃ£o, boleto
                    excluded_payment_types: [],
                    installments: 12
                },
                back_urls: {
                    success: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/store?payment=success`,
                    failure: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/store?payment=failure`,
                    pending: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app'}/store?payment=pending`
                },
                notification_url: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/payment/webhook`,
                auto_return: 'approved',
                external_reference: JSON.stringify({ userId, productId, quantity }),
                statement_descriptor: 'MAGAZINE SRT'
            }
        });

        // Criar pedido pendente
        await prisma.order.create({
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

        res.json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point,
            total: totalPrice
        });

    } catch (error) {
        console.error('Error creating product preference:', error);
        res.status(500).json({ error: 'Erro ao criar preferÃªncia de pagamento' });
    }
});

// ============ WEBHOOK MERCADOPAGO ============
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, data } = req.body;

        console.log('MercadoPago webhook received:', { type, data });

        if (type === 'payment') {
            const paymentId = data?.id;
            
            if (!paymentId) {
                res.sendStatus(200);
                return;
            }

            // Buscar detalhes do pagamento
            const paymentClient = new Payment(client);
            const payment = await paymentClient.get({ id: paymentId });

            console.log('Payment details:', payment);

            if (payment.status === 'approved') {
                const externalRef = payment.external_reference;
                if (!externalRef) {
                    console.error('No external reference in payment');
                    res.sendStatus(200);
                    return;
                }

                const { userId, productId, quantity } = JSON.parse(externalRef);

                // Buscar ou criar pedido
                let order = await prisma.order.findFirst({
                    where: {
                        buyerId: userId,
                        productId,
                        paymentStatus: 'PENDING'
                    }
                });

                if (!order) {
                    // Criar pedido se nÃ£o existir
                    const product = await prisma.product.findUnique({ where: { id: productId } });
                    if (!product) {
                        console.error('Product not found:', productId);
                        res.sendStatus(200);
                        return;
                    }

                    order = await prisma.order.create({
                        data: {
                            buyerId: userId,
                            productId,
                            quantity,
                            totalBRL: Number(payment.transaction_amount),
                            paymentMethod: 'MERCADO_PAGO',
                            paymentStatus: 'PENDING',
                            paymentId: String(paymentId)
                        }
                    });
                }

                // Atualizar pedido para aprovado
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'COMPLETED',
                        paymentId: String(paymentId)
                    }
                });

                // Entregar as keys
                const product = await prisma.product.findUnique({ where: { id: productId } });
                
                if (product && !product.isUnlimited) {
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

                // Notificar usuÃ¡rio (criar notificaÃ§Ã£o)
                await prisma.notification.create({
                    data: {
                        userId,
                        type: 'SYSTEM',
                        content: `Sua compra de ${product?.name || 'produto'} foi confirmada! ðŸŽ‰`
                    }
                });

                console.log('Payment processed successfully:', order.id);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(200); // Sempre retornar 200 para evitar retentativas
    }
});

// ============ SIMULAR PAGAMENTO (DEV) ============
router.post('/simulate-payment', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    if (!isSimulationMode) {
        res.status(403).json({ error: 'SimulaÃ§Ã£o nÃ£o disponÃ­vel em produÃ§Ã£o' });
        return;
    }

    try {
        const { orderId } = req.body;
        const userId = (req as any).user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Usuário não autenticado' });
            return;
        }

        const order = await prisma.order.findFirst({
            where: { id: orderId, buyerId: userId, paymentStatus: 'PENDING' },
            include: { product: true }
        });

        if (!order) {
            res.status(404).json({ error: 'Pedido nÃ£o encontrado' });
            return;
        }

        // Atualizar para aprovado
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'COMPLETED' }
        });

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

        res.json({ success: true, message: 'Pagamento simulado com sucesso!' });
    } catch (error) {
        console.error('Simulate payment error:', error);
        res.status(500).json({ error: 'Erro ao simular pagamento' });
    }
});

export default router;

