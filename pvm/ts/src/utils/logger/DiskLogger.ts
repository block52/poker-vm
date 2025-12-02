import { ILogger } from "./ILogger";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as os from "os";

export class DiskLogger implements ILogger {
  private logPath: string;
  private readonly maxFileSize: number = 50 * 1024 * 1024; // 50MB in bytes
  private currentLogFile: string;

  constructor(logPath?: string) {
    if (logPath) {
      this.logPath = logPath;
    } else {
      // Use OS temp directory by default: /tmp/pvm on Linux/Mac, %TEMP%\pvm on Windows
      this.logPath = path.join(os.tmpdir(), "pvm");
    }

    this.currentLogFile = path.join(this.logPath, "app.log");
    this.ensureLogDirectory();
  }

  getLogPath(): string {
    return this.currentLogFile;
  }

  private ensureLogDirectory(): void {
    if (!fsSync.existsSync(this.logPath)) {
      fsSync.mkdirSync(this.logPath, { recursive: true });
    }
  }

  private async rotateLogFile(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile);

      if (stats.size >= this.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const archivedFile = path.join(
          this.logPath,
          `app-${timestamp}.log`
        );

        await fs.rename(this.currentLogFile, archivedFile);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Error rotating log file:", error);
      }
    }
  }

  async log(message: string, level: "info" | "warn" | "error" | "debug" = "info"): Promise<void> {
    await this.rotateLogFile();

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    try {
      await fs.appendFile(this.currentLogFile, logMessage, "utf8");
    } catch (error) {
      console.error("Error writing to log file:", error);
    }
  }

  async purge(): Promise<void> {
    try {
      const files = await fs.readdir(this.logPath);
      const logFiles = files.filter(file => file.endsWith(".log"));

      await Promise.all(
        logFiles.map(file => fs.unlink(path.join(this.logPath, file)))
      );
    } catch (error) {
      console.error("Error purging log files:", error);
    }
  }

  /**
   * Get the latest log entries
   * @param lines Number of lines to return (default 100)
   * @returns Array of log lines
   */
  async getLogs(lines: number = 100): Promise<string[]> {
    try {
      const content = await fs.readFile(this.currentLogFile, "utf8");
      const allLines = content.split("\n").filter(line => line.trim() !== "");
      // Return the last N lines
      return allLines.slice(-lines);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return []; // No log file exists yet
      }
      console.error("Error reading log file:", error);
      return [];
    }
  }
}
