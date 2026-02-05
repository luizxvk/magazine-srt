
import { Router } from 'express';
import { logger } from '../services/loggerService';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware';
import prisma from '../utils/prisma';

const router = Router();

// Get logs
router.get('/logs', authenticateToken, isAdmin, (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const level = req.query.level as string | undefined;
    const logs = logger.getLogs(limit, level);
    res.json(logs);
});

// Get system stats
router.get('/stats', authenticateToken, isAdmin, (req, res) => {
    const stats = logger.getSystemStats();
    res.json(stats);
});

/**
 * POST /devtools/reset-zions
 * Reseta os Zions de todos os usuários EXCETO admins
 * CUIDADO: Ação irreversível!
 */
router.post('/reset-zions', authenticateToken, isAdmin, async (req, res) => {
    try {
        console.log('[DevTools] 🔄 Iniciando reset de Zions...');

        // Contar usuários afetados
        const affectedCount = await prisma.user.count({
            where: {
                role: { not: 'ADMIN' },
                deletedAt: null
            }
        });

        // Resetar zions de todos os não-admin
        const result = await prisma.user.updateMany({
            where: {
                role: { not: 'ADMIN' },
                deletedAt: null
            },
            data: {
                zions: 0,
                zionsPoints: 0,
                zionsCash: 0
            }
        });

        console.log(`[DevTools] ✅ Reset concluído! ${result.count} usuários afetados.`);

        // Buscar admins para confirmação
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, zions: true, zionsPoints: true, zionsCash: true }
        });

        res.json({
            success: true,
            message: `Zions resetados para ${result.count} usuários.`,
            affectedUsers: result.count,
            adminsNotAffected: admins.map(a => ({
                name: a.name,
                zions: a.zions,
                zionsPoints: a.zionsPoints,
                zionsCash: a.zionsCash
            }))
        });
    } catch (error) {
        console.error('[DevTools] ❌ Erro ao resetar zions:', error);
        res.status(500).json({ error: 'Failed to reset zions' });
    }
});

export default router;
