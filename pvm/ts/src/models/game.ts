import { ActionDTO, PlayerActionType, PlayerStatus, PlayerDTO, TexasHoldemGameStateDTO, TexasHoldemJoinStateDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Card } from "./deck";
import TexasHoldemGame from "../engine/texasHoldem";
import { ethers } from "ethers";

export type PlayerId = string;

export type Range = {
    minAmount: BigInt;
    maxAmount: BigInt;
}

export type Turn = {
    playerId: PlayerId;
    action: PlayerActionType;
    amount?: BigInt;
};

export type LegalAction = ActionDTO;

export interface IUpdate {
    addAction(action: Turn): void;
}

export class Player {
    constructor(
        private readonly _address: string,
        public chips: BigInt,
        public holeCards?: [Card, Card]
    ) { }

    get id(): PlayerId { return this._address; }

    getPlayerState(game: TexasHoldemGame, position: number): PlayerState {
        const isSmallBlind = game.smallBlindPosition === position;
        const isBigBlind = game.bigBlindPosition === position;
        const isDealer = game.dealerPosition === position;
        
        const lastMove = game.getLastAction(this.id);
        const validMoves = game.getValidActions(this.id);
        // const actions = validMoves.map(m => ({ action: m.action, min: m.minAmount.toString(), max: m.maxAmount.toString() }));
        return new PlayerState(this, isSmallBlind, isBigBlind, isDealer, lastMove, position, PlayerStatus.ACTIVE, validMoves);
    }
}

export class PlayerState implements IJSONModel {
    private readonly _dto: PlayerDTO;

    constructor(
        player: Player,
        isSmallBlind: boolean,
        isBigBlind: boolean,
        isDealer: boolean,
        lastAction: Turn | undefined,
        position: number,
        status: PlayerStatus,
        actions?: LegalAction[]
    ) {
        const holeCards = player.holeCards?.map(p => p.value);
        const lastActionDTO = (lastAction && lastAction.amount) ? { action: lastAction.action, amount: lastAction.amount.toString() } : undefined;
        const stack = player.chips.toString();

        this._dto = { 
            address: player.id, 
            seat: position, 
            stack, 
            isSmallBlind, 
            isBigBlind, 
            isDealer, 
            holeCards, 
            lastAction: lastActionDTO, 
            actions: [], 
            status, 
            timeout: 0, 
            signature: ethers.ZeroHash
        };
    }

    public toJson(): PlayerDTO { return this._dto; }
}

export class TexasHoldemGameState implements IJSONModel {
    // private static RoundMap = new Map<TexasHoldemRound, string>([
    //     [TexasHoldemRound.PREFLOP, "preflop"],
    //     [TexasHoldemRound.FLOP, "flop"],
    //     [TexasHoldemRound.TURN, "turn"],
    //     [TexasHoldemRound.RIVER, "river"],
    //     [TexasHoldemRound.SHOWDOWN, "showdown"],
    // ]);

    private readonly _dto: TexasHoldemGameStateDTO;

    constructor(
        address: string,
        sb: BigInt,
        bb: BigInt,
        dealer: number,
        players_: PlayerState[],
        communityCards_: Card[],
        pot: BigInt,
        currentBet: BigInt,
        round_: TexasHoldemRound,
        winners_?: Map<PlayerId, BigInt>
    ) {
        const players = players_.map(p => p.toJson());
        const communityCards = communityCards_.map(c => c.value);
        // const round = TexasHoldemGameState.RoundMap.get(round_)!;
        const winners = winners_ ? Array.from(winners_.entries()).map(([address, amount]) => ({ address, amount: Number(amount) })) : [];

        const smallBlind = sb.toString();
        const bigBlind = bb.toString();;
        const pots = [pot.toString()];

        this._dto = { type: "cash", address, smallBlind, bigBlind, dealer, players, communityCards, pots, nextToAct: 0, round: round_, winners, signature: ethers.ZeroHash };
    }

    public toJson(): TexasHoldemGameStateDTO { return this._dto; }

    public static fromJson(json: any): TexasHoldemGameState {
        return new TexasHoldemGameState(json.address, BigInt(parseInt(json.smallBlind)), BigInt(parseInt(json.bigBlind)), json.dealer, [], [], BigInt(0), BigInt(0), TexasHoldemRound.PREFLOP);
    }
}
