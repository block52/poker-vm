import { PlayerStatus, PlayerDTO, Card } from "@block52/poker-vm-sdk";
import { IJSONModel } from "./interfaces";
import { Turn } from "../engine/types";

export class Player implements IJSONModel {
    chips: bigint = 0n;
    holeCards: [Card, Card] | undefined;
    lastAction: Turn | undefined;
    lastActed?: number;
    status: PlayerStatus = PlayerStatus.ACTIVE;

    private _previousActions: Turn[] = [];

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
        this.lastActed = undefined;
    }

    updateStatus(status: PlayerStatus): void {
        this.status = status;
    }

    addAction(action: Turn, timestamp: number): void {
        this._previousActions.push(action);
        this.lastAction = action;
        this.lastActed = timestamp;
    };

    previousActions(): Turn[] {
        return this._previousActions;
    }

    public toJson(): PlayerDTO {
        return {} as PlayerDTO;
    }
}
