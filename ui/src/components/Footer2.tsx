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

    // Simple display of the legal actions data now with more compact design
    return (
        <div className="w-full h-full bg-gradient-to-r from-[#1e2a3a] via-[#2c3e50] to-[#1e2a3a] text-white p-2 overflow-y-auto text-xs">
            <div className="max-w-4xl mx-auto">
                <h3 className="text-sm font-bold mb-1">Player Actions{effectiveTableId ? ` (${effectiveTableId.substring(0, 6)}...)` : ""}</h3>
                
                {isLoading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="text-red-400 text-xs">Error: {error.message}</p>
                ) : (
                    <div className="text-xs">
                        <div className="grid grid-cols-2 gap-1 mb-1">
                            <div>
                                <p className="leading-tight"><span className="opacity-80">Address:</span> {userAddress ? `${userAddress.substring(0, 6)}...` : "None"}</p>
                                <p className="leading-tight"><span className="opacity-80">Seat:</span> {playerSeat !== null ? playerSeat : "Not seated"}</p>
                                <p className="leading-tight"><span className="opacity-80">Status:</span> {playerStatus || "Unknown"}</p>
                            </div>
                            <div>
                                <p className="leading-tight"><span className="opacity-80">Turn:</span> {isPlayerTurn ? "Your turn" : "Not your turn"}</p>
                                <p className="leading-tight">
                                    <span className="opacity-80">Positions:</span> 
                                    {isSmallBlindPosition ? " SB" : ""} 
                                    {isBigBlindPosition ? " BB" : ""} 
                                    {isDealerPosition ? " Dealer" : ""}
                                </p>
                                <p className="leading-tight"><span className="opacity-80">Actions:</span> {legalActions?.length || 0}</p>
                            </div>
                        </div>
                        
                        <h4 className="text-xs font-bold mt-1 bg-slate-700 p-1 rounded">Available Actions:</h4>
                        {!legalActions || legalActions.length === 0 ? (
                            <p className="py-1 px-1 italic text-xs">No actions available</p>
                        ) : (
                            <ul className="list-none divide-y divide-gray-600 max-h-[80px] overflow-y-auto text-xs">
                                {legalActions.map((action, index) => (
                                    <li key={index} className="py-1 flex justify-between">
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
                        
                        {/* Debug section - hidden by default to save space */}
                        <div className="mt-1 p-1 bg-gray-800 rounded text-[10px]">
                            <details>
                                <summary className="cursor-pointer text-gray-400">Debug</summary>
                                <pre className="overflow-auto max-h-[40px] mt-1 opacity-70">
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
