import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { PerformActionCommand } from "./performActionCommand";

export class ClaimCommand extends PerformActionCommand {
    constructor(
        from: string,
        to: string,
        index: number,
        nonce: number,
        privateKey: string,
        addToMempool: boolean = true
    ) {
        // TODO: Replace string literal with NonPlayerActionType.CLAIM after SDK update
        super(
            from,
            to,
            index,
            0n, // No value transfer for claim (funds come from table)
            "claim" as NonPlayerActionType,
            nonce,
            privateKey,
            undefined, // No additional data needed
            addToMempool
        );
    }
}