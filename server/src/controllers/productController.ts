import { Response } from 'express';
import prisma from '../utils/prisma';
import { uploadProductImage } from '../services/cloudinaryService';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendProductKeysEmail } from '../services/emailService';
import { awardXP } from '../services/gamificationService';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';
import crypto from 'crypto';

// ===================== PRODUCT MANAGEMENT (Admin) =====================

/**
 * Create a new product (Admin only)
 */
export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { 
            name, description, imageBase64, screenshotBase64, category, 
            priceZions, priceBRL, stock, isUnlimited, magazineDiscount,
            developer, releaseDate, sizeGB, platform, tags 
        } = req.body;
        const userId = req.user?.userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem criar produtos' });
        }

        // Upload image if provided
        let imageUrl: string | null = null;
        if (imageBase64) {
            imageUrl = await uploadProductImage(imageBase64);
        }

        // Upload screenshots if provided
        const screenshots: string[] = [];
        if (screenshotBase64 && Array.isArray(screenshotBase64)) {
            for (const base64 of screenshotBase64) {
                const url = await uploadProductImage(base64);
                if (url) screenshots.push(url);
            }
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                imageUrl,
                screenshots,
                category,
                priceZions: priceZions || null,
                priceBRL: priceBRL || null,
                stock: stock || 0,
                isUnlimited: isUnlimited || false,
                magazineDiscount: magazineDiscount || false,
                developer: developer || null,
                releaseDate: releaseDate || null,
                sizeGB: sizeGB || null,
                platform: platform || null,
                createdById: userId!,
                tags: tags && tags.length > 0 ? {
                    create: tags.map((tag: string) => ({ tag }))
                } : undefined
            },
            include: {
                tags: true
            }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
};

/**
 * Update a product (Admin only)
 */
export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            name, description, imageBase64, screenshotBase64, category, 
            priceZions, priceBRL, stock, isUnlimited, isActive, magazineDiscount,
            developer, releaseDate, sizeGB, platform, tags 
        } = req.body;
        const userId = req.user?.userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem editar produtos' });
        }

        // Upload new image if provided
        let imageUrl: string | undefined = undefined;
        if (imageBase64) {
            const uploadedUrl = await uploadProductImage(imageBase64);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            }
        }

        // Upload new screenshots if provided
        let screenshots: string[] | undefined = undefined;
        if (screenshotBase64 && Array.isArray(screenshotBase64) && screenshotBase64.length > 0) {
            screenshots = [];
            for (const base64 of screenshotBase64) {
                const url = await uploadProductImage(base64);
                if (url) screenshots.push(url);
            }
        }

        const updateData: any = {
            name,
            description,
            category,
            priceZions,
            priceBRL,
            stock,
            isUnlimited,
            isActive,
            magazineDiscount: magazineDiscount || false,
            developer: developer || null,
            releaseDate: releaseDate || null,
            sizeGB: sizeGB || null,
            platform: platform || null
        };

        // Only update imageUrl if a new image was uploaded
        if (imageUrl) {
            updateData.imageUrl = imageUrl;
        }

        // Only update screenshots if new ones were uploaded
        if (screenshots !== undefined) {
            // Get existing product to merge screenshots
            const existingProduct = await prisma.product.findUnique({ where: { id } });
            updateData.screenshots = [...(existingProduct?.screenshots || []), ...screenshots];
        }

        // Update product
        const product = await prisma.product.update({
            where: { id },
            data: updateData
        });

        // Update tags if provided
        if (tags !== undefined) {
            // Delete existing tags
            await prisma.productTag.deleteMany({ where: { productId: id } });
            
            // Create new tags
            if (tags && tags.length > 0) {
                await prisma.productTag.createMany({
                    data: tags.map((tag: string) => ({ productId: id, tag }))
                });
            }
        }

        // Return product with tags
        const productWithTags = await prisma.product.findUnique({
            where: { id },
            include: { tags: true }
        });

        res.json(productWithTags);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
};

