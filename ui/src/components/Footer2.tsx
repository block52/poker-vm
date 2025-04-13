import { useEffect } from "react";
import * as React from "react";
import { usePlayerLegalActions } from "../hooks/usePlayerLegalActions";
import { useParams } from "react-router-dom";
import { useTableFold } from "../hooks/useTableFold";
import { useTablePostSmallBlind } from "../hooks/useTablePostSmallBlind";
import { useTablePostBigBlind } from "../hooks/useTablePostBigBlind";


interface Footer2Props {
    tableId?: string;
}

const Footer2: React.FC<Footer2Props> = ({ tableId: propTableId }) => {
    // Get the tableId from URL params
    const { tableId: urlTableId } = useParams<{ tableId: string }>();
    
    // Use prop tableId, URL param tableId, or fallback to empty string
    const effectiveTableId = propTableId || urlTableId || "";
    
    // Get stored address for display
    const userAddress = localStorage.getItem("user_eth_public_key");
    
    // IMPORTANT: Initialize ALL hooks at the top level, before any conditional logic
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
        error,
        foldActionIndex,
        actionTurnIndex,
        isPlayerInGame
    } = usePlayerLegalActions(effectiveTableId);

    // Initialize fold hook - MOVED UP before any conditionals
    const { foldHand, isFolding } = useTableFold(effectiveTableId);

    // Initialize post small blind hook - MOVED UP before any conditionals
    const { postSmallBlind, isPostingSmallBlind } = useTablePostSmallBlind(effectiveTableId);
    
    // Initialize post big blind hook
    const { postBigBlind, isPostingBigBlind } = useTablePostBigBlind(effectiveTableId);

    // Don't render the footer if the user is not in the game
    if (!isPlayerInGame) {
        return null;
    }
    
    // Check if fold action is available
    const hasFoldAction = React.useMemo(() => {
        return legalActions?.some(action => action.action === "fold");
    }, [legalActions]);

    // Check if post-small-blind action is available
    const hasPostSmallBlindAction = React.useMemo(() => {
        return legalActions?.some(action => action.action === "post-small-blind");
    }, [legalActions]);
    
    // Check if post-big-blind action is available
    const hasPostBigBlindAction = React.useMemo(() => {
        return legalActions?.some(action => action.action === "post-big-blind");
    }, [legalActions]);

    // Get private key from localStorage (assuming it's stored there)
    const privateKey = localStorage.getItem("user_eth_private_key");

    // Show when legal actions change
    useEffect(() => {
        console.log("🔄 Player legal actions updated:", {
            legalActions,
            isSmallBlindPosition,
            isBigBlindPosition,
            isDealerPosition,
            isPlayerTurn,
            playerStatus,
            playerSeat,
            actionTurnIndex
        });
    }, [legalActions, isSmallBlindPosition, isBigBlindPosition, isDealerPosition, isPlayerTurn, playerStatus, playerSeat, actionTurnIndex]);

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

    // Handle fold button click
    const handleFold = async () => {
        if (!foldHand) return;
        
        try {
            await foldHand({
                userAddress,
                privateKey,
                publicKey: userAddress,
                actionIndex: actionTurnIndex
            });
            console.log("Fold successful");
        } catch (error) {
            console.error("Error when folding:", error);
        }
    };

    // Handle post small blind button click
    const handlePostSmallBlind = async () => {
        if (!postSmallBlind) return;
        
        try {
            await postSmallBlind({
                userAddress,
                privateKey,
                publicKey: userAddress,
                actionIndex: actionTurnIndex
            });
            console.log("Post small blind successful");
        } catch (error) {
            console.error("Error when posting small blind:", error);
        }
    };
    
    // Handle post big blind button click
    const handlePostBigBlind = async () => {
        if (!postBigBlind) return;
        
        try {
            await postBigBlind({
                userAddress,
                privateKey,
                publicKey: userAddress,
                actionIndex: actionTurnIndex
            });
            console.log("Post big blind successful");
        } catch (error) {
            console.error("Error when posting big blind:", error);
        }
    };

    // Simple display of the legal actions data now with more compact design
    return (
        <div className="w-full h-full bg-gradient-to-r from-[#1e2a3a] via-[#2c3e50] to-[#1e2a3a] text-white p-2 overflow-y-auto text-xs">
            <div className="max-w-4xl mx-auto">
                {/* Action buttons */}
                <div className="flex gap-2 mb-2">
                    {/* Fold button if available */}
                    {hasFoldAction && (
                        <button
                            onClick={handleFold}
                            className="bg-red-600 hover:bg-red-700 text-white py-1 px-4 rounded-md transition-colors duration-200 text-sm font-medium"
                            disabled={isFolding}
                        >
                            {isFolding ? "Folding..." : "Fold"}
                        </button>
                    )}

                    {/* Small Blind button if available */}
                    {hasPostSmallBlindAction && (
                        <button
                            onClick={handlePostSmallBlind}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded-md transition-colors duration-200 text-sm font-medium"
                            disabled={isPostingSmallBlind}
                        >
                            {isPostingSmallBlind ? "Posting SB..." : "Post Small Blind"}
                        </button>
                    )}
                    
                    {/* Big Blind button if available */}
                    {hasPostBigBlindAction && (
                        <button
                            onClick={handlePostBigBlind}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-4 rounded-md transition-colors duration-200 text-sm font-medium"
                            disabled={isPostingBigBlind}
                        >
                            {isPostingBigBlind ? "Posting BB..." : "Post Big Blind"}
                        </button>
                    )}
                </div>

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
