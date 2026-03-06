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
    
    // Write to src/ for module import
    const srcOutputPath = join(__dirname, '..', 'src', 'buildInfo.json');
    writeFileSync(srcOutputPath, JSON.stringify(buildInfo, null, 2));
    
    // Write to public/ for fetching in production
    const publicOutputPath = join(__dirname, '..', 'public', 'buildInfo.json');
    writeFileSync(publicOutputPath, JSON.stringify(buildInfo, null, 2));
    
    console.log('✅ Build info generated:', buildInfo);
} catch (error) {
    console.error('❌ Failed to generate build info:', error);
    // Fallback to dev info
    const buildInfo = {
        commit: 'dev',
        date: new Date().toISOString(),
        buildTime: new Date().toISOString()
    };
    // Write to both src/ and public/
    const srcOutputPath = join(__dirname, '..', 'src', 'buildInfo.json');
    writeFileSync(srcOutputPath, JSON.stringify(buildInfo, null, 2));
    const publicOutputPath = join(__dirname, '..', 'public', 'buildInfo.json');
    writeFileSync(publicOutputPath, JSON.stringify(buildInfo, null, 2));
}
