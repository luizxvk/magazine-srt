import { Router } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const router = Router();

// Initialize Mercado Pago with Access Token
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

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

export default router;
