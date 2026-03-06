const { PrismaClient } = require('@prisma/client');

// Banco antigo (streetrunnerteam)
const oldDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_hR1B8qJriaxC@ep-dark-leaf-ac707sep.sa-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

// Banco novo (luizxvk)
const newDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_SPbuR5kMYlx4@ep-floral-cell-ac5cz2zf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function migrateTable(tableName, oldClient, newClient) {
  try {
    const data = await oldClient[tableName].findMany();
    if (data.length === 0) {
      console.log(`  [${tableName}] Vazia, pulando...`);
      return 0;
    }
    
    // Inserir em lotes de 100
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      try {
        await newClient[tableName].createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += batch.length;
      } catch (e) {
        // Se createMany falhar, tentar um por um
        for (const item of batch) {
          try {
            await newClient[tableName].create({ data: item });
            inserted++;
          } catch (itemError) {
            console.log(`    Erro ao inserir item em ${tableName}:`, itemError.message);
          }
        }
      }
    }
    
    console.log(`  [${tableName}] Migrado: ${inserted}/${data.length} registros`);
    return inserted;
  } catch (e) {
    console.log(`  [${tableName}] Erro: ${e.message}`);
    return 0;
  }
}

async function migrate() {
  console.log('=== MIGRAÇÃO DE DADOS NEON ===\n');
  console.log('De: streetrunnerteam (ep-dark-leaf-ac707sep)');
  console.log('Para: luizxvk (ep-floral-cell-ac5cz2zf)\n');
  
  try {
    // Testar conexões
    console.log('Testando conexões...');
    await oldDb.$connect();
    console.log('  ✓ Banco antigo conectado');
    await newDb.$connect();
    console.log('  ✓ Banco novo conectado\n');
    
    // Lista de tabelas para migrar (ordem importa por causa de FKs)
    // Tabelas sem dependências primeiro
    const tables = [
      'user',
      'badge',
      'userBadge',
      'reward',
      'redemption',
      'pointHistory',
      'zionHistory',
      'friendship',
      'notification',
      'pushSubscription',
      'story',
      'storyView',
      'message',
      'post',
      'postTag',
      'pollOption',
      'pollVote',
      'comment',
      'commentLike',
      'like',
      'inviteRequest',
      'sponsoredPostRequest',
      'announcement',
      'pageContent',
      'systemLog',
      'catalogPhoto',
      'zionPurchase',
      'event',
      'eventAttendee',
      'eventDropClaim',
      'tournament',
      'tournamentTeam',
      'tournamentTeamMember',
      'tournamentMatch',
      'moderationLog',
      'appSettings',
      'report',
      'group',
      'groupMember',
      'groupMessage',
      'groupMessageReaction',
      'groupMessageRead',
      'groupSettings',
      'groupInvite',
      'adminBadge',
      'marketListing',
      'marketTransaction',
      'marketFavorite',
      'marketOffer',
      'product',
      'productTag',
      'productKey',
      'order',
      'withdrawalRequest',
      'feedback',
      'subscription',
      'themePack',
      'userThemePack',
      'socialConnection',
      'socialActivity',
      'pixSellerRequest',
      'gameProfile',
      'gameSnapshot',
      'gameEvent',
      'coupon',
      'couponUsage',
      'challenge',
      'voiceChannel',
      'voiceParticipant',
      'textChannel',
      'systemConfig',
    ];
    
    console.log('Migrando tabelas...\n');
    
    let totalMigrated = 0;
    
    for (const table of tables) {
      const count = await migrateTable(table, oldDb, newDb);
      totalMigrated += count;
    }
    
    console.log(`\n=== MIGRAÇÃO CONCLUÍDA ===`);
    console.log(`Total de registros migrados: ${totalMigrated}`);
    
  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrate();
