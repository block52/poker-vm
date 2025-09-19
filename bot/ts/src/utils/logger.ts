import Redis from "ioredis";
import chalk from "chalk";

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
    private static instance: Logger | null = null;
    private redis: Redis | null = null;
    private component: string;

    // Private constructor prevents direct instantiation
    private constructor(component: string = "bot") {
        this.component = component;
        try {
            this.redis = new Redis({
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT || "6379"),
                password: process.env.REDIS_PASSWORD || "Passw0rd123",
                maxRetriesPerRequest: 1,
                lazyConnect: true
            });

            // Add connection event handlers
            this.redis.on('connect', () => {
                console.log(chalk.green(`✅ Redis connected to ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`));
            });

            this.redis.on('error', (error) => {
                console.error(chalk.red(`❌ Redis error: ${error.message}`));
                if (error.message.includes('NOAUTH')) {
                    console.error(chalk.red(`🔐 The Redis instance at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT} requires authentication!`));
                    console.error(chalk.yellow(`💡 Check if you're connecting to the right Redis instance`));
                }
            });

            // Test connection with better error handling
            this.redis.ping()
                .then(() => {
                    console.log(chalk.green(`🏓 Redis ping successful`));
                })
                .catch((error) => {
                    console.error(chalk.red(`🏓 Redis ping failed: ${error.message}`));
                    this.redis = null;
                });

        } catch (error) {
            console.warn(chalk.yellow("Redis initialization failed, continuing without Redis logging"));
            console.error(error);
            this.redis = null;
        }
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

        // Always console log first
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${level.toUpperCase()}] ${this.component}:`;

        switch (level) {
            case LogLevel.DEBUG:
                console.log(chalk.gray(`${timestamp} ${prefix} ${message}`), data ? data : "");
                break;
            case LogLevel.INFO:
                console.log(chalk.green(`${timestamp} ${prefix} ${message}`), data ? data : "");
                break;
            case LogLevel.WARN:
                console.log(chalk.yellow(`${timestamp} ${prefix} ${message}`), data ? data : "");
                break;
            case LogLevel.ERROR:
                console.log(chalk.red(`${timestamp} ${prefix} ${message}`), data ? data : "");
                break;
        }

        // Try Redis logging if available
        if (this.redis) {
            try {
                const key = `logs:${this.component}:${Date.now()}`;
                await this.redis.setex(key, 604800, JSON.stringify(logEntry));
                await this.redis.zadd(`logs:${this.component}:index`, Date.now(), key);
            } catch (error) {
                // Disable Redis on error to prevent spam
                console.warn(chalk.yellow("Redis logging disabled due to error"));
                console.error(chalk.red(`Redis error details: ${error}`));
                this.redis = null;
            }
        }
    }

    // Static method to get the singleton instance
    public static getInstance(component: string = "poker-bot"): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(component);
        }
        return Logger.instance;
    }

    // Optional: Method to reset singleton (useful for testing)
    public static resetInstance(): void {
        if (Logger.instance) {
            Logger.instance.close();
            Logger.instance = null;
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
        if (!this.redis) {
            console.warn("Redis is not available, cannot retrieve logs.");
            return [];
        }
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
        if (this.redis) {
            await this.redis.quit();
        }
    }
}

// Export the singleton instance getter
export const logger = Logger.getInstance("poker-bot");

// Alternative usage:
// export { Logger };
// const logger = Logger.getInstance("my-component");