import { ILogger } from "./ILogger";
import { MongoClient, Db, Collection } from "mongodb";

interface LogDocument {
  timestamp: Date;
  level: string;
  message: string;
}

export class MongoDBLogger implements ILogger {
  private client: MongoClient;
  private db?: Db;
  private collection?: Collection<LogDocument>;
  private readonly dbName: string;
  private readonly collectionName: string;
  private isConnected: boolean = false;

  constructor(
    mongoUrl: string = "mongodb://localhost:27017",
    dbName: string = "pvm",
    collectionName: string = "logs"
  ) {
    this.client = new MongoClient(mongoUrl);
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection<LogDocument>(this.collectionName);
      this.isConnected = true;
    }
  }

  async log(message: string, level: "info" | "warn" | "error" | "debug" = "info"): Promise<void> {
    try {
      await this.ensureConnected();

      const logDocument: LogDocument = {
        timestamp: new Date(),
        level,
        message
      };

      await this.collection?.insertOne(logDocument);
    } catch (error) {
      console.error("Error writing to MongoDB log:", error);
    }
  }

  async purge(): Promise<void> {
    try {
      await this.ensureConnected();
      await this.collection?.deleteMany({});
    } catch (error) {
      console.error("Error purging MongoDB logs:", error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}
