import Store from "electron-store";
import { app } from "electron";
import Database from "better-sqlite3";
import path from "path";

export interface AppSettings {
    nodeUrls: string[];
    useVPN: boolean;
    connectedNodes: number;
    theme: "dark" | "light";
    autoConnect: boolean;
    networkTimeout: number;
    lastConnectedNode: string | null;
}

export interface WalletData {
    layer1Balance: number;
    block52Balance: number;
    lastUpdated: string;
}

class SettingsManager {
    private db: Database.Database;
    private settingsStore: Store<AppSettings>;

    constructor() {
        // Initialize SQLite database for general settings and data
        const dbPath = path.join(app.getPath("userData"), "poker-settings.db");
        this.db = new Database(dbPath);

        // Initialize encrypted store for sensitive data
        this.settingsStore = new Store<AppSettings>({
            name: "app-settings",
            defaults: {
                nodeUrls: ["https://node1.block52.xyz", "https://node.texashodl.io"],
                useVPN: false,
                connectedNodes: 0,
                theme: "dark",
                autoConnect: true,
                networkTimeout: 5000,
                lastConnectedNode: null
            }
        });

        this.initializeTables();
    }

    private initializeTables() {
        // Create tables for non-sensitive data
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallet_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        layer1_balance REAL,
        block52_balance REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        this.db.exec(`
      CREATE TABLE IF NOT EXISTS node_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_url TEXT NOT NULL,
        connection_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL
      )
    `);
    }

    // Settings methods
    getSettings(): AppSettings {
        return this.settingsStore.store;
    }

    updateSettings(settings: Partial<AppSettings>) {
        Object.assign(this.settingsStore.store, settings);
    }

    addNodeUrl(nodeUrl: string) {
        const settings = this.getSettings();
        if (!settings.nodeUrls.includes(nodeUrl)) {
            settings.nodeUrls.push(nodeUrl);
            this.updateSettings({ nodeUrls: settings.nodeUrls });

            // Log to database
            const stmt = this.db.prepare("INSERT INTO node_history (node_url, status) VALUES (?, ?)");
            stmt.run(nodeUrl, "added");
        }
    }

    toggleVPN() {
        const settings = this.getSettings();
        this.updateSettings({ useVPN: !settings.useVPN });
        return !settings.useVPN;
    }

    // Transaction methods
    addTransaction(transaction: any) {
        const stmt = this.db.prepare(`
      INSERT INTO transactions (id, type, amount, currency, date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(transaction.id, transaction.type, transaction.amount, transaction.currency, transaction.date, transaction.status);
    }

    getTransactions(limit: number = 10) {
        const stmt = this.db.prepare("SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?");
        return stmt.all(limit);
    }

    // Wallet balance methods
    updateWalletBalance(layer1Balance: number, block52Balance: number) {
        const stmt = this.db.prepare(`
      INSERT INTO wallet_history (layer1_balance, block52_balance)
      VALUES (?, ?)
    `);
        stmt.run(layer1Balance, block52Balance);
    }

    getLatestBalance(): WalletData | null {
        const stmt = this.db.prepare(`
      SELECT layer1_balance, block52_balance, timestamp as lastUpdated
      FROM wallet_history
      ORDER BY timestamp DESC
      LIMIT 1
    `);
        return stmt.get() as WalletData | null;
    }

    // Node management
    updateConnectedNodes(count: number) {
        this.updateSettings({ connectedNodes: count });
    }

    close() {
        this.db.close();
    }
}

export default SettingsManager;
