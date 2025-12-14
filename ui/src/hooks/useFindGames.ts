import { useState, useEffect, useCallback } from "react";
import { GameOptionsResponse } from "@block52/poker-vm-sdk";
import { FindGamesReturn } from "../types/index";
import { getCosmosClient } from "../utils/cosmos/client";
import { useNetwork } from "../context/NetworkContext";

/**
 * Custom hook to find available games from Cosmos blockchain
 * @returns Object containing available games and loading state
 */
export const useFindGames = (): FindGamesReturn => {
    const [games, setGames] = useState<GameOptionsResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { currentNetwork } = useNetwork();

    const fetchGames = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get Cosmos client
            const cosmosClient = getCosmosClient(currentNetwork);
            if (!cosmosClient) {
                throw new Error("Cosmos client not initialized. Please create or import a Cosmos wallet first.");
            }

            console.log("🔍 Fetching games from Cosmos blockchain...");

            // Fetch all games from Cosmos REST API
            // GET /block52/pokerchain/poker/v1/list_games
            const cosmosGames = await cosmosClient.findGames();

            console.log("✅ Games fetched from Cosmos:", cosmosGames);
            console.log("Games (stringified):", JSON.stringify(cosmosGames, null, 2));

            // Map Cosmos game structure to GameOptionsResponse format
            // Cosmos returns camelCase JSON (gameId, minBuyIn, etc.)
            const availableGames: GameOptionsResponse[] = cosmosGames.map((game: any) => {

                // Cosmos blockchain returns values in USDC micro-units (6 decimals)
                // These are already the correct values, just need to convert to strings
                const minBuyInStr = game.minBuyIn ? String(game.minBuyIn) : (game.min_buy_in ? String(game.min_buy_in) : "0");
                const maxBuyInStr = game.maxBuyIn ? String(game.maxBuyIn) : (game.max_buy_in ? String(game.max_buy_in) : "0");
                const smallBlindStr = game.smallBlind ? String(game.smallBlind) : (game.small_blind ? String(game.small_blind) : "0");
                const bigBlindStr = game.bigBlind ? String(game.bigBlind) : (game.big_blind ? String(game.big_blind) : "0");

                console.log(`🎮 Mapping game ${game.gameId}:`, {
                    minBuyIn: game.minBuyIn,
                    maxBuyIn: game.maxBuyIn,
                    smallBlind: game.smallBlind,
                    bigBlind: game.bigBlind,
                    minBuyInStr,
                    maxBuyInStr,
                    smallBlindStr,
                    bigBlindStr,
                    note: "Values are in USDC micro-units (6 decimals, e.g., 5000000 = $5.00)"
                });

                return {
                    address: game.gameId || game.game_id || game.id, // Game ID from Cosmos
                    // Top-level fields for backward compatibility
                    minBuyIn: minBuyInStr,
                    maxBuyIn: maxBuyInStr,
                    minPlayers: game.minPlayers || game.min_players || 0,
                    maxPlayers: game.maxPlayers || game.max_players || 0,
                    currentPlayers: game.players?.length || game.current_players || 0,
                    gameType: game.gameType || game.game_type || "cash",
                    smallBlind: smallBlindStr,
                    bigBlind: bigBlindStr,
                    status: game.status || "waiting",
                    // Add gameOptions nested object that Dashboard expects
                    gameOptions: {
                        type: game.gameType || game.game_type || "cash",
                        minBuyIn: minBuyInStr,
                        maxBuyIn: maxBuyInStr,
                        minPlayers: game.minPlayers || game.min_players || 0,
                        maxPlayers: game.maxPlayers || game.max_players || 0,
                        smallBlind: smallBlindStr,
                        bigBlind: bigBlindStr,
                    },
                    // Include all other Cosmos fields
                    creator: game.creator,
                    timeout: game.timeout,
                    players: game.players || [],
                    createdAt: game.createdAt,
                    updatedAt: game.updatedAt,
                };
            });

            console.log(`📊 Total games found: ${availableGames.length}`);

            // Debug: Check for duplicate game IDs
            const gameIds = availableGames.map(game => game.address);
            const uniqueIds = Array.from(new Set(gameIds));
            console.log("🔍 Game ID Analysis:");
            console.log("All game IDs:", gameIds);
            console.log("Unique game IDs:", uniqueIds);
            console.log(`Total games: ${availableGames.length}, Unique IDs: ${uniqueIds.length}`);

            if (gameIds.length !== uniqueIds.length) {
                console.warn("⚠️ DUPLICATE GAME IDs DETECTED!");
                console.warn("This suggests Cosmos blockchain is returning duplicate games.");
            }

            setGames(availableGames);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to fetch games from Cosmos";
            setError(new Error(errorMessage));
            console.error("❌ Error fetching games from Cosmos:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentNetwork]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    return {
        games,
        isLoading,
        error,
        refetch: fetchGames
    };
};
