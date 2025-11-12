import { GameOptions, KEYS, NonPlayerActionType, PlayerActionType, TexasHoldemStateDTO, TransactionResponse } from "@bitcoinbrisbane/block52";

import { ICommand, ISignedResponse } from "../interfaces";
import TexasHoldemGame from "../../engine/texasHoldem";
import { getSocketService } from "../../core/socketserver";

export class PerformActionCommand implements ICommand<TexasHoldemStateDTO> {

    private readonly texasHoldemGame: TexasHoldemGame;
    private readonly socketService = getSocketService();

    constructor(
        protected readonly from: string,
        protected readonly to: string,
        protected readonly index: number, // Allow array for join actions with seat number
        protected readonly value: bigint,
        protected readonly action: PlayerActionType | NonPlayerActionType,
        gameState: any,
        gameOptions: GameOptions,
        protected readonly data?: string,
    ) {
        // Reconstruct game from passed-in state (now includes all hole cards since toJson was modified)
        this.texasHoldemGame = TexasHoldemGame.fromJson(gameState, gameOptions);
    }

    public async execute(): Promise<TexasHoldemStateDTO> {
        console.log(`Executing ${this.action} command...`);

        const params = new URLSearchParams();
        params.set(KEYS.ACTION_TYPE, this.action.toString());
        params.set(KEYS.INDEX, this.index.toString());
        params.set(KEYS.VALUE, this.value.toString());

        // If data is provided, append it to the params
        if (this.data) {
            const dataParams = new URLSearchParams(this.data);
            for (const [key, value] of dataParams.entries()) {
                params.set(key, value);
            }
        }

        this.texasHoldemGame.performAction(this.from, this.action, this.index, this.value, this.data);

        const updatedGameState: TexasHoldemStateDTO = this.texasHoldemGame.toJson();
        console.log("Updated Game State:", updatedGameState);

        // Broadcast game state update via WebSocket to ALL players at the table
        if (this.socketService) {
            try {
                // Get all subscribers for this table
                const subscribers = this.socketService.getSubscribers(this.to);
                console.log(`🔔 Broadcasting to ${subscribers.length} subscribers at table ${this.to.substring(0, 12)}...`);

                // Send personalized game state to each subscriber
                for (const subscriberId of subscribers) {
                    console.log(`  → Sending personalized state to ${subscriberId.substring(0, 12)}...`);

                    // Generate game state from this subscriber's perspective
                    const personalizedState = this.texasHoldemGame.toJson(subscriberId);

                    // 🃏 DEBUG: Log hole cards being sent
                    const subscriberPlayer = personalizedState.players.find(p => p.address?.toLowerCase() === subscriberId.toLowerCase());
                    console.log(`  🃏 Subscriber ${subscriberId.substring(0, 12)}... hole cards:`, subscriberPlayer?.holeCards);

                    this.socketService.broadcastGameStateUpdate(this.to, subscriberId, personalizedState);
                }

                console.log(`✅ Broadcasted game state update to ${subscribers.length} subscribers after performing action: ${this.action}`);
            } catch (error) {
                console.error("❌ Error broadcasting game state update:", error);
            }
        }


        return updatedGameState;
    }
}
