import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import MercadoPagoConfig, { Preference } from 'mercadopago';

const prisma = new PrismaClient();

// Packages configuration
const ZION_PACKAGES: Record<number, number> = {
    50: 5.00,
    150: 12.00,
    300: 20.00,
    500: 30.00,
    1000: 50.00
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
