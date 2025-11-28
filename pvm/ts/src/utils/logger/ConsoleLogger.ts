import { ILogger } from "./ILogger";

export class ConsoleLogger implements ILogger {
  log(message: string, level: "info" | "warn" | "error" | "debug" = "info"): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

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
    console.clear();
  }
}
