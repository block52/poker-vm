import React from "react";
import { useNavigate } from "react-router-dom";
import WalletPanel, { Transaction } from "./WalletPanel";
import NodeStatusPanel from "./NodeStatusPanel";

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    // Mock data for demonstration - in a real app this would come from API/state
    const layer1Balance = 2000.4567;
    const block52Balance = 1250.75;

    const recentTransactions: Transaction[] = [
        { id: "tx001", type: "deposit", amount: 100.0, currency: "Block52", date: "2024-09-28", status: "completed" },
        { id: "tx002", type: "withdrawal", amount: -50.25, currency: "ETH", date: "2024-09-27", status: "completed" },
        { id: "tx003", type: "game_win", amount: 75.5, currency: "Block52", date: "2024-09-27", status: "completed" },
        { id: "tx004", type: "deposit", amount: 0.5, currency: "ETH", date: "2024-09-26", status: "completed" },
        { id: "tx005", type: "game_loss", amount: -25.0, currency: "Block52", date: "2024-09-26", status: "completed" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="flex flex-col h-screen">
                {/* Top Section - Main Content (7/8 height) */}
                <div className="flex flex-1">
                    {/* Left Panel - Wallet (1/3 width) */}
                    <WalletPanel layer1Balance={layer1Balance} block52Balance={block52Balance} recentTransactions={recentTransactions} />

                    {/* Right Panel - Main Content (2/3 width) */}
                    <div className="flex-1 p-8">
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-4xl font-bold text-white text-center mb-8">Block 52 Poker - Desktop App</h1>

                            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                                <h2 className="text-2xl font-semibold text-white mb-4">Welcome to Block 52 Poker Desktop</h2>

                                {/* <p className="text-gray-300 mb-6">
                                    This is the desktop version of Block 52 Poker, running in Electron without Web3 wallet integration. Web3 features have been
                                    disabled for this desktop version.
                                </p> */}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-white mb-2">🎮 Game Features</h3>
                                        <ul className="text-gray-300 space-y-2">
                                            <li>• Poker table gameplay</li>
                                            <li>• Real-time game state</li>
                                            <li>• Player interactions</li>
                                            <li>• Game history</li>
                                        </ul>
                                    </div>

                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-white mb-2">💻 Desktop Features</h3>
                                        <ul className="text-gray-300 space-y-2">
                                            <li>• Native desktop app</li>
                                            <li>• Offline capable</li>
                                            <li>• Enhanced security</li>
                                            <li>• Better performance</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => navigate("/table/1")}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
                                    >
                                        🎯 Enter Poker Table
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Panel - Node Status (1/8 height) */}
                <NodeStatusPanel connectedNodes={12} />
            </div>
        </div>
    );
};

export default Dashboard;
