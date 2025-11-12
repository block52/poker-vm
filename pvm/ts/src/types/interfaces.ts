import { Turn } from "../engine/types";

// ICardDeck interface removed - deck logic now handled by Cosmos blockchain

export interface IBetManager {
    add(action: Turn): void;
    addTurns(turns: Turn[]): void;
    count(): number;
    current(): bigint;
    delta(): bigint;
    getTotalBetsForPlayer(playerId: string): bigint;
    getBets(): Map<string, bigint>;
    getLargestBet(): bigint;
    getLastAggressor(): bigint;
    getRaisedAmount(): bigint;
    previous(): bigint;
}