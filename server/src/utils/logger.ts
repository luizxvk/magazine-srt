import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type LogLevel = 'INFO' | 'WARN' | 'ERROR';
type LogSource = 'BACKEND' | 'FRONTEND';

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
            // Fallback to original console if DB fails, to avoid losing the error
            this.originalConsoleError('Failed to save log to DB:', error);
        }
    }
}

export const logger = Logger.getInstance();
