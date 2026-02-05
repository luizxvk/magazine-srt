import { Request, Response } from 'express';
import prisma from '../utils/prisma';

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
        const { title, description, date, category, game, imageUrl, linkedRewardId } = req.body;

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                category,
                game,
                imageUrl
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
