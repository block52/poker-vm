import { Player } from "../models/player";
import TexasHoldemGame from "../engine/texasHoldem";
import { PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { IDealerGameInterface, IDealerPositionManager } from "./types";
import { DealerPositionManager } from "./dealerManager";
import { baseGameConfig, gameOptions } from "./testConstants";

// ==================== MOCK IMPLEMENTATIONS ====================

// /**
//  * Mock game implementation for testing dealer manager
//  */
// class MockGame implements IDealerGameInterface {
//     public maxPlayers = 6;
//     private dealerSeat?: number;
//     private players: Player[] = [];

//     constructor(players: Player[] = []) {
//         this.players = players;
//     }

//     findActivePlayers(): Player[] {
//         return this.players.filter(p => p.status === PlayerStatus.ACTIVE);
//     }

//     getPlayerAtSeat(seat: number): Player | undefined {
//         return this.players.find(p => this.getPlayerSeatNumber(p.address) === seat);
//     }

//     getPlayerSeatNumber(playerId: string): number {
//         const index = this.players.findIndex(p => p.address === playerId);
//         return index >= 0 ? index + 1 : -1;
//     }

//     getDealerPosition(): number | undefined {
//         return this.dealerSeat;
//     }

//     setDealerPosition(seat: number): void {
//         this.dealerSeat = seat;
//     }

//     // Helper methods for testing
//     addPlayer(address: string, status: PlayerStatus = PlayerStatus.ACTIVE): void {
//         const player = new Player(address, undefined, 1000n, undefined, status);
//         this.players.push(player);
//     }

//     removePlayer(address: string): void {
//         this.players = this.players.filter(p => p.address !== address);
//     }

//     setPlayers(players: Player[]): void {
//         this.players = players;
//     }
// }

// ==================== UNIT TESTS FOR DEALER MANAGER ====================

describe.skip("DealerPositionManager", () => {
    let mockGame: TexasHoldemGame;
    let dealerManager: IDealerPositionManager;

    beforeEach(() => {
        mockGame = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        mockGame.joinAtSeat(new Player("alice", undefined, 1000n, undefined, PlayerStatus.ACTIVE), 1);
        mockGame.joinAtSeat(new Player("bob", undefined, 1000n, undefined, PlayerStatus.ACTIVE), 2);
        mockGame.joinAtSeat(new Player("charlie", undefined, 1000n, undefined, PlayerStatus.ACTIVE), 3);

        dealerManager = new DealerPositionManager(mockGame);
    });

    // describe("Dealer Rotation", () => {
    //     test("should rotate dealer to next active player", () => {
    //         mockGame.setDealerPosition(1);

    //         const newDealer = dealerManager.rotateDealer();

    //         expect(newDealer).toBe(2); // Next active player
    //         expect(mockGame.getDealerPosition()).toBe(2);
    //     });

    //     test("should wrap around to first player when reaching end", () => {
    //         mockGame.setDealerPosition(3); // Last player

    //         const newDealer = dealerManager.rotateDealer();

    //         expect(newDealer).toBe(1); // Should wrap to first player
    //     });

    //     test("should skip inactive players when rotating", () => {
    //         mockGame.setPlayers([
    //             new Player("alice", undefined, 1000n, undefined, PlayerStatus.ACTIVE),
    //             new Player("bob", undefined, 1000n, undefined, PlayerStatus.SITTING_OUT),
    //             new Player("charlie", undefined, 1000n, undefined, PlayerStatus.ACTIVE)
    //         ]);
    //         mockGame.setDealerPosition(1);

    //         const newDealer = dealerManager.rotateDealer();

    //         expect(newDealer).toBe(3); // Should skip bob and go to charlie
    //     });
    // });

    // describe("Heads-Up Play", () => {
    //     beforeEach(() => {
    //         mockGame.setPlayers([
    //             new Player("alice", undefined, 1000n, undefined, PlayerStatus.ACTIVE),
    //             new Player("bob", undefined, 1000n, undefined, PlayerStatus.ACTIVE)
    //         ]);
    //     });

    //     test("should alternate dealer in heads-up", () => {
    //         mockGame.setDealerPosition(1);

    //         const newDealer = dealerManager.handleHeadsUpDealer();

    //         expect(newDealer).toBe(2); // Should alternate to other player
    //     });

    //     test("should have dealer as small blind in heads-up", () => {
    //         mockGame.setDealerPosition(1);

    //         const sbPosition = dealerManager.getSmallBlindPosition();

    //         expect(sbPosition).toBe(1); // Dealer is SB in heads-up
    //     });

    //     test("should have non-dealer as big blind in heads-up", () => {
    //         mockGame.setDealerPosition(1);

    //         const bbPosition = dealerManager.getBigBlindPosition();

    //         expect(bbPosition).toBe(2); // Non-dealer is BB in heads-up
    //     });
    // });

    // describe("Player Events", () => {
    //     test("should handle player join", () => {
    //         mockGame.setPlayers([]); // Empty game

    //         dealerManager.handlePlayerJoin(1);

    //         expect(mockGame.getDealerPosition()).toBe(1); // First player becomes dealer
    //     });

    //     test("should handle dealer leaving", () => {
    //         mockGame.setDealerPosition(2);

    //         dealerManager.handlePlayerLeave(2);

    //         expect(mockGame.getDealerPosition()).not.toBe(2); // Dealer should have rotated
    //     });

    //     test("should not change dealer when non-dealer leaves", () => {
    //         mockGame.setDealerPosition(1);

    //         dealerManager.handlePlayerLeave(3);

    //         expect(mockGame.getDealerPosition()).toBe(1); // Dealer unchanged
    //     });
    // });

    // describe("Position Validation", () => {
    //     test("should validate correct dealer position", () => {
    //         mockGame.setDealerPosition(1);

    //         const isValid = dealerManager.validateDealerPosition();

    //         expect(isValid).toBe(true);
    //     });

    //     test("should invalidate position if dealer not active", () => {
    //         mockGame.setPlayers([
    //             new Player("alice", undefined, 1000n, undefined, PlayerStatus.SITTING_OUT),
    //             new Player("bob", undefined, 1000n, undefined, PlayerStatus.ACTIVE)
    //         ]);
    //         mockGame.setDealerPosition(1); // Alice is sitting out

    //         const isValid = dealerManager.validateDealerPosition();

    //         expect(isValid).toBe(false);
    //     });
    // });
});

// ==================== INTEGRATION TESTS WITH GAME ====================

describe.skip("TexasHoldemGame with DealerManager", () => {
    let game: TexasHoldemGame;
    let mockDealerManager: jest.Mocked<IDealerPositionManager>;

    beforeEach(() => {
        // Create a mock dealer manager
        mockDealerManager = {
            getDealerPosition: jest.fn().mockReturnValue(1),
            handlePlayerLeave: jest.fn(),
            handlePlayerJoin: jest.fn(),
            handleNewHand: jest.fn().mockReturnValue(2),
            getSmallBlindPosition: jest.fn().mockReturnValue(2),
            getBigBlindPosition: jest.fn().mockReturnValue(3),
            validateDealerPosition: jest.fn().mockReturnValue(true)
        };

        // Create game with injected mock dealer manager
        const gameOptions = {
            minBuyIn: 100n,
            maxBuyIn: 10000n,
            maxPlayers: 6,
            minPlayers: 2,
            smallBlind: 5n,
            bigBlind: 10n,
            timeout: 30000
        };

        game = new TexasHoldemGame(
            "game-address",
            gameOptions,
            9,
            1, // lastActedSeat
            [], // previousActions
            1, // handNumber
            0, // actionCount
            TexasHoldemRound.ANTE,
            [], // communityCards
            [0n], // pots
            new Map(), // playerStates
            "", // deck
            [], // winners
            Date.now(),
            mockDealerManager // Inject mock
        );
    });

    test("should use dealer manager for position getters", () => {
        const dealerPos = game.dealerPosition;
        const sbPos = game.smallBlindPosition;
        const bbPos = game.bigBlindPosition;

        expect(mockDealerManager.getDealerPosition).toHaveBeenCalled();
        expect(mockDealerManager.getSmallBlindPosition).toHaveBeenCalled();
        expect(mockDealerManager.getBigBlindPosition).toHaveBeenCalled();
    });

    test("should use dealer manager when reinitializing", () => {
        game.reInit("new-deck");

        expect(mockDealerManager.handleNewHand).toHaveBeenCalled();
    });

    test("should handle player join through dealer manager", () => {
        const player = new Player("alice", undefined, 1000n, undefined, PlayerStatus.SITTING_OUT);

        game.joinAtSeat(player, 1);

        expect(mockDealerManager.handlePlayerJoin).toHaveBeenCalledWith(1);
    });
});
