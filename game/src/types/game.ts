import { ethers } from "ethers";

export enum PlayingCardEnum {
    CARD_BACK = "\u{1F0A0}", 

    SPADES_A = "\u{1F0A1}",
    SPADES_2 = "\u{1F0A2}",
    SPADES_3 = "\u{1F0A3}",
    SPADES_4 = "\u{1F0A4}",
    SPADES_5 = "\u{1F0A5}",
    SPADES_6 = "\u{1F0A6}",
    SPADES_7 = "\u{1F0A7}",
    SPADES_8 = "\u{1F0A8}",
    SPADES_9 = "\u{1F0A9}",
    SPADES_10 = "\u{1F0AA}",
    SPADES_J = "\u{1F0AB}",
    SPADES_Q = "\u{1F0AD}",
    SPADES_K = "\u{1F0AE}",

    HEARTS_A = "\u{1F0B1}",
    HEARTS_2 = "\u{1F0B2}",
    HEARTS_3 = "\u{1F0B3}",
    HEARTS_4 = "\u{1F0B4}",
    HEARTS_5 = "\u{1F0B5}",
    HEARTS_6 = "\u{1F0B6}",
    HEARTS_7 = "\u{1F0B7}",
    HEARTS_8 = "\u{1F0B8}",
    HEARTS_9 = "\u{1F0B9}",
    HEARTS_10 = "\u{1F0BA}",
    HEARTS_J = "\u{1F0BB}",
    HEARTS_Q = "\u{1F0BD}",
    HEARTS_K = "\u{1F0BE}",

    DIAMONDS_A = "\u{1F0C1}",
    DIAMONDS_2 = "\u{1F0C2}",
    DIAMONDS_3 = "\u{1F0C3}",
    DIAMONDS_4 = "\u{1F0C4}",
    DIAMONDS_5 = "\u{1F0C5}",
    DIAMONDS_6 = "\u{1F0C6}",
    DIAMONDS_7 = "\u{1F0C7}",
    DIAMONDS_8 = "\u{1F0C8}",
    DIAMONDS_9 = "\u{1F0C9}",
    DIAMONDS_10 = "\u{1F0CA}",
    DIAMONDS_J = "\u{1F0CB}",
    DIAMONDS_Q = "\u{1F0CD}",
    DIAMONDS_K = "\u{1F0CE}",

    CLUBS_A = "\u{1F0D1}",
    CLUBS_2 = "\u{1F0D2}",
    CLUBS_3 = "\u{1F0D3}",
    CLUBS_4 = "\u{1F0D4}",
    CLUBS_5 = "\u{1F0D5}",
    CLUBS_6 = "\u{1F0D6}",
    CLUBS_7 = "\u{1F0D7}",
    CLUBS_8 = "\u{1F0D8}",
    CLUBS_9 = "\u{1F0D9}",
    CLUBS_10 = "\u{1F0DA}",
    CLUBS_J = "\u{1F0DB}",
    CLUBS_Q = "\u{1F0DD}",
    CLUBS_K = "\u{1F0DE}"
}

export enum Suit {
    UNKNOWN = 0,
    CLUBS = 4,
    SPADES = 1,
    DIAMONDS = 3,
    HEARTS = 2
}

export type PlayingCardInfo = {
    suit: Suit;
    value: number;
    unicode: string;
};

// 0 is hidden
export function intToPlayingCard(num: number): PlayingCardInfo {
    if (num === 0) {
        return {
            suit: Suit.UNKNOWN,
            value: 0,
            unicode: PlayingCardEnum.CARD_BACK
        }
    }
    const value = ((num - 1) % 13) + 1;
    const suit = Math.floor((num - 1) / 13) + 1;
    const unicode = Object.values(PlayingCardEnum)[num];
    return { suit, value, unicode };
}

export enum States {
    INIT = "INIT",
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    DEALING = "DEALING",
    BETTING = "BETTING",
    SHOWDOWN = "SHOWDOWN",
    END = "END"
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
    END = "END"
}

export type PlayerAction = {
    action: Actions;
    amount?: number;
};

export enum Round {
    PREFLOP = "PREFLOP",
    FLOP = "FLOP",
    TURN = "TURN",
    RIVER = "RIVER"
}

export enum Seat {
    DEALER = 0,
    LB = 1,
    BB = 2,
    NORMAL = 3
}

export type Player = {
    address: string;
    chips: number;
    holeCards?: number[];
    lastAction?: PlayerAction;
    seat: number;
    isActive: boolean;
    isTurn: boolean;
};

export type TexasHoldemState = {
    smallBlind: number;
    bigBlind: number;
    players: Player[];
    deck: string; // hash of deck
    flop: number[];
    turn: number; // Card
    river: number; // Card
    pot: number;
    currentBet: number;
    dealer: number; // index of dealer
    nextPlayer: number; // index of next player to act
    round: Round;
    winner?: number;
    handNumber: number;
};

export const exampleState: TexasHoldemState = {
    smallBlind: 1,
    bigBlind: 2,
    players: [
        {
            address: "0xD332DFf7b5632f293156C3c07F91070aD61E3893",
            chips: 100,
            holeCards: [52, 40],
            lastAction: {
                action: Actions.BET,
                amount: 2
            },
            isTurn: true,
            seat: Seat.LB,
            isActive: true
        },
        {
            address: "0xC26E2874B6DAe1fE438361d150f179a5277dc278",
            chips: 200,
            holeCards: [1, 2],
            lastAction: {
                action: Actions.CALL,
                amount: 2
            },
            isTurn: false,
            seat: Seat.BB,
            isActive: true
        },
        {
            address: "0xba22370000000000000000000000000000000000",
            chips: 300,
            holeCards: [4, 7],
            lastAction: {
                action: Actions.FOLD
            },
            isTurn: false,
            seat: Seat.NORMAL,
            isActive: false
        },

    ],
    deck: ethers.ZeroHash,
    flop: [2, 16, 33],
    turn: 0,
    river: 0,
    pot: 10,
    currentBet: 2,
    dealer: 0,
    nextPlayer: 1,
    round: Round.PREFLOP,
    handNumber: 0
};
