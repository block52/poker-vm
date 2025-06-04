import { PlayerStatus } from "@bitcoinbrisbane/block52";
import { Player } from "../models/player";
import TexasHoldemGame from "./TexasHoldemGame";

/**
 * Standalone dealer position manager that works with TexasHoldemGame instances
 */
export class DealerPositionManager {
    private readonly game: TexasHoldemGame;

    constructor(game: TexasHoldemGame) {
        this.game = game;
    }

    /**
     * Initializes the dealer position when the game starts
     */
    public initializeDealerPosition(): number {
        const activePlayers = this.game.findActivePlayers();
        
        if (activePlayers.length < 2) {
            throw new Error("Not enough players to start the game");
        }

        // Start with the first active player as dealer
        const firstActivePlayer = activePlayers[0];
        const dealerSeat = this.game.getPlayerSeatNumber(firstActivePlayer.address);
        
        // Update the game's dealer position
        this.setDealerPosition(dealerSeat);
        return dealerSeat;
    }

    /**
     * Rotates dealer position to the next active player after each hand
     */
    public rotateDealer(): number {
        const currentDealer = this.getCurrentDealerSeat();
        if (!currentDealer) {
            return this.initializeDealerPosition();
        }

        const activePlayers = this.game.findActivePlayers();
        
        if (activePlayers.length < 2) {
            throw new Error("Not enough players to continue");
        }

        // Find the next active player after the current dealer
        const nextDealer = this.findNextActivePlayer(currentDealer);
        
        if (nextDealer) {
            const nextDealerSeat = this.game.getPlayerSeatNumber(nextDealer.address);
            this.setDealerPosition(nextDealerSeat);
            return nextDealerSeat;
        }

        // Fallback: if no next player found, start from first active player
        const firstActivePlayer = activePlayers[0];
        const fallbackSeat = this.game.getPlayerSeatNumber(firstActivePlayer.address);
        this.setDealerPosition(fallbackSeat);
        return fallbackSeat;
    }

    /**
     * Gets the current dealer position, initializing if necessary
     */
    public getDealerPosition(): number {
        const currentDealerSeat = this.getCurrentDealerSeat();
        
        // If dealer position is not set, initialize it
        if (!currentDealerSeat) {
            return this.initializeDealerPosition();
        }

        // Check if current dealer is still active
        const dealerPlayer = this.game.getPlayerAtSeat(currentDealerSeat);
        if (!dealerPlayer || !this.isPlayerActive(dealerPlayer)) {
            return this.rotateDealer();
        }

        return currentDealerSeat;
    }

    /**
     * Finds the next active player starting from a given seat
     */
    private findNextActivePlayer(startSeat: number): Player | undefined {
        const maxSeats = this.game.maxPlayers;
        
        // Start searching from the next seat after startSeat
        let searchSeat = startSeat + 1;
        if (searchSeat > maxSeats) {
            searchSeat = 1;
        }

        // Search from startSeat+1 to maxSeats
        for (let seat = searchSeat; seat <= maxSeats; seat++) {
            const player = this.game.getPlayerAtSeat(seat);
            if (player && this.isPlayerActive(player)) {
                return player;
            }
        }

        // Wrap around and search from 1 to startSeat
        for (let seat = 1; seat < startSeat; seat++) {
            const player = this.game.getPlayerAtSeat(seat);
            if (player && this.isPlayerActive(player)) {
                return player;
            }
        }

        return undefined;
    }

    /**
     * Handles dealer position when a player leaves
     */
    public handlePlayerLeave(leavingSeat: number): void {
        const currentDealerSeat = this.getCurrentDealerSeat();
        
        // If the leaving player is the dealer, rotate to next player
        if (currentDealerSeat === leavingSeat) {
            const remainingPlayers = this.game.findActivePlayers().filter(
                p => this.game.getPlayerSeatNumber(p.address) !== leavingSeat
            );
            
            if (remainingPlayers.length >= 2) {
                this.rotateDealer();
            } else if (remainingPlayers.length === 1) {
                // Only one player left, they become dealer
                const newDealerSeat = this.game.getPlayerSeatNumber(remainingPlayers[0].address);
                this.setDealerPosition(newDealerSeat);
            }
        }
    }

