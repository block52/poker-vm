// Renderer process service
declare global {
    interface Window {
        electronAPI: {
            settings: {
                addNode: (nodeUrl: string) => Promise<{ success: boolean; error?: string }>;
                getNodes: () => Promise<{ success: boolean; nodeUrls?: string[]; error?: string }>;
                toggleVPN: () => Promise<{ success: boolean; useVPN?: boolean; error?: string }>;
                getAll: () => Promise<{ success: boolean; settings?: any; error?: string }>;
                updateConnectedNodes: (count: number) => Promise<{ success: boolean; error?: string }>;
            };
        };
    }
}

export class SettingsService {
    static async addNode(nodeUrl: string): Promise<{ success: boolean; error?: string }> {
        if (!window.electronAPI) {
            return { success: false, error: "Electron API not available" };
        }
        return await window.electronAPI.settings.addNode(nodeUrl);
    }

    static async getNodes(): Promise<{ success: boolean; nodeUrls?: string[]; error?: string }> {
        if (!window.electronAPI) {
            return { success: false, error: "Electron API not available" };
        }
        return await window.electronAPI.settings.getNodes();
    }

    static async toggleVPN(): Promise<{ success: boolean; useVPN?: boolean; error?: string }> {
        if (!window.electronAPI) {
            return { success: false, error: "Electron API not available" };
        }
        return await window.electronAPI.settings.toggleVPN();
    }

    static async getAllSettings(): Promise<{ success: boolean; settings?: any; error?: string }> {
        if (!window.electronAPI) {
            return { success: false, error: "Electron API not available" };
        }
        return await window.electronAPI.settings.getAll();
    }

    static async updateConnectedNodes(count: number): Promise<{ success: boolean; error?: string }> {
        if (!window.electronAPI) {
            return { success: false, error: "Electron API not available" };
        }
        return await window.electronAPI.settings.updateConnectedNodes(count);
    }
}

export default SettingsService;