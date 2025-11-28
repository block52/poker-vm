import { ILogger } from "./ILogger";
import { createClient, RedisClientType } from "redis";

export class RedisLogger implements ILogger {
  private client: RedisClientType;
  private logKey: string;
  private isConnected: boolean = false;

  constructor(
    redisUrl: string = "redis://localhost:6379",
    logKey: string = "pvm:logs"
  ) {
    this.client = createClient({ url: redisUrl });
    this.logKey = logKey;

    this.client.on("error", (err: Error) => {
      console.error("Redis Client Error:", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      this.isConnected = true;
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async log(message: string, level: "info" | "warn" | "error" | "debug" = "info"): Promise<void> {
    try {
      await this.ensureConnected();

      const timestamp = new Date().toISOString();
      const logEntry = JSON.stringify({
        timestamp,
        level,
        message
      });

      await this.client.rPush(this.logKey, logEntry);
    } catch (error) {
      console.error("Error writing to Redis log:", error);
    }
  }

  async purge(): Promise<void> {
    try {
      await this.ensureConnected();
      await this.client.del(this.logKey);
    } catch (error) {
      console.error("Error purging Redis logs:", error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}
