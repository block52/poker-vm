import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import FoldAction from "./foldAction";
import TexasHoldemGame, { GameOptions } from "../texasHoldem";
import { ethers } from "ethers";

describe("FoldAction", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: FoldAction;
    let player: Player;

    const gameOptions: GameOptions = {
        minBuyIn: 100000000000000000n,
        maxBuyIn: 1000000000000000000n,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000n,
        bigBlind: 20000000000000000n
    };

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

        action = new FoldAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return FOLD action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.FOLD);
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
        });

        it("should not return a range for fold action", () => {
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
            
            expect(() => action.verify(player)).toThrow("Only active player can fold.");
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
            
            // Mock game's addAction method
            game.addAction = jest.fn();
        });

        it("should not change player's chips", () => {
            const initialChips = player.chips;
            action.execute(player);
            expect(player.chips).toBe(initialChips);
        });

        it("should add FOLD action with 0 amount", () => {
            action.execute(player);
            
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.FOLD,
                amount: 0n
            });
        });

        it("should throw error if an amount is specified", () => {
            expect(() => action.execute(player, 10000000000000000n))
                .toThrow("Amount should not be specified for fold");
        });
    });
});