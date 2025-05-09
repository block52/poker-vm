import { PlayerStatus, PlayerDTO, Card } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Turn } from "../engine/types";
import { Stack } from "../core/datastructures/stack";

export class Player implements IJSONModel {
    chips: bigint = 0n;
    holeCards: [Card, Card] | undefined;
    lastAction: Turn | undefined;
    lastActed?: number;
    status: PlayerStatus = PlayerStatus.ACTIVE;

    private _previousActions: Stack<Turn> = new Stack<Turn>();
    // The last action is the top of the stack.

    get id(): string { return this.address; }

    constructor(
        readonly address: string,
        lastAction: Turn | undefined,
        chips: bigint,
        holeCards: [Card, Card] | undefined,
        status: PlayerStatus
    ) {
        this.chips = chips;
        this.holeCards = holeCards;
        this.lastAction = lastAction;
        this.status = status;
    }

    reinit(): void {
        this.holeCards = undefined;
        this.lastAction = undefined;
        this.status = PlayerStatus.ACTIVE;
        this.chips = 0n;
        this.lastActed = undefined;
    }

    updateStatus(status: PlayerStatus): void {
        this.status = status;
    }

    addAction(action: Turn, timestamp: number): void {
        this._previousActions.push(action);

        // Could peek at the top of the stack to get the last action.
        this.lastAction = action;
        this.lastActed = timestamp;
    };

    previousActions(): Turn[] {
        return this._previousActions.toArray();
    }

    public toJson(): PlayerDTO {
        return {} as PlayerDTO;
    }
}
