import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeElite() {
    const user = await prisma.user.findFirst({
        where: { email: 'luizguilherme011@gmail.com' },
        select: { id: true, name: true, isElite: true, eliteUntil: true }
    });
    
    if (!user) {
        console.log('❌ Usuário não encontrado');
        return;
    }
    
    console.log('👤 Usuário encontrado:', user);
    
    // Remover Elite do usuário
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isElite: false,
            eliteUntil: null,
            eliteSince: null,
            eliteStreak: 0
        }
    });
    
    // Cancelar todas as assinaturas ativas
    const result = await prisma.subscription.updateMany({
        where: { userId: user.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'Removido manualmente pelo admin' }
    });
    
    console.log('📋 Assinaturas canceladas:', result.count);
    console.log('✅ Elite removido com sucesso de', user.name);
}

removeElite()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(e => { 
        console.error('❌ Erro:', e); 
        process.exit(1); 
    });
