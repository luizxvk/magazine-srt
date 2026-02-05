import prisma from '../src/utils/prisma';

async function main() {
    console.log('=== Últimas 15 transações de ZionHistory ===\n');
    
    const recent = await prisma.zionHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
            user: { select: { name: true, displayName: true } }
        }
    });
    
    recent.forEach((r, i) => {
        const userName = r.user?.displayName || r.user?.name || 'N/A';
        console.log(`${i + 1}. [${r.currency || 'N/A'}] ${r.amount > 0 ? '+' : ''}${r.amount}`);
        console.log(`   Usuário: ${userName}`);
        console.log(`   Motivo: ${r.reason}`);
        console.log(`   Data: ${r.createdAt.toISOString()}`);
        console.log('');
    });
    
    // Buscar especificamente recargas
    console.log('\n=== Recargas (contendo "Recarga" ou "Cash") ===\n');
    
    const recargas = await prisma.zionHistory.findMany({
        where: {
            OR: [
                { reason: { contains: 'Recarga', mode: 'insensitive' } },
                { reason: { contains: 'Cash', mode: 'insensitive' } },
                { currency: 'CASH' }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            user: { select: { name: true } }
        }
    });
    
    if (recargas.length === 0) {
        console.log('Nenhuma recarga encontrada no banco.');
    } else {
        recargas.forEach((r, i) => {
            console.log(`${i + 1}. [${r.currency || 'N/A'}] ${r.amount > 0 ? '+' : ''}${r.amount} - ${r.reason}`);
        });
    }
    
    // Verificar ZionPurchase (tabela de compras de Zions)
    console.log('\n=== ZionPurchase (compras pendentes/aprovadas) ===\n');
    
    const purchases = await prisma.zionPurchase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            user: { select: { name: true } }
        }
    });
    
    if (purchases.length === 0) {
        console.log('Nenhuma compra de Zions encontrada.');
    } else {
        purchases.forEach((p, i) => {
            console.log(`${i + 1}. [${p.status}] ${p.amount} Zions por R$ ${p.price}`);
            console.log(`   Usuário: ${p.user.name}`);
            console.log(`   PaymentId: ${p.paymentId || 'N/A'}`);
            console.log(`   Data: ${p.createdAt.toISOString()}`);
            console.log('');
        });
    }
    
    await prisma.$disconnect();
}

main().catch(console.error);
