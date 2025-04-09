import { ActionDTO, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import CallAction from "./callAction";
import { Player } from "../../models/player";
import { IUpdate } from "../types";
import TexasHoldemGame from "../texasHoldem";
import { ethers } from "ethers";
import { gameOptions } from "../testConstants";

describe("CallAction", () => {
    let callAction: CallAction;
    let game: TexasHoldemGame;
    let player: Player;
    let updateMock: IUpdate;

    const ONE_THOUSAND_TOKENS = 1000000000000000000n;

    const previousActions: ActionDTO[] = [];

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            ONE_THOUSAND_TOKENS, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);

        game = new TexasHoldemGame(
            ethers.ZeroAddress,
            gameOptions,
            9, // dealer
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

        // Create instance of CallAction with mock game
        callAction = new CallAction(game, updateMock);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("type", () => {
        it("should return CALL type", () => {
            expect(callAction.type).toBe(PlayerActionType.CALL);
        });
    });

    describe("verify", () => {
        it("should throw error if no previous action exists", () => {
            jest.spyOn(game, "getLastRoundAction").mockReturnValue(undefined);

            expect(() => callAction.verify(player)).toThrow("No previous action to call.");
        });

        // it("should throw error if previous action amount is 0", () => {
        //     mockGame.getLastRoundAction.mockReturnValue({ amount: 0n });

        //     expect(() => callAction.verify(mockPlayer)).toThrow("Should check instead.");
        // });

        // it("should throw error if player has already met maximum", () => {
        //     mockGame.getLastRoundAction.mockReturnValue({ amount: 20n });
        //     mockGame.getBets.mockReturnValue(new Map([["player1", 20n]]));

        //     expect(() => callAction.verify(mockPlayer)).toThrow("Player has already met maximum so can check instead.");
        // });

        // it("should return correct range when player needs to call", () => {
        //     mockGame.getLastRoundAction.mockReturnValue({ amount: 30n });
        //     mockGame.getBets.mockReturnValue(new Map([["player1", 10n]]));

        //     const result = callAction.verify(mockPlayer);

        //     expect(result).toEqual({ minAmount: 20n, maxAmount: 20n });
        // });

        // it("should adjust deduct amount if player has insufficient chips", () => {
        //     mockGame.getLastRoundAction.mockReturnValue({ amount: 200n });
        //     mockGame.getBets.mockReturnValue(new Map([["player1", 10n]]));
        //     mockPlayer.chips = 50n;

        //     const result = callAction.verify(mockPlayer);

        //     expect(result).toEqual({ minAmount: 50n, maxAmount: 50n });
        // });
    });

    // describe("execute", () => {
    //     it("should throw error if player has insufficient chips", () => {
    //         mockGame.getLastRoundAction.mockReturnValue({ amount: 200n });
    //         mockGame.getBets.mockReturnValue(new Map([["player1", 10n]]));
    //         mockPlayer.chips = 50n;

    //         // Mock getDeductAmount to return more than player's chips
    //         jest.spyOn(callAction as any, "getDeductAmount").mockReturnValue(150n);

    //         expect(() => callAction.execute(mockPlayer)).toThrow("Player has insufficient chips to call.");
    //     });

    //     it("should deduct correct amount from player chips", () => {
    //         mockGame.getLastRoundAction.mockReturnValue({ amount: 50n });
    //         mockGame.getBets.mockReturnValue(new Map([["player1", 20n]]));

    //         callAction.execute(mockPlayer);

    //         expect(mockPlayer.chips).toBe(70n); // 100n - 30n
    //     });

    //     it("should add regular CALL action when player has chips left", () => {
    //         mockGame.getLastRoundAction.mockReturnValue({ amount: 50n });
    //         mockGame.getBets.mockReturnValue(new Map([["player1", 20n]]));

    //         callAction.execute(mockPlayer);

    //         expect(mockGame.addAction).toHaveBeenCalledWith({
    //             playerId: "player1",
    //             action: PlayerActionType.CALL,
    //             amount: 30n
    //         });
    //     });

    //     it("should add ALL_IN action when player uses all chips", () => {
    //         mockGame.getLastRoundAction.mockReturnValue({ amount: 120n });
    //         mockGame.getBets.mockReturnValue(new Map([["player1", 20n]]));
    //         mockPlayer.chips = 100n;

    //         callAction.execute(mockPlayer);

    //         expect(mockPlayer.chips).toBe(0n);
    //         expect(mockGame.addAction).toHaveBeenCalledWith({
    //             playerId: "player1",
    //             action: PlayerActionType.ALL_IN,
    //             amount: 100n
    //         });
    //     });
    // });

    // describe("getDeductAmount", () => {
    //     it("should calculate correct deduct amount based on previous bets", () => {
    //         mockGame.getLastRoundAction.mockReturnValue({ amount: 50n });
    //         mockGame.getBets.mockReturnValue(new Map([["player1", 20n]]));

    //         const result = (callAction as any).getDeductAmount(mockPlayer);

    //         expect(result).toBe(30n); // 50n - 20n
    //     });

    //     it("should use big blind as minimum when no previous action exists", () => {
    //         mockGame.getLastRoundAction.mockReturnValue(null);
    //         mockGame.getBets.mockReturnValue(new Map([["player1", 0n]]));

    //         const result = (callAction as any).getDeductAmount(mockPlayer);

    //         expect(result).toBe(10n); // bigBlind value
    //     });
    // });

    // describe("getSumBets", () => {
    //     it("should return correct sum of bets for the player in current round", () => {
    //         mockGame.getBets.mockReturnValue(new Map([["player1", 25n]]));

    //         const result = (callAction as any).getSumBets("player1");

    //         expect(result).toBe(25n);
    //     });

    //     it("should return 0 if player has no bets in current round", () => {
    //         mockGame.getBets.mockReturnValue(new Map([["player2", 25n]]));

    //         const result = (callAction as any).getSumBets("player1");

    //         expect(result).toBe(0n);
    //     });
    // });
});
