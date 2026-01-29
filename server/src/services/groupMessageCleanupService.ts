import prisma from '../utils/prisma';

const MESSAGE_EXPIRY_DAYS = 7;

/**
 * Limpa mensagens de grupos públicos com mais de 7 dias
 * Roda automaticamente via cron job
 */
export const cleanupExpiredGroupMessages = async (): Promise<{ deleted: number }> => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - MESSAGE_EXPIRY_DAYS);

    console.log(`[GroupCleanup] Cleaning messages older than ${expiryDate.toISOString()}`);

    try {
        // Primeiro, deletar reações das mensagens antigas
        const deletedReactions = await prisma.groupMessageReaction.deleteMany({
            where: {
                message: {
                    createdAt: { lt: expiryDate },
                    group: { isPrivate: false } // Apenas grupos públicos
                }
            }
        });

        // Depois, deletar leituras das mensagens antigas
        const deletedReads = await prisma.groupMessageRead.deleteMany({
            where: {
                message: {
                    createdAt: { lt: expiryDate },
                    group: { isPrivate: false }
                }
            }
        });

        // Por fim, deletar as mensagens em si
        const deletedMessages = await prisma.groupMessage.deleteMany({
            where: {
                createdAt: { lt: expiryDate },
                group: { isPrivate: false }
            }
        });

        console.log(`[GroupCleanup] Deleted ${deletedMessages.count} messages, ${deletedReactions.count} reactions, ${deletedReads.count} reads`);

        return { deleted: deletedMessages.count };
    } catch (error) {
        console.error('[GroupCleanup] Error cleaning up messages:', error);
        throw error;
    }
};

/**
 * Verifica se uma mensagem vai expirar em breve (menos de 1 dia)
 */
export const getMessageExpiryInfo = (createdAt: Date): { expiresIn: number; isExpiring: boolean } => {
    const now = new Date();
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + MESSAGE_EXPIRY_DAYS);
    
    const msUntilExpiry = expiryDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));
    
    return {
        expiresIn: Math.max(0, daysUntilExpiry),
        isExpiring: daysUntilExpiry <= 1 && daysUntilExpiry > 0
    };
};
