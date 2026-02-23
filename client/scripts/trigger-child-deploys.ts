/**
 * Deploy Hook Script
 * 
 * Este script dispara redeploys em todas as comunidades filhas
 * quando o magazine-frontend (template) é atualizado.
 * 
 * Uso:
 * 1. Configure os deploy hooks no Vercel para cada projeto filho
 * 2. Adicione os hooks no arquivo .env ou communities.json
 * 3. Execute: node scripts/trigger-child-deploys.js
 * 
 * Para configurar no Vercel:
 * 1. Vá em Settings > Git > Deploy Hooks do projeto filho
 * 2. Crie um hook com nome "Parent Template Update"
 * 3. Copie a URL gerada e adicione aqui
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega comunidades do arquivo ou env
const loadCommunities = () => {
  const communitiesFile = path.join(__dirname, '../communities.json');
  
  if (fs.existsSync(communitiesFile)) {
    const data = JSON.parse(fs.readFileSync(communitiesFile, 'utf-8'));
    return data.communities || [];
  }
  
  // Fallback para variável de ambiente
  const envHooks = process.env.CHILD_DEPLOY_HOOKS;
  if (envHooks) {
    return envHooks.split(',').map((hook, i) => ({
      name: `Community ${i + 1}`,
      deployHook: hook.trim(),
    }));
  }
  
  return [];
};

// Interface para comunidade
interface Community {
  name: string;
  subdomain?: string;
  deployHook: string;
  vercelProjectId?: string;
}

// Dispara deploy em uma comunidade
const triggerDeploy = async (community: Community): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`🚀 Triggering deploy for: ${community.name}`);
    
    const response = await fetch(community.deployHook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log(`✅ Deploy triggered for ${community.name}:`, data);
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to trigger deploy for ${community.name}:`, error);
    return { success: false, error: String(error) };
  }
};

// Main
const main = async () => {
  console.log('🔄 Magazine Template Deploy Hook Trigger');
  console.log('========================================\n');
  
  const communities = loadCommunities();
  
  if (communities.length === 0) {
    console.log('⚠️  No child communities configured.');
    console.log('\nTo configure:');
    console.log('1. Create a communities.json file with:');
    console.log(`   {
     "communities": [
       {
         "name": "Teste MT 001",
         "subdomain": "teste-mt-001",
         "deployHook": "https://api.vercel.com/v1/integrations/deploy/..."
       }
     ]
   }`);
    console.log('\n2. Or set CHILD_DEPLOY_HOOKS env var with comma-separated hooks');
    return;
  }
  
  console.log(`Found ${communities.length} child communities to update:\n`);
  communities.forEach((c: Community) => console.log(`  - ${c.name} (${c.subdomain || 'no subdomain'})`));
  console.log('');
  
  // Trigger all deploys in parallel
  const results = await Promise.all(communities.map(triggerDeploy));
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n========================================');
  console.log(`📊 Summary: ${successful} successful, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
};

main().catch(console.error);
