import Redis from "ioredis";

export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
    component?: string;
    userId?: string;
    gameId?: string;
}

export class Logger {
    private redis: Redis;
    private component: string;

    constructor(component: string = "bot") {
        this.component = component;
        this.redis = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3
        });
    }

    private async writeLog(level: LogLevel, message: string, data?: any, gameId?: string, userId?: string): Promise<void> {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            component: this.component,
            userId,
            gameId
        };

        try {
            // Store in Redis with TTL of 7 days
            const key = `logs:${this.component}:${Date.now()}`;
            await this.redis.setex(key, 604800, JSON.stringify(logEntry));

            // Also add to a sorted set for easy querying
            await this.redis.zadd(`logs:${this.component}:index`, Date.now(), key);

            // Console log for development
            console.log(`[${level.toUpperCase()}] ${this.component}: ${message}`, data ? data : "");
        } catch (error) {
            console.error("Failed to write log to Redis:", error);
        }
    }

    debug(message: string, data?: any, gameId?: string, userId?: string): void {
        this.writeLog(LogLevel.DEBUG, message, data, gameId, userId);
    }

    info(message: string, data?: any, gameId?: string, userId?: string): void {
        this.writeLog(LogLevel.INFO, message, data, gameId, userId);
    }

    warn(message: string, data?: any, gameId?: string, userId?: string): void {
        this.writeLog(LogLevel.WARN, message, data, gameId, userId);
    }

    error(message: string, data?: any, gameId?: string, userId?: string): void {
        this.writeLog(LogLevel.ERROR, message, data, gameId, userId);
    }

    async getLogs(limit: number = 100): Promise<LogEntry[]> {
        try {
            const keys = await this.redis.zrevrange(`logs:${this.component}:index`, 0, limit - 1);
            const logs: LogEntry[] = [];

            for (const key of keys) {
                const logData = await this.redis.get(key);
                if (logData) {
                    logs.push(JSON.parse(logData));
                }
            }

            return logs;
        } catch (error) {
            console.error("Failed to retrieve logs from Redis:", error);
            return [];
        }
    }

    async close(): Promise<void> {
        await this.redis.quit();
    }
}

// Export singleton instance
export const logger = new Logger("poker-bot");
