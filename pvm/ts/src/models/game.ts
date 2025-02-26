import { PlayerStatus, PlayerDTO } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Card } from "./deck";
import { Turn } from "../engine/types";
import { Stack } from "../core/datastructures/stack";

export class Player implements IJSONModel {
    chips: bigint = 0n;
    holeCards: [Card, Card] | undefined;
    lastAction: Turn | undefined;
    status: PlayerStatus = PlayerStatus.ACTIVE;
    // actions: LegalAction[] = [];

    private _previousActions: Stack<Turn> = new Stack<Turn>();

    get id(): string { return this.address; }

    // get address(): string { return this.address; }

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

    updateStatus(status: PlayerStatus): void {
        this.status = status;
    }

    addAction(action: Turn): void {
        this._previousActions.push(action);

        // Could peek at the top of the stack to get the last action.
        this.lastAction = action;
    };

    public toJson(): PlayerDTO { 
        // return this._dto; 
        return {} as PlayerDTO;
    }
}
