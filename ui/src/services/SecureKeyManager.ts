import { safeStorage } from "electron";

export interface PrivateKeyData {
    keyId: string;
    encryptedKey: string;
    keyType: "ethereum" | "block52";
    alias: string;
    createdAt: string;
}

class SecureKeyManager {
    private static instance: SecureKeyManager;
    private keys: Map<string, PrivateKeyData> = new Map();

    static getInstance(): SecureKeyManager {
        if (!SecureKeyManager.instance) {
            SecureKeyManager.instance = new SecureKeyManager();
        }
        return SecureKeyManager.instance;
    }

    // Check if encryption is available
    isEncryptionAvailable(): boolean {
        return safeStorage.isEncryptionAvailable();
    }

    // Store a private key securely
    async storePrivateKey(keyId: string, privateKey: string, keyType: "ethereum" | "block52", alias: string): Promise<boolean> {
        try {
            if (!this.isEncryptionAvailable()) {
                throw new Error("Encryption not available on this system");
            }

            // Encrypt the private key using Electron's safeStorage
            const encryptedKey = safeStorage.encryptString(privateKey);

            const keyData: PrivateKeyData = {
                keyId,
                encryptedKey: encryptedKey.toString("base64"),
                keyType,
                alias,
                createdAt: new Date().toISOString()
            };

            this.keys.set(keyId, keyData);

            // Optionally persist to secure storage
            await this.persistKeys();

            return true;
        } catch (error) {
            console.error("Failed to store private key:", error);
            return false;
        }
    }

    // Retrieve and decrypt a private key
    async getPrivateKey(keyId: string): Promise<string | null> {
        try {
            const keyData = this.keys.get(keyId);
            if (!keyData) {
                return null;
            }

            // Decrypt the private key
            const encryptedBuffer = Buffer.from(keyData.encryptedKey, "base64");
            const decryptedKey = safeStorage.decryptString(encryptedBuffer);

            return decryptedKey;
        } catch (error) {
            console.error("Failed to retrieve private key:", error);
            return null;
        }
    }

    // List all stored key aliases
    getKeyList(): Array<{ keyId: string; alias: string; keyType: string; createdAt: string }> {
        return Array.from(this.keys.values()).map(key => ({
            keyId: key.keyId,
            alias: key.alias,
            keyType: key.keyType,
            createdAt: key.createdAt
        }));
    }

    // Remove a private key
    async removePrivateKey(keyId: string): Promise<boolean> {
        try {
            const removed = this.keys.delete(keyId);
            if (removed) {
                await this.persistKeys();
            }
            return removed;
        } catch (error) {
            console.error("Failed to remove private key:", error);
            return false;
        }
    }

    // Export a private key (for backup purposes)
    async exportPrivateKey(keyId: string): Promise<string | null> {
        // This should include additional security checks
        // like requiring password confirmation
        return await this.getPrivateKey(keyId);
    }

    // Import a private key from external source
    async importPrivateKey(privateKey: string, alias: string, keyType: "ethereum" | "block52" = "ethereum"): Promise<string | null> {
        try {
            const keyId = this.generateKeyId();
            const success = await this.storePrivateKey(keyId, privateKey, keyType, alias);
            return success ? keyId : null;
        } catch (error) {
            console.error("Failed to import private key:", error);
            return null;
        }
    }

    // Generate a unique key ID
    private generateKeyId(): string {
        return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Persist keys to secure storage (implement based on your needs)
    private async persistKeys(): Promise<void> {
        // This could store the encrypted key metadata to a secure location
        // The actual encryption is handled by Electron's safeStorage
        try {
            const keyMetadata = Array.from(this.keys.values());
            // Store metadata (without actual keys) for persistence
            localStorage.setItem("keyMetadata", JSON.stringify(keyMetadata));
        } catch (error) {
            console.error("Failed to persist key metadata:", error);
        }
    }

    // Load keys on initialization
    async loadKeys(): Promise<void> {
        try {
            const metadata = localStorage.getItem("keyMetadata");
            if (metadata) {
                const keyData: PrivateKeyData[] = JSON.parse(metadata);
                keyData.forEach(key => {
                    this.keys.set(key.keyId, key);
                });
            }
        } catch (error) {
            console.error("Failed to load keys:", error);
        }
    }
}

export default SecureKeyManager;