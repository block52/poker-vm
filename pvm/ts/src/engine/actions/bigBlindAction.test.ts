import { ActionDTO, GameOptions, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BigBlindAction from "./bigBlindAction";
import TexasHoldemGame from "../texasHoldem";
import { ethers } from "ethers";

describe("BigBlindAction", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: BigBlindAction;
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
            previousActions, // previousActions
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

        action = new BigBlindAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        console.log("Player stack size:", player.chips.toString());
        console.log("Big blind amount:", game.bigBlind.toString());
    });

    describe("type", () => {
        it("should return BIG_BLIND action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.BIG_BLIND);
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

            // Mock smallBlindPosition
            Object.defineProperty(game, 'smallBlindPosition', {
                get: jest.fn(() => 0)
            });

            // Mock getPlayerSeatNumber
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(0);
        });

        it("should return correct range for big blind", () => {
            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: game.bigBlind,
                maxAmount: game.bigBlind
            });
        });

        it("should throw error if not in PREFLOP round", () => {
            // Override the current round mock to be FLOP instead of PREFLOP
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);

            expect(() => action.verify(player)).toThrow("Can only bet small blind amount when preflop.");
        });

        it("should throw error if player is not in small blind position", () => {
            // Mock player in a different position than small blind
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);

            expect(() => action.verify(player)).toThrow("Only the small blind player can bet the small blind amount.");
        });
    });

    describe("getDeductAmount", () => {
        it("should return big blind amount", () => {
            const amount = action.getDeductAmount();
            expect(amount).toBe(game.bigBlind);
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

            // Mock smallBlindPosition
            Object.defineProperty(game, 'smallBlindPosition', {
                get: jest.fn(() => 0)
            });

            // Mock getPlayerSeatNumber
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(0);
        });

        it("should deduct big blind amount from player chips", () => {
            const initialChips = player.chips;
            action.execute(player, game.bigBlind);
            expect(player.chips).toBe(initialChips - game.bigBlind);
        });

        it.skip("should add big blind action to update", () => {
            action.execute(player, game.bigBlind);
            expect(updateMock.addAction).toHaveBeenCalledWith({
                playerId: player.id,
                action: PlayerActionType.BIG_BLIND,
                amount: game.bigBlind
            });
        });

        it("should throw error if amount doesn't match big blind", () => {
            expect(() => action.execute(player, game.bigBlind + 1n)).toThrow("Amount is greater than maximum allowed.");
        });
    });
});