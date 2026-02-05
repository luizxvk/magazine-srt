/**
 * Consumption Tracker Routes
 * 
 * Rastreia consumo/gastos de Zions pelos usuários.
 * Usado no painel admin para acompanhar transações.
 * Suporta filtro por tipo de moeda: POINTS ou CASH
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

const router = Router();

/**
 * GET /api/admin/consumption-tracker
 * Retorna histórico de transações de Zions com detalhes
 * 
 * Query params:
 * - period: 'today' | 'week' | 'month' | 'all'
 * - currency: 'POINTS' | 'CASH' | 'ALL' (default: 'ALL')
 * - limit: number (default: 200)
 */
router.get('/consumption-tracker', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
        const { period, currency = 'ALL', limit = 200 } = req.query;
        
        // Calcular data base do período
        let dateFilter: Date | undefined;
        const now = new Date();
        
        switch (period) {
            case 'today':
                dateFilter = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                dateFilter = undefined;
        }
        
        // Construir filtro
        const whereClause: any = {};
        
        if (dateFilter) {
            whereClause.createdAt = { gte: dateFilter };
        }
        
        // Filtro de moeda (POINTS ou CASH)
        if (currency === 'POINTS' || currency === 'CASH') {
            whereClause.currency = currency;
        }
        
        // Buscar histórico de Zions
        const zionHistory = await prisma.zionHistory.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true,
                        membershipType: true
                    }
                }
            }
        });
        
        // Transformar em formato padronizado
        const transactions = zionHistory.map(h => ({
            id: h.id,
            type: categorizeReason(h.reason),
            amount: h.amount,
            description: h.reason,
            currency: h.currency || 'POINTS', // Default para registros antigos
            createdAt: h.createdAt.toISOString(),
            user: h.user
        }));
        
        // Calcular estatísticas
        const stats = {
            totalSpent: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
            totalEarned: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
            totalTransactions: transactions.length,
            shopPurchases: transactions.filter(t => t.type === 'SHOP_PURCHASE').length,
            marketTransactions: transactions.filter(t => t.type === 'MARKET_PURCHASE' || t.type === 'MARKET_SALE').length,
            storePurchases: transactions.filter(t => t.type === 'STORE_PURCHASE').length,
            supplyBoxOpens: transactions.filter(t => t.type === 'SUPPLY_BOX').length,
        };
        
        res.json({
            success: true,
            transactions,
            stats,
            filters: {
                period: period || 'all',
                currency: currency || 'ALL'
            }
        });
    } catch (error) {
        console.error('Error fetching consumption data:', error);
        res.status(500).json({ error: 'Failed to fetch consumption data' });
    }
});

/**
 * GET /api/admin/zion-history
 * Fallback: retorna histórico bruto de Zions
 */
router.get('/zion-history', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
        const { limit = 200, currency } = req.query;
        
        const whereClause: any = {};
        if (currency === 'POINTS' || currency === 'CASH') {
            whereClause.currency = currency;
        }
        
        const history = await prisma.zionHistory.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        email: true,
                        avatarUrl: true,
                        membershipType: true
                    }
                }
            }
        });
        
        res.json(history);
    } catch (error) {
        console.error('Error fetching zion history:', error);
        res.status(500).json({ error: 'Failed to fetch zion history' });
    }
});

/**
 * Categoriza a razão da transação em um tipo
 */
function categorizeReason(reason: string): string {
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('supply box') || lowerReason.includes('caixa')) {
        return 'SUPPLY_BOX';
    }
    if (lowerReason.includes('compra') && (lowerReason.includes('loja') || lowerReason.includes('customização'))) {
        return 'SHOP_PURCHASE';
    }
    if (lowerReason.includes('mercado') && lowerReason.includes('compra')) {
        return 'MARKET_PURCHASE';
    }
    if (lowerReason.includes('mercado') && lowerReason.includes('venda')) {
        return 'MARKET_SALE';
    }
    if (lowerReason.includes('produto') || lowerReason.includes('key') || lowerReason.includes('game')) {
        return 'STORE_PURCHASE';
    }
    if (lowerReason.includes('daily') || lowerReason.includes('diário') || lowerReason.includes('login')) {
        return 'DAILY_LOGIN';
    }
    if (lowerReason.includes('badge') || lowerReason.includes('conquista') || lowerReason.includes('level') || lowerReason.includes('nível')) {
        return 'BADGE_REWARD';
    }
    if (lowerReason.includes('theme pack') || lowerReason.includes('tema')) {
        return 'SHOP_PURCHASE';
    }
    
    return 'OTHER';
}

export default router;
