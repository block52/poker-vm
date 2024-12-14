import { ActionDTO, PlayerActionType, PlayerStatus, PlayerDTO, TexasHoldemGameStateDTO, TexasHoldemJoinStateDTO, TexasHoldemStateDTO, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Card } from "./deck";
import TexasHoldemGame from "../engine/texasHoldem";
import { ethers } from "ethers";

export type PlayerId = string;

export type Range = {
    minAmount: number;
    maxAmount: number;
}

// // use sdk
// export enum StageType {
//     PRE_FLOP = 0,
//     FLOP = 1,
//     TURN = 2,
//     RIVER = 3,
//     SHOWDOWN = 4,
//     JOIN = 5
// }

// // use sdk
// export enum PlayerStatus {
//     ACTIVE,
//     FOLD,
//     ALL_IN,
//     ELIMINATED
// }

export type Move = {
    playerId: PlayerId;
    action: PlayerActionType;
    amount?: number;
};

export type ValidMove = ActionDTO;

export interface IUpdate {
    addMove(move: Move): void;
}

export class Player {
    constructor(
        private _address: string,
        public chips: number,
        public holeCards?: [Card, Card]
    ) { }

    get id(): PlayerId { return this._address; }

    getPlayerState(game: TexasHoldemGame, position: number) {
        const status = game.getPlayerStatus(this);
        const isActive = status === PlayerStatus.ACTIVE;
        const isEliminated = status == PlayerStatus.SITTING_OUT;
        const isSmallBlind = game.smallBlindPosition === position;
        const isBigBlind = game.bigBlindPosition === position;
        const lastMove = game.getLastAction(this.id);
        const validMoves = game.getValidActions(this.id);
        return new PlayerState(this, isActive, isEliminated, isSmallBlind, isBigBlind, lastMove, validMoves);
    }
}

export class PlayerState implements IJSONModel {
    private readonly _dto: PlayerDTO;

    constructor(
        player: Player,
        isActive: boolean,
        isEliminated: boolean,
        isSmallBlind: boolean,
        isBigBlind: boolean,
        lastMove_: Move | undefined,
        validMoves: ValidMove[],
    ) {
        const holeCards = player.holeCards?.map(p => p.value);
        const lastMove = lastMove_ ? { action: lastMove_.action, minAmount: lastMove_.amount, maxAmount: undefined } : undefined;
        this._dto = { address: player.id, stack: player.stack, holeCards, lastMove, validMoves, isActive, isEliminated, isSmallBlind, isBigBlind };
    }

    public toJson(): PlayerDTO { return this._dto; }
}

export class TexasHoldemJoinState implements IJSONModel {
    private readonly _dto: TexasHoldemJoinStateDTO;

    constructor(players: PlayerId[]) {
        this._dto = { type: "join", players };
    }

    public toJson(): TexasHoldemJoinStateDTO { return this._dto; }

}

export class TexasHoldemGameState implements IJSONModel {
    private static RoundMap = new Map<TexasHoldemRound, string>([
        [TexasHoldemRound.PREFLOP, "preflop"],
        [TexasHoldemRound.FLOP, "flop"],
        [TexasHoldemRound.TURN, "turn"],
        [TexasHoldemRound.RIVER, "river"],
        [TexasHoldemRound.SHOWDOWN, "showdown"],
    ]);

    private readonly _dto: TexasHoldemGameStateDTO;

    constructor(
        address: string,
        sb: number,
        bb: number,
        players_: PlayerState[],
        communityCards_: Card[],
        pot: number,
        currentBet: number,
        round_: TexasHoldemRound,
        winners_?: Map<PlayerId, number>
    ) {
        const players = players_.map(p => p.toJson());
        const communityCards = communityCards_.map(c => c.value);
        // const round = TexasHoldemGameState.RoundMap.get(round_)!;
        const winners = winners_ ? Array.from(winners_.entries()).map(([address, amount]) => ({ address, amount })) : [];

        const smallBlind = ethers.parseUnits(sb.toString(), 18).toString();
        const bigBlind = ethers.parseUnits(bb.toString(), 18).toString();
        const dealer = 0;
        const pots = [ethers.parseUnits(pot.toString(), 18).toString()];

        this._dto = { type: "cash", address, smallBlind, bigBlind, dealer, players, communityCards, pots, nextToAct: 0, round: round_, winners, signature: ethers.ZeroHash };
    }

    public toJson(): TexasHoldemGameStateDTO { return this._dto; }
}

export class TexasHoldemState implements IJSONModel {
    constructor(private _state?: TexasHoldemJoinState | TexasHoldemGameState) {
    }

    public toJson(): TexasHoldemStateDTO { return this._state?.toJson() ?? { type: "join", players: [] } };
}