import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendPushToUser } from './notificationController';

export const getEvents = async (_req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            where: { active: true },
            orderBy: { date: 'asc' },
            include: {
                linkedReward: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        costZions: true,
                        zionsReward: true,
                        metadata: true,
                        backgroundColor: true,
                        isEventReward: true,
                        publishedAt: true,
                    }
                },
                _count: {
                    select: { dropClaims: true }
                }
            }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { 
            title, description, date, category, game, imageUrl, linkedRewardId,
            dropItemId, dropItemType, dropKeyword, dropClaimUntil, tag
        } = req.body;

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                category,
                game,
                imageUrl,
                tag: tag || null,
                // Drop exclusivo
                dropItemId: dropItemId || null,
                dropItemType: dropItemType || null,
                dropKeyword: dropKeyword || null,
                dropClaimUntil: dropClaimUntil ? new Date(dropClaimUntil) : null,
            }
        });

        // Se houver recompensa vinculada, atualiza a recompensa
        if (linkedRewardId) {
            await prisma.reward.update({
                where: { id: linkedRewardId },
                data: {
                    linkedEventId: event.id,
                    isEventReward: true
                }
            });
        }

        // Retornar evento com recompensa vinculada
        const eventWithReward = await prisma.event.findUnique({
            where: { id: event.id },
            include: {
                linkedReward: true
            }
        });

        // Enviar push notification para todos os usuários
        const eventTime = new Date(date).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });
        
        const allUsers = await prisma.user.findMany({
            where: { deletedAt: null },
            select: { id: true }
        });

        // Enviar push para todos (async, não esperar)
        Promise.all(
            allUsers.map(user =>
                sendPushToUser(
                    user.id,
                    '📅 Novo Evento Anunciado!',
                    `${title} às ${eventTime}`,
                    { url: '/feed?openEvents=true', eventId: event.id, type: 'new_event' }
                ).catch(() => {}) // Ignorar falhas individuais
            )
        ).catch(err => console.error('[Push] Error sending event notifications:', err));

        res.status(201).json(eventWithReward);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// Buscar recompensas não vinculadas para dropdown
export const getAvailableRewards = async (_req: Request, res: Response) => {
    try {
        const rewards = await prisma.reward.findMany({
            where: {
                isEventReward: false,
                linkedEventId: null,
            },
            orderBy: { title: 'asc' },
            select: {
                id: true,
                title: true,
                type: true,
                costZions: true,
                zionsReward: true,
                metadata: true,
                backgroundColor: true,
            }
        });
        res.json(rewards);
    } catch (error) {
        console.error('Error fetching available rewards:', error);
        res.status(500).json({ error: 'Failed to fetch rewards' });
    }
};

// Auto-publicar recompensas de eventos finalizados
export const publishEventRewards = async (_req: Request, res: Response) => {
    try {
        const now = new Date();
        
        // Buscar eventos passados com recompensas não publicadas
        const events = await prisma.event.findMany({
            where: {
                date: { lte: now },
                active: true,
                linkedReward: {
                    isEventReward: true,
                    publishedAt: null
                }
            },
            include: {
                linkedReward: true
            }
        });

        const publishedRewards = [];

        for (const event of events) {
            if (event.linkedReward) {
                // Marcar recompensa como publicada
                await prisma.reward.update({
                    where: { id: event.linkedReward.id },
                    data: {
                        publishedAt: now,
                        isEventReward: false // Agora é uma recompensa normal
                    }
                });
                publishedRewards.push({
                    eventId: event.id,
                    eventTitle: event.title,
                    rewardId: event.linkedReward.id,
                    rewardTitle: event.linkedReward.title
                });
            }
        }

        res.json({
            success: true,
            message: `${publishedRewards.length} recompensa(s) publicada(s)`,
            publishedRewards
        });
    } catch (error) {
        console.error('Error publishing event rewards:', error);
        res.status(500).json({ error: 'Failed to publish event rewards' });
    }
};

// Deletar evento (e desvincular recompensa se houver)
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Buscar evento com recompensa vinculada
        const event = await prisma.event.findUnique({
            where: { id },
            include: { linkedReward: true }
        });
        
        if (!event) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        
        // Se tiver recompensa vinculada, desvincular (não deleta a recompensa)
        if (event.linkedReward) {
            await prisma.reward.update({
                where: { id: event.linkedReward.id },
                data: {
                    linkedEventId: null,
                    isEventReward: false
                }
            });
        }
        
        // Deletar o evento
        await prisma.event.delete({
            where: { id }
        });
        
        res.json({ success: true, message: 'Evento removido com sucesso' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// ========== DROP EXCLUSIVO DE EVENTO ==========

// Atualizar evento (incluindo drop)
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            title, description, date, category, game, imageUrl,
            dropItemId, dropItemType, dropKeyword, dropClaimUntil
        } = req.body;

        const event = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
                category,
                game,
                imageUrl,
                dropItemId: dropItemId ?? undefined,
                dropItemType: dropItemType ?? undefined,
                dropKeyword: dropKeyword ?? undefined,
                dropClaimUntil: dropClaimUntil ? new Date(dropClaimUntil) : undefined,
            }
        });

        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Verificar se usuário tem drop disponível para resgatar
