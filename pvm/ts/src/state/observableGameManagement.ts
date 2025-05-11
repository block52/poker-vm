import { GameManagement } from "./gameManagement";
import { getSocketService } from "../core/socketserver";
import { TexasHoldemGameState } from "@bitcoinbrisbane/block52";

// Extend the GameManagement class to incorporate socket notifications
export class ObservableGameManagement extends GameManagement {
    constructor() {
        super();
    }

    // Override the saveFromJSON method to notify subscribers after saving
    public async saveFromJSON(json: any): Promise<void> {
        // First call the parent method to save the game state
        await super.saveFromJSON(json);

        // After saving, notify subscribers of the change
        const socketService = getSocketService();
        if (socketService && json.address) {
            socketService.broadcastGameStateUpdate(json.address, json);
        }
    }

    // Override the save method to notify subscribers after saving
    public async save(state: any): Promise<void> {
        // First call the parent method to save the game state
        await super.save(state);

        const socketService = getSocketService();
        if (socketService) {
            // Get the address from the state
            const address = state.toJson().address;
            if (address) {
                // Get the full game state after saving to broadcast
                const gameState = await this.get(address);
                if (gameState) {
                    // const state: TexasHoldemGameState = {

                    // }
                    socketService.broadcastGameStateUpdate(address, state);
                }
            }
        }
    }
}

// Singleton instance accessor
let observableGameManagementInstance: ObservableGameManagement;

export const getObservableGameManagementInstance = (): ObservableGameManagement => {
    if (!observableGameManagementInstance) {
        observableGameManagementInstance = new ObservableGameManagement();
    }
    return observableGameManagementInstance;
};
