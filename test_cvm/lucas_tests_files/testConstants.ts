import { GameOptions, Positions } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";
import TexasHoldemGame from "../../pvm/ts/src/engine/texasHoldem";

// Constants for testing
export const ONE_TOKEN = 100000000000000000n;
export const TWO_TOKENS = 200000000000000000n;
export const TEN_TOKENS = 1000000000000000000n;
export const TWENTY_TOKENS = 20000000000000000000n;
export const FIFTY_TOKENS = 50000000000000000000n;
export const ONE_HUNDRED_TOKENS = 100000000000000000000n;
export const ONE_THOUSAND_TOKENS = 1000000000000000000000n;
export const TWO_THOUSAND_TOKENS = 2000000000000000000000n;

export const mnemonic = "[AC]-2C-3C-4C-5C-6C-7C-8C-9C-10C-JC-QC-KC-" +
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
    timeout: 60000,
};

export const defaultPositions: Positions = {
    dealer: 9,
    smallBlind: 1,
    bigBlind: 2,
}

export const baseGameConfig = {
    address: ethers.ZeroAddress,
    positions: defaultPositions,
    nextToAct: 1,
    currentRound: "ante",
    communityCards: [],
    pot: 0n,
    players: []
};

export const fromTestJson = (json: any): TexasHoldemGame => {
    const data = json.result.data;
    const gameConfig = data.gameOptions;

    return TexasHoldemGame.fromJson(data, gameConfig);
}