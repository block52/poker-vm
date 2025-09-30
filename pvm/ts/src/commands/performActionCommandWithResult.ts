import { NonPlayerActionType, PerformActionResponse, PlayerActionType } from "@bitcoinbrisbane/block52";
import { ICommand, ISignedResponse } from "./interfaces";
import { PerformActionCommand } from "./performActionCommand";
import { GameStateCommand } from "./gameStateCommand";
import { signResult } from "./abstractSignedCommand";
import { getSocketService } from "../core/socketserver";

export class PerformActionCommandWithResult extends PerformActionCommand implements ICommand<ISignedResponse<PerformActionResponse>> {

    constructor(
        readonly from: string,
        readonly to: string,
        readonly index: number, // Turn index
        readonly value: bigint,
        readonly action: PlayerActionType | NonPlayerActionType,
        readonly nonce: number,
        readonly privateKey: string,
        readonly data?: string,
        readonly addToMempool: boolean = true // Whether to add the transaction to the mempool
    ) {
        super(from, to, index, value, action, nonce, privateKey, data);
    }

    public override async execute(): Promise<ISignedResponse<PerformActionResponse>> {
        console.log("Executing perform action command with result...");
        const response = await super.execute();
        console.log("Perform action command with result executed successfully");

        const gameStateCommand = new GameStateCommand(this.to, this.privateKey, this.from);
        const gameStateResponse = await gameStateCommand.execute();

        const result: PerformActionResponse = {
            state: gameStateResponse.data,
            nonce: response.data.nonce,
            to: response.data.to,
            from: response.data.from,
            value: response.data.value,
            hash: response.data.hash,
            signature: response.data.signature,
            timestamp: response.data.timestamp,
            data: this.action
        };

        // Broadcast the game state update to all subscribed clients
        const socketService = getSocketService();
        if (socketService) {
            console.log(`Broadcasting game state update for table ${this.to} after action ${this.action}`);
            // Use the new method that broadcasts to ALL subscribers, not just players in the game
            // This ensures that non-player actions (JOIN, LEAVE, DEAL, NEW_HAND) also trigger socket events
            // for all subscribers watching the table
            await socketService.broadcastGameStateToAllSubscribers(this.to);
        }

        return signResult(result, this.privateKey);
    }
}
