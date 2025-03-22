import { PlayerStatus, PlayerDTO, Card } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Turn } from "../engine/types";
import { Stack } from "../core/datastructures/stack";

export class Player implements IJSONModel {
    chips: bigint = 0n;
    holeCards: [Card, Card] | undefined;
    lastAction: Turn | undefined;
    status: PlayerStatus = PlayerStatus.ACTIVE;

    private _previousActions: Stack<Turn> = new Stack<Turn>();

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

    updateStatus(status: PlayerStatus): void {
        this.status = status;
    }

    addAction(action: Turn): void {
        this._previousActions.push(action);

        // Could peek at the top of the stack to get the last action.
        this.lastAction = action;
    };

    previousActions(): Turn[] {
        return this._previousActions.toArray();
    }

    public toJson(): PlayerDTO { 
        return {} as PlayerDTO;
    }
}
