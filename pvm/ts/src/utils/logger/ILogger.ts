export interface ILogger {
  log(message: string, level?: "info" | "warn" | "error" | "debug"): Promise<void> | void;
  purge(): Promise<void> | void;
}
