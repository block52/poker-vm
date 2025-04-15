import { ActionDTO, GameOptions, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import SmallBlindAction from "./smallBlindAction";
import TexasHoldemGame from "../texasHoldem";
import { ethers } from "ethers";
import { gameOptions } from "../testConstants";

describe("SmallBlindAction", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: SmallBlindAction;
    let player: Player;

    const previousActions: ActionDTO[] = [];

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            100000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(1, initialPlayer);

        game = new TexasHoldemGame(
            ethers.ZeroAddress,
            gameOptions,
            0, // dealer
            1, // nextToAct
            previousActions, // previousActions
            TexasHoldemRound.PREFLOP, // Changed from ANTE to PREFLOP to match new implementation
            [], // communityCards
            0n, // pot
            playerStates
        );

        updateMock = {
            addAction: jest.fn(action => {
                console.log("Action recorded:", action);
                console.log("Pot will be updated with this amount");
            })
        };

        action = new SmallBlindAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            100000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return SMALL_BLIND action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.SMALL_BLIND);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as any);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock player seat number
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);
        });

        it("should return correct range for small blind", () => {
            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: game.smallBlind,
                maxAmount: game.smallBlind
            });
        });

        it("should throw error if not in PREFLOP round", () => {
            // Override the current round mock to be FLOP instead of PREFLOP
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);

            expect(() => action.verify(player)).toThrow("Can only post small blind during ante or preflop rounds.");
        });
    });

    describe("getDeductAmount", () => {
        it("should return small blind amount", () => {
            const amount = action.getDeductAmount();
            expect(amount).toBe(game.smallBlind);
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as any);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            
            // Make sure player has enough chips for testing
            player.chips = 1000000000000000000n; // Set to 1 ETH to ensure enough for small blind
            
            // Mock the game's small blind to a known value for testing
            jest.spyOn(game, "smallBlind", "get").mockReturnValue(100000000000000000n);
        });

        it("should deduct small blind amount from player chips", () => {
            const initialChips = player.chips;
            const smallBlindAmount = game.smallBlind; // Get the mocked small blind amount
            
            action.execute(player, 0, smallBlindAmount);
            expect(player.chips).toBe(initialChips - smallBlindAmount);
        });

        it("should add small blind action to update", () => {
            // Mock game.addAction to track calls
            const originalAddAction = game.addAction;
            game.addAction = jest.fn();
            
            try {
                action.execute(player, 0, game.smallBlind);
                
                // Check that game.addAction was called with the right parameters
                expect(game.addAction).toHaveBeenCalledWith(
                    {
                        playerId: player.address,
                        action: PlayerActionType.SMALL_BLIND,
                        amount: game.smallBlind,
                        index: 0
                    },
                    game.currentRound
                );
            } finally {
                // Restore original method
                game.addAction = originalAddAction;
            }
        });

        it("should throw error if amount doesn't match small blind", () => {
            const incorrectAmount = game.smallBlind + 1n;
            expect(() => action.execute(player, 0, incorrectAmount)).toThrow("Amount is greater than maximum allowed.");
        });
    });
});