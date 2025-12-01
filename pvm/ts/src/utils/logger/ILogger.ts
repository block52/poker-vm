export interface ILogger {
  getLogs(lines?: number): Promise<string[]> | string[];
  log(message: string, level?: "info" | "warn" | "error" | "debug"): Promise<void> | void;
  purge(): Promise<void> | void;
}
