import { MoveDTO, PlayerAction, PlayerDTO, TexasHoldemGameStateDTO, TexasHoldemJoinStateDTO, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Card } from "./deck";
import TexasHoldemGame from "../engine/texasHoldem";

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
    SHOWDOWN = 4,
    JOIN = 5
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

export type ValidMove = MoveDTO;

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
        const isActive = game.getPlayerStatus(this) === PlayerStatus.ACTIVE;
        const isSmallBlind = game.smallBlindPosition === position;
        const isBigBlind = game.bigBlindPosition === position;
        const lastMove = game.getLastAction(this.id);
        const validMoves = game.getValidActions(this.id);
        return new PlayerState(this, isActive, isSmallBlind, isBigBlind, lastMove, validMoves);
    }
}

export class PlayerState implements IJSONModel {
    private readonly _dto: PlayerDTO;

    constructor(
        player: Player,
        isActive: boolean,
        isSmallBlind: boolean,
        isBigBlind: boolean,
        lastMove_: Move | undefined,
        validMoves: ValidMove[],
    ) {
        const holeCards = player.holeCards?.map(p => p.value);
        const lastMove = lastMove_ ? { action: lastMove_.action, minAmount: lastMove_.amount, maxAmount: undefined } : undefined;
        this._dto = { address: player.id, chips: player.chips, holeCards, lastMove, validMoves, isActive, isSmallBlind, isBigBlind };
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
    private static RoundMap = new Map<StageType, string>([
        [StageType.PRE_FLOP, "Pre-flop"],
        [StageType.FLOP, "Flop"],
        [StageType.TURN, "Turn"],
        [StageType.RIVER, "River"],
        [StageType.SHOWDOWN, "Showdown"],
    ]);

    private readonly _dto: TexasHoldemGameStateDTO;

    constructor(
        address: string,
        smallBlind: number,
        bigBlind: number,
        players_: PlayerState[],
        communityCards_: Card[],
        pot: number,
        currentBet: number,
        round_: StageType,
        winner?: number,
    ) {
        const players = players_.map(p => p.toJson());
        const communityCards = communityCards_.map(c => c.value);
        const round = TexasHoldemGameState.RoundMap.get(round_)!;
        this._dto = { type: "game", address, smallBlind, bigBlind, players, communityCards, pot, currentBet, round };
    }

    public toJson(): TexasHoldemGameStateDTO { return this._dto; }
}

export class TexasHoldemState implements IJSONModel {
    constructor(private _state?: TexasHoldemJoinState | TexasHoldemGameState) {
    }

    public toJson(): TexasHoldemStateDTO { return this._state?.toJson() ?? { type: "join", players: [] } };
}