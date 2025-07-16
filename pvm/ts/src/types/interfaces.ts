import { Turn } from "../engine/types";

export interface ICardDeck {
    shuffleDeck(): void;
    drawCard(): string;
}

export interface IBetManager {
    add(action: Turn): void;
    addTurns(turns: Turn[]): void;
    count(): number;
    current(): bigint;
    delta(): bigint;
    getTotalBetsForPlayer(playerId: string): bigint;
    getBets(): Map<string, bigint>;
    getLargestBet(): bigint;
    getLastAggressor(start?: number): string | null;
    previous(): bigint;
}