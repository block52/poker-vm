/**
 * API Response Types
 * 
 * These types represent the raw API responses from the Cosmos blockchain REST endpoints.
 * They typically contain JSON strings that need to be parsed into structured types.
 */

export interface GameStateApiResponse {
    game_state: string; // JSON string containing the game state
}

export interface GameApiResponse {
    game: string; // JSON string containing the game info
}

export interface LegalActionsApiResponse {
    actions: string; // JSON string containing legal actions
}

export interface ListGamesApiResponse {
    games: string; // JSON string containing list of games
}

export interface PlayerGamesApiResponse {
    games: string; // JSON string containing player's games
}

