import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    const commit = execSync('git log -1 --format=%h').toString().trim();
    const date = execSync('git log -1 --format=%ci').toString().trim();
    
    const buildInfo = {
        commit,
        date,
        buildTime: new Date().toISOString()
    };
    
    const outputPath = join(__dirname, '..', 'src', 'buildInfo.json');
    writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
    
    console.log('✅ Build info generated:', buildInfo);
} catch (error) {
    console.error('❌ Failed to generate build info:', error);
    // Fallback to dev info
    const buildInfo = {
        commit: 'dev',
        date: new Date().toISOString(),
        buildTime: new Date().toISOString()
    };
    const outputPath = join(__dirname, '..', 'src', 'buildInfo.json');
    writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
}
