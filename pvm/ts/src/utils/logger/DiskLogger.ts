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
      const defaultLogDir = os.platform() === "win32"
        ? path.join(process.env.APPDATA || os.homedir(), "logs")
        : path.join(os.homedir(), "Library", "Logs");
      this.logPath = path.join(defaultLogDir, "pvm");
    }

    this.currentLogFile = path.join(this.logPath, "app.log");
    this.ensureLogDirectory();
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
}
