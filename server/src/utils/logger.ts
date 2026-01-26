import prisma from './prisma';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';
type LogSource = 'BACKEND' | 'FRONTEND';

// Flag to disable DB logging when connection issues occur
let dbLoggingEnabled = false; // DISABLED - consuming connections and causing issues

class Logger {
    private static instance: Logger;
    private originalConsoleLog: any;
    private originalConsoleWarn: any;
    private originalConsoleError: any;

    private constructor() {
        this.originalConsoleLog = console.log;
        this.originalConsoleWarn = console.warn;
        this.originalConsoleError = console.error;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public init() {
        // Only intercept if DB logging is enabled
        if (!dbLoggingEnabled) return;
        
        console.log = (...args: any[]) => {
            this.log('INFO', 'BACKEND', args);
            this.originalConsoleLog.apply(console, args);
        };

        console.warn = (...args: any[]) => {
            this.log('WARN', 'BACKEND', args);
            this.originalConsoleWarn.apply(console, args);
        };

        console.error = (...args: any[]) => {
            this.log('ERROR', 'BACKEND', args);
            this.originalConsoleError.apply(console, args);
        };
    }

    public async log(level: LogLevel, source: LogSource, messageArgs: any[], metadata?: any) {
        // Skip if DB logging disabled
        if (!dbLoggingEnabled) return;
        
        try {
            const message = messageArgs.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            // Avoid logging the log saving itself to prevent infinite loops if something goes wrong
            if (message.includes('SystemLog')) return;

            await prisma.systemLog.create({
                data: {
                    level,
                    source,
                    message,
                    metadata: metadata ? JSON.stringify(metadata) : undefined
                }
            });
        } catch (error) {
            // Disable DB logging on failure to prevent connection pool exhaustion
            dbLoggingEnabled = false;
        }
    }
}

export const logger = Logger.getInstance();
