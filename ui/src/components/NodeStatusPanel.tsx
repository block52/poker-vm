import React, { useState, useEffect } from "react";
import SettingsService from "../services/SettingsService";

interface NodeStatusPanelProps {
    connectedNodes?: number;
}

const NodeStatusPanel: React.FC<NodeStatusPanelProps> = ({ connectedNodes = 12 }) => {
    const [newNodeUrl, setNewNodeUrl] = useState("");
    const [useVPN, setUseVPN] = useState(false);
    const [, setNodeUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load initial settings on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [nodesResult, settingsResult] = await Promise.all([SettingsService.getNodes(), SettingsService.getAllSettings()]);

            if (nodesResult.success && nodesResult.nodeUrls) {
                setNodeUrls(nodesResult.nodeUrls);
            }

            if (settingsResult.success && settingsResult.settings) {
                setUseVPN(settingsResult.settings.useVPN);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const handleAddNode = async () => {
        if (newNodeUrl.trim() && !isLoading) {
            setIsLoading(true);
            try {
                // Add node using SettingsService (which saves to SQLite)
                const result = await SettingsService.addNode(newNodeUrl.trim());

                if (result.success) {
                    console.log("Node added successfully:", newNodeUrl);
                    setNewNodeUrl("");
                    // Reload the node list to reflect the change
                    await loadSettings();
                } else {
                    console.error("Failed to add node:", result.error);
                    // You could show a toast notification here
                }
            } catch (error) {
                console.error("Error adding node:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleToggleVPN = async () => {
        try {
            const result = await SettingsService.toggleVPN();
            if (result.success && typeof result.useVPN === "boolean") {
                setUseVPN(result.useVPN);
                console.log("VPN toggled:", result.useVPN);
            } else {
                console.error("Failed to toggle VPN:", result.error);
            }
        } catch (error) {
            console.error("Error toggling VPN:", error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleAddNode();
        }
    };

    return (
        <div className="h-1/8 bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-between h-full">
                {/* Node Status */}
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">Connected to {connectedNodes} nodes</span>
                    </div>

                    {/* Add Node Section */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Add node URL..."
                            value={newNodeUrl}
                            onChange={e => setNewNodeUrl(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                            onClick={handleAddNode}
                            disabled={!newNodeUrl.trim() || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                {/* VPN Toggle */}
                <div className="flex items-center space-x-3">
                    <span className="text-gray-300">Use VPN</span>
                    <button
                        onClick={handleToggleVPN}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useVPN ? "bg-blue-600" : "bg-gray-600"}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                useVPN ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                    </button>
                    {useVPN && <span className="text-blue-400 text-sm">🛡️ Protected</span>}
                </div>
            </div>
        </div>
    );
};

export default NodeStatusPanel;
