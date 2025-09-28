import React, { useState } from "react";

interface NodeStatusPanelProps {
    connectedNodes?: number;
}

const NodeStatusPanel: React.FC<NodeStatusPanelProps> = ({ connectedNodes = 12 }) => {
    const [newNodeUrl, setNewNodeUrl] = useState("");
    const [useVPN, setUseVPN] = useState(false);

    const handleAddNode = () => {
        if (newNodeUrl.trim()) {
            // Handle adding new node functionality
            console.log("Adding node:", newNodeUrl);
            setNewNodeUrl("");
            // This will be implemented with actual node management
        }
    };

    const handleToggleVPN = () => {
        setUseVPN(!useVPN);
        console.log("VPN toggled:", !useVPN);
        // This will be implemented with actual VPN functionality
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
                            disabled={!newNodeUrl.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Save
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
