import { ActionDTO, GameOptions, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";
import TexasHoldemGame from "./texasHoldem";
import { Player } from "../models/player";
import { IBetManager } from "../types/interfaces";
import { Turn } from "./types";

// Constants for testing
export const ONE_TOKEN = 100000000000000000n;
export const TWO_TOKENS = 200000000000000000n;
export const FIVE_TOKENS = 500000000000000000n;
export const TEN_TOKENS = 1000000000000000000n;
export const TWENTY_TOKENS = 20000000000000000000n;
export const FIFTY_TOKENS = 50000000000000000000n;
export const ONE_HUNDRED_TOKENS = 100000000000000000000n;
export const ONE_THOUSAND_TOKENS = 1000000000000000000000n;
export const TWO_THOUSAND_TOKENS = 2000000000000000000000n;

export const mnemonic =
    "[AC]-2C-3C-4C-5C-6C-7C-8C-9C-10C-JC-QC-KC-" +
    "AD-2D-3D-4D-5D-6D-7D-8D-9D-10D-JD-QD-KD-" +
    "AH-2H-3H-4H-5H-6H-7H-8H-9H-10H-JH-QH-KH-" +
    "AS-2S-3S-4S-5S-6S-7S-8S-9S-10S-JS-QS-KS";

export const gameOptions: GameOptions = {
    minBuyIn: ONE_HUNDRED_TOKENS,
    maxBuyIn: ONE_THOUSAND_TOKENS,
    minPlayers: 2,
    maxPlayers: 9,
    smallBlind: ONE_TOKEN,
    bigBlind: TWO_TOKENS,
    timeout: 60000
};

export const baseGameConfig = {
    address: ethers.ZeroAddress,
    dealer: 9,
    nextToAct: 1,
    currentRound: "ante",
    communityCards: [],
    pot: 0n,
    players: [],
    now: Date.now()
};

export const seed: string = "29-34-15-41-5-21-9-23-37-5-17-13-11-1-40-44-16-21-42-46-41-23-34-30-48-36-32-33-40-7-9-3-30-42-2-19-24-34-24-46-2-31-10-43-49-11-29-49-49-23-14-2";

export const getDefaultGame = (playerStates: Map<number, Player | null>): TexasHoldemGame => {
    const previousActions: ActionDTO[] = [];
    const game = new TexasHoldemGame(
        ethers.ZeroAddress,
        gameOptions,
        9, // dealer
        previousActions,
        1, // handNumber
        0, // actionCount
        TexasHoldemRound.PREFLOP,
        [], // communityCards
        [0n], // pot
        playerStates,
        mnemonic
    );

    return game;
};

export const getDefaultGameWithActions = (previousActions: any[] = [], playerStates: Map<number, Player | null>): TexasHoldemGame => {
    const game = new TexasHoldemGame(
        ethers.ZeroAddress,
        gameOptions,
        9, // dealer
        previousActions,
        0,
        0,
        TexasHoldemRound.PREFLOP,
        [], // communityCards
        [0n], // pot
        playerStates,
        mnemonic
    );

    return game;
};

export const fromTestJson = (json: any): TexasHoldemGame => {
    const data = json.result.data;
    const gameConfig = data.gameOptions;

    return TexasHoldemGame.fromJson(data, gameConfig);
};

// Player address constants
export const PLAYER_1_ADDRESS = "0x1111111111111111111111111111111111111111"; // Small Blind
export const PLAYER_2_ADDRESS = "0x2222222222222222222222222222222222222222"; // Big Blind  
export const PLAYER_3_ADDRESS = "0x3333333333333333333333333333333333333333"; // 

// Create a mock BetManager class
export class MockBetManager implements IBetManager {

    private mockCurrentBet: bigint = 0n;
    private mockPlayerBets: Map<string, bigint> = new Map();
    private mockLargestBet: bigint = 0n;

    add(action: Turn): void {
        throw new Error("Method not implemented.");
    }

    addTurns(turns: Turn[]): void {
        throw new Error("Method not implemented.");
    }

    count(): number {
        throw new Error("Method not implemented.");
    }

    delta(): bigint {
        throw new Error("Method not implemented.");
    }

    getBets(): Map<string, bigint> {
        throw new Error("Method not implemented.");
    }

    getLastAggressor(start?: number): string {
        throw new Error("Method not implemented.");
    }
    
    previous(): bigint {
        throw new Error("Method not implemented.");
    }

    // Mock the current() method
    current(): bigint {
        return this.mockCurrentBet;
    }

    // Mock the getTotalBetsForPlayer() method
    getTotalBetsForPlayer(playerId: string): bigint {
        return this.mockPlayerBets.get(playerId) || 0n;
    }

    // Mock the getLargestBet() method
    getLargestBet(): bigint {
        return this.mockLargestBet;
    }

    // Helper methods to set up test scenarios
    setCurrentBet(amount: bigint): void {
        this.mockCurrentBet = amount;
    }

    setPlayerBet(playerId: string, amount: bigint): void {
        this.mockPlayerBets.set(playerId, amount);
    }

    setLargestBet(amount: bigint): void {
        this.mockLargestBet = amount;
    }

    reset(): void {
        this.mockCurrentBet = 0n;
        this.mockPlayerBets.clear();
        this.mockLargestBet = 0n;
    }
}