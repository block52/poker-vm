import { ILogger } from "./ILogger";
import { ConsoleLogger } from "./ConsoleLogger";

export class LoggerFactory {
  private static instance: ILogger | null = null;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public static getInstance(): ILogger {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new ConsoleLogger();
    }
    return LoggerFactory.instance;
  }

  public static setLogger(logger: ILogger): void {
    LoggerFactory.instance = logger;
  }

  public static resetLogger(): void {
    LoggerFactory.instance = null;
  }
}
