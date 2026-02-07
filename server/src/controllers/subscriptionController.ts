import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Preços dos planos Elite (em R$)
export const ELITE_PRICES = {
    MONTHLY: 9.90,
    QUARTERLY: 24.90,
    YEARLY: 89.90,
    LIFETIME: 199.90
};

// Duração em dias
const PLAN_DURATION_DAYS = {
    MONTHLY: 30,
    QUARTERLY: 90,
    YEARLY: 365,
    LIFETIME: 36500 // ~100 anos
};

// Benefícios Elite
export const ELITE_BENEFITS = {
    xpMultiplier: 2,
    trophyMultiplier: 2,
    monthlyZions: 500,
    shopDiscount: 0.20, // 20%
    noCommentLimit: true,
    streakProtection: true,
    prioritySupport: true,
    exclusiveBackgrounds: true,
    animatedBorders: true,
    exclusiveColors: true,
    earlyAccess: true,
    exclusiveSupplyBox: true
};

// Obter status da assinatura do usuário
export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                isElite: true,
                eliteUntil: true,
                eliteSince: true,
                eliteStreak: true,
                streakProtectedUntil: true,
                subscriptions: {
                    where: { 
                        status: { in: ['ACTIVE', 'CANCELLED'] },
                        currentPeriodEnd: { gt: new Date() }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const now = new Date();
        // Usuário é Elite se tem flag ativa E data não expirou
        const isActive = user.isElite && user.eliteUntil && user.eliteUntil > now;
        const daysRemaining = isActive && user.eliteUntil
            ? Math.ceil((user.eliteUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        const subscription = user.subscriptions[0] || null;
        const isCancelled = subscription?.status === 'CANCELLED';

        res.json({
            isElite: isActive,
            eliteUntil: user.eliteUntil,
            eliteSince: user.eliteSince,
            eliteStreak: user.eliteStreak,
            daysRemaining,
            streakProtectedUntil: user.streakProtectedUntil,
            activeSubscription: subscription,
            isCancelled, // Nova flag para indicar cancelamento
            benefits: isActive ? ELITE_BENEFITS : null,
            prices: ELITE_PRICES
        });
    } catch (error) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Obter planos disponíveis
export const getPlans = async (_req: AuthRequest, res: Response) => {
    try {
        const plans = [
            {
                id: 'MONTHLY',
                name: 'Assinatura Elite - 1 Mês',
                price: ELITE_PRICES.MONTHLY,
                pricePerMonth: ELITE_PRICES.MONTHLY,
                duration: '1 mês',
                popular: false,
                savings: null
            },
            {
                id: 'QUARTERLY',
                name: 'Assinatura Elite - 3 Meses',
                price: ELITE_PRICES.QUARTERLY,
                pricePerMonth: (ELITE_PRICES.QUARTERLY / 3).toFixed(2),
                duration: '3 meses',
                popular: true,
                savings: '16%'
            },
            {
                id: 'YEARLY',
                name: 'Assinatura Elite - 12 Meses',
                price: ELITE_PRICES.YEARLY,
                pricePerMonth: (ELITE_PRICES.YEARLY / 12).toFixed(2),
                duration: '12 meses',
                popular: false,
                savings: '25%'
            },
            {
                id: 'LIFETIME',
                name: 'Assinatura Elite - Vitalício',
                price: ELITE_PRICES.LIFETIME,
                pricePerMonth: null,
                duration: 'Para sempre',
                popular: false,
                savings: 'Melhor valor'
            }
        ];

        res.json({
            plans,
            benefits: Object.entries(ELITE_BENEFITS).map(([key, value]) => ({
                id: key,
                name: getBenefitName(key),
                description: getBenefitDescription(key),
                value
            }))
        });
    } catch (error) {
        console.error('Error getting plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Criar assinatura (simula pagamento - integrar com gateway depois)
export const createSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { planType, paymentMethod } = req.body;

        if (!['MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'].includes(planType)) {
            return res.status(400).json({ error: 'Invalid plan type' });
        }

        // Verificar se já tem assinatura ativa
        const existingActive = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                currentPeriodEnd: { gt: new Date() }
            }
        });

        if (existingActive) {
            return res.status(400).json({ 
                error: 'Você já possui uma assinatura ativa',
                currentSubscription: existingActive
            });
        }

        const price = ELITE_PRICES[planType as keyof typeof ELITE_PRICES];
        const durationDays = PLAN_DURATION_DAYS[planType as keyof typeof PLAN_DURATION_DAYS];
        const now = new Date();
        const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        // Criar assinatura
        const subscription = await prisma.subscription.create({
            data: {
                userId,
                status: 'ACTIVE', // Em produção, seria 'PENDING' até confirmação do pagamento
                planType: planType as any,
                priceAtPurchase: price,
                paymentProvider: paymentMethod || 'pix',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd
            }
        });

        // Atualizar usuário como Elite
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isElite: true, eliteSince: true, eliteStreak: true }
        });

        await prisma.user.update({
            where: { id: userId },
            data: {
                isElite: true,
                eliteUntil: periodEnd,
                eliteSince: user?.eliteSince || now,
                eliteStreak: (user?.eliteStreak || 0) + 1,
                // Dar bônus de Zions do primeiro mês
                zionsPoints: { increment: ELITE_BENEFITS.monthlyZions }
            }
        });

        // Registrar histórico de Zions
        await prisma.zionHistory.create({
            data: {
                userId,
                amount: ELITE_BENEFITS.monthlyZions,
                reason: 'Bônus mensal ELITE',
                currency: 'POINTS'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Bem-vindo ao ELITE! 🎉',
            subscription,
            bonusZions: ELITE_BENEFITS.monthlyZions,
            eliteUntil: periodEnd
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cancelar assinatura
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { reason } = req.body;

        const activeSubscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE'
            }
        });

        if (!activeSubscription) {
            return res.status(404).json({ error: 'Nenhuma assinatura ativa encontrada' });
        }

        // Marcar como cancelada (mantém benefícios até o fim do período)
        await prisma.subscription.update({
            where: { id: activeSubscription.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: reason || 'Cancelado pelo usuário'
            }
        });

        res.json({
            success: true,
            message: 'Assinatura cancelada. Você mantém os benefícios até o fim do período atual.',
            eliteUntil: activeSubscription.currentPeriodEnd
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Usar proteção de streak
export const useStreakProtection = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isElite: true, eliteUntil: true, streakProtectedUntil: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const now = new Date();
        if (!user.isElite || !user.eliteUntil || user.eliteUntil < now) {
            return res.status(403).json({ error: 'Apenas membros ELITE podem usar proteção de streak' });
        }

        // Verificar se já usou recentemente
        if (user.streakProtectedUntil && user.streakProtectedUntil > now) {
            return res.status(400).json({ 
                error: 'Você já usou a proteção de streak recentemente',
                protectedUntil: user.streakProtectedUntil
            });
        }

        // Proteger por 48 horas
        const protectedUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: { streakProtectedUntil: protectedUntil }
        });

        res.json({
            success: true,
            message: 'Proteção de streak ativada por 48 horas!',
            protectedUntil
        });
    } catch (error) {
        console.error('Error using streak protection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Verificar se usuário é Elite (helper para outros controllers)
export const checkIsElite = async (userId: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isElite: true, eliteUntil: true }
    });

    if (!user) return false;
    if (!user.isElite || !user.eliteUntil) return false;
    
    return user.eliteUntil > new Date();
};

