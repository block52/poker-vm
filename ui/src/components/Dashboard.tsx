import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    // Mock data for demonstration - in a real app this would come from API/state
    const layer1Balance = 2000.4567;
    const block52Balance = 1250.75;

    const recentTransactions = [
        { id: "tx001", type: "deposit", amount: 100.0, currency: "Block52", date: "2024-09-28", status: "completed" },
        { id: "tx002", type: "withdrawal", amount: -50.25, currency: "ETH", date: "2024-09-27", status: "completed" },
        { id: "tx003", type: "game_win", amount: 75.5, currency: "Block52", date: "2024-09-27", status: "completed" },
        { id: "tx004", type: "deposit", amount: 0.5, currency: "ETH", date: "2024-09-26", status: "completed" },
        { id: "tx005", type: "game_loss", amount: -25.0, currency: "Block52", date: "2024-09-26", status: "completed" }
    ];

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "deposit":
                return "⬆️";
            case "withdrawal":
                return "⬇️";
            case "game_win":
                return "🎉";
            case "game_loss":
                return "🎮";
            default:
                return "💰";
        }
    };

    const getTransactionColor = (amount: number) => {
        return amount >= 0 ? "text-green-400" : "text-red-400";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="flex h-screen">
                {/* Left Panel - Wallet (1/3 width) */}
                <div className="w-1/3 bg-gray-800 shadow-2xl border-r border-gray-700">
                    <div className="p-6">
                        {/* Wallet Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">💼 Wallet</h2>
                            <div className="h-1 w-16 bg-blue-500 rounded"></div>
                        </div>

                        {/* Balance Section */}
                        <div className="space-y-4 mb-8">
                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">Layer 1 (ETH)</span>
                                    <span className="text-blue-400">🔗</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{layer1Balance.toFixed(4)} USDC</div>
                                <div className="text-gray-400 text-sm">≈ ${(layer1Balance * 2500).toLocaleString()}</div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">Block 52 Credits</span>
                                    <span className="text-purple-400">♠️</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{block52Balance.toLocaleString()} B52</div>
                                <div className="text-gray-400 text-sm">Gaming credits</div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {recentTransactions.map(tx => (
                                    <div key={tx.id} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg">{getTransactionIcon(tx.type)}</span>
                                                <div>
                                                    <div className="text-white text-sm font-medium capitalize">{tx.type.replace("_", " ")}</div>
                                                    <div className="text-gray-400 text-xs">{tx.date}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-semibold ${getTransactionColor(tx.amount)}`}>
                                                    {tx.amount >= 0 ? "+" : ""}
                                                    {tx.amount.toFixed(2)}
                                                </div>
                                                <div className="text-gray-400 text-xs">{tx.currency}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Main Content (2/3 width) */}
                <div className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold text-white text-center mb-8">Block 52 Poker - Desktop App</h1>

                        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                            <h2 className="text-2xl font-semibold text-white mb-4">Welcome to Block 52 Poker Desktop</h2>

                            <p className="text-gray-300 mb-6">
                                This is the desktop version of Block 52 Poker, running in Electron without Web3 wallet integration. Web3 features have been
                                disabled for this desktop version.
                            </p>

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
        </div>
    );
};

export default Dashboard;
