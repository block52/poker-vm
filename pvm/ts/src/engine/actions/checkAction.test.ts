import { ActionDTO, GameOptions, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import CheckAction from "./checkAction";
import TexasHoldemGame from "../texasHoldem";
import { ethers } from "ethers";

describe("CheckAction", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: CheckAction;
    let player: Player;

    const gameOptions: GameOptions = {
        minBuyIn: 100000000000000000n,
        maxBuyIn: 1000000000000000000n,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000n,
        bigBlind: 20000000000000000n
    };

    const previousActions: ActionDTO[] = [];

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);

        game = new TexasHoldemGame(
            ethers.ZeroAddress,
            gameOptions,
            0, // dealer
            1, // nextToAct
            previousActions, // previous
            TexasHoldemRound.PREFLOP,
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

        action = new CheckAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return CHECK action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.CHECK);
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

            // Mock game's current bet or pot to ensure check is valid
            // This would typically check if the player has already matched the current bet
            Object.defineProperty(game, "currentBet", {
                get: jest.fn(() => 0n)
            });

            // Mock getBets to return player's current bet
            jest.spyOn(game, "getBets").mockReturnValue(new Map([["0x980b8D8A16f5891F41871d878a479d81Da52334c", 0n]]));
        });

        it("should not return a range for check action", () => {
            const range = action.verify(player);
            expect(range).toBeUndefined();
        });

        it("should throw error if not player's turn", () => {
            // Mock a different player as next to act
            const differentPlayer = {
                address: "0xdifferent123456789abcdef123456789abcdef1234"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(differentPlayer as any);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });

        it("should throw error if player is not active", () => {
            // Mock player status as FOLDED
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            expect(() => action.verify(player)).toThrow("Only active player can check.");
        });

        it("should throw error if game is in showdown", () => {
            // Mock game in showdown state
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("Hand has ended.");
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

            // Mock verify to return undefined (no range)
            jest.spyOn(action, "verify").mockReturnValue(undefined);

            // Mock game's addAction method
            game.addAction = jest.fn();
        });

        it("should not change player's chips", () => {
            const initialChips = player.chips;
            action.execute(player);
            expect(player.chips).toBe(initialChips);
        });

        it("should add CHECK action with 0 amount", () => {
            action.execute(player);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.CHECK,
                amount: 0n
            });
        });

        it("should throw error if an amount is specified", () => {
            expect(() => action.execute(player, 10000000000000000n)).toThrow("Amount should not be specified for check");
        });
    });
});