/**
 * Delete a product (Admin only)
 */
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem deletar produtos' });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id },
            include: { orders: true }
        });

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Use transaction to delete related records first
        await prisma.$transaction(async (tx: any) => {
            // Delete all keys associated with this product (cascade should handle this, but being explicit)
            await tx.productKey.deleteMany({ where: { productId: id } });

            // Update orders to remove product reference (set productId to null or handle appropriately)
            // Since we can't set productId to null (required field), we need to delete orders too
            // Or we can just delete the product if there are no orders
            if (product.orders.length > 0) {
                // Delete delivered keys from orders first
                await tx.productKey.updateMany({
                    where: { orderId: { in: product.orders.map((o: any) => o.id) } },
                    data: { orderId: null }
                });
                // Delete orders
                await tx.order.deleteMany({ where: { productId: id } });
            }

            // Finally delete the product
            await tx.product.delete({ where: { id } });
        });

        res.json({ message: 'Produto deletado com sucesso' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
};

/**
 * Add keys to a product (Admin only)
 */
export const addProductKeys = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { keys } = req.body; // Array of key strings
        const userId = req.user?.userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem adicionar keys' });
        }

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Create keys
        const createdKeys = await prisma.productKey.createMany({
            data: keys.map((key: string) => ({
                productId: id,
                key
            }))
        });

        // Update stock
        await prisma.product.update({
            where: { id },
            data: {
                stock: { increment: keys.length }
            }
        });

        res.json({
            message: `${createdKeys.count} keys adicionadas com sucesso`,
            newStock: product.stock + keys.length
        });
    } catch (error) {
        console.error('Error adding product keys:', error);
        res.status(500).json({ error: 'Erro ao adicionar keys' });
    }
};

// ===================== PRODUCT LISTING (Public) =====================

/**
 * Get all active products
 */
export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const { category, search, sortBy = 'createdAt', order = 'desc' } = req.query;

        const where: any = { isActive: true };

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { [sortBy as string]: order },
            select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                screenshots: true,
                category: true,
                priceZions: true,
                priceBRL: true,
                stock: true,
                isUnlimited: true,
                developer: true,
                releaseDate: true,
                sizeGB: true,
                platform: true,
                createdAt: true,
                tags: {
                    select: { tag: true }
                },
                _count: {
                    select: {
                        keys: { where: { isUsed: false } }
                    }
                }
            }
        });

        // Map to include available stock from keys
        const productsWithStock = products.map(p => ({
            ...p,
            availableStock: p.isUnlimited ? 999 : p._count.keys
        }));

        res.json(productsWithStock);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
};

/**
 * Get single product details
 */
export const getProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                tags: true,
                _count: {
                    select: {
                        keys: { where: { isUsed: false } },
                        orders: { where: { paymentStatus: 'COMPLETED' } }
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({
            ...product,
            availableStock: product.isUnlimited ? 999 : product._count.keys,
            totalSold: product._count.orders
        });
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
};

// ===================== PURCHASE SYSTEM =====================

/**
 * Purchase a product with Zions
 */
export const purchaseWithZions = async (req: AuthRequest, res: Response) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user?.userId;

        // Get product
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                keys: {
                    where: { isUsed: false },
                    take: quantity
                }
            }
        });

        if (!product || !product.isActive) {
            return res.status(404).json({ error: 'Produto não encontrado ou indisponível' });
        }

        if (!product.priceZions) {
            return res.status(400).json({ error: 'Este produto não aceita pagamento em Zions Cash' });
        }

        // Check stock
        if (!product.isUnlimited && product.keys.length < quantity) {
            return res.status(400).json({ error: 'Estoque insuficiente' });
        }

        const totalCost = product.priceZions * quantity;

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, zionsCash: true, email: true, displayName: true, name: true }
        });

        if (!user || user.zionsCash < totalCost) {
            return res.status(400).json({ error: 'Zions Cash insuficiente' });
        }

        // Calculate 10% cashback in Points
        const cashbackPoints = Math.floor(totalCost * 10);

        // Execute transaction
        const keysToDeliver = product.keys.slice(0, quantity);

        const order = await prisma.$transaction(async (tx) => {
            // Deduct Zions Cash and add cashback Points
            await tx.user.update({
                where: { id: userId },
                data: {
                    zionsCash: { decrement: totalCost },
                    zionsPoints: { increment: cashbackPoints }
                }
            });

            // Record Zion history for Cash spent
            await tx.zionHistory.create({
                data: {
                    userId: userId!,
                    amount: -totalCost,
                    reason: `Compra: ${product.name} (Cash)`
                }
            });

            // Record Zion history for Points cashback
            await tx.zionHistory.create({
                data: {
                    userId: userId!,
                    amount: cashbackPoints,
                    reason: `Cashback: ${product.name} (10%)`
                }
            });

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    buyerId: userId!,
                    productId,
                    quantity,
                    totalZions: totalCost,
                    paymentMethod: 'ZIONS',
                    paymentStatus: 'COMPLETED'
                }
            });

            // Mark keys as used and link to order
            if (keysToDeliver.length > 0) {
                await tx.productKey.updateMany({
                    where: { id: { in: keysToDeliver.map(k => k.id) } },
                    data: {
                        isUsed: true,
                        usedAt: new Date(),
                        usedById: userId,
                        orderId: newOrder.id
                    }
                });
            }

            // Update stock if not unlimited
            if (!product.isUnlimited) {
                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: quantity } }
                });
            }

            return newOrder;
        });

        // Get delivered keys
        const deliveredKeys = await prisma.productKey.findMany({
            where: { orderId: order.id },
            select: { key: true }
        });

        // Award XP equal to Zions Cash spent
        try {
            await awardXP(userId!, totalCost, `Compra: ${product.name}`);
            console.log(`[purchaseWithZions] Awarded ${totalCost} XP to user ${userId}`);
        } catch (xpError) {
            console.error('Failed to award XP:', xpError);
            // Don't fail the purchase if XP fails
        }

        // Send keys via email
        const keys = deliveredKeys.map(k => k.key);
        if (user.email && keys.length > 0) {
            await sendProductKeysEmail(
                user.email,
                user.displayName || user.name,
                product.name,
                keys,
                order.id
            );
        }

        res.json({
            success: true,
            message: 'Compra realizada com sucesso! As keys foram enviadas para seu email.',
            order: {
                id: order.id,
                product: product.name,
                quantity,
                totalZions: totalCost
            },
            cashbackPoints,
            xpEarned: totalCost,
            emailSent: !!user.email
        });
    } catch (error) {
        console.error('Error purchasing with Zions:', error);
        res.status(500).json({ error: 'Erro ao processar compra' });
    }
};

