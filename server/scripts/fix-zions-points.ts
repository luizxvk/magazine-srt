/**
 * Script para corrigir os Zions Points de todos os usuários
 * Recalcula baseado no ZionHistory (que estava sendo registrado corretamente)
 * e atualiza o campo zionsPoints que não estava sendo incrementado
 * 
 * FILTRO: Apenas a partir de 05/02/2026 (lançamento v5.0 RC)
 * APENAS: zionsPoints (não mexe em zionsCash)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data do lançamento v5.0 RC - só conta a partir daqui
const LAUNCH_DATE = new Date('2026-02-05T00:00:00.000Z');

async function fixZionsPoints() {
  console.log('🔧 Iniciando correção de Zions Points...');
  console.log(`📅 Filtrando histórico a partir de: ${LAUNCH_DATE.toISOString()}\n`);

  try {
    // 1. Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        zionsPoints: true,
      }
    });

    console.log(`📊 Total de usuários: ${users.length}\n`);

    let totalFixed = 0;
    let totalPointsAwarded = 0;

    // 2. Para cada usuário, calcular o total de Zions POINTS do histórico (a partir da data de lançamento)
    for (const user of users) {
      // Buscar soma de POINTS do histórico APENAS a partir de 05/02/2026
      const pointsHistory = await prisma.zionHistory.aggregate({
        where: {
          userId: user.id,
          currency: 'POINTS',
          createdAt: {
            gte: LAUNCH_DATE
          }
        },
        _sum: {
          amount: true
        }
      });

      const expectedPoints = pointsHistory._sum.amount || 0;
      
      // Calcular diferença (o que faltou creditar)
      const pointsDiff = expectedPoints - (user.zionsPoints || 0);

      // Se há diferença positiva, atualizar
      if (pointsDiff > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            zionsPoints: expectedPoints,
            // Também atualizar o campo deprecated para consistência
            zions: { increment: pointsDiff }
          }
        });

        console.log(`✅ ${user.name}: +${pointsDiff} Points (Total: ${expectedPoints} Points)`);
        totalFixed++;
        totalPointsAwarded += pointsDiff;
      }
    }

    console.log('\n========================================');
    console.log(`✅ Correção concluída!`);
    console.log(`📊 Usuários corrigidos: ${totalFixed}`);
    console.log(`💰 Total de Points creditados: ${totalPointsAwarded}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Erro ao corrigir Zions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixZionsPoints()
  .then(() => {
    console.log('Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script falhou:', error);
    process.exit(1);
  });
