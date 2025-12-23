import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import SmallBlindAction from "./smallBlindAction";
import TexasHoldemGame from "../texasHoldem";
import { getDefaultGame, DETERMINISTIC_TIMESTAMP } from "../testConstants";
import { IUpdate } from "../types";

describe("SmallBlindAction", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: SmallBlindAction;
    let player: Player;

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            100000000000000000n, // chips (0.1 tokens)
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(1, initialPlayer);

        game = getDefaultGame(playerStates);
        game.setActionTimestamp(DETERMINISTIC_TIMESTAMP);

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
            100000000000000000n, // chips (0.1 tokens)
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
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as Player);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock player seat number
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);
        });

        it("should throw if only one player", () => {
            expect(() => action.verify(player)).toThrow("Cannot post small blind with less than 2 players.");
        });

        it("should return correct range for small blind with full stack", () => {
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2);
            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: game.smallBlind,
                maxAmount: game.smallBlind
            });
        });

        it("should return player chips as range when short-stacked", () => {
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2);

            // Create a short-stacked player with less than small blind
            const shortStackedPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                50000000000000000n, // 0.05 tokens - less than small blind (0.1 tokens)
                undefined,
                PlayerStatus.ACTIVE
            );

            const range = action.verify(shortStackedPlayer);
            expect(range).toEqual({
                minAmount: 50000000000000000n,
                maxAmount: 50000000000000000n
            });
        });

        it("should throw error if not in ANTE round", () => {
            // Override the current round mock to be FLOP instead of ANTE
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);

            expect(() => action.verify(player)).toThrow("post-small-blind can only be performed during ante round.");
        });
    });

    describe("getEffectiveAmount", () => {
        it("should return small blind amount when player has enough chips", () => {
            const amount = action.getEffectiveAmount(player);
            expect(amount).toBe(game.smallBlind);
        });

        it("should return player chips when short-stacked", () => {
            const shortStackedPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                50000000000000000n, // Less than small blind
                undefined,
                PlayerStatus.ACTIVE
            );
            const amount = action.getEffectiveAmount(shortStackedPlayer);
            expect(amount).toBe(50000000000000000n);
        });

        it("should return zero when player has no chips", () => {
            const zeroChipPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n,
                undefined,
                PlayerStatus.ACTIVE
            );
            const amount = action.getEffectiveAmount(zeroChipPlayer);
            expect(amount).toBe(0n);
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as Player);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock player seat number
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);

            // Mock active player count (need at least 2 players)
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2);
        });

        it("should deduct small blind amount from player chips", () => {
            const initialChips = player.chips;
            action.execute(player, 0);
            expect(player.chips).toBe(initialChips - game.smallBlind);
        });

        it("should deduct only available chips when short-stacked", () => {
            const shortStackedPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                50000000000000000n, // Less than small blind
                undefined,
                PlayerStatus.ACTIVE
            );
            action.execute(shortStackedPlayer, 0);
            expect(shortStackedPlayer.chips).toBe(0n);
        });

        it("should set player status to ALL_IN when going all-in on small blind", () => {
            const shortStackedPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                50000000000000000n, // Less than small blind
                undefined,
                PlayerStatus.ACTIVE
            );
            action.execute(shortStackedPlayer, 0);
            expect(shortStackedPlayer.status).toBe(PlayerStatus.ALL_IN);
        });

        it("should not set ALL_IN status when player has chips remaining", () => {
            // Player has 0.1 tokens, small blind is 0.1 tokens
            // Give player more chips so they have some remaining after posting
            const richPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                1000000000000000000n, // 1 token - more than small blind
                undefined,
                PlayerStatus.ACTIVE
            );
            action.execute(richPlayer, 0);
            expect(richPlayer.status).toBe(PlayerStatus.ACTIVE);
        });
    });
});
