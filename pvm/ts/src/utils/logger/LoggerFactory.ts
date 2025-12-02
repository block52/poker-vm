import { ILogger } from "./ILogger";
import { DiskLogger } from "./DiskLogger";

export class LoggerFactory {
  private static instance: ILogger | null = null;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public static getInstance(): ILogger {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new DiskLogger();
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
