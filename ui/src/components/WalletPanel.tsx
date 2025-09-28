import React from "react";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    currency: string;
    date: string;
    status: string;
}

interface WalletPanelProps {
    layer1Balance: number;
    block52Balance: number;
    recentTransactions: Transaction[];
}

const WalletPanel: React.FC<WalletPanelProps> = ({ layer1Balance, block52Balance, recentTransactions }) => {
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

    const handleDepositUSDC = () => {
        // Handle USDC deposit functionality
        console.log("Deposit USDC clicked");
        // This will be implemented with actual wallet integration
    };

    const handleBridgeToLayer2 = () => {
        // Handle bridging to Layer 2 functionality
        console.log("Bridge to Layer 2 clicked");
        // This will be implemented with actual wallet integration
    };

    return (
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

                        {/* Deposit USDC Button */}
                        <button
                            onClick={handleDepositUSDC}
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            💰 Deposit USDC
                        </button>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Block 52 Credits</span>
                            <span className="text-purple-400">♠️</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{block52Balance.toLocaleString()} B52USDC</div>
                        <div className="text-gray-400 text-sm">Gaming credits</div>

                        {/* Bridge USDC Button */}
                        <button
                            onClick={handleBridgeToLayer2}
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            💰 Bridge USDC
                        </button>
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
    );
};

export default WalletPanel;
export type { Transaction, WalletPanelProps };