// Aplicar multiplicador XP para Elite
export const getXpMultiplier = async (userId: string): Promise<number> => {
    const isElite = await checkIsElite(userId);
    return isElite ? ELITE_BENEFITS.xpMultiplier : 1;
};

// Aplicar multiplicador de troféus para Elite
export const getTrophyMultiplier = async (userId: string): Promise<number> => {
    const isElite = await checkIsElite(userId);
    return isElite ? ELITE_BENEFITS.trophyMultiplier : 1;
};

// Job para processar assinaturas expiradas (chamar via cron)
export const processExpiredSubscriptions = async () => {
    const now = new Date();

    // Encontrar assinaturas expiradas (ACTIVE ou CANCELLED)
    const expired = await prisma.subscription.findMany({
        where: {
            status: { in: ['ACTIVE', 'CANCELLED'] },
            currentPeriodEnd: { lt: now }
        }
    });

    for (const sub of expired) {
        await prisma.$transaction([
            // Marcar assinatura como expirada
            prisma.subscription.update({
                where: { id: sub.id },
                data: { status: 'EXPIRED' }
            }),
            // Remover status Elite do usuário
            prisma.user.update({
                where: { id: sub.userId },
                data: { isElite: false }
            })
        ]);

        console.log(`[Subscription] Expired subscription ${sub.id} for user ${sub.userId}`);
    }

    return expired.length;
};

// Helpers para nomes dos benefícios
function getBenefitName(key: string): string {
    const names: Record<string, string> = {
        xpMultiplier: 'XP em Dobro',
        trophyMultiplier: 'Troféus em Dobro',
        monthlyZions: 'Zions Mensais',
        shopDiscount: 'Desconto na Loja',
        noCommentLimit: 'Sem Limite de Comentários',
        streakProtection: 'Proteção de Streak',
        prioritySupport: 'Suporte Prioritário',
        exclusiveBackgrounds: 'Backgrounds Exclusivos',
        animatedBorders: 'Bordas Animadas',
        exclusiveColors: 'Cores Exclusivas',
        earlyAccess: 'Acesso Antecipado',
        exclusiveSupplyBox: 'Supply Box ELITE'
    };
    return names[key] || key;
}

function getBenefitDescription(key: string): string {
    const descriptions: Record<string, string> = {
        xpMultiplier: 'Ganhe 2x XP em todas as ações',
        trophyMultiplier: 'Ganhe 2x troféus em eventos',
        monthlyZions: '500 Zions creditados todo mês',
        shopDiscount: '20% de desconto em todos os produtos',
        noCommentLimit: 'Comente sem limite de 10/hora',
        streakProtection: 'Não perca seu streak se esquecer 1 dia',
        prioritySupport: 'Resposta do suporte em até 1 hora',
        exclusiveBackgrounds: 'Acesso a backgrounds premium',
        animatedBorders: 'Bordas de perfil animadas',
        exclusiveColors: 'Cores de nome exclusivas',
        earlyAccess: 'Acesso antecipado a eventos e drops',
        exclusiveSupplyBox: 'Supply Box mensal com itens raros'
    };
    return descriptions[key] || '';
}
