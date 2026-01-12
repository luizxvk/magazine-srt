import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanBadges() {
    try {
        console.log('🗑️  Cleaning old badges...');

        // Keep only these essential badges
        const essentialBadges = [
            'Primeiros Passos',
            'Identidade Revelada',
            'Criador de Conteúdo',
            'Comentador',
            'Primeira Conexão',
            'Popular',
            'Colecionador de Zions',
            'Milionário',
            'Veterano',
            'Beta Tester'
        ];

        // Delete all badges NOT in the essential list
        const result = await prisma.badge.deleteMany({
            where: {
                name: {
                    notIn: essentialBadges
                }
            }
        });

        console.log(`✅ Deleted ${result.count} old badges`);
        console.log('✅ Database now has only 10 essential badges');

    } catch (error) {
        console.error('Error cleaning badges:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanBadges();
