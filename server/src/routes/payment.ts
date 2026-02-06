import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Initialize Mercado Pago with Access Token
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || ''
});

const isSimulationMode = process.env.MERCADOPAGO_SIMULATION_MODE === 'true';

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
                    success: `${process.env.CLIENT_URL || 'http://localhost:5173'}/mgt-log?status=success`,
                    failure: `${process.env.CLIENT_URL || 'http://localhost:5173'}/mgt-log?status=failure`,
                    pending: `${process.env.CLIENT_URL || 'http://localhost:5173'}/mgt-log?status=pending`
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

// ============ PRODUTOS - PAGAMENTO BRL ============
router.post('/product/create-preference', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const { productId, quantity, paymentType } = req.body;

        if (!productId || !quantity) {
            res.status(400).json({ error: 'productId e quantity sÃ£o obrigatÃ³rios' });
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
                init_point: `${process.env.CLIENT_URL || 'http://localhost:5173'}/store?payment=simulate&orderId=${order.id}`,
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
                    success: `${process.env.CLIENT_URL || 'http://localhost:5173'}/store?payment=success`,
                    failure: `${process.env.CLIENT_URL || 'http://localhost:5173'}/store?payment=failure`,
                    pending: `${process.env.CLIENT_URL || 'http://localhost:5173'}/store?payment=pending`
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
        const userId = (req as any).userId;

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

