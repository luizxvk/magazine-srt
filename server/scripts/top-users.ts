import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Usuários a excluir da lista (parcialmente - contém)
const EXCLUDED_PATTERNS = ['Admin', 'Luiz Guilherme', 'Nyx', 'NYX'];

async function getTopActiveUsers() {
  console.log('\n🏆 TOP 5 USUÁRIOS MAIS ATIVOS DO MAGAZINE\n');
  console.log('=' .repeat(60));

  // Buscar todos os usuários com contagem de interações
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      AND: EXCLUDED_PATTERNS.map(pattern => ({
        name: { not: { contains: pattern } }
      }))
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      _count: {
        select: {
          posts: true,
          comments: true,
          likes: true
        }
      }
    }
  });

  // Calcular pontuação total (posts valem mais, depois comentários, depois curtidas)
  const usersWithScore = users.map(user => ({
    name: user.displayName || user.name,
    posts: user._count.posts,
    comments: user._count.comments,
    likes: user._count.likes,
    totalInteractions: user._count.posts + user._count.comments + user._count.likes,
    // Score ponderado: posts = 5pts, comentários = 3pts, curtidas = 1pt
    weightedScore: (user._count.posts * 5) + (user._count.comments * 3) + (user._count.likes * 1)
  }));

  // Ordenar por score ponderado
  usersWithScore.sort((a, b) => b.weightedScore - a.weightedScore);

  // Top 5
  const top5 = usersWithScore.slice(0, 5);

  console.log('\n📊 Ranking por engajamento:\n');
  
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  
  top5.forEach((user, index) => {
    console.log(`${medals[index]} ${user.name}`);
    console.log(`   📝 Postagens: ${user.posts}`);
    console.log(`   💬 Comentários: ${user.comments}`);
    console.log(`   ❤️ Curtidas: ${user.likes}`);
    console.log(`   📈 Total de interações: ${user.totalInteractions}`);
    console.log('');
  });

  console.log('=' .repeat(60));
  console.log('\n✨ Esses são os membros mais engajados da comunidade!\n');

  // Formato para copiar para postagem
  console.log('\n📋 FORMATO PARA POSTAGEM:\n');
  console.log('─'.repeat(40));
  top5.forEach((user, index) => {
    console.log(`${medals[index]} ${user.name} - ${user.totalInteractions} interações`);
  });
  console.log('─'.repeat(40));

  await prisma.$disconnect();
}

getTopActiveUsers().catch(e => {
  console.error('Erro:', e);
  prisma.$disconnect();
  process.exit(1);
});
