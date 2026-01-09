// Logger utility - sends frontend logs to backend

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class FrontendLogger {
    private static instance: FrontendLogger;
    private originalConsoleLog: any;
    private originalConsoleWarn: any;
    private originalConsoleError: any;
    private isInitialized = false;

    private constructor() {
        this.originalConsoleLog = console.log;
        this.originalConsoleWarn = console.warn;
        this.originalConsoleError = console.error;
    }

    public static getInstance(): FrontendLogger {
        if (!FrontendLogger.instance) {
            FrontendLogger.instance = new FrontendLogger();
        }
        return FrontendLogger.instance;
    }

    public init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        console.log = (...args: any[]) => {
            this.log('INFO', args);
            this.originalConsoleLog.apply(console, args);
        };

        console.warn = (...args: any[]) => {
            this.log('WARN', args);
            this.originalConsoleWarn.apply(console, args);
        };

        console.error = (...args: any[]) => {
            this.log('ERROR', args);
            this.originalConsoleError.apply(console, args);
        };

        // Capture global errors
        window.onerror = (message, source, lineno, colno, error) => {
            this.log('ERROR', [message, `at ${source}:${lineno}:${colno}`], { stack: error?.stack });
        };

        // Capture unhandled promise rejections
        window.onunhandledrejection = (event) => {
            this.log('ERROR', ['Unhandled Promise Rejection:', event.reason]);
        };
    }

    private async log(level: LogLevel, messageArgs: any[], metadata?: any) {
        try {
            const message = messageArgs.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            // Prevent infinite loops if API call fails and logs an error
            if (message.includes('/logs')) return;
            
            // Don't send logs for non-critical messages (only send errors)
            if (level !== 'ERROR') return;

            // Send to backend
            // We use fetch directly to avoid circular dependency if api service uses logger
            // But here we imported api, let's use it carefully or just fetch
            // Using fetch to be safe and lightweight for logs
            const token = localStorage.getItem('token');
            
            // Don't try to send logs if no token (not authenticated)
            if (!token) return;

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${apiUrl}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    level,
                    source: 'FRONTEND',
                    message,
                    metadata
                })
            }).catch(() => {
                // Silently ignore logging errors to prevent blocking the app
            });
        } catch (error) {
            // Fail silently to avoid spamming console
        }
    }
}

export const logger = FrontendLogger.getInstance();
