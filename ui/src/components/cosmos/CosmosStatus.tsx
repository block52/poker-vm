import React from "react";
import { useCosmosContext } from "../../hooks/useCosmosContext";
import { useGameActions } from "../../hooks/useGameActions";
import { getFormattedCosmosAddress } from "../../utils/cosmosUtils";

interface CosmosStatusProps {
    className?: string;
}

const CosmosStatus: React.FC<CosmosStatusProps> = ({ className = "" }) => {
    const { isConnected, address, balance, error } = useCosmosContext();
    const { backendType } = useGameActions();

    const formatBalance = (balance: { denom: string; amount: string }[]) => {
        const b52USDCBalance = balance.find(b => b.denom === "b52USDC");
        if (b52USDCBalance) {
            const amount = parseFloat(b52USDCBalance.amount) / 1000000; // Convert from micro units
            return `${amount.toFixed(2)} b52USDC`;
        }
        return "0.00 b52USDC";
    };

    if (backendType === "proxy") {
        return <div className={`text-xs text-gray-400 ${className}`}>Backend: Proxy</div>;
    }

    return (
        <div className={`text-xs ${className}`}>
            <div className={`flex items-center gap-2 ${isConnected ? "text-green-400" : "text-red-400"}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
                <span>{isConnected ? "Cosmos Connected" : "Cosmos Disconnected"}</span>
            </div>

            {isConnected && address && (
                <div className="text-gray-300 mt-1">
                    <div>Address: {getFormattedCosmosAddress()}</div>
                    <div>Balance: {formatBalance(balance)}</div>
                </div>
            )}

            {error && <div className="text-red-400 mt-1">Error: {error.message}</div>}

            <div className="text-gray-400 mt-1">Backend: Cosmos</div>
        </div>
    );
};

export default CosmosStatus;
