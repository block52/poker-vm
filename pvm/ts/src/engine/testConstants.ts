import { GameOptions } from "@bitcoinbrisbane/block52";
import { ethers } from "ethers";

export const TEN_TOKENS = 10000000000000000000n;
export const TWENTY_TOKENS = 20000000000000000000n;
export const FIFTY_TOKENS = 50000000000000000000n;
export const ONE_HUNDRED_TOKENS = 100000000000000000n;
export const ONE_THOUSAND_TOKENS = 1000000000000000000n;
export const TWO_THOUSAND_TOKENS = 2000000000000000000n;

export const gameOptions: GameOptions = {
    minBuyIn: ONE_HUNDRED_TOKENS,
    maxBuyIn: ONE_THOUSAND_TOKENS,
    minPlayers: 2,
    maxPlayers: 9,
    smallBlind: 10000000000000000n,
    bigBlind: 20000000000000000n,
    timeout: 60000,
};

export const baseGameConfig = {
    address: ethers.ZeroAddress,
    dealer: 0,
    nextToAct: 1,
    currentRound: "preflop",
    communityCards: [],
    pot: 0n,
    players: []
};

