import { PlayerAction, PlayerDTO, TexasHoldemDTO } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Card } from "./deck";

export type PlayerId = string;

export type Range = {
    minAmount: number;
    maxAmount: number;
}

export enum StageType {
    PRE_FLOP = 0,
    FLOP = 1,
    TURN = 2,
    RIVER = 3,
    SHOWDOWN = 4
}

export enum PlayerStatus {
    ACTIVE,
    FOLD,
    ALL_IN
}

export type Move = {
    playerId: PlayerId;
    action: PlayerAction;
    amount?: number;
};

export interface IUpdate {
    addMove(move: Move): void;
}

export class Player implements IJSONModel {
    constructor(
        private _address: string,
        private _name: string,
        public chips: number,
        public holeCards?: [Card, Card] // Each player has 2 cards, represented as strings like 'As' (Ace of spades)
    ) { }

    get id(): PlayerId { return this._address; }
    get name(): string { return this.name; }

    public toJson(): PlayerDTO {
        return {
            address: this._address,
            chips: this.chips,
            holeCards: this.holeCards ? this.holeCards.map(c => c.value) : undefined,
            isActive: true,
            isTurn: true,
            isSmallBlind: false,
            isBigBling: false
        }
    }
}

export class TexasHoldemState implements IJSONModel {
    constructor(
        private address: string,
        private smallBlind: number,
        private bigBlind: number,
        private players: Player[],
        private communityCards: Card[],
        private pot: number,
        private currentBet: number,
        private currentPlayerAddress: string,
        private round: number,
        private winner?: number,
    ) { }

    public toJson(): TexasHoldemDTO {
        return {
            address: this.address,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind,
            players: this.players.map(p => p.toJson()),
            communityCards: this.communityCards.map(c => c.value),
            pot: this.pot,
            currentBet: this.currentBet,
            currentPlayerAddress: this.currentPlayerAddress,
            round: ""
        };
    }
}
