import { ActionDTO, PlayerActionType, PlayerStatus, PlayerDTO, TexasHoldemGameStateDTO, TexasHoldemJoinStateDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Card } from "./deck";
// import TexasHoldemGame from "../engine/texasHoldem";
import { ethers } from "ethers";

// export type PlayerId = string;

export type Range = {
    minAmount: bigint;
    maxAmount: bigint;
}

export type Turn = {
    playerId: string;
    action: PlayerActionType;
    amount?: bigint;
};

export type LegalAction = ActionDTO;

export interface IUpdate {
    addAction(action: Turn): void;
}

// export class Player {
//     constructor(
//         private readonly _address: string,
//         public chips: bigint,
//         public holeCards?: [Card, Card]
//     ) { }

//     get id(): string { return this._address; }

//     getPlayerState(game: TexasHoldemGame, position: number): PlayerState {
//         // console.log("getPlayerState", this.id, position);
//         // console.log("getPlayerState bb", game.bigBlindPosition);

//         const isSmallBlind = game.smallBlindPosition === position;
//         const isBigBlind = game.bigBlindPosition === position;
//         const isDealer = game.dealerPosition === position;
        
//         const lastMove = game.getLastAction(this.id);
//         const validMoves = game.getValidActions(this.id);

//         // const actions = validMoves.map(m => ({ action: m.action, min: m.minAmount.toString(), max: m.maxAmount.toString() }));
//         return new PlayerState(this, isSmallBlind, isBigBlind, isDealer, lastMove, position, PlayerStatus.ACTIVE, validMoves);
//     }
// }

export class Player implements IJSONModel {
    // private readonly _dto: PlayerDTO;

    chips: bigint = BigInt(0);
    holeCards: [Card, Card] | undefined;
    lastAction: Turn | undefined;
    status: PlayerStatus = PlayerStatus.ACTIVE;
    actions: LegalAction[] = [];

    get id(): string { return this.address; }

    // get address(): string { return this.address; }

    constructor(
        readonly address: string,
        // isSmallBlind: boolean,
        // isBigBlind: boolean,
        // private isDealer: boolean,
        lastAction: Turn | undefined,
        // position: number,
        chips: bigint,
        holeCards: [Card, Card] | undefined,
        status: PlayerStatus,
        actions: LegalAction[]
    ) {

        this.chips = chips;
        this.holeCards = holeCards;
        this.lastAction = lastAction;
        this.status = status;
        this.actions = actions;

        // const holeCards = player.holeCards?.map(p => p.value);
        // const lastActionDTO = (lastAction && lastAction.amount) ? { action: lastAction.action, amount: lastAction.amount.toString() } : undefined;
        // const stack = player.chips.toString();

        // this._dto = { 
        //     address: address, 
        //     seat: position, 
        //     stack,
        //     isSmallBlind, 
        //     isBigBlind, 
        //     isDealer, 
        //     holeCards, 
        //     lastAction: lastActionDTO, 
        //     actions: [], 
        //     status, 
        //     timeout: 0, 
        //     signature: ethers.ZeroHash
        // };
    }

    // public setDealer(isDealer: boolean): void {
    //     // this._dto.isDealer = isDealer;
    //     this.isDealer = isDealer;
    // }

    addAction(action: Turn): void {
    };

    public toJson(): PlayerDTO { 
        // return this._dto; 
        return {} as PlayerDTO;
    }
}

// export class TexasHoldemGameState implements IJSONModel {
//     // private static RoundMap = new Map<TexasHoldemRound, string>([
//     //     [TexasHoldemRound.PREFLOP, "preflop"],
//     //     [TexasHoldemRound.FLOP, "flop"],
//     //     [TexasHoldemRound.TURN, "turn"],
//     //     [TexasHoldemRound.RIVER, "river"],
//     //     [TexasHoldemRound.SHOWDOWN, "showdown"],
//     // ]);

//     private readonly _dto: TexasHoldemGameStateDTO;

//     constructor(
//         readonly address: string,
//         sb: bigint,
//         bb: bigint,
//         readonly smallBlindPosition: number,
//         readonly bigBlindPosition: number,
//         readonly dealer: number,
//         // players_: PlayerState[],
//         communityCards_: Card[],
//         pot: bigint,
//         currentBet: bigint,
//         round_: TexasHoldemRound,
//         winners_?: Map<string, bigint>
//     ) {
//         // const players = players_.map(p => p.toJson());
//         const communityCards = communityCards_.map(c => c.value);
//         // const round = TexasHoldemGameState.RoundMap.get(round_)!;
//         const winners = winners_ ? Array.from(winners_.entries()).map(([address, amount]) => ({ address, amount: Number(amount) })) : [];

//         const smallBlind = sb.toString();
//         const bigBlind = bb.toString();
//         const pots = [pot.toString()];

//         this._dto = { type: "cash", address, smallBlindPosition, bigBlindPosition, smallBlind, bigBlind, dealer, players, communityCards, pots, nextToAct: 0, round: round_, winners, signature: ethers.ZeroHash };
//     }

//     public toJson(): TexasHoldemGameStateDTO { return this._dto; }

//     public static fromJson(json: any): TexasHoldemGameState {
//         return new TexasHoldemGameState(json.address, BigInt(parseInt(json.smallBlind)), BigInt(parseInt(json.bigBlind)), json.smallBlindPostion, json.bigBlindPostion, json.dealer, [], [], BigInt(0), BigInt(0), TexasHoldemRound.PREFLOP);
//     }
// }