export const getEventDrop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const event = await prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                date: true,
                dropItemId: true,
                dropItemType: true,
                dropClaimUntil: true,
                dropClaims: {
                    where: { userId },
                    select: { id: true, claimedAt: true }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }

        // Verificar se tem drop configurado
        if (!event.dropItemId || !event.dropItemType) {
            return res.json({ hasDrop: false });
        }

        // Verificar se evento já terminou
        const now = new Date();
        if (event.date > now) {
            return res.json({ hasDrop: false, reason: 'event_not_finished' });
        }

        // Verificar se ainda pode resgatar
        if (event.dropClaimUntil && event.dropClaimUntil < now) {
            return res.json({ hasDrop: false, reason: 'claim_expired' });
        }

        // Verificar se já resgatou
        const alreadyClaimed = event.dropClaims.length > 0;

        res.json({
            hasDrop: true,
            eventId: event.id,
            eventTitle: event.title,
            dropItemId: event.dropItemId,
            dropItemType: event.dropItemType,
            dropClaimUntil: event.dropClaimUntil,
            alreadyClaimed,
            claimedAt: alreadyClaimed ? event.dropClaims[0].claimedAt : null
        });
    } catch (error) {
        console.error('Error fetching event drop:', error);
        res.status(500).json({ error: 'Failed to fetch event drop' });
    }
};

// Listar eventos com drops disponíveis para o usuário (não resgatados ainda)
export const getAvailableDrops = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const now = new Date();

        // Buscar eventos finalizados com drops não resgatados pelo usuário
        const events = await prisma.event.findMany({
            where: {
                active: true,
                date: { lte: now }, // Evento já passou
                dropItemId: { not: null },
                dropItemType: { not: null },
                OR: [
                    { dropClaimUntil: null },
                    { dropClaimUntil: { gte: now } }
                ],
                // Não resgatado pelo usuário
                dropClaims: {
                    none: { userId }
                }
            },
            select: {
                id: true,
                title: true,
                imageUrl: true,
                date: true,
                dropItemId: true,
                dropItemType: true,
                dropClaimUntil: true
            },
            orderBy: { date: 'desc' }
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching available drops:', error);
        res.status(500).json({ error: 'Failed to fetch available drops' });
    }
};

// Resgatar drop do evento
export const claimEventDrop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { keyword } = req.body;
        const userId = (req as any).user.id;

        // Buscar evento
        const event = await prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                date: true,
                dropItemId: true,
                dropItemType: true,
                dropKeyword: true,
                dropClaimUntil: true,
                dropClaims: {
                    where: { userId }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }

        // Verificações
        if (!event.dropItemId || !event.dropItemType) {
            return res.status(400).json({ error: 'Este evento não possui drop exclusivo' });
        }

        const now = new Date();
        if (event.date > now) {
            return res.status(400).json({ error: 'O evento ainda não terminou' });
        }

        if (event.dropClaimUntil && event.dropClaimUntil < now) {
            return res.status(400).json({ error: 'O prazo para resgate expirou' });
        }

        if (event.dropClaims.length > 0) {
            return res.status(400).json({ error: 'Você já resgatou este drop' });
        }

        // Verificar palavra-chave (case-insensitive)
        if (event.dropKeyword) {
            const normalizedInput = (keyword || '').trim().toLowerCase();
            const normalizedKeyword = event.dropKeyword.trim().toLowerCase();
            
            if (normalizedInput !== normalizedKeyword) {
                return res.status(400).json({ error: 'Palavra-chave incorreta' });
            }
        }

        // Dar o item ao usuário baseado no tipo
        // ownedCustomizations é uma string com IDs separados por vírgula
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { ownedCustomizations: true }
        });
        
        const currentOwned = user?.ownedCustomizations ? user.ownedCustomizations.split(',').filter(Boolean) : [];
        const itemId = event.dropItemId!;
        
        // Não duplicar se já tiver
        if (currentOwned.includes(itemId)) {
            return res.status(400).json({ error: 'Você já possui este item!' });
        }
        
        currentOwned.push(itemId);
        
        // Atualizar usuário com o item
        await prisma.user.update({
            where: { id: userId },
            data: { ownedCustomizations: currentOwned.join(',') }
        });

        // Registrar claim
        await prisma.eventDropClaim.create({
            data: {
                eventId: event.id,
                userId
            }
        });

        res.json({
            success: true,
            message: 'Drop resgatado com sucesso!',
            itemId: event.dropItemId,
            itemType: event.dropItemType
        });
    } catch (error) {
        console.error('Error claiming event drop:', error);
        res.status(500).json({ error: 'Failed to claim event drop' });
    }
};

// Buscar tags de eventos recentes (para sugestões no post)
export const getEventTags = async (_req: Request, res: Response) => {
    try {
        // Buscar eventos ativos ou recentes (últimos 30 dias) que tenham tag
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const events = await prisma.event.findMany({
            where: {
                tag: { not: null },
                OR: [
                    { active: true },
                    { date: { gte: thirtyDaysAgo } }
                ]
            },
            select: {
                id: true,
                title: true,
                tag: true,
                date: true,
                active: true
            },
            orderBy: { date: 'desc' },
            take: 10
        });

        // Retornar tags únicas com info do evento
        const tags = events
            .filter(e => e.tag)
            .map(e => ({
                tag: e.tag,
                eventTitle: e.title,
                eventDate: e.date,
                eventId: e.id,
                isActive: e.active
            }));

        res.json(tags);
    } catch (error) {
        console.error('Error fetching event tags:', error);
        res.status(500).json({ error: 'Failed to fetch event tags' });
    }
};
