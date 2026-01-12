import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { uploadProductImage } from '../services/cloudinaryService';

// ===================== PRODUCT MANAGEMENT (Admin) =====================

/**
 * Create a new product (Admin only)
 */
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, imageBase64, category, priceZions, priceBRL, stock, isUnlimited } = req.body;
        const userId = (req as any).userId;

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

        const product = await prisma.product.create({
            data: {
                name,
                description,
                imageUrl,
                category,
                priceZions: priceZions || null,
                priceBRL: priceBRL || null,
                stock: stock || 0,
                isUnlimited: isUnlimited || false,
                createdById: userId
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
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, imageBase64, category, priceZions, priceBRL, stock, isUnlimited, isActive } = req.body;
        const userId = (req as any).userId;

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

        const updateData: any = {
            name,
            description,
            category,
            priceZions,
            priceBRL,
            stock,
            isUnlimited,
            isActive
        };

        // Only update imageUrl if a new image was uploaded
        if (imageUrl) {
            updateData.imageUrl = imageUrl;
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData
        });

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
};

/**
 * Delete a product (Admin only)
 */
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem deletar produtos' });
        }

        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Produto deletado com sucesso' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
};

/**
 * Add keys to a product (Admin only)
 */
export const addProductKeys = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { keys } = req.body; // Array of key strings
        const userId = (req as any).userId;

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
export const getProducts = async (req: Request, res: Response) => {
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
                category: true,
                priceZions: true,
                priceBRL: true,
                stock: true,
                isUnlimited: true,
                createdAt: true,
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
export const getProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
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
export const purchaseWithZions = async (req: Request, res: Response) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = (req as any).userId;

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
            return res.status(400).json({ error: 'Este produto não aceita pagamento em Zions' });
        }

        // Check stock
        if (!product.isUnlimited && product.keys.length < quantity) {
            return res.status(400).json({ error: 'Estoque insuficiente' });
        }

        const totalCost = product.priceZions * quantity;

        // Get user
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.zions < totalCost) {
            return res.status(400).json({ error: 'Zions insuficientes' });
        }

        // Execute transaction
        const keysToDeliver = product.keys.slice(0, quantity);

        const order = await prisma.$transaction(async (tx) => {
            // Deduct Zions
            await tx.user.update({
                where: { id: userId },
                data: { zions: { decrement: totalCost } }
            });

            // Record Zion history
            await tx.zionHistory.create({
                data: {
                    userId,
                    amount: -totalCost,
                    reason: `Compra: ${product.name}`
                }
            });

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    buyerId: userId,
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

        res.json({
            success: true,
            order: {
                id: order.id,
                product: product.name,
                quantity,
                totalZions: totalCost
            },
            keys: deliveredKeys.map(k => k.key)
        });
    } catch (error) {
        console.error('Error purchasing with Zions:', error);
        res.status(500).json({ error: 'Erro ao processar compra' });
    }
};

/**
 * Get user's purchase history
 */
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

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
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
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
export const getAdminProducts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Verify admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
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
