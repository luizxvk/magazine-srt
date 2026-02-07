// Script para remover Elite de usuário usando conexão Neon
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://neondb_owner:npg_hR1B8qJriaxC@ep-dark-leaf-ac707sep.sa-east-1.aws.neon.tech/neondb?sslmode=require'
        }
    }
});

async function main() {
    const email = 'luizguilherme011@gmail.com';
    
    console.log(`Removendo Elite de ${email}...`);
    
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, isElite: true, eliteUntil: true }
    });
    
    if (!user) {
        console.log('Usuário não encontrado!');
        return;
    }
    
    console.log('Antes:', user);
    
    const updated = await prisma.user.update({
        where: { email },
        data: {
            isElite: false,
            eliteUntil: null,
            eliteSince: null,
            eliteStreak: 0
        },
        select: { id: true, name: true, isElite: true, eliteUntil: true }
    });
    
    console.log('Depois:', updated);
    console.log('✅ Elite removido com sucesso!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
