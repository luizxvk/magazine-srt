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
 * Inferir tipo de moeda baseado na descrição/reason
 * Registros antigos não têm o campo currency, então inferimos
 */
function inferCurrency(reason: string, dbCurrency?: string): 'CASH' | 'POINTS' {
    // Se já tem no banco, usar
    if (dbCurrency === 'CASH' || dbCurrency === 'POINTS') {
        return dbCurrency;
    }
    
    const lower = reason.toLowerCase();
    
    // Zions CASH - transações com dinheiro real
    if (
        lower.includes('cash') ||
        lower.includes('recarga') ||
        lower.includes('compra de zions') ||
        lower.includes('r$') ||
        lower.includes('reais') ||
        lower.includes('pix') ||
        lower.includes('mercado pago') ||
        lower.includes('saque') ||
        lower.includes('withdraw') ||
        lower.includes('produto') ||  // Compras na loja de produtos (game keys)
        lower.includes('key') ||
        lower.includes('gift card')
    ) {
        return 'CASH';
    }
    
    // Zions POINTS - moeda virtual para customizações
    // Daily login, badges, customizações, supply box, mercado P2P
    return 'POINTS';
}

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
    if (lowerReason.includes('recarga') || lowerReason.includes('compra de zions') || lowerReason.includes('r$')) {
        return 'ZION_PURCHASE';
    }
    
    return 'OTHER';
}

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
        
        // Buscar histórico de Zions
        const zionHistory = await prisma.zionHistory.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            orderBy: { createdAt: 'desc' },
            take: Number(limit) * 2, // Buscar mais para compensar filtro posterior
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
        
        // Transformar em formato padronizado com inferência de moeda
        let transactions = zionHistory.map(h => {
            const inferredCurrency = inferCurrency(h.reason, h.currency);
            return {
                id: h.id,
                type: categorizeReason(h.reason),
                amount: h.amount,
                description: h.reason,
                currency: inferredCurrency,
                createdAt: h.createdAt.toISOString(),
                user: h.user
            };
        });
        
        // Aplicar filtro de moeda (após inferência)
        if (currency === 'POINTS' || currency === 'CASH') {
            transactions = transactions.filter(t => t.currency === currency);
        }
        
        // Limitar ao número solicitado
        transactions = transactions.slice(0, Number(limit));
        
        // Calcular estatísticas SEPARADAS por tipo de moeda
        const cashTransactions = transactions.filter(t => t.currency === 'CASH');
        const pointsTransactions = transactions.filter(t => t.currency === 'POINTS');
        
        const stats = {
            // Cash (moeda real)
            cashSpent: cashTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
            cashEarned: cashTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
            cashTransactions: cashTransactions.length,
            
            // Points (moeda virtual)
            pointsSpent: pointsTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
            pointsEarned: pointsTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
            pointsTransactions: pointsTransactions.length,
            
            // Totais gerais
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
        
        const history = await prisma.zionHistory.findMany({
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
        
        // Adicionar inferência de moeda
        const historyWithCurrency = history.map(h => ({
            ...h,
            currency: inferCurrency(h.reason, h.currency)
        }));
        
        // Filtrar se necessário
        if (currency === 'POINTS' || currency === 'CASH') {
            return res.json(historyWithCurrency.filter(h => h.currency === currency));
        }
        
        res.json(historyWithCurrency);
    } catch (error) {
        console.error('Error fetching zion history:', error);
        res.status(500).json({ error: 'Failed to fetch zion history' });
    }
});

export default router;