    /**
     * Handles dealer position when a new player joins
     */
    public handlePlayerJoin(newPlayerSeat: number): void {
        const activePlayers = this.game.findActivePlayers();
        
        if (activePlayers.length === 1) {
            // First player becomes dealer by default
            this.setDealerPosition(newPlayerSeat);
        } else if (activePlayers.length === 2 && !this.getCurrentDealerSeat()) {
            // If somehow dealer wasn't set, initialize it
            this.initializeDealerPosition();
        }
        // For more players, dealer position doesn't change when someone joins
    }

    /**
     * Special handling for heads-up (2 player) games
     */
    public handleHeadsUpDealer(): number {
        const activePlayers = this.game.findActivePlayers();
        
        if (activePlayers.length !== 2) {
            return this.rotateDealer();
        }

        // In heads-up, dealer alternates each hand
        const currentDealerSeat = this.getCurrentDealerSeat();
        const otherPlayer = activePlayers.find(
            p => this.game.getPlayerSeatNumber(p.address) !== currentDealerSeat
        );
        
        if (otherPlayer) {
            const newDealerSeat = this.game.getPlayerSeatNumber(otherPlayer.address);
            this.setDealerPosition(newDealerSeat);
            return newDealerSeat;
        }

        return currentDealerSeat || 1;
    }

    /**
     * Validates dealer position consistency
     */
    public validateDealerPosition(): boolean {
        const dealerSeat = this.getCurrentDealerSeat();
        
        if (!dealerSeat) {
            return false;
        }

        const dealerPlayer = this.game.getPlayerAtSeat(dealerSeat);
        if (!dealerPlayer) {
            return false;
        }

        return this.isPlayerActive(dealerPlayer);
    }

    /**
     * Gets small blind position based on dealer
     */
    public getSmallBlindPosition(): number {
        const dealerSeat = this.getDealerPosition();
        const activePlayers: Player[] = this.game.findActivePlayers();

        if (activePlayers.length === 2) {
            // In heads-up, dealer is small blind
            return dealerSeat;
        }

        // Multi-player: small blind is next active player after dealer
        const sbPlayer = this.findNextActivePlayer(dealerSeat);
        return sbPlayer ? this.game.getPlayerSeatNumber(sbPlayer.address) : dealerSeat + 1;
    }

    /**
     * Gets big blind position based on dealer and small blind
     */
    public getBigBlindPosition(): number {
        const sbSeat = this.getSmallBlindPosition();
        const activePlayers: Player[] = this.game.findActivePlayers();

        if (activePlayers.length === 2) {
            // In heads-up, non-dealer is big blind
            const dealerSeat = this.getDealerPosition();
            const otherPlayer = activePlayers.find(
                p => this.game.getPlayerSeatNumber(p.address) !== dealerSeat
            );
            return otherPlayer ? this.game.getPlayerSeatNumber(otherPlayer.address) : sbSeat + 1;
        }

        // Multi-player: big blind is next active player after small blind
        const bbPlayer = this.findNextActivePlayer(sbSeat);
        return bbPlayer ? this.game.getPlayerSeatNumber(bbPlayer.address) : sbSeat + 1;
    }

    /**
     * Helper method to check if a player is active
     */
    private isPlayerActive(player: Player): boolean {
        return player.status === PlayerStatus.ACTIVE || 
               player.status === PlayerStatus.NOT_ACTED;
    }

    /**
     * Helper method to get current dealer seat from game
     */
    private getCurrentDealerSeat(): number | undefined {
        // Access the dealer position from the game's positions object
        return (this.game as any)._positions?.dealer;
    }

    /**
     * Helper method to set dealer position in game
     */
    private setDealerPosition(seat: number): void {
        this.game.setDealerPosition(seat);
    }

    /**
     * Method to handle new hand initialization
     */
    public handleNewHand(): number {
        const activePlayers = this.game.findActivePlayers();
        
        if (activePlayers.length === 2) {
            // Heads-up: dealer alternates each hand
            return this.handleHeadsUpDealer();
        } else {
            // Multi-player: rotate to next active player
            return this.rotateDealer();
        }
    }
}