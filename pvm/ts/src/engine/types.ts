import { Card } from "../models/deck";
import TexasHoldemGame from "./texasHoldem";

export type Range = {
    minAmount: number;
    maxAmount: number;
}

export enum States {
    INIT = "INIT",
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    DEALING = "DEALING",
    BETTING = "BETTING",
    SHOWDOWN = "SHOWDOWN",
    END = "END",
}

export enum Actions {
    JOIN = "JOIN",
    START = "START",
    BET = "BET",
    CHECK = "CHECK",
    FOLD = "FOLD",
    CALL = "CALL",
    RAISE = "RAISE",
    SHOWDOWN = "SHOWDOWN",
    END = "END",
}

export enum Round {
    PREFLOP = "PREFLOP",
    FLOP = "FLOP",
    TURN = "TURN",
    RIVER = "RIVER",
}

/* !!
export type Player = {
    address: string;
    chips: number;
    holeCards: string[];
}; */

export type TexasHoldemState = {
    smallBlind: number;
    bigBlind: number;
    players: Player[];
    deck: string; // hash of deck
    communityCards?: string[];
    turn?: string; // Card
    river?: string; // Card
    pot: number;
    currentBet: number;
    dealer: number; // index of dealer
    nextPlayer: number; // index of next player to act
    round: Round;
    winner?: number;
    handNumber: number;
};

/*****************************************************************************/

export type PlayerId = string;

export type Player = {
    id: PlayerId;
    name: string;
    address?: string;
    chips: number;
    holeCards?: [Card, Card]; // Each player has 2 cards, represented as strings like 'As' (Ace of spades)
};

export enum ActionType {
    SMALL_BLIND = "post small blind",
    BIG_BLIND = "post big blind",
    FOLD = "fold",
    CHECK = "check",
    BET = "bet",
    CALL = "call",
    RAISE = "raise",
    ALL_IN = "going all-in"
}

export enum PlayerStatus {
    ACTIVE,
    FOLD,
    ALL_IN
}

export type Move = {
    playerId: PlayerId;
    action: ActionType;
    amount?: number;
};

export interface IUpdate {
    addMove(move: Move): void;
}