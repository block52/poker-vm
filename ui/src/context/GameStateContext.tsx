import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNetwork } from "./NetworkContext";
import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { createAuthPayload } from "../utils/cosmos/signing";

/**
 * GameStateContext - Centralized WebSocket state management
 *
 * SIMPLIFIED ARCHITECTURE:
 * Components → useGameState → GameStateContext → WebSocket (direct)
 *
 * BENEFITS:
 * - No more WebSocketSingleton complexity
 * - No more callback system needed
 * - Context manages ONE WebSocket connection per table
 * - All components read from Context state automatically
 * - Stable React lifecycle management
 */

interface GameStateContextType {
    gameState: TexasHoldemStateDTO | undefined;
    isLoading: boolean;
    error: Error | null;
    subscribeToTable: (tableId: string) => void;
    unsubscribeFromTable: () => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

interface GameStateProviderProps {
    children: React.ReactNode;
}

// 🔍 DEBUG: Enhanced logging utility for easy data export
const debugLogs: any[] = [];
const debugLog = (eventType: string, data: any) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        data
    };

    // Console log as before
    console.log(`🔄 [${eventType}]`, data);

    // Store in array for easy export
    debugLogs.push(logEntry);

    if (debugLogs.length > 100) {
        debugLogs.shift();
    }

    // Store in localStorage for persistence
    try {
        localStorage.setItem("pokerDebugLogs", JSON.stringify(debugLogs.slice(-20))); // Keep last 20
    } catch {
        // localStorage might be full, ignore
    }
};

// Expose debug functions to window for easy console access
if (typeof window !== "undefined") {
    // Make debugLogs globally accessible
    (window as any).debugLogs = debugLogs;

    (window as any).exportDebugLogs = () => {
        const dataStr = JSON.stringify(debugLogs, null, 2);
        console.log("=== COPYABLE DEBUG LOGS ===");
        console.log(dataStr);

        // Also download as file
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `poker-debug-${new Date().toISOString().slice(0, 19)}.json`;
        link.click();
        URL.revokeObjectURL(url);

        return dataStr;
    };

    (window as any).clearDebugLogs = () => {
        debugLogs.length = 0;
        localStorage.removeItem("pokerDebugLogs");
        console.log("Debug logs cleared");
    };

    (window as any).getLastDebugLogs = (count = 10) => {
        const recent = debugLogs.slice(-count);
        console.table(recent);
        console.log("=== COPYABLE RECENT LOGS ===");
        console.log(JSON.stringify(recent, null, 2));
        return recent;
    };
}

