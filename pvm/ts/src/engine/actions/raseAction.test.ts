import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/game";
import TexasHoldemGame from "../texasHoldem";
import { ethers } from "ethers";
import RaiseAction from "./raiseAction";

describe("Raise Action", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: RaiseAction;
    let player: Player;

    const baseGameConfig = {
        address: ethers.ZeroAddress,
        minBuyIn: 1000000000000000000000n, // 1000 tokens
        maxBuyIn: 3000000000000000000000n, // 3000 tokens
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000000n, // 10 tokens
        bigBlind: 20000000000000000000n,   // 20 tokens
        dealer: 9,
        nextToAct: 0,
        currentRound: "preflop",
        communityCards: [],
        pot: 0n,
        players: []
    };

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", // address
            undefined, // lastAction
            1000000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);

        game = new TexasHoldemGame(
            ethers.ZeroAddress,
            1000000000000000000000n,
            3000000000000000000000n,
            2, // minPlayers
            9, // maxPlayers
            10000000000000000000n, // smallBlind
            20000000000000000000n, // bigBlind
            9, // dealer
            1, // nextToAct
            TexasHoldemRound.PREFLOP,
            [], // communityCards
            0n, // pot
            playerStates
        );

        updateMock = {
            addAction: jest.fn(action => {

            })
        };

        action = new RaiseAction(game, updateMock);
        player = new Player(
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
            undefined, // lastAction
            1000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return RAISE action type", () => {
            const type = action.type;
            expect(action.type).toBe(PlayerActionType.SMALL_BLIND);
        });
    });

    describe.only("verify", () => {
        beforeEach(() => {
            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should return correct range for a raise", () => {
            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: 0n,
                maxAmount: game.smallBlind
            });
        });
    });

    describe("getDeductAmount", () => {
        it("should return x amount", () => {
            // const amount = action.getDeductAmount();
            // expect(amount).toBe(game.smallBlind);
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should deduct min from player chips", () => {
            const initialChips = player.chips;
            action.execute(player, game.smallBlind);
            expect(player.chips).toBe(initialChips);
        });

        it("should throw error if amount doesn't match raise", () => {
            // expect(() => action.execute(player, game.smallBlind + 1n)).toThrow("Amount is greater than maximum allowed.");
        });
    });
});
