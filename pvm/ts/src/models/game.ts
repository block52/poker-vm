import { PlayerStatus, PlayerDTO } from "@bitcoinbrisbane/block52";
import { IJSONModel } from "./interfaces";
import { Card } from "./deck";
import { Turn } from "../engine/types";

export class Player implements IJSONModel {
    chips: bigint = 0n;
    holeCards: [Card, Card] | undefined;
    lastAction: Turn | undefined;
    status: PlayerStatus = PlayerStatus.SITTING_OUT;
    // actions: LegalAction[] = [];

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