export const GameStateProvider: React.FC<GameStateProviderProps> = ({ children }) => {
    const [gameState, setGameState] = useState<TexasHoldemStateDTO | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const { currentNetwork } = useNetwork();

    // ✅ STABILITY FIX: Use ref instead of state for currentTableId to prevent re-renders
    // This ref is only used for duplicate checking, not for rendering
    const currentTableIdRef = useRef<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const subscribeToTable = useCallback(
        (tableId: string) => {
            // Enhanced duplicate check to prevent re-subscription loops
            if (currentTableIdRef.current === tableId && wsRef.current?.readyState === WebSocket.OPEN) {
                console.log(`[GameStateContext] Already subscribed to table: ${tableId}`);
                return;
            }

            // Prevent rapid re-connection attempts
            if (wsRef.current?.readyState === WebSocket.CONNECTING) {
                console.log(`[GameStateContext] WebSocket already connecting to table: ${tableId}`);
                return;
            }

            // Clean up existing connection
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            setIsLoading(true);
            setError(null);
            currentTableIdRef.current = tableId;

            console.log(`[GameStateContext] Subscribing to table: ${tableId}`);

            // Get player address - try Cosmos first, fallback to Ethereum for backwards compatibility
            const cosmosAddress = localStorage.getItem("user_cosmos_address");
            const ethAddress = localStorage.getItem("user_eth_public_key");
            const playerAddress = cosmosAddress || ethAddress;

            if (!playerAddress) {
                console.error("[GameStateContext] No player address found (tried user_cosmos_address and user_eth_public_key)");
                setError(new Error("No player address found"));
                setIsLoading(false);
                return;
            }

            console.log(`[GameStateContext] Using player address: ${playerAddress} (type: ${cosmosAddress ? "Cosmos" : "Ethereum"})`);

            // Validate that the network has a ws property
            if (!currentNetwork.ws) {
                console.error("[GameStateContext] Current network missing 'ws' property:", currentNetwork);
                setError(new Error("Network configuration missing WebSocket endpoint"));
                setIsLoading(false);
                return;
            }

            // Create WebSocket connection using network context
            const fullWsUrl = `${currentNetwork.ws}?tableAddress=${tableId}&playerId=${playerAddress}`;
            console.log("[GameStateContext] 🔌 Attempting WebSocket connection:", {
                wsBaseUrl: currentNetwork.ws,
                tableId,
                playerAddress: playerAddress.substring(0, 12) + "...",
                fullUrl: fullWsUrl,
                networkName: currentNetwork.name
            });

            const ws = new WebSocket(fullWsUrl);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log(`[GameStateContext] ✅ WebSocket connected to table ${tableId}`, {
                    readyState: ws.readyState,
                    url: fullWsUrl
                });

                // Create authenticated subscription message with signature
                // This allows the server to verify our identity and show us our hole cards
                const authPayload = await createAuthPayload();

                const subscriptionMessage = {
                    type: "subscribe",
                    game_id: tableId,
                    // Include auth info for per-player card masking
                    player_address: authPayload?.playerAddress || playerAddress,
                    timestamp: authPayload?.timestamp,
                    signature: authPayload?.signature
                };

                console.log(`[GameStateContext] 📤 Sending subscription message:`, {
                    ...subscriptionMessage,
                    signature: subscriptionMessage.signature ? subscriptionMessage.signature.substring(0, 20) + "..." : undefined
                });
                ws.send(JSON.stringify(subscriptionMessage));

                setIsLoading(false);
            };

            ws.onmessage = event => {
                try {
                    // 🔍 DEBUG: Log ALL WebSocket messages received
                    console.log("📨 [WebSocket RAW MESSAGE]", {
                        timestamp: new Date().toISOString(),
                        rawData: event.data,
                        dataLength: event.data?.length
                    });

                    const message = JSON.parse(event.data);

                    // 🔍 DEBUG: Log parsed message structure
                    console.log("📨 [WebSocket PARSED MESSAGE]", {
                        timestamp: new Date().toISOString(),
                        messageEvent: message.event,
                        messageType: message.type,
                        gameId: message.game_id,
                        tableAddress: message.tableAddress,
                        hasGameState: !!(message.gameState || message.data?.gameState),
                        expectedTableId: tableId,
                        fullMessage: message
                    });

                    // Handle multiple message formats:
                    // - Old PVM format: type: "gameStateUpdate"
                    // - Cosmos initial state: event: "state"
                    // - Cosmos events: event: "player_joined_game", "action_performed", "game_created"
                    const cosmosEvents = ["state", "player_joined_game", "action_performed", "game_created"];
                    const isStateUpdate =
                        (message.type === "gameStateUpdate" && message.tableAddress === tableId) ||
                        (cosmosEvents.includes(message.event) && message.game_id === tableId);

                    if (isStateUpdate) {
                        // Extract game state from either format
                        const gameStateData = message.gameState || message.data?.gameState;

                        if (!gameStateData) {
                            console.warn("⚠️ [WebSocket] Received state update but no gameState found:", message);
                            return;
                        }

                        // 🃏 DEBUG: Log hole cards received from WebSocket
                        console.log("🃏 [HOLE CARDS DEBUG - UI RECEIVED]", {
                            timestamp: new Date().toISOString(),
                            currentPlayerAddress: playerAddress,
                            players: gameStateData?.players?.map((p: any) => ({
                                seat: p.seat,
                                address: p.address?.substring(0, 12) + "...",
                                holeCards: p.holeCards,
                                isCurrentPlayer: p.address?.toLowerCase() === playerAddress?.toLowerCase()
                            }))
                        });

                        // 🔍 DEBUG: Log game state change timing for race condition debugging
                        debugLog("GAME STATE UPDATE", {
                            timestamp: new Date().toISOString(),
                            tableId,
                            newRound: gameStateData?.round,
                            playerTurnInfo: {
                                nextToAct: gameStateData?.nextToAct,
                                currentActorSeat: gameStateData?.players?.find((p: any) => p.address?.toLowerCase() === playerAddress.toLowerCase())?.seat
                            },
                            source: "WebSocket state update"
                        });

                        console.log(`[GameStateContext] Received game state update for table ${tableId}`);
                        console.log(`[GameStateContext] 📊 Game state has ${gameStateData?.players?.length || 0} players`);

                        // 🔍 DEBUG: Log before and after state to see if React state actually updates
                        debugLog("REACT STATE DEBUG - BEFORE", {
                            timestamp: new Date().toISOString(),
                            previousNextToAct: gameState?.nextToAct,
                            newNextToAct: gameStateData?.nextToAct,
                            previousPlayerCount: gameState?.players?.length,
                            newPlayerCount: gameStateData?.players?.length,
                            willUpdate: true,
                            source: "GameStateContext setState"
                        });

                        // Update the React state with the extracted game state
                        setGameState(gameStateData);
                        setError(null);

                        // 🔍 DEBUG: Log immediately after state update (this may still show old state due to async nature)
                        setTimeout(() => {
                            debugLog("REACT STATE DEBUG - AFTER", {
                                timestamp: new Date().toISOString(),
                                currentNextToAct: gameState?.nextToAct,
                                expectedNextToAct: gameStateData?.nextToAct,
                                stateUpdated: gameState?.nextToAct === gameStateData?.nextToAct,
                                source: "GameStateContext setState verification"
                            });
                        }, 10); // Small delay to see if state updated

                        // DEBUG: Log hole card data for all players to detect if backend sends undefined/null cards
                        if (gameStateData?.players) {
                            const currentUser = gameStateData.players.find((player: any) => player.address?.toLowerCase() === playerAddress?.toLowerCase());

                            console.log("🃏 [GameStateContext] Hole Cards Debug:", {
                                timestamp: new Date().toISOString(),
                                totalPlayers: gameStateData.players.length,
                                round: gameStateData.round,
                                shouldHaveCards: ["preflop", "flop", "turn", "river", "showdown"].includes(gameStateData.round),
                                source: "WebSocket state update message",
                                note: "This shows raw backend data - compare with Player component logs",
                                currentUserData: currentUser
                                    ? {
                                          seat: currentUser.seat,
                                          address: currentUser.address?.substring(0, 8) + "...",
                                          holeCards: currentUser.holeCards,
                                          hasCards: !!currentUser.holeCards,
                                          cardCount: currentUser.holeCards?.length || 0,
                                          status: currentUser.status
                                      }
                                    : "Current user not found in players"
                            });

                            // Only check current user's hole cards (opposite players should have hidden cards)
                            // And only during rounds where cards should actually be dealt
                            const roundsWithCards = ["preflop", "flop", "turn", "river", "showdown"];
                            if (
                                currentUser &&
                                roundsWithCards.includes(gameStateData.round) &&
                                (!currentUser.holeCards || currentUser.holeCards.length !== 2)
                            ) {
                                console.warn("🚨 [WebSocket/Backend Data Issue] PVM backend sent invalid hole cards via WebSocket:", {
                                    seat: currentUser.seat,
                                    address: currentUser.address?.substring(0, 8) + "...",
                                    holeCards: currentUser.holeCards,
                                    issue: !currentUser.holeCards
                                        ? "Backend sent null/undefined cards"
                                        : `Backend sent wrong count: ${currentUser.holeCards.length}`,
                                    round: gameStateData.round,
                                    source: "WebSocket state update message",
                                    note: "This is NOT a frontend rendering issue - backend data is invalid"
                                });
                            }
                        } else {
                            console.warn("⚠️ [GameStateContext] No players data in game state update");
                        }
                    } else if (message.type === "error") {
                        // Handle error messages from the backend
                        console.error("[GameStateContext] Received error from backend:", message);

                        // Create a user-friendly error message
                        const errorMsg =
                            message.code === "GAME_NOT_FOUND"
                                ? `${message.message}${message.details?.suggestion ? "\n\n" + message.details.suggestion : ""}`
                                : message.message || "An error occurred";

                        setError(new Error(errorMsg));
                        setIsLoading(false);

                        // If it's a game not found error, clear the game state
                        if (message.code === "GAME_NOT_FOUND") {
                            setGameState(undefined);
                        }
                    } else {
                        // 🔍 DEBUG: Log unhandled message types
                        console.warn("⚠️ [WebSocket UNHANDLED MESSAGE]", {
                            timestamp: new Date().toISOString(),
                            messageType: message.type,
                            tableAddress: message.tableAddress,
                            expectedTableId: tableId,
                            fullMessage: message
                        });
                    }
                } catch (err) {
                    console.error("❌ [WebSocket ERROR] Failed to parse message:", {
                        error: err,
                        errorMessage: (err as Error).message,
                        rawData: event.data,
                        timestamp: new Date().toISOString()
                    });
                    setError(new Error("Error parsing WebSocket message"));
                }
            };

            ws.onclose = event => {
                console.log("🔌 [WebSocket CLOSE]", {
                    timestamp: new Date().toISOString(),
                    tableId,
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });
                if (wsRef.current === ws) {
                    wsRef.current = null;
                }
            };

            ws.onerror = event => {
                console.error("❌ [WebSocket ERROR]", {
                    timestamp: new Date().toISOString(),
                    tableId,
                    event
                });
                setError(new Error(`WebSocket connection error for table ${tableId}`));
                setIsLoading(false);
            };
        },
        [currentNetwork, gameState?.nextToAct, gameState?.players?.length]
    );

    const unsubscribeFromTable = useCallback(() => {
        if (currentTableIdRef.current) {
            console.log(`[GameStateContext] Unsubscribing from table: ${currentTableIdRef.current}`);
        }

        // Clean up WebSocket connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        currentTableIdRef.current = null;
        setGameState(undefined);
        setIsLoading(false);
        setError(null);
    }, []); // ✅ STABILITY FIX: Empty deps - all refs and setters are stable

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // 🎯 PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        (): GameStateContextType => ({
            gameState,
            isLoading,
            error,
            subscribeToTable,
            unsubscribeFromTable
        }),
        [gameState, isLoading, error, subscribeToTable, unsubscribeFromTable]
    );

    return <GameStateContext.Provider value={contextValue}>{children}</GameStateContext.Provider>;
};

export const useGameStateContext = (): GameStateContextType => {
    const context = useContext(GameStateContext);
    if (!context) {
        throw new Error("useGameStateContext must be used within a GameStateProvider");
    }
    return context;
};
