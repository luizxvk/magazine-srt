import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

const prisma = new PrismaClient();

// Packages configuration
const ZION_PACKAGES: Record<number, number> = {
    50: 5.00,
    150: 12.00,
    300: 20.00,
    500: 30.00,
    1000: 50.00
};

// Create PIX payment
export const createPixPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        const { zions } = req.body;

        if (!zions || !ZION_PACKAGES[zions]) {
            return res.status(400).json({ error: 'Invalid Zions package' });
        }

        const price = ZION_PACKAGES[zions];

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.warn('MERCADOPAGO_ACCESS_TOKEN not found');
            return res.status(500).json({ error: 'Payment configuration missing' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);

        // Create purchase record
        const newPurchase = await prisma.zionPurchase.create({
            data: {
                userId,
                amount: zions,
                price: price,
                status: 'PENDING'
            }
        });

        // Create PIX payment
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
                external_reference: newPurchase.id
            }
        });

        // Update purchase with payment ID
        await prisma.zionPurchase.update({
            where: { id: newPurchase.id },
            data: { paymentId: String(result.id) }
        });

        // Return PIX data
        const pixInfo = result.point_of_interaction?.transaction_data;
        
        res.json({
            paymentId: result.id,
            qrCode: pixInfo?.qr_code,
            qrCodeBase64: pixInfo?.qr_code_base64,
            copyPaste: pixInfo?.qr_code,
            ticketUrl: pixInfo?.ticket_url,
            status: result.status
        });

    } catch (error: any) {
        console.error('Error creating PIX payment:', error?.message || error);
        res.status(500).json({ error: 'Failed to create PIX payment' });
    }
};

// Check payment status
export const checkPaymentStatus = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            return res.status(500).json({ error: 'Payment configuration missing' });
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);

        const result = await payment.get({ id: paymentId });

        // If approved, credit Zions
        if (result.status === 'approved' && result.external_reference) {
            const purchase = await prisma.zionPurchase.findUnique({
                where: { id: result.external_reference }
            });

            if (purchase && purchase.status === 'PENDING') {
                // Credit Zions and update status
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: purchase.userId },
                        data: { zions: { increment: purchase.amount } }
                    }),
                    prisma.zionPurchase.update({
                        where: { id: purchase.id },
                        data: { status: 'COMPLETED' }
                    })
                ]);
            }
        }

        res.json({ status: result.status });

    } catch (error: any) {
        console.error('Error checking payment:', error?.message || error);
        res.status(500).json({ error: 'Failed to check payment status' });
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
    // Implement webhook handling for status updates
    // For now, auto-return is used, but robust implementation uses webhooks
    res.status(200).send('OK');
};
