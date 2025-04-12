import { useEffect } from "react";
import * as React from "react";
import { usePlayerLegalActions } from "../hooks/usePlayerLegalActions";
import { useParams } from "react-router-dom";

interface Footer2Props {
    tableId?: string;
}

const Footer2: React.FC<Footer2Props> = ({ tableId: propTableId }) => {
    // Get the tableId from URL params
    const { tableId: urlTableId } = useParams<{ tableId: string }>();
    
    // Use prop tableId, URL param tableId, or fallback to empty string
    const effectiveTableId = propTableId || urlTableId || "";
    
    console.log("🟢 Footer2 rendering with tableId:", effectiveTableId);
    
    // Use the hook with the effective tableId
    const {
        legalActions,
        isSmallBlindPosition,
        isBigBlindPosition,
        isDealerPosition,
        isPlayerTurn,
        playerStatus,
        playerSeat,
        isLoading,
        error
    } = usePlayerLegalActions(effectiveTableId);

    // Get stored address for display
    const userAddress = localStorage.getItem("user_eth_public_key");
    
    // Show when legal actions change
    useEffect(() => {
        console.log("🔄 Player legal actions updated:", {
            legalActions,
            isSmallBlindPosition,
            isBigBlindPosition,
            isDealerPosition,
            isPlayerTurn,
            playerStatus,
            playerSeat
        });
    }, [legalActions, isSmallBlindPosition, isBigBlindPosition, isDealerPosition, isPlayerTurn, playerStatus, playerSeat]);

    // Format the amount to make it more readable (convert from wei to ETH)
    const formatAmount = (amountWei: string): string => {
        if (!amountWei || amountWei === "0") return "0";
        try {
            // Convert wei to ETH (divide by 10^18)
            const amountEth = parseFloat(amountWei) / 1e18;
            return amountEth.toFixed(2) + " ETH";
        } catch (e) {
            return amountWei;
        }
    };

    // Simple display of the legal actions data for now
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1e2a3a] via-[#2c3e50] to-[#1e2a3a] text-white p-4">
            <div className="max-w-4xl mx-auto">
                <h3 className="text-xl mb-2">Player Actions{effectiveTableId ? ` (Table: ${effectiveTableId.substring(0, 8)}...)` : ""}</h3>
                
                {isLoading ? (
                    <p>Loading player actions...</p>
                ) : error ? (
                    <p className="text-red-400">Error loading actions: {error.message}</p>
                ) : (
                    <div>
                        <div className="mb-2 grid grid-cols-2">
                            <div>
                                <p><b>My Address:</b> {userAddress ? `${userAddress.substring(0, 8)}...` : "Not found"}</p>
                                <p><b>Seat:</b> {playerSeat !== null ? playerSeat : "Not seated"}</p>
                                <p><b>Status:</b> {playerStatus || "Unknown"}</p>
                            </div>
                            <div>
                                <p><b>Turn:</b> {isPlayerTurn ? "Your turn" : "Not your turn"}</p>
                                <p><b>Positions:</b> 
                                    {isSmallBlindPosition ? " Small Blind" : ""} 
                                    {isBigBlindPosition ? " Big Blind" : ""} 
                                    {isDealerPosition ? " Dealer" : ""}
                                </p>
                                <p><b>Actions Count:</b> {legalActions?.length || 0}</p>
                            </div>
                        </div>
                        
                        <h4 className="font-bold mt-2 bg-slate-700 p-2 rounded">Available Actions:</h4>
                        {!legalActions || legalActions.length === 0 ? (
                            <p className="p-2 italic">No actions available</p>
                        ) : (
                            <ul className="list-none divide-y divide-gray-600">
                                {legalActions.map((action, index) => (
                                    <li key={index} className="py-2 flex justify-between">
                                        <span className="font-semibold text-green-400">{action.action}</span>
                                        <span>
                                            {action.min !== "0" && `Min: ${formatAmount(action.min)}`}
                                            {action.min !== "0" && action.max !== "0" && " | "}
                                            {action.max !== "0" && `Max: ${formatAmount(action.max)}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        
                        {/* Debug section */}
                        <div className="mt-4 p-2 bg-gray-800 rounded text-xs">
                            <details>
                                <summary className="cursor-pointer">Debug Info</summary>
                                <pre className="overflow-auto max-h-32 mt-2">
                                    {JSON.stringify({tableId: effectiveTableId, legalActions}, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Footer2;
