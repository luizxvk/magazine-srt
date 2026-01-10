import { useAuth } from '../context/AuthContext';
import buildInfo from '../buildInfo.json';
import packageJson from '../../package.json';

export default function Footer() {
    const { theme } = useAuth();
    const version = `v${packageJson.version}`;
    
    // Parse build info
    const commitHash = buildInfo.commit || 'dev';
    const buildDate = buildInfo.date 
        ? new Date(buildInfo.date).toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
          }).replace(/\//g, '').replace(/,/g, '').replace(/\s/g, '').replace(/:/g, '')
        : 'local';

    return (
        <footer className="fixed bottom-4 right-4 z-10 pointer-events-none">
            <div className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                {version}{commitHash}{buildDate}
            </div>
        </footer>
    );
}
