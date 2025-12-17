import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import DealAction from "./dealAction";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";

describe("DealAction", () => {
    let action: DealAction;
    let game: TexasHoldemGame;
    let player: Player;
    let updateMock: IUpdate;

    beforeEach(() => {
        // Mock the IUpdate interface
        updateMock = {
            addAction: jest.fn()
        };

        // Create default game with multiple players
        const playerStates = new Map<number, Player | null>();
        playerStates.set(1, new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));
        playerStates.set(2, new Player(
            "0x123456789abcdef123456789abcdef123456789a",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));

        game = getDefaultGame(playerStates);

        // Setup game for ante round (dealing happens in ante round)
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

        action = new DealAction(game, updateMock);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("type", () => {
        it("should return DEAL type", () => {
            expect(action.type).toBe(NonPlayerActionType.DEAL);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock basic requirements for dealing
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2);
            jest.spyOn(game, "getPlayerCount").mockReturnValue(2);

            // Mock that no players have cards yet
            const mockPlayers = new Map();
            mockPlayers.set(1, new Player("0x1", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            mockPlayers.set(2, new Player("0x2", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            jest.spyOn(game, "players", "get").mockReturnValue(mockPlayers);

            // Mock that both blinds have been posted
            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                    action: PlayerActionType.SMALL_BLIND,
                    index: 1,
                    seat: 1,
                    timestamp: Date.now()
                },
                {
                    playerId: "0x123456789abcdef123456789abcdef123456789a",
                    action: PlayerActionType.BIG_BLIND,
                    index: 2,
                    seat: 2,
                    timestamp: Date.now()
                }
            ]);
        });

        it("should return correct range when deal is valid", () => {
            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if not enough active players", () => {
            // Mock findLivePlayers to return only 1 player (less than minPlayers)
            jest.spyOn(game, "findLivePlayers").mockReturnValue([player]);

            expect(() => action.verify(player)).toThrow("Not enough active players");
        });

        it("should throw error if cards already dealt", () => {
            // Mock that a player already has cards
            const playersWithCards = new Map();
            playersWithCards.set(1, new Player(
                "0x1",
                undefined,
                ONE_THOUSAND_TOKENS,
                [
                    { mnemonic: "AS", suit: "spades", rank: "A" },
                    { mnemonic: "KS", suit: "spades", rank: "K" }
                ] as any,
                PlayerStatus.ACTIVE
            ));
            playersWithCards.set(2, new Player("0x2", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            jest.spyOn(game, "players", "get").mockReturnValue(playersWithCards);

            expect(() => action.verify(player)).toThrow("Cards have already been dealt for this hand.");
        });

        it("should throw error if not in ante round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.verify(player)).toThrow("deal can only be performed during ante round.");
        });

        it("should throw error if not enough players", () => {
            jest.spyOn(game, "getPlayerCount").mockReturnValue(1);

            expect(() => action.verify(player)).toThrow("Not enough players to deal.");
        });

        it("should throw error if small blind not posted", () => {
            // Mock that only big blind has been posted
            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x123456789abcdef123456789abcdef123456789a",
                    action: PlayerActionType.BIG_BLIND,
                    index: 2,
                    seat: 2,
                    timestamp: Date.now()
                }
            ]);

            expect(() => action.verify(player)).toThrow("Small blind must be posted before dealing.");
        });

        it("should throw error if big blind not posted", () => {
            // Mock that only small blind has been posted
            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                    action: PlayerActionType.SMALL_BLIND,
                    index: 1,
                    seat: 1,
                    timestamp: Date.now()
                }
            ]);

            expect(() => action.verify(player)).toThrow("Big blind must be posted before dealing.");
        });

        it("should throw error if no blinds posted", () => {
            // Mock that no actions have been taken
            jest.spyOn(game, "getActionsForRound").mockReturnValue([]);

            expect(() => action.verify(player)).toThrow("Small blind must be posted before dealing.");
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock all verification requirements
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2);
            jest.spyOn(game, "getPlayerCount").mockReturnValue(2);

            const mockPlayers = new Map();
            mockPlayers.set(1, new Player("0x1", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            mockPlayers.set(2, new Player("0x2", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            jest.spyOn(game, "players", "get").mockReturnValue(mockPlayers);

            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                    action: PlayerActionType.SMALL_BLIND,
                    index: 1,
                    seat: 1,
                    timestamp: Date.now()
                },
                {
                    playerId: "0x123456789abcdef123456789abcdef123456789a",
                    action: PlayerActionType.BIG_BLIND,
                    index: 2,
                    seat: 2,
                    timestamp: Date.now()
                }
            ]);

            // Mock game methods
            jest.spyOn(game, "deal").mockImplementation();
            jest.spyOn(game, "addNonPlayerAction").mockImplementation();
        });

        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");

            action.execute(player, 1);

            expect(verifySpy).toHaveBeenCalledWith(player);
        });

        it("should call game.deal()", () => {
            action.execute(player, 1);

            expect(game.deal).toHaveBeenCalled();
        });

        it("should add deal action to game", () => {
            action.execute(player, 1);

            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.DEAL,
                index: 1
            });
        });

        it("should throw error if verification fails", () => {
            // Make verification fail by removing blinds
            jest.spyOn(game, "getActionsForRound").mockReturnValue([]);

            expect(() => action.execute(player, 1)).toThrow("Small blind must be posted before dealing.");
        });

        it("should handle different index values", () => {
            action.execute(player, 5);

            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.DEAL,
                index: 5
            });
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical deal scenario", () => {
            // Setup: Ante round, both blinds posted, no cards dealt yet
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2);
            jest.spyOn(game, "getPlayerCount").mockReturnValue(2);

            const mockPlayers = new Map();
            mockPlayers.set(1, new Player("0x1", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            mockPlayers.set(2, new Player("0x2", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            jest.spyOn(game, "players", "get").mockReturnValue(mockPlayers);

            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                    action: PlayerActionType.SMALL_BLIND,
                    index: 1,
                    seat: 1,
                    timestamp: Date.now()
                },
                {
                    playerId: "0x123456789abcdef123456789abcdef123456789a",
                    action: PlayerActionType.BIG_BLIND,
                    index: 2,
                    seat: 2,
                    timestamp: Date.now()
                }
            ]);

            jest.spyOn(game, "deal").mockImplementation();
            jest.spyOn(game, "addNonPlayerAction").mockImplementation();

            // Execute deal action
            const result = action.verify(player);
            action.execute(player, 3);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(game.deal).toHaveBeenCalled();
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.DEAL,
                index: 3
            });
        });

        it("should handle deal with minimum players", () => {
            // Test with exactly 2 players (minimum)
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2);
            jest.spyOn(game, "getPlayerCount").mockReturnValue(2);

            const mockPlayers = new Map();
            mockPlayers.set(1, new Player("0x1", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            mockPlayers.set(2, new Player("0x2", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE));
            jest.spyOn(game, "players", "get").mockReturnValue(mockPlayers);

            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                    action: PlayerActionType.SMALL_BLIND,
                    index: 1,
                    seat: 1,
                    timestamp: Date.now()
                },
                {
                    playerId: "0x123456789abcdef123456789abcdef123456789a",
                    action: PlayerActionType.BIG_BLIND,
                    index: 2,
                    seat: 2,
                    timestamp: Date.now()
                }
            ]);

            jest.spyOn(game, "deal").mockImplementation();
            jest.spyOn(game, "addNonPlayerAction").mockImplementation();

            expect(() => action.verify(player)).not.toThrow();
            action.execute(player, 4);

            expect(game.deal).toHaveBeenCalled();
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.DEAL,
                index: 4
            });
        });
    });
});