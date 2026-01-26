/**
 * Script para limpar badges duplicados
 * Mantém apenas o primeiro badge de cada nome e remove duplicatas
 * 
 * Executar: npx ts-node clean_badges.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateBadges() {
    console.log('🔍 Buscando badges duplicados...');
    
    // Buscar todos os badges agrupados por nome
    const allBadges = await prisma.badge.findMany({
        orderBy: { name: 'asc' }
    });
    
    // Agrupar por nome
    const badgesByName: Record<string, typeof allBadges> = {};
    for (const badge of allBadges) {
        if (!badgesByName[badge.name]) {
            badgesByName[badge.name] = [];
        }
        badgesByName[badge.name].push(badge);
    }
    
    let totalDuplicates = 0;
    let totalDeleted = 0;
    
    for (const [name, badges] of Object.entries(badgesByName)) {
        if (badges.length > 1) {
            console.log(`⚠️  "${name}" tem ${badges.length} entradas (duplicado!)`);
            totalDuplicates++;
            
            // Manter o primeiro, deletar os outros
            const [keep, ...duplicates] = badges;
            console.log(`   ✅ Mantendo: ${keep.id}`);
            
            for (const dup of duplicates) {
                console.log(`   🗑️  Deletando: ${dup.id}`);
                
                // Primeiro, atualizar UserBadges que apontam para este badge duplicado
                // para apontar para o badge que estamos mantendo
                const updatedUserBadges = await prisma.userBadge.updateMany({
                    where: { badgeId: dup.id },
                    data: { badgeId: keep.id }
                });
                
                if (updatedUserBadges.count > 0) {
                    console.log(`   📝 ${updatedUserBadges.count} UserBadges redirecionados`);
                }
                
                // Agora deletar o badge duplicado
                try {
                    await prisma.badge.delete({ where: { id: dup.id } });
                    totalDeleted++;
                } catch (error) {
                    console.log(`   ⚠️  Não foi possível deletar (pode ter referências): ${error}`);
                }
            }
        }
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   Total de badges únicos: ${Object.keys(badgesByName).length}`);
    console.log(`   Badges com duplicatas: ${totalDuplicates}`);
    console.log(`   Duplicatas removidas: ${totalDeleted}`);
    
    // Listar badges finais
    const finalBadges = await prisma.badge.findMany({ orderBy: { name: 'asc' } });
    console.log('\n✅ Badges finais:');
    for (const badge of finalBadges) {
        console.log(`   - ${badge.name} (${badge.id})`);
    }
}

cleanDuplicateBadges()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
