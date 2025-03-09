import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import SmallBlindAction from "./smallBlindAction";
import TexasHoldemGame, { GameOptions } from "../texasHoldem";
import { ethers } from "ethers";

describe("SmallBlindAction", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: SmallBlindAction;
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
        // Setup initial game stat
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);

        game = new TexasHoldemGame(
            ethers.ZeroAddress,
            gameOptions,
            0, // dealer
            1, // nextToAct
            TexasHoldemRound.ANTE,
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
            1000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        console.log("Player stack size:", player.chips.toString());
        console.log("Small blind amount:", game.smallBlind.toString());
    });

    describe("type", () => {
        it("should return SMALL_BLIND action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.SMALL_BLIND);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should return correct range for small blind", () => {
            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: game.smallBlind,
                maxAmount: game.smallBlind
            });
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
            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should deduct small blind amount from player chips", () => {
            const initialChips = player.chips;
            action.execute(player, game.smallBlind);
            expect(player.chips).toBe(initialChips - game.smallBlind);
        });

        it("should add small blind action to update", () => {
            action.execute(player, game.smallBlind);
            expect(updateMock.addAction).toHaveBeenCalledWith({
                playerId: player.id,
                action: PlayerActionType.SMALL_BLIND,
                amount: game.smallBlind
            });
        });

        it("should throw error if amount doesn't match small blind", () => {
            expect(() => action.execute(player, game.smallBlind + 1n)).toThrow("Amount is greater than maximum allowed.");
        });
    });
});