/**
 * Get user's purchase history
 */
export const getUserOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const orders = await prisma.order.findMany({
            where: { buyerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        category: true
                    }
                },
                deliveredKeys: {
                    select: {
                        key: true
                    }
                }
            }
        });

        res.json(orders);
    } catch (error) {
        console.error('Error getting user orders:', error);
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
};

// ===================== ADMIN ORDERS =====================

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { status, limit = 50 } = req.query;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const where: any = {};
        if (status) {
            where.paymentStatus = status;
        }

        const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        category: true
                    }
                }
            }
        });

        res.json(orders);
    } catch (error) {
        console.error('Error getting all orders:', error);
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
};

/**
 * Get admin products with full details
 */
export const getAdminProducts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                tags: true,
                _count: {
                    select: {
                        keys: true,
                        orders: true
                    }
                }
            }
        });

        // Get available keys count for each
        const productsWithDetails = await Promise.all(products.map(async (p) => {
            const availableKeys = await prisma.productKey.count({
                where: { productId: p.id, isUsed: false }
            });
            return {
                ...p,
                availableKeys,
                totalKeys: p._count.keys,
                totalOrders: p._count.orders
            };
        }));

        res.json(productsWithDetails);
    } catch (error) {
        console.error('Error getting admin products:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
};

// ===================== PURCHASE WITH BRL (Mercado Pago) =====================

/**
 * Create PIX payment for product purchase
 */
export const purchaseWithBRL = async (req: AuthRequest, res: Response) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user?.userId;

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            console.error('[PRODUCT_PAYMENT] MERCADOPAGO_ACCESS_TOKEN not configured');
            return res.status(500).json({ error: 'Sistema de pagamento não configurado' });
        }

        // Get product
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                keys: {
                    where: { isUsed: false },
                    take: quantity
                }
            }
        });

        if (!product || !product.isActive) {
            return res.status(404).json({ error: 'Produto não encontrado ou indisponível' });
        }

        if (!product.priceBRL) {
            return res.status(400).json({ error: 'Este produto não aceita pagamento em BRL' });
        }

        // Check stock
        if (!product.isUnlimited && product.keys.length < quantity) {
            return res.status(400).json({ error: 'Estoque insuficiente' });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, displayName: true, name: true, membershipType: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Calculate price with discount for MAGAZINE members
        let totalPrice = product.priceBRL * quantity;
        if (product.magazineDiscount && user.membershipType === 'MAGAZINE') {
            totalPrice = totalPrice * 0.9; // 10% discount
        }

        // Create order with PENDING status
        const order = await prisma.order.create({
            data: {
                buyerId: userId!,
                productId,
                quantity,
                totalBRL: totalPrice,
                paymentMethod: 'PIX',
                paymentStatus: 'PENDING'
            }
        });

        // Create Mercado Pago PIX payment
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);

        console.log(`[PRODUCT_PAYMENT] Creating PIX for product ${product.name}, R$${totalPrice} - User: ${userId}`);

        const result = await payment.create({
            body: {
                transaction_amount: totalPrice,
                description: `${product.name} - Magazine/MGT`,
                payment_method_id: 'pix',
                payer: {
                    email: user.email,
                    first_name: user.displayName || user.name?.split(' ')[0] || 'Usuario',
                    last_name: user.name?.split(' ').slice(1).join(' ') || 'Magazine'
                },
                external_reference: `product_${order.id}`, // Prefix to identify product orders
                notification_url: `${process.env.BACKEND_URL || 'https://api.magazinesrt.com.br'}/api/payments/webhook`
            }
        });

        // Update order with payment ID
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentId: String(result.id) }
        });

        console.log(`[PRODUCT_PAYMENT] PIX created - PaymentID: ${result.id} - Status: ${result.status}`);

        const pixInfo = result.point_of_interaction?.transaction_data;

        res.json({
            success: true,
            orderId: order.id,
            paymentId: result.id,
            qrCode: pixInfo?.qr_code,
            qrCodeBase64: pixInfo?.qr_code_base64,
            copyPaste: pixInfo?.qr_code,
            ticketUrl: pixInfo?.ticket_url,
            status: result.status,
            expirationDate: result.date_of_expiration,
            product: product.name,
            totalBRL: totalPrice
        });

    } catch (error: any) {
        console.error('[PRODUCT_PAYMENT] Error creating PIX:', error?.message || error);
        res.status(500).json({ error: 'Erro ao criar pagamento PIX' });
    }
};

