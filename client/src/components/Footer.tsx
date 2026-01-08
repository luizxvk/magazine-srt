import { useAuth } from '../context/AuthContext';

export default function Footer() {
    const { theme } = useAuth();
    const version = 'v0.3.5-beta';
    const buildDate = 'Jan 2026';

    return (
        <footer className="fixed bottom-4 right-4 z-10 pointer-events-none">
            <div className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                {version} • {buildDate}
            </div>
        </footer>
    );
}
