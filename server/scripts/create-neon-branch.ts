#!/usr/bin/env tsx
/**
 * Script para criar branches Neon para novas comunidades
 * 
 * Uso:
 *   NEON_API_KEY=xxx NEON_PROJECT_ID=xxx npx tsx create-neon-branch.ts <branch-name>
 * 
 * Exemplo:
 *   NEON_API_KEY=neon_api_xxx NEON_PROJECT_ID=xxx npx tsx create-neon-branch.ts teste-mt-001
 */

interface NeonBranch {
  id: string;
  project_id: string;
  name: string;
  current_state: string;
  created_at: string;
}

interface NeonEndpoint {
  id: string;
  host: string;
  branch_id: string;
}

interface NeonRole {
  name: string;
  password?: string;
}

interface CreateBranchResponse {
  branch: NeonBranch;
  endpoints: NeonEndpoint[];
  connection_uris: { connection_uri: string }[];
}

const NEON_API_KEY = process.env.NEON_API_KEY;
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

async function createBranch(branchName: string): Promise<void> {
  if (!NEON_API_KEY) {
    console.error('❌ NEON_API_KEY não definida');
    console.log('\nDefina a variável de ambiente:');
    console.log('  export NEON_API_KEY="sua_api_key"');
    console.log('\nObtenha sua API key em: https://console.neon.tech/app/settings/api-keys');
    process.exit(1);
  }

  if (!NEON_PROJECT_ID) {
    console.error('❌ NEON_PROJECT_ID não definida');
    console.log('\nDefina a variável de ambiente:');
    console.log('  export NEON_PROJECT_ID="seu_project_id"');
    console.log('\nEncontre o Project ID no console Neon > Settings');
    process.exit(1);
  }

  console.log(`\n🌿 Criando branch "${branchName}" no projeto ${NEON_PROJECT_ID}...\n`);

  try {
    // 1. Buscar branches existentes para obter o parent
    const branchesRes = await fetch(
      `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
      {
        headers: {
          'Authorization': `Bearer ${NEON_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!branchesRes.ok) {
      const error = await branchesRes.text();
      throw new Error(`Erro ao buscar branches: ${error}`);
    }

    const { branches } = await branchesRes.json() as { branches: NeonBranch[] };
    
    // Verificar se branch já existe
    const existing = branches.find(b => b.name === branchName);
    if (existing) {
      console.log(`⚠️ Branch "${branchName}" já existe!`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Estado: ${existing.current_state}`);
      console.log(`   Criado: ${existing.created_at}`);
      return;
    }

    // Encontrar branch main/principal
    const mainBranch = branches.find(b => b.name === 'main' || b.name === 'master') || branches[0];
    if (!mainBranch) {
      throw new Error('Nenhum branch encontrado para usar como parent');
    }

    console.log(`📋 Branches existentes: ${branches.map(b => b.name).join(', ')}`);
    console.log(`🔗 Parent branch: ${mainBranch.name}`);

    // 2. Criar novo branch
    const createRes = await fetch(
      `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEON_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: {
            name: branchName,
            parent_id: mainBranch.id,
          },
          endpoints: [
            {
              type: 'read_write',
            },
          ],
        }),
      }
    );

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Erro ao criar branch: ${error}`);
    }

    const result = await createRes.json() as CreateBranchResponse;

    console.log('\n✅ Branch criado com sucesso!\n');
    console.log('📊 Detalhes:');
    console.log(`   Nome: ${result.branch.name}`);
    console.log(`   ID: ${result.branch.id}`);
    console.log(`   Estado: ${result.branch.current_state}`);

    if (result.connection_uris && result.connection_uris.length > 0) {
      console.log('\n🔐 Connection String:');
      console.log(`   ${result.connection_uris[0].connection_uri}`);
      
      console.log('\n📝 Próximos passos:');
      console.log('   1. Copie a connection string acima');
      console.log('   2. Vá em Vercel > Settings > Environment Variables');
      console.log('   3. Adicione/atualize DATABASE_URL com esse valor');
      console.log('   4. Faça redeploy do projeto');
    }

    if (result.endpoints && result.endpoints.length > 0) {
      console.log(`\n🌐 Endpoint: ${result.endpoints[0].host}`);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Executar
const branchName = process.argv[2];
if (!branchName) {
  console.error('❌ Nome do branch não fornecido');
  console.log('\nUso:');
  console.log('  NEON_API_KEY=xxx NEON_PROJECT_ID=xxx npx tsx create-neon-branch.ts <branch-name>');
  console.log('\nExemplo:');
  console.log('  npx tsx scripts/create-neon-branch.ts teste-mt-001');
  process.exit(1);
}

createBranch(branchName);
