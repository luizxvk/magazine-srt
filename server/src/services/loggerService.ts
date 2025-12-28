
interface LogEntry {
    timestamp: string;
    level: 'info' | 'error' | 'warn' | 'debug';
    message: string;
    data?: any;
}

class LoggerService {
    private logs: LogEntry[] = [];
    private readonly MAX_LOGS = 1000;

    constructor() {
        this.overrideConsole();
    }

    private overrideConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            this.addLog('info', args);
            originalLog.apply(console, args);
        };

        console.error = (...args) => {
            this.addLog('error', args);
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            this.addLog('warn', args);
            originalWarn.apply(console, args);
        };
    }

    private addLog(level: LogEntry['level'], args: any[]) {
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message
        };

        this.logs.unshift(entry); // Add to beginning

        if (this.logs.length > this.MAX_LOGS) {
            this.logs.pop();
        }
    }

    public getLogs(limit: number = 100, level?: string) {
        let filtered = this.logs;
        if (level) {
            filtered = filtered.filter(log => log.level === level);
        }
        return filtered.slice(0, limit);
    }

    public getSystemStats() {
        const memoryUsage = process.memoryUsage();
        return {
            uptime: process.uptime(),
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            },
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid
        };
    }
}

export const logger = new LoggerService();
