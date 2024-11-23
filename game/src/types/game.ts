import { MoveDTO, PlayerAction, WinnerDTO } from "@bitcoinbrisbane/block52";

export enum PlayingCardEnum {
    CARD_BACK = "\u{1F0A0}", 

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
    CLUBS_K = "\u{1F0DE}",
    CLUBS_A = "\u{1F0D1}",

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
    DIAMONDS_A = "\u{1F0C1}",

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
    HEARTS_A = "\u{1F0B1}",

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
    SPADES_A = "\u{1F0A1}"
}

export enum Suit {
    UNKNOWN = 0,
    CLUBS = 1,
    DIAMONDS = 2,
    HEARTS = 3,
    SPADES = 4
}

export type PlayingCardInfo = {
    suit: Suit;
    rank: number;
    unicode: string;
};

// 0 is hidden
export function intToPlayingCard(num: number): PlayingCardInfo {
    if (num === 0) {
        return {
            suit: Suit.UNKNOWN,
            rank: 0,
            unicode: PlayingCardEnum.CARD_BACK
        }
    }
    const rank = ((num - 1) % 13) + 2;
    const suit = Math.floor((num - 1) / 13) + 1;
    const unicode = Object.values(PlayingCardEnum)[num];
    return { suit, rank, unicode };
}

export type Move = {
    action: PlayerAction;
    amount: number | undefined;
};

export type ValidMove = MoveDTO;

export enum Seat {
    SB = "Small Blind",
    BB = "Big Blind",
    NORMAL = "---"
}

export type Winner = WinnerDTO;

export type Player = {
    address: string;
    chips: number;
    holeCards: number[] | undefined;
    lastMove: Move | undefined;
    validMoves: ValidMove[];
    seat: Seat;
    isActive: boolean;
    isEliminated: boolean;
    isTurn: boolean;
};

export type TexasHoldemState = {
    address: string;
    smallBlind: number;
    bigBlind: number;
    players: Player[];
    flop: number[];
    turn: number;
    river: number;
    pot: number;
    currentBet: number;
    round: string;
    winners: Winner[];
};