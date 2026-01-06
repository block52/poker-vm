import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import ShowAction from "./showAction";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";

describe("ShowAction", () => {
    let action: ShowAction;
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

        // Setup game for showdown round (showing happens in showdown round)
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

        action = new ShowAction(game, updateMock);

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
        it("should return SHOW type", () => {
            expect(action.type).toBe(PlayerActionType.SHOW);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock basic validation requirements
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock multiple live players (normal showdown scenario)
            const livePlayers = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);
        });

        it("should return correct range when show is valid", () => {
            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if not in showdown round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.verify(player)).toThrow("show can only be performed during showdown round.");
        });

        it("should throw error if player is not active or all-in", () => {
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            expect(() => action.verify(player)).toThrow("Only active player can show.");
        });

        it("should allow all-in players to show at showdown", () => {
            // At showdown, all-in players should be able to show their cards
            const allInPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 0n, undefined, PlayerStatus.ALL_IN);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ALL_IN);

            // SHOW action should work for ALL_IN players at showdown
            const result = action.verify(allInPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should handle single live player scenario - correct player", () => {
            // Mock single live player that matches current player
            const singleLivePlayer = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(singleLivePlayer);

            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should handle single live player scenario - different player", () => {
            // Mock single live player that does NOT match current player
            const differentPlayer = new Player("0xdifferent", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);
            const singleLivePlayer = [differentPlayer];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(singleLivePlayer);

            // Should still return valid range (early return in verify)
            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should handle case-insensitive address comparison", () => {
            // Test case insensitive address matching
            const upperCasePlayer = new Player("0X980B8D8A16F5891F41871D878A479D81DA52334C", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);
            const singleLivePlayer = [upperCasePlayer];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(singleLivePlayer);

            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should work with multiple live players", () => {
            // Normal multi-player showdown scenario
            const livePlayers = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player("0x333333333333333333333333333333333333333", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);

            expect(() => action.verify(player)).not.toThrow();
            expect(action.verify(player)).toEqual({ minAmount: 0n, maxAmount: 0n });
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock all verification requirements
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            const livePlayers = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);

            // Mock addAction method
            jest.spyOn(game, "addAction").mockImplementation();
        });

        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");

            action.execute(player, 1);

            expect(verifySpy).toHaveBeenCalledWith(player);
        });

        it("should set player status to SHOWING", () => {
            const initialStatus = player.status;
            expect(initialStatus).toBe(PlayerStatus.ACTIVE);

            action.execute(player, 1);

            expect(player.status).toBe(PlayerStatus.SHOWING);
        });

        it("should add show action to game", () => {
            action.execute(player, 1);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.SHOW,
                index: 1
            });
        });

        it("should handle different index values", () => {
            action.execute(player, 5);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.SHOW,
                index: 5
            });
        });

        it("should throw error if verification fails", () => {
            // Make verification fail by setting wrong round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.execute(player, 1)).toThrow("show can only be performed during showdown round.");
        });

        it("should work with single live player", () => {
            const singleLivePlayer = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(singleLivePlayer);

            action.execute(player, 2);

            expect(player.status).toBe(PlayerStatus.SHOWING);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.SHOW,
                index: 2
            });
        });

        it("should preserve player chips during show", () => {
            const initialChips = player.chips;

            action.execute(player, 3);

            expect(player.chips).toBe(initialChips);
        });
    });

    describe("turn order enforcement", () => {
        it("should allow SHOW out of turn during showdown (any player can show)", () => {
            const otherPlayer = new Player(
                "0x123456789abcdef123456789abcdef123456789a",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            // Set up the game so 'player' is next to act, not 'otherPlayer'
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            const livePlayers = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                otherPlayer
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);

            // SHOW is allowed out of turn - any active player can show during showdown
            const result = action.verify(otherPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should allow SHOW only for active player during showdown", () => {
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            const livePlayers = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);

            // Player whose turn it is should be able to show
            const result = action.verify(player);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should allow ALL_IN player to SHOW when it is their turn", () => {
            const allInPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n,
                undefined,
                PlayerStatus.ALL_IN
            );

            // ALL_IN player is next to act
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(allInPlayer);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ALL_IN);

            const livePlayers = [
                allInPlayer,
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);

            // ALL_IN player should be able to show when it's their turn
            const result = action.verify(allInPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should allow ALL_IN player to SHOW out of turn during showdown", () => {
            const allInPlayer = new Player(
                "0x123456789abcdef123456789abcdef123456789a",
                undefined,
                0n,
                undefined,
                PlayerStatus.ALL_IN
            );

            // Different player is next to act
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ALL_IN);

            const livePlayers = [
                player,
                allInPlayer
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);

            // ALL_IN player CAN show out of turn during showdown
            const result = action.verify(allInPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical showdown show scenario", () => {
            // Setup: Showdown round, multiple live players
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            const livePlayers = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);
            jest.spyOn(game, "addAction").mockImplementation();

            const initialStatus = player.status;

            // Execute show action
            const result = action.verify(player);
            action.execute(player, 4);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(player.status).toBe(PlayerStatus.SHOWING);
            expect(player.status).not.toBe(initialStatus);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.SHOW,
                index: 4
            });
        });

        it("should handle heads-up show scenario", () => {
            // Test showing in heads-up (2 player) game
            const headsUpPlayers = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE),
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];

            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            jest.spyOn(game, "findLivePlayers").mockReturnValue(headsUpPlayers);
            jest.spyOn(game, "addAction").mockImplementation();

            const result = action.verify(player);
            action.execute(player, 6);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(player.status).toBe(PlayerStatus.SHOWING);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.SHOW,
                index: 6
            });
        });

        it("should handle show with winner-takes-all scenario", () => {
            // Test single live player scenario (everyone else folded)
            const singlePlayer = [
                new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];

            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            jest.spyOn(game, "findLivePlayers").mockReturnValue(singlePlayer);
            jest.spyOn(game, "addAction").mockImplementation();

            const result = action.verify(player);
            action.execute(player, 7);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(player.status).toBe(PlayerStatus.SHOWING);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.SHOW,
                index: 7
            });
        });

        it("should handle show with all-in player", () => {
            // Test showing with ALL_IN status - all-in players can show at showdown
            const allInPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n, // All-in players typically have 0 chips
                undefined,
                PlayerStatus.ALL_IN // ALL_IN players can show at showdown
            );

            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(allInPlayer);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ALL_IN);

            const livePlayers = [
                allInPlayer,
                new Player("0x123456789abcdef123456789abcdef123456789a", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE)
            ];
            jest.spyOn(game, "findLivePlayers").mockReturnValue(livePlayers);
            jest.spyOn(game, "addAction").mockImplementation();

            const result = action.verify(allInPlayer);
            action.execute(allInPlayer, 8);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(allInPlayer.status).toBe(PlayerStatus.SHOWING);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: allInPlayer.address,
                action: PlayerActionType.SHOW,
                index: 8
            });
        });
    });
});