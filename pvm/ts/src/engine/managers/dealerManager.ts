import { PlayerStatus } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import { IDealerGameInterface, IDealerPositionManager } from "../types";

/**
 * Standalone dealer position manager that works with TexasHoldemGame instances
 */
export class DealerPositionManager implements IDealerPositionManager {
    private readonly game: IDealerGameInterface;

    constructor(game: IDealerGameInterface) {
        this.game = game;
    }

    /**
     * Rotates dealer position to the next active player after each hand
     */
    private rotateDealer(): number {
        // Use effective dealer position (the actual player who was dealer)
        const currentDealer = this.getEffectiveDealerPosition();
        const activePlayers = this.game.findActivePlayers();

        // Find the next active player after the current dealer
        const nextDealer = this.findNextActivePlayer(currentDealer);

        if (nextDealer) {
            const nextDealerSeat = this.game.getPlayerSeatNumber(nextDealer.address);
            console.log(`Rotating dealer from seat ${currentDealer} to seat ${nextDealerSeat}`);
            return nextDealerSeat;
        }

        // Fallback: if no next player found, start from first active player
        const firstActivePlayer = activePlayers[0];
        const fallbackSeat = this.game.getPlayerSeatNumber(firstActivePlayer.address);
        return fallbackSeat;
    }

    public getPosition(name: string): number {
        switch (name.toLowerCase()) {
            case "dealer":
            case "d":
                return this.getDealerPosition();
            case "small blind":
            case "small-blind":
            case "sb":
                return this.getSmallBlindPosition();
            case "big blind":
            case "big-blind":
            case "bb":
                return this.getBigBlindPosition();
            default:
                throw new Error(`Unknown position name: ${name}`);
        }
    }
    /**
     * Gets the current dealer position, initializing if necessary
     */
    public getDealerPosition(): number {
        const currentDealerSeat = this.getCurrentDealerSeat();
        return currentDealerSeat;
    }

    /**
     * Finds the next active player starting from a given seat
     */
    public findNextActivePlayer(startSeat: number): Player | undefined {
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
     * Finds the next active player starting from a given seat
     */
    private findNextPlayer(startSeat: number): Player | undefined {
        const maxSeats = this.game.maxPlayers;

        // Start searching from the next seat after startSeat
        let searchSeat = startSeat + 1;
        if (searchSeat > maxSeats) {
            searchSeat = 1;
        }

        // Search from startSeat+1 to maxSeats
        for (let seat = searchSeat; seat <= maxSeats; seat++) {
            const player = this.game.getPlayerAtSeat(seat);
            if (player && this.isPlayerSittingIn(player)) {
                return player;
            }
        }

        // Wrap around and search from 1 to startSeat
        for (let seat = 1; seat < startSeat; seat++) {
            const player = this.game.getPlayerAtSeat(seat);
            if (player && this.isPlayerSittingIn(player)) {
                return player;
            }
        }

        return undefined;
    }

    /**
     * Handles dealer position when a player leaves
     */
    public handlePlayerLeave(seat: number): void {
        const currentDealerSeat = this.getCurrentDealerSeat();

        // If the leaving player is the dealer, rotate to next player
        if (currentDealerSeat === seat) {
            const remainingPlayers = this.game.findActivePlayers().filter(p => this.game.getPlayerSeatNumber(p.address) !== seat);

            if (remainingPlayers.length >= this.game.minPlayers) {
                this.rotateDealer();
            } else if (remainingPlayers.length === 1) {
                // Only one player left, they become dealer
                // const newDealerSeat = this.game.getPlayerSeatNumber(remainingPlayers[0].address);
                // this.setDealerPosition(newDealerSeat);
            }
        }
    }

    /**
     * Handles dealer position when a new player joins
     */
    public handlePlayerJoin(_seat: number): void {
        // const activePlayers = this.game.findActivePlayers();

        // if (activePlayers.length === 1) {
        //     // First player becomes dealer by default
        //     // this.setDealerPosition(newPlayerSeat);
        // } else if (activePlayers.length === this.game.minPlayers && !this.getCurrentDealerSeat()) {
        //     // If somehow dealer wasn't set, initialize it
        // }
        // // For more players, dealer position doesn't change when someone joins
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
        const activePlayers = this.game.findActivePlayers();

        // Heads-up: effective dealer is the small blind
        if (activePlayers.length === 2) {
            return this.getEffectiveDealerPosition();
        }

        // 3+ players: small blind is next active player after dealer
        const sbPlayer = this.findNextActivePlayer(dealerSeat);
        return sbPlayer ? this.game.getPlayerSeatNumber(sbPlayer.address) : (dealerSeat % this.game.maxPlayers) + 1;
    }

    /**
     * Gets big blind position based on dealer and small blind
     */
    public getBigBlindPosition(): number {
        const activePlayers = this.game.findActivePlayers();

        // Heads-up: big blind is the non-dealer (next player after effective dealer)
        if (activePlayers.length === 2) {
            const effectiveDealer = this.getEffectiveDealerPosition();
            const bbPlayer = this.findNextActivePlayer(effectiveDealer);
            return bbPlayer ? this.game.getPlayerSeatNumber(bbPlayer.address) : (effectiveDealer % this.game.maxPlayers) + 1;
        }

        // 3+ players: big blind is next active player after small blind
        const sbSeat = this.getSmallBlindPosition();
        const bbPlayer = this.findNextActivePlayer(sbSeat);
        return bbPlayer ? this.game.getPlayerSeatNumber(bbPlayer.address) : (sbSeat % this.game.maxPlayers) + 1;
    }

    /**
     * Helper method to check if a player is active
     */
    private isPlayerActive(player: Player): boolean {
        return (player.status === PlayerStatus.ACTIVE || player.status === PlayerStatus.SHOWING) && player.chips > 0;
    }

    private isPlayerSittingIn(player: Player): boolean {
        return player.status !== PlayerStatus.SITTING_OUT;
    }

    /**
     * Helper method to get current dealer seat from game
     */
    getCurrentDealerSeat(): number {
        // Access the dealer position from the game's positions object
        return this.game.dealerPosition;
    }

    /**
     * Gets the effective dealer position (the actual player holding the button)
     * If dealer seat is empty, finds the next active player after dealer button
     */
    private getEffectiveDealerPosition(): number {
        const dealerSeat = this.getDealerPosition();
        const dealerPlayer = this.game.getPlayerAtSeat(dealerSeat);

        // If there's an active player at the dealer seat, they're the dealer
        if (dealerPlayer && this.isPlayerActive(dealerPlayer)) {
            return dealerSeat;
        }

        // Otherwise, find the next active player after the dealer button
        const nextPlayer = this.findNextActivePlayer(dealerSeat);
        return nextPlayer ? this.game.getPlayerSeatNumber(nextPlayer.address) : dealerSeat;
    }

    /**
     * Method to handle new hand initialization
     */
    public handleNewHand(): number {
        return this.rotateDealer();
        // const activePlayers = this.game.findActivePlayers();

        // if (activePlayers.length === 2) {
        //     // Heads-up: dealer alternates each hand
        //     return this.handleHeadsUpDealer();
        // } else {
        //     // Multi-player: rotate to next active player
        //     return this.rotateDealer();
        // }
    }
}