/**
 * Check product order payment status and deliver keys if approved
 */
export const checkProductPaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.userId;

        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
            return res.status(500).json({ error: 'Sistema de pagamento não configurado' });
        }

        // Get order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                product: {
                    include: {
                        keys: {
                            where: { isUsed: false },
                            take: 10 // Max keys per order
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        // Security check - user can only check their own orders
        if (order.buyerId !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Already completed?
        if (order.paymentStatus === 'COMPLETED') {
            const deliveredKeys = await prisma.productKey.findMany({
                where: { orderId: order.id },
                select: { key: true }
            });
            return res.json({
                status: 'approved',
                paymentStatus: 'COMPLETED',
                keys: deliveredKeys.map(k => k.key)
            });
        }

        if (!order.paymentId) {
            return res.status(400).json({ error: 'Pagamento não encontrado para este pedido' });
        }

        // Check payment status on Mercado Pago
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);
        const result = await payment.get({ id: order.paymentId });

        if (result.status === 'approved') {
            // Deliver keys
            const keys = await deliverProductKeys(order.id, order.product, order.quantity, userId!);
            
            return res.json({
                status: 'approved',
                paymentStatus: 'COMPLETED',
                keys
            });
        }

        res.json({
            status: result.status,
            statusDetail: result.status_detail,
            paymentStatus: order.paymentStatus
        });

    } catch (error: any) {
        console.error('[PRODUCT_PAYMENT] Error checking status:', error?.message || error);
        res.status(500).json({ error: 'Erro ao verificar status do pagamento' });
    }
};

/**
 * Helper to deliver product keys after payment approval
 */
const deliverProductKeys = async (orderId: string, product: any, quantity: number, userId: string): Promise<string[]> => {
    // Check if already delivered (idempotency)
    const existingKeys = await prisma.productKey.findMany({
        where: { orderId },
        select: { key: true }
    });

    if (existingKeys.length > 0) {
        console.log(`[PRODUCT_PAYMENT] Keys already delivered for order ${orderId}`);
        return existingKeys.map(k => k.key);
    }

    // Get available keys
    const availableKeys = await prisma.productKey.findMany({
        where: { productId: product.id, isUsed: false },
        take: quantity
    });

    if (availableKeys.length < quantity && !product.isUnlimited) {
        console.error(`[PRODUCT_PAYMENT] Not enough keys for order ${orderId}`);
        throw new Error('Estoque insuficiente');
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

    // Send keys via email
    const keys = availableKeys.map(k => k.key);
    if (user?.email && keys.length > 0) {
        await sendProductKeysEmail(
            user.email,
            user.displayName || user.name || 'Cliente',
            product.name,
            keys,
            orderId
        );
    }

    // Award XP
    try {
        const xpAmount = Math.floor((product.priceBRL || 0) * quantity);
        await awardXP(userId, xpAmount, `Compra: ${product.name}`);
    } catch (xpError) {
        console.error('Failed to award XP:', xpError);
    }

    console.log(`[PRODUCT_PAYMENT] ✅ Keys delivered for order ${orderId}: ${keys.length} keys`);
    return keys;
};