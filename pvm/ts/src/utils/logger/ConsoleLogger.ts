import { ILogger } from "./ILogger";

export class ConsoleLogger implements ILogger {
  private logBuffer: string[] = [];
  private readonly maxBufferSize: number = 1000;

  getLogs(lines: number = 100): string[] {
    return this.logBuffer.slice(-lines);
  }

  log(message: string, level: "info" | "warn" | "error" | "debug" = "info"): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Store in buffer
    this.logBuffer.push(logMessage);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    switch (level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "debug":
        console.debug(logMessage);
        break;
      case "info":
      default:
        console.log(logMessage);
        break;
    }
  }

  purge(): void {
    this.logBuffer = [];
    console.clear();
  }
}
